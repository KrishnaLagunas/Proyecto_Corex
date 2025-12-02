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
  const [rows] = await conn.query('SHOW COLUMNS FROM usuarios');
  for (const r of rows) {
    console.log(`${r.Field}\t${r.Type}\tNULL=${r.Null}\tKEY=${r.Key}`);
  }
  await conn.end();
}

main().catch(err => {
  console.error('Error mostrando columnas de usuarios:', err.message);
  process.exit(1);
});
