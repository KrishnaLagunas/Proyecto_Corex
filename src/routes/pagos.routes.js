const express = require('express');
const router = express.Router();
const pagosController = require('../controllers/pagos.controller');
const { isAuthenticated, hasRole } = require('../middlewares/auth.middleware');
const { validateSchema, validateParams } = require('../middlewares/validator.middleware');
const { pagoSchemas } = require('../validations/pago.validation');

/**
 * @route GET /api/pagos
 * @desc Obtiene todos los pagos con paginación y filtros
 * @access Private
 */
router.get('/', 
  isAuthenticated, 
  validateSchema(pagoSchemas.queryPagos), 
  pagosController.getAllPagos
);

/**
 * @route GET /api/pagos/:id
 * @desc Obtiene un pago por su ID
 * @access Private
 */
router.get('/:id', 
  isAuthenticated, 
  validateParams(pagoSchemas.idParam), 
  pagosController.getPagoById
);

/**
 * @route POST /api/pagos
 * @desc Crea un nuevo pago
 * @access Private
 */
router.post('/', 
  isAuthenticated, 
  validateSchema(pagoSchemas.createPago), 
  pagosController.createPago
);

/**
 * @route PUT /api/pagos/:id
 * @desc Actualiza un pago existente
 * @access Private/Funcionario/Admin
 */
router.put('/:id', 
  isAuthenticated, 
  hasRole(['superadmin', 'funcionario']),
  validateParams(pagoSchemas.idParam),
  validateSchema(pagoSchemas.updatePago), 
  pagosController.updatePago
);

/**
 * @route GET /api/pagos/:id/comprobante
 * @desc Genera un comprobante de pago en PDF
 * @access Private
 */
router.get('/:id/comprobante', 
  isAuthenticated, 
  validateParams(pagoSchemas.idParam), 
  pagosController.generateComprobante
);

/**
 * @route GET /api/pagos/:id/procesar
 * @desc Procesa un pago
 * @access Private
 */
router.put('/:id/procesar',
  isAuthenticated,
  validateParams(pagoSchemas.idParam),
  validateSchema(pagoSchemas.processPago),
  pagosController.procesarPago
);

router.post('/:id/procesar',
  isAuthenticated,
  validateParams(pagoSchemas.idParam),
  validateSchema(pagoSchemas.processPago),
  pagosController.procesarPago
);

/**
 * @route GET /api/pagos/stats/general
 * @desc Obtiene estadísticas de pagos
 * @access Private/Admin/Funcionario
 */
router.get('/stats/general', 
  isAuthenticated, 
  hasRole(['superadmin', 'funcionario']),
  pagosController.getPagosStats
);

module.exports = router;
