require('dotenv').config();
const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    multipleStatements: true
  });

  // Verificar si existe la tabla
  const [tables] = await conn.query(
    `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'departamento_usuario'`,
    [process.env.DB_NAME]
  );
  if (tables.length > 0) {
    console.log("Tabla 'departamento_usuario' ya existe. Nada que crear.");
    await conn.end();
    return;
  }

  // Crear la tabla con claves foráneas y restricción única
  await conn.query(`
    CREATE TABLE departamento_usuario (
      id INT AUTO_INCREMENT PRIMARY KEY,
      departamento_id INT NOT NULL,
      usuario_id INT NOT NULL,
      fecha_asignacion DATETIME DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_depusu_departamento FOREIGN KEY (departamento_id)
        REFERENCES departamentos (id_departamento) ON UPDATE CASCADE ON DELETE CASCADE,
      CONSTRAINT fk_depusu_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuarios (id) ON UPDATE CASCADE ON DELETE CASCADE,
      UNIQUE KEY uniq_depusu (departamento_id, usuario_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  console.log("Tabla 'departamento_usuario' creada");
  await conn.end();
}

main().catch(err => {
  console.error('Error creando tabla departamento_usuario:', err.message);
  process.exit(1);
});

