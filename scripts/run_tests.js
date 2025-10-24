/**
 * Script para ejecutar pruebas unitarias del ERP Municipal
 */

require('dotenv').config();
const { exec } = require('child_process');
const path = require('path');
const logger = require('../src/utils/logger');

// Función para ejecutar un comando
function runCommand(command) {
  return new Promise((resolve, reject) => {
    logger.info(`Ejecutando: ${command}`);
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        logger.error(`Error al ejecutar el comando: ${error.message}`);
        return reject(error);
      }
      
      if (stderr) {
        logger.warn(`Advertencia: ${stderr}`);
      }
      
      logger.info(`Salida: ${stdout}`);
      resolve(stdout);
    });
  });
}

// Función principal para ejecutar pruebas
async function runTests() {
  try {
    logger.info('Iniciando ejecución de pruebas...');
    
    // Ejecutar pruebas con Jest
    await runCommand('npx jest --verbose');
    
    logger.info('Pruebas completadas exitosamente.');
    return true;
  } catch (error) {
    logger.error(`Error al ejecutar pruebas: ${error.message}`);
    logger.error(error.stack);
    return false;
  }
}

// Ejecutar la función
runTests()
  .then(success => {
    if (success) {
      logger.info('Proceso de pruebas completado.');
      process.exit(0);
    } else {
      logger.error('Proceso de pruebas falló.');
      process.exit(1);
    }
  })
  .catch(error => {
    logger.error(`Error inesperado: ${error.message}`);
    process.exit(1);
  });