const { Departamento, Usuario, Proyecto, Rol, Municipalidad } = require('../models');
const { ApiError } = require('../middlewares/errorHandler');
const logger = require('../utils/logger');
const { Op } = require('sequelize');
const sequelize = require('sequelize');

/**
 * Controlador para el manejo de departamentos municipales
 */
const esMunicipalidades = (req) => {
  const b = (req.baseUrl || '') + (req.originalUrl || '');
  return b.includes('/api/municipalidades') || b.includes('/superadmin/municipalidades');
};

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
      
      if (search) {
        where[Op.or] = [
          { nombre: { [Op.like]: `%${search}%` } }
        ];
      }
      
      // Calcular offset para paginación
      const offset = (page - 1) * limit;
      
      // Validar campo de ordenamiento
      const validSortFields = ['nombre'];
      const sortField = validSortFields.includes(sort) ? sort : 'nombre';
      
      // Validar dirección de ordenamiento
      const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
      
      // Ejecutar consulta
      const consulta = esMunicipalidades(req) ? Municipalidad : Departamento;
      const { count, rows } = await consulta.findAndCountAll({
        where,
        order: [[sortField, sortOrder]],
        limit: parseInt(limit),
        offset: offset
      });
      const rowsPlain = rows.map(r => {
        const j = typeof r.toJSON === 'function' ? r.toJSON() : r;
        const email = j.email ?? j.email_contacto ?? null;
        const telefono = j.telefono ?? j.telefono_contacto ?? null;
        return { ...j, email, telefono };
      });
      
      // Calcular total de páginas
      const totalPages = Math.ceil(count / limit);
      
      res.json({
        departamentos: rowsPlain,
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
      const modelo = esMunicipalidades(req) ? Municipalidad : Departamento;
      const departamentoRaw = await modelo.findByPk(id);
      const departamento = departamentoRaw && typeof departamentoRaw.toJSON === 'function'
        ? (() => {
            const j = departamentoRaw.toJSON();
            const email = j.email ?? j.email_contacto ?? null;
            const telefono = j.telefono ?? j.telefono_contacto ?? null;
            return { ...j, email, telefono };
          })()
        : departamentoRaw;
      
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
      if (req.user.rol_nombre !== 'superadministrador') {
        throw new ApiError('No tienes permiso para crear departamentos', 403);
      }
      if (esMunicipalidades(req)) {
        const { nombre, direccion, region, comuna, telefono, email, rut } = req.body;
        const existente = await Municipalidad.findOne({ where: { nombre } });
        if (existente) {
          throw new ApiError('Ya existe una municipalidad con el nombre proporcionado', 400);
        }
        const nuevo = await Municipalidad.create({ nombre, direccion, region, comuna, telefono, email, rut });
        logger.info(`Nueva municipalidad creada: ${nombre}`);
        const completo = await Municipalidad.findByPk(nuevo.id);
        return res.status(201).json({
          message: 'Municipalidad creada exitosamente',
          departamento: completo
        });
      } else {
        const { nombre } = req.body;
        const existente = await Departamento.findOne({ where: { nombre } });
        if (existente) {
          throw new ApiError('Ya existe un departamento con el nombre proporcionado', 400);
        }
        const nuevo = await Departamento.create({ nombre });
        logger.info(`Nuevo departamento creado: ${nombre}`);
        const completo = await Departamento.findByPk(nuevo.id);
        return res.status(201).json({
          message: 'Departamento creado exitosamente',
          departamento: completo
        });
      }
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
      if (!['administrador','superadministrador'].includes(req.user.rol_nombre)) {
        throw new ApiError('No tienes permiso para actualizar departamentos', 403);
      }
      
      const { id } = req.params;
      const esMun = esMunicipalidades(req);
      const departamento = esMun ? await Municipalidad.findByPk(id) : await Departamento.findByPk(id);
      
      if (!departamento) {
        throw new ApiError('Departamento no encontrado', 404);
      }
      if (req.user.rol_nombre === 'administrador') {
        if (!req.user.municipalidad_id || req.user.municipalidad_id !== parseInt(id)) {
          throw new ApiError('No tienes permiso para modificar departamentos de otra municipalidad', 403);
        }
      }
      
      if (esMun) {
        const { nombre, direccion, region, comuna, telefono, email, rut } = req.body;
        if (nombre && nombre !== departamento.nombre) {
          const existeNombre = await Municipalidad.findOne({ where: { nombre, id: { [Op.ne]: id } } });
          if (existeNombre) {
            throw new ApiError('Ya existe una municipalidad con el nombre proporcionado', 400);
          }
        }
        if (nombre) departamento.nombre = nombre;
        if (direccion !== undefined) departamento.direccion = direccion;
        if (region !== undefined) departamento.region = region;
        if (comuna !== undefined) departamento.comuna = comuna;
        if (telefono !== undefined) departamento.telefono = telefono;
        if (email !== undefined) departamento.email = email;
        if (rut !== undefined) departamento.rut = rut;
      } else {
        const { nombre } = req.body;
        if (nombre && nombre !== departamento.nombre) {
          const existenteNombre = await Departamento.findOne({
            where: { nombre, id: { [Op.ne]: id } }
          });
          if (existenteNombre) {
            throw new ApiError('Ya existe un departamento con el nombre proporcionado', 400);
          }
        }
        if (nombre) departamento.nombre = nombre;
      }
      
      // Guardar los cambios
      await departamento.save();
      
      logger.info(`Departamento actualizado: ${departamento.nombre}`);
      
      // Obtener el departamento actualizado con sus relaciones
      const departamentoActualizado = esMun ? await Municipalidad.findByPk(id) : await Departamento.findByPk(id);
      
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
      if (!['administrador','superadministrador'].includes(req.user.rol_nombre)) {
        throw new ApiError('No tienes permiso para eliminar departamentos', 403);
      }
      
      const { id } = req.params;
      const esMun = esMunicipalidades(req);
      const departamento = esMun ? await Municipalidad.findByPk(id) : await Departamento.findByPk(id);
      
      if (!departamento) {
        throw new ApiError('Departamento no encontrado', 404);
      }
      if (req.user.rol_nombre === 'administrador') {
        if (!req.user.municipalidad_id || req.user.municipalidad_id !== parseInt(id)) {
          throw new ApiError('No tienes permiso para eliminar departamentos de otra municipalidad', 403);
        }
      }
      
      // Verificar si hay proyectos asociados al departamento
      const proyectosAsociados = await Proyecto.count({
        where: { municipalidad_id: id }
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
          municipalidad_id: id
        },
        include: [{ model: Rol, where: { nombre: 'secretaria comunitaria' } }]
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
      if (!['administrador','superadministrador'].includes(req.user.rol_nombre)) {
        throw new ApiError('No tienes permiso para asignar funcionarios', 403);
      }
      
      const { id } = req.params;
      const { funcionario_ids } = req.body;
      
      const departamento = await Departamento.findByPk(id);
      
      if (!departamento) {
        throw new ApiError('Departamento no encontrado', 404);
      }
      if (req.user.rol_nombre === 'administrador') {
        if (!req.user.municipalidad_id || req.user.municipalidad_id !== parseInt(id)) {
          throw new ApiError('No tienes permiso para asignar funcionarios de otra municipalidad', 403);
        }
      }
      
      // Verificar que todos los funcionarios existen y tienen el rol adecuado
      const funcionarios = await Usuario.findAll({
        where: { id: { [Op.in]: funcionario_ids } },
        include: [{ model: Rol, where: { nombre: 'secretaria comunitaria' } }]
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
      if (!['administrador','superadministrador'].includes(req.user.rol_nombre)) {
        throw new ApiError('No tienes permiso para ver estadísticas', 403);
      }
      
      const proyectosPorDepartamento = [];
      const funcionariosPorDepartamento = [];
      const estadoPorDepartamento = [];
      
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
