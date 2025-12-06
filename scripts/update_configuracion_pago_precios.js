require('dotenv').config();
const mysql = require('mysql2/promise');

const PRECIOS = [
  { nombre: 'Solicitudes de becas municipales', categoria: 'Educación', precio: 0 },
  { nombre: 'Solicitud de traslado de establecimiento', categoria: 'Educación', precio: 0 },
  { nombre: 'Reclamos y revisiones de casos de convivencia escolar', categoria: 'Educación', precio: 0 },
  { nombre: 'Solicitud de cambio de consultorio', categoria: 'Salud', precio: 0 },
  { nombre: 'Solicitud de Inscripción de consultorio', categoria: 'Salud', precio: 0 },
  { nombre: 'Solicitud de ayuda técnica', categoria: 'Salud', precio: 1000 },
  { nombre: 'Reclamos por centro de salud', categoria: 'Salud', precio: 0 },
  { nombre: 'certificado de construcción de obras', categoria: 'Obras Municipales', precio: 500000 },
  { nombre: 'Regularización de viviendas', categoria: 'Obras Municipales', precio: 200000 },
  { nombre: 'Denuncias por obras ilegales', categoria: 'Obras Municipales', precio: 0 },
  { nombre: 'Solicitud de rondas preventivas', categoria: 'Seguridad Pública', precio: 0 },
  { nombre: 'Instalación de cámaras o alarmas comunitarias', categoria: 'Seguridad Pública', precio: 20000 },
  { nombre: 'Charlas de seguridad', categoria: 'Seguridad Pública', precio: 0 },
  { nombre: 'Rectificación de datos o errores en licencias', categoria: 'Tránsito y Transporte', precio: 3000 },
  { nombre: 'Rectificación de datos o errores en licencias.', categoria: 'Tránsito y Transporte', precio: 3000 },
  { nombre: 'Permiso de circulación', categoria: 'Tránsito y Transporte', precio: 25000 },
  { nombre: 'Permiso de circulación.', categoria: 'Tránsito y Transporte', precio: 25000 }
];

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
  });

  const year = new Date().getFullYear();

  await conn.query(`ALTER TABLE configuraciones_pago MODIFY COLUMN monto_fijo DECIMAL(10,2) NULL`);

  for (const t of PRECIOS) {
    const modalidad = 'fijo';
    const monto_fijo = t.precio;
    const estado = 'activo';
    await conn.query(
      `INSERT INTO configuraciones_pago (tramite_nombre, anio, modalidad, monto_fijo, categoria, estado, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE modalidad = VALUES(modalidad), monto_fijo = VALUES(monto_fijo), categoria = VALUES(categoria), estado = VALUES(estado), updated_at = NOW()`,
      [t.nombre, year, modalidad, monto_fijo, t.categoria, estado]
    );
  }

  console.log('Precios de configuraciones de pago actualizados.');
  await conn.end();
}

run().catch(err => {
  console.error('Error actualizando precios configuraciones de pago:', err.message);
  process.exit(1);
});

