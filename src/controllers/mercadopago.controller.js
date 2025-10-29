/**
 * Controlador para integración con Mercado Pago
 */

const logger = require('../utils/logger');

// Helper para realizar POST JSON con https (sin dependencias externas)
const https = require('https');

function postJSON({ host, path, headers, body }) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body || {});
    const options = {
      host,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...(headers || {})
      }
    };

    const req = https.request(options, (res) => {
      let raw = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { raw += chunk; });
      res.on('end', () => {
        try {
          const json = raw ? JSON.parse(raw) : {};
          if (res.statusCode < 200 || res.statusCode >= 300) {
            const err = new Error(json?.message || `HTTP ${res.statusCode}`);
            err.status = res.statusCode;
            err.body = json;
            return reject(err);
          }
          resolve(json);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

const mercadoPagoController = {
  /**
   * Crea una preferencia de pago en Mercado Pago y devuelve la URL de checkout
   */
  createPreference: async (req, res, next) => {
    try {
      const { items, metadata } = req.body || {};
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: 'Items requeridos para crear preferencia' });
      }

      const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN
        || process.env.MP_ACCESS_TOKEN
        // Fallback para desarrollo según credenciales provistas por el usuario
        || 'APP_USR-7883701949082774-102918-d2dc28f14df7d988f18caedb5011b2d5-2955361080';

      const normalizedItems = items.map((it) => ({
        title: it.title || `Pago Trámite ${it.id ?? ''}`.trim(),
        quantity: parseInt(it.quantity ?? 1, 10),
        unit_price: Number(it.unit_price ?? 0),
        currency_id: it.currency_id || 'CLP'
      }));

      const baseUrl = process.env.PUBLIC_BASE_URL || process.env.APP_BASE_URL || `${req.protocol}://${req.get('host')}`;

      const prefBody = {
        items: normalizedItems,
        back_urls: {
          success: `${baseUrl}/pago.html?estado=aprobado`,
          failure: `${baseUrl}/pago.html?estado=falla`,
          pending: `${baseUrl}/pago.html?estado=pendiente`
        },
        // Nota: Se elimina auto_return para evitar errores 400 cuando las back_urls
        // usan HTTP/localhost en desarrollo. Mercado Pago exige back_urls.success
        // válidas cuando auto_return está presente.
        metadata: {
          usuario_id: req.user?.id,
          origen: 'erp-municipal',
          ...(metadata || {})
        }
      };

      logger.info('Creando preferencia de Mercado Pago', { items: normalizedItems.length });

      const response = await postJSON({
        host: 'api.mercadopago.com',
        path: '/checkout/preferences',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: prefBody
      });

      return res.json({
        init_point: response.init_point,
        sandbox_init_point: response.sandbox_init_point,
        preference_id: response.id
      });
    } catch (error) {
      logger.error('Error al crear preferencia de Mercado Pago', error);
      if (error.status) {
        return res.status(error.status).json({
          message: error.message || 'Error al crear preferencia',
          error: error.body || null
        });
      }
      next(error);
    }
  }
};

module.exports = mercadoPagoController;