const express = require('express');
const router = express.Router();
// Cargar controlador dinámicamente para evitar conflictos ESM/CJS con top-level await
async function loadTramitesController() {
  const mod = await import('../controllers/tramites.controller');
  return mod.default || mod;
}
const { isAuthenticated, hasRole } = require('../middlewares/auth.middleware');
const { validateSchema, validateParams, validateQuery } = require('../middlewares/validator.middleware');
const { tramiteSchemas } = require('../validations/tramite.validation');

/**
 * @route GET /api/tramites
 * @desc Obtiene todos los trámites con paginación y filtros
 * @access Private
 */
router.get('/', 
  isAuthenticated, 
  validateQuery(tramiteSchemas.queryTramites), 
  async (req, res, next) => { const c = await loadTramitesController(); return c.getAllTramites(req, res, next); }
);

/**
 * @route GET /api/tramites/:id
 * @desc Obtiene un trámite por su ID
 * @access Private
 */
// Rutas específicas deben declararse antes de rutas paramétricas para evitar colisiones
router.get('/stats/general', 
  isAuthenticated, 
  hasRole(['administrador', 'superadministrador', 'secretaria comunitaria']),
  async (req, res, next) => { const c = await loadTramitesController(); return c.getTramitesStats(req, res, next); }
);

router.get('/tipos', 
  isAuthenticated,
  async (req, res, next) => { const c = await loadTramitesController(); return c.getTiposTramites(req, res, next); }
);

// Nueva ruta para configuración de pago de trámites
router.get('/configuracion-pago',
  isAuthenticated,
  validateQuery(tramiteSchemas.queryPagoConfig),
  async (req, res, next) => { const c = await loadTramitesController(); return c.getConfiguracionPago(req, res, next); }
);

router.post('/tipos', 
  isAuthenticated,
  hasRole(['administrador', 'superadministrador']),
  async (req, res, next) => { const c = await loadTramitesController(); return c.createTipoTramite(req, res, next); }
);

// Rutas anidadas específicas por trámite
router.get('/:id/documentos',
  isAuthenticated,
  validateParams(tramiteSchemas.idParam),
  async (req, res, next) => { const c = await loadTramitesController(); return c.getDocumentosByTramiteId(req, res, next); }
);

router.post('/:id/documentos',
  isAuthenticated,
  validateParams(tramiteSchemas.idParam),
  // middleware de subida de archivo (acepta 'archivo' o 'documento')
  require('../middlewares/upload.middleware').documentos.fields([
    { name: 'archivo', maxCount: 1 },
    { name: 'documento', maxCount: 1 }
  ]),
  async (req, res, next) => { const c = await loadTramitesController(); return c.subirDocumentoTramite(req, res, next); }
);

router.get('/:id/pagos',
  isAuthenticated,
  validateParams(tramiteSchemas.idParam),
  async (req, res, next) => { const c = await loadTramitesController(); return c.getPagosByTramiteId(req, res, next); }
);

router.get('/:id/historial',
  isAuthenticated,
  validateParams(tramiteSchemas.idParam),
  async (req, res, next) => { const c = await loadTramitesController(); return c.getHistorialByTramiteId(req, res, next); }
);

router.put('/:id/estado',
  isAuthenticated,
  validateParams(tramiteSchemas.idParam),
  async (req, res, next) => { const c = await loadTramitesController(); return c.updateTramiteEstado(req, res, next); }
);

// Constancia/boleta para trámites pagados o gratuitos
router.get('/:id/constancia',
  isAuthenticated,
  validateParams(tramiteSchemas.idParam),
  async (req, res, next) => { const c = await loadTramitesController(); return c.generateConstancia(req, res, next); }
);

// Constancia/boleta desde datos locales (PDF descargable)
router.post('/constancia/local',
  async (req, res, next) => { const c = await loadTramitesController(); return c.generateConstanciaLocal(req, res, next); }
);

// Rutas paramétricas al final para no captar rutas específicas como '/tipos'
router.get('/:id', 
  isAuthenticated, 
  validateParams(tramiteSchemas.idParam), 
  async (req, res, next) => { const c = await loadTramitesController(); return c.getTramiteById(req, res, next); }
);

/**
 * @route POST /api/tramites
 * @desc Crea un nuevo trámite
 * @access Private
 */
router.post('/', 
  isAuthenticated, 
  validateSchema(tramiteSchemas.createTramite), 
  async (req, res, next) => { const c = await loadTramitesController(); return c.createTramite(req, res, next); }
);

/**
 * @route PUT /api/tramites/:id
 * @desc Actualiza un trámite existente
 * @access Private
 */
router.put('/:id', 
  isAuthenticated, 
  validateParams(tramiteSchemas.idParam),
  validateSchema(tramiteSchemas.updateTramite), 
  async (req, res, next) => { const c = await loadTramitesController(); return c.updateTramite(req, res, next); }
);

/**
 * @route DELETE /api/tramites/:id
 * @desc Elimina un trámite (solo administradores)
 * @access Private/Admin
 */
router.delete('/:id', 
  isAuthenticated, 
  hasRole(['administrador', 'superadministrador']),
  validateParams(tramiteSchemas.idParam), 
  async (req, res, next) => { const c = await loadTramitesController(); return c.deleteTramite(req, res, next); }
);

/**
 * @route GET /api/tramites/stats/general
 * @desc Obtiene estadísticas de trámites
 * @access Private/Admin/Funcionario
 */
// (rutas de '/stats/general' y '/tipos' movidas arriba para evitar conflicto con '/:id')

module.exports = router;
