const Joi = require('joi');

// Mensajes de error personalizados en español
const mensajesError = {
  'string.empty': 'El campo {#label} no puede estar vacío',
  'string.min': 'El campo {#label} debe tener al menos {#limit} caracteres',
  'string.max': 'El campo {#label} debe tener como máximo {#limit} caracteres',
  'string.email': 'El campo {#label} debe ser un correo electrónico válido',
  'number.base': 'El campo {#label} debe ser un número',
  'number.min': 'El campo {#label} debe ser mayor o igual a {#limit}',
  'number.max': 'El campo {#label} debe ser menor o igual a {#limit}',
  'number.integer': 'El campo {#label} debe ser un número entero',
  'date.base': 'El campo {#label} debe ser una fecha válida',
  'date.min': 'El campo {#label} debe ser posterior a {#limit}',
  'date.max': 'El campo {#label} debe ser anterior a {#limit}',
  'boolean.base': 'El campo {#label} debe ser un valor booleano',
  'any.required': 'El campo {#label} es obligatorio',
  'any.only': 'El campo {#label} debe ser uno de los siguientes valores: {#valids}',
  'object.unknown': 'No se permiten campos adicionales',
  'array.base': 'El campo {#label} debe ser un arreglo',
  'array.min': 'El campo {#label} debe tener al menos {#limit} elementos',
  'array.max': 'El campo {#label} debe tener como máximo {#limit} elementos',
  'string.pattern.base': 'El campo {#label} no cumple con el formato requerido'
};

// Patrón para validar RUT chileno (formato: 12345678-9, exactamente 8 dígitos antes del guión)
const rutPattern = /^\d{8}-[\dkK]$/;

// Función para validar dígito verificador del RUT
const validarDigitoVerificador = (rut) => {
  const rutLimpio = rut.replace(/\./g, '').replace('-', '');
  const cuerpo = rutLimpio.slice(0, -1);
  const dv = rutLimpio.slice(-1).toLowerCase();
  
  let suma = 0;
  let multiplicador = 2;
  
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i]) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }
  
  const resto = suma % 11;
  const dvCalculado = resto === 0 ? '0' : resto === 1 ? 'k' : (11 - resto).toString();
  
  return dv === dvCalculado;
};

// Validación personalizada para RUT
const rutValidation = Joi.string().custom((value, helpers) => {
  // Verificar formato básico
  if (!rutPattern.test(value)) {
    return helpers.error('rut.formato');
  }
  
  // Verificar que tenga exactamente 8 dígitos antes del guión
  const cuerpo = value.split('-')[0];
  if (cuerpo.length !== 8) {
    return helpers.error('rut.longitudExacta');
  }
  
  // Verificar dígito verificador
  if (!validarDigitoVerificador(value)) {
    return helpers.error('rut.digitoVerificador');
  }
  
  return value;
}).messages({
  'rut.formato': 'El RUT debe tener el formato 12345678-9 (sin puntos, con guión)',
  'rut.longitudExacta': 'El RUT debe tener exactamente 8 dígitos antes del guión',
  'rut.digitoVerificador': 'El dígito verificador del RUT no es válido'
});

// Patrón para validar contraseñas seguras (incluye . como carácter especial permitido)
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#.])[A-Za-z\d@$!%*?&#.]{8,}$/;

// Esquema para validar el parámetro ID
const idSchema = Joi.object({
  id: Joi.alternatives().try(
    Joi.number().integer().min(1),
    Joi.string().pattern(/^\d+$/)
  ).required().messages({
    ...mensajesError,
    'alternatives.match': 'id debe ser un número válido'
  })
});

// Esquema para validar los parámetros de consulta
const usuarioQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).messages(mensajesError),
  limit: Joi.number().integer().min(1).max(100).messages(mensajesError),
  role: Joi.string().valid('admin', 'funcionario', 'ciudadano').messages(mensajesError),
  departamento_id: Joi.number().integer().min(1).messages(mensajesError),
  estado: Joi.string().valid('activo', 'inactivo', 'bloqueado').messages(mensajesError),
  search: Joi.string().min(1).max(100).messages(mensajesError),
  sort: Joi.string().valid('createdAt', 'nombre', 'apellido', 'email', 'role', 'estado').messages(mensajesError),
  order: Joi.string().valid('ASC', 'DESC', 'asc', 'desc').messages(mensajesError)
}).messages(mensajesError);

// Esquema para validar la creación de un usuario (con nombres/apellidos separados)
const createUsuarioSchema = Joi.object({
  primer_nombre: Joi.string().min(2).max(100).required().messages(mensajesError),
  segundo_nombre: Joi.string().min(2).max(100).allow('').messages(mensajesError),
  primer_apellido: Joi.string().min(2).max(100).required().messages(mensajesError),
  segundo_apellido: Joi.string().min(2).max(100).allow('').messages(mensajesError),
  // Compatibilidad: permitir nombre/apellido combinados opcionalmente
  nombre: Joi.string().min(2).max(100).allow('').messages(mensajesError),
  apellido: Joi.string().min(2).max(100).allow('').messages(mensajesError),
  email: Joi.string().email().max(100).required().messages(mensajesError),
  password: Joi.string().min(8).max(100).pattern(passwordPattern).required().messages({
    ...mensajesError,
    'string.pattern.base': 'La contraseña debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas, números y caracteres especiales'
  }),
  rut: rutValidation.required(),
  telefono: Joi.string().required().messages(mensajesError),
  direccion: Joi.string().required().messages(mensajesError),
  role: Joi.string().valid('admin', 'funcionario', 'ciudadano').required().messages(mensajesError),
  departamento_id: Joi.number().integer().min(1).required().messages(mensajesError)
}).messages(mensajesError);

// Esquema para validar la actualización de un usuario
const updateUsuarioSchema = Joi.object({
  primer_nombre: Joi.string().min(2).max(100).messages(mensajesError),
  segundo_nombre: Joi.string().min(2).max(100).allow('').messages(mensajesError),
  primer_apellido: Joi.string().min(2).max(100).messages(mensajesError),
  segundo_apellido: Joi.string().min(2).max(100).allow('').messages(mensajesError),
  // Compatibilidad
  nombre: Joi.string().min(2).max(100).messages(mensajesError),
  apellido: Joi.string().min(2).max(100).messages(mensajesError),
  email: Joi.string().email().max(100).messages(mensajesError),
  telefono: Joi.string().min(7).max(20).messages(mensajesError),
  direccion: Joi.string().min(5).max(200).messages(mensajesError),
  role: Joi.string().valid('admin', 'funcionario', 'ciudadano').messages(mensajesError),
  departamento_id: Joi.number().integer().min(1).allow(null).messages(mensajesError),
  estado: Joi.string().valid('activo', 'inactivo', 'bloqueado').messages(mensajesError)
}).min(1).messages(mensajesError);

// Esquema para validar el cambio de contraseña
const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().min(8).max(100).messages(mensajesError),
  newPassword: Joi.string().min(8).max(100).pattern(passwordPattern).required().messages({
    ...mensajesError,
    'string.pattern.base': 'La nueva contraseña debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas, números y caracteres especiales'
  })
}).messages(mensajesError);

// Esquema para validar el cambio de estado
const changeEstadoSchema = Joi.object({
  estado: Joi.string().valid('activo', 'inactivo').required().messages(mensajesError)
}).messages(mensajesError);

module.exports = {
  idSchema,
  usuarioQuerySchema,
  createUsuarioSchema,
  updateUsuarioSchema,
  changePasswordSchema,
  changeEstadoSchema
};