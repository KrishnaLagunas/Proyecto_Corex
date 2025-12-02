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

  // Agregar columna legacy 'role' si no existe
  const [colCheck] = await conn.query(`
    SELECT 1 FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'role'
  `);
  if (colCheck.length === 0) {
    await conn.execute(`ALTER TABLE usuarios ADD COLUMN role VARCHAR(100) NULL`);
  }

  // Rellenar 'role' desde rol_id
  await conn.execute(`
    UPDATE usuarios u
    LEFT JOIN rol r ON r.id = u.rol_id
    SET u.role = r.nombre
  `);

  // Crear trigger BEFORE INSERT para sincronizar 'role' desde 'rol_id'
  const [insTrig] = await conn.query(`
    SELECT 1 FROM information_schema.TRIGGERS 
    WHERE TRIGGER_SCHEMA = DATABASE() AND TRIGGER_NAME = 'usuarios_bi_sync_role'
  `);
  if (insTrig.length === 0) {
    await conn.query(`
      CREATE TRIGGER usuarios_bi_sync_role
      BEFORE INSERT ON usuarios
      FOR EACH ROW
      SET NEW.role = (SELECT nombre FROM rol WHERE id = NEW.rol_id)
    `);
  }

  // Crear trigger BEFORE UPDATE para sincronizar 'role' cuando cambie 'rol_id'
  const [upTrig] = await conn.query(`
    SELECT 1 FROM information_schema.TRIGGERS 
    WHERE TRIGGER_SCHEMA = DATABASE() AND TRIGGER_NAME = 'usuarios_bu_sync_role'
  `);
  if (upTrig.length === 0) {
    await conn.query(`
      CREATE TRIGGER usuarios_bu_sync_role
      BEFORE UPDATE ON usuarios
      FOR EACH ROW
      SET NEW.role = (SELECT nombre FROM rol WHERE id = NEW.rol_id)
    `);
  }

  // Trigger para actualizar 'role' si cambia el nombre del rol
  const [rolTrig] = await conn.query(`
    SELECT 1 FROM information_schema.TRIGGERS 
    WHERE TRIGGER_SCHEMA = DATABASE() AND TRIGGER_NAME = 'rol_au_propagate_nombre'
  `);
  if (rolTrig.length === 0) {
    await conn.query(`
      CREATE TRIGGER rol_au_propagate_nombre
      AFTER UPDATE ON rol
      FOR EACH ROW
      UPDATE usuarios SET role = NEW.nombre WHERE rol_id = NEW.id
    `);
  }

  await conn.end();
}

run().catch(err => {
  console.error('Error agregando compatibilidad de columna role:', err);
  process.exit(1);
});
