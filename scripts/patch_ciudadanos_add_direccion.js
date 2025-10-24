/**
 * Parche para agregar columnas 'direccion', 'region_id' y 'comuna_id' a la tabla 'ciudadanos' si no existen
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');
const logger = require('../src/utils/logger');

async function patchCiudadanosDireccion() {
  const dbName = process.env.DB_NAME;
  const dbUser = process.env.DB_USER;
  const dbPassword = process.env.DB_PASS;
  const dbHost = process.env.DB_HOST;

  const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
    host: dbHost,
    dialect: 'mysql',
    logging: msg => logger.debug(msg)
  });

  try {
    await sequelize.authenticate();
    logger.info('Conexión a la base de datos establecida para aplicar parche (ciudadanos).');

    const [columns] = await sequelize.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = :schema AND TABLE_NAME = 'ciudadanos'`,
      { replacements: { schema: dbName } }
    );

    const existing = new Set(columns.map(c => c.COLUMN_NAME.toLowerCase()));

    if (!existing.has('direccion')) {
      const alterSql = `ALTER TABLE ciudadanos ADD COLUMN direccion VARCHAR(255) NULL;`;
      logger.info(`Aplicando ALTER TABLE: ${alterSql}`);
      await sequelize.query(alterSql);
      logger.info("Columna 'direccion' agregada correctamente a 'ciudadanos'.");
    } else {
      logger.info("La columna 'direccion' ya existe en 'ciudadanos'.");
    }

    if (!existing.has('region_id')) {
      const alterSql2 = `ALTER TABLE ciudadanos ADD COLUMN region_id INT NULL;`;
      logger.info(`Aplicando ALTER TABLE: ${alterSql2}`);
      await sequelize.query(alterSql2);
      logger.info("Columna 'region_id' agregada correctamente a 'ciudadanos'.");
    } else {
      logger.info("La columna 'region_id' ya existe en 'ciudadanos'.");
    }

    if (!existing.has('comuna_id')) {
      const alterSql3 = `ALTER TABLE ciudadanos ADD COLUMN comuna_id INT NULL;`;
      logger.info(`Aplicando ALTER TABLE: ${alterSql3}`);
      await sequelize.query(alterSql3);
      logger.info("Columna 'comuna_id' agregada correctamente a 'ciudadanos'.");
    } else {
      logger.info("La columna 'comuna_id' ya existe en 'ciudadanos'.");
    }

    // Añadir índices si no existen (silencioso si ya existen)
    try {
      await sequelize.query(`ALTER TABLE ciudadanos ADD INDEX idx_ciudadanos_region_id (region_id);`);
    } catch (err) { logger.debug('Index region_id puede ya existir o falló: ' + (err.message || err)); }

    try {
      await sequelize.query(`ALTER TABLE ciudadanos ADD INDEX idx_ciudadanos_comuna_id (comuna_id);`);
    } catch (err) { logger.debug('Index comuna_id puede ya existir o falló: ' + (err.message || err)); }

    await sequelize.close();
    logger.info('Conexión cerrada tras aplicar parche a ciudadanos.');
  } catch (error) {
    logger.error(`Error aplicando parche a ciudadanos: ${error.message}`);
    logger.error(error.stack);
    process.exit(1);
  }
}

patchCiudadanosDireccion()
  .then(() => {
    logger.info('Proceso de parche (ciudadanos) finalizado.');
    process.exit(0);
  })
  .catch(err => {
    logger.error(`Fallo inesperado en el parche (ciudadanos): ${err.message}`);
    process.exit(1);
  });