require('dotenv').config();
const { Sequelize } = require('sequelize');
const logger = require('../src/utils/logger');

async function ensureTables() {
  const db = process.env.DB_NAME || 'erp_municipal';
  const sequelize = new Sequelize(db, process.env.DB_USER || 'root', process.env.DB_PASS || '', {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false,
  });

  try {
    await sequelize.authenticate();
    logger.info(']: Conexión DB OK para parche regiones/comunas');

    // Crear tabla regiones si no existe
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS regiones (
        id INT AUTO_INCREMENT PRIMARY KEY,
        codigo VARCHAR(10) NOT NULL UNIQUE,
        nombre VARCHAR(255) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Crear tabla comunas si no existe
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS comunas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        codigo VARCHAR(10) NOT NULL UNIQUE,
        nombre VARCHAR(255) NOT NULL,
        region_id INT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_comunas_region FOREIGN KEY (region_id) REFERENCES regiones(id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    logger.info(']: Tablas regiones y comunas verificadas/creadas');
  } catch (err) {
    logger.error(']: Error creando/verificando tablas regiones/comunas:', err.message || err);
    throw err;
  } finally {
    await sequelize.close();
  }
}

ensureTables().catch(() => process.exit(1));