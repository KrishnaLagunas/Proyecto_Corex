const express = require('express');
const router = express.Router();
const departamentosController = require('../controllers/departamentos.controller');
const { isAuthenticated, hasRole } = require('../middlewares/auth.middleware');
const { validateSchema, validateParams } = require('../middlewares/validator.middleware');
const { 
  idSchema,
  departamentoQuerySchema,
  createDepartamentoSchema,
  updateDepartamentoSchema,
  asignarFuncionariosSchema
} = require('../validations/departamento.validation');

/**
 * @route GET /api/departamentos
 * @desc Obtiene todos los departamentos con paginación y filtros
 * @access Público (con restricciones por rol)
 */
router.get(
  '/',
  isAuthenticated,
  validateSchema(departamentoQuerySchema, 'query'),
  departamentosController.getAllDepartamentos
);

/**
 * @route GET /api/departamentos/:id
 * @desc Obtiene un departamento por su ID
 * @access Público (con restricciones por rol)
 */
router.get(
  '/:id',
  isAuthenticated,
  validateParams(idSchema),
  departamentosController.getDepartamentoById
);

/**
 * @route POST /api/departamentos
 * @desc Crea un nuevo departamento
 * @access Privado (solo admin)
 */
router.post(
  '/',
  isAuthenticated,
  hasRole(['admin']),
  validateSchema(createDepartamentoSchema),
  departamentosController.createDepartamento
);

/**
 * @route PUT /api/departamentos/:id
 * @desc Actualiza un departamento existente
 * @access Privado (solo admin)
 */
router.put(
  '/:id',
  isAuthenticated,
  hasRole(['admin']),
  validateParams(idSchema),
  validateSchema(updateDepartamentoSchema),
  departamentosController.updateDepartamento
);

/**
 * @route DELETE /api/departamentos/:id
 * @desc Elimina un departamento
 * @access Privado (solo admin)
 */
router.delete(
  '/:id',
  isAuthenticated,
  hasRole(['admin']),
  validateParams(idSchema),
  departamentosController.deleteDepartamento
);

/**
 * @route POST /api/departamentos/:id/funcionarios
 * @desc Asigna funcionarios a un departamento
 * @access Privado (solo admin)
 */
router.post(
  '/:id/funcionarios',
  isAuthenticated,
  hasRole(['admin']),
  validateParams(idSchema),
  validateSchema(asignarFuncionariosSchema),
  departamentosController.asignarFuncionarios
);

/**
 * @route GET /api/departamentos/stats/general
 * @desc Obtiene estadísticas de departamentos
 * @access Privado (solo admin)
 */
router.get(
  '/stats/general',
  isAuthenticated,
  hasRole(['admin']),
  departamentosController.getDepartamentosStats
);

module.exports = router;
