const { Departamento, Usuario, Proyecto } = require('../models');
const { ApiError } = require('../middlewares/errorHandler');
const logger = require('../utils/logger');
const { Op } = require('sequelize');
const sequelize = require('sequelize');

/**
 * Controlador para el manejo de departamentos municipales
 */
const departamentosController = {
  /**
   * Obtiene todos los departamentos con paginación y filtros
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @param {Function} next - Función next de Express
   */
  getAllDepartamentos: async (req, res, next) => {
    try {
      const { 
        page = 1, 
        limit = 10, 
        search,
        sort = 'nombre',
        order = 'ASC'
      } = req.query;

      // Construir condiciones de búsqueda
      const where = {};
      
      // Búsqueda por texto en nombre, rut, región o comuna
      if (search) {
        where[Op.or] = [
          { nombre: { [Op.like]: `%${search}%` } },
          { rut: { [Op.like]: `%${search}%` } },
          { region: { [Op.like]: `%${search}%` } },
          { comuna: { [Op.like]: `%${search}%` } }
        ];
      }
      
      // Calcular offset para paginación
      const offset = (page - 1) * limit;
      
      // Validar campo de ordenamiento
      const validSortFields = ['nombre', 'createdAt'];
      const sortField = validSortFields.includes(sort) ? sort : 'nombre';
      
      // Validar dirección de ordenamiento
      const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
      
      // Ejecutar consulta
      const { count, rows } = await Departamento.findAndCountAll({
        where,
        order: [[sortField, sortOrder]],
        limit: parseInt(limit),
        offset: offset
      });
      
      // Calcular total de páginas
      const totalPages = Math.ceil(count / limit);
      
      res.json({
        departamentos: rows,
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
   * Obtiene un departamento por su ID
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @param {Function} next - Función next de Express
   */
  getDepartamentoById: async (req, res, next) => {
    try {
      const { id } = req.params;
      
      const departamento = await Departamento.findByPk(id);
      
      if (!departamento) {
        throw new ApiError('Departamento no encontrado', 404);
      }
      
      res.json(departamento);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Crea un nuevo departamento
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @param {Function} next - Función next de Express
   */
  createDepartamento: async (req, res, next) => {
    try {
      // Solo los administradores pueden crear departamentos
      if (req.user.role !== 'admin') {
        throw new ApiError('No tienes permiso para crear departamentos', 403);
      }
      
      const { 
        nombre,
        rut,
        telefono,
        email,
        region,
        comuna,
        estado
      } = req.body;
      
      // Verificar que el rut o nombre no exista
      const existingDepartamento = await Departamento.findOne({
        where: { 
          [Op.or]: [
            { rut },
            { nombre }
          ]
        }
      });
      
      if (existingDepartamento) {
        throw new ApiError(
          'Ya existe un departamento con el nombre o RUT proporcionado',
          400
        );
      }

      // Crear el departamento con los nuevos campos
      const nuevoDepartamento = await Departamento.create({
        nombre,
        rut,
        telefono,
        email,
        region,
        comuna,
        estado
      });
      
      logger.info(`Nuevo departamento creado: ${nombre}`);
      
      // Obtener el departamento con sus relaciones
      const departamentoCompleto = await Departamento.findByPk(nuevoDepartamento.id);
      
      res.status(201).json({
        message: 'Departamento creado exitosamente',
        departamento: departamentoCompleto
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Actualiza un departamento existente
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @param {Function} next - Función next de Express
   */
  updateDepartamento: async (req, res, next) => {
    try {
      // Solo los administradores pueden actualizar departamentos
      if (req.user.role !== 'admin') {
        throw new ApiError('No tienes permiso para actualizar departamentos', 403);
      }
      
      const { id } = req.params;
      const { 
        nombre,
        rut,
        telefono,
        email,
        region,
        comuna,
        estado
      } = req.body;
      
      const departamento = await Departamento.findByPk(id);
      
      if (!departamento) {
        throw new ApiError('Departamento no encontrado', 404);
      }
      
      if (nombre && nombre !== departamento.nombre) {
        const existingDepartamento = await Departamento.findOne({
          where: { 
            nombre,
            id: { [Op.ne]: id }
          }
        });
        
        if (existingDepartamento) {
          throw new ApiError('Ya existe un departamento con el nombre proporcionado', 400);
        }
      }
      
      // Verificar que el rut o nombre no exista en otro departamento
      if (rut && rut !== departamento.rut) {
        const existenteRut = await Departamento.findOne({
          where: { rut, id: { [Op.ne]: id } }
        });
        if (existenteRut) {
          throw new ApiError('Ya existe un departamento con el RUT proporcionado', 400);
        }
      }
      if (nombre && nombre !== departamento.nombre) {
        const existenteNombre = await Departamento.findOne({
          where: { nombre, id: { [Op.ne]: id } }
        });
        if (existenteNombre) {
          throw new ApiError('Ya existe un departamento con el nombre proporcionado', 400);
        }
      }

      // Actualizar campos
      if (nombre) departamento.nombre = nombre;
      if (rut) departamento.rut = rut;
      if (telefono) departamento.telefono = telefono;
      if (email) departamento.email = email;
      // campo ubicacion removido del sistema
      if (region) departamento.region = region;
      if (comuna) departamento.comuna = comuna;
      if (estado) departamento.estado = estado;
      
      // Guardar los cambios
      await departamento.save();
      
      logger.info(`Departamento actualizado: ${departamento.nombre}`);
      
      // Obtener el departamento actualizado con sus relaciones
      const departamentoActualizado = await Departamento.findByPk(id);
      
      res.json({
        message: 'Departamento actualizado exitosamente',
        departamento: departamentoActualizado
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Elimina un departamento (solo administradores)
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @param {Function} next - Función next de Express
   */
  deleteDepartamento: async (req, res, next) => {
    try {
      // Solo los administradores pueden eliminar departamentos
      if (req.user.role !== 'admin') {
        throw new ApiError('No tienes permiso para eliminar departamentos', 403);
      }
      
      const { id } = req.params;
      
      const departamento = await Departamento.findByPk(id);
      
      if (!departamento) {
        throw new ApiError('Departamento no encontrado', 404);
      }
      
      // Verificar si hay proyectos asociados al departamento
      const proyectosAsociados = await Proyecto.count({
        where: { departamento_id: id }
      });
      
      if (proyectosAsociados > 0) {
        throw new ApiError(
          `No se puede eliminar el departamento porque tiene ${proyectosAsociados} proyecto(s) asociado(s)`,
          400
        );
      }
      
      // Verificar si hay funcionarios asociados al departamento
      const funcionariosAsociados = await Usuario.count({
        where: { 
          departamento_id: id,
          role: 'funcionario'
        }
      });
      
      if (funcionariosAsociados > 0) {
        throw new ApiError(
          `No se puede eliminar el departamento porque tiene ${funcionariosAsociados} funcionario(s) asociado(s)`,
          400
        );
      }
      
      // Eliminar el departamento
      await departamento.destroy();
      
      logger.info(`Departamento eliminado: ${departamento.nombre}`);
      
      res.json({
        message: 'Departamento eliminado exitosamente'
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Asigna funcionarios a un departamento
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @param {Function} next - Función next de Express
   */
  asignarFuncionarios: async (req, res, next) => {
    try {
      // Solo los administradores pueden asignar funcionarios
      if (req.user.role !== 'admin') {
        throw new ApiError('No tienes permiso para asignar funcionarios', 403);
      }
      
      const { id } = req.params;
      const { funcionario_ids } = req.body;
      
      const departamento = await Departamento.findByPk(id);
      
      if (!departamento) {
        throw new ApiError('Departamento no encontrado', 404);
      }
      
      // Verificar que todos los funcionarios existen y tienen el rol adecuado
      const funcionarios = await Usuario.findAll({
        where: { 
          id: { [Op.in]: funcionario_ids },
          role: 'funcionario'
        }
      });
      
      if (funcionarios.length !== funcionario_ids.length) {
        throw new ApiError('Uno o más funcionarios no existen o no tienen el rol adecuado', 400);
      }
      
      // Asignar funcionarios al departamento
      await departamento.setFuncionarios(funcionarios);
      
      logger.info(`Funcionarios asignados al departamento: ${departamento.nombre} (id: ${departamento.id})`);
      
      // Obtener el departamento actualizado con sus funcionarios
      const departamentoActualizado = await Departamento.findByPk(id, {
        include: [
          {
            model: Usuario,
            as: 'Funcionarios',
            attributes: ['id', 'nombre', 'apellido', 'email'],
            through: { attributes: [] }
          }
        ]
      });
      
      res.json({
        message: 'Funcionarios asignados exitosamente',
        departamento: departamentoActualizado
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Obtiene estadísticas de departamentos
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @param {Function} next - Función next de Express
   */
  getDepartamentosStats: async (req, res, next) => {
    try {
      // Solo administradores pueden ver estadísticas
      if (req.user.role !== 'admin') {
        throw new ApiError('No tienes permiso para ver estadísticas', 403);
      }
      
      // Contar proyectos por departamento
      const proyectosPorDepartamento = await Departamento.findAll({
        attributes: [
          'id',
          'nombre',
          [sequelize.literal('(SELECT COUNT(*) FROM Proyectos WHERE Proyectos.departamento_id = Departamento.id)'), 'total_proyectos'],
          [sequelize.literal('(SELECT SUM(presupuesto_asignado) FROM Proyectos WHERE Proyectos.departamento_id = Departamento.id)'), 'presupuesto_total'],
          [sequelize.literal('(SELECT SUM(presupuesto_ejecutado) FROM Proyectos WHERE Proyectos.departamento_id = Departamento.id)'), 'presupuesto_ejecutado']
        ],
        order: [[sequelize.literal('total_proyectos'), 'DESC']]
      });
      
      // Contar funcionarios por departamento
      const funcionariosPorDepartamento = await Departamento.findAll({
        attributes: [
          'id',
          'nombre',
          [sequelize.literal('(SELECT COUNT(*) FROM Usuarios WHERE Usuarios.departamento_id = Departamento.id AND Usuarios.role = "funcionario")'), 'total_funcionarios']
        ],
        order: [[sequelize.literal('total_funcionarios'), 'DESC']]
      });

      // Contar departamentos por estado (activo/inactivo)
      const estadoPorDepartamento = await Departamento.findAll({
        attributes: [
          'estado',
          [sequelize.fn('COUNT', sequelize.col('id')), 'total']
        ],
        group: ['estado']
      });
      
      res.json({
        proyectosPorDepartamento,
        funcionariosPorDepartamento,
        estadoPorDepartamento
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = departamentosController;
