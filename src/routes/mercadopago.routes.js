const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middlewares/auth.middleware');
const mercadoPagoController = require('../controllers/mercadopago.controller');

/**
 * @route POST /api/mercado-pago/preferencias
 * @desc Crea una preferencia de pago en Mercado Pago y retorna la URL de checkout
 * @access Private (requiere autenticación)
 */
router.post('/preferencias', isAuthenticated, mercadoPagoController.createPreference);

module.exports = router;