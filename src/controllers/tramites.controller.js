const { Tramite, Usuario, Municipalidad, Documento, Pago, ConfiguracionPago, Rol, Departamento } = require('../models');
const { ApiError } = require('../middlewares/errorHandler');
const logger = require('../utils/logger');
const { Op, QueryTypes } = require('sequelize');
const sequelize = require('sequelize');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Controlador para el manejo de trámites municipales
 */
const tramitesController = {
  /**
   * Obtiene todos los trámites con paginación y filtros
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @param {Function} next - Función next de Express
   */
  getAllTramites: async (req, res, next) => {
    try {
      const { 
        page = 1, 
        limit = 10, 
        estado, 
        tipo, 
        municipalidad_id,
        search,
        desde,
        hasta,
        sort = 'fecha_solicitud',
        order = 'DESC'
      } = req.query;

      // Construir condiciones de búsqueda
      const where = {};
      
      // Filtro por estado
      if (estado) {
        where.estado = estado;
      }
      
      // Filtro por tipo
      if (tipo) {
        where.tipo = tipo;
      }
      
      // Filtro por departamento
      if (municipalidad_id) {
        where.municipalidad_id = municipalidad_id;
      }
      
      // Filtro por rango de fechas
      if (desde || hasta) {
        where.fecha_solicitud = {};
        if (desde) {
          where.fecha_solicitud[Op.gte] = new Date(desde);
        }
        if (hasta) {
          where.fecha_solicitud[Op.lte] = new Date(hasta);
        }
      }
      
      // Búsqueda por texto en título o descripción
      if (search) {
        where[Op.or] = [
          { titulo: { [Op.like]: `%${search}%` } },
          { descripcion: { [Op.like]: `%${search}%` } },
          { codigo: { [Op.like]: `%${search}%` } }
        ];
      }
      
      // Restricción por rol de usuario
      if (req.user.rol_nombre === 'ciudadano') {
        // Los ciudadanos solo pueden ver sus propios trámites
        where.ciudadano_id = req.user.id;
      } else if (['funcionario','secretaria de educación','secretaria de salud','secretaria de seguridad','secretaria de obras','secretaria de transito'].includes(String(req.user.rol_nombre).toLowerCase())) {
        const funcionario = await Usuario.findByPk(req.user.id, {
          include: [{ model: Municipalidad }],
          attributes: ['id', 'municipalidad_id']
        });

        const muniId = funcionario?.municipalidad_id || funcionario?.Municipalidad?.id || null;
        // Filtrar por departamentos asignados al funcionario
        let departamentosAsignados = [];
        try {
          const DepartamentoUsuario = require('../models/DepartamentoUsuario');
          const asignaciones = await DepartamentoUsuario.findAll({ where: { usuario_id: req.user.id }, attributes: ['departamento_id'] });
          departamentosAsignados = asignaciones.map(a => a.departamento_id);
        } catch (_) { departamentosAsignados = []; }

        if (muniId && departamentosAsignados.length > 0) {
          where.municipalidad_id = muniId;
          where.departamento_id = { [Op.in]: departamentosAsignados };
        } else if (muniId) {
          // Sin asignaciones: ver solo trámites propios de su municipalidad
          where.municipalidad_id = muniId;
          where.funcionario_id = req.user.id;
        } else {
          // Sin municipalidad: ver solo trámites propios
          where.funcionario_id = req.user.id;
        }
      }
      // Administrador: restringir a su municipalidad asignada
      if (req.user.rol_nombre === 'administrador') {
        if (req.user.municipalidad_id) {
          where[Op.or] = [
            { municipalidad_id: req.user.municipalidad_id },
            { municipalidad_id: null }
          ];
        } else {
          throw new ApiError('El administrador no tiene municipalidad asignada', 403);
        }
      }
      // Filtro opcional por ciudadano cuando lo solicita admin/funcionario
      const ciudadanoIdParam = req.query.ciudadanoId || req.query.ciudadano_id;
      if (ciudadanoIdParam && req.user.rol_nombre !== 'ciudadano') {
        where.ciudadano_id = ciudadanoIdParam;
      }
      // Los administradores pueden ver todos los trámites (no se aplica filtro adicional)
      
      // Calcular offset para paginación
      const offset = (page - 1) * limit;
      
      // Validar campo de ordenamiento
      const validSortFields = ['fecha_solicitud', 'titulo', 'estado', 'prioridad', 'codigo'];
      const sortField = validSortFields.includes(sort) ? sort : 'fecha_solicitud';
      
      // Validar dirección de ordenamiento
      const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
      
      // Ejecutar consulta de conteo sin includes para evitar problemas de asociaciones múltiples
      const count = await Tramite.count({ where });
      
      // Ejecutar consulta de datos con includes
      const rows = await Tramite.findAll({
        where,
        include: [
          { 
            model: Usuario, 
            as: 'ciudadano',
            attributes: ['id', 'nombre', 'apellido', 'email', 'rut'] 
          },
          { 
            model: Usuario, 
            as: 'funcionario',
            attributes: ['id', 'nombre', 'apellido', 'email'] 
          },
          { 
            model: Municipalidad,
            attributes: ['id', 'nombre'] 
          }
        ],
        order: [[sortField, sortOrder]],
        limit: parseInt(limit),
        offset: offset
      });
      
      // Calcular total de páginas
      const totalPages = Math.ceil(count / limit);
      
      res.json({
        tramites: rows,
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
   * Obtiene un trámite por su ID
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @param {Function} next - Función next de Express
   */
  getTramiteById: async (req, res, next) => {
    try {
      const { id } = req.params;
      
      const tramite = await Tramite.findByPk(id, {
        include: [
          { 
            model: Usuario, 
            as: 'ciudadano',
            attributes: ['id', 'nombre', 'apellido', 'email', 'rut', 'telefono'] 
          },
          { 
            model: Usuario, 
            as: 'funcionario',
            attributes: ['id', 'nombre', 'apellido', 'email'] 
          },
          { 
            model: Municipalidad,
            attributes: ['id', 'nombre'] 
          },
          {
            model: Departamento,
            attributes: ['id', 'nombre']
          },
          {
            model: Documento,
            attributes: ['id', 'nombre', 'descripcion', 'tipo', 'ruta_archivo', 'es_publico', 'createdAt']
          }
        ]
      });
      
      if (!tramite) {
        throw new ApiError('Trámite no encontrado', 404);
      }
      
      // Verificar permisos de acceso
      if (req.user.rol_nombre === 'ciudadano' && tramite.ciudadano_id !== req.user.id) {
        throw new ApiError('No tienes permiso para ver este trámite', 403);
      }
      
      res.json(tramite);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Crea un nuevo trámite
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @param {Function} next - Función next de Express
   */
  createTramite: async (req, res, next) => {
    try {
      let { 
        titulo, 
        descripcion, 
        tipo, 
        prioridad = 'media',
        municipalidad_id,
        departamento_id
      } = req.body;

      if (!municipalidad_id && req.user.rol_nombre === 'ciudadano') {
        try {
          const muniByName = await Municipalidad.findOne({ where: { nombre: { [Op.like]: '%Ovalle%' } } });
          if (muniByName && muniByName.id) {
            municipalidad_id = muniByName.id;
          } else {
            const anyMuni = await Municipalidad.findOne();
            if (anyMuni && anyMuni.id) municipalidad_id = anyMuni.id;
          }
        } catch (_) {}
      }
      
      // Verificar que la municipalidad existe
      const municipalidad = municipalidad_id ? await Municipalidad.findByPk(municipalidad_id) : null;
      if (!municipalidad) {
        if (req.user.rol_nombre !== 'ciudadano') {
          throw new ApiError('La municipalidad seleccionada no existe', 400);
        }
        municipalidad_id = null;
      }
      if (req.user.rol_nombre === 'administrador') {
        if (!req.user.municipalidad_id || req.user.municipalidad_id !== municipalidad_id) {
          throw new ApiError('No tienes permiso para crear trámites fuera de tu municipalidad', 403);
        }
      }
      if (req.user.rol_nombre === 'secretaria de educación') {
        const funcionario = await Usuario.findByPk(req.user.id, { include: [{ model: Municipalidad }], attributes: ['id', 'municipalidad_id'] });
        const muniIdFunc = funcionario?.municipalidad_id || funcionario?.Municipalidad?.id || null;
        if (!muniIdFunc || muniIdFunc !== municipalidad_id) {
          throw new ApiError('No tienes permiso para crear trámites fuera de tu municipalidad', 403);
        }
      }
      const { Departamento } = require('../models');
      const depObj = departamento_id ? await Departamento.findByPk(departamento_id) : null;
      if (!depObj) {
        if (req.user.rol_nombre !== 'ciudadano') {
          throw new ApiError('El departamento seleccionado no existe', 400);
        }
        departamento_id = null;
      }
      const TRAMITES_POR_DEPTO = {
        educacion: [
          { nombre: 'Solicitudes de becas municipales', tipo: 'solicitud' },
          { nombre: 'Solicitud de traslado de establecimiento', tipo: 'solicitud' },
          { nombre: 'Reclamos y revisiones de casos de convivencia escolar', tipo: 'reclamo' }
        ],
        salud: [
          { nombre: 'Solicitud de cambio de consultorio', tipo: 'solicitud' },
          { nombre: 'Solicitud de Inscripción de consultorio', tipo: 'solicitud' },
          { nombre: 'Solicitud de ayuda técnica', tipo: 'solicitud' },
          { nombre: 'Reclamos por centro de salud', tipo: 'reclamo' }
        ],
        obras: [
          { nombre: 'certificado de construcción de obras', tipo: 'certificado' },
          { nombre: 'Regularización de viviendas', tipo: 'permiso' },
          { nombre: 'Denuncias por obras ilegales', tipo: 'reclamo' }
        ],
        seguridad: [
          { nombre: 'Solicitud de rondas preventivas', tipo: 'solicitud' },
          { nombre: 'Instalación de cámaras o alarmas comunitarias', tipo: 'solicitud' },
          { nombre: 'Charlas de seguridad', tipo: 'solicitud' }
        ],
        transito: [
          { nombre: 'Rectificación de datos o errores en licencias', tipo: 'licencia' },
          { nombre: 'Permiso de circulación', tipo: 'permiso' }
        ]
      };
      const norm = s => String(s || '').toLowerCase();
      const depNombre = depObj?.nombre || depObj?.nombre_departamento || '';
      const depNorm = norm(depNombre);
      let clave;
      if (depNorm.includes('educac')) clave = 'educacion';
      else if (depNorm.includes('salud')) clave = 'salud';
      else if (depNorm.includes('obra')) clave = 'obras';
      else if (depNorm.includes('seguridad')) clave = 'seguridad';
      else if (depNorm.includes('tránsito') || depNorm.includes('transito') || depNorm.includes('transporte')) clave = 'transito';
      else clave = null;
      if (depObj && clave && TRAMITES_POR_DEPTO[clave]) {
        const lista = TRAMITES_POR_DEPTO[clave];
        const matchNombre = lista.find(t => norm(req.body.tipo) === norm(t.nombre));
        if (!matchNombre) {
          throw new ApiError('Este trámite no pertenece al departamento seleccionado', 400);
        }
        // tipo debe ser el nombre exacto del trámite
        tipo = matchNombre.nombre;
      }
      
      // Si es ciudadano, asignar automáticamente su ID
      let ciudadano_id = null;
      if (req.user.rol_nombre === 'ciudadano') {
        ciudadano_id = req.user.id;
      } else if (req.body.ciudadano_id) {
        // Si es funcionario o admin, puede especificar el ciudadano
        const ciudadano = await Usuario.findOne({
          where: { id: req.body.ciudadano_id },
          include: [{ model: Rol, where: { nombre: 'ciudadano' } }]
        });
        if (!ciudadano) {
          throw new ApiError('El ciudadano seleccionado no existe', 400);
        }
        ciudadano_id = ciudadano.id;
      } else {
        throw new ApiError('Debe especificar el ciudadano para el trámite', 400);
      }
      
      // Generar código para el trámite
      logger.info(`Generando código para trámite de tipo: ${tipo}`);
      let codigo;
      try {
        codigo = await Tramite.generateCodigo(tipo);
        logger.info(`Código generado: ${codigo}`);
      } catch (error) {
        logger.error(`Error generando código: ${error.message}`);
        throw new ApiError('Error al generar código del trámite', 500);
      }
      // Resolver pago y monto desde ConfiguracionPago
      let requiere_pago = false;
      let monto = 0;
      try {
        const anioActual = new Date().getFullYear();
        // Normalizar nombre para coincidir con configuraciones
        const rawTipo = String(tipo || '').trim();
        const tLower = rawTipo.toLowerCase();
        let tipoNormalizado = rawTipo;
        if (tLower.includes('licencia')) tipoNormalizado = 'licencia';
        else if (tLower.includes('permiso')) tipoNormalizado = 'permiso';
        else if (tLower.includes('certificado')) tipoNormalizado = 'certificado';
        else if (tLower.includes('solicitud')) tipoNormalizado = 'solicitud';
        // Construir candidatos: original, sin punto final y normalizado
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
        if (cfg) {
          if (cfg.modalidad === 'fijo') {
            const mf = Number(cfg.monto_fijo || 0);
            if (mf > 0) {
              requiere_pago = true;
              monto = mf;
            }
          } else if (cfg.modalidad === 'porcentaje') {
            // Sin base definida para porcentaje, mantener en 0 hasta que se defina el cálculo
            requiere_pago = false;
            monto = 0;
          }
        }
        if (!requiere_pago || !(monto > 0)) {
          const ndep = (depNorm || '').toLowerCase();
          const ntipo = tLower;
          if (ndep.includes('salud') && ntipo.includes('ayuda') && (ntipo.includes('técnica') || ntipo.includes('tecnica'))) {
            requiere_pago = true;
            monto = 1000;
          }
        }
      } catch (_) { /* mantener por defecto */ }
      
      // Crear el trámite
      logger.info(`Creando trámite con código: ${codigo}`);
      const nuevoTramite = await Tramite.create({
        codigo,
        titulo,
        descripcion,
        tipo,
        estado: 'pendiente',
        fecha_solicitud: new Date(),
        prioridad,
        requiere_pago,
        monto,
        ciudadano_id,
        departamento_id,
        municipalidad_id
      });
      
      logger.info(`Nuevo trámite creado: ${nuevoTramite.codigo} - ${titulo}`);
      
      res.status(201).json({
        success: true,
        message: 'Trámite creado exitosamente',
        tramite: {
          id: nuevoTramite.id,
          codigo: nuevoTramite.codigo,
          titulo: nuevoTramite.titulo,
          descripcion: nuevoTramite.descripcion,
          tipo: nuevoTramite.tipo,
          estado: nuevoTramite.estado,
          prioridad: nuevoTramite.prioridad,
          requiere_pago: nuevoTramite.requiere_pago,
          monto: nuevoTramite.monto,
          fecha_solicitud: nuevoTramite.fecha_solicitud,
        ciudadano_id: nuevoTramite.ciudadano_id,
        departamento_id: nuevoTramite.departamento_id,
        municipalidad_id: nuevoTramite.municipalidad_id
      }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Actualiza un trámite existente
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @param {Function} next - Función next de Express
   */
  updateTramite: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { 
        titulo, 
        descripcion, 
        estado, 
        prioridad,
        funcionario_id,
        municipalidad_id,
        requiere_pago,
        monto,
        observaciones
      } = req.body;
      
      // Buscar el trámite
      const tramite = await Tramite.findByPk(id);
      if (!tramite) {
        throw new ApiError('Trámite no encontrado', 404);
      }
      if (req.user.rol_nombre === 'administrador') {
        if (!req.user.municipalidad_id || req.user.municipalidad_id !== tramite.municipalidad_id) {
          throw new ApiError('No tienes permiso para modificar trámites de otra municipalidad', 403);
        }
      }
      if (['funcionario','secretaria de educación','secretaria de salud','secretaria de seguridad','secretaria de obras','secretaria de transito'].includes(req.user.rol_nombre)) {
        const funcionario = await Usuario.findByPk(req.user.id, { include: [{ model: Municipalidad }], attributes: ['id', 'municipalidad_id'] });
        const muniIdFunc = funcionario?.municipalidad_id || funcionario?.Municipalidad?.id || null;
        if (!muniIdFunc || muniIdFunc !== tramite.municipalidad_id) {
          throw new ApiError('No tienes permiso para modificar trámites de otra municipalidad', 403);
        }
      }
      
      // Verificar permisos
      if (req.user.rol_nombre === 'ciudadano') {
        // Los ciudadanos solo pueden modificar sus propios trámites y solo ciertos campos
        if (tramite.ciudadano_id !== req.user.id) {
          throw new ApiError('No tienes permiso para modificar este trámite', 403);
        }
        
        // Los ciudadanos solo pueden modificar título y descripción, y solo si está pendiente
        if (tramite.estado !== 'pendiente') {
          throw new ApiError('No puedes modificar un trámite que ya está en proceso', 403);
        }
        
        // Actualizar solo los campos permitidos
        if (titulo) tramite.titulo = titulo;
        if (descripcion) tramite.descripcion = descripcion;
      } else {
        // Funcionarios y administradores pueden actualizar más campos
        if (titulo) tramite.titulo = titulo;
        if (descripcion) tramite.descripcion = descripcion;
        if (estado) tramite.estado = estado;
        if (prioridad) tramite.prioridad = prioridad;
        if (requiere_pago !== undefined) tramite.requiere_pago = requiere_pago;
        if (monto !== undefined) tramite.monto = monto;
        if (observaciones) tramite.observaciones = observaciones;
        
        // Actualizar funcionario asignado
        if (funcionario_id) {
          const funcionario = await Usuario.findOne({
            where: { id: funcionario_id },
            include: [{ model: Rol, where: { nombre: 'secretaria de educación' } }]
          });
          if (!funcionario) {
            throw new ApiError('El funcionario seleccionado no existe', 400);
          }
          const muniFunc = await Usuario.findByPk(funcionario_id, { include: [{ model: Municipalidad }], attributes: ['id', 'municipalidad_id'] });
          const muniIdAsignado = muniFunc?.municipalidad_id || muniFunc?.Municipalidad?.id || null;
          if (!muniIdAsignado || muniIdAsignado !== tramite.municipalidad_id) {
            throw new ApiError('El funcionario pertenece a otra municipalidad', 400);
          }
          tramite.funcionario_id = funcionario_id;
        }
        
        // Actualizar municipalidad
        if (municipalidad_id) {
          const municipalidad = await Municipalidad.findByPk(municipalidad_id);
          if (!municipalidad) {
            throw new ApiError('La municipalidad seleccionada no existe', 400);
          }
          if (req.user.rol_nombre === 'administrador' && municipalidad_id !== req.user.municipalidad_id) {
            throw new ApiError('No puedes cambiar el trámite a otra municipalidad', 403);
          }
          if (['secretaria de educación','secretaria de salud','secretaria de seguridad'].includes(req.user.rol_nombre)) {
            throw new ApiError('No tienes permiso para cambiar la municipalidad del trámite', 403);
          }
          tramite.municipalidad_id = municipalidad_id;
        }
        
        // Si se cambia el estado a 'finalizado', registrar la fecha
        if (estado === 'finalizado' && tramite.estado !== 'finalizado') {
          tramite.fecha_finalizacion = new Date();
        }
      }
      
      // Guardar los cambios
      await tramite.save();
      
      logger.info(`Trámite actualizado: ${tramite.codigo}`);
      
      // Obtener el trámite actualizado con sus relaciones
      const tramiteActualizado = await Tramite.findByPk(id, {
        include: [
          { model: Usuario, as: 'ciudadano', attributes: ['id', 'nombre', 'apellido', 'email'] },
          { model: Usuario, as: 'funcionario', attributes: ['id', 'nombre', 'apellido', 'email'] },
          { model: Municipalidad, attributes: ['id', 'nombre'] }
        ]
      });
      
      res.json({
        message: 'Trámite actualizado exitosamente',
        tramite: tramiteActualizado
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Elimina un trámite (solo administradores)
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @param {Function} next - Función next de Express
   */
  deleteTramite: async (req, res, next) => {
    try {
      const { id } = req.params;
      
      // Solo los administradores pueden eliminar trámites
      if (!['administrador','superadministrador'].includes(req.user.rol_nombre)) {
        throw new ApiError('No tienes permiso para eliminar trámites', 403);
      }
      
      const tramite = await Tramite.findByPk(id);
      if (!tramite) {
        throw new ApiError('Trámite no encontrado', 404);
      }
      if (req.user.rol_nombre === 'administrador') {
        if (!req.user.municipalidad_id || req.user.municipalidad_id !== tramite.municipalidad_id) {
          throw new ApiError('No tienes permiso para eliminar trámites de otra municipalidad', 403);
        }
      }
      
      // Guardar información para el log
      const codigoTramite = tramite.codigo;
      
      // Eliminar el trámite
      await tramite.destroy();
      
      logger.info(`Trámite eliminado: ${codigoTramite}`);
      
      res.json({
        message: 'Trámite eliminado exitosamente'
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Elimina un trámite propio del ciudadano si está pendiente y sin pagos
   * @param {Object} req
   * @param {Object} res
   * @param {Function} next
   */
  deleteTramiteCiudadano: async (req, res, next) => {
    try {
      const { id } = req.params;
      if (req.user.rol_nombre !== 'ciudadano') {
        throw new ApiError('No tienes permiso para eliminar este trámite', 403);
      }
      const tramite = await Tramite.findByPk(id);
      if (!tramite) {
        throw new ApiError('Trámite no encontrado', 404);
      }
      if (tramite.ciudadano_id !== req.user.id) {
        throw new ApiError('No puedes eliminar trámites de otro ciudadano', 403);
      }
      if (tramite.estado !== 'pendiente') {
        throw new ApiError('Solo se pueden eliminar trámites en estado pendiente', 400);
      }
      const pagosCompletados = await Pago.count({ where: { tramite_id: id, estado: 'completado' } });
      if (pagosCompletados > 0) {
        throw new ApiError('No se puede eliminar el trámite porque tiene pago(s) completado(s)', 400);
      }
      await Pago.destroy({ where: { tramite_id: id, estado: { [Op.ne]: 'completado' } } });
      await Documento.destroy({ where: { tramite_id: id } });
      const codigoTramite = tramite.codigo;
      await tramite.destroy();
      try { logger.info(`[Ciudadano][Eliminar Trámite] código=${codigoTramite} id=${id} ciudadano=${req.user.id}`); } catch (_) {}
      res.json({ message: 'Trámite eliminado exitosamente' });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Obtiene estadísticas de trámites
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @param {Function} next - Función next de Express
   */
  getTramitesStats: async (req, res, next) => {
    try {
      // Solo administradores y funcionarios pueden ver estadísticas
      if (req.user.rol_nombre === 'ciudadano') {
        throw new ApiError('No tienes permiso para ver estadísticas', 403);
      }
      const rol = String(req.user.rol_nombre || '').toLowerCase();
      const muniId = req.user?.municipalidad_id || null;
      const isAdmin = rol === 'administrador';
      const isFuncionario = ['funcionario','secretaria de educación','secretaria de salud','secretaria de seguridad','secretaria de obras','secretaria de transito'].includes(rol);
      const filterWhere = (isAdmin || isFuncionario)
        ? (muniId
            ? (isAdmin
                ? { [Op.or]: [{ municipalidad_id: muniId }, { municipalidad_id: null }] }
                : { municipalidad_id: muniId })
            : { municipalidad_id: -1 })
        : {};
      
      // Estadísticas por estado
      const estadoStats = await Tramite.findAll({
        attributes: [
          'estado',
          [sequelize.fn('COUNT', sequelize.col('Tramite.id')), 'total']
        ],
        where: filterWhere,
        group: ['estado']
      });
      
      // Estadísticas por tipo
      const tipoStats = await Tramite.findAll({
        attributes: [
          'tipo',
          [sequelize.fn('COUNT', sequelize.col('Tramite.id')), 'total']
        ],
        where: filterWhere,
        group: ['tipo']
      });
      
      // Estadísticas por municipalidad
      const municipalidadStats = await Tramite.findAll({
        attributes: [
          [sequelize.col('Tramite.municipalidad_id'), 'municipalidad_id'],
          [sequelize.col('Municipalidad.nombre'), 'municipalidad_nombre'],
          [sequelize.fn('COUNT', sequelize.col('Tramite.id')), 'total']
        ],
        include: [{
          model: Municipalidad,
          attributes: []
        }],
        where: { ...(filterWhere || {}), municipalidad_id: { [Op.ne]: null } },
        group: ['Tramite.municipalidad_id', 'Municipalidad.nombre']
      });
      const departamentoStats = await Tramite.findAll({
        attributes: [
          [sequelize.col('Departamento.nombre_departamento'), 'departamento_nombre'],
          [sequelize.fn('COUNT', sequelize.col('Tramite.id')), 'total']
        ],
        include: [{ model: Departamento, attributes: [] }],
        where: { ...(filterWhere || {}), departamento_id: { [Op.ne]: null } },
        group: ['Departamento.nombre_departamento']
      });
      
      // Trámites creados por mes (últimos 12 meses)
      const tramitesPorMes = await Tramite.findAll({
        attributes: [
          [sequelize.fn('DATE_FORMAT', sequelize.col('fecha_solicitud'), '%Y-%m'), 'mes'],
          [sequelize.fn('COUNT', sequelize.col('Tramite.id')), 'total']
        ],
        where: {
          ...(filterWhere || {}),
          fecha_solicitud: {
            [Op.gte]: sequelize.literal('DATE_SUB(NOW(), INTERVAL 12 MONTH)')
          }
        },
        group: [sequelize.fn('DATE_FORMAT', sequelize.col('fecha_solicitud'), '%Y-%m')],
        order: [[sequelize.fn('DATE_FORMAT', sequelize.col('fecha_solicitud'), '%Y-%m'), 'ASC']]
      });
      
      res.json({
        estadoPorTramite: estadoStats,
        tipoPorTramite: tipoStats,
        municipalidadPorTramite: municipalidadStats,
        tramitesPorDepartamento: departamentoStats,
        tramitesPorMes
      });
    } catch (error) {
      next(error);
    }
  }
};

/**
 * Obtiene todos los tipos de trámites
 * @param {Object} req - Objeto de solicitud
 * @param {Object} res - Objeto de respuesta
 * @param {Function} next - Función next
 */
tramitesController.getTiposTramites = async (req, res, next) => {
  try {
    // Simulamos una lista de tipos de trámites
    const tiposTramites = [
      { id: 1, nombre: 'Licencia de Construcción', descripcion: 'Permiso para realizar obras de construcción', costo: 500, tiempoEstimado: '15 días', estado: 'activo' },
      { id: 2, nombre: 'Permiso Comercial', descripcion: 'Autorización para operar un negocio', costo: 300, tiempoEstimado: '10 días', estado: 'activo' },
      { id: 3, nombre: 'Certificado de Residencia', descripcion: 'Documento que certifica la residencia en el municipio', costo: 100, tiempoEstimado: '3 días', estado: 'activo' },
      { id: 4, nombre: 'Registro de Propiedad', descripcion: 'Inscripción de bienes inmuebles', costo: 800, tiempoEstimado: '20 días', estado: 'activo' },
      { id: 5, nombre: 'Solicitud de Información Pública', descripcion: 'Acceso a información pública municipal', costo: 0, tiempoEstimado: '5 días', estado: 'activo' }
    ];
    
    return res.status(200).json(tiposTramites);
  } catch (error) {
    next(error);
  }
};

/**
 * Crea un nuevo tipo de trámite
 * @param {Object} req - Objeto de solicitud
 * @param {Object} res - Objeto de respuesta
 * @param {Function} next - Función next
 */
tramitesController.createTipoTramite = async (req, res, next) => {
  try {
    // En una implementación real, aquí se guardaría en la base de datos
    // Por ahora, simplemente devolvemos el objeto con un ID simulado
    const nuevoTipoTramite = {
      id: Date.now(), // Simulamos un ID único
      ...req.body,
      estado: 'activo'
    };
    
    return res.status(201).json(nuevoTipoTramite);
  } catch (error) {
    next(error);
  }
};

/**
 * Documentos por trámite
 */
tramitesController.getDocumentosByTramiteId = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tramite = await Tramite.findByPk(id, { attributes: ['id', 'ciudadano_id'] });
    if (!tramite) throw new ApiError('Trámite no encontrado', 404);
    if (req.user.rol_nombre === 'ciudadano' && tramite.ciudadano_id !== req.user.id) {
      throw new ApiError('No tienes permiso para ver documentos de este trámite', 403);
    }
    const documentos = await Documento.findAll({
      where: { tramite_id: id },
      attributes: ['id', 'nombre', 'descripcion', 'tipo', 'ruta_archivo', 'mime_type', 'tamaño', 'es_publico', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });

    const docsMapped = documentos.map(d => {
      const doc = d.toJSON();
      if (doc.ruta_archivo && doc.ruta_archivo.startsWith('blob/')) {
        doc.ruta_archivo = `/api/tramites/${id}/documentos/${doc.id}/descargar`;
      }
      return doc;
    });

    res.json(docsMapped);
  } catch (error) {
    next(error);
  }
};

/**
 * Subir documento para un trámite
 */
tramitesController.subirDocumentoTramite = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tramite = await Tramite.findByPk(id, { attributes: ['id', 'ciudadano_id'] });
    if (!tramite) throw new ApiError('Trámite no encontrado', 404);
    // Solo el propio ciudadano, funcionario o admin pueden subir
    if (req.user.rol_nombre === 'ciudadano' && tramite.ciudadano_id !== req.user.id) {
      throw new ApiError('No tienes permiso para subir documentos a este trámite', 403);
    }

    const file = (req.files && (req.files.archivo?.[0] || req.files.documento?.[0])) || req.file;
    if (!file) throw new ApiError('No se recibió archivo', 400);

    const tipoEntrada = (req.body.tipo || '').toLowerCase();
    const tiposValidos = ['solicitud', 'certificado', 'comprobante', 'informe', 'anexo', 'otro'];
    const tipo = tiposValidos.includes(tipoEntrada) ? tipoEntrada : 'otro';

    const nombre = req.body.nombre || file.originalname;
    const descripcion = req.body.descripcion || '';
    // En memoryStorage no hay filename, usamos originalname como referencia
    const rutaRelativa = `blob/${file.originalname}`;

    const doc = await Documento.create({
      nombre,
      descripcion,
      tipo,
      ruta_archivo: rutaRelativa,
      archivo_data: file.buffer, // Guardar BLOB
      mime_type: file.mimetype,
      tamaño: file.size,
      es_publico: false,
      tramite_id: id,
      usuario_id: req.user.id
    });

    logger.info(`Documento subido para trámite ${id}: ${nombre} (BLOB)`);
    // Devolvemos la URL para descargar desde la API en lugar de estática
    const downloadUrl = `/api/tramites/${id}/documentos/${doc.id}/descargar`;
    res.status(201).json({ id: doc.id, nombre: doc.nombre, tipo: doc.tipo, ruta_archivo: downloadUrl });
  } catch (error) {
    next(error);
  }
};

/**
 * Descargar documento (BLOB)
 */
tramitesController.descargarDocumento = async (req, res, next) => {
  try {
    const { id, docId } = req.params;
    
    const doc = await Documento.findOne({ where: { id: docId, tramite_id: id } });
    if (!doc) throw new ApiError('Documento no encontrado', 404);

    // Verificar permisos
    const tramite = await Tramite.findByPk(id);
    if (req.user.rol_nombre === 'ciudadano' && tramite.ciudadano_id !== req.user.id) {
       throw new ApiError('No tienes permiso para ver este documento', 403);
    }
    // TODO: Validar permisos de funcionario si aplica

    if (!doc.archivo_data) {
       throw new ApiError('El contenido del documento no está disponible', 404);
    }

    res.setHeader('Content-Type', doc.mime_type || 'application/octet-stream');
    // Usar inline para visualizar en navegador, attachment para forzar descarga
    res.setHeader('Content-Disposition', `inline; filename="${doc.nombre}"`);
    res.send(doc.archivo_data);

  } catch (error) {
    next(error);
  }
};

/**
 * Pagos por trámite
 */
tramitesController.getPagosByTramiteId = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tramite = await Tramite.findByPk(id, { attributes: ['id', 'ciudadano_id'] });
    if (!tramite) throw new ApiError('Trámite no encontrado', 404);
    if (req.user.rol_nombre === 'ciudadano' && tramite.ciudadano_id !== req.user.id) {
      throw new ApiError('No tienes permiso para ver pagos de este trámite', 403);
    }

    const pagos = await Pago.findAll({
      where: { tramite_id: id },
      attributes: ['id', 'codigo', 'monto', 'fecha_pago', 'metodo_pago', 'estado', 'notas'],
      order: [['fecha_pago', 'DESC']]
    });
    res.json(pagos);
  } catch (error) {
    next(error);
  }
};

/**
 * Historial por trámite (sintetizado)
 */
tramitesController.getHistorialByTramiteId = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tramite = await Tramite.findByPk(id, {
      attributes: ['id', 'fecha_solicitud', 'fecha_actualizacion', 'ciudadano_id', 'funcionario_id'],
      include: [
        { model: Usuario, as: 'ciudadano', attributes: ['id', 'nombre', 'apellido'] },
        { model: Usuario, as: 'funcionario', attributes: ['id', 'nombre', 'apellido'] }
      ]
    });
    if (!tramite) throw new ApiError('Trámite no encontrado', 404);
    if (req.user.rol_nombre === 'ciudadano' && tramite.ciudadano_id !== req.user.id) {
      throw new ApiError('No tienes permiso para ver el historial de este trámite', 403);
    }

    const eventos = [];
    eventos.push({
      fecha: tramite.fecha_solicitud,
      accion: 'Trámite creado',
      descripcion: 'Solicitud registrada',
      usuario: tramite.ciudadano ? { nombre: tramite.ciudadano.nombre, apellido: tramite.ciudadano.apellido } : null
    });

    // Documentos
    const documentos = await Documento.findAll({ where: { tramite_id: id }, attributes: ['id', 'nombre', 'createdAt', 'usuario_id'] });
    for (const d of documentos) {
      eventos.push({
        fecha: d.createdAt,
        accion: 'Documento subido',
        descripcion: d.nombre,
        usuario: null
      });
    }

    // Pagos
    const pagos = await Pago.findAll({ where: { tramite_id: id }, attributes: ['id', 'codigo', 'monto', 'fecha_pago'] });
    for (const p of pagos) {
      eventos.push({
        fecha: p.fecha_pago,
        accion: 'Pago registrado',
        descripcion: `Pago ${p.codigo} por ${p.monto}`,
        usuario: null
      });
    }

    // Ordenar por fecha asc
    eventos.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    res.json(eventos);
  } catch (error) {
    next(error);
  }
};

/**
 * Actualizar solo el estado del trámite
 */
tramitesController.updateTramiteEstado = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { estado, observaciones } = req.body || {};

    // Solo funcionarios y administradores pueden cambiar estado
    if (!['secretaria de educación', 'secretaria de salud', 'secretaria de seguridad', 'administrador', 'superadministrador'].includes(req.user.rol_nombre)) {
      throw new ApiError('No tienes permiso para actualizar el estado del trámite', 403);
    }

    const estadosValidos = ['pendiente', 'en_proceso', 'en_revision', 'aprobado', 'rechazado', 'finalizado'];
    if (!estado || !estadosValidos.includes(estado)) {
      throw new ApiError('Estado inválido', 400);
    }

    const tramite = await Tramite.findByPk(id);
    if (!tramite) throw new ApiError('Trámite no encontrado', 404);

    tramite.estado = estado;
    if (observaciones !== undefined) {
      tramite.observaciones = observaciones;
    }
    await tramite.save();

    // Responder con el trámite actualizado (como espera el frontend/tests)
    res.json({ id: tramite.id, estado: tramite.estado, observaciones: tramite.observaciones });
  } catch (error) {
    next(error);
  }
};

module.exports = tramitesController;

tramitesController.getConfiguracionPago = async (req, res, next) => {
  try {
    const {
      tramite_nombre,
      anio,
      modalidad,
      categoria,
      estado = 'activo',
      limit = 50,
      sort = 'anio',
      order = 'DESC'
    } = req.query || {};

    const where = {};
    if (tramite_nombre) {
      where.tramite_nombre = { [Op.like]: `%${tramite_nombre}%` };
    }
    if (anio) where.anio = anio;
    if (modalidad) where.modalidad = modalidad;
    if (categoria) where.categoria = categoria;
    if (estado) where.estado = estado;

    const validSortFields = ['anio', 'categoria', 'modalidad'];
    const sortField = validSortFields.includes(sort) ? sort : 'anio';
    const sortOrder = (order || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const configuraciones = await ConfiguracionPago.findAll({
      where,
      order: [[sortField, sortOrder]],
      limit: parseInt(limit)
    });

    res.json({ configuraciones });
  } catch (error) {
    next(error);
  }
};

tramitesController.generateConstancia = async (req, res, next) => {
  try {
    const { id } = req.params;

    const tramite = await Tramite.findByPk(id, {
      include: [
        { model: Usuario, as: 'ciudadano', attributes: ['id','nombre','apellido','rut','direccion','email'] },
        // Incluir dirección de la municipalidad para imprimir en la constancia
        { model: Municipalidad, attributes: ['id','nombre','rut','email','telefono','direccion','region','comuna'] }
      ]
    });

    if (!tramite) {
      throw new ApiError('Trámite no encontrado', 404);
    }

    // Permisos: el ciudadano sólo su propio trámite; funcionarios y admin permitidos
    if (req.user.rol_nombre === 'ciudadano' && tramite.ciudadano_id !== req.user.id) {
      throw new ApiError('No tienes permiso para descargar la constancia de este trámite', 403);
    }

    const requierePago = !!tramite.requiere_pago;
    const monto = tramite.monto || 0;
    const pagoCompletado = !!tramite.pago_completado;

    // Validación: aplicar a gratuitos o pagados completados
    if (requierePago && !pagoCompletado) {
      throw new ApiError('Este trámite aún no tiene el pago completado', 400);
    }

    // Directorio de salida
    const comprobanteDir = path.join(__dirname, '../../public/comprobantes');
    if (!fs.existsSync(comprobanteDir)) {
      fs.mkdirSync(comprobanteDir, { recursive: true });
    }

    const fileName = `constancia_${tramite.codigo}.pdf`;
    const filePath = path.join(comprobanteDir, fileName);

    // Crear PDF
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Encabezado
    doc.fontSize(20).text('MUNICIPALIDAD', { align: 'center' });
    doc.fontSize(16).text('CONSTANCIA / BOLETA DE TRÁMITE', { align: 'center' });
    doc.moveDown();

    // Información general
    doc.fontSize(12).text(`Código de Trámite: ${tramite.codigo}`);
    doc.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-CL')}`);
    doc.text(`Estado: ${(tramite.estado || '').toUpperCase()}`);
    doc.moveDown();

    // Detalle del trámite
    doc.fontSize(14).text('Detalle del Trámite', { underline: true });
    doc.moveDown();
    doc.fontSize(12).text(`Título: ${tramite.titulo}`);
    doc.text(`Tipo: ${tramite.tipo}`);
    doc.text(`Municipalidad: ${tramite.Municipalidad ? tramite.Municipalidad.nombre : 'N/A'}`);
    const deptRegion = (tramite.Municipalidad && tramite.Municipalidad.region) ? tramite.Municipalidad.region : null;
    const deptComuna = (tramite.Municipalidad && tramite.Municipalidad.comuna) ? tramite.Municipalidad.comuna : null;
    // Formateadores cortos para mostrar de forma formal (ej.: "Región de Coquimbo - Ovalle")
    const formatRegion = (r) => {
      if (!r) return null;
      return /región/i.test(r) ? r : `Región de ${r.charAt(0).toUpperCase() + r.slice(1)}`;
    };
    const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

    let deptAddress = null;
    if (tramite.Municipalidad && tramite.Municipalidad.direccion) {
      deptAddress = tramite.Municipalidad.direccion;
    } else if (deptRegion && deptComuna) {
      deptAddress = `${formatRegion(deptRegion)} - ${capitalize(deptComuna)}`;
    } else if (deptRegion) {
      deptAddress = formatRegion(deptRegion);
    } else if (deptComuna) {
      deptAddress = capitalize(deptComuna);
    } else {
      deptAddress = 'N/A';
    }
    doc.text(`Dirección municipalidad: ${deptAddress}`);
    doc.moveDown();

    // Datos del ciudadano
    doc.fontSize(14).text('Datos del Ciudadano', { underline: true });
    doc.moveDown();
    const ciudadano = tramite.ciudadano;

    // Intentar obtener 'region' y 'comuna' adicionales desde la tabla 'usuarios' si existen
    let ciudadanoRegion = null;
    let ciudadanoComuna = null;
    try {
      const qi = Usuario.sequelize.getQueryInterface();
      const userCols = await qi.describeTable('usuarios');
      const colsToSelect = [];
      if (userCols && userCols.region) colsToSelect.push('region');
      if (userCols && userCols.comuna) colsToSelect.push('comuna');
      if (colsToSelect.length && ciudadano && ciudadano.id) {
        const selectQuery = `SELECT ${colsToSelect.join(', ')} FROM usuarios WHERE id = :id LIMIT 1`;
        const rows = await Usuario.sequelize.query(selectQuery, { replacements: { id: ciudadano.id }, type: QueryTypes.SELECT });
        const extra = Array.isArray(rows) ? rows[0] : rows;
        if (extra) {
          ciudadanoRegion = extra.region || null;
          ciudadanoComuna = extra.comuna || null;
        }
      }
    } catch (err) {
      logger.debug('No se pudo obtener region/comuna del usuario:', err.message || err);
    }

    const ciudadanoRegionVal = ciudadanoRegion || (ciudadano && ciudadano.region ? ciudadano.region : null);
    const ciudadanoComunaVal = ciudadanoComuna || (ciudadano && ciudadano.comuna ? ciudadano.comuna : null);

    let ciudadanoAddress = null;
    if (ciudadano && ciudadano.direccion) {
      ciudadanoAddress = ciudadano.direccion;
    } else if (ciudadanoRegionVal && ciudadanoComunaVal) {
      ciudadanoAddress = `${formatRegion(ciudadanoRegionVal)} - ${capitalize(ciudadanoComunaVal)}`;
    } else if (ciudadanoRegionVal) {
      ciudadanoAddress = formatRegion(ciudadanoRegionVal);
    } else if (ciudadanoComunaVal) {
      ciudadanoAddress = capitalize(ciudadanoComunaVal);
    } else {
      ciudadanoAddress = 'N/A';
    }

    doc.fontSize(12).text(`Nombre: ${ciudadano ? `${ciudadano.nombre} ${ciudadano.apellido}` : 'N/A'}`);
    doc.text(`RUT: ${ciudadano && ciudadano.rut ? ciudadano.rut : 'N/A'}`);
    doc.text(`Dirección: ${ciudadanoAddress}`);
    doc.text(`Email: ${ciudadano && ciudadano.email ? ciudadano.email : 'N/A'}`);
    doc.moveDown();

    // Pago / Monto
    doc.fontSize(14).text('Información de Pago', { underline: true });
    doc.moveDown();
    doc.fontSize(12).text(`Requiere pago: ${requierePago ? 'Sí' : 'No'}`);
    doc.text(`Monto: ${monto > 0 ? `$${monto.toLocaleString('es-CL')}` : 'Gratis'}`);
    doc.text(`Pago completado: ${pagoCompletado ? 'Sí' : 'No'}`);
    doc.moveDown();

    // Autorización
    doc.fontSize(12).text(`Emitido y autorizado por: Municipalidad ${tramite.Municipalidad ? tramite.Municipalidad.nombre : ''}`);
    doc.moveDown(2);
    doc.fontSize(10).text('Este documento es una constancia oficial del trámite realizado por el ciudadano.', { align: 'left' });

    doc.end();

    stream.on('finish', () => {
      logger.info(`Constancia generada: ${fileName} para el trámite ${tramite.codigo}`);
      // Asegurar content-type para clientes que no infieren correctamente
      res.setHeader('Content-Type', 'application/pdf');
      res.download(filePath, fileName, (err) => {
        if (err) {
          logger.error('Error al descargar constancia:', err);
          next(new ApiError('Error al descargar la constancia', 500));
        }
      });
    });
    stream.on('error', (err) => {
      logger.error('Error generando constancia PDF:', err);
      next(new ApiError('Error al generar el PDF de constancia', 500));
    });
  } catch (error) {
    next(error);
  }
};

// Genera constancia/boleta a partir de datos enviados por el cliente (trámite local)
tramitesController.generateConstanciaLocal = async (req, res, next) => {
  try {
    const {
      codigo,
      titulo,
      tipo,
      estado = 'pendiente',
      fecha_solicitud,
      fecha_actualizacion,
      departamento_nombre,
      municipalidad_nombre,
      ciudadano_nombre,
      ciudadano_rut,
      ciudadano_direccion,
      ciudadano_email,
      requiere_pago = false,
      monto = 0,
      pago_completado = false
    } = req.body || {};

    if (requiere_pago && !pago_completado) {
      throw new ApiError('Este trámite aún no tiene el pago completado', 400);
    }

    res.setHeader('Content-Type', 'application/pdf');
    const filename = `constancia_${codigo || 'tramite'}.pdf`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    // Encabezado
    doc.fontSize(20).text(municipalidad_nombre || 'MUNICIPALIDAD', { align: 'center' });
    doc.fontSize(16).text('CONSTANCIA / BOLETA DE TRÁMITE', { align: 'center' });
    doc.moveDown();

    // Información general
    doc.fontSize(12).text(`Código de Trámite: ${codigo || '—'}`);
    doc.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-CL')}`);
    doc.text(`Estado: ${(estado || '').toUpperCase()}`);
    if (fecha_solicitud) doc.text(`Solicitud: ${new Date(fecha_solicitud).toLocaleDateString('es-CL')}`);
    if (fecha_actualizacion) doc.text(`Actualización: ${new Date(fecha_actualizacion).toLocaleDateString('es-CL')}`);
    doc.moveDown();

    // Detalle del trámite
    doc.fontSize(14).text('Detalle del Trámite', { underline: true });
    doc.moveDown();
    doc.fontSize(12).text(`Título: ${titulo || '—'}`);
    doc.text(`Tipo: ${tipo || '—'}`);
    doc.text(`Departamento: ${departamento_nombre || '—'}`);
    doc.text(`Municipalidad: ${municipalidad_nombre || '—'}`);
    doc.moveDown();

    // Datos del ciudadano
    doc.fontSize(14).text('Datos del Ciudadano', { underline: true });
    doc.moveDown();
    doc.fontSize(12).text(`Nombre: ${ciudadano_nombre || '—'}`);
    doc.text(`RUT: ${ciudadano_rut || '—'}`);
    doc.text(`Dirección: ${ciudadano_direccion || '—'}`);
    doc.text(`Email: ${ciudadano_email || '—'}`);
    doc.moveDown();

    // Pago / Monto
    doc.fontSize(14).text('Información de Pago', { underline: true });
    doc.moveDown();
    doc.fontSize(12).text(`Requiere pago: ${requiere_pago ? 'Sí' : 'No'}`);
    doc.text(`Monto: ${Number(monto) > 0 ? `$${Number(monto).toLocaleString('es-CL')}` : 'Gratis'}`);
    doc.text(`Pago completado: ${pago_completado ? 'Sí' : 'No'}`);
    doc.moveDown();

    // Pie
    doc.fontSize(10).text('Emitido y autorizado por la municipalidad correspondiente. Este documento es una constancia oficial del trámite realizado por el ciudadano.', { align: 'left' });

    doc.end();
  } catch (error) {
    next(error);
  }
};

tramitesController.getTiposDiagnostico = async (req, res, next) => {
  try {
    const registros = await Tramite.findAll({
      attributes: [
        'tipo',
        [sequelize.fn('COUNT', sequelize.col('Tramite.id')), 'total']
      ],
      group: ['tipo'],
      order: [['tipo', 'ASC']]
    });
    const tiposRegistrados = registros.map(r => ({ nombre: r.tipo, total: parseInt(r.get('total')) || 0 }));
    const normalize = (s) => String(s || '').toLowerCase().trim().replace(/\.$/, '');
    const expectedList = [
      'solicitudes de becas municipales',
      'solicitud de traslado de establecimiento',
      'reclamos y revisiones de casos de convivencia escolar',
      'solicitud de cambio de consultorio',
      'solicitud de inscripción de consultorio',
      'solicitud de ayuda técnica',
      'reclamos por centro de salud',
      'certificado de construcción de obras',
      'regularización de viviendas',
      'denuncias por obras ilegales',
      'solicitud de rondas preventivas',
      'instalación de cámaras o alarmas comunitarias',
      'charlas de seguridad',
      'rectificación de datos o errores en licencias',
      'permiso de circulación',
      'rectificación de datos o errores en licencias.',
      'permiso de circulación.'
    ];
    const expectedSet = new Set(expectedList.map(normalize));
    const registradosSet = new Set(tiposRegistrados.map(t => normalize(t.nombre)));
    const faltantes = Array.from(expectedSet).filter(n => !registradosSet.has(n));
    const desconocidos = tiposRegistrados.filter(t => !expectedSet.has(normalize(t.nombre)));
    const ok = faltantes.length === 0 && desconocidos.length === 0;
    res.json({ ok, registrados: tiposRegistrados, faltantes, desconocidos });
  } catch (error) {
    next(error);
  }
};
