const express = require('express');
const router = express.Router();
const presupuestosController = require('../controllers/presupuestos.controller');
const { isAuthenticated, hasRole } = require('../middlewares/auth.middleware');
const { validateSchema, validateParams } = require('../middlewares/validator.middleware');
const { 
  presupuestoIdSchema,
  presupuestoQuerySchema,
  createPresupuestoSchema,
  updatePresupuestoSchema
} = require('../validations/presupuesto.validation');

/**
 * @route GET /api/presupuestos
 * @desc Obtiene todos los presupuestos con paginación y filtros
 * @access Privado - Admin, Funcionario
 */
router.get(
  '/',
  isAuthenticated,
  hasRole(['superadmin', 'funcionario']),
  validateSchema(presupuestoQuerySchema, 'query'),
  presupuestosController.getAllPresupuestos
);

/**
 * @route GET /api/presupuestos/:id
 * @desc Obtiene un presupuesto por su ID
 * @access Privado - Admin, Funcionario
 */
router.get(
  '/:id',
  isAuthenticated,
  hasRole(['superadmin', 'funcionario']),
  validateParams(presupuestoIdSchema),
  presupuestosController.getPresupuestoById
);

/**
 * @route POST /api/presupuestos
 * @desc Crea un nuevo presupuesto
 * @access Privado - Admin
 */
router.post(
  '/',
  isAuthenticated,
  hasRole(['superadmin']),
  validateSchema(createPresupuestoSchema),
  presupuestosController.createPresupuesto
);

/**
 * @route PUT /api/presupuestos/:id
 * @desc Actualiza un presupuesto existente
 * @access Privado - Admin, Funcionario (con restricciones)
 */
router.put(
  '/:id',
  isAuthenticated,
  hasRole(['superadmin', 'funcionario']),
  validateParams(presupuestoIdSchema),
  validateSchema(updatePresupuestoSchema),
  presupuestosController.updatePresupuesto
);

/**
 * @route DELETE /api/presupuestos/:id
 * @desc Elimina un presupuesto
 * @access Privado - Admin
 */
router.delete(
  '/:id',
  isAuthenticated,
  hasRole(['admin']),
  validateParams(presupuestoIdSchema),
  presupuestosController.deletePresupuesto
);

/**
 * @route GET /api/presupuestos/stats/general
 * @desc Obtiene estadísticas de presupuestos
 * @access Privado - Admin, Funcionario
 */
router.get(
  '/stats/general',
  isAuthenticated,
  hasRole(['superadmin', 'funcionario']),
  presupuestosController.getPresupuestosStats
);

module.exports = router;
