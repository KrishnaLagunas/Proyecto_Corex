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
  hasRole(['administrador', 'superadministrador', 'funcionario']),
  dashboardController.getResumenGeneral
);

/**
 * @route GET /api/dashboard/departamento/:departamento_id?
 * @desc Obtiene el resumen por departamento
 * @access Private - Admin, Funcionario
 */
router.get('/departamento/:departamento_id?', 
  isAuthenticated, 
  hasRole(['administrador', 'superadministrador']),
  dashboardController.getResumenDepartamento
);

/**
 * @route GET /api/dashboard/municipalidades/ranking
 * @desc Ranking de uso por municipalidad (últimos 90 días)
 * @access Private - Superadministrador
 */
router.get('/municipalidades/ranking',
  isAuthenticated,
  hasRole(['superadministrador']),
  dashboardController.getMunicipalidadesRanking
);

module.exports = router;
