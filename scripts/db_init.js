/**
 * Script para inicializar la base de datos del ERP Municipal
 * Este script crea la base de datos y sincroniza los modelos
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');
const logger = require('../src/utils/logger');
const config = require('../src/config/database');

// Función para crear la base de datos
async function createDatabase() {
  try {
    logger.info('Iniciando creación de la base de datos...');
    
    // Extraer el nombre de la base de datos de la configuración
    const dbName = process.env.DB_NAME;
    const dbUser = process.env.DB_USER;
    const dbPassword = process.env.DB_PASS;
    const dbHost = process.env.DB_HOST;
    const dbDialect = 'mysql';
    
    // Crear una conexión sin especificar la base de datos
    const sequelize = new Sequelize(null, dbUser, dbPassword, {
      host: dbHost,
      dialect: dbDialect,
      logging: msg => logger.debug(msg)
    });
    
    // Conectar a MySQL
    await sequelize.authenticate();
    logger.info('Conexión a MySQL establecida correctamente.');
    
    // Crear la base de datos si no existe
    await sequelize.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    logger.info(`Base de datos '${dbName}' creada o verificada correctamente.`);
    
    // Cerrar la conexión
    await sequelize.close();
    logger.info('Conexión cerrada.');
    
    // Ahora conectar a la base de datos creada para sincronizar los modelos
    const dbSequelize = new Sequelize(dbName, dbUser, dbPassword, {
      host: dbHost,
      dialect: dbDialect,
      logging: msg => logger.debug(msg)
    });
    
    // Importar los modelos
    const models = require('../src/models');
    
    // Sincronizar los modelos con la base de datos
    await dbSequelize.sync({ force: false });
    logger.info('Modelos sincronizados con la base de datos.');
    
    // Cerrar la conexión
    await dbSequelize.close();
    logger.info('Inicialización de la base de datos completada exitosamente.');
    
    return true;
  } catch (error) {
    logger.error(`Error al inicializar la base de datos: ${error.message}`);
    logger.error(error.stack);
    return false;
  }
}

// Ejecutar la función
createDatabase()
  .then(success => {
    if (success) {
      logger.info('Proceso de inicialización de la base de datos completado.');
      process.exit(0);
    } else {
      logger.error('Proceso de inicialización de la base de datos falló.');
      process.exit(1);
    }
  })
  .catch(error => {
    logger.error(`Error inesperado: ${error.message}`);
    process.exit(1);
  });