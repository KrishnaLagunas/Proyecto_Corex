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
  'object.unknown': 'No se permiten campos adicionales'
};

/**
 * Esquemas de validación para las rutas de pagos
 */
const pagoSchemas = {
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
   * Esquema para validar parámetros de consulta en listado de pagos
   */
  queryPagos: Joi.object({
    page: Joi.number().integer().min(1).default(1).messages(customMessages),
    limit: Joi.number().integer().min(1).max(100).default(10).messages(customMessages),
    estado: Joi.string().valid('pendiente', 'procesando', 'completado', 'rechazado', 'reembolsado').messages(customMessages),
    metodo_pago: Joi.string().valid('efectivo', 'tarjeta_credito', 'tarjeta_debito', 'transferencia', 'cheque', 'otro').messages(customMessages),
    tramite_id: Joi.number().integer().positive().messages(customMessages),
    search: Joi.string().min(2).max(100).messages(customMessages),
    desde: Joi.date().iso().messages(customMessages),
    hasta: Joi.date().iso().min(Joi.ref('desde')).messages({
      ...customMessages,
      'date.min': 'La fecha final debe ser posterior a la fecha inicial'
    }),
    sort: Joi.string().valid('fecha_pago', 'monto', 'estado', 'codigo').default('fecha_pago').messages(customMessages),
    order: Joi.string().valid('ASC', 'DESC', 'asc', 'desc').default('DESC').messages(customMessages)
  }),

  /**
   * Esquema para crear un nuevo pago
   */
  createPago: Joi.object({
    monto: Joi.number().positive().required().messages(customMessages),
    metodo_pago: Joi.string().valid('efectivo', 'tarjeta_credito', 'tarjeta_debito', 'transferencia', 'cheque', 'otro').required().messages(customMessages),
    estado: Joi.string().valid('pendiente', 'procesando', 'completado', 'rechazado', 'reembolsado').default('pendiente').messages(customMessages),
    referencia_externa: Joi.string().max(100).allow('', null).messages(customMessages),
    comprobante_url: Joi.string().uri().max(255).allow('', null).messages(customMessages),
    notas: Joi.string().allow('', null).messages(customMessages),
    tramite_id: Joi.number().integer().positive().allow(null).messages(customMessages),
    ciudadano_id: Joi.number().integer().positive().allow(null).messages(customMessages),
    funcionario_id: Joi.number().integer().positive().allow(null).messages(customMessages)
  }),

  /**
   * Esquema para actualizar un pago existente
   */
  updatePago: Joi.object({
    codigo: Joi.string().min(3).max(20).messages(customMessages),
    monto: Joi.number().positive().messages(customMessages),
    fecha_pago: Joi.date().iso().messages(customMessages),
    metodo_pago: Joi.string().valid('efectivo', 'tarjeta_credito', 'tarjeta_debito', 'transferencia', 'cheque', 'otro').messages(customMessages),
    estado: Joi.string().valid('pendiente', 'procesando', 'completado', 'rechazado', 'reembolsado').messages(customMessages),
    referencia_externa: Joi.string().max(100).allow('', null).messages(customMessages),
    comprobante_url: Joi.string().uri().max(255).allow('', null).messages(customMessages),
    notas: Joi.string().allow('', null).messages(customMessages),
    funcionario_id: Joi.number().integer().positive().allow(null).messages(customMessages)
  }),

  // Nuevo: esquema para procesar/confirmar un pago
  processPago: Joi.object({
    metodoPago: Joi.string().valid('efectivo', 'tarjeta_credito', 'tarjeta_debito', 'transferencia', 'cheque', 'otro').required().messages(customMessages),
    referencia: Joi.string().max(100).allow('', null).messages(customMessages),
    observaciones: Joi.string().allow('', null).messages(customMessages),
    fechaPago: Joi.date().iso().allow(null).messages(customMessages),
    ultimosDigitos: Joi.string().pattern(/^\d{4}$/).allow(null).messages({
      ...customMessages,
      'string.pattern.base': 'ultimosDigitos debe ser 4 dígitos'
    }),
    comprobante: Joi.string().max(255).allow('', null).messages(customMessages)
  })
};

module.exports = {
  pagoSchemas
};