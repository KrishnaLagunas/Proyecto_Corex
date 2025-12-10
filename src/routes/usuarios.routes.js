const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuarios.controller');
const authController = require('../controllers/auth.controller');
const { isAuthenticated, hasRole } = require('../middlewares/auth.middleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
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
  hasRole(['administrador', 'superadministrador']),
  validateQuery(usuarioQuerySchema),
  usuariosController.getAllUsuarios
);

/**
 * @route GET /api/usuarios/:id
 * @desc Obtiene un usuario por su ID
 * @access Privado (admin o el propio usuario)
 */
router.get(
  '/:id(\\d+)',
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
  hasRole(['administrador', 'superadministrador']),
  validateSchema(createUsuarioSchema),
  usuariosController.createUsuario
);

/**
 * @route PUT /api/usuarios/:id
 * @desc Actualiza un usuario existente
 * @access Privado (admin o el propio usuario con restricciones)
 */
router.put(
  '/:id(\\d+)',
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
  '/:id(\\d+)',
  isAuthenticated,
  hasRole(['administrador', 'superadministrador']),
  validateParams(idSchema),
  usuariosController.deleteUsuario
);

/**
 * @route PUT /api/usuarios/:id/password
 * @desc Cambia la contraseña de un usuario
 * @access Privado (admin o el propio usuario)
 */
router.put(
  '/:id(\\d+)/password',
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
  '/:id(\\d+)/estado',
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
  hasRole(['administrador', 'superadministrador', 'funcionario']),
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

function ensureDir(dirPath) { try { if (!fs.existsSync(dirPath)) { fs.mkdirSync(dirPath, { recursive: true }); } } catch (_) {} }
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads/avatars');
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `user_${req.user.id}_${Date.now()}${ext}`;
    cb(null, name);
  }
});
const upload = multer({ storage });

router.get(
  '/perfil-usuario',
  isAuthenticated,
  usuariosController.getPerfilUsuario
);

router.post(
  '/perfil-usuario/foto',
  isAuthenticated,
  upload.single('foto'),
  usuariosController.subirFotoPerfil
);

module.exports = router;
