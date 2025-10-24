/**
 * Script para configurar el entorno del ERP Municipal
 * Este script ejecuta la inicialización de la base de datos y carga los datos de prueba
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

// Función principal para configurar el entorno
async function setupEnvironment() {
  try {
    logger.info('Iniciando configuración del entorno...');
    
    // Paso 1: Inicializar la base de datos
    logger.info('Paso 1: Inicializando la base de datos...');
    await runCommand('node ' + path.join(__dirname, 'db_init.js'));
    
    // Paso 2: Cargar datos de prueba
    logger.info('Paso 2: Cargando datos de prueba...');
    await runCommand('node ' + path.join(__dirname, 'seed_data.js'));
    
    logger.info('Configuración del entorno completada exitosamente.');
    return true;
  } catch (error) {
    logger.error(`Error al configurar el entorno: ${error.message}`);
    logger.error(error.stack);
    return false;
  }
}

// Ejecutar la función
setupEnvironment()
  .then(success => {
    if (success) {
      logger.info('Proceso de configuración del entorno completado.');
      process.exit(0);
    } else {
      logger.error('Proceso de configuración del entorno falló.');
      process.exit(1);
    }
  })
  .catch(error => {
    logger.error(`Error inesperado: ${error.message}`);
    process.exit(1);
  });