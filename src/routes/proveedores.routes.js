const express = require('express');
const router = express.Router();
const proveedoresController = require('../controllers/proveedores.controller');
const { isAuthenticated, hasRole } = require('../middlewares/auth.middleware');
const { validateSchema, validateParams } = require('../middlewares/validator.middleware');
const { 
  proveedorIdSchema,
  proveedorQuerySchema,
  createProveedorSchema,
  updateProveedorSchema
} = require('../validations/proveedor.validation');

/**
 * @route GET /api/proveedores
 * @desc Obtiene todos los proveedores con paginación y filtros
 * @access Público (con restricciones para ciudadanos)
 */
router.get(
  '/',
  isAuthenticated,
  validateSchema(proveedorQuerySchema, 'query'),
  proveedoresController.getAllProveedores
);

/**
 * @route GET /api/proveedores/:id
 * @desc Obtiene un proveedor por su ID
 * @access Público (con restricciones para ciudadanos)
 */
router.get(
  '/:id',
  isAuthenticated,
  validateParams(proveedorIdSchema),
  proveedoresController.getProveedorById
);

/**
 * @route POST /api/proveedores
 * @desc Crea un nuevo proveedor
 * @access Privado - Admin, Funcionario
 */
router.post(
  '/',
  isAuthenticated,
  hasRole(['admin', 'funcionario']),
  validateSchema(createProveedorSchema),
  proveedoresController.createProveedor
);

/**
 * @route PUT /api/proveedores/:id
 * @desc Actualiza un proveedor existente
 * @access Privado - Admin, Funcionario
 */
router.put(
  '/:id',
  isAuthenticated,
  hasRole(['admin', 'funcionario']),
  validateParams(proveedorIdSchema),
  validateSchema(updateProveedorSchema),
  proveedoresController.updateProveedor
);

/**
 * @route DELETE /api/proveedores/:id
 * @desc Elimina un proveedor
 * @access Privado - Admin
 */
router.delete(
  '/:id',
  isAuthenticated,
  hasRole(['admin']),
  validateParams(proveedorIdSchema),
  proveedoresController.deleteProveedor
);

/**
 * @route GET /api/proveedores/stats/general
 * @desc Obtiene estadísticas de proveedores
 * @access Privado - Admin, Funcionario
 */
router.get(
  '/stats/general',
  isAuthenticated,
  hasRole(['admin', 'funcionario']),
  proveedoresController.getProveedoresStats
);

module.exports = router;