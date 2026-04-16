const express = require('express');
const router = express.Router();
const { Municipalidad, Departamento } = require('../models');
const { isAuthenticated } = require('../middlewares/auth.middleware');
const logger = require('../utils/logger');

/**
 * @route GET /api/publica/municipalidades
 * @desc Lista todas las municipalidades activas para el portal
 * @access Autenticado (Ciudadanos)
 */
router.get('/municipalidades', isAuthenticated, async (req, res, next) => {
  try {
    const rows = await Municipalidad.findAll({
      where: { estado: 'activo' },
      order: [['nombre', 'ASC']]
    });
    
    // Devolvemos el formato que espera el frontend
    res.json({
      success: true,
      departamentos: rows, // El frontend espera la clave 'departamentos' o el array directamente
      data: rows
    });
    
    try { logger.info(`[Publica] ${rows.length} municipalidades enviadas al portal`); } catch (_) {}
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/publica/departamentos
 * @desc Lista todos los departamentos activos para el portal
 * @access Autenticado (Ciudadanos)
 */
router.get('/departamentos', isAuthenticated, async (req, res, next) => {
  try {
    const rows = await Departamento.findAll({
      where: { estado: 'activo' },
      order: [['nombre', 'ASC']]
    });
    
    res.json({
      success: true,
      departamentos: rows,
      data: rows
    });
    
    try { logger.info(`[Publica] ${rows.length} departamentos enviados al portal`); } catch (_) {}
  } catch (error) {
    next(error);
  }
});

module.exports = router;
