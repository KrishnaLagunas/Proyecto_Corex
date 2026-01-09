/**
 * Middleware de autenticación y autorización
 * Verifica tokens JWT y roles de usuario
 */

const { verifyToken } = require('../config/jwt');
const { Usuario } = require('../models');
const logger = require('../utils/logger');

/**
 * Middleware para verificar si el usuario está autenticado
 */
const isAuthenticated = async (req, res, next) => {
  try {
    // Obtener el token del header de autorización o x-access-token
    const authHeader = req.headers.authorization;
    const accessToken = req.headers['x-access-token'];
    
    let token = null;
    
    // Verificar si viene en Authorization: Bearer
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
    // Verificar si viene en x-access-token
    else if (accessToken) {
      token = accessToken;
    }
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Acceso no autorizado. Se requiere token de autenticación.'
      });
    }
    
    // Verificar el token
    const decoded = verifyToken(token);
    
    // Normalizar datos del usuario y mantener compatibilidad
    req.user = decoded;
    const nombreRol = decoded.rol_nombre || null;

    // Enriquecer con municipalidad si falta
    if (!req.user.municipalidad_id && decoded && decoded.id) {
      try {
        const u = await Usuario.findByPk(decoded.id);
        if (u && u.municipalidad_id) {
          req.user.municipalidad_id = u.municipalidad_id;
        }
      } catch (_) {}
    }
    
    next();
  } catch (error) {
    logger.error('Error de autenticación:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Token inválido o expirado.'
    });
  }
};

/**
 * Middleware para verificar roles de usuario
 * @param {Array} roles - Array de roles permitidos
 */
  const hasRole = (roles) => {
  return (req, res, next) => {
    try {
      // Verificar primero si el usuario está autenticado
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no autenticado'
        });
      }
      
      // Verificar si el rol del usuario está en la lista de roles permitidos
      const userRolNombre = req.user.rol_nombre || null;
      const expandedAllowed = roles.flatMap(r => {
        if (r === 'admin') return ['administrador'];
        if (r === 'superadmin') return ['superadministrador'];
        if (r === 'funcionario') return [
          'funcionario',
          'secretaria de educación',
          'secretaria de salud',
          'secretaria de seguridad',
          'secretaria de obras',
          'secretaria de transito'
        ];
        return [r];
      });
      if (!expandedAllowed.includes(userRolNombre)) {
        return res.status(403).json({
          success: false,
          message: 'No tiene permisos para acceder a este recurso'
        });
      }
      
      next();
    } catch (error) {
      logger.error('Error de autorización:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Error al verificar permisos'
      });
    }
  };
};

// Roles disponibles en el sistema
const ROLES = {
  SUPERADMINISTRADOR: 'superadministrador',
  ADMINISTRADOR: 'administrador',
  CIUDADANO: 'ciudadano',
  SECRETARIA_OBRAS: 'secretaria de obras',
  SECRETARIA_TRANSITO: 'secretaria de transito',
  SECRETARIA_SALUD: 'secretaria de salud',
  SECRETARIA_SEGURIDAD: 'secretaria de seguridad',
  SECRETARIA_EDUCACION: 'secretaria de educación'
};

module.exports = {
  isAuthenticated,
  hasRole,
  ROLES
};
