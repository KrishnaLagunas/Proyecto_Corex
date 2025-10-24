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
  'boolean.base': 'El campo {#label} debe ser un valor booleano'
};

// Esquema para validar el ID de contrato en parámetros
const contratoIdSchema = Joi.object({
  id: Joi.number().integer().positive().required()
    .messages(mensajesError)
});

// Esquema para validar parámetros de consulta en listado de contratos
const contratoQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1)
    .messages(mensajesError),
  limit: Joi.number().integer().min(1).max(100).default(10)
    .messages(mensajesError),
  estado: Joi.string().valid('borrador', 'activo', 'pausado', 'finalizado', 'cancelado')
    .messages(mensajesError),
  tipo: Joi.string().valid('servicio', 'obra', 'suministro', 'consultoria', 'otro')
    .messages(mensajesError),
  modalidad: Joi.string().valid('licitacion', 'trato_directo', 'convenio_marco', 'otro')
    .messages(mensajesError),
  proveedor_id: Joi.number().integer().positive()
    .messages(mensajesError),
  departamento_id: Joi.number().integer().positive()
    .messages(mensajesError),
  search: Joi.string().min(1).max(100)
    .messages(mensajesError),
  sort: Joi.string().valid('createdAt', 'nombre', 'fecha_inicio', 'fecha_fin', 'monto_total', 'estado')
    .default('createdAt')
    .messages(mensajesError),
  order: Joi.string().valid('ASC', 'DESC', 'asc', 'desc')
    .default('DESC')
    .messages(mensajesError)
}).unknown(false).messages(mensajesError);

// Esquema para validar la creación de un contrato
const createContratoSchema = Joi.object({
  nombre: Joi.string().min(3).max(100).required()
    .messages(mensajesError),
  descripcion: Joi.string().min(10).max(500).required()
    .messages(mensajesError),
  tipo: Joi.string().valid('servicio', 'obra', 'suministro', 'consultoria', 'otro').required()
    .messages(mensajesError),
  modalidad: Joi.string().valid('licitacion', 'trato_directo', 'convenio_marco', 'otro').required()
    .messages(mensajesError),
  fecha_inicio: Joi.date().iso().required()
    .messages(mensajesError),
  fecha_fin: Joi.date().iso().min(Joi.ref('fecha_inicio')).required()
    .messages({
      ...mensajesError,
      'date.min': 'La fecha de fin no puede ser anterior a la fecha de inicio'
    }),
  monto_total: Joi.number().positive().required()
    .messages(mensajesError),
  proveedor_id: Joi.number().integer().positive().required()
    .messages(mensajesError),
  departamento_id: Joi.number().integer().positive().required()
    .messages(mensajesError),
  responsable_id: Joi.number().integer().positive().required()
    .messages(mensajesError),
  publico: Joi.boolean().default(false)
    .messages(mensajesError)
}).unknown(false).messages(mensajesError);

// Esquema para validar la actualización de un contrato
const updateContratoSchema = Joi.object({
  nombre: Joi.string().min(3).max(100)
    .messages(mensajesError),
  descripcion: Joi.string().min(10).max(500)
    .messages(mensajesError),
  tipo: Joi.string().valid('servicio', 'obra', 'suministro', 'consultoria', 'otro')
    .messages(mensajesError),
  modalidad: Joi.string().valid('licitacion', 'trato_directo', 'convenio_marco', 'otro')
    .messages(mensajesError),
  fecha_inicio: Joi.date().iso()
    .messages(mensajesError),
  fecha_fin: Joi.date().iso()
    .messages(mensajesError),
  monto_total: Joi.number().positive()
    .messages(mensajesError),
  monto_pagado: Joi.number().min(0)
    .messages(mensajesError),
  estado: Joi.string().valid('borrador', 'activo', 'pausado', 'finalizado', 'cancelado')
    .messages(mensajesError),
  responsable_id: Joi.number().integer().positive()
    .messages(mensajesError),
  publico: Joi.boolean()
    .messages(mensajesError)
}).unknown(false)
  .min(1) // Al menos un campo debe ser proporcionado
  .messages({
    ...mensajesError,
    'object.min': 'Debe proporcionar al menos un campo para actualizar'
  });

// Validación condicional para fecha_fin
updateContratoSchema.concat(
  Joi.object({
    fecha_fin: Joi.date().iso().min(Joi.ref('fecha_inicio'))
      .messages({
        ...mensajesError,
        'date.min': 'La fecha de fin no puede ser anterior a la fecha de inicio'
      })
  })
);

module.exports = {
  contratoIdSchema,
  contratoQuerySchema,
  createContratoSchema,
  updateContratoSchema
};