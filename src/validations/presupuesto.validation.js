const Joi = require('joi');

// Mensajes de error personalizados en español
const mensajesError = {
  'string.empty': 'El campo {#label} no puede estar vacío',
  'string.min': 'El campo {#label} debe tener al menos {#limit} caracteres',
  'string.max': 'El campo {#label} no puede tener más de {#limit} caracteres',
  'number.base': 'El campo {#label} debe ser un número',
  'number.min': 'El campo {#label} debe ser mayor o igual a {#limit}',
  'number.max': 'El campo {#label} debe ser menor o igual a {#limit}',
  'date.base': 'El campo {#label} debe ser una fecha válida',
  'date.min': 'La fecha de {#label} no puede ser anterior a {#limit}',
  'date.max': 'La fecha de {#label} no puede ser posterior a {#limit}',
  'any.required': 'El campo {#label} es obligatorio',
  'any.only': 'El campo {#label} debe ser uno de los siguientes valores: {#valids}',
  'object.unknown': 'No se permiten campos adicionales',
  'string.pattern.base': 'El campo {#label} tiene un formato inválido'
};

// Esquema para validar el ID de presupuesto en parámetros
const presupuestoIdSchema = Joi.object({
  id: Joi.alternatives().try(
    Joi.number().integer().positive(),
    Joi.string().pattern(/^\d+$/)
  ).required().messages({
    ...mensajesError,
    'alternatives.match': 'id debe ser un número válido'
  })
});

// Esquema para validar parámetros de consulta en listado de presupuestos
const presupuestoQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1)
    .messages(mensajesError),
  limit: Joi.number().integer().min(1).max(100).default(10)
    .messages(mensajesError),
  estado: Joi.string().valid('planificacion', 'aprobado', 'en_ejecucion', 'cerrado', 'anulado')
    .messages(mensajesError),
  anio_fiscal: Joi.number().integer().min(2000).max(2100)
    .messages(mensajesError),
  municipalidad_id: Joi.number().integer().positive()
    .messages(mensajesError),
  search: Joi.string().min(1).max(100)
    .messages(mensajesError),
  sort: Joi.string().valid('createdAt', 'nombre', 'anio_fiscal', 'monto_total', 'monto_ejecutado', 'estado')
    .default('createdAt')
    .messages(mensajesError),
  order: Joi.string().valid('ASC', 'DESC', 'asc', 'desc')
    .default('DESC')
    .messages(mensajesError)
}).unknown(false).messages(mensajesError);

// Esquema para validar la creación de un presupuesto
const createPresupuestoSchema = Joi.object({
  codigo: Joi.string().min(3).max(20).required()
    .messages(mensajesError),
  nombre: Joi.string().min(3).max(100).required()
    .messages(mensajesError),
  descripcion: Joi.string().min(10).max(500).allow('', null)
    .messages(mensajesError),
  anio_fiscal: Joi.number().integer().min(2000).max(2100).required()
    .messages(mensajesError),
  monto_total: Joi.number().positive().required()
    .messages(mensajesError),
  monto_ejecutado: Joi.number().min(0).default(0)
    .messages(mensajesError),
  fecha_inicio: Joi.date().iso().required()
    .messages(mensajesError),
  fecha_fin: Joi.date().iso().min(Joi.ref('fecha_inicio')).required()
    .messages({
      ...mensajesError,
      'date.min': 'La fecha de fin no puede ser anterior a la fecha de inicio'
    }),
  estado: Joi.string().valid('planificacion', 'aprobado', 'en_ejecucion', 'cerrado', 'anulado').default('planificacion')
    .messages(mensajesError),
  notas: Joi.string().max(1000).allow('', null)
    .messages(mensajesError),
  municipalidad_id: Joi.number().integer().positive().allow(null)
    .messages(mensajesError),
  responsable_id: Joi.number().integer().positive().required()
    .messages(mensajesError)
}).unknown(false).messages(mensajesError);

// Esquema para validar la actualización de un presupuesto
const updatePresupuestoSchema = Joi.object({
  codigo: Joi.string().min(3).max(20)
    .messages(mensajesError),
  nombre: Joi.string().min(3).max(100)
    .messages(mensajesError),
  descripcion: Joi.string().min(10).max(500).allow('', null)
    .messages(mensajesError),
  monto_total: Joi.number().positive()
    .messages(mensajesError),
  monto_ejecutado: Joi.number().min(0)
    .messages(mensajesError),
  fecha_inicio: Joi.date().iso()
    .messages(mensajesError),
  fecha_fin: Joi.date().iso()
    .messages(mensajesError),
  estado: Joi.string().valid('planificacion', 'aprobado', 'en_ejecucion', 'cerrado', 'anulado')
    .messages(mensajesError),
  notas: Joi.string().max(1000).allow('', null)
    .messages(mensajesError),
  municipalidad_id: Joi.number().integer().positive().allow(null)
    .messages(mensajesError),
  responsable_id: Joi.number().integer().positive()
    .messages(mensajesError)
}).unknown(false)
  .min(1) // Al menos un campo debe ser proporcionado
  .messages({
    ...mensajesError,
    'object.min': 'Debe proporcionar al menos un campo para actualizar'
  });

// Validación condicional para fecha_fin
updatePresupuestoSchema.concat(
  Joi.object({
    fecha_fin: Joi.date().iso().min(Joi.ref('fecha_inicio'))
      .messages({
        ...mensajesError,
        'date.min': 'La fecha de fin no puede ser anterior a la fecha de inicio'
      })
  })
);

module.exports = {
  presupuestoIdSchema,
  presupuestoQuerySchema,
  createPresupuestoSchema,
  updatePresupuestoSchema
};
