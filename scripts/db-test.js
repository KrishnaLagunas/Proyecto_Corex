const { sequelize } = require('../src/config/database');

async function run() {
  try {
    const [existsRows] = await sequelize.query(
      "SELECT COUNT(*) AS c FROM municipalidades WHERE nombre = 'Municipalidad de Prueba'"
    );
    const count = Array.isArray(existsRows) ? (existsRows[0]?.c || existsRows[0]?.C || 0) : 0;
    if (!count) {
      const insertSql = "INSERT INTO municipalidades (nombre, rut, email_contacto, telefono_contacto, direccion, region, comuna, estado, created_at, updated_at) VALUES ('Municipalidad de Prueba', '2181314740', 'prueba@example.com', '+56986193142', 'La Serena', 'Coquimbo', 'La Serena', 'activo', NOW(), NOW())";
      await sequelize.query(insertSql);
      console.log('Insert OK');
    } else {
      console.log('Registro de prueba ya existe');
    }

    const [rows] = await sequelize.query(
      "SELECT id, nombre, rut, email_contacto AS email, telefono_contacto AS telefono, direccion, region, comuna, estado FROM municipalidades ORDER BY id DESC LIMIT 10"
    );
    console.log(JSON.stringify(rows, null, 2));
  } catch (e) {
    console.error('DB script error:', e.message || e);
  } finally {
    process.exit(0);
  }
}

run();

