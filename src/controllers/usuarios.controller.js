const { Usuario, Municipalidad, Tramite, Pago, Documento, Presupuesto, Contrato, Proyecto } = require('../models');
const { ApiError } = require('../middlewares/errorHandler');
const logger = require('../utils/logger');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { cleanName } = require('../utils/text.utils');
// const config = require('../config/config'); // No existe este archivo

/**
 * Controlador para el manejo de usuarios
 */
const usuariosController = {
  /**
   * Obtiene todos los usuarios con paginación y filtros
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @param {Function} next - Función next de Express
   */
  getAllUsuarios: async (req, res, next) => {
    try {
      // Solo los administradores pueden ver todos los usuarios
      if (!['administrador','superadministrador'].includes(req.user.rol_nombre)) {
        throw new ApiError('No tienes permiso para ver todos los usuarios', 403);
      }
      
      const { 
        page = 1, 
        limit = 10, 
        id_rol,
        municipalidad_id,
        search,
        sort = 'createdAt',
        order = 'DESC',
        estado
      } = req.query;

      // Construir condiciones de búsqueda
      const where = {};
      
      // Filtro por rol
      if (id_rol) {
        where.id_rol = id_rol;
      }
      
      // Filtro por municipalidad
      if (municipalidad_id) {
        where.municipalidad_id = municipalidad_id;
      }
      // Si el solicitante es administrador y no especifica municipalidad,
      // restringir automáticamente al ámbito de su municipalidad
      if (req.user.rol_nombre === 'administrador' && !municipalidad_id) {
        if (!req.user.municipalidad_id) {
          throw new ApiError('El administrador no tiene municipalidad asignada', 403);
        }
        where.municipalidad_id = req.user.municipalidad_id;
      }
      
      // Filtro por estado
      if (estado) {
        where.estado = estado;
      }
      
      // Búsqueda por texto en nombre, apellido, email o rut
      if (search) {
        where[Op.or] = [
          { nombre: { [Op.like]: `%${search}%` } },
          { apellido: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
          { rut: { [Op.like]: `%${search}%` } }
        ];
      }
      
      // Calcular offset para paginación
      const offset = (page - 1) * limit;
      
      // Validar campo de ordenamiento
      const validSortFields = ['createdAt', 'nombre', 'apellido', 'email', 'id_rol', 'estado'];
      const sortField = validSortFields.includes(sort) ? sort : 'createdAt';
      
      // Validar dirección de ordenamiento
      const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
      
      // Ejecutar consulta
      const { count, rows } = await Usuario.findAndCountAll({
        where,
        attributes: { exclude: ['password'] },
        include: [
          { 
            model: Municipalidad,
            attributes: ['id', 'nombre'] 
          },
          {
            model: require('../models').Rol,
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
        usuarios: rows,
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
   * Obtiene un usuario por su ID
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @param {Function} next - Función next de Express
   */
  getUsuarioById: async (req, res, next) => {
    try {
      const { id } = req.params;
      
      // Verificar permisos
      if (!['administrador','superadministrador'].includes(req.user.rol_nombre) && req.user.id !== parseInt(id)) {
        throw new ApiError('No tienes permiso para ver este usuario', 403);
      }
      
      const usuario = await Usuario.findByPk(id, {
        attributes: { exclude: ['password'] },
        include: [
          { 
            model: Municipalidad,
            attributes: ['id', 'nombre'] 
          },
          {
            model: require('../models').Rol,
            attributes: ['id', 'nombre']
          }
        ]
      });
      
      if (!usuario) {
        throw new ApiError('Usuario no encontrado', 404);
      }
      
      res.json(usuario);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Crea un nuevo usuario (solo administradores)
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @param {Function} next - Función next de Express
   */
  createUsuario: async (req, res, next) => {
    try {
      // Solo los administradores pueden crear usuarios
      if (!['administrador','superadministrador'].includes(req.user.rol_nombre)) {
        throw new ApiError('No tienes permiso para crear usuarios', 403);
      }
      // Contexto de intento de creación
      logger.info(`[Usuarios] Intento de creación por ${req.user?.email || 'desconocido'} (rol: ${req.user?.rol_nombre || 'N/A'})`);
      
      const { 
        nombre, 
        apellido, 
        primer_nombre,
        segundo_nombre,
        primer_apellido,
        segundo_apellido,
        email,
        password,
        rut,
        telefono,
        direccion,
        id_rol,
        municipalidad_id
      } = req.body;

      // Payload recibido (sin contraseña)
      const payloadLog = {
        primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
        nombre, apellido, email, rut, telefono, direccion, id_rol, municipalidad_id
      };
      logger.info(`[Usuarios] Payload recibido para crear: ${JSON.stringify(payloadLog)}`);
      
      // Verificar que el email no exista
      const existingEmail = await Usuario.findOne({ where: { email } });
      if (existingEmail) {
        logger.warn(`[Usuarios] Email duplicado: ${email}`);
        throw new ApiError('El email ya está registrado', 400);
      }
      
      // Verificar que el RUT no exista
      const existingRut = await Usuario.findOne({ where: { rut } });
      if (existingRut) {
        logger.warn(`[Usuarios] RUT duplicado: ${rut}`);
        throw new ApiError('El RUT ya está registrado', 400);
      }
      
      // Verificar que la municipalidad existe si se proporciona
      if (municipalidad_id) {
        const municipalidad = await Municipalidad.findByPk(municipalidad_id);
        if (!municipalidad) {
          logger.warn(`[Usuarios] Municipalidad inexistente: ${municipalidad_id}`);
          throw new ApiError('La municipalidad seleccionada no existe', 400);
        }
      }

      // Reglas de negocio: secretaria comunitaria debe tener municipalidad
      if (id_rol) {
        const rolRegla = await require('../models').Rol.findByPk(id_rol);
        if (rolRegla && rolRegla.nombre === 'secretaria comunitaria' && (municipalidad_id === null || municipalidad_id === undefined)) {
          logger.warn('[Usuarios] Falta municipalidad para rol secretaria comunitaria');
          throw new ApiError('La municipalidad es obligatoria para usuarios con rol secretaria comunitaria', 400);
        }
      }

      // Restricciones por rol del creador
      const rolCreador = req.user.rol_nombre;
      const rolDestino = await require('../models').Rol.findByPk(id_rol);
      if (!rolDestino) {
        throw new ApiError('El rol especificado no existe', 400);
      }

      if (rolCreador === 'superadministrador') {
        // Superadministrador: solo crea administradores y debe asignar municipalidad
        if (rolDestino.nombre !== 'administrador') {
          throw new ApiError('El superadministrador solo puede crear usuarios administradores', 403);
        }
        if (!municipalidad_id) {
          throw new ApiError('Debe especificar la municipalidad para el administrador', 400);
        }
        const muni = await Municipalidad.findByPk(municipalidad_id);
        if (!muni) {
          throw new ApiError('La municipalidad especificada no existe', 400);
        }
      }

      if (rolCreador === 'administrador') {
        // Administrador: solo puede crear funcionarios/secretarías en su municipalidad
        const allowedRoles = [
          'secretaria de obras',
          'secretaria de transito',
          'tesoreria municipal',
          'secretaria partes',
          'secretaria comunitaria'
        ];
        if (!allowedRoles.includes(rolDestino.nombre)) {
          throw new ApiError('El administrador solo puede crear funcionarios/secretarías', 403);
        }
        if (!req.user.municipalidad_id) {
          throw new ApiError('El administrador no tiene municipalidad asignada', 403);
        }
      }
      
      // Concatenar nombre/apellido si vienen separadamente
      const nombreConcatenado = (nombre && nombre.trim()) || [primer_nombre, segundo_nombre].filter(Boolean).join(' ').trim();
      const apellidoConcatenado = (apellido && apellido.trim()) || [primer_apellido, segundo_apellido].filter(Boolean).join(' ').trim();

      const nombreNormalizado = cleanName(nombreConcatenado);
      const apellidoNormalizado = cleanName(apellidoConcatenado);

      logger.info(`[Usuarios] Nombre compuesto: "${nombreConcatenado}" | Apellido compuesto: "${apellidoConcatenado}"`);

      // Crear el usuario (el hash se aplica en el hook del modelo)
      const muniAsignada = (rolCreador === 'administrador') ? req.user.municipalidad_id : municipalidad_id;

      const datosPersistir = {
        nombre: nombreNormalizado,
        apellido: apellidoNormalizado,
        primer_nombre,
        segundo_nombre,
        primer_apellido,
        segundo_apellido,
        email,
        // password se hashea en hook; no se registra en logs
        rut,
        telefono,
        direccion,
        id_rol,
        municipalidad_id: muniAsignada,
        estado: 'activo'
      };
      logger.info(`[Usuarios] Datos a persistir: ${JSON.stringify(datosPersistir)}`);
      const nuevoUsuario = await Usuario.create({
        nombre: nombreNormalizado,
        apellido: apellidoNormalizado,
        primer_nombre,
        segundo_nombre,
        primer_apellido,
        segundo_apellido,
        email,
        password,
        rut,
        telefono,
        direccion,
        id_rol,
        municipalidad_id: muniAsignada,
        estado: 'activo' // Por defecto, el usuario se crea activo
      });
      
      logger.info(`Nuevo usuario creado: ${email} (id_rol=${id_rol || 'N/A'})`);
      
      // Obtener el usuario creado (sin la contraseña)
      const usuarioCreado = await Usuario.findByPk(nuevoUsuario.id, {
        attributes: { exclude: ['password'] },
        include: [
          { 
            model: Municipalidad,
            attributes: ['id', 'nombre'] 
          }
        ]
      });
      
      res.status(201).json({
        message: 'Usuario creado exitosamente',
        usuario: usuarioCreado
      });
    } catch (error) {
      logger.error(`[Usuarios] Error al crear usuario: ${error.message}`);
      next(error);
    }
  },

  /**
   * Actualiza un usuario existente
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @param {Function} next - Función next de Express
   */
  updateUsuario: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { 
        nombre, 
        apellido, 
        primer_nombre,
        segundo_nombre,
        primer_apellido,
        segundo_apellido,
        email,
        telefono,
        direccion,
        id_rol,
        municipalidad_id,
        estado
      } = req.body;
      
      // Verificar permisos
      const esAdmin = ['administrador','superadministrador'].includes(req.user.rol_nombre);
      const esMismoUsuario = req.user.id === parseInt(id);
      
      if (!esAdmin && !esMismoUsuario) {
        throw new ApiError('No tienes permiso para actualizar este usuario', 403);
      }
      
      const usuario = await Usuario.findByPk(id);
      
      if (!usuario) {
        throw new ApiError('Usuario no encontrado', 404);
      }
      
      // Verificar que el email no exista en otro usuario
      if (email && email !== usuario.email) {
        const existingEmail = await Usuario.findOne({
          where: { 
            email,
            id: { [Op.ne]: id }
          }
        });
        
        if (existingEmail) {
          throw new ApiError('El email ya está registrado por otro usuario', 400);
        }
      }
      
      // Verificar que la municipalidad existe si se proporciona
      if (municipalidad_id && municipalidad_id !== usuario.municipalidad_id) {
        const municipalidad = await Municipalidad.findByPk(municipalidad_id);
        if (!municipalidad) {
          throw new ApiError('La municipalidad seleccionada no existe', 400);
        }
      }
      
      // Restricciones para usuarios no administradores
      if (!esAdmin) {
        // No permitir cambiar el rol
        if (id_rol && id_rol !== usuario.id_rol) {
          throw new ApiError('No tienes permiso para cambiar el rol', 403);
        }
        
        // No permitir cambiar la municipalidad
        if (municipalidad_id && municipalidad_id !== usuario.municipalidad_id) {
          throw new ApiError('No tienes permiso para cambiar la municipalidad', 403);
        }
        
        // No permitir cambiar el estado
        if (estado && estado !== usuario.estado) {
          throw new ApiError('No tienes permiso para cambiar el estado', 403);
        }
      }
      
      // Actualizar campos (con soporte de nombres/apellidos separados)
      if (primer_nombre !== undefined) usuario.primer_nombre = primer_nombre;
      if (segundo_nombre !== undefined) usuario.segundo_nombre = segundo_nombre;
      if (primer_apellido !== undefined) usuario.primer_apellido = primer_apellido;
      if (segundo_apellido !== undefined) usuario.segundo_apellido = segundo_apellido;

      // Si vienen nombre/apellido combinados, asignar; de lo contrario concatenar desde separados
      if (nombre) {
        usuario.nombre = cleanName(nombre);
      } else {
        const nombreConcat = [usuario.primer_nombre, usuario.segundo_nombre].filter(Boolean).join(' ').trim();
        if (nombreConcat) usuario.nombre = cleanName(nombreConcat);
      }
      if (apellido) {
        usuario.apellido = cleanName(apellido);
      } else {
        const apellidoConcat = [usuario.primer_apellido, usuario.segundo_apellido].filter(Boolean).join(' ').trim();
        if (apellidoConcat) usuario.apellido = cleanName(apellidoConcat);
      }
      if (email) usuario.email = email;
      if (telefono) usuario.telefono = telefono;
      if (direccion) usuario.direccion = direccion;
      
      // Campos que solo puede actualizar un administrador
      if (esAdmin) {
        if (id_rol) usuario.id_rol = id_rol;
        if (municipalidad_id) usuario.municipalidad_id = municipalidad_id;
        if (estado) usuario.estado = estado;
      }

      // Regla de negocio: si es (o será) funcionario, debe tener municipalidad
      const nextRolId = (id_rol !== undefined) ? id_rol : usuario.id_rol;
      const nextMunicipalidadId = (municipalidad_id !== undefined) ? municipalidad_id : usuario.municipalidad_id;
      if (nextRolId) {
        const rolActual = await require('../models').Rol.findByPk(nextRolId);
        if (rolActual && rolActual.nombre === 'secretaria comunitaria' && (nextMunicipalidadId === null || nextMunicipalidadId === undefined)) {
          throw new ApiError('La municipalidad es obligatoria para usuarios con rol secretaria comunitaria', 400);
        }
      }
      
      // Guardar los cambios
      await usuario.save();
      
      logger.info(`Usuario actualizado: ${usuario.email}`);
      
      // Obtener el usuario actualizado (sin la contraseña)
      const usuarioActualizado = await Usuario.findByPk(id, {
        attributes: { exclude: ['password'] },
        include: [
          { 
            model: Municipalidad,
            attributes: ['id', 'nombre'] 
          }
        ]
      });
      
      res.json({
        message: 'Usuario actualizado exitosamente',
        usuario: usuarioActualizado
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Elimina un usuario (solo administradores)
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @param {Function} next - Función next de Express
   */
  deleteUsuario: async (req, res, next) => {
    try {
      // Solo los administradores pueden eliminar usuarios
      if (!['administrador','superadministrador'].includes(req.user.rol_nombre)) {
        throw new ApiError('No tienes permiso para eliminar usuarios', 403);
      }
      
      const { id } = req.params;
      
      // No permitir eliminar al propio usuario
      if (req.user.id === parseInt(id)) {
        throw new ApiError('No puedes eliminar tu propia cuenta', 400);
      }
      
      const usuario = await Usuario.findByPk(id);
      
      if (!usuario) {
        throw new ApiError('Usuario no encontrado', 404);
      }
      
      // Verificar referencias reales antes de eliminar (integridad referencial)
      // Usamos consultas SQL directas para evitar cualquier conflicto de asociaciones
      const [[{ tramitesCiudadano }]] = await sequelize.query(
        'SELECT COUNT(*) AS tramitesCiudadano FROM tramites WHERE ciudadano_id = ?',
        { replacements: [id] }
      );
      const [[{ tramitesFuncionario }]] = await sequelize.query(
        'SELECT COUNT(*) AS tramitesFuncionario FROM tramites WHERE funcionario_id = ?',
        { replacements: [id] }
      );
      const [[{ pagosCiudadano }]] = await sequelize.query(
        'SELECT COUNT(*) AS pagosCiudadano FROM pagos WHERE ciudadano_id = ?',
        { replacements: [id] }
      );
      const [[{ pagosFuncionario }]] = await sequelize.query(
        'SELECT COUNT(*) AS pagosFuncionario FROM pagos WHERE funcionario_id = ?',
        { replacements: [id] }
      );
      const [[{ documentos }]] = await sequelize.query(
        'SELECT COUNT(*) AS documentos FROM documentos WHERE usuario_id = ?',
        { replacements: [id] }
      );
      const [[{ presupuestosResp }]] = await sequelize.query(
        'SELECT COUNT(*) AS presupuestosResp FROM presupuestos WHERE responsable_id = ?',
        { replacements: [id] }
      );
      const [[{ contratosResp }]] = await sequelize.query(
        'SELECT COUNT(*) AS contratosResp FROM contratos WHERE responsable_id = ?',
        { replacements: [id] }
      );
      const [[{ proyectosResp }]] = await sequelize.query(
        'SELECT COUNT(*) AS proyectosResp FROM proyectos WHERE responsable_id = ?',
        { replacements: [id] }
      );

      const totalReferencias = tramitesCiudadano + tramitesFuncionario + pagosCiudadano + pagosFuncionario + documentos + presupuestosResp + contratosResp + proyectosResp;
      if (totalReferencias > 0) {
        const causas = [];
        if (tramitesCiudadano) causas.push(`${tramitesCiudadano} trámite(s) como ciudadano`);
        if (tramitesFuncionario) causas.push(`${tramitesFuncionario} trámite(s) como funcionario`);
        if (pagosCiudadano) causas.push(`${pagosCiudadano} pago(s) como ciudadano`);
        if (pagosFuncionario) causas.push(`${pagosFuncionario} pago(s) como funcionario`);
        if (documentos) causas.push(`${documentos} documento(s) subido(s)`);
        if (presupuestosResp) causas.push(`${presupuestosResp} presupuesto(s) responsable`);
        if (contratosResp) causas.push(`${contratosResp} contrato(s) responsable`);
        if (proyectosResp) causas.push(`${proyectosResp} proyecto(s) responsable`);

        throw new ApiError(
          `No se puede eliminar el usuario porque tiene registros asociados: ${causas.join(', ')}`,
          400
        );
      }
      
      // Guardar información para el log
      const emailUsuario = usuario.email;
      
      // Eliminar el usuario
      await usuario.destroy();
      
      logger.info(`Usuario eliminado: ${emailUsuario}`);
      
      res.json({
        message: 'Usuario eliminado exitosamente'
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Cambia la contraseña de un usuario
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @param {Function} next - Función next de Express
   */
  changePassword: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { currentPassword, newPassword } = req.body;
      
      // Verificar permisos
      const esAdmin = ['administrador','superadministrador'].includes(req.user.rol_nombre);
      const esMismoUsuario = req.user.id === parseInt(id);
      
      if (!esAdmin && !esMismoUsuario) {
        throw new ApiError('No tienes permiso para cambiar la contraseña de este usuario', 403);
      }
      
      const usuario = await Usuario.findByPk(id);
      
      if (!usuario) {
        throw new ApiError('Usuario no encontrado', 404);
      }
      
      // Si es el mismo usuario, verificar la contraseña actual
      if (esMismoUsuario) {
        const isMatch = await bcrypt.compare(currentPassword, usuario.password);
        if (!isMatch) {
          throw new ApiError('La contraseña actual es incorrecta', 400);
        }
      }
      
      // Actualizar la contraseña (el hash se aplica en el hook del modelo)
      usuario.password = newPassword;
      await usuario.save();
      
      logger.info(`Contraseña actualizada para el usuario: ${usuario.email}`);
      
      res.json({
        message: 'Contraseña actualizada exitosamente'
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Cambia el estado de un usuario
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @param {Function} next - Función next de Express
   */
  changeEstado: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { estado } = req.body;
      
      // Solo administradores pueden cambiar el estado
      if (!['administrador','superadministrador'].includes(req.user.rol_nombre)) {
        throw new ApiError('No tienes permiso para cambiar el estado de usuarios', 403);
      }
      
      // Validar que el estado sea válido
      if (!['activo', 'inactivo'].includes(estado)) {
        throw new ApiError('Estado inválido. Debe ser "activo" o "inactivo"', 400);
      }
      
      const usuario = await Usuario.findByPk(id);
      
      if (!usuario) {
        throw new ApiError('Usuario no encontrado', 404);
      }
      
      // Actualizar el estado
      usuario.estado = estado;
      await usuario.save();
      
      logger.info(`Estado del usuario ${usuario.email} cambiado a: ${estado}`);
      
      // Obtener el usuario actualizado (sin la contraseña)
      const usuarioActualizado = await Usuario.findByPk(id, {
        attributes: { exclude: ['password'] },
        include: [
          { 
            model: Municipalidad,
            attributes: ['id', 'nombre'] 
          }
        ]
      });
      
      res.json({
        message: `Usuario ${estado === 'activo' ? 'activado' : 'desactivado'} exitosamente`,
        usuario: usuarioActualizado
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Obtiene estadísticas de usuarios
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @param {Function} next - Función next de Express
   */
  getUsuariosStats: async (req, res, next) => {
    try {
      // Solo administradores pueden ver estadísticas
      if (!['administrador','superadministrador'].includes(req.user.rol_nombre)) {
        throw new ApiError('No tienes permiso para ver estadísticas', 403);
      }
      
      // Estadísticas por rol
      const { Rol } = require('../models');
      const rolStats = await Usuario.findAll({
        attributes: [
          'id_rol',
          [sequelize.fn('COUNT', sequelize.col('Usuario.id')), 'total']
        ],
        include: [{ model: Rol, attributes: ['nombre'] }],
        group: ['id_rol', 'Rol.id', 'Rol.nombre']
      });
      
      // Estadísticas por estado
      const estadoStats = await Usuario.findAll({
        attributes: [
          'estado',
          [sequelize.fn('COUNT', sequelize.col('id')), 'total']
        ],
        group: ['estado']
      });
      
      // Estadísticas por municipalidad
      const municipalidadStats = await Usuario.findAll({
        attributes: [
          'municipalidad_id',
          [sequelize.fn('COUNT', sequelize.col('Usuario.id')), 'total']
        ],
        include: [{
          model: Municipalidad,
          attributes: ['nombre']
        }],
        group: ['municipalidad_id', 'Municipalidad.id', 'Municipalidad.nombre']
      });
      
      // Usuarios más recientes
      const usuariosRecientes = await Usuario.findAll({
        attributes: { exclude: ['password'] },
        order: [['createdAt', 'DESC']],
        limit: 5
      });
      
      res.json({
        rolPorUsuario: rolStats,
        estadoPorUsuario: estadoStats,
        municipalidadPorUsuario: municipalidadStats,
        usuariosRecientes
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = usuariosController;
