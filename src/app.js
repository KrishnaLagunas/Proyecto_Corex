/**
 * Archivo principal de la aplicación ERP Municipal
 * Configura y arranca el servidor Express
 */

// Importaciones de módulos
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const { sequelize } = require('./config/database');
const errorHandler = require('./middlewares/errorHandler');
const logger = require('./utils/logger');

// Importar rutas
const authRoutes = require('./routes/auth.routes');
const usuariosRoutes = require('./routes/usuarios.routes');
const ciudadanosRoutes = require('./routes/ciudadanos.routes');
const departamentosRoutes = require('./routes/departamentos.routes');
const tramitesRoutes = require('./routes/tramites.routes');
const pagosRoutes = require('./routes/pagos.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const superadminRoutes = require('./routes/superadmin.routes');
const geografiaRoutes = require('./routes/geografia.routes');
const mercadoPagoRoutes = require('./routes/mercadopago.routes');
// const ciudadanoRoutes = require('./routes/ciudadano.routes');

// Configuración de variables de entorno
require('dotenv').config();

// Inicialización de la aplicación Express
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, '../public')));
// Servir archivos subidos (documentos)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/ciudadanos', ciudadanosRoutes);
app.use('/api/municipalidades', departamentosRoutes);
app.use('/api/departamentos', departamentosRoutes);
app.use('/api/tramites', tramitesRoutes);
app.use('/api/pagos', pagosRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/superadmin', superadminRoutes);
app.use('/api/geografia', geografiaRoutes);
app.use('/api/mercado-pago', mercadoPagoRoutes);
// app.use('/api/ciudadano', ciudadanoRoutes);

// Middleware para manejar rutas de API no encontradas
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta de API no encontrada: ${req.originalUrl}`
  });
});

// Ruta principal para el frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Servir archivos estáticos para rutas no API
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Middleware para manejo de errores
app.use(errorHandler);

// Exportar la aplicación para ser utilizada en server.js

module.exports = app;
