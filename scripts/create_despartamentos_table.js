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

  await conn.query(`
    CREATE TABLE IF NOT EXISTS despartamentos (
      id_departamento INT AUTO_INCREMENT PRIMARY KEY,
      nombre_departamento VARCHAR(150) NOT NULL UNIQUE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await conn.query(`
    INSERT IGNORE INTO despartamentos (nombre_departamento)
    VALUES ('direccion de obras municipales')
  `);

  const [rows] = await conn.query('SELECT id_departamento, nombre_departamento FROM despartamentos');
  for (const r of rows) {
    console.log(`${r.id_departamento}\t${r.nombre_departamento}`);
  }

  await conn.end();
  console.log('Tabla despartamentos creada y dato insertado');
}

main().catch(err => {
  console.error('Error creando tabla despartamentos:', err.message);
  process.exit(1);
});

