const express = require('express');
const router = express.Router();
const geografiaController = require('../controllers/geografia.controller');

// Listar regiones
router.get('/regiones', geografiaController.getRegiones);

// Listar comunas por región
router.get('/regiones/:regionId/comunas', geografiaController.getComunasByRegion);

module.exports = router;