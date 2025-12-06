/**
 * Parche para agregar la columna 'departamento_id' a la tabla 'tramites' si no existe
 * Además crea el índice y la clave foránea hacia 'departamentos(id_departamento)'.
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');
const logger = require('../src/utils/logger');

async function patchTramitesDepartamentoId() {
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
    logger.info('Conexión a la base de datos establecida para aplicar parche (tramites.departamento_id).');

    // Verificar columnas existentes de la tabla 'tramites'
    const [columns] = await sequelize.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = :schema AND TABLE_NAME = 'tramites'`,
      { replacements: { schema: dbName } }
    );
    const existingCols = new Set(columns.map(c => c.COLUMN_NAME.toLowerCase()));

    // Agregar columna si no existe
    if (!existingCols.has('departamento_id')) {
      const alterAddCol = `ALTER TABLE tramites ADD COLUMN departamento_id INT NULL;`;
      logger.info(`Aplicando ALTER TABLE (add column): ${alterAddCol}`);
      await sequelize.query(alterAddCol);
      logger.info('Columna departamento_id agregada en tramites.');
    } else {
      logger.info('La columna departamento_id ya existe en tramites.');
    }

    // Crear índice sobre departamento_id si no existe
    try {
      await sequelize.query(`CREATE INDEX idx_tramites_departamento_id ON tramites (departamento_id)`);
      logger.info('Índice idx_tramites_departamento_id creado.');
    } catch (e) {
      logger.info('Índice idx_tramites_departamento_id ya existe, continuando.');
    }

    // Verificar si la FK ya existe
    const [fkRows] = await sequelize.query(
      `SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
       WHERE TABLE_SCHEMA = :schema AND TABLE_NAME = 'tramites'
         AND COLUMN_NAME = 'departamento_id' AND REFERENCED_TABLE_NAME IS NOT NULL`,
      { replacements: { schema: dbName } }
    );
    const fkExists = fkRows && fkRows.length > 0;

    if (!fkExists) {
      // Asegurar que la tabla 'departamentos' existe antes de crear FK
      const [depTable] = await sequelize.query(
        `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = :schema AND TABLE_NAME = 'departamentos'`,
        { replacements: { schema: dbName } }
      );
      if (!depTable || depTable.length === 0) {
        throw new Error("La tabla 'departamentos' no existe; crea la tabla antes de agregar la FK");
      }

      const addFkSql = `ALTER TABLE tramites
        ADD CONSTRAINT fk_tramites_departamento
        FOREIGN KEY (departamento_id) REFERENCES departamentos (id_departamento)
        ON UPDATE CASCADE ON DELETE SET NULL;`;
      logger.info(`Aplicando FOREIGN KEY: ${addFkSql}`);
      await sequelize.query(addFkSql);
      logger.info('Clave foránea fk_tramites_departamento creada.');
    } else {
      logger.info('La clave foránea sobre departamento_id ya existe en tramites.');
    }

    await sequelize.close();
    logger.info('Conexión cerrada tras aplicar parche de departamento_id en tramites.');
  } catch (error) {
    logger.error(`Error aplicando parche a tramites.departamento_id: ${error.message}`);
    logger.error(error.stack);
    process.exit(1);
  }
}

patchTramitesDepartamentoId()
  .then(() => {
    logger.info('Proceso de parche (departamento_id en tramites) finalizado.');
    process.exit(0);
  })
  .catch(err => {
    logger.error(`Fallo inesperado en el parche (departamento_id en tramites): ${err.message}`);
    process.exit(1);
  });

