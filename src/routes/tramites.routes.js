const express = require('express');
const router = express.Router();
const tramitesController = require('../controllers/tramites.controller');
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
  tramitesController.getAllTramites
);

/**
 * @route GET /api/tramites/:id
 * @desc Obtiene un trámite por su ID
 * @access Private
 */
// Rutas específicas deben declararse antes de rutas paramétricas para evitar colisiones
router.get('/stats/general', 
  isAuthenticated, 
  hasRole(['admin', 'funcionario']),
  tramitesController.getTramitesStats
);

router.get('/tipos', 
  isAuthenticated,
  tramitesController.getTiposTramites
);

// Nueva ruta para configuración de pago de trámites
router.get('/configuracion-pago',
  isAuthenticated,
  validateQuery(tramiteSchemas.queryPagoConfig),
  tramitesController.getConfiguracionPago
);

router.post('/tipos', 
  isAuthenticated,
  hasRole(['admin', 'supervisor']),
  tramitesController.createTipoTramite
);

// Rutas anidadas específicas por trámite
router.get('/:id/documentos',
  isAuthenticated,
  validateParams(tramiteSchemas.idParam),
  tramitesController.getDocumentosByTramiteId
);

router.post('/:id/documentos',
  isAuthenticated,
  validateParams(tramiteSchemas.idParam),
  // middleware de subida de archivo (acepta 'archivo' o 'documento')
  require('../middlewares/upload.middleware').documentos.fields([
    { name: 'archivo', maxCount: 1 },
    { name: 'documento', maxCount: 1 }
  ]),
  tramitesController.subirDocumentoTramite
);

router.get('/:id/pagos',
  isAuthenticated,
  validateParams(tramiteSchemas.idParam),
  tramitesController.getPagosByTramiteId
);

router.get('/:id/historial',
  isAuthenticated,
  validateParams(tramiteSchemas.idParam),
  tramitesController.getHistorialByTramiteId
);

router.put('/:id/estado',
  isAuthenticated,
  validateParams(tramiteSchemas.idParam),
  tramitesController.updateTramiteEstado
);

// Constancia/boleta para trámites pagados o gratuitos
router.get('/:id/constancia',
  isAuthenticated,
  validateParams(tramiteSchemas.idParam),
  tramitesController.generateConstancia
);

// Rutas paramétricas al final para no captar rutas específicas como '/tipos'
router.get('/:id', 
  isAuthenticated, 
  validateParams(tramiteSchemas.idParam), 
  tramitesController.getTramiteById
);

/**
 * @route POST /api/tramites
 * @desc Crea un nuevo trámite
 * @access Private
 */
router.post('/', 
  isAuthenticated, 
  validateSchema(tramiteSchemas.createTramite), 
  tramitesController.createTramite
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
  tramitesController.updateTramite
);

/**
 * @route DELETE /api/tramites/:id
 * @desc Elimina un trámite (solo administradores)
 * @access Private/Admin
 */
router.delete('/:id', 
  isAuthenticated, 
  hasRole(['admin']),
  validateParams(tramiteSchemas.idParam), 
  tramitesController.deleteTramite
);

/**
 * @route GET /api/tramites/stats/general
 * @desc Obtiene estadísticas de trámites
 * @access Private/Admin/Funcionario
 */
// (rutas de '/stats/general' y '/tipos' movidas arriba para evitar conflicto con '/:id')

module.exports = router;