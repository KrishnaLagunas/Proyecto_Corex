const Joi = require('joi');

/**
 * Validaciones para ciudadanos
 */

// Patrón estricto para RUT chileno (formato: 12345678-9)
const rutPattern = /^\d{8}-[\dkK]$/;

// Validación de dígito verificador (módulo 11)
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
  'rut.digitoVerificador': 'El dígito verificador del RUT no es válido',
  'any.required': 'El RUT es obligatorio'
});

// Validación para nombres
const nombreValidation = Joi.string()
  .min(2)
  .max(50)
  .pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
  .required()
  .messages({
    'string.min': 'El nombre debe tener al menos 2 caracteres',
    'string.max': 'El nombre no puede exceder 50 caracteres',
    'string.pattern.base': 'El nombre solo puede contener letras y espacios',
    'any.required': 'Este campo es obligatorio'
  });

// Validación para segundo nombre (opcional)
const segundoNombreValidation = Joi.string()
  .min(2)
  .max(50)
  .pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
  .allow('')
  .optional()
  .messages({
    'string.min': 'El segundo nombre debe tener al menos 2 caracteres',
    'string.max': 'El segundo nombre no puede exceder 50 caracteres',
    'string.pattern.base': 'El segundo nombre solo puede contener letras y espacios'
  });

// Validación para apellidos
const apellidoValidation = Joi.string()
  .min(2)
  .max(50)
  .pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
  .required()
  .messages({
    'string.min': 'El apellido debe tener al menos 2 caracteres',
    'string.max': 'El apellido no puede exceder 50 caracteres',
    'string.pattern.base': 'El apellido solo puede contener letras y espacios',
    'any.required': 'Este campo es obligatorio'
  });

// Teléfono obligatorio sin formato específico
const telefonoValidation = Joi.string()
  .required()
  .messages({
    'any.required': 'El teléfono es obligatorio'
  });

// Email obligatorio sin formato específico
const emailValidation = Joi.string()
  .required()
  .messages({
    'any.required': 'El correo electrónico es obligatorio'
  });

// Dirección obligatoria sin formato específico
const direccionValidation = Joi.string()
  .required()
  .messages({
    'any.required': 'La dirección es obligatoria'
  });

// Validación para region_id
const regionIdValidation = Joi.number()
  .integer()
  .required()
  .messages({
    'any.required': 'La región es obligatoria',
    'number.base': 'El id de región debe ser numérico'
  });

// Validación para comuna_id
const comunaIdValidation = Joi.number()
  .integer()
  .required()
  .messages({
    'any.required': 'La comuna es obligatoria',
    'number.base': 'El id de comuna debe ser numérico'
  });

// Validación para contraseña
const passwordValidation = Joi.string()
  .min(6)
  .max(50)
  .required()
  .messages({
    'string.min': 'La contraseña debe tener al menos 6 caracteres',
    'string.max': 'La contraseña no puede exceder 50 caracteres',
    'any.required': 'La contraseña es obligatoria'
  });

/**
 * Esquemas de validación para ciudadanos
 */
const ciudadanoSchemas = {
  // Validación para registro de ciudadano
  register: Joi.object({
    primer_nombre: nombreValidation,
    segundo_nombre: segundoNombreValidation,
    apellido_paterno: apellidoValidation,
    apellido_materno: apellidoValidation,
    rut: rutValidation,
    telefono: telefonoValidation,
    email: emailValidation,
    direccion: direccionValidation,
    region_id: regionIdValidation,
    comuna_id: comunaIdValidation,
    password: passwordValidation,
    confirm_password: Joi.string()
      .valid(Joi.ref('password'))
      .required()
      .messages({
        'any.only': 'Las contraseñas no coinciden',
        'any.required': 'Debe confirmar la contraseña'
      })
  }),

  // Validación para login de ciudadano
  login: Joi.object({
    email: emailValidation,
    password: Joi.string().required().messages({
      'any.required': 'La contraseña es obligatoria'
    })
  }),

  // Validación para verificación de cuenta
  verify: Joi.object({
    token: Joi.string().required().messages({
      'any.required': 'El token de verificación es obligatorio'
    })
  }),

  // Validación para solicitud de recuperación de contraseña
  requestReset: Joi.object({
    email: emailValidation
  }),

  // Validación para restablecimiento de contraseña
  resetPassword: Joi.object({
    token: Joi.string().required().messages({
      'any.required': 'El token de recuperación es obligatorio'
    }),
    password: passwordValidation,
    confirm_password: Joi.string()
      .valid(Joi.ref('password'))
      .required()
      .messages({
        'any.only': 'Las contraseñas no coinciden',
        'any.required': 'Debe confirmar la contraseña'
      })
  }),

  // Validación para restablecimiento directo por email (sin token)
  resetPasswordDirect: Joi.object({
    email: emailValidation,
    newPassword: passwordValidation,
    confirmPassword: Joi.string()
      .valid(Joi.ref('newPassword'))
      .required()
      .messages({
        'any.only': 'Las contraseñas no coinciden',
        'any.required': 'Debe confirmar la contraseña'
      })
  })
};

module.exports = {
  ciudadanoSchemas
};