const Joi = require('joi');

// Mensajes de error personalizados en español
const customMessages = {
  'string.empty': '{#label} no puede estar vacío',
  'string.min': '{#label} debe tener al menos {#limit} caracteres',
  'string.max': '{#label} no debe exceder los {#limit} caracteres',
  'string.email': '{#label} debe ser un correo electrónico válido',
  'string.pattern.base': '{#label} no cumple con el formato requerido',
  'any.required': '{#label} es un campo requerido',
  'any.only': '{#label} debe ser {#valids}',
  'string.alphanum': '{#label} debe contener solo caracteres alfanuméricos',
  'object.unknown': 'No se permiten campos adicionales'
};

// Patrón estricto para RUT chileno (formato: 12345678-9, exactamente 8 dígitos)
const rutPattern = /^\d{8}-[\dkK]$/;

// Valida el dígito verificador del RUT (módulo 11)
const validarDigitoVerificador = (rut) => {
  const rutLimpio = rut.replace(/\./g, '').replace('-', '');
  const cuerpo = rutLimpio.slice(0, -1);
  const dv = rutLimpio.slice(-1).toLowerCase();

  let suma = 0;
  let multiplicador = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i], 10) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }
  const resto = suma % 11;
  const dvCalculado = resto === 0 ? '0' : resto === 1 ? 'k' : (11 - resto).toString();
  return dv === dvCalculado;
};

// Validación personalizada para RUT chileno estricto
const rutValidation = Joi.string().custom((value, helpers) => {
  if (!rutPattern.test(value)) {
    return helpers.error('rut.formato');
  }
  const cuerpo = value.split('-')[0];
  if (cuerpo.length !== 8) {
    return helpers.error('rut.longitudExacta');
  }
  if (!validarDigitoVerificador(value)) {
    return helpers.error('rut.digitoVerificador');
  }
  return value;
}).messages({
  'rut.formato': 'El RUT debe tener el formato 12345678-9 (sin puntos, con guión)',
  'rut.longitudExacta': 'El RUT debe tener exactamente 8 dígitos antes del guión',
  'rut.digitoVerificador': 'El dígito verificador del RUT no es válido'
});

// Expresión regular para contraseñas seguras
// Al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial
// Reglas de contraseña: al menos una mayúscula, una minúscula, un número y un símbolo
// Símbolos permitidos ampliados para admitir puntos y otros caracteres comunes
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-\[\]{};:'",.<>/?`~|=])[A-Za-z\d!@#$%^&*()_+\-\[\]{};:'",.<>/?`~|=]{8,}$/;

/**
 * Esquemas de validación para las rutas de autenticación
 */
const authSchemas = {
  /**
   * Esquema para registro de usuarios
   */
  register: Joi.object({
    // Permitir nombre/apellido combinados u opciones separadas
    nombre: Joi.string().min(2).max(50).messages(customMessages),
    apellido: Joi.string().min(2).max(50).messages(customMessages),

    primer_nombre: Joi.string().min(2).max(50).messages(customMessages),
    segundo_nombre: Joi.string().min(2).max(50).allow('', null).messages(customMessages),
    primer_apellido: Joi.string().min(2).max(50).messages(customMessages),
    segundo_apellido: Joi.string().min(2).max(50).allow('', null).messages(customMessages),

    email: Joi.string().email().required().messages(customMessages),
    password: Joi.string().min(8).pattern(passwordRegex).required().messages({
      ...customMessages,
      'string.pattern.base': 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial'
    }),
    rut: rutValidation.required(),
    telefono: Joi.string().min(8).max(15).allow(null, '').messages(customMessages),
    direccion: Joi.string().min(5).max(200).allow(null, '').messages(customMessages),
    celular: Joi.string().min(8).max(15).allow(null, '').messages(customMessages),
    fecha_nacimiento: Joi.date().iso().allow(null).messages(customMessages),
    fechaNacimiento: Joi.date().iso().allow(null).messages(customMessages),
    municipalidad_id: Joi.number().integer().positive().allow(null).messages(customMessages)
  })
  .or('nombre', 'primer_nombre')
  .or('apellido', 'primer_apellido', 'segundo_apellido'),

  /**
   * Esquema para inicio de sesión
   */
  login: Joi.object({
    email: Joi.string().email().required().messages(customMessages),
    password: Joi.string().required().messages(customMessages)
  }),

  /**
   * Esquema para cambio de contraseña
   */
  changePassword: Joi.object({
    currentPassword: Joi.string().required().messages({
      ...customMessages,
      'string.empty': 'La contraseña actual no puede estar vacía',
      'any.required': 'La contraseña actual es requerida'
    }),
    newPassword: Joi.string().min(8).pattern(passwordRegex).required().messages({
      ...customMessages,
      'string.pattern.base': 'La nueva contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial'
    }),
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
      ...customMessages,
      'any.only': 'Las contraseñas no coinciden'
    })
  }),

  /**
   * Esquema para solicitud de restablecimiento de contraseña
   */
  requestReset: Joi.object({
    email: Joi.string().email().required().messages(customMessages)
  }),

  /**
   * Esquema para restablecimiento de contraseña
   */
  resetPassword: Joi.object({
    token: Joi.string().required().messages({
      ...customMessages,
      'string.empty': 'El token no puede estar vacío',
      'any.required': 'El token es requerido'
    }),
    newPassword: Joi.string().min(8).pattern(passwordRegex).required().messages({
      ...customMessages,
      'string.pattern.base': 'La nueva contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial'
    }),
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
      ...customMessages,
      'any.only': 'Las contraseñas no coinciden'
    })
  }),

  /**
   * Esquema para restablecimiento directo por email (sin token)
   */
  resetPasswordDirect: Joi.object({
    email: Joi.string().email().required().messages(customMessages),
    newPassword: Joi.string().min(8).pattern(passwordRegex).required().messages({
      ...customMessages,
      'string.pattern.base': 'La nueva contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial'
    }),
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
      ...customMessages,
      'any.only': 'Las contraseñas no coinciden'
    })
  }),

  /**
   * Esquema para creación de usuarios por administradores
   */
  createUser: Joi.object({
    nombre: Joi.string().min(2).max(50).required().messages(customMessages),
    apellido: Joi.string().min(2).max(50).required().messages(customMessages),
    email: Joi.string().email().required().messages(customMessages),
    password: Joi.string().min(8).pattern(passwordRegex).required().messages({
      ...customMessages,
      'string.pattern.base': 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial'
    }),
    id_rol: Joi.number().integer().min(1).required().messages(customMessages),
    rut: rutValidation.required(),
    telefono: Joi.string().min(8).max(15).required().messages(customMessages),
    direccion: Joi.string().min(5).max(200).required().messages(customMessages),
    departamento_id: Joi.number().integer().positive().allow(null).messages(customMessages)
  })
};

module.exports = {
  authSchemas
};
