require('dotenv').config();
const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
  });

  const [triggers] = await conn.query(`
    SELECT TRIGGER_NAME, ACTION_TIMING, EVENT_MANIPULATION, ACTION_STATEMENT
    FROM information_schema.TRIGGERS
    WHERE TRIGGER_SCHEMA = DATABASE() AND EVENT_OBJECT_TABLE = 'usuarios'
  `);

  const toDrop = triggers.filter(t => /\brol_id\b|\brole\b/i.test(t.ACTION_STATEMENT || ''));

  for (const tr of toDrop) {
    const name = tr.TRIGGER_NAME;
    try {
      await conn.query(`DROP TRIGGER IF EXISTS \`${name}\``);
      console.log('Trigger eliminado:', name);
    } catch (e) {
      console.error('Error eliminando trigger', name, e.message);
    }
  }

  await conn.end();
  console.log('Proceso de eliminación de triggers legacy completado');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});

