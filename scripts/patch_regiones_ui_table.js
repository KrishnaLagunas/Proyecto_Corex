require('dotenv').config();
const { Sequelize } = require('sequelize');
const logger = require('../src/utils/logger');

async function patchRegionesUi() {
  const db = process.env.DB_NAME || 'erp_municipal';
  const sequelize = new Sequelize(db, process.env.DB_USER || 'root', process.env.DB_PASS || '', {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false,
  });

  try {
    await sequelize.authenticate();
    logger.info(']: Conexión DB OK para parche regiones_ui');

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS regiones_ui (
        idregion INT NOT NULL,
        region VARCHAR(100) NOT NULL,
        comuna VARCHAR(100) NOT NULL,
        PRIMARY KEY (idregion, comuna),
        INDEX idx_region_nombre (region),
        INDEX idx_comuna_nombre (comuna)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Vaciar y rellenar desde las tablas normalizadas
    await sequelize.query('DELETE FROM regiones_ui');
    await sequelize.query(`
      INSERT INTO regiones_ui (idregion, region, comuna)
      SELECT r.id AS idregion, r.nombre AS region, c.nombre AS comuna
      FROM regiones r
      INNER JOIN comunas c ON c.region_id = r.id;
    `);

    logger.info(']: Tabla regiones_ui poblada desde regiones/comunas');
  } catch (err) {
    logger.error(']: Error parcheando regiones_ui:', err.message || err);
    throw err;
  } finally {
    await sequelize.close();
  }
}

patchRegionesUi().catch(() => process.exit(1));