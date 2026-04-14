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
  'array.max': 'El campo {#label} debe tener como máximo {#limit} elementos'
};

// Esquema para validar el parámetro ID
const idSchema = Joi.object({
  id: Joi.alternatives().try(
    Joi.number().integer().positive(),
    Joi.string().pattern(/^\d+$/)
  ).required().messages({
    ...mensajesError,
    'alternatives.match': 'id debe ser un número válido'
  })
});

// Esquema para validar los parámetros de consulta
const departamentoQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).messages(mensajesError),
  limit: Joi.number().integer().min(1).max(100).messages(mensajesError),
  search: Joi.string().max(100).allow('', null).messages(mensajesError),
  estado: Joi.string().valid('activo', 'inactivo').allow('', null).messages(mensajesError),
  sort: Joi.string().valid('nombre').messages(mensajesError),
  order: Joi.string().valid('ASC', 'DESC', 'asc', 'desc').messages(mensajesError)
}).messages(mensajesError);

// Esquema para validar la creación de un departamento
const createDepartamentoSchema = Joi.object({
  nombre: Joi.string().min(3).max(100).required().messages(mensajesError),
  direccion: Joi.string().min(3).max(255).allow('', null).messages(mensajesError),
  region: Joi.string().min(2).max(100).allow('', null).messages(mensajesError),
  comuna: Joi.string().min(2).max(100).allow('', null).messages(mensajesError),
  telefono: Joi.string().min(5).max(20).allow('', null).messages(mensajesError),
  email: Joi.string().email().allow('', null).messages(mensajesError),
  rut: Joi.string().max(12).allow('', null).messages(mensajesError),
  estado: Joi.string().valid('activo','inactivo').allow('', null).messages(mensajesError)
}).messages(mensajesError);

// Esquema para validar la actualización de un departamento
const updateDepartamentoSchema = Joi.object({
  nombre: Joi.string().min(3).max(100).messages(mensajesError),
  direccion: Joi.string().min(3).max(255).allow('', null).messages(mensajesError),
  region: Joi.string().min(2).max(100).allow('', null).messages(mensajesError),
  comuna: Joi.string().min(2).max(100).allow('', null).messages(mensajesError),
  telefono: Joi.string().min(5).max(20).allow('', null).messages(mensajesError),
  email: Joi.string().email().allow('', null).messages(mensajesError),
  rut: Joi.string().max(12).allow('', null).messages(mensajesError),
  estado: Joi.string().valid('activo','inactivo').allow('', null).messages(mensajesError)
}).min(1).messages(mensajesError);

// Esquema para validar la asignación de funcionarios
const asignarFuncionariosSchema = Joi.object({
  funcionario_ids: Joi.array()
    .items(Joi.number().integer().min(1))
    .min(1)
    .required()
    .messages(mensajesError)
}).messages(mensajesError);

module.exports = {
  idSchema,
  departamentoQuerySchema,
  createDepartamentoSchema,
  updateDepartamentoSchema,
  asignarFuncionariosSchema
};
