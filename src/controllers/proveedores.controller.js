const { Proveedor, Contrato, Usuario } = require('../models');
const { ApiError } = require('../middlewares/errorHandler');
const logger = require('../utils/logger');
const { Op } = require('sequelize');
const sequelize = require('sequelize');

/**
 * Controlador para el manejo de proveedores municipales
 */
const proveedoresController = {
  /**
   * Obtiene todos los proveedores con paginación y filtros
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @param {Function} next - Función next de Express
   */
  getAllProveedores: async (req, res, next) => {
    try {
      const { 
        page = 1, 
        limit = 10, 
        estado, 
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
      
      // Búsqueda por texto en nombre, descripción, RUT o código
      if (search) {
        where[Op.or] = [
          { razon_social: { [Op.like]: `%${search}%` } },
          { rut: { [Op.like]: `%${search}%` } },
          { codigo: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } }
        ];
      }
      
      // Restricción por rol de usuario
      if (req.user.role === 'ciudadano') {
        // Los ciudadanos solo pueden ver proveedores activos
        where.estado = 'activo';
      }
      
      // Calcular offset para paginación
      const offset = (page - 1) * limit;
      
      // Validar campo de ordenamiento
      const validSortFields = ['createdAt', 'razon_social', 'rut', 'codigo', 'estado'];
      const sortField = validSortFields.includes(sort) ? sort : 'createdAt';
      
      // Validar dirección de ordenamiento
      const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
      
      // Ejecutar consulta
      const { count, rows } = await Proveedor.findAndCountAll({
        where,
        include: [
          { 
            model: Usuario, 
            as: 'Contacto',
            attributes: ['id', 'nombre', 'apellido', 'email', 'telefono'] 
          }
        ],
        order: [[sortField, sortOrder]],
        limit: parseInt(limit),
        offset: offset
      });
      
      // Calcular total de páginas
      const totalPages = Math.ceil(count / limit);
      
      res.json({
        proveedores: rows,
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
   * Obtiene un proveedor por su ID
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @param {Function} next - Función next de Express
   */
  getProveedorById: async (req, res, next) => {
    try {
      const { id } = req.params;
      
      const proveedor = await Proveedor.findByPk(id, {
        include: [
          { 
            model: Usuario, 
            as: 'Contacto',
            attributes: ['id', 'nombre', 'apellido', 'email', 'telefono'] 
          },
          {
            model: Contrato,
            attributes: ['id', 'codigo', 'tipo', 'modalidad', 'fecha_inicio', 'fecha_fin', 'monto_total', 'estado']
          }
        ]
      });
      
      if (!proveedor) {
        throw new ApiError('Proveedor no encontrado', 404);
      }
      
      // Verificar permisos de acceso para ciudadanos
      if (req.user.role === 'ciudadano' && proveedor.estado !== 'activo') {
        throw new ApiError('No tienes permiso para ver este proveedor', 403);
      }
      
      res.json(proveedor);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Crea un nuevo proveedor
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @param {Function} next - Función next de Express
   */
  createProveedor: async (req, res, next) => {
    try {
      const { 
        razon_social, 
        rut, 
        email,
        telefono,
        direccion,
        ciudad,
        rubro,
        sitio_web,
        contacto_id
      } = req.body;
      
      // Verificar que el RUT no esté ya registrado
      const proveedorExistente = await Proveedor.findOne({ where: { rut } });
      if (proveedorExistente) {
        throw new ApiError(`Ya existe un proveedor con el RUT ${rut}`, 400);
      }
      
      // Verificar que el contacto existe
      if (contacto_id) {
        const contacto = await Usuario.findByPk(contacto_id);
        if (!contacto) {
          throw new ApiError('El contacto seleccionado no existe', 400);
        }
      }
      
      // Crear el proveedor
      const nuevoProveedor = await Proveedor.create({
        razon_social,
        rut,
        email,
        telefono,
        direccion,
        ciudad,
        rubro,
        sitio_web,
        contacto_id,
        estado: 'activo' // Estado inicial
        // El código se genera automáticamente en el hook beforeCreate
      });
      
      logger.info(`Nuevo proveedor creado: ${nuevoProveedor.codigo} - ${razon_social}`);
      
      // Obtener el proveedor con sus relaciones
      const proveedorCompleto = await Proveedor.findByPk(nuevoProveedor.id, {
        include: [
          { 
            model: Usuario, 
            as: 'Contacto',
            attributes: ['id', 'nombre', 'apellido', 'email', 'telefono'] 
          }
        ]
      });
      
      res.status(201).json({
        message: 'Proveedor creado exitosamente',
        proveedor: proveedorCompleto
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Actualiza un proveedor existente
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @param {Function} next - Función next de Express
   */
  updateProveedor: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { 
        razon_social, 
        email,
        telefono,
        direccion,
        ciudad,
        rubro,
        sitio_web,
        contacto_id,
        estado
      } = req.body;
      
      // Buscar el proveedor
      const proveedor = await Proveedor.findByPk(id);
      if (!proveedor) {
        throw new ApiError('Proveedor no encontrado', 404);
      }
      
      // Verificar permisos
      if (req.user.role === 'ciudadano') {
        throw new ApiError('No tienes permiso para modificar proveedores', 403);
      }
      
      // Verificar que el contacto existe si se proporciona
      if (contacto_id) {
        const contacto = await Usuario.findByPk(contacto_id);
        if (!contacto) {
          throw new ApiError('El contacto seleccionado no existe', 400);
        }
      }
      
      // Actualizar campos
      if (razon_social) proveedor.razon_social = razon_social;
      if (email) proveedor.email = email;
      if (telefono) proveedor.telefono = telefono;
      if (direccion) proveedor.direccion = direccion;
      if (ciudad) proveedor.ciudad = ciudad;
      if (rubro) proveedor.rubro = rubro;
      if (sitio_web) proveedor.sitio_web = sitio_web;
      if (contacto_id) proveedor.contacto_id = contacto_id;
      
      // Solo admin y funcionario pueden cambiar el estado
      if (estado && ['superadmin', 'funcionario'].includes(req.user.role)) {
        proveedor.estado = estado;
      }
      
      // Guardar los cambios
      await proveedor.save();
      
      logger.info(`Proveedor actualizado: ${proveedor.codigo}`);
      
      // Obtener el proveedor actualizado con sus relaciones
      const proveedorActualizado = await Proveedor.findByPk(id, {
        include: [
          { 
            model: Usuario, 
            as: 'Contacto',
            attributes: ['id', 'nombre', 'apellido', 'email', 'telefono'] 
          }
        ]
      });
      
      res.json({
        message: 'Proveedor actualizado exitosamente',
        proveedor: proveedorActualizado
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Elimina un proveedor (solo administradores)
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @param {Function} next - Función next de Express
   */
  deleteProveedor: async (req, res, next) => {
    try {
      const { id } = req.params;
      
      // Solo los administradores pueden eliminar proveedores
      if (req.user.role !== 'superadmin') {
        throw new ApiError('No tienes permiso para eliminar proveedores', 403);
      }
      
      const proveedor = await Proveedor.findByPk(id, {
        include: [{ model: Contrato }]
      });
      
      if (!proveedor) {
        throw new ApiError('Proveedor no encontrado', 404);
      }
      
      // Verificar si hay contratos asociados
      if (proveedor.Contratos && proveedor.Contratos.length > 0) {
        throw new ApiError('No se puede eliminar el proveedor porque tiene contratos asociados', 400);
      }
      
      // Guardar información para el log
      const codigoProveedor = proveedor.codigo;
      
      // Eliminar el proveedor
      await proveedor.destroy();
      
      logger.info(`Proveedor eliminado: ${codigoProveedor}`);
      
      res.json({
        message: 'Proveedor eliminado exitosamente'
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Obtiene estadísticas de proveedores
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @param {Function} next - Función next de Express
   */
  getProveedoresStats: async (req, res, next) => {
    try {
      // Solo administradores y funcionarios pueden ver estadísticas
      if (req.user.role === 'ciudadano') {
        throw new ApiError('No tienes permiso para ver estadísticas', 403);
      }
      
      // Estadísticas por estado
      const estadoStats = await Proveedor.findAll({
        attributes: [
          'estado',
          [sequelize.fn('COUNT', sequelize.col('id')), 'total']
        ],
        group: ['estado']
      });
      
      // Estadísticas por ciudad
      const ciudadStats = await Proveedor.findAll({
        attributes: [
          'ciudad',
          [sequelize.fn('COUNT', sequelize.col('id')), 'total']
        ],
        group: ['ciudad']
      });
      
      // Estadísticas por rubro
      const rubroStats = await Proveedor.findAll({
        attributes: [
          'rubro',
          [sequelize.fn('COUNT', sequelize.col('id')), 'total']
        ],
        group: ['rubro']
      });
      
      // Total de proveedores
      const totalProveedores = await Proveedor.count();
      
      // Proveedores con más contratos
      const proveedoresConMasContratos = await Proveedor.findAll({
        attributes: [
          'id',
          'codigo',
          'razon_social',
          [sequelize.fn('COUNT', sequelize.col('Contratos.id')), 'total_contratos']
        ],
        include: [{
          model: Contrato,
          attributes: []
        }],
        group: ['Proveedor.id', 'Proveedor.codigo', 'Proveedor.razon_social'],
        order: [[sequelize.literal('total_contratos'), 'DESC']],
        limit: 5
      });
      
      res.json({
        totalProveedores,
        estadoPorProveedor: estadoStats,
        ciudadPorProveedor: ciudadStats,
        rubroPorProveedor: rubroStats,
        proveedoresConMasContratos
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = proveedoresController;
