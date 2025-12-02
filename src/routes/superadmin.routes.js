const express = require('express');
const router = express.Router();
const { isAuthenticated, hasRole } = require('../middlewares/auth.middleware');
const { validateSchema, validateParams, validateQuery } = require('../middlewares/validator.middleware');

// Controladores reutilizados
const dashboardController = require('../controllers/dashboard.controller');
const departamentosController = require('../controllers/departamentos.controller');
const usuariosController = require('../controllers/usuarios.controller');
const { Rol } = require('../models');

// Validaciones reutilizadas
const { 
  idSchema,
  departamentoQuerySchema,
  createDepartamentoSchema,
  updateDepartamentoSchema
} = require('../validations/departamento.validation');
const { createUsuarioSchema } = require('../validations/usuario.validation');

// Espacio del Superadministrador

// Nota: Superadministrador no tiene dashboard de métricas; se limita a gestión

// CRUD de municipalidades (alias de departamentos)
router.get('/municipalidades',
  isAuthenticated,
  hasRole(['superadministrador']),
  validateQuery(departamentoQuerySchema),
  departamentosController.getAllDepartamentos
);

router.get('/municipalidades/:id',
  isAuthenticated,
  hasRole(['superadministrador']),
  validateParams(idSchema),
  departamentosController.getDepartamentoById
);

router.post('/municipalidades',
  isAuthenticated,
  hasRole(['superadministrador']),
  validateSchema(createDepartamentoSchema),
  departamentosController.createDepartamento
);

router.put('/municipalidades/:id',
  isAuthenticated,
  hasRole(['superadministrador']),
  validateParams(idSchema),
  validateSchema(updateDepartamentoSchema),
  departamentosController.updateDepartamento
);

router.delete('/municipalidades/:id',
  isAuthenticated,
  hasRole(['superadministrador']),
  validateParams(idSchema),
  departamentosController.deleteDepartamento
);

// Crear usuarios administradores
router.post('/usuarios/administradores',
  isAuthenticated,
  hasRole(['superadministrador']),
  validateSchema(createUsuarioSchema),
  async (req, res, next) => {
    try {
      // Forzar rol administrador y exigir municipalidad
      const rolAdmin = await Rol.findOne({ where: { nombre: 'administrador' } });
      if (!rolAdmin) {
        return res.status(400).json({ success: false, message: 'Rol administrador no existe' });
      }
      req.body.id_rol = rolAdmin.id;
      if (!req.body.municipalidad_id) {
        return res.status(400).json({ success: false, message: 'municipalidad_id es obligatorio para administradores' });
      }
      return usuariosController.createUsuario(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
