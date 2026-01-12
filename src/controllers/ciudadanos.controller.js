const { Ciudadano, Usuario, Rol } = require('../models');
const { generateToken } = require('../config/jwt');
const logger = require('../utils/logger');
const { ApiError } = require('../middlewares/errorHandler');

/**
 * Controlador para el manejo de ciudadanos
 */
const nodemailer = require('nodemailer');
const ciudadanosController = {
  /**
   * Registra un nuevo ciudadano en el portal
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @param {Function} next - Función next de Express
   */
  register: async (req, res, next) => {
    try {
      const { 
        primer_nombre, 
        segundo_nombre, 
        apellido_paterno, 
        apellido_materno, 
        rut, 
        telefono, 
        email, 
        direccion,
        region_id,
        comuna_id,
        password 
      } = req.body;

      // Verificar si el ciudadano ya existe por email
      const existingEmail = await Ciudadano.findOne({ where: { email } });
      if (existingEmail) {
        throw new ApiError('El correo electrónico ya está registrado', 400);
      }

      // Verificar si el RUT ya existe
      const existingRut = await Ciudadano.findOne({ where: { rut } });
      if (existingRut) {
        throw new ApiError('El RUT ya está registrado', 400);
      }

      // Crear el nuevo ciudadano
      const newCiudadano = await Ciudadano.create({
        primer_nombre,
        segundo_nombre,
        apellido_paterno,
        apellido_materno,
        rut,
        telefono,
        email,
        direccion,
        region_id,
        comuna_id,
        password, // El hash se genera automáticamente en el hook beforeCreate del modelo
        estado: 'activo' // Por ahora activamos directamente, después se puede implementar verificación por email
      });

      // Generar token de verificación (para futuras implementaciones)
      newCiudadano.generateVerificationToken();
      await newCiudadano.save();

      // Asegurar sincronización con la tabla usuarios (rol: ciudadano)
      const nombre = [primer_nombre, segundo_nombre].filter(Boolean).join(' ').trim();
      const apellido = [apellido_paterno, apellido_materno].filter(Boolean).join(' ').trim();

      const existingUsuarioByEmail = await Usuario.findOne({ where: { email } });
      const existingUsuarioByRut = await Usuario.findOne({ where: { rut } });

      if (!existingUsuarioByEmail && !existingUsuarioByRut) {
        const rolCiudadano = await Rol.findOne({ where: { nombre: 'ciudadano' } });
        await Usuario.create(
          {
            nombre,
            apellido,
            email,
            rut,
            telefono,
            direccion,
            password, // Se hashea por hook en Usuario
            id_rol: rolCiudadano ? rolCiudadano.id : null,
            estado: 'activo'
          },
          { fields: ['nombre','apellido','email','rut','telefono','direccion','password','id_rol','estado'] }
        );
      }

      logger.info(`Nuevo ciudadano registrado: ${email} (sincronizado con usuarios)`);

      // Respuesta exitosa (sin incluir la contraseña)
      const ciudadanoResponse = {
        id: newCiudadano.id,
        primer_nombre: newCiudadano.primer_nombre,
        segundo_nombre: newCiudadano.segundo_nombre,
        apellido_paterno: newCiudadano.apellido_paterno,
        apellido_materno: newCiudadano.apellido_materno,
        rut: newCiudadano.rut,
        telefono: newCiudadano.telefono,
        email: newCiudadano.email,
        estado: newCiudadano.estado,
        nombre_completo: newCiudadano.getNombreCompleto()
      };

      res.status(201).json({
        success: true,
        message: 'Ciudadano registrado exitosamente',
        data: ciudadanoResponse
      });

    } catch (error) {
      logger.error('Error en registro de ciudadano:', error);
      next(error);
    }
  },

  /**
   * Inicia sesión de un ciudadano
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @param {Function} next - Función next de Express
   */
  login: async (req, res, next) => {
    try {
      const { email, password } = req.body;

      // Intentar autenticar contra Usuarios por email (independiente del rol)
      let usuario = await Usuario.findOne({ 
        where: { email },
        attributes: ['id','email','password','id_rol','estado','nombre','apellido','rut','telefono'],
        include: [{ model: Rol }]
      });

      if (!usuario) {
        // Fallback: autenticar contra Ciudadanos y sincronizar si corresponde
        const ciudadano = await Ciudadano.findOne({ where: { email } });
        if (!ciudadano) {
          throw new ApiError('Credenciales inválidas', 401);
        }

        if (ciudadano.estado !== 'activo') {
          throw new ApiError('Cuenta inactiva. Contacte al administrador.', 401);
        }

        const ok = await ciudadano.comparePassword(password);
        if (!ok) {
          throw new ApiError('Credenciales inválidas', 401);
        }

        // Crear usuario sincronizado si no existe
        const nombreSync = [ciudadano.primer_nombre, ciudadano.segundo_nombre].filter(Boolean).join(' ').trim();
        const apellidoSync = [ciudadano.apellido_paterno, ciudadano.apellido_materno].filter(Boolean).join(' ').trim();

        const rolCiudadanoLogin = await Rol.findOne({ where: { nombre: 'ciudadano' } });
        usuario = await Usuario.create(
          {
            nombre: nombreSync,
            apellido: apellidoSync,
            email: ciudadano.email,
            rut: ciudadano.rut,
            telefono: ciudadano.telefono,
            direccion: ciudadano.direccion,
            password, // se hashea por hook
            id_rol: rolCiudadanoLogin ? rolCiudadanoLogin.id : null,
            estado: 'activo'
          },
          { fields: ['nombre','apellido','email','rut','telefono','direccion','password','id_rol','estado'] }
        );
      } else {
        // Validar contraseña desde Usuario
        const ok = await usuario.comparePassword(password);
        if (!ok) {
          throw new ApiError('Credenciales inválidas', 401);
        }

        if (usuario.estado !== 'activo') {
          throw new ApiError('Cuenta inactiva. Contacte al administrador.', 401);
        }

        // Si el usuario existe sin rol establecido, fijarlo como ciudadano tras login
        if (!usuario.id_rol) {
          const rolCiudadanoFix = await Rol.findOne({ where: { nombre: 'ciudadano' } });
          usuario.id_rol = rolCiudadanoFix ? rolCiudadanoFix.id : null;
          await usuario.save();
        }

        // Evitar que funcionarios/admin inicien por este endpoint
        if ((usuario.Rol && usuario.Rol.nombre !== 'ciudadano') || (!usuario.Rol && usuario.id_rol === null)) {
          throw new ApiError('Este endpoint es solo para ciudadanos', 403);
        }
      }

      // Generar token con id de usuarios
      const token = generateToken({
        id: usuario.id,
        email: usuario.email,
        id_rol: usuario.id_rol,
        rol_nombre: 'ciudadano'
      });

      logger.info(`Ciudadano autenticado: ${email} (usuario_id=${usuario.id})`);

      // Respuesta homogénea
      res.json({
        success: true,
        message: 'Inicio de sesión exitoso',
        token,
        user: {
          id: usuario.id,
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          email: usuario.email,
          rut: usuario.rut,
          telefono: usuario.telefono,
          id_rol: usuario.id_rol,
          rol_nombre: 'ciudadano',
          estado: usuario.estado,
          nombre_completo: [usuario.nombre, usuario.apellido].filter(Boolean).join(' ').trim()
        }
      });

    } catch (error) {
      logger.error('Error en login de ciudadano:', error);
      next(error);
    }
  },

  /**
   * Verifica la cuenta de un ciudadano usando el token de verificación
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @param {Function} next - Función next de Express
   */
  verifyAccount: async (req, res, next) => {
    try {
      const { token } = req.body;

      // Buscar el ciudadano por token de verificación
      const ciudadano = await Ciudadano.findOne({ 
        where: { token_verificacion: token } 
      });

      if (!ciudadano) {
        throw new ApiError('Token de verificación inválido', 400);
      }

      // Activar la cuenta
      ciudadano.estado = 'activo';
      ciudadano.fecha_verificacion = new Date();
      ciudadano.token_verificacion = null;
      await ciudadano.save();

      logger.info(`Cuenta verificada: ${ciudadano.email}`);

      res.json({
        success: true,
        message: 'Cuenta verificada exitosamente'
      });

    } catch (error) {
      logger.error('Error en verificación de cuenta:', error);
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

      const ciudadano = await Ciudadano.findOne({ where: { email } });
      if (!ciudadano) {
        // Por seguridad, no revelamos si el email existe o no
        return res.json({
          success: true,
          message: 'Si el correo existe, recibirás instrucciones para restablecer tu contraseña'
        });
      }

      const crypto = require('crypto');
      const raw = crypto.randomBytes(32).toString('hex');
      const exp = Math.floor((Date.now() + 15 * 60 * 1000) / 1000);
      const resetToken = `${raw}.${exp}`;
      ciudadano.token_verificacion = resetToken;
      await ciudadano.save();

      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS }
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
                <a href="${appUrl}/?resetToken=${encodeURIComponent(resetToken)}" style="background-color: #0d6efd; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 5px; font-weight: bold; display: inline-block;">Restablecer Contraseña</a>
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
      try { await transporter.sendMail(mailOptions); } catch (e) { logger.warn('Fallo envío email recuperación ciudadano', e); }
      logger.info(`Token de recuperación generado para: ${email}`);

      res.json({
        success: true,
        message: 'Si el correo existe, recibirás instrucciones para restablecer tu contraseña'
      });

    } catch (error) {
      logger.error('Error en solicitud de recuperación:', error);
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
      const { token, password } = req.body;
      try { logger.info(`[Ciudadanos][RESET][REQ] token=${String(token).slice(0,8)}...`); } catch(_) {}

      const ciudadano = await Ciudadano.findOne({ where: { token_verificacion: token } });
      if (!ciudadano) {
        throw new ApiError('Token de recuperación inválido o expirado', 400);
      }

      const parts = (token || '').split('.');
      if (parts.length === 2) {
        const expSec = parseInt(parts[1], 10);
        const nowSec = Math.floor(Date.now() / 1000);
        if (!expSec || nowSec > expSec) {
          ciudadano.token_verificacion = null;
          await ciudadano.save();
          throw new ApiError('Token expirado', 400);
        }
      }

      // Actualizar la contraseña
      ciudadano.password = password; // El hash se genera automáticamente
      ciudadano.token_verificacion = null;
      await ciudadano.save();
      try { const ok = await ciudadano.comparePassword(password); logger.info(`[Ciudadanos][RESET][SAVED] email=${ciudadano.email} hash_ok=${ok}`); } catch(_) {}

      // Sincronizar también con Usuarios si existe un registro con el mismo email
      try {
        const usuario = await Usuario.findOne({ where: { email: ciudadano.email } });
        if (usuario) {
          usuario.password = password; // hash por hook beforeUpdate
          usuario.token_recuperacion = null;
          usuario.expiracion_token = null;
          await usuario.save();
          try { const ok2 = await usuario.comparePassword(password); logger.info(`[Ciudadanos][RESET][SYNC-USUARIO] email=${ciudadano.email} hash_ok=${ok2}`); } catch(_) {}
        }
      } catch (syncErr) {
        logger.warn('No se pudo sincronizar password de Ciudadano a Usuario:', syncErr);
      }

      logger.info(`Contraseña restablecida para: ${ciudadano.email}`);

      res.json({
        success: true,
        message: 'Contraseña restablecida correctamente'
      });

    } catch (error) {
      logger.error('Error en restablecimiento de contraseña:', error);
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

      // Intentar actualizar en Ciudadano
      const ciudadano = await Ciudadano.findOne({ where: { email } });

      // Intentar actualizar en Usuario para mantener sincronización
      const usuario = await Usuario.findOne({ where: { email } });

      if (!ciudadano && !usuario) {
        // Por seguridad, respuesta genérica
        logger.info(`Reset directo solicitado para email no registrado: ${email}`);
        return res.json({ success: true, message: 'Si el correo existe, la contraseña fue actualizada' });
      }

      if (ciudadano) {
        ciudadano.password = newPassword; // hash por hook
        ciudadano.token_verificacion = null;
        await ciudadano.save();
      }

      if (usuario) {
        usuario.password = newPassword; // hash por hook
        usuario.token_recuperacion = null;
        usuario.expiracion_token = null;
        await usuario.save();
      }

      logger.info(`Contraseña actualizada directamente para: ${email}`);
      res.json({ success: true, message: 'Contraseña actualizada exitosamente' });
    } catch (error) {
      logger.error('Error en reset directo de contraseña:', error);
      next(error);
    }
  }
};

module.exports = ciudadanosController;
