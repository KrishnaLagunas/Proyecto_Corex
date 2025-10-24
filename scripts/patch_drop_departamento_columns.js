/**
 * Script para eliminar columnas no usadas de la tabla departamentos
 * - Elimina: descripcion, codigo, responsable_id, ubicacion
 * - Elimina FK y el índice idx_codigo si existen
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    multipleStatements: true
  });

  console.log('Conectado a la base de datos');

  // Buscar y eliminar la FK de responsable_id si existe
  const [fks] = await connection.execute(
    `SELECT CONSTRAINT_NAME
     FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = ?
       AND TABLE_NAME = 'departamentos'
       AND COLUMN_NAME = 'responsable_id'
       AND REFERENCED_TABLE_NAME IS NOT NULL`,
    [process.env.DB_NAME]
  );

  for (const fk of fks) {
    try {
      console.log(`Eliminando FOREIGN KEY ${fk.CONSTRAINT_NAME}...`);
      await connection.execute(`ALTER TABLE departamentos DROP FOREIGN KEY \`${fk.CONSTRAINT_NAME}\``);
    } catch (e) {
      console.warn('No se pudo eliminar FK, puede que no exista:', e.message);
    }
  }

  // Eliminar índice idx_codigo si existe
  try {
    await connection.execute(`ALTER TABLE departamentos DROP INDEX idx_codigo`);
    console.log('Índice idx_codigo eliminado');
  } catch (e) {
    console.log('Índice idx_codigo no existe, continuando');
  }

  // Eliminar columnas si existen
  const columnsToDrop = ['descripcion', 'codigo', 'responsable_id', 'ubicacion'];
  for (const col of columnsToDrop) {
    try {
      await connection.execute(`ALTER TABLE departamentos DROP COLUMN \`${col}\``);
      console.log(`Columna ${col} eliminada`);
    } catch (e) {
      console.log(`Columna ${col} no existe o ya fue eliminada: ${e.message}`);
    }
  }

  // Crear índice sobre rut si no existe
  try {
    await connection.execute(`CREATE INDEX idx_rut_departamento ON departamentos (rut)`);
    console.log('Índice idx_rut_departamento creado');
  } catch (e) {
    console.log('Índice idx_rut_departamento ya existe, continuando');
  }

  await connection.end();
  console.log('Parche aplicado y conexión cerrada');
}

run().catch(err => {
  console.error('Error ejecutando parche:', err);
  process.exit(1);
});