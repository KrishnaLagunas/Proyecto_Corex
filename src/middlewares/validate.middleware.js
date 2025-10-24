/**
 * Middleware para validación de datos con Joi
 */

const logger = require('../utils/logger');

/**
 * Middleware para validar datos de solicitud con esquemas Joi
 * @param {Object} schema - Esquema Joi para validación
 * @param {String} property - Propiedad de la solicitud a validar (body, params, query)
 * @returns {Function} Middleware
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], { abortEarly: false });
    
    if (!error) {
      // Asignar los valores validados
      req[property] = value;
      return next();
    }
    
    // Formatear los errores de validación
    const errorDetails = error.details.map(detail => ({
      message: detail.message,
      path: detail.path,
      type: detail.type
    }));
    
    // Registrar el error de validación
    logger.warn('Error de validación', {
      method: req.method,
      url: req.originalUrl,
      errors: errorDetails
    });
    
    // Responder con los errores de validación
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors: errorDetails
    });
  };
};

module.exports = validate;