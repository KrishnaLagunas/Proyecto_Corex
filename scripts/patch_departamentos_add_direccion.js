/**
 * Parche para agregar la columna 'direccion' a la tabla 'departamentos' si no existe
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');
const logger = require('../src/utils/logger');

async function patchDepartamentosDireccion() {
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
    logger.info('Conexión a la base de datos establecida para aplicar parche (direccion).');

    const [columns] = await sequelize.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = :schema AND TABLE_NAME = 'departamentos'`,
      { replacements: { schema: dbName } }
    );

    const existing = new Set(columns.map(c => c.COLUMN_NAME.toLowerCase()));

    if (existing.has('direccion')) {
      logger.info("La columna 'direccion' ya existe en 'departamentos'. No hay nada que hacer.");
    } else {
      const alterSql = `ALTER TABLE departamentos ADD COLUMN direccion VARCHAR(255) NULL;`;
      logger.info(`Aplicando ALTER TABLE: ${alterSql}`);
      await sequelize.query(alterSql);
      logger.info("Columna 'direccion' agregada correctamente a 'departamentos'.");
    }

    await sequelize.close();
    logger.info('Conexión cerrada tras aplicar parche de direccion.');
  } catch (error) {
    logger.error(`Error aplicando parche de direccion: ${error.message}`);
    logger.error(error.stack);
    process.exit(1);
  }
}

patchDepartamentosDireccion()
  .then(() => {
    logger.info('Proceso de parche (direccion) finalizado.');
    process.exit(0);
  })
  .catch(err => {
    logger.error(`Fallo inesperado en el parche (direccion): ${err.message}`);
    process.exit(1);
  });