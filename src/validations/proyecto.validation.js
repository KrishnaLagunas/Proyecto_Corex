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
    Joi.number().integer().min(1),
    Joi.string().pattern(/^\d+$/)
  ).required().messages({
    ...mensajesError,
    'alternatives.match': 'id debe ser un número válido'
  })
});

// Esquema para validar los parámetros de consulta
const proyectoQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).messages(mensajesError),
  limit: Joi.number().integer().min(1).max(100).messages(mensajesError),
  estado: Joi.string().valid('planificacion', 'en_ejecucion', 'pausado', 'finalizado', 'cancelado').messages(mensajesError),
  tipo: Joi.string().valid('infraestructura', 'social', 'ambiental', 'cultural', 'deportivo', 'educativo', 'salud', 'otro').messages(mensajesError),
  municipalidad_id: Joi.number().integer().min(1).messages(mensajesError),
  año_fiscal: Joi.number().integer().min(2000).max(2100).messages(mensajesError),
  search: Joi.string().min(1).max(100).messages(mensajesError),
  sort: Joi.string().valid('createdAt', 'nombre', 'fecha_inicio', 'fecha_fin', 'presupuesto_asignado', 'estado').messages(mensajesError),
  order: Joi.string().valid('ASC', 'DESC', 'asc', 'desc').messages(mensajesError)
}).messages(mensajesError);

// Esquema para validar la creación de un proyecto
const createProyectoSchema = Joi.object({
  codigo: Joi.string().min(3).max(20).required().messages(mensajesError),
  nombre: Joi.string().min(3).max(100).required().messages(mensajesError),
  descripcion: Joi.string().min(10).max(1000).required().messages(mensajesError),
  tipo: Joi.string().valid('infraestructura', 'social', 'ambiental', 'tecnologico', 'cultural', 'otro').required().messages(mensajesError),
  fecha_inicio: Joi.date().iso().required().messages(mensajesError),
  fecha_fin_estimada: Joi.date().iso().min(Joi.ref('fecha_inicio')).required().messages(mensajesError),
  presupuesto_asignado: Joi.number().min(0).required().messages(mensajesError),
  ubicacion: Joi.string().min(5).max(200).required().messages(mensajesError),
  beneficiarios: Joi.number().integer().min(0).required().messages(mensajesError),
  objetivos: Joi.string().min(10).max(1000).required().messages(mensajesError),
  resultados_esperados: Joi.string().min(10).max(1000).required().messages(mensajesError),
  fuente_financiamiento: Joi.string().min(3).max(100).required().messages(mensajesError),
  municipalidad_id: Joi.number().integer().min(1).required().messages(mensajesError),
  responsable_id: Joi.number().integer().min(1).required().messages(mensajesError),
  presupuesto_id: Joi.number().integer().min(1).allow(null).messages(mensajesError),
  estado: Joi.string().valid('planificacion', 'en_ejecucion', 'pausado', 'finalizado', 'cancelado').default('planificacion').messages(mensajesError)
}).messages(mensajesError);

// Esquema para validar la actualización de un proyecto
const updateProyectoSchema = Joi.object({
  codigo: Joi.string().min(3).max(20).messages(mensajesError),
  nombre: Joi.string().min(3).max(100).messages(mensajesError),
  descripcion: Joi.string().min(10).max(1000).messages(mensajesError),
  tipo: Joi.string().valid('infraestructura', 'social', 'ambiental', 'tecnologico', 'cultural', 'otro').messages(mensajesError),
  fecha_inicio: Joi.date().iso().messages(mensajesError),
  fecha_fin_estimada: Joi.date().iso().when('fecha_inicio', {
    is: Joi.exist(),
    then: Joi.date().min(Joi.ref('fecha_inicio')),
    otherwise: Joi.date()
  }).messages(mensajesError),
  presupuesto_asignado: Joi.number().min(0).messages(mensajesError),
  ubicacion: Joi.string().min(5).max(200).messages(mensajesError),
  beneficiarios: Joi.number().integer().min(0).messages(mensajesError),
  objetivos: Joi.string().min(10).max(1000).messages(mensajesError),
  resultados_esperados: Joi.string().min(10).max(1000).messages(mensajesError),
  fuente_financiamiento: Joi.string().min(3).max(100).messages(mensajesError),
  estado: Joi.string().valid('planificacion', 'en_ejecucion', 'pausado', 'finalizado', 'cancelado').messages(mensajesError),
  responsable_id: Joi.number().integer().min(1).messages(mensajesError),
  presupuesto_id: Joi.number().integer().min(1).allow(null).messages(mensajesError)
}).min(1).messages(mensajesError);

module.exports = {
  idSchema,
  proyectoQuerySchema,
  createProyectoSchema,
  updateProyectoSchema
};
