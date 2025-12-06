const Joi = require('joi');

// Mensajes de error personalizados en español
const customMessages = {
  'string.empty': '{#label} no puede estar vacío',
  'string.min': '{#label} debe tener al menos {#limit} caracteres',
  'string.max': '{#label} no debe exceder los {#limit} caracteres',
  'any.required': '{#label} es un campo requerido',
  'any.only': '{#label} debe ser {#valids}',
  'number.base': '{#label} debe ser un número',
  'number.integer': '{#label} debe ser un número entero',
  'number.min': '{#label} debe ser mayor o igual a {#limit}',
  'date.base': '{#label} debe ser una fecha válida',
  'boolean.base': '{#label} debe ser un valor booleano',
  'object.unknown': 'No se permiten campos adicionales'
};

/**
 * Esquemas de validación para las rutas de trámites
 */
const tramiteSchemas = {
  /**
   * Esquema para validar parámetro ID
   */
  idParam: Joi.object({
    id: Joi.alternatives().try(
      Joi.number().integer().positive(),
      Joi.string().pattern(/^\d+$/)
    ).required().messages({
      ...customMessages,
      'alternatives.match': 'id debe ser un número válido'
    })
  }),

  /**
   * Esquema para validar parámetros de consulta en listado de trámites
   */
  queryTramites: Joi.object({
    page: Joi.number().integer().min(1).default(1).messages(customMessages),
    limit: Joi.number().integer().min(1).max(100).default(10).messages(customMessages),
    estado: Joi.string().valid('pendiente', 'en_proceso', 'en_revision', 'aprobado', 'rechazado', 'finalizado').messages(customMessages),
    tipo: Joi.string().valid('licencia', 'permiso', 'certificado', 'registro', 'solicitud', 'reclamo', 'otro').messages(customMessages),
    prioridad: Joi.string().valid('baja', 'media', 'alta', 'urgente').messages(customMessages),
    search: Joi.string().min(2).max(100).messages(customMessages),
    desde: Joi.date().iso().messages(customMessages),
    hasta: Joi.date().iso().min(Joi.ref('desde')).messages({
      ...customMessages,
      'date.min': 'La fecha final debe ser posterior a la fecha inicial'
    }),
    sort: Joi.string().valid('fecha_solicitud', 'titulo', 'estado', 'prioridad', 'codigo').default('fecha_solicitud').messages(customMessages),
    order: Joi.string().valid('ASC', 'DESC', 'asc', 'desc').default('DESC').messages(customMessages)
  }),

  /**
   * Esquema para consultar configuración de pago
   */
  queryPagoConfig: Joi.object({
    tramite_nombre: Joi.string().min(2).max(200).allow('', null).messages(customMessages),
    anio: Joi.number().integer().min(2000).max(2100).messages(customMessages),
    modalidad: Joi.string().valid('fijo', 'porcentaje').messages(customMessages),
    categoria: Joi.string().min(2).max(100).allow('', null).messages(customMessages),
    estado: Joi.string().valid('activo', 'inactivo').messages(customMessages),
    limit: Joi.number().integer().min(1).max(200).default(50).messages(customMessages),
    sort: Joi.string().valid('anio', 'categoria', 'modalidad').default('anio').messages(customMessages),
    order: Joi.string().valid('ASC', 'DESC', 'asc', 'desc').default('DESC').messages(customMessages)
  }),

  /**
   * Esquema para crear un nuevo trámite
   */
  createTramite: Joi.object({
    titulo: Joi.string().min(3).max(100).required().messages(customMessages),
    tipo: Joi.string().min(3).max(200).required().messages(customMessages),
    descripcion: Joi.string().min(3).max(1000).required().messages(customMessages),
    prioridad: Joi.string().valid('baja', 'media', 'alta', 'urgente').default('media').messages(customMessages),
    requiere_pago: Joi.boolean().default(false).messages(customMessages),
    monto: Joi.number().min(0).allow(null).default(0).messages(customMessages),
    ciudadano_id: Joi.number().integer().positive().messages(customMessages),
    departamento_id: Joi.number().integer().positive().required().messages(customMessages),
    municipalidad_id: Joi.number().integer().positive().required().messages(customMessages)
  }),

  /**
   * Esquema para actualizar un trámite existente
   */
  updateTramite: Joi.object({
    codigo: Joi.string().min(3).max(20).messages(customMessages),
    titulo: Joi.string().min(5).max(100).messages(customMessages),
    tipo: Joi.string().valid('licencia', 'permiso', 'certificado', 'registro', 'solicitud', 'reclamo', 'otro').messages(customMessages),
    estado: Joi.string().valid('pendiente', 'en_proceso', 'en_revision', 'aprobado', 'rechazado', 'finalizado').messages(customMessages),
    prioridad: Joi.string().valid('baja', 'media', 'alta', 'urgente').messages(customMessages),
    descripcion: Joi.string().min(10).max(1000).messages(customMessages),
    notas_internas: Joi.string().max(1000).allow('', null).messages(customMessages),
    observaciones: Joi.string().max(1000).allow('', null).messages(customMessages),
    requiere_pago: Joi.boolean().messages(customMessages),
    monto: Joi.number().min(0).allow(null).messages(customMessages),
    pago_completado: Joi.boolean().messages(customMessages),
    funcionario_id: Joi.number().integer().positive().allow(null).messages(customMessages),
    municipalidad_id: Joi.number().integer().positive().messages(customMessages)
  })
};

module.exports = {
  tramiteSchemas
};
