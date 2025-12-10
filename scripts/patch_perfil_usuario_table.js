/**
 * Parche para crear la tabla 'perfil_usuario' si no existe
 * y agregar la columna 'foto_url' si falta
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');
const logger = require('../src/utils/logger');

async function patchPerfilUsuario() {
  const dbName = process.env.DB_NAME;
  const dbUser = process.env.DB_USER;
  const dbPassword = process.env.DB_PASS;
  const dbHost = process.env.DB_HOST;
  const dbPort = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306;

  const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
    host: dbHost,
    port: dbPort,
    dialect: 'mysql',
    logging: msg => logger.debug(msg)
  });

  try {
    await sequelize.authenticate();
    logger.info('Conexión a la base de datos establecida para aplicar parche (perfil_usuario).');

    const [tables] = await sequelize.query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = :schema AND TABLE_NAME = 'perfil_usuario'`,
      { replacements: { schema: dbName } }
    );

    const tableExists = Array.isArray(tables) && tables.length > 0;

    if (!tableExists) {
      const createSql = `
        CREATE TABLE perfil_usuario (
          id INT AUTO_INCREMENT PRIMARY KEY,
          usuario_id INT NOT NULL,
          foto_url VARCHAR(255) NULL,
          createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          CONSTRAINT fk_perfil_usuario_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
      `;
      logger.info('Creando tabla perfil_usuario');
      await sequelize.query(createSql);
      logger.info('Tabla perfil_usuario creada.');
    } else {
      const [columns] = await sequelize.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = :schema AND TABLE_NAME = 'perfil_usuario'`,
        { replacements: { schema: dbName } }
      );
      const existing = new Set(columns.map(c => c.COLUMN_NAME.toLowerCase()));
      if (!existing.has('foto_url')) {
        const alterSql = `ALTER TABLE perfil_usuario ADD COLUMN foto_url VARCHAR(255) NULL;`;
        logger.info(`Agregando columna foto_url a perfil_usuario`);
        await sequelize.query(alterSql);
        logger.info('Columna foto_url agregada.');
      } else {
        logger.info('La columna foto_url ya existe en perfil_usuario.');
      }
    }

    await sequelize.close();
    logger.info('Parche perfil_usuario aplicado y conexión cerrada.');
  } catch (error) {
    logger.error(`Error aplicando parche a perfil_usuario: ${error.message}`);
    logger.error(error.stack);
    process.exit(1);
  }
}

patchPerfilUsuario()
  .then(() => { logger.info('Proceso de parche (perfil_usuario) finalizado.'); process.exit(0); })
  .catch(err => { logger.error(`Fallo inesperado en el parche (perfil_usuario): ${err.message}`); process.exit(1); });

