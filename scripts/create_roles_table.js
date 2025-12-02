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

  await conn.execute(
    `CREATE TABLE IF NOT EXISTS rol (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL UNIQUE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci`
  );

  const roles = [
    'superadministrador',
    'administrador',
    'ciudadano',
    'secretaria de obras',
    'secretaria de transito',
    'tesoreria municipal',
    'secretaria partes',
    'secretaria comunitaria'
  ];

  for (const r of roles) {
    await conn.execute('INSERT IGNORE INTO rol (nombre) VALUES (?)', [r]);
  }

  await conn.end();
}

run().catch(err => {
  console.error('Error creando tabla rol:', err);
  process.exit(1);
});

