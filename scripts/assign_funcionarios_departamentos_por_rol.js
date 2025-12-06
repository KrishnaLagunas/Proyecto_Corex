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

  const [departamentos] = await conn.query(
    `SELECT id_departamento AS id, nombre_departamento AS nombre FROM departamentos`
  );
  const deps = departamentos.map(d => ({ id: d.id, nombre: d.nombre, norm: (d.nombre || '').toLowerCase() }));
  const findDep = (kwList) => deps.find(d => kwList.some(k => d.norm.includes(k))) || null;

  const mapRolToDep = {
    'secretaria de obras': findDep(['obra', 'dom']) || deps[0],
    'secretaria de transito': findDep(['tránsito', 'transito']) || deps[0],
    'tesoreria municipal': findDep(['finanzas']) || deps[0],
    'secretaria comunitaria': findDep(['desarrollo comunitario', 'dideco']) || deps[0],
    'secretaria partes': findDep(['administración', 'administracion']) || deps[0]
  };

  const rolesObjetivo = Object.keys(mapRolToDep);

  const [funcionarios] = await conn.query(
    `SELECT u.id AS usuario_id, LOWER(r.nombre) AS rol_nombre
     FROM usuarios u
     JOIN rol r ON r.id = u.id_rol
     WHERE LOWER(r.nombre) IN (${rolesObjetivo.map(() => '?').join(',')})`,
    rolesObjetivo
  );

  for (const f of funcionarios) {
    const dep = mapRolToDep[f.rol_nombre];
    if (!dep || !dep.id) continue;
    await conn.query(
      `INSERT IGNORE INTO departamento_usuario (departamento_id, usuario_id)
       VALUES (?, ?)`,
      [dep.id, f.usuario_id]
    );
  }

  await conn.end();
}

main().catch(err => {
  console.error('Error asignando funcionarios a departamentos:', err.message);
  process.exit(1);
});

