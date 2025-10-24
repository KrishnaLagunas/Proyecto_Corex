const Joi = require('joi');

// Mensajes de error personalizados en español
const mensajesError = {
  'string.empty': 'El campo {#label} no puede estar vacío',
  'string.min': 'El campo {#label} debe tener al menos {#limit} caracteres',
  'string.max': 'El campo {#label} no puede tener más de {#limit} caracteres',
  'number.base': 'El campo {#label} debe ser un número',
  'number.min': 'El campo {#label} debe ser mayor o igual a {#limit}',
  'number.max': 'El campo {#label} debe ser menor o igual a {#limit}',
  'any.required': 'El campo {#label} es obligatorio',
  'any.only': 'El campo {#label} debe ser uno de los siguientes valores: {#valids}',
  'object.unknown': 'No se permiten campos adicionales',
  'string.pattern.base': 'El campo {#label} tiene un formato inválido',
  'string.email': 'El campo {#label} debe ser un correo electrónico válido',
  'string.uri': 'El campo {#label} debe ser una URL válida'
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

// Esquema para validar el ID de proveedor en parámetros
const proveedorIdSchema = Joi.object({
  id: Joi.alternatives().try(
    Joi.number().integer().positive(),
    Joi.string().pattern(/^\d+$/)
  ).required().messages({
    ...mensajesError,
    'alternatives.match': 'id debe ser un número válido'
  })
});

// Esquema para validar parámetros de consulta en listado de proveedores
const proveedorQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1)
    .messages(mensajesError),
  limit: Joi.number().integer().min(1).max(100).default(10)
    .messages(mensajesError),
  estado: Joi.string().valid('activo', 'inactivo', 'suspendido')
    .messages(mensajesError),
  search: Joi.string().min(1).max(100)
    .messages(mensajesError),
  sort: Joi.string().valid('createdAt', 'razon_social', 'rut', 'codigo', 'estado')
    .default('createdAt')
    .messages(mensajesError),
  order: Joi.string().valid('ASC', 'DESC', 'asc', 'desc')
    .default('DESC')
    .messages(mensajesError)
}).unknown(false).messages(mensajesError);

// Esquema para validar la creación de un proveedor
const createProveedorSchema = Joi.object({
  codigo: Joi.string().min(3).max(20).required()
    .messages(mensajesError),
  razon_social: Joi.string().min(3).max(100).required()
    .messages(mensajesError),
  nombre_comercial: Joi.string().min(3).max(100).allow(null).optional()
    .messages(mensajesError),
  rut: rutValidation.required()
    .messages(mensajesError),
  direccion: Joi.string().min(5).max(200).required()
    .messages(mensajesError),
  ciudad: Joi.string().min(2).max(50).required()
    .messages(mensajesError),
  region: Joi.string().min(2).max(50).required()
    .messages(mensajesError),
  telefono: Joi.string().min(8).max(20).required()
    .messages(mensajesError),
  email: Joi.string().email().required()
    .messages(mensajesError),
  sitio_web: Joi.string().uri().allow('', null).optional()
    .messages(mensajesError),
  representante_legal: Joi.string().min(3).max(100).required()
    .messages(mensajesError),
  rut_representante: rutValidation.required()
    .messages(mensajesError),
  giro: Joi.string().min(3).max(100).required()
    .messages(mensajesError),
  categoria: Joi.string().valid('servicios', 'construccion', 'tecnologia', 'suministros', 'consultoria', 'otro').required()
    .messages(mensajesError),
  estado: Joi.string().valid('activo', 'inactivo', 'bloqueado').default('activo')
    .messages(mensajesError),
  calificacion: Joi.number().integer().min(1).max(5).allow(null).optional()
    .messages(mensajesError),
  notas: Joi.string().max(500).allow('', null).optional()
    .messages(mensajesError),
  cuenta_bancaria: Joi.string().max(50).allow('', null).optional()
    .messages(mensajesError),
  banco: Joi.string().max(100).allow('', null).optional()
    .messages(mensajesError),
  tipo_cuenta: Joi.string().valid('corriente', 'ahorro', 'vista').allow('', null).optional()
    .messages(mensajesError)
}).unknown(false).messages(mensajesError);

// Esquema para validar la actualización de un proveedor
const updateProveedorSchema = Joi.object({
  codigo: Joi.string().min(3).max(20)
    .messages(mensajesError),
  razon_social: Joi.string().min(3).max(100)
    .messages(mensajesError),
  nombre_comercial: Joi.string().min(3).max(100).allow(null)
    .messages(mensajesError),
  rut: rutValidation
    .messages(mensajesError),
  direccion: Joi.string().min(5).max(200)
    .messages(mensajesError),
  ciudad: Joi.string().min(2).max(50)
    .messages(mensajesError),
  region: Joi.string().min(2).max(50)
    .messages(mensajesError),
  telefono: Joi.string().min(8).max(20)
    .messages(mensajesError),
  email: Joi.string().email()
    .messages(mensajesError),
  sitio_web: Joi.string().uri().allow('', null)
    .messages(mensajesError),
  representante_legal: Joi.string().min(3).max(100)
    .messages(mensajesError),
  rut_representante: rutValidation
    .messages(mensajesError),
  giro: Joi.string().min(3).max(100)
    .messages(mensajesError),
  categoria: Joi.string().valid('servicios', 'construccion', 'tecnologia', 'suministros', 'consultoria', 'otro')
    .messages(mensajesError),
  estado: Joi.string().valid('activo', 'inactivo', 'bloqueado')
    .messages(mensajesError),
  calificacion: Joi.number().integer().min(1).max(5).allow(null)
    .messages(mensajesError),
  notas: Joi.string().max(500).allow('', null)
    .messages(mensajesError),
  cuenta_bancaria: Joi.string().max(50).allow('', null)
    .messages(mensajesError),
  banco: Joi.string().max(100).allow('', null)
    .messages(mensajesError),
  tipo_cuenta: Joi.string().valid('corriente', 'ahorro', 'vista').allow('', null)
    .messages(mensajesError)
}).unknown(false)
  .min(1) // Al menos un campo debe ser proporcionado
  .messages({
    ...mensajesError,
    'object.min': 'Debe proporcionar al menos un campo para actualizar'
  });

module.exports = {
  proveedorIdSchema,
  proveedorQuerySchema,
  createProveedorSchema,
  updateProveedorSchema
};