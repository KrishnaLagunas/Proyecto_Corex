/**
 * Middleware para el manejo centralizado de errores
 */

const logger = require('../utils/logger');

/**
 * Middleware de manejo de errores
 * Captura todos los errores lanzados en los controladores y middlewares
 */
const errorHandler = (err, req, res, next) => {
  // Registrar el error en los logs con contexto
  const safeBody = { ...(req.body || {}) };
  if (Object.prototype.hasOwnProperty.call(safeBody, 'password')) {
    safeBody.password = '[REDACTED]';
  }
  const safeQuery = { ...(req.query || {}) };
  logger.error(`Error en ${req.method} ${req.originalUrl}: ${err.message}\nBody: ${JSON.stringify(safeBody)}\nQuery: ${JSON.stringify(safeQuery)}\nStack: ${err.stack}`);
  
  // Determinar el código de estado HTTP
  const statusCode = err.statusCode || 500;
  
  // Respuesta de error para el cliente
  const errorResponse = {
    success: false,
    message: err.message || 'Error interno del servidor',
    // Solo incluir detalles del error en desarrollo
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  };
  
  // Enviar respuesta de error
  res.status(statusCode).json(errorResponse);
};

/**
 * Clase personalizada para errores de la API
 */
class ApiError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Middleware para manejar rutas no encontradas
 */
const notFoundHandler = (req, res, next) => {
  const error = new ApiError(`Ruta no encontrada: ${req.originalUrl}`, 404);
  next(error);
};

module.exports = errorHandler;
module.exports.ApiError = ApiError;
module.exports.notFoundHandler = notFoundHandler;