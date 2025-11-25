const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { isAuthenticated, hasRole } = require('../middlewares/auth.middleware');

/**
 * @route GET /api/dashboard/resumen
 * @desc Obtiene el resumen general del dashboard
 * @access Private - Admin, Funcionario
 */
router.get('/resumen', 
  isAuthenticated, 
  hasRole(['superadmin', 'funcionario']),
  dashboardController.getResumenGeneral
);

/**
 * @route GET /api/dashboard/departamento/:departamento_id?
 * @desc Obtiene el resumen por departamento
 * @access Private - Admin, Funcionario
 */
router.get('/departamento/:departamento_id?', 
  isAuthenticated, 
  hasRole(['superadmin', 'funcionario']),
  dashboardController.getResumenDepartamento
);

module.exports = router;
