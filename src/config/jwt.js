/**
 * Configuración para la generación y verificación de tokens JWT
 */

const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

// Cargar variables de entorno
require('dotenv').config();

// Clave secreta para firmar los tokens JWT
const JWT_SECRET = process.env.JWT_SECRET;

// Tiempo de expiración del token
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Genera un token JWT para un usuario
 * @param {Object} user - Datos del usuario a incluir en el token
 * @returns {String} Token JWT generado
 */
const generateToken = (user) => {
  try {
    const payload = {
      id: user.id,
      email: user.email,
      id_rol: user.id_rol || null,
      rol_nombre: user.rol_nombre || null
    };

    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    });

    return token;
  } catch (error) {
    logger.error('Error al generar token JWT:', error);
    throw new Error('Error al generar token de autenticación');
  }
};

/**
 * Verifica y decodifica un token JWT
 * @param {String} token - Token JWT a verificar
 * @returns {Object} Payload decodificado del token
 */
const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    logger.error('Error al verificar token JWT:', error);
    throw new Error('Token inválido o expirado');
  }
};

module.exports = {
  generateToken,
  verifyToken,
  JWT_SECRET,
  JWT_EXPIRES_IN
};
