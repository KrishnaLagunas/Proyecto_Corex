const express = require('express');
const router = express.Router();
const contratosController = require('../controllers/contratos.controller');
const { isAuthenticated, hasRole } = require('../middlewares/auth.middleware');
const { validateSchema, validateParams } = require('../middlewares/validator.middleware');
const { 
  contratoIdSchema,
  contratoQuerySchema,
  createContratoSchema,
  updateContratoSchema
} = require('../validations/contrato.validation');

/**
 * @route GET /api/contratos
 * @desc Obtiene todos los contratos con paginación y filtros
 * @access Público (con restricciones para ciudadanos)
 */
router.get(
  '/',
  isAuthenticated,
  validateSchema(contratoQuerySchema, 'query'),
  contratosController.getAllContratos
);

/**
 * @route GET /api/contratos/:id
 * @desc Obtiene un contrato por su ID
 * @access Público (con restricciones para ciudadanos)
 */
router.get(
  '/:id',
  isAuthenticated,
  validateParams(contratoIdSchema),
  contratosController.getContratoById
);

/**
 * @route POST /api/contratos
 * @desc Crea un nuevo contrato
 * @access Privado - Admin, Funcionario
 */
router.post(
  '/',
  isAuthenticated,
  hasRole(['superadmin', 'funcionario']),
  validateSchema(createContratoSchema),
  contratosController.createContrato
);

/**
 * @route PUT /api/contratos/:id
 * @desc Actualiza un contrato existente
 * @access Privado - Admin, Funcionario (con restricciones)
 */
router.put(
  '/:id',
  isAuthenticated,
  hasRole(['superadmin', 'funcionario']),
  validateParams(contratoIdSchema),
  validateSchema(updateContratoSchema),
  contratosController.updateContrato
);

/**
 * @route DELETE /api/contratos/:id
 * @desc Elimina un contrato
 * @access Privado - Admin
 */
router.delete(
  '/:id',
  isAuthenticated,
  hasRole(['superadmin']),
  validateParams(contratoIdSchema),
  contratosController.deleteContrato
);

/**
 * @route GET /api/contratos/:id/pdf
 * @desc Genera un PDF con la información del contrato
 * @access Público (con restricciones para ciudadanos)
 */
router.get(
  '/:id/pdf',
  isAuthenticated,
  validateParams(contratoIdSchema),
  contratosController.generateContratoPDF
);

/**
 * @route GET /api/contratos/stats/general
 * @desc Obtiene estadísticas de contratos
 * @access Privado - Admin, Funcionario
 */
router.get(
  '/stats/general',
  isAuthenticated,
  hasRole(['superadmin', 'funcionario']),
  contratosController.getContratosStats
);

module.exports = router;
