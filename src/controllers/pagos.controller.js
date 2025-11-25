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
      if (req.user.role === 'ciudadano') {
        // Los ciudadanos solo pueden ver sus propios pagos
        where.ciudadano_id = req.user.id;
      } else if (req.user.role === 'funcionario') {
        // Los funcionarios pueden ver todos los pagos
        // No aplicar restricción por funcionario_id
      }
      // Filtro opcional por ciudadano cuando lo solicita admin/funcionario
      const ciudadanoIdParam = req.query.ciudadanoId || req.query.ciudadano_id;
      if (ciudadanoIdParam && req.user.role !== 'ciudadano') {
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
      const count = await Pago.count({ where });
      
      // Ejecutar consulta de datos con includes
      const rows = await Pago.findAll({
        where,
        include: [
          { 
            model: Tramite,
            attributes: ['id', 'codigo', 'titulo', 'tipo'] 
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
      });
      
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
      if (req.user.role === 'ciudadano' && pago.ciudadano_id !== req.user.id) {
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
      
      // Verificar que el trámite existe y requiere pago
      const tramite = await Tramite.findByPk(tramite_id);
      if (!tramite) {
        throw new ApiError('El trámite seleccionado no existe', 400);
      }
      
      if (!tramite.requiere_pago) {
        throw new ApiError('El trámite seleccionado no requiere pago', 400);
      }
      
      // Verificar que el monto coincide con el del trámite
      logger.info(`Comparando montos - Trámite: ${tramite.monto} (${typeof tramite.monto}) vs Enviado: ${monto} (${typeof monto})`);
      if (parseFloat(tramite.monto) !== parseFloat(monto)) {
        throw new ApiError(`El monto debe ser ${tramite.monto}`, 400);
      }
      
      // Verificar que el ciudadano existe
      let ciudadanoIdFinal = ciudadano_id;
      
      // Si es ciudadano, asignar automáticamente su ID
      if (req.user.role === 'ciudadano') {
        ciudadanoIdFinal = req.user.id;
      } else if (!ciudadanoIdFinal) {
        // Si no se especificó ciudadano, usar el del trámite
        ciudadanoIdFinal = tramite.ciudadano_id;
      } else {
        // Verificar que el ciudadano existe
        const ciudadano = await Usuario.findOne({
          where: { id: ciudadanoIdFinal, role: 'ciudadano' }
        });
        if (!ciudadano) {
          throw new ApiError('El ciudadano seleccionado no existe', 400);
        }
      }
      
      // Asignar funcionario si es funcionario o admin
      let funcionarioId = null;
      if (req.user.role === 'funcionario' || req.user.role === 'superadmin') {
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
      
      // Verificar permisos
      if (req.user.role === 'ciudadano') {
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

      // Permisos: ciudadanos solo pueden procesar sus pagos
      if (req.user.role === 'ciudadano' && pago.ciudadano_id !== req.user.id) {
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
      if (req.user.role === 'funcionario' || req.user.role === 'superadmin') {
        pago.funcionario_id = req.user.id;
      }

      await pago.save();

      // Marcar trámite como pago completado si corresponde
      if (pago.tramite_id) {
        const tramite = await Tramite.findByPk(pago.tramite_id);
        if (tramite && tramite.requiere_pago) {
          tramite.pago_completado = true;
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
      if (req.user.role === 'ciudadano' && pago.ciudadano_id !== req.user.id) {
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
      if (req.user.role === 'ciudadano') {
        throw new ApiError('No tienes permiso para ver estadísticas', 403);
      }
      
      // Estadísticas por estado
      const estadoStats = await Pago.findAll({
        attributes: [
          'estado',
          [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
          [sequelize.fn('SUM', sequelize.col('monto')), 'monto_total']
        ],
        group: ['estado']
      });
      
      // Estadísticas por método de pago
      const metodoPagoStats = await Pago.findAll({
        attributes: [
          'metodo_pago',
          [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
          [sequelize.fn('SUM', sequelize.col('monto')), 'monto_total']
        ],
        group: ['metodo_pago']
      });
      
      // Pagos por mes (últimos 12 meses)
      const pagosPorMes = await Pago.findAll({
        attributes: [
          [sequelize.fn('DATE_FORMAT', sequelize.col('fecha_pago'), '%Y-%m'), 'mes'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
          [sequelize.fn('SUM', sequelize.col('monto')), 'monto_total']
        ],
        where: {
          fecha_pago: {
            [Op.gte]: sequelize.literal('DATE_SUB(NOW(), INTERVAL 12 MONTH)')
          },
          estado: 'completado'
        },
        group: [sequelize.fn('DATE_FORMAT', sequelize.col('fecha_pago'), '%Y-%m')],
        order: [[sequelize.fn('DATE_FORMAT', sequelize.col('fecha_pago'), '%Y-%m'), 'ASC']]
      });
      
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

module.exports = pagosController;
