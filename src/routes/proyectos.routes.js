const express = require('express');
const router = express.Router();
const proyectosController = require('../controllers/proyectos.controller');
const { isAuthenticated, hasRole } = require('../middlewares/auth.middleware');
const { validateSchema, validateParams } = require('../middlewares/validator.middleware');
const { 
  idSchema,
  proyectoQuerySchema,
  createProyectoSchema,
  updateProyectoSchema
} = require('../validations/proyecto.validation');

/**
 * @route GET /api/proyectos
 * @desc Obtiene todos los proyectos con paginación y filtros
 * @access Público (con restricciones por rol)
 */
router.get(
  '/',
  isAuthenticated,
  validateSchema(proyectoQuerySchema, 'query'),
  proyectosController.getAllProyectos
);

/**
 * @route GET /api/proyectos/:id
 * @desc Obtiene un proyecto por su ID
 * @access Público (con restricciones por rol)
 */
router.get(
  '/:id',
  isAuthenticated,
  validateParams(idSchema),
  proyectosController.getProyectoById
);

/**
 * @route POST /api/proyectos
 * @desc Crea un nuevo proyecto
 * @access Privado (admin y funcionarios)
 */
router.post(
  '/',
  isAuthenticated,
  hasRole(['admin', 'funcionario']),
  validateSchema(createProyectoSchema),
  proyectosController.createProyecto
);

/**
 * @route PUT /api/proyectos/:id
 * @desc Actualiza un proyecto existente
 * @access Privado (admin y funcionarios con restricciones)
 */
router.put(
  '/:id',
  isAuthenticated,
  hasRole(['admin', 'funcionario']),
  validateParams(idSchema),
  validateSchema(updateProyectoSchema),
  proyectosController.updateProyecto
);

/**
 * @route DELETE /api/proyectos/:id
 * @desc Elimina un proyecto
 * @access Privado (solo admin)
 */
router.delete(
  '/:id',
  isAuthenticated,
  hasRole(['admin']),
  validateParams(idSchema),
  proyectosController.deleteProyecto
);

/**
 * @route GET /api/proyectos/:id/pdf
 * @desc Genera un PDF con la información del proyecto
 * @access Público (con restricciones por rol)
 */
router.get(
  '/:id/pdf',
  isAuthenticated,
  validateParams(idSchema),
  proyectosController.generateProyectoPDF
);

/**
 * @route GET /api/proyectos/stats
 * @desc Obtiene estadísticas de proyectos
 * @access Privado (admin y funcionarios)
 */
router.get(
  '/stats/general',
  isAuthenticated,
  hasRole(['admin', 'funcionario']),
  proyectosController.getProyectosStats
);

module.exports = router;
