require('dotenv').config();
const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    multipleStatements: true
  });

  // Asegurar columna rol_id en usuarios
  const [colCheck] = await conn.query(`
    SELECT 1 FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'id_rol'
  `);
  if (colCheck.length === 0) {
    await conn.execute(`ALTER TABLE usuarios ADD COLUMN id_rol INT NULL`);
  }

  // Nota: omitir creación de FK si el límite de claves está alcanzado

  // Mapear valores desde columna legacy 'role' a rol_id
  const [rows] = await conn.query(`SELECT id, nombre FROM rol`);
  const map = {};
  for (const r of rows) map[r.nombre] = r.id;

  const adminId = map['administrador'] || null;
  const ciudadanoId = map['ciudadano'] || null;
  const secretariaComunitariaId = map['secretaria comunitaria'] || null;

  const [legacyRoleCol] = await conn.query(`
    SELECT 1 FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'role'
  `);
  if (legacyRoleCol.length > 0) {
    if (adminId !== null) {
      await conn.execute(`UPDATE usuarios SET id_rol = ? WHERE role = 'admin'`, [adminId]);
    }
    if (ciudadanoId !== null) {
      await conn.execute(`UPDATE usuarios SET id_rol = ? WHERE role = 'ciudadano'`, [ciudadanoId]);
    }
    if (secretariaComunitariaId !== null) {
      await conn.execute(`UPDATE usuarios SET id_rol = ? WHERE role = 'funcionario'`, [secretariaComunitariaId]);
    }
  }

  // Eliminar columna legacy 'role' si existe
  const [roleColCheck] = await conn.query(`
    SELECT 1 FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'role'
  `);
  if (roleColCheck.length > 0) {
    await conn.execute(`ALTER TABLE usuarios DROP COLUMN role`);
  }

  // Eliminar columna rol_id si quedó residual
  const [rolIdCol] = await conn.query(`
    SELECT 1 FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'rol_id'
  `);
  if (rolIdCol.length > 0) {
    await conn.execute(`ALTER TABLE usuarios DROP COLUMN rol_id`);
  }

  await conn.end();
}

run().catch(err => {
  console.error('Error migrando roles de usuarios:', err);
  process.exit(1);
});
