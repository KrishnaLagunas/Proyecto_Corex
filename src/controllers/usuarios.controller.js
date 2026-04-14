const { Usuario, Municipalidad, Tramite, Pago, Documento, Proyecto } = require('../models');
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
        rol_nombre,
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
      } else if (rol_nombre) {
        const map = {
          admin: 'administrador',
          superadmin: 'superadministrador'
        };
        const nombreRol = map[String(rol_nombre).toLowerCase()] || String(rol_nombre).toLowerCase();
        const RolModel = require('../models').Rol;
        const rolFound = await RolModel.findOne({ where: { nombre: nombreRol } });
        if (rolFound) {
          where.id_rol = rolFound.id;
        } else {
          return res.json({ usuarios: [], pagination: { total: 0, totalPages: 0, currentPage: parseInt(page), limit: parseInt(limit) } });
        }
      }

      // Restricciones de visualización para superadministrador
      if (req.user.rol_nombre === 'superadministrador') {
        const RolModel = require('../models').Rol;
        const allowedRoles = await RolModel.findAll({
          where: { nombre: { [Op.in]: ['administrador', 'superadministrador'] } },
          attributes: ['id']
        });
        const allowedIds = allowedRoles.map(r => r.id);
        
        if (where.id_rol) {
          if (!allowedIds.includes(where.id_rol)) {
            return res.json({ usuarios: [], pagination: { total: 0, totalPages: 0, currentPage: parseInt(page), limit: parseInt(limit) } });
          }
        } else {
          where.id_rol = { [Op.in]: allowedIds };
        }
      }
      
      // Filtro por municipalidad
      if (municipalidad_id) {
        where.municipalidad_id = municipalidad_id;
      }
      // Si el solicitante es administrador y no especifica municipalidad,
      // restringir automáticamente al ámbito de su municipalidad
      if (req.user.rol_nombre === 'administrador' && !municipalidad_id) {
        if (!req.user.municipalidad_id) {
          // Sin municipalidad asignada: devolver lista vacía en lugar de error
          return res.json({ usuarios: [], pagination: { total: 0, totalPages: 0, currentPage: parseInt(page), limit: parseInt(limit) } });
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
          },
          {
            model: require('../models').Departamento,
            as: 'Departamentos',
            through: { attributes: [] }
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
          },
          {
            model: require('../models').Departamento,
            as: 'Departamentos',
            through: { attributes: [] }
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
        municipalidad_id,
        role
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
      
      // Mapear role a id_rol si no se envía id_rol
      let idRolFinal = id_rol;
      try {
        if (!idRolFinal && role) {
          const input = String(role).toLowerCase();
          const map = { admin: 'administrador', superadmin: 'superadministrador' };
          const nombreRol = map[input] || input;
          const RolModel = require('../models').Rol;
          const rolFound = await RolModel.findOne({ where: { nombre: nombreRol } });
          if (rolFound) idRolFinal = rolFound.id;
        }
      } catch (err) { console.error('Error silenciado:', err.message); }

      // Verificar que la municipalidad existe si se proporciona
      if (municipalidad_id) {
        const municipalidad = await Municipalidad.findByPk(municipalidad_id);
        if (!municipalidad) {
          logger.warn(`[Usuarios] Municipalidad inexistente: ${municipalidad_id}`);
          throw new ApiError('La municipalidad seleccionada no existe', 400);
        }
      }

      // Reglas de negocio: secretaria de educación debe tener municipalidad
      if (idRolFinal) {
        const rolRegla = await require('../models').Rol.findByPk(idRolFinal);
        if (rolRegla && rolRegla.nombre === 'secretaria de educación' && (municipalidad_id === null || municipalidad_id === undefined)) {
          logger.warn('[Usuarios] Falta municipalidad para rol secretaria de educación');
          throw new ApiError('La municipalidad es obligatoria para usuarios con rol secretaria de educación', 400);
        }
      }

      // Restricciones por rol del creador
      const rolCreador = req.user.rol_nombre;
      const rolDestino = idRolFinal ? await require('../models').Rol.findByPk(idRolFinal) : null;
      if (!rolDestino) {
        throw new ApiError('El rol especificado no existe', 400);
      }

      if (rolCreador === 'superadministrador') {
        // Superadministrador: puede crear administradores y funcionarios/secretarías, requiriendo municipalidad
        const allowedRolesSuper = [
          'administrador',
          'funcionario',
          'secretaria de educación',
          'secretaria de obras',
          'secretaria de transito',
          'secretaria de seguridad',
          'secretaria de salud'
        ];
        if (!allowedRolesSuper.includes(rolDestino.nombre)) {
          throw new ApiError('Rol no permitido para creación por superadministrador', 403);
        }
        if (!municipalidad_id) {
          throw new ApiError('Debe especificar la municipalidad para el usuario', 400);
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
          'secretaria de salud',
          'secretaria de seguridad',
          'secretaria de educación'
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
      let muniAsignada = (rolCreador === 'administrador') ? req.user.municipalidad_id : municipalidad_id;
      if (rolDestino && rolDestino.nombre === 'superadministrador') {
        muniAsignada = null; // Un superadministrador nunca tiene municipalidad asignada
      }

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
        id_rol: idRolFinal,
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
        id_rol: idRolFinal,
        municipalidad_id: muniAsignada,
        estado: 'activo' // Por defecto, el usuario se crea activo
      });
      
      logger.info(`Nuevo usuario creado: ${email} (id_rol=${idRolFinal || 'N/A'})`);
      
      // Asignar departamento si se proporciona y NO es superadministrador
      if (req.body.departamento_id && (!rolDestino || rolDestino.nombre !== 'superadministrador')) {
        try {
          const { Departamento, DepartamentoUsuario } = require('../models');
          const deptIdRaw = req.body.departamento_id;
          const deptId = (deptIdRaw && deptIdRaw !== 'Ninguno') ? parseInt(deptIdRaw) : null;
          
          if (deptId && !isNaN(deptId)) {
            const depto = await Departamento.findByPk(deptId);
            if (depto) {
              await DepartamentoUsuario.create({
                usuario_id: parseInt(nuevoUsuario.id),
                departamento_id: deptId
              });
              logger.info(`[Usuarios] Departamento ${deptId} (${depto.nombre}) asignado exitosamente al nuevo usuario ${nuevoUsuario.id}`);
            } else {
              logger.warn(`[Usuarios] El departamento ${deptId} no existe para asignar al nuevo usuario`);
            }
          }
        } catch (e) {
          logger.error(`[Usuarios] Error crítico al asignar departamento inicial: ${e.message}`);
        }
      }
      
      // Obtener el usuario creado (sin la contraseña)
      const usuarioCreado = await Usuario.findByPk(nuevoUsuario.id, {
        attributes: { exclude: ['password'] },
        include: [
          { 
            model: Municipalidad,
            attributes: ['id', 'nombre'] 
          },
          {
            model: require('../models').Rol,
            attributes: ['id', 'nombre']
          },
          {
            model: require('../models').Departamento,
            as: 'Departamentos',
            through: { attributes: [] }
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
        rut,
        telefono,
        direccion,
        id_rol,
        municipalidad_id,
        role,
        estado
      } = req.body;
      try { logger.info(`[Usuarios][UPDATE][RAW] ${JSON.stringify(req.body)}`); console.log('[DEBUG][USUARIOS][UPDATE][RAW]', req.body); } catch (err) { console.error('Error silenciado:', err.message); }
      
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
      if (rut) {
        const rutNorm = String(rut).replace(/[^0-9kK-]/g, '').toLowerCase();
        usuario.rut = rutNorm;
      }
      if (telefono) usuario.telefono = telefono;
      if (direccion) usuario.direccion = direccion;
      
      // Campos que solo puede actualizar un administrador
      if (esAdmin) {
        if (id_rol) usuario.id_rol = id_rol;
        if (municipalidad_id !== undefined) usuario.municipalidad_id = municipalidad_id;
        if (role) {
          const input = String(role).toLowerCase();
          const map = {
            admin: 'administrador',
            superadmin: 'superadministrador'
          };
          const nombreRol = map[input] || input;
          const RolModel = require('../models').Rol;
          const rolFound = await RolModel.findOne({ where: { nombre: nombreRol } });
          if (rolFound) usuario.id_rol = rolFound.id;
        }
        if (estado) usuario.estado = estado;

        // Limpiar municipalidad si es superadmin
        let isSuperadmin = false;
        if (usuario.id_rol) {
          const RolModel = require('../models').Rol;
          const currentRol = await RolModel.findByPk(usuario.id_rol);
          if (currentRol && currentRol.nombre === 'superadministrador') {
            isSuperadmin = true;
            usuario.municipalidad_id = null;
          }
        }
        
        // Manejar asignación de departamento
        if (req.body.departamento_id !== undefined) {
          try {
            const deptId = (req.body.departamento_id && req.body.departamento_id !== 'Ninguno') ? parseInt(req.body.departamento_id) : null;
            const { Departamento, DepartamentoUsuario } = require('../models');
            const targetUserId = parseInt(id);
            
            logger.info(`[Usuarios] Actualizando departamentos para usuario ${targetUserId}. Nuevo deptId: ${deptId}`);
            
            // Eliminar asignaciones previas de forma segura
            await DepartamentoUsuario.destroy({ 
              where: { usuario_id: targetUserId } 
            });
            
            // Crear nueva asignación si corresponde y no es superadministrador
            if (deptId && !isNaN(deptId) && !isSuperadmin) {
              const depto = await Departamento.findByPk(deptId);
              if (depto) {
                await DepartamentoUsuario.create({
                  usuario_id: targetUserId,
                  departamento_id: deptId
                });
                logger.info(`[Usuarios] Departamento ${deptId} (${depto.nombre}) asignado exitosamente al usuario ${targetUserId}`);
              } else {
                logger.warn(`[Usuarios] El departamento ${deptId} no existe en la base de datos`);
              }
            }
          } catch (errorDept) {
            logger.error(`[Usuarios] Error crítico al actualizar departamento para usuario ${id}: ${errorDept.message}`);
          }
        }
      }

      // Regla de negocio: si es (o será) funcionario, debe tener municipalidad
      const nextRolId = (id_rol !== undefined) ? id_rol : usuario.id_rol;
      const nextMunicipalidadId = (municipalidad_id !== undefined) ? municipalidad_id : usuario.municipalidad_id;
      if (nextRolId) {
        const rolActual = await require('../models').Rol.findByPk(nextRolId);
        if (rolActual && rolActual.nombre === 'secretaria de educación' && (nextMunicipalidadId === null || nextMunicipalidadId === undefined)) {
          throw new ApiError('La municipalidad es obligatoria para usuarios con rol secretaria de educación', 400);
        }
      }
      
      // Guardar los cambios
      await usuario.save();
      
      try { logger.info(`[Usuarios][UPDATE][SAVED] ${usuario.email}`); console.log('[DEBUG][USUARIOS][UPDATE][SAVED]', usuario.toJSON ? usuario.toJSON() : usuario); } catch (err) { console.error('Error silenciado:', err.message); }
      
      // Obtener el usuario actualizado (sin la contraseña)
      const usuarioActualizado = await Usuario.findByPk(id, {
        attributes: { exclude: ['password'] },
        include: [
          { 
            model: Municipalidad,
            attributes: ['id', 'nombre'] 
          },
          {
            model: require('../models').Rol,
            attributes: ['id', 'nombre']
          },
          {
            model: require('../models').Departamento,
            as: 'Departamentos',
            through: { attributes: [] }
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
      
      // Guardar información para el log
      const emailUsuario = usuario.email;
      
      // En lugar de borrar físicamente (usuario.destroy()), inactivamos al usuario
      usuario.estado = 'inactivo';
      await usuario.save();
      
      logger.info(`Usuario inactivado: ${emailUsuario}`);
      
      res.json({
        message: 'Usuario inactivado exitosamente (borrado lógico)'
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
      // Administradores y funcionarios pueden ver estadísticas
      if (!['administrador','superadministrador','funcionario'].includes(req.user.rol_nombre)) {
        throw new ApiError('No tienes permiso para ver estadísticas', 403);
      }
      const muniId = req.user?.municipalidad_id || null;
      const isAdmin = req.user.rol_nombre === 'administrador';
      const isFuncionario = req.user.rol_nombre === 'funcionario';
      const filterWhere = ((isAdmin || isFuncionario) && muniId) ? { municipalidad_id: muniId } : ((isAdmin || isFuncionario) ? { municipalidad_id: -1 } : {});

      // Si es administrador y no tiene municipalidad, devolver estadísticas vacías
      if ((isAdmin || isFuncionario) && !muniId) {
        return res.json({
          rolPorUsuario: [],
          estadoPorUsuario: [
            { estado: 'activo', dataValues: { total: 0 } },
            { estado: 'inactivo', dataValues: { total: 0 } }
          ],
          municipalidadPorUsuario: [],
          usuariosRecientes: []
        });
      }

      // Estadísticas por rol
      const { Rol } = require('../models');
      const rolStats = await Usuario.findAll({
        attributes: [
          'id_rol',
          [sequelize.fn('COUNT', sequelize.col('Usuario.id')), 'total']
        ],
        include: [{ model: Rol, attributes: ['nombre'] }],
        where: filterWhere,
        group: ['id_rol', 'Rol.id', 'Rol.nombre']
      });
      
      // Estadísticas por estado
      const estadoStats = await Usuario.findAll({
        attributes: [
          'estado',
          [sequelize.fn('COUNT', sequelize.col('Usuario.id')), 'total']
        ],
        where: filterWhere,
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
        where: filterWhere,
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
  ,
  getPerfilUsuario: async (req, res, next) => {
    try {
      const { Usuario, PerfilUsuario, Municipalidad, Rol, Departamento } = require('../models')
      const userId = req.user.id
      const user = await Usuario.findByPk(userId, { 
        include: [
          { model: Municipalidad, attributes: ['id','nombre'] }, 
          { model: Rol },
          { model: Departamento, as: 'Departamentos', attributes: ['id', 'nombre'], through: { attributes: [] } }
        ] 
      })
      if (!user) return res.status(404).json({ message: 'Usuario no encontrado' })
      const perfil = await PerfilUsuario.findOne({ where: { usuario_id: userId } })
      res.json({
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        role: (user.Rol && user.Rol.nombre) || req.user.rol_nombre,
        municipalidad_id: user.municipalidad_id || null,
        municipalidad_nombre: user.Municipalidad ? user.Municipalidad.nombre : null,
        departamentos: user.Departamentos || [],
        ultimo_login: user.ultimo_login || null,
        foto_url: perfil ? perfil.foto_url : null
      })
    } catch (error) { next(error) }
  },
  subirFotoPerfil: async (req, res, next) => {
    try {
      const { Usuario, PerfilUsuario } = require('../models')
      const userId = req.user.id
      const file = req.file
      if (!file) return res.status(400).json({ message: 'Archivo requerido' })
      const url = `/uploads/avatars/${file.filename}`

      let perfil = await PerfilUsuario.findOne({ where: { usuario_id: userId } })
      if (perfil) {
        perfil.foto_url = url
        try {
          const qi = require('../config/database').sequelize.getQueryInterface()
          const desc = await qi.describeTable('perfil_usuario')
          if (Object.prototype.hasOwnProperty.call(desc, 'rol')) {
            perfil.rol = (req.user?.rol_nombre || perfil.rol || '')
          }
        } catch (err) { console.error('Error silenciado:', err.message); }
        await perfil.save()
        return res.json({ foto_url: url })
      }

      let createData = { usuario_id: userId, foto_url: url }
      try {
        const user = await Usuario.findByPk(userId)
        const qi = require('../config/database').sequelize.getQueryInterface()
        const desc = await qi.describeTable('perfil_usuario')
        const hasCol = (c) => Object.prototype.hasOwnProperty.call(desc, c)
        if (hasCol('nombre_usuario')) createData.nombre_usuario = `${(user?.nombre||'').trim()} ${(user?.apellido||'').trim()}`.trim()
        if (hasCol('email')) createData.email = user?.email || ''
        if (hasCol('rol')) createData.rol = (req.user?.rol_nombre || '')
      } catch (err) { console.error('Error silenciado:', err.message); }

      await PerfilUsuario.create(createData)
      res.json({ foto_url: url })
    } catch (error) { next(error) }
  }
};

module.exports = usuariosController;
