const { Presupuesto, Municipalidad, Usuario, Proyecto, Rol } = require('../models');
const { ApiError } = require('../middlewares/errorHandler');
const logger = require('../utils/logger');
const { Op } = require('sequelize');
const sequelize = require('sequelize');

/**
 * Controlador para el manejo de presupuestos municipales
 */
const presupuestosController = {
  /**
   * Obtiene todos los presupuestos con paginación y filtros
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @param {Function} next - Función next de Express
   */
  getAllPresupuestos: async (req, res, next) => {
    try {
      const { 
        page = 1, 
        limit = 10, 
        estado, 
        anio_fiscal,
        municipalidad_id,
        search,
        sort = 'createdAt',
        order = 'DESC'
      } = req.query;

      // Construir condiciones de búsqueda
      const where = {};
      
      // Filtro por estado
      if (estado) {
        where.estado = estado;
      }
      
      // Filtro por año fiscal
      if (anio_fiscal) {
        where.año_fiscal = anio_fiscal;
      }
      
      // Filtro por municipalidad
      if (municipalidad_id) {
        where.municipalidad_id = municipalidad_id;
      }
      
      // Búsqueda por texto en nombre, descripción o código
      if (search) {
        where[Op.or] = [
          { nombre: { [Op.like]: `%${search}%` } },
          { descripcion: { [Op.like]: `%${search}%` } },
          { codigo: { [Op.like]: `%${search}%` } }
        ];
      }
      
      // Restricción por rol de usuario
      if (req.user.rol_nombre === 'secretaria comunitaria') {
        // Los funcionarios solo ven los presupuestos de su municipalidad o donde son responsables
        const funcionario = await Usuario.findByPk(req.user.id, {
          include: [{ model: Municipalidad }]
        });

        if (funcionario.Municipalidad) {
          where[Op.or] = [
            { responsable_id: req.user.id },
            { municipalidad_id: funcionario.Municipalidad.id }
          ];
        } else {
          where.responsable_id = req.user.id;
        }
      } else if (req.user.rol_nombre === 'ciudadano') {
        // Los ciudadanos no pueden ver presupuestos internos
        throw new ApiError('No tienes permiso para ver presupuestos', 403);
      }
      // Los administradores pueden ver todos los presupuestos (no se aplica filtro adicional)
      
      // Calcular offset para paginación
      const offset = (page - 1) * limit;
      
      // Validar campo de ordenamiento
      const validSortFields = ['createdAt', 'nombre', 'año_fiscal', 'monto_total', 'monto_ejecutado', 'estado'];
      const sortField = validSortFields.includes(sort) ? sort : 'createdAt';
      
      // Validar dirección de ordenamiento
      const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
      
      // Ejecutar consulta
      const { count, rows } = await Presupuesto.findAndCountAll({
        where,
        include: [
          { 
            model: Municipalidad,
            attributes: ['id', 'nombre'] 
          },
          { 
            model: Usuario, 
            as: 'Responsable',
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
        presupuestos: rows,
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
   * Obtiene un presupuesto por su ID
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @param {Function} next - Función next de Express
   */
  getPresupuestoById: async (req, res, next) => {
    try {
      const { id } = req.params;
      
      const presupuesto = await Presupuesto.findByPk(id, {
        include: [
          { 
            model: Municipalidad,
            attributes: ['id', 'nombre'] 
          },
          { 
            model: Usuario, 
            as: 'Responsable',
            attributes: ['id', 'nombre', 'apellido', 'email'] 
          },
          {
            model: Proyecto,
            attributes: ['id', 'codigo', 'nombre', 'presupuesto_asignado', 'presupuesto_ejecutado']
          }
        ]
      });
      
      if (!presupuesto) {
        throw new ApiError('Presupuesto no encontrado', 404);
      }
      
      // Verificar permisos de acceso
      if (req.user.rol_nombre === 'ciudadano') {
        throw new ApiError('No tienes permiso para ver presupuestos', 403);
      }
      
      if (req.user.rol_nombre === 'secretaria comunitaria') {
        // Verificar si es responsable o pertenece a la municipalidad
        const funcionario = await Usuario.findByPk(req.user.id, {
          include: [{ model: Municipalidad }]
        });

        const esMunicipalidad = funcionario.Municipalidad && 
                              funcionario.Municipalidad.id === presupuesto.municipalidad_id;
        const esResponsable = presupuesto.responsable_id === req.user.id;

        if (!esMunicipalidad && !esResponsable) {
          throw new ApiError('No tienes permiso para ver este presupuesto', 403);
        }
      }
      
      res.json(presupuesto);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Crea un nuevo presupuesto
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @param {Function} next - Función next de Express
   */
  createPresupuesto: async (req, res, next) => {
    try {
      const { 
        nombre, 
        descripcion, 
        anio_fiscal, 
        monto_total,
        fecha_inicio,
        fecha_fin,
        municipalidad_id,
        responsable_id
      } = req.body;
      
      // Verificar que la municipalidad existe (si se proporciona)
      if (municipalidad_id) {
        const municipalidad = await Municipalidad.findByPk(municipalidad_id);
        if (!municipalidad) {
          throw new ApiError('La municipalidad seleccionada no existe', 400);
        }
      }
      
      // Verificar que el responsable existe y es funcionario o admin
      const responsable = await Usuario.findOne({
        where: { id: responsable_id },
        include: [{ model: Rol, where: { nombre: { [Op.in]: ['secretaria comunitaria', 'administrador', 'superadministrador'] } } }]
      });
      
      if (!responsable) {
        throw new ApiError('El responsable seleccionado no existe o no tiene permisos suficientes', 400);
      }
      
      // Verificar que no exista otro presupuesto para la misma municipalidad y año fiscal
      const presupuestoExistente = await Presupuesto.findOne({
        where: {
          municipalidad_id,
          año_fiscal: anio_fiscal
        }
      });
      
      if (presupuestoExistente) {
        throw new ApiError(`Ya existe un presupuesto para la municipalidad y año fiscal ${anio_fiscal}`, 400);
      }
      
      // Crear el presupuesto
      const nuevoPresupuesto = await Presupuesto.create({
        nombre,
        descripcion,
        año_fiscal: anio_fiscal,
        monto_total,
        monto_ejecutado: 0, // Inicialmente no se ha ejecutado nada
        fecha_inicio,
        fecha_fin,
        estado: 'planificacion', // Estado inicial
        municipalidad_id,
        responsable_id
        // El código se genera automáticamente en el hook beforeCreate
      });
      
      logger.info(`Nuevo presupuesto creado: ${nuevoPresupuesto.codigo} - ${nombre}`);
      
      // Obtener el presupuesto con sus relaciones
      const presupuestoCompleto = await Presupuesto.findByPk(nuevoPresupuesto.id, {
        include: [
          { model: Municipalidad, attributes: ['id', 'nombre'] },
          { model: Usuario, as: 'Responsable', attributes: ['id', 'nombre', 'apellido', 'email'] }
        ]
      });
      
      res.status(201).json({
        message: 'Presupuesto creado exitosamente',
        presupuesto: presupuestoCompleto
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Actualiza un presupuesto existente
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @param {Function} next - Función next de Express
   */
  updatePresupuesto: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { 
        nombre, 
        descripcion, 
        monto_total,
        monto_ejecutado,
        fecha_inicio,
        fecha_fin,
        estado,
        responsable_id
      } = req.body;
      
      // Buscar el presupuesto
      const presupuesto = await Presupuesto.findByPk(id);
      if (!presupuesto) {
        throw new ApiError('Presupuesto no encontrado', 404);
      }
      
      // Verificar permisos
      if (req.user.rol_nombre === 'ciudadano') {
        throw new ApiError('No tienes permiso para modificar presupuestos', 403);
      }
      
      if (req.user.rol_nombre === 'secretaria comunitaria') {
        // Solo el responsable puede modificar el presupuesto
        if (presupuesto.responsable_id !== req.user.id) {
          throw new ApiError('Solo el responsable puede modificar este presupuesto', 403);
        }
        
        // Los funcionarios no pueden cambiar ciertos campos
        if (monto_total && monto_total !== presupuesto.monto_total) {
          throw new ApiError('No tienes permiso para modificar el monto total', 403);
        }
      }
      
      // Actualizar campos
      if (nombre) presupuesto.nombre = nombre;
      if (descripcion) presupuesto.descripcion = descripcion;
      
      // Solo admin puede modificar montos
      if (['administrador','superadministrador'].includes(req.user.rol_nombre)) {
        if (monto_total !== undefined) presupuesto.monto_total = monto_total;
      }
      
      // Actualizar monto ejecutado (con validaciones)
      if (monto_ejecutado !== undefined) {
        if (monto_ejecutado > presupuesto.monto_total) {
          throw new ApiError('El monto ejecutado no puede ser mayor al monto total', 400);
        }
        presupuesto.monto_ejecutado = monto_ejecutado;
      }
      
      if (fecha_inicio) presupuesto.fecha_inicio = fecha_inicio;
      if (fecha_fin) presupuesto.fecha_fin = fecha_fin;
      
      if (estado) {
        // Validar transiciones de estado
        const estadosValidos = {
          'planificacion': ['en_ejecucion', 'cancelado'],
          'en_ejecucion': ['pausado', 'finalizado'],
          'pausado': ['en_ejecucion', 'finalizado', 'cancelado'],
          'finalizado': [],
          'cancelado': []
        };
        
        if (!estadosValidos[presupuesto.estado].includes(estado)) {
          throw new ApiError(`No se puede cambiar el estado de ${presupuesto.estado} a ${estado}`, 400);
        }
        
        presupuesto.estado = estado;
      }
      
      // Actualizar responsable (solo admin)
      if (responsable_id && ['administrador','superadministrador'].includes(req.user.rol_nombre)) {
        const responsable = await Usuario.findOne({
          where: { id: responsable_id },
          include: [{ model: Rol, where: { nombre: { [Op.in]: ['secretaria comunitaria', 'administrador', 'superadministrador'] } } }]
        });
        
        if (!responsable) {
          throw new ApiError('El responsable seleccionado no existe o no tiene permisos suficientes', 400);
        }
        
        presupuesto.responsable_id = responsable_id;
      }
      
      // Guardar los cambios
      await presupuesto.save();
      
      logger.info(`Presupuesto actualizado: ${presupuesto.codigo}`);
      
      // Obtener el presupuesto actualizado con sus relaciones
      const presupuestoActualizado = await Presupuesto.findByPk(id, {
        include: [
          { model: Municipalidad, attributes: ['id', 'nombre'] },
          { model: Usuario, as: 'Responsable', attributes: ['id', 'nombre', 'apellido', 'email'] }
        ]
      });
      
      res.json({
        message: 'Presupuesto actualizado exitosamente',
        presupuesto: presupuestoActualizado
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Elimina un presupuesto (solo administradores)
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @param {Function} next - Función next de Express
   */
  deletePresupuesto: async (req, res, next) => {
    try {
      const { id } = req.params;
      
      // Solo los administradores pueden eliminar presupuestos
      if (!['administrador','superadministrador'].includes(req.user.rol_nombre)) {
        throw new ApiError('No tienes permiso para eliminar presupuestos', 403);
      }
      
      const presupuesto = await Presupuesto.findByPk(id, {
        include: [{ model: Proyecto }]
      });
      
      if (!presupuesto) {
        throw new ApiError('Presupuesto no encontrado', 404);
      }
      
      // Verificar si hay proyectos asociados
      if (presupuesto.Proyectos && presupuesto.Proyectos.length > 0) {
        throw new ApiError('No se puede eliminar el presupuesto porque tiene proyectos asociados', 400);
      }
      
      // Guardar información para el log
      const codigoPresupuesto = presupuesto.codigo;
      
      // Eliminar el presupuesto
      await presupuesto.destroy();
      
      logger.info(`Presupuesto eliminado: ${codigoPresupuesto}`);
      
      res.json({
        message: 'Presupuesto eliminado exitosamente'
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Obtiene estadísticas de presupuestos
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @param {Function} next - Función next de Express
   */
  getPresupuestosStats: async (req, res, next) => {
    try {
      // Solo administradores y funcionarios pueden ver estadísticas
      if (req.user.rol_nombre === 'ciudadano') {
        throw new ApiError('No tienes permiso para ver estadísticas', 403);
      }
      
      // Estadísticas por estado
      const estadoStats = await Presupuesto.findAll({
        attributes: [
          'estado',
          [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
          [sequelize.fn('SUM', sequelize.col('monto_total')), 'monto_total'],
          [sequelize.fn('SUM', sequelize.col('monto_ejecutado')), 'monto_ejecutado']
        ],
        group: ['estado']
      });
      
      // Estadísticas por municipalidad
      const municipalidadStats = await Presupuesto.findAll({
        attributes: [
          'municipalidad_id',
          [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
          [sequelize.fn('SUM', sequelize.col('monto_total')), 'monto_total'],
          [sequelize.fn('SUM', sequelize.col('monto_ejecutado')), 'monto_ejecutado']
        ],
        include: [{
          model: Municipalidad,
          attributes: ['nombre']
        }],
        group: ['municipalidad_id', 'Municipalidad.id', 'Municipalidad.nombre']
      });
      
      // Estadísticas por año fiscal
      const añoFiscalStats = await Presupuesto.findAll({
        attributes: [
          'año_fiscal',
          [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
          [sequelize.fn('SUM', sequelize.col('monto_total')), 'monto_total'],
          [sequelize.fn('SUM', sequelize.col('monto_ejecutado')), 'monto_ejecutado']
        ],
        group: ['año_fiscal'],
        order: [['año_fiscal', 'DESC']]
      });
      
      // Porcentaje de ejecución global
      const ejecucionGlobal = await Presupuesto.findAll({
        attributes: [
          [sequelize.fn('SUM', sequelize.col('monto_total')), 'monto_total'],
          [sequelize.fn('SUM', sequelize.col('monto_ejecutado')), 'monto_ejecutado']
        ]
      });
      
      const porcentajeEjecucion = ejecucionGlobal[0].dataValues.monto_total > 0 ?
        (ejecucionGlobal[0].dataValues.monto_ejecutado / ejecucionGlobal[0].dataValues.monto_total) * 100 : 0;
      
      res.json({
        estadoPorPresupuesto: estadoStats,
        municipalidadPorPresupuesto: municipalidadStats,
        añoFiscalPorPresupuesto: añoFiscalStats,
        ejecucionGlobal: {
          monto_total: ejecucionGlobal[0].dataValues.monto_total,
          monto_ejecutado: ejecucionGlobal[0].dataValues.monto_ejecutado,
          porcentaje_ejecucion: porcentajeEjecucion
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = presupuestosController;
