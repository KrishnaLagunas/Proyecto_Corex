/**
 * Script para vaciar TODAS las tablas de la base de datos.
 * - Deshabilita restricciones de clave foránea.
 * - TRUNCATE cada tabla base del esquema configurado.
 * - Restablece restricciones.
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');
const logger = require('../src/utils/logger');

async function clearDatabase() {
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
    logger.info('Conexión a la base de datos establecida. Iniciando vaciado de tablas...');

    // Deshabilitar FKs
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');

    // Obtener todas las tablas base del esquema
    const [tables] = await sequelize.query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = :schema AND TABLE_TYPE = 'BASE TABLE'`,
      { replacements: { schema: dbName } }
    );

    const tableNames = tables.map(t => t.TABLE_NAME);

    // Opcional: excluir tablas específicas si se desea conservar
    const exclude = new Set([ /* 'SequelizeMeta' */ ]);
    const toTruncate = tableNames.filter(name => !exclude.has(name));

    // TRUNCATE en cada tabla
    for (const name of toTruncate) {
      const sql = `TRUNCATE TABLE \`${name}\``;
      logger.info(`Vaciando tabla: ${name}`);
      await sequelize.query(sql);
    }

    // Rehabilitar FKs
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');
    logger.info('Todas las tablas han sido vaciadas correctamente.');

    await sequelize.close();
    logger.info('Conexión cerrada.');
    return true;
  } catch (error) {
    logger.error(`Error al vaciar tablas: ${error.message}`);
    logger.error(error.stack);
    process.exit(1);
  }
}

clearDatabase()
  .then(() => {
    logger.info('Proceso de vaciado de base de datos finalizado.');
    process.exit(0);
  })
  .catch(err => {
    logger.error(`Fallo inesperado: ${err.message}`);
    process.exit(1);
  });