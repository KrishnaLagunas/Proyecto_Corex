/**
 * Parche para agregar columnas de nombres/apellidos separados a la tabla 'usuarios'
 * Agrega: primer_nombre, segundo_nombre, primer_apellido, segundo_apellido si no existen aún
 * y rellena sus valores derivándolos de las columnas combinadas nombre y apellido.
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');
const logger = require('../src/utils/logger');

async function patchUsuariosNombresSeparados() {
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
    logger.info('Conexión a la base de datos establecida para aplicar parche de usuarios.');

    // Obtener columnas actuales de la tabla 'usuarios'
    const [columns] = await sequelize.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = :schema AND TABLE_NAME = 'usuarios'`,
      { replacements: { schema: dbName } }
    );

    const existing = new Set(columns.map(c => c.COLUMN_NAME.toLowerCase()));

    // Plan de alteraciones
    const alters = [];
    if (!existing.has('primer_nombre')) {
      alters.push('ADD COLUMN primer_nombre VARCHAR(100) NULL');
    }
    if (!existing.has('segundo_nombre')) {
      alters.push('ADD COLUMN segundo_nombre VARCHAR(100) NULL');
    }
    if (!existing.has('primer_apellido')) {
      alters.push('ADD COLUMN primer_apellido VARCHAR(100) NULL');
    }
    if (!existing.has('segundo_apellido')) {
      alters.push('ADD COLUMN segundo_apellido VARCHAR(100) NULL');
    }

    if (alters.length === 0) {
      logger.info('La tabla usuarios ya tiene las columnas de nombres/apellidos separados.');
    } else {
      const alterSql = `ALTER TABLE usuarios ${alters.join(', ')};`;
      logger.info(`Aplicando ALTER TABLE: ${alterSql}`);
      await sequelize.query(alterSql);
      logger.info('Parche aplicado: columnas agregadas.');
    }

    // Poblar columnas nuevas desde nombre/apellido combinados si están vacías
    const populateSql = `
      UPDATE usuarios
      SET 
        primer_nombre = COALESCE(primer_nombre, NULLIF(TRIM(SUBSTRING_INDEX(nombre, ' ', 1)), '')),
        segundo_nombre = COALESCE(segundo_nombre, NULLIF(TRIM(SUBSTRING(nombre, LENGTH(SUBSTRING_INDEX(nombre, ' ', 1)) + 2)), '')),
        primer_apellido = COALESCE(primer_apellido, NULLIF(TRIM(SUBSTRING_INDEX(apellido, ' ', 1)), '')),
        segundo_apellido = COALESCE(segundo_apellido, NULLIF(TRIM(SUBSTRING(apellido, LENGTH(SUBSTRING_INDEX(apellido, ' ', 1)) + 2)), ''))
    `;
    logger.info('Rellenando columnas nuevas con valores derivados de nombre/apellido...');
    await sequelize.query(populateSql);
    logger.info('Relleno de columnas completado.');

    await sequelize.close();
    logger.info('Conexión cerrada tras aplicar parche.');
  } catch (error) {
    logger.error(`Error aplicando parche de usuarios nombres separados: ${error.message}`);
    logger.error(error.stack);
    process.exit(1);
  }
}

patchUsuariosNombresSeparados()
  .then(() => {
    logger.info('Proceso de parche de usuarios finalizado.');
    process.exit(0);
  })
  .catch(err => {
    logger.error(`Fallo inesperado en el parche de usuarios: ${err.message}`);
    process.exit(1);
  });