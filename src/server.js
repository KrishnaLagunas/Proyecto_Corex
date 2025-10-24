/**
 * Archivo de inicio del servidor ERP Municipal
 */

const app = require('./app');
const { sequelize } = require('./config/database');
const logger = require('./utils/logger');

// Configuración de variables de entorno
require('dotenv').config();

const PORT = process.env.PORT || 3001;

// Arranque del servidor (sin dependencia de base de datos)
app.listen(PORT, () => {
  logger.info(`Servidor ERP Municipal ejecutándose en el puerto ${PORT}`);
  console.log(`🚀 Servidor iniciado en http://localhost:${PORT}`);
});

// Intentar conexión a base de datos en segundo plano (sin sincronización automática)
sequelize.authenticate()
  .then(() => {
    logger.info('Conexión a la base de datos establecida correctamente');
    console.log('✅ Base de datos conectada exitosamente');
  })
  .catch(err => {
    logger.error('Error al conectar con la base de datos:', err);
    console.log('⚠️  Base de datos no disponible, pero el servidor está funcionando');
  });