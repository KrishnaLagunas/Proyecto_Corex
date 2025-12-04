require('dotenv').config();
const { Sequelize } = require('sequelize');
const logger = require('../src/utils/logger');

async function patchDepartamentosEstado() {
  const dbName = process.env.DB_NAME;
  const dbUser = process.env.DB_USER;
  const dbPassword = process.env.DB_PASS;
  const dbHost = process.env.DB_HOST;
  const dbPort = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : undefined;

  const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
    host: dbHost,
    port: dbPort,
    dialect: 'mysql',
    logging: msg => logger.debug(msg)
  });

  try {
    await sequelize.authenticate();
    logger.info('Conexión a la base de datos establecida para parche de estado en departamentos.');

    const [columns] = await sequelize.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = :schema AND TABLE_NAME = 'departamentos'`,
      { replacements: { schema: dbName } }
    );

    const existing = new Set(columns.map(c => c.COLUMN_NAME.toLowerCase()));

    if (existing.has('estado')) {
      logger.info('La columna estado ya existe en departamentos. Nada que aplicar.');
    } else {
      const alterSql = "ALTER TABLE departamentos ADD COLUMN estado ENUM('activo','inactivo') NOT NULL DEFAULT 'activo'";
      logger.info(`Aplicando ALTER TABLE: ${alterSql}`);
      await sequelize.query(alterSql);
      logger.info('Columna estado agregada correctamente a departamentos.');
    }

    await sequelize.close();
    logger.info('Conexión cerrada tras aplicar parche de estado a departamentos.');
  } catch (error) {
    logger.error(`Error aplicando parche de estado a departamentos: ${error.message}`);
    logger.error(error.stack);
    process.exit(1);
  }
}

patchDepartamentosEstado()
  .then(() => {
    logger.info('Proceso de parche de estado en departamentos finalizado.');
    process.exit(0);
  })
  .catch(err => {
    logger.error(`Fallo inesperado en el parche de estado en departamentos: ${err.message}`);
    process.exit(1);
  });
