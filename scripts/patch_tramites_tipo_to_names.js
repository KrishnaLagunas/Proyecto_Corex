require('dotenv').config();
const mysql = require('mysql2/promise');

const NOMBRES_VALIDOS = [
  'Solicitudes de becas municipales',
  'Solicitud de traslado de establecimiento',
  'Reclamos y revisiones de casos de convivencia escolar',
  'Solicitud de cambio de consultorio',
  'Solicitud de Inscripción de consultorio',
  'Solicitud de ayuda técnica',
  'Reclamos por centro de salud',
  'certificado de construcción de obras',
  'Regularización de viviendas',
  'Denuncias por obras ilegales',
  'Solicitud de rondas preventivas',
  'Instalación de cámaras o alarmas comunitarias',
  'Charlas de seguridad',
  'Rectificación de datos o errores en licencias.',
  'Permiso de circulación.'
];

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    multipleStatements: true
  });

  // Cambiar tipo de columna a VARCHAR(200)
  await conn.query(`ALTER TABLE tramites MODIFY COLUMN tipo VARCHAR(200) NOT NULL`);

  // Normalizar por coincidencia exacta de título → tipo
  const placeholders = NOMBRES_VALIDOS.map(() => '?').join(',');
  await conn.query(
    `UPDATE tramites SET tipo = titulo WHERE titulo IN (${placeholders})`,
    NOMBRES_VALIDOS
  );

  // Mapeos por departamento cuando sea inequívoco
  // Obras Municipales
  await conn.query(
    `UPDATE tramites t
     JOIN departamentos d ON d.id_departamento = t.departamento_id
     SET t.tipo = 'certificado de construcción de obras'
     WHERE t.tipo IN ('certificado') AND (LOWER(d.nombre_departamento) LIKE '%obra%')`
  );
  await conn.query(
    `UPDATE tramites t
     JOIN departamentos d ON d.id_departamento = t.departamento_id
     SET t.tipo = 'Regularización de viviendas'
     WHERE t.tipo IN ('permiso') AND (LOWER(d.nombre_departamento) LIKE '%obra%')`
  );
  await conn.query(
    `UPDATE tramites t
     JOIN departamentos d ON d.id_departamento = t.departamento_id
     SET t.tipo = 'Denuncias por obras ilegales'
     WHERE t.tipo IN ('reclamo') AND (LOWER(d.nombre_departamento) LIKE '%obra%')`
  );

  // Tránsito y Transporte
  await conn.query(
    `UPDATE tramites t
     JOIN departamentos d ON d.id_departamento = t.departamento_id
     SET t.tipo = 'Rectificación de datos o errores en licencias.'
     WHERE t.tipo IN ('licencia') AND (LOWER(d.nombre_departamento) LIKE '%transit%' OR LOWER(d.nombre_departamento) LIKE '%tránsito%')`
  );
  await conn.query(
    `UPDATE tramites t
     JOIN departamentos d ON d.id_departamento = t.departamento_id
     SET t.tipo = 'Permiso de circulación.'
     WHERE t.tipo IN ('permiso') AND (LOWER(d.nombre_departamento) LIKE '%transit%' OR LOWER(d.nombre_departamento) LIKE '%tránsito%')`
  );

  await conn.end();
}

run().catch(err => {
  console.error('Error parcheando tramites.tipo:', err.message);
  process.exit(1);
});

