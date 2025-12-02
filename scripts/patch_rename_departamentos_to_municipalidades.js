/**
 * Renombra tablas y columnas de 'departamento' a 'municipalidad' en la BD MySQL
 * - RENAME TABLE departamentos -> municipalidades
 * - RENAME TABLE departamento_usuario -> municipalidad_usuario
 * - RENAME COLUMN departamento_id -> municipalidad_id en:
 *   usuarios, tramites, proyectos, contratos, presupuestos, municipalidad_usuario
 * - Actualiza llaves foráneas dinámicamente
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

async function existsTable(conn, schema, table) {
  const [rows] = await conn.execute(
    'SELECT COUNT(*) AS c FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?',
    [schema, table]
  );
  return rows[0].c > 0;
}

async function existsColumn(conn, schema, table, column) {
  const [rows] = await conn.execute(
    'SELECT COUNT(*) AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?',
    [schema, table, column]
  );
  return rows[0].c > 0;
}

async function dropFksForColumn(conn, schema, table, column) {
  const [fks] = await conn.execute(
    `SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ? AND REFERENCED_TABLE_NAME IS NOT NULL`,
    [schema, table, column]
  );
  for (const fk of fks) {
    try {
      await conn.execute(`ALTER TABLE \`${table}\` DROP FOREIGN KEY \`${fk.CONSTRAINT_NAME}\``);
      console.log(`FK ${fk.CONSTRAINT_NAME} eliminada en ${table}.${column}`);
    } catch (e) {
      console.warn(`No se pudo eliminar FK ${fk.CONSTRAINT_NAME} en ${table}: ${e.message}`);
    }
  }
}

async function addMunicipalidadFk(conn, table, onDelete = 'SET NULL') {
  const fkName = `fk_${table}_municipalidad_id`;
  try {
    await conn.execute(
      `ALTER TABLE \`${table}\` ADD CONSTRAINT \`${fkName}\` FOREIGN KEY (municipalidad_id)
       REFERENCES municipalidades(id) ON UPDATE CASCADE ON DELETE ${onDelete}`
    );
    console.log(`FK ${fkName} creada en ${table}.municipalidad_id`);
  } catch (e) {
    console.warn(`No se pudo crear FK ${fkName} en ${table}: ${e.message}`);
  }
}

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    multipleStatements: true
  });

  const schema = process.env.DB_NAME;
  console.log('Conectado a la base de datos para renombrar departamentos -> municipalidades');

  // 1) Renombrar tablas
  if (await existsTable(conn, schema, 'departamentos')) {
    try {
      await conn.execute('RENAME TABLE departamentos TO municipalidades');
      console.log('Tabla departamentos renombrada a municipalidades');
    } catch (e) {
      console.warn('No fue posible renombrar departamentos:', e.message);
    }
  } else {
    console.log('Tabla departamentos no existe, se omite rename');
  }

  if (await existsTable(conn, schema, 'departamento_usuario')) {
    try {
      await conn.execute('RENAME TABLE departamento_usuario TO municipalidad_usuario');
      console.log('Tabla departamento_usuario renombrada a municipalidad_usuario');
    } catch (e) {
      console.warn('No fue posible renombrar departamento_usuario:', e.message);
    }
  } else {
    console.log('Tabla departamento_usuario no existe, se omite rename');
  }

  // 2) Renombrar columnas departamento_id -> municipalidad_id
  const tablesSetNull = ['usuarios', 'tramites', 'presupuestos'];
  const tablesRestrict = ['proyectos', 'contratos'];
  const allTables = [...tablesSetNull, ...tablesRestrict, 'municipalidad_usuario'];

  for (const table of allTables) {
    const oldTableName = table === 'municipalidad_usuario' ? 'municipalidad_usuario' : table;
    const hasDept = await existsColumn(conn, schema, oldTableName, 'departamento_id');
    const hasMuni = await existsColumn(conn, schema, oldTableName, 'municipalidad_id');

    if (hasDept && !hasMuni) {
      // Eliminar FKs antiguas
      await dropFksForColumn(conn, schema, oldTableName, 'departamento_id');

      // Renombrar columna
      try {
        await conn.execute(`ALTER TABLE \`${oldTableName}\` CHANGE COLUMN departamento_id municipalidad_id INT ${tablesRestrict.includes(table) ? 'NOT NULL' : 'NULL'}`);
        console.log(`Columna ${oldTableName}.departamento_id renombrada a municipalidad_id`);
      } catch (e) {
        console.warn(`No fue posible renombrar columna en ${oldTableName}: ${e.message}`);
      }

      // Crear nueva FK
      const onDelete = tablesRestrict.includes(table) ? 'RESTRICT' : 'SET NULL';
      await addMunicipalidadFk(conn, oldTableName, onDelete);
    } else {
      console.log(`Sin cambios de columna en ${oldTableName}: dept=${hasDept}, muni=${hasMuni}`);
    }
  }

  await conn.end();
  console.log('Proceso de renombrado completado');
}

run().catch(err => {
  console.error('Error ejecutando parche de renombrado:', err);
  process.exit(1);
});

