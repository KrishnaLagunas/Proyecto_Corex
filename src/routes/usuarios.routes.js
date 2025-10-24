const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuarios.controller');
const authController = require('../controllers/auth.controller');
const { isAuthenticated, hasRole } = require('../middlewares/auth.middleware');
const { validateSchema, validateParams, validateQuery } = require('../middlewares/validator.middleware');
const { 
  idSchema,
  usuarioQuerySchema,
  createUsuarioSchema,
  updateUsuarioSchema,
  changePasswordSchema,
  changeEstadoSchema
} = require('../validations/usuario.validation');

/**
 * @route GET /api/usuarios
 * @desc Obtiene todos los usuarios con paginación y filtros
 * @access Privado (solo admin)
 */
router.get(
  '/',
  isAuthenticated,
  hasRole(['admin']),
  validateQuery(usuarioQuerySchema),
  usuariosController.getAllUsuarios
);

/**
 * @route GET /api/usuarios/:id
 * @desc Obtiene un usuario por su ID
 * @access Privado (admin o el propio usuario)
 */
router.get(
  '/:id',
  isAuthenticated,
  validateParams(idSchema),
  usuariosController.getUsuarioById
);

/**
 * @route POST /api/usuarios
 * @desc Crea un nuevo usuario
 * @access Privado (solo admin)
 */
router.post(
  '/',
  isAuthenticated,
  hasRole(['admin']),
  validateSchema(createUsuarioSchema),
  usuariosController.createUsuario
);

/**
 * @route PUT /api/usuarios/:id
 * @desc Actualiza un usuario existente
 * @access Privado (admin o el propio usuario con restricciones)
 */
router.put(
  '/:id',
  isAuthenticated,
  validateParams(idSchema),
  validateSchema(updateUsuarioSchema),
  usuariosController.updateUsuario
);

/**
 * @route DELETE /api/usuarios/:id
 * @desc Elimina un usuario
 * @access Privado (solo admin)
 */
router.delete(
  '/:id',
  isAuthenticated,
  hasRole(['admin']),
  validateParams(idSchema),
  usuariosController.deleteUsuario
);

/**
 * @route PUT /api/usuarios/:id/password
 * @desc Cambia la contraseña de un usuario
 * @access Privado (admin o el propio usuario)
 */
router.put(
  '/:id/password',
  isAuthenticated,
  validateParams(idSchema),
  validateSchema(changePasswordSchema),
  usuariosController.changePassword
);

/**
 * @route PUT /api/usuarios/:id/estado
 * @desc Cambia el estado de un usuario (activo/inactivo)
 * @access Privado (solo admin)
 */
router.put(
  '/:id/estado',
  isAuthenticated,
  hasRole(['admin']),
  validateParams(idSchema),
  validateSchema(changeEstadoSchema),
  usuariosController.changeEstado
);

/**
 * @route GET /api/usuarios/stats/general
 * @desc Obtiene estadísticas de usuarios
 * @access Privado (solo admin)
 */
router.get(
  '/stats/general',
  isAuthenticated,
  hasRole(['admin']),
  usuariosController.getUsuariosStats
);

/**
 * @route GET /api/usuarios/perfil
 * @desc Obtiene el perfil del usuario autenticado
 * @access Privado (usuario autenticado)
 */
router.get(
  '/perfil',
  isAuthenticated,
  authController.getProfile
);

module.exports = router;