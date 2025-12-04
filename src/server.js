/**
 * Archivo de inicio del servidor ERP Municipal
 */

const app = require('./app');
const { sequelize } = require('./config/database');
const logger = require('./utils/logger');

// Configuración de variables de entorno
require('dotenv').config();

const BASE_PORT = parseInt(process.env.PORT, 10) || 3001;

function startServer(port, attemptsLeft = 5) {
  const server = app.listen(port, () => {
    logger.info(`Servidor ERP Municipal ejecutándose en el puerto ${port}`);
    console.log(`🚀 Servidor iniciado en http://localhost:${port}`);
  });
  server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE' && attemptsLeft > 0) {
      const nextPort = port + 1;
      console.warn(`Puerto ${port} en uso, intentando ${nextPort}...`);
      startServer(nextPort, attemptsLeft - 1);
    } else {
      throw err;
    }
  });
}

startServer(BASE_PORT);

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
