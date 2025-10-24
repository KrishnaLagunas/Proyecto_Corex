const express = require('express');
const router = express.Router();
const ciudadanosController = require('../controllers/ciudadanos.controller');
const { validateSchema } = require('../middlewares/validator.middleware');
const { ciudadanoSchemas } = require('../validations/ciudadano.validation');

/**
 * @route POST /api/ciudadanos/register
 * @desc Registra un nuevo ciudadano en el portal
 * @access Public
 */
router.post('/register', 
  validateSchema(ciudadanoSchemas.register), 
  ciudadanosController.register
);

/**
 * @route POST /api/ciudadanos/verify
 * @desc Verifica la cuenta de un ciudadano usando el token de verificación
 * @access Public
 */
router.post('/verify', 
  validateSchema(ciudadanoSchemas.verify), 
  ciudadanosController.verifyAccount
);

/**
 * @route POST /api/ciudadanos/login
 * @desc Inicia sesión de un ciudadano
 * @access Public
 */
router.post('/login', 
  validateSchema(ciudadanoSchemas.login), 
  ciudadanosController.login
);

/**
 * @route POST /api/ciudadanos/request-reset
 * @desc Solicita un token para recuperación de contraseña
 * @access Public
 */
router.post('/request-reset', 
  validateSchema(ciudadanoSchemas.requestReset), 
  ciudadanosController.requestPasswordReset
);

/**
 * @route POST /api/ciudadanos/reset-password
 * @desc Restablece la contraseña usando un token de recuperación
 * @access Public
 */
router.post('/reset-password', 
  validateSchema(ciudadanoSchemas.resetPassword), 
  ciudadanosController.resetPassword
);

/**
 * @route POST /api/ciudadanos/reset-password-direct
 * @desc Restablece la contraseña directamente usando el email (sin token)
 * @access Public
 */
router.post('/reset-password-direct', 
  validateSchema(ciudadanoSchemas.resetPasswordDirect), 
  ciudadanosController.resetPasswordDirect
);

module.exports = router;