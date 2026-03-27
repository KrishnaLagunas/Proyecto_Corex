const { Pago, Tramite, Usuario } = require('../models');
const { sequelize } = require('../config/database');
const { ApiError } = require('../middlewares/errorHandler');
const logger = require('../utils/logger');
const { Op } = require('sequelize');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Controlador para el manejo de pagos municipales
 */
const pagosController = {
  /**
   * Obtiene todos los pagos con paginación y filtros
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @param {Function} next - Función next de Express
   */
  getAllPagos: async (req, res, next) => {
    try {
      const { 
        page = 1, 
        limit = 10, 
        estado, 
        metodo_pago, 
        tramite_id,
        search,
        desde,
        hasta,
        sort = 'fecha_pago',
        order = 'DESC'
      } = req.query;

      // Construir condiciones de búsqueda
      const where = {};
      
      // Filtro por estado
      if (estado) {
        where.estado = estado;
      }
      
      // Filtro por método de pago
      if (metodo_pago) {
        where.metodo_pago = metodo_pago;
      }
      
      // Filtro por trámite
      if (tramite_id) {
        where.tramite_id = tramite_id;
      }
      
      // Filtro por rango de fechas (admite alias fechaDesde/fechaHasta desde frontend)
      const desdeQuery = desde || req.query.fechaDesde;
      const hastaQuery = hasta || req.query.fechaHasta;
      if (desdeQuery || hastaQuery) {
        where.fecha_pago = {};
        if (desdeQuery) {
          where.fecha_pago[Op.gte] = new Date(desdeQuery);
        }
        if (hastaQuery) {
          where.fecha_pago[Op.lte] = new Date(hastaQuery);
        }
      }
      
      // Búsqueda por texto en código o referencia
      if (search) {
        where[Op.or] = [
          { codigo: { [Op.like]: `%${search}%` } },
          { referencia_externa: { [Op.like]: `%${search}%` } },
          { notas: { [Op.like]: `%${search}%` } }
        ];
      }
      
      // Restricción por rol de usuario
      if (req.user.rol_nombre === 'ciudadano') {
        // Los ciudadanos solo pueden ver sus propios pagos
        where.ciudadano_id = req.user.id;
      } else if (['funcionario','secretaria de educación','secretaria de obras','secretaria de transito','secretaria de salud','secretaria de seguridad'].includes(String(req.user.rol_nombre).toLowerCase())) {
        // Funcionarios: restringir por su municipalidad (a través del trámite) y permitir pagos asignados/no asignados
        const funcionario = await Usuario.findByPk(req.user.id, { attributes: ['id', 'municipalidad_id'], include: [] });
        const muniIdFunc = funcionario?.municipalidad_id || req.user.municipalidad_id || null;
        if (muniIdFunc) {
          // Aplicar filtro de municipalidad vía include de Tramite
          // Se define más abajo en findOptions y countOptions
        }
      }
      // Administrador: restringir a su municipalidad (a través del trámite)
      const adminMuniId = (req.user.rol_nombre === 'administrador') ? req.user.municipalidad_id : null;
      // Filtro opcional por ciudadano cuando lo solicita admin/funcionario
      const ciudadanoIdParam = req.query.ciudadanoId || req.query.ciudadano_id;
      if (ciudadanoIdParam && req.user.rol_nombre !== 'ciudadano') {
        where.ciudadano_id = ciudadanoIdParam;
      }
      // Los administradores pueden ver todos los pagos (no se aplica filtro adicional)
      
      // Calcular offset para paginación
      const offset = (page - 1) * limit;
      
      // Validar campo de ordenamiento
      const validSortFields = ['fecha_pago', 'monto', 'estado', 'codigo'];
      const sortField = validSortFields.includes(sort) ? sort : 'fecha_pago';
      
      // Validar dirección de ordenamiento
      const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
      
      // Ejecutar consulta de conteo sin includes para evitar problemas de asociaciones múltiples
      const countOptions = { where };
      if (adminMuniId) {
        if (!adminMuniId) {
          throw new ApiError('El administrador no tiene municipalidad asignada', 403);
        }
        countOptions.include = [{ model: Tramite, required: true, where: { [Op.or]: [{ municipalidad_id: adminMuniId }, { municipalidad_id: null }] } }];
      }
      // Funcionarios: si tienen municipalidad, aplicar include similar
      const isFuncionario = ['funcionario','secretaria de educación','secretaria de salud','secretaria de seguridad','secretaria de obras','secretaria de transito'].includes(String(req.user.rol_nombre).toLowerCase());
      const funcMuniId = isFuncionario ? (req.user.municipalidad_id || null) : null;
      if (isFuncionario && funcMuniId && !countOptions.include) {
        // Incluir filtro por municipalidad y departamentos asignados del funcionario
        let departamentosAsignados = [];
        try {
          const DepartamentoUsuario = require('../models/DepartamentoUsuario');
          const asignaciones = await DepartamentoUsuario.findAll({ where: { usuario_id: req.user.id }, attributes: ['departamento_id'] });
          departamentosAsignados = asignaciones.map(a => a.departamento_id);
        } catch (_) { departamentosAsignados = []; }

        const tramiteWhere = { municipalidad_id: funcMuniId };
        if (departamentosAsignados.length > 0) {
          tramiteWhere.departamento_id = { [Op.in]: departamentosAsignados };
        }
        countOptions.include = [{ model: Tramite, required: true, where: tramiteWhere }];
      }
      const count = await Pago.count(countOptions);
      
      // Ejecutar consulta de datos con includes
      const findOptions = {
        where,
        include: [
          { 
            model: Tramite,
            attributes: ['id', 'codigo', 'titulo', 'tipo'],
            ...(adminMuniId ? { required: true, where: { [Op.or]: [{ municipalidad_id: adminMuniId }, { municipalidad_id: null }] } } : {})
          },
          { 
            model: Usuario, 
            as: 'ciudadano',
            attributes: ['id', 'nombre', 'apellido', 'email', 'rut'] 
          },
          { 
            model: Usuario, 
            as: 'funcionario',
            attributes: ['id', 'nombre', 'apellido', 'email'] 
          }
        ],
        order: [[sortField, sortOrder]],
        limit: parseInt(limit),
        offset: offset
      };
      if (!adminMuniId && isFuncionario && funcMuniId) {
        // Aplicar filtro de municipalidad y departamento para funcionarios
        let departamentosAsignados = [];
        try {
          const DepartamentoUsuario = require('../models/DepartamentoUsuario');
          const asignaciones = await DepartamentoUsuario.findAll({ where: { usuario_id: req.user.id }, attributes: ['departamento_id'] });
          departamentosAsignados = asignaciones.map(a => a.departamento_id);
        } catch (_) { departamentosAsignados = []; }

        const tramInclude = findOptions.include.find(i => i.model && i.model.name === 'Tramite');
        if (tramInclude) {
          tramInclude.required = true;
          tramInclude.where = { municipalidad_id: funcMuniId };
          if (departamentosAsignados.length > 0) {
            tramInclude.where.departamento_id = { [Op.in]: departamentosAsignados };
          } else {
            // Sin asignaciones: ver solo pagos de trámites propios
            where.funcionario_id = req.user.id;
          }
        }
      }
      const rows = await Pago.findAll(findOptions);
      
      // Calcular total de páginas
      const totalPages = Math.ceil(count / limit);
      
      res.json({
        pagos: rows,
        pagination: {
          total: count,
          totalPages,
          currentPage: parseInt(page),
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Obtiene un pago por su ID
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @param {Function} next - Función next de Express
   */
  getPagoById: async (req, res, next) => {
    try {
      const { id } = req.params;
      
      const pago = await Pago.findByPk(id, {
        include: [
          { 
            model: Tramite,
            attributes: [
              'id', 'codigo', 'titulo', 'tipo', 'descripcion',
              'estado', 'prioridad', 'requiere_pago', 'monto',
              'fecha_solicitud', 'fecha_actualizacion', 'fecha_finalizacion'
            ] 
          },
          { 
            model: Usuario, 
            as: 'ciudadano',
            attributes: ['id', 'nombre', 'apellido', 'email', 'rut', 'telefono', 'direccion'] 
          },
          { 
            model: Usuario, 
            as: 'funcionario',
            attributes: ['id', 'nombre', 'apellido', 'email'] 
          }
        ]
      });
      
      if (!pago) {
        throw new ApiError('Pago no encontrado', 404);
      }
      
      // Verificar permisos de acceso
      if (req.user.rol_nombre === 'ciudadano' && pago.ciudadano_id !== req.user.id) {
        throw new ApiError('No tienes permiso para ver este pago', 403);
      }
      
      res.json(pago);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Crea un nuevo pago
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @param {Function} next - Función next de Express
   */
  createPago: async (req, res, next) => {
    try {
      const { 
        monto, 
        metodo_pago, 
        referencia_externa,
        notas,
        tramite_id,
        ciudadano_id
      } = req.body;
      const esSimulacion = typeof referencia_externa === 'string' && referencia_externa.startsWith('SIM-');
      
      // Verificar que el trámite existe y requiere pago
      const tramite = await Tramite.findByPk(tramite_id);
      if (!tramite) {
        throw new ApiError('El trámite seleccionado no existe', 400);
      }
      // Si el trámite no tiene monto definido, intentar resolver desde ConfiguracionPago (modalidad fijo)
      if ((!tramite.requiere_pago || parseFloat(tramite.monto || 0) <= 0)) {
        try {
          const { ConfiguracionPago } = require('../models');
          const anioActual = new Date().getFullYear();
          const rawTipo = String(tramite.tipo || '').trim();
          const tLower = rawTipo.toLowerCase();
          let tipoNormalizado = rawTipo;
          if (tLower.includes('licencia')) tipoNormalizado = 'licencia';
          else if (tLower.includes('permiso')) tipoNormalizado = 'permiso';
          else if (tLower.includes('certificado')) tipoNormalizado = 'certificado';
          else if (tLower.includes('solicitud')) tipoNormalizado = 'solicitud';
          const candidates = Array.from(new Set([
            rawTipo,
            rawTipo.replace(/\.$/, ''),
            tipoNormalizado
          ]));
          const cfg = await ConfiguracionPago.findOne({
            where: {
              tramite_nombre: { [Op.in]: candidates },
              anio: anioActual,
              estado: 'activo'
            }
          });
          if (cfg && cfg.modalidad === 'fijo') {
            const mf = Number(cfg.monto_fijo || 0);
            if (mf > 0) {
              tramite.requiere_pago = true;
              tramite.monto = mf;
              await tramite.save();
            }
          }
          if (!tramite.requiere_pago || !(parseFloat(tramite.monto || 0) > 0)) {
            if (tLower.includes('ayuda') && (tLower.includes('técnica') || tLower.includes('tecnica'))) {
              tramite.requiere_pago = true;
              tramite.monto = 1000;
              await tramite.save();
            }
            // Fallback adicional para tipos conocidos sin configuración en BD
            const esCamarasAlarmas = tLower.includes('instalación') || tLower.includes('instalacion')
              ? (tLower.includes('cámara') || tLower.includes('camara') || tLower.includes('alarma') || tLower.includes('alarmas'))
              : false;
            const esRegularizacionViviendas = tLower.includes('regularización') || tLower.includes('regularizacion');
            const esCertificadoConstruccion = tLower.includes('certificado') && (tLower.includes('construcción') || tLower.includes('construccion') || tLower.includes('obras'));
            if (!tramite.requiere_pago || !(parseFloat(tramite.monto || 0) > 0)) {
              if (esCamarasAlarmas) {
                tramite.requiere_pago = true;
                tramite.monto = 20000;
                await tramite.save();
              } else if (esRegularizacionViviendas) {
                tramite.requiere_pago = true;
                tramite.monto = 200000;
                await tramite.save();
              } else if (esCertificadoConstruccion) {
                tramite.requiere_pago = true;
                tramite.monto = 500000;
                await tramite.save();
              }
            }
          }
        } catch (e) {
          logger.warn(`No se pudo resolver monto desde configuración: ${e.message}`);
        }
      }
      const isCiudadano = req.user.rol_nombre === 'ciudadano';
      if (!tramite.requiere_pago && (parseFloat(monto || 0) > 0) && (isCiudadano || esSimulacion)) {
        try {
          tramite.requiere_pago = true;
          tramite.monto = parseFloat(monto);
          await tramite.save();
          try { logger.info(`[Pagos][CREATE][CIUDADANO_FALLBACK] tramite_id=${tramite.id} monto_set=${tramite.monto}`); } catch (_) {}
        } catch (e) {
          try { logger.warn(`[Pagos][CREATE][CIUDADANO_FALLBACK_FAIL] ${e.message}`); } catch (_) {}
        }
      }
      if (req.user.rol_nombre === 'administrador') {
        if (!req.user.municipalidad_id || req.user.municipalidad_id !== tramite.municipalidad_id) {
          throw new ApiError('No tienes permiso para registrar pagos de otra municipalidad', 403);
        }
      }
      if (req.user.rol_nombre === 'secretaria de educación') {
        const funcionario = await Usuario.findByPk(req.user.id, { include: [{ model: require('../models').Municipalidad }], attributes: ['id', 'municipalidad_id'] });
        const muniIdFunc = funcionario?.municipalidad_id || funcionario?.Municipalidad?.id || null;
        if (!muniIdFunc || muniIdFunc !== tramite.municipalidad_id) {
          throw new ApiError('No tienes permiso para registrar pagos de otra municipalidad', 403);
        }
      }
      
      if (!tramite.requiere_pago) {
        try { logger.warn(`[Pagos][CREATE][RECHAZADO] tramite_id=${tramite.id} tipo="${String(tramite.tipo||'')}" monto=${tramite.monto} requiere_pago=${tramite.requiere_pago}`); } catch (_) {}
        throw new ApiError('El trámite seleccionado no requiere pago', 400);
      }
      
      // Verificar que el monto coincide con el del trámite
      logger.info(`Comparando montos - Trámite: ${tramite.monto} (${typeof tramite.monto}) vs Enviado: ${monto} (${typeof monto})`);
      if (parseFloat(tramite.monto) !== parseFloat(monto)) {
        const tMon = parseFloat(tramite.monto || 0);
        const mMon = parseFloat(monto || 0);
        if (isCiudadano && tMon <= 0 && mMon > 0) {
          try {
            tramite.monto = mMon;
            await tramite.save();
            try { logger.info(`[Pagos][CREATE][CIUDADANO_MONTO_SET] tramite_id=${tramite.id} monto_set=${mMon}`); } catch (_) {}
          } catch (e) {
            try { logger.warn(`[Pagos][CREATE][CIUDADANO_MONTO_SET_FAIL] ${e.message}`); } catch (_) {}
            try { logger.warn(`[Pagos][CREATE][MONTO_MISMATCH] tramite_id=${tramite.id} esperado=${tMon} recibido=${mMon}`); } catch (_) {}
            throw new ApiError(`El monto debe ser ${tramite.monto}`, 400);
          }
        } else {
          try { logger.warn(`[Pagos][CREATE][MONTO_MISMATCH] tramite_id=${tramite.id} esperado=${tMon} recibido=${mMon}`); } catch (_) {}
          throw new ApiError(`El monto debe ser ${tramite.monto}`, 400);
        }
      }
      
      // Verificar que el ciudadano existe
      let ciudadanoIdFinal = ciudadano_id;
      
      // Si es ciudadano, asignar automáticamente su ID
      if (req.user.rol_nombre === 'ciudadano') {
        ciudadanoIdFinal = req.user.id;
      } else if (!ciudadanoIdFinal) {
        // Si no se especificó ciudadano, usar el del trámite
        ciudadanoIdFinal = tramite.ciudadano_id;
      } else {
        // Verificar que el ciudadano existe
        const { Rol } = require('../models');
        const ciudadano = await Usuario.findOne({
          where: { id: ciudadanoIdFinal },
          include: [{ model: Rol, where: { nombre: 'ciudadano' } }]
        });
        if (!ciudadano) {
          throw new ApiError('El ciudadano seleccionado no existe', 400);
        }
      }
      
      // Asignar funcionario si es funcionario o admin
      let funcionarioId = null;
      if (['secretaria de educación','secretaria de salud','secretaria de seguridad','administrador','superadministrador'].includes(req.user.rol_nombre)) {
        funcionarioId = req.user.id;
      }
      
      // Generar código único para el pago
      const codigo = await Pago.generateCodigo();
      
      // Crear el pago
      const nuevoPago = await Pago.create({
        codigo,
        monto,
        fecha_pago: new Date(),
        metodo_pago,
        estado: 'pendiente', // Estado inicial
        referencia_externa,
        notas,
        tramite_id,
        ciudadano_id: ciudadanoIdFinal,
        funcionario_id: funcionarioId
      });
      
      logger.info(`Nuevo pago creado: ${nuevoPago.codigo} - Monto: ${monto}`);
      
      // Obtener el pago con sus relaciones
      const pagoCompleto = await Pago.findByPk(nuevoPago.id, {
        include: [
          { model: Tramite, attributes: ['id', 'codigo', 'titulo'] },
          { model: Usuario, as: 'ciudadano', attributes: ['id', 'nombre', 'apellido', 'email'] },
          { model: Usuario, as: 'funcionario', attributes: ['id', 'nombre', 'apellido', 'email'] }
        ]
      });
      
      res.status(201).json({
        message: 'Pago registrado exitosamente',
        pago: pagoCompleto
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Actualiza un pago existente
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @param {Function} next - Función next de Express
   */
  updatePago: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { 
        estado, 
        metodo_pago,
        referencia_externa,
        notas
      } = req.body;
      
      // Buscar el pago
      const pago = await Pago.findByPk(id);
      if (!pago) {
        throw new ApiError('Pago no encontrado', 404);
      }
      const tramitePago = await Tramite.findByPk(pago.tramite_id);
      if (req.user.rol_nombre === 'administrador') {
        if (!req.user.municipalidad_id || req.user.municipalidad_id !== tramitePago.municipalidad_id) {
          throw new ApiError('No tienes permiso para modificar pagos de otra municipalidad', 403);
        }
      }
      if (['secretaria de educación','secretaria de salud','secretaria de seguridad'].includes(req.user.rol_nombre)) {
        const funcionario = await Usuario.findByPk(req.user.id, { include: [{ model: require('../models').Municipalidad }], attributes: ['id', 'municipalidad_id'] });
        const muniIdFunc = funcionario?.municipalidad_id || funcionario?.Municipalidad?.id || null;
        if (!muniIdFunc || muniIdFunc !== tramitePago.municipalidad_id) {
          throw new ApiError('No tienes permiso para modificar pagos de otra municipalidad', 403);
        }
      }
      
      // Verificar permisos
      if (req.user.rol_nombre === 'ciudadano') {
        // Los ciudadanos no pueden modificar pagos
        throw new ApiError('No tienes permiso para modificar pagos', 403);
      }
      
      // Actualizar campos
      if (estado) {
        // Si se cambia a completado, registrar la fecha de confirmación
        if (estado === 'completado' && pago.estado !== 'completado') {
          pago.fecha_confirmacion = new Date();
          
          // Actualizar el funcionario que confirmó el pago
          pago.funcionario_id = req.user.id;
        }
        pago.estado = estado;
      }
      
      if (metodo_pago) pago.metodo_pago = metodo_pago;
      if (referencia_externa) pago.referencia_externa = referencia_externa;
      if (notas) pago.notas = notas;
      
      // Guardar los cambios
      await pago.save();
      
      logger.info(`Pago actualizado: ${pago.codigo} - Estado: ${pago.estado}`);
      
      // Obtener el pago actualizado con sus relaciones
      const pagoActualizado = await Pago.findByPk(id, {
        include: [
          { model: Tramite, attributes: ['id', 'codigo', 'titulo'] },
          { model: Usuario, as: 'ciudadano', attributes: ['id', 'nombre', 'apellido', 'email'] },
          { model: Usuario, as: 'funcionario', attributes: ['id', 'nombre', 'apellido', 'email'] }
        ]
      });
      
      res.json({
        message: 'Pago actualizado exitosamente',
        pago: pagoActualizado
      });
    } catch (error) {
      next(error);
    }
  },

  // Nuevo: Procesar/confirmar pago (POST y PUT /api/pagos/:id/procesar)
  procesarPago: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { metodoPago, referencia, observaciones, fechaPago } = req.body;

      const pago = await Pago.findByPk(id);
      if (!pago) {
        throw new ApiError('Pago no encontrado', 404);
      }
      const tramitePago2 = await Tramite.findByPk(pago.tramite_id);
      if (req.user.rol_nombre === 'administrador') {
        if (!req.user.municipalidad_id || req.user.municipalidad_id !== tramitePago2.municipalidad_id) {
          throw new ApiError('No tienes permiso para procesar pagos de otra municipalidad', 403);
        }
      }
      if (['secretaria de educación','secretaria de salud','secretaria de seguridad'].includes(req.user.rol_nombre)) {
        const funcionario = await Usuario.findByPk(req.user.id, { include: [{ model: require('../models').Municipalidad }], attributes: ['id', 'municipalidad_id'] });
        const muniIdFunc = funcionario?.municipalidad_id || funcionario?.Municipalidad?.id || null;
        if (!muniIdFunc || muniIdFunc !== tramitePago2.municipalidad_id) {
          throw new ApiError('No tienes permiso para procesar pagos de otra municipalidad', 403);
        }
      }

      // Permisos: ciudadanos solo pueden procesar sus pagos
      if (req.user.rol_nombre === 'ciudadano' && pago.ciudadano_id !== req.user.id) {
        throw new ApiError('No tienes permiso para procesar este pago', 403);
      }

      // Validaciones de estado
      if (pago.estado === 'completado') {
        throw new ApiError('El pago ya está completado', 400);
      }
      if (pago.estado === 'rechazado') {
        throw new ApiError('No se puede procesar un pago rechazado', 400);
      }

      // Normalizar método de pago para coincidir con el ENUM del modelo
      const metodoMap = { tarjeta: 'tarjeta_credito', online: 'otro' };
      const metodoNormalizado = metodoMap[metodoPago] || metodoPago;

      // Actualizar datos de pago
      pago.metodo_pago = metodoNormalizado;
      if (referencia) pago.referencia_externa = referencia;
      if (observaciones) pago.notas = observaciones;

      // Confirmación
      pago.estado = 'completado';
      pago.fecha_confirmacion = fechaPago ? new Date(fechaPago) : new Date();

      // Asignar funcionario si aplica
      if (['secretaria de educación','secretaria de salud','secretaria de seguridad','administrador','superadministrador'].includes(req.user.rol_nombre)) {
        pago.funcionario_id = req.user.id;
      }

      await pago.save();

      // Marcar trámite como pago completado si corresponde
      if (pago.tramite_id) {
        const tramite = await Tramite.findByPk(pago.tramite_id);
        if (tramite) {
          tramite.pago_completado = true;
          if (tramite.estado === 'pendiente') {
            tramite.estado = 'aprobado';
          }
          await tramite.save();
        }
      }

      // Cargar pago con relaciones
      const pagoProcesado = await Pago.findByPk(pago.id, {
        include: [
          { 
            model: Tramite, 
            attributes: ['id', 'codigo', 'titulo', 'tipo', 'estado', 'prioridad', 'requiere_pago', 'monto'] 
          },
          { model: Usuario, as: 'ciudadano', attributes: ['id', 'nombre', 'apellido', 'email', 'rut'] },
          { model: Usuario, as: 'funcionario', attributes: ['id', 'nombre', 'apellido', 'email'] }
        ]
      });

      logger.info(`Pago procesado: ${pago.codigo} - Estado: ${pago.estado}`);

      res.status(200).json({
        message: 'Pago procesado exitosamente',
        pago: pagoProcesado
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Genera un comprobante de pago en PDF
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @param {Function} next - Función next de Express
   */
  generateComprobante: async (req, res, next) => {
    try {
      const { id } = req.params;
      
      // Buscar el pago con todas sus relaciones
      const pago = await Pago.findByPk(id, {
        include: [
          { 
            model: Tramite,
            attributes: [
              'id', 'codigo', 'titulo', 'tipo', 'descripcion',
              'estado', 'prioridad', 'requiere_pago', 'monto',
              'fecha_solicitud', 'fecha_actualizacion', 'fecha_finalizacion'
            ] 
          },
          { 
            model: Usuario, 
            as: 'ciudadano',
            attributes: ['id', 'nombre', 'apellido', 'email', 'rut', 'telefono', 'direccion'] 
          },
          { 
            model: Usuario, 
            as: 'funcionario',
            attributes: ['id', 'nombre', 'apellido', 'email'] 
          }
        ]
      });
      
      if (!pago) {
        throw new ApiError('Pago no encontrado', 404);
      }
      
      // Verificar permisos de acceso
      if (req.user.rol_nombre === 'ciudadano' && pago.ciudadano_id !== req.user.id) {
        throw new ApiError('No tienes permiso para ver este comprobante', 403);
      }
      
      // Verificar que el pago esté completado
      if (pago.estado !== 'completado') {
        throw new ApiError('Solo se pueden generar comprobantes de pagos completados', 400);
      }
      
      // Crear directorio para comprobantes si no existe
      const comprobanteDir = path.join(__dirname, '../../public/comprobantes');
      if (!fs.existsSync(comprobanteDir)) {
        fs.mkdirSync(comprobanteDir, { recursive: true });
      }
      
      // Nombre del archivo
      const fileName = `comprobante_${pago.codigo}.pdf`;
      const filePath = path.join(comprobanteDir, fileName);
      
      // Crear el PDF
      const doc = new PDFDocument({ margin: 50 });
      
      // Stream para guardar el archivo
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);
      
      // Encabezado
      doc.fontSize(20).text('MUNICIPALIDAD', { align: 'center' });
      doc.fontSize(16).text('COMPROBANTE DE PAGO', { align: 'center' });
      doc.moveDown();
      
      // Información del pago
      doc.fontSize(12).text(`Código de Pago: ${pago.codigo}`, { align: 'left' });
      doc.text(`Fecha: ${new Date(pago.fecha_pago).toLocaleDateString('es-CL')}`);
      doc.text(`Estado: ${pago.estado.toUpperCase()}`);
      doc.moveDown();
      
      // Información del trámite
      doc.fontSize(14).text('Detalle del Trámite', { underline: true });
      doc.fontSize(12).text(`Código: ${pago.Tramite.codigo}`);
      doc.text(`Título: ${pago.Tramite.titulo}`);
      doc.text(`Tipo: ${pago.Tramite.tipo}`);
      doc.moveDown();
      
      // Información del ciudadano
      doc.fontSize(14).text('Datos del Contribuyente', { underline: true });
      doc.fontSize(12).text(`Nombre: ${pago.ciudadano.nombre} ${pago.ciudadano.apellido}`);
      doc.text(`RUT: ${pago.ciudadano.rut}`);
      doc.text(`Dirección: ${pago.ciudadano.direccion}`);
      doc.moveDown();
      
      // Información del pago
      doc.fontSize(14).text('Detalle del Pago', { underline: true });
      doc.fontSize(12).text(`Monto: $${pago.monto.toLocaleString('es-CL')}`);
      doc.text(`Método de Pago: ${pago.metodo_pago}`);
      if (pago.referencia_externa) {
        doc.text(`Referencia: ${pago.referencia_externa}`);
      }
      doc.moveDown();
      
      // Información de confirmación
      if (pago.funcionario) {
        doc.fontSize(14).text('Confirmado por', { underline: true });
        doc.fontSize(12).text(`Funcionario: ${pago.funcionario.nombre} ${pago.funcionario.apellido}`);
        doc.text(`Fecha de Confirmación: ${new Date(pago.fecha_confirmacion).toLocaleDateString('es-CL')}`);
      }
      
      // Pie de página
      doc.moveDown(2);
      doc.fontSize(10).text('Este documento es un comprobante oficial de pago.', { align: 'center' });
      doc.text('Para consultas, contacte a la municipalidad.', { align: 'center' });
      
      // Finalizar el PDF
      doc.end();
      
      // Esperar a que se complete la escritura del archivo
      stream.on('finish', () => {
        // Registrar la generación del comprobante
        logger.info(`Comprobante generado: ${fileName} para el pago ${pago.codigo}`);
        
        // Enviar el archivo como respuesta
        res.download(filePath, fileName, (err) => {
          if (err) {
            next(new ApiError('Error al descargar el comprobante', 500));
          }
        });
      });
      
      stream.on('error', (error) => {
        logger.error(`Error al generar comprobante: ${error.message}`);
        next(new ApiError('Error al generar el comprobante', 500));
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Obtiene estadísticas de pagos
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @param {Function} next - Función next de Express
   */
  getPagosStats: async (req, res, next) => {
    try {
      // Solo administradores y funcionarios pueden ver estadísticas
      if (req.user.rol_nombre === 'ciudadano') {
        throw new ApiError('No tienes permiso para ver estadísticas', 403);
      }
      const { fechaInicio, fechaFin, anio } = req.query;
      const muniId = req.user?.municipalidad_id || null;
      
      const filterWhere = {};
      if (fechaInicio && fechaFin) {
        filterWhere.fecha_pago = { [Op.between]: [new Date(fechaInicio), new Date(fechaFin)] };
      } else if (anio) {
        filterWhere[Op.and] = [
          sequelize.where(sequelize.fn('YEAR', sequelize.col('Pago.fecha_pago')), anio)
        ];
      }

      // Estadísticas por estado
      const estadoStatsOptions = {
        attributes: [
          'estado',
          [sequelize.fn('COUNT', sequelize.col('Pago.id')), 'total'],
          [sequelize.fn('SUM', sequelize.col('Pago.monto')), 'monto_total']
        ],
        where: { ...filterWhere },
        group: ['estado']
      };
      if (req.user.rol_nombre === 'administrador' && muniId) {
        estadoStatsOptions.include = [{ model: Tramite, required: true, attributes: [], where: { municipalidad_id: muniId } }];
      }
      const estadoStats = await Pago.findAll(estadoStatsOptions);
      
      // Estadísticas por método de pago
      const metodoPagoOptions = {
        attributes: [
          'metodo_pago',
          [sequelize.fn('COUNT', sequelize.col('Pago.id')), 'total'],
          [sequelize.fn('SUM', sequelize.col('Pago.monto')), 'monto_total']
        ],
        where: { ...filterWhere },
        group: ['metodo_pago']
      };
      if (req.user.rol_nombre === 'administrador' && muniId) {
        metodoPagoOptions.include = [{ model: Tramite, required: true, attributes: [], where: { municipalidad_id: muniId } }];
      }
      const metodoPagoStats = await Pago.findAll(metodoPagoOptions);
      
      // Pagos por mes (últimos 12 meses o según filtro)
      const mesWhere = { ...filterWhere, estado: 'completado' };
      if (!fechaInicio && !fechaFin && !anio) {
        mesWhere.fecha_pago = {
          [Op.gte]: sequelize.literal('DATE_SUB(NOW(), INTERVAL 12 MONTH)')
        };
      }

      const pagosPorMesOptions = {
        attributes: [
          [sequelize.fn('DATE_FORMAT', sequelize.col('Pago.fecha_pago'), '%Y-%m'), 'mes'],
          [sequelize.fn('COUNT', sequelize.col('Pago.id')), 'total'],
          [sequelize.fn('SUM', sequelize.col('Pago.monto')), 'monto_total']
        ],
        where: mesWhere,
        group: [sequelize.fn('DATE_FORMAT', sequelize.col('Pago.fecha_pago'), '%Y-%m')],
        order: [[sequelize.fn('DATE_FORMAT', sequelize.col('Pago.fecha_pago'), '%Y-%m'), 'ASC']]
      };
      if (req.user.rol_nombre === 'administrador' && muniId) {
        pagosPorMesOptions.include = [{ model: Tramite, required: true, attributes: [], where: { municipalidad_id: muniId } }];
      }
      const pagosPorMes = await Pago.findAll(pagosPorMesOptions);
      
      res.json({
        estadoPorPago: estadoStats,
        metodoPorPago: metodoPagoStats,
        pagosPorMes
      });
    } catch (error) {
      next(error);
    }
  }
};

// Ciudadano: eliminar pago no completado propio
pagosController.deletePagoCiudadano = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (req.user.rol_nombre !== 'ciudadano') {
      throw new (require('../middlewares/errorHandler').ApiError)('No tienes permiso para eliminar pagos', 403);
    }
    const { Pago, Tramite } = require('../models');
    const pago = await Pago.findByPk(id);
    if (!pago) {
      throw new (require('../middlewares/errorHandler').ApiError)('Pago no encontrado', 404);
    }
    if (String(pago.estado).toLowerCase() === 'completado') {
      throw new (require('../middlewares/errorHandler').ApiError)('No se puede eliminar un pago completado', 400);
    }
    let pertenece = false;
    if (pago.ciudadano_id && pago.ciudadano_id === req.user.id) pertenece = true;
    if (!pertenece && pago.tramite_id) {
      const tr = await Tramite.findByPk(pago.tramite_id);
      if (tr && tr.ciudadano_id === req.user.id) pertenece = true;
    }
    if (!pertenece) {
      throw new (require('../middlewares/errorHandler').ApiError)('No puedes eliminar pagos de otro ciudadano', 403);
    }
    await pago.destroy();
    try { (require('../utils/logger')).info(`[Ciudadano][Eliminar Pago] id=${id} ciudadano=${req.user.id}`); } catch (_) {}
    res.json({ message: 'Pago eliminado correctamente' });
  } catch (error) {
    next(error);
  }
};

module.exports = pagosController;
