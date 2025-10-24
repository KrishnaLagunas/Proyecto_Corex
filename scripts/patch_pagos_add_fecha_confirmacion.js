/**
 * Parche para agregar la columna fecha_confirmacion a la tabla 'pagos'
 * Evita errores "Unknown column 'Pago.fecha_confirmacion' in 'field list'" al consultar el modelo.
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');
const logger = require('../src/utils/logger');

async function patchPagosFechaConfirmacion() {
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
    logger.info('Conexión a la base de datos establecida para aplicar parche de pagos.');

    // Obtener columnas actuales de la tabla pagos
    const [columns] = await sequelize.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = :schema AND TABLE_NAME = 'pagos'`,
      { replacements: { schema: dbName } }
    );

    const existing = new Set(columns.map(c => c.COLUMN_NAME.toLowerCase()));

    const alters = [];
    if (!existing.has('fecha_confirmacion')) {
      alters.push('ADD COLUMN fecha_confirmacion DATETIME NULL');
    }

    if (alters.length === 0) {
      logger.info('La tabla pagos ya tiene la columna fecha_confirmacion. Nada que aplicar.');
    } else {
      const alterSql = `ALTER TABLE pagos ${alters.join(', ')};`;
      logger.info(`Aplicando ALTER TABLE: ${alterSql}`);
      await sequelize.query(alterSql);
      logger.info('Parche aplicado correctamente: columna fecha_confirmacion agregada en pagos.');
    }

    await sequelize.close();
    logger.info('Conexión cerrada tras aplicar parche.');
  } catch (error) {
    logger.error(`Error aplicando parche de pagos: ${error.message}`);
    logger.error(error.stack);
    process.exit(1);
  }
}

patchPagosFechaConfirmacion()
  .then(() => {
    logger.info('Proceso de parche de pagos finalizado.');
    process.exit(0);
  })
  .catch(err => {
    logger.error(`Fallo inesperado en el parche de pagos: ${err.message}`);
    process.exit(1);
  });