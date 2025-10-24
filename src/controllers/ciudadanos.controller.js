const { Ciudadano, Usuario } = require('../models');
const { generateToken } = require('../config/jwt');
const logger = require('../utils/logger');
const { ApiError } = require('../middlewares/errorHandler');

/**
 * Controlador para el manejo de ciudadanos
 */
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

      // Asegurar sincronización con la tabla usuarios (role: ciudadano)
      const nombre = [primer_nombre, segundo_nombre].filter(Boolean).join(' ').trim();
      const apellido = [apellido_paterno, apellido_materno].filter(Boolean).join(' ').trim();

      const existingUsuarioByEmail = await Usuario.findOne({ where: { email } });
      const existingUsuarioByRut = await Usuario.findOne({ where: { rut } });

      if (!existingUsuarioByEmail && !existingUsuarioByRut) {
        await Usuario.create(
          {
            nombre,
            apellido,
            email,
            rut,
            telefono,
            direccion,
            password, // Se hashea por hook en Usuario
            role: 'ciudadano',
            estado: 'activo'
          },
          { fields: ['nombre','apellido','email','rut','telefono','direccion','password','role','estado'] }
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
        attributes: ['id','email','password','role','estado','nombre','apellido','rut','telefono']
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

        usuario = await Usuario.create(
          {
            nombre: nombreSync,
            apellido: apellidoSync,
            email: ciudadano.email,
            rut: ciudadano.rut,
            telefono: ciudadano.telefono,
            direccion: ciudadano.direccion,
            password, // se hashea por hook
            role: 'ciudadano',
            estado: 'activo'
          },
          { fields: ['nombre','apellido','email','rut','telefono','direccion','password','role','estado'] }
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
        if (!usuario.role) {
          usuario.role = 'ciudadano';
          await usuario.save();
        }

        // Evitar que funcionarios/admin inicien por este endpoint
        if (usuario.role !== 'ciudadano') {
          throw new ApiError('Este endpoint es solo para ciudadanos', 403);
        }
      }

      // Generar token con id de usuarios
      const token = generateToken({
        id: usuario.id,
        email: usuario.email,
        role: 'ciudadano',
        tipo: 'ciudadano'
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
          role: 'ciudadano',
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

      // Generar token de recuperación
      const resetToken = ciudadano.generateVerificationToken();
      await ciudadano.save();

      // TODO: Aquí se debería enviar un email con el token
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

      const ciudadano = await Ciudadano.findOne({ 
        where: { token_verificacion: token } 
      });

      if (!ciudadano) {
        throw new ApiError('Token de recuperación inválido o expirado', 400);
      }

      // Actualizar la contraseña
      ciudadano.password = password; // El hash se genera automáticamente
      ciudadano.token_verificacion = null;
      await ciudadano.save();

      logger.info(`Contraseña restablecida para: ${ciudadano.email}`);

      res.json({
        success: true,
        message: 'Contraseña restablecida exitosamente'
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