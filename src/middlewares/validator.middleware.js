const { ApiError } = require('./errorHandler');
const logger = require('../utils/logger');

/**
 * Middleware para validar datos de entrada según un esquema Joi
 * @param {Object} schema - Esquema Joi para validar
 * @returns {Function} Middleware de Express
 */
const validateSchema = (schema) => {
  return (req, res, next) => {
    if (!schema) {
      return next();
    }

    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: false
    });

    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      const bodyKeys = Object.keys(req.body || {});
      logger.warn(`Validación fallida en ${req.method} ${req.originalUrl}: ${errorMessage}. Campos en body: ${bodyKeys.join(', ')}`);
      return next(new ApiError(errorMessage, 400));
    }

    // Log de validación exitosa (con password redactado)
    const valueForLog = { ...value };
    if (Object.prototype.hasOwnProperty.call(valueForLog, 'password')) {
      valueForLog.password = '[REDACTED]';
    }
    logger.info(`Validación exitosa en ${req.method} ${req.originalUrl}: ${JSON.stringify(valueForLog)}`);

    // Reemplazar el body con los datos validados
    req.body = value;
    next();
  };
};

/**
 * Middleware para validar parámetros de URL según un esquema Joi
 * @param {Object} schema - Esquema Joi para validar
 * @returns {Function} Middleware de Express
 */
const validateParams = (schema) => {
  return (req, res, next) => {
    if (!schema) {
      return next();
    }

    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      logger.warn(`Validación de parámetros fallida: ${errorMessage}`);
      return next(new ApiError(errorMessage, 400));
    }

    // Reemplazar los params con los datos validados
    req.params = value;
    next();
  };
};

/**
 * Middleware para validar parámetros de consulta según un esquema Joi
 * @param {Object} schema - Esquema Joi para validar
 * @returns {Function} Middleware de Express
 */
const validateQuery = (schema) => {
  return (req, res, next) => {
    if (!schema) {
      return next();
    }

    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      logger.warn(`Validación de query fallida: ${errorMessage}`);
      return next(new ApiError(errorMessage, 400));
    }

    // Reemplazar el query con los datos validados
    req.query = value;
    next();
  };
};

module.exports = {
  validateSchema,
  validateParams,
  validateQuery
};