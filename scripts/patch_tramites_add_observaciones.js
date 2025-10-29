/**
 * Parche para agregar la columna 'observaciones' a la tabla 'tramites' si no existe
 * Evita errores y asegura la persistencia de observaciones visibles para el ciudadano.
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');
const logger = require('../src/utils/logger');

async function patchTramitesObservaciones() {
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
    logger.info('Conexión a la base de datos establecida para aplicar parche (tramites).');

    const [columns] = await sequelize.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = :schema AND TABLE_NAME = 'tramites'`,
      { replacements: { schema: dbName } }
    );

    const existing = new Set(columns.map(c => c.COLUMN_NAME.toLowerCase()));

    const alters = [];
    if (!existing.has('observaciones')) {
      alters.push('ADD COLUMN observaciones TEXT NULL');
    }

    if (alters.length === 0) {
      logger.info('La tabla tramites ya tiene la columna observaciones. Nada que aplicar.');
    } else {
      const alterSql = `ALTER TABLE tramites ${alters.join(', ')};`;
      logger.info(`Aplicando ALTER TABLE: ${alterSql}`);
      await sequelize.query(alterSql);
      logger.info('Parche aplicado correctamente: columna observaciones agregada en tramites.');
    }

    await sequelize.close();
    logger.info('Conexión cerrada tras aplicar parche a tramites.');
  } catch (error) {
    logger.error(`Error aplicando parche a tramites: ${error.message}`);
    logger.error(error.stack);
    process.exit(1);
  }
}

patchTramitesObservaciones()
  .then(() => {
    logger.info('Proceso de parche (tramites) finalizado.');
    process.exit(0);
  })
  .catch(err => {
    logger.error(`Fallo inesperado en el parche (tramites): ${err.message}`);
    process.exit(1);
  });