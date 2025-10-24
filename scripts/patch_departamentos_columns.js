/**
 * Parche para agregar columnas faltantes a la tabla 'departamentos'
 * Agrega: rut, region, comuna si no existen aún. (ubicacion eliminada del sistema)
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');
const logger = require('../src/utils/logger');

async function patchDepartamentosColumns() {
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
    logger.info('Conexión a la base de datos establecida para aplicar parche.');

    // Obtener columnas actuales de la tabla
    const [columns] = await sequelize.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = :schema AND TABLE_NAME = 'departamentos'`,
      { replacements: { schema: dbName } }
    );

    const existing = new Set(columns.map(c => c.COLUMN_NAME.toLowerCase()));

    // Plan de alteraciones
    const alters = [];
    if (!existing.has('rut')) {
      alters.push("ADD COLUMN rut VARCHAR(12) UNIQUE");
    }
    // No agregar 'ubicacion': columna descontinuada
    if (!existing.has('region')) {
      alters.push("ADD COLUMN region VARCHAR(100)");
    }
    if (!existing.has('comuna')) {
      alters.push("ADD COLUMN comuna VARCHAR(100)");
    }

    if (alters.length === 0) {
      logger.info('No hay columnas faltantes en departamentos. Nada que aplicar.');
    } else {
      const alterSql = `ALTER TABLE departamentos ${alters.join(', ')};`;
      logger.info(`Aplicando ALTER TABLE: ${alterSql}`);
      await sequelize.query(alterSql);
      logger.info('Parche aplicado correctamente: columnas agregadas.');
    }

    await sequelize.close();
    logger.info('Conexión cerrada tras aplicar parche.');
  } catch (error) {
    logger.error(`Error aplicando parche de departamentos: ${error.message}`);
    logger.error(error.stack);
    process.exit(1);
  }
}

patchDepartamentosColumns()
  .then(() => {
    logger.info('Proceso de parche finalizado.');
    process.exit(0);
  })
  .catch(err => {
    logger.error(`Fallo inesperado en el parche: ${err.message}`);
    process.exit(1);
  });