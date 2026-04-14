const { Usuario, Rol, Municipalidad } = require('../models');
const nodemailer = require('nodemailer');
const { generateToken, verifyToken } = require('../config/jwt');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');
const { ApiError } = require('../middlewares/errorHandler');
const { cleanName } = require('../utils/text.utils');

/**
 * Controlador para el manejo de autenticación de usuarios
 */
const authController = {
  /**
   * Registra un nuevo usuario ciudadano en el sistema
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @param {Function} next - Función next de Express
   */
  register: async (req, res, next) => {
    try {
      const { nombre, apellido, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, email, password, rut, fechaNacimiento, fecha_nacimiento, celular, telefono, direccion } = req.body;

      // Verificar si el usuario ya existe
      const existingUser = await Usuario.findOne({ where: { email } });
      if (existingUser) {
        throw new ApiError('El correo electrónico ya está registrado', 400);
      }

      // Verificar si el RUT ya existe
      const existingRut = await Usuario.findOne({ where: { rut } });
      if (existingRut) {
        throw new ApiError('El RUT ya está registrado', 400);
      }

      // Crear el nuevo usuario (por defecto como ciudadano)
      const nombreConcatenado = (nombre && nombre.trim()) || [primer_nombre, segundo_nombre].filter(Boolean).join(' ').trim();
      const apellidoConcatenado = (apellido && apellido.trim()) || [primer_apellido, segundo_apellido].filter(Boolean).join(' ').trim();

      const rolCiudadano = await Rol.findOne({ where: { nombre: 'ciudadano' } });
      const newUser = await Usuario.create({
        nombre: cleanName(nombreConcatenado),
        apellido: cleanName(apellidoConcatenado),
        primer_nombre,
        segundo_nombre,
        primer_apellido,
        segundo_apellido,
        email,
        password, // El hash se genera automáticamente en el hook beforeCreate del modelo
        id_rol: rolCiudadano ? rolCiudadano.id : null,
        rut,
        fecha_nacimiento: fecha_nacimiento ?? fechaNacimiento ?? null,
        celular,
        telefono,
        direccion,
        estado: 'activo'
      });

      // Generar token JWT
      const token = generateToken({
        id: newUser.id,
        email: newUser.email,
        id_rol: newUser.id_rol,
        rol_nombre: 'ciudadano'
      });

      logger.info(`Usuario registrado: ${email}`);

      // Responder con los datos del usuario (sin la contraseña) y el token
      res.status(201).json({
        message: 'Usuario registrado exitosamente',
        user: {
          id: newUser.id,
          nombre: newUser.nombre,
          apellido: newUser.apellido,
          email: newUser.email,
          id_rol: newUser.id_rol,
          rol_nombre: 'ciudadano',
          rut: newUser.rut
        },
        token
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Inicia sesión de un usuario existente
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @param {Function} next - Función next de Express
   */
  login: async (req, res, next) => {
    try {
      const { email, password } = req.body;

      // Buscar el usuario por email (incluye rol y municipalidad)
      const user = await Usuario.findOne({ where: { email }, include: [{ model: Rol }, { model: Municipalidad, attributes: ['id', 'nombre'] }] });
      if (!user) {
        throw new ApiError('Credenciales inválidas', 401);
      }

      // Verificar si el usuario está activo
      if (user.estado !== 'activo') {
        throw new ApiError('Usuario inactivo o bloqueado', 403);
      }

      // Verificar la contraseña
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        // Credenciales inválidas, no persistimos intentos si la columna no existe
        throw new ApiError('Credenciales inválidas', 401);
      }

      // Resetear contador (si existiera) y actualizar último login
      user.ultimo_login = new Date();
      await user.save();

      // Generar token JWT
      const token = generateToken({
        id: user.id,
        email: user.email,
        id_rol: user.id_rol,
        rol_nombre: user.Rol ? user.Rol.nombre : null,
        municipalidad_id: user.municipalidad_id || null
      });

      logger.info(`Inicio de sesión exitoso: ${email}`);

      const rolNombre = user.Rol ? user.Rol.nombre : null;
      const rolNombreNorm = (rolNombre || '').toLowerCase();
      const esFuncionario = rolNombreNorm.includes('func') || 
                           rolNombreNorm.includes('secretaria') || 
                           rolNombreNorm.includes('secretaria') ||
                           rolNombreNorm.includes('tesorería');
      
      const portal = rolNombreNorm.includes('ciudadano') ? 'ciudadano'
        : (rolNombreNorm.includes('admin') && !rolNombreNorm.includes('super')) ? 'admin'
        : (rolNombreNorm.includes('super')) ? 'superadmin'
        : esFuncionario ? 'funcionario'
        : 'usuario';
      const redirect_path = portal === 'ciudadano' ? '/portal-ciudadano'
        : portal === 'admin' ? '/panel-admin'
        : portal === 'superadmin' ? '/panel-superadmin'
        : portal === 'funcionario' ? '/dashboard'
        : '/';

      const allowed_features = portal === 'superadmin'
        ? ['municipalidades', 'usuarios_admin']
        : portal === 'admin'
        ? ['dashboard_municipal', 'usuarios_funcionarios', 'tramites', 'pagos', 'proyectos']
        : portal === 'funcionario'
        ? ['dashboard_municipal', 'tramites', 'pagos']
        : ['portal_ciudadano'];

      // Responder con los datos del usuario (sin la contraseña) y el token
      res.json({
        message: 'Inicio de sesión exitoso',
        user: {
          id: user.id,
          nombre: user.nombre,
          apellido: user.apellido,
          email: user.email,
          id_rol: user.id_rol,
          rol_nombre: rolNombre,
          rut: user.rut,
          municipalidad_id: user.municipalidad_id || null,
          municipalidad_nombre: user.Municipalidad ? user.Municipalidad.nombre : null
        },
        token,
        portal,
        redirect_path,
        allowed_features
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Verifica si un token JWT es válido
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @param {Function} next - Función next de Express
   */
  verifyToken: async (req, res, next) => {
    try {
      const { token } = req.body;

      if (!token) {
        throw new ApiError('Token no proporcionado', 400);
      }

      // Verificar el token
      const decoded = verifyToken(token);

      // Buscar el usuario para asegurar que existe y está activo
      const user = await Usuario.findByPk(decoded.id, { include: [{ model: Rol }] });
      if (!user || user.estado !== 'activo') {
        throw new ApiError('Token inválido o usuario inactivo', 401);
      }

      const rolNombre = user.Rol ? user.Rol.nombre : null;
      const rolNombreNorm = (rolNombre || '').toLowerCase();
      const esFuncionario = rolNombreNorm.includes('func') || 
                           rolNombreNorm.includes('secretaria');

      const portal = rolNombreNorm.includes('ciudadano') ? 'ciudadano'
        : (rolNombreNorm.includes('admin') && !rolNombreNorm.includes('super')) ? 'admin'
        : (rolNombreNorm.includes('super')) ? 'superadmin'
        : esFuncionario ? 'funcionario'
        : 'usuario';
      const redirect_path = portal === 'ciudadano' ? '/portal-ciudadano'
        : portal === 'admin' ? '/panel-admin'
        : portal === 'superadmin' ? '/panel-superadmin'
        : portal === 'funcionario' ? '/dashboard'
        : '/';

      const allowed_features = portal === 'superadmin'
        ? ['municipalidades', 'usuarios_admin']
        : portal === 'admin'
        ? ['dashboard_municipal', 'usuarios_funcionarios', 'tramites', 'pagos', 'proyectos']
        : portal === 'funcionario'
        ? ['dashboard_municipal', 'tramites', 'pagos']
        : ['portal_ciudadano'];

      res.json({
        valid: true,
        user: {
          id: user.id,
          email: user.email,
          id_rol: user.id_rol,
          rol_nombre: rolNombre
        },
        portal,
        redirect_path,
        allowed_features
      });
    } catch (error) {
      // No usar next() aquí para evitar el manejo de errores global
      // Simplemente responder que el token no es válido
      res.status(401).json({
        valid: false,
        message: error.message || 'Token inválido'
      });
    }
  },

  /**
   * Obtiene el perfil del usuario autenticado
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @param {Function} next - Función next de Express
   */
  getProfile: async (req, res, next) => {
    try {
      // El middleware de autenticación ya ha verificado el token y añadido el usuario a req
      const userId = req.user.id;

      const user = await Usuario.findByPk(userId, {
        attributes: { exclude: ['password', 'token_recuperacion'] },
        include: [{ model: Rol }, { model: Municipalidad, attributes: ['id', 'nombre'] }]
      });

      if (!user) {
        const rolNombreReq = req.user.rol_nombre || null;
        if (rolNombreReq === 'administrador' || rolNombreReq === 'superadministrador') {
          return res.json({
            id: req.user.id,
            nombre: req.user.nombre || 'Administrador',
            apellido: req.user.apellido || 'Sistema',
            email: req.user.email || 'admin@sistema.com',
            rol_nombre: rolNombreReq,
            role: rolNombreReq,
            ultimo_login: req.user.ultimo_login || null,
            municipalidad_id: req.user.municipalidad_id || null,
            municipalidad_nombre: null
          });
        }
        throw new ApiError('Usuario no encontrado', 404);
      }

      const rolNombre = user.Rol ? user.Rol.nombre : req.user.rol_nombre || null;
      return res.json({
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        rol_nombre: rolNombre,
        role: rolNombre,
        ultimo_login: user.ultimo_login,
        municipalidad_id: user.municipalidad_id || null,
        municipalidad_nombre: user.Municipalidad ? user.Municipalidad.nombre : null
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Actualiza la contraseña del usuario autenticado
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @param {Function} next - Función next de Express
   */
  changePassword: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;

      const user = await Usuario.findByPk(userId);
      if (!user) {
        throw new ApiError('Usuario no encontrado', 404);
      }

      // Verificar la contraseña actual
      const isPasswordValid = await user.comparePassword(currentPassword);
      if (!isPasswordValid) {
        throw new ApiError('Contraseña actual incorrecta', 401);
      }

      // Actualizar la contraseña
      user.password = newPassword; // El hash se genera automáticamente en el hook beforeUpdate del modelo
      await user.save();

      logger.info(`Contraseña actualizada para el usuario: ${user.email}`);

      res.json({
        message: 'Contraseña actualizada exitosamente'
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Solicita un token para recuperación de contraseña
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @param {Function} next - Función next de Express
   */
  requestPasswordReset: async (req, res, next) => {
    try {
      const { email } = req.body;

      const user = await Usuario.findOne({ where: { email } });
      if (!user) {
        // Por seguridad, no revelar si el email existe o no
        return res.json({
          message: 'Si el correo existe, recibirás instrucciones para restablecer tu contraseña'
        });
      }

      // Generar token de recuperación
      const recoveryToken = await user.generateRecoveryToken();
      await user.save();

      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_PASS
        }
      });

      const appUrl = process.env.APP_BASE_URL || `http://localhost:${process.env.PORT || 3001}`;
      const mailOptions = {
        from: `"Sistema ERP Municipal" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: 'Recuperación de contraseña - Sistema ERP Municipal',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #f9f9f9;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #0d6efd; margin: 0;">Sistema ERP Municipal</h2>
              <p style="color: #6c757d; margin: 5px 0;">Gestión Municipal Inteligente</p>
            </div>
            <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
              <h3 style="color: #333; margin-top: 0;">Restablecimiento de Contraseña</h3>
              <p style="color: #555; line-height: 1.6;">
                Hemos recibido una solicitud para restablecer la contraseña de su cuenta en el <strong>Sistema ERP Municipal</strong>.
              </p>
              <p style="color: #555; line-height: 1.6;">
                Si usted realizó esta solicitud, haga clic en el siguiente botón para crear una nueva contraseña:
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${appUrl}/?resetToken=${encodeURIComponent(recoveryToken)}" style="background-color: #0d6efd; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 5px; font-weight: bold; display: inline-block;">Restablecer Contraseña</a>
              </div>
              <p style="color: #555; line-height: 1.6;">
                Este enlace será válido por <strong>15 minutos</strong>.
              </p>
              <p style="color: #777; font-size: 0.9em; margin-top: 20px; border-top: 1px solid #eee; padding-top: 15px;">
                Si usted no solicitó este cambio, puede ignorar este correo de forma segura. Su contraseña actual seguirá siendo válida.
              </p>
            </div>
            <div style="text-align: center; margin-top: 20px; color: #999; font-size: 0.8em;">
              &copy; ${new Date().getFullYear()} Sistema ERP Municipal. Todos los derechos reservados.
            </div>
          </div>
        `
      };

      try { await transporter.sendMail(mailOptions); } catch (e) { logger.warn('Fallo envío de email de recuperación', e); }
      logger.info(`Token de recuperación generado para: ${email}`);

      // Por ahora, solo devolvemos el token en la respuesta (solo para desarrollo)
      res.json({
        message: 'Si el correo existe, recibirás instrucciones para restablecer tu contraseña',
        // Solo incluir el token en ambiente de desarrollo
        ...(process.env.NODE_ENV === 'development' && { recoveryToken })
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Restablece la contraseña usando un token de recuperación
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @param {Function} next - Función next de Express
   */
  resetPassword: async (req, res, next) => {
    try {
      const { token, newPassword } = req.body;
      try { logger.info(`[Auth][RESET][REQ] token=${String(token).slice(0,8)}...`); } catch (err) { console.error('Error silenciado:', err.message); }

      // Buscar usuario con ese token de recuperación
      const user = await Usuario.findOne({ where: { token_recuperacion: token } });
      if (!user) {
        throw new ApiError('Token inválido o expirado', 400);
      }

      // Verificar que el token no haya expirado (usando expiracion_token)
      const expDate = user.expiracion_token ? new Date(user.expiracion_token) : null;
      const now = new Date();

      if (!expDate || now > expDate) {
        // Limpiar el token expirado
        user.token_recuperacion = null;
        user.expiracion_token = null;
        await user.save();
        throw new ApiError('Token expirado', 400);
      }

      // Actualizar contraseña y limpiar token
      user.password = newPassword; // El hash se genera automáticamente
      user.token_recuperacion = null;
      user.expiracion_token = null;
      await user.save();
      try { const ok = await user.comparePassword(newPassword); logger.info(`[Auth][RESET][SAVED] email=${user.email} hash_ok=${ok}`); } catch (err) { console.error('Error silenciado:', err.message); }

      // Sincronizar también con Ciudadano si existe un registro con el mismo email
      try {
        const { Ciudadano } = require('../models');
        const ciudadano = await Ciudadano.findOne({ where: { email: user.email } });
        if (ciudadano) {
          ciudadano.password = newPassword; // hash por hook beforeUpdate
          ciudadano.token_verificacion = null;
          await ciudadano.save();
          try { const ok2 = await ciudadano.comparePassword(newPassword); logger.info(`[Auth][RESET][SYNC-CIUDADANO] email=${user.email} hash_ok=${ok2}`); } catch (err) { console.error('Error silenciado:', err.message); }
        }
      } catch (syncErr) {
        logger.warn('No se pudo sincronizar password de Usuario a Ciudadano:', syncErr);
      }

      logger.info(`Contraseña restablecida para: ${user.email}`);

      res.json({
        message: 'Contraseña restablecida correctamente'
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Restablecimiento directo por email (sin token)
   * @param {Object} req
   * @param {Object} res
   * @param {Function} next
   */
  resetPasswordDirect: async (req, res, next) => {
    try {
      const { email, newPassword } = req.body;

      // Buscar usuario por email
      const user = await Usuario.findOne({ where: { email } });

      // Por seguridad, respondemos éxito aun si no existe
      if (!user) {
        logger.info(`Solicitud de reset directa para email no registrado: ${email}`);
        return res.json({ message: 'Si el correo existe, la contraseña fue actualizada' });
      }

      // Actualizar contraseña y limpiar tokens de recuperación
      user.password = newPassword; // hash por hook beforeUpdate
      user.token_recuperacion = null;
      user.expiracion_token = null;
      await user.save();

      logger.info(`Contraseña actualizada directamente para: ${email}`);
      res.json({ message: 'Contraseña actualizada exitosamente' });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Cierra la sesión del usuario (solo en el cliente)
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   */
  logout: (req, res) => {
    // JWT es stateless, por lo que el cierre de sesión se maneja en el cliente
    // eliminando el token. Este endpoint es principalmente para fines de registro.
    logger.info(`Cierre de sesión: ${req.user?.email || 'Usuario desconocido'}`);
    
    res.json({
      message: 'Sesión cerrada exitosamente'
    });
  }
};

module.exports = authController;
