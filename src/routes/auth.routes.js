const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { isAuthenticated, hasRole } = require('../middlewares/auth.middleware');
const { validateSchema } = require('../middlewares/validator.middleware');
const { authSchemas } = require('../validations/auth.validation');

/**
 * @route POST /api/auth/register
 * @desc Registra un nuevo usuario ciudadano
 * @access Public
 */
router.post('/register', validateSchema(authSchemas.register), authController.register);

/**
 * @route POST /api/auth/login
 * @desc Inicia sesión de un usuario
 * @access Public
 */
router.post('/login', validateSchema(authSchemas.login), authController.login);

/**
 * @route POST /api/auth/verify
 * @desc Verifica si un token JWT es válido
 * @access Public
 */
router.post('/verify', authController.verifyToken);

/**
 * @route GET /api/auth/profile
 * @desc Obtiene el perfil del usuario autenticado
 * @access Private
 */
router.get('/profile', isAuthenticated, authController.getProfile);

/**
 * @route PUT /api/auth/change-password
 * @desc Actualiza la contraseña del usuario autenticado
 * @access Private
 */
router.put('/change-password', 
  isAuthenticated, 
  validateSchema(authSchemas.changePassword), 
  authController.changePassword
);

/**
 * @route POST /api/auth/request-reset
 * @desc Solicita un token para recuperación de contraseña
 * @access Public
 */
router.post('/request-reset', 
  validateSchema(authSchemas.requestReset), 
  authController.requestPasswordReset
);

/**
 * @route POST /api/auth/reset-password
 * @desc Restablece la contraseña usando un token de recuperación
 * @access Public
 */
router.post('/reset-password', 
  validateSchema(authSchemas.resetPassword), 
  authController.resetPassword
);

/**
 * @route POST /api/auth/reset-password-direct
 * @desc Restablece la contraseña directamente usando el email (sin token)
 * @access Public
 */
router.post('/reset-password-direct', 
  validateSchema(authSchemas.resetPasswordDirect), 
  authController.resetPasswordDirect
);

/**
 * @route POST /api/auth/logout
 * @desc Cierra la sesión del usuario (solo para registro)
 * @access Private
 */
router.post('/logout', isAuthenticated, authController.logout);

// Ruta para crear usuario por admin - pendiente de implementar
// router.post('/admin/create-user', 
//   isAuthenticated, 
//   hasRole(['admin']), 
//   validateSchema(authSchemas.createUser), 
//   authController.createUser
// );

module.exports = router;
