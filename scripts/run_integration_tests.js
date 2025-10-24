/**
 * Script para ejecutar pruebas de integración del ERP Municipal
 */

const { spawn } = require('child_process');
const path = require('path');
const logger = require('../src/utils/logger');

// Configuración del entorno para pruebas
process.env.NODE_ENV = 'test';
process.env.DB_NAME = 'erp_municipal_test';

/**
 * Ejecuta las pruebas de integración
 */
async function runIntegrationTests() {
  logger.info('Iniciando pruebas de integración...');

  try {
    // Ejecutar Jest con la configuración para pruebas de integración
    const jestProcess = spawn('npx', [
      'jest',
      '--testMatch',
      '**/tests/integration/**/*.test.js',
      '--forceExit',
      '--detectOpenHandles',
      '--runInBand'
    ], {
      stdio: 'inherit',
      shell: true
    });

    return new Promise((resolve, reject) => {
      jestProcess.on('close', (code) => {
        if (code === 0) {
          logger.info('Pruebas de integración completadas exitosamente');
          resolve();
        } else {
          logger.error(`Pruebas de integración fallaron con código de salida ${code}`);
          reject(new Error(`Pruebas fallaron con código de salida ${code}`));
        }
      });

      jestProcess.on('error', (err) => {
        logger.error('Error al ejecutar las pruebas de integración:', err);
        reject(err);
      });
    });
  } catch (error) {
    logger.error('Error al ejecutar las pruebas de integración:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  runIntegrationTests()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Error en las pruebas de integración:', error);
      process.exit(1);
    });
}

module.exports = runIntegrationTests;