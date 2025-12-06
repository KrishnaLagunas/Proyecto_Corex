require('dotenv').config();
const mysql = require('mysql2/promise');

const TRAMITES = [
  { nombre: 'Solicitudes de becas municipales', categoria: 'Educación', modalidad: 'fijo', monto_fijo: 0 },
  { nombre: 'Solicitud de traslado de establecimiento', categoria: 'Educación', modalidad: 'fijo', monto_fijo: 0 },
  { nombre: 'Reclamos y revisiones de casos de convivencia escolar', categoria: 'Educación', modalidad: 'fijo', monto_fijo: 0 },
  { nombre: 'Solicitud de cambio de consultorio', categoria: 'Salud', modalidad: 'fijo', monto_fijo: 0 },
  { nombre: 'Solicitud de Inscripción de consultorio', categoria: 'Salud', modalidad: 'fijo', monto_fijo: 0 },
  { nombre: 'Solicitud de ayuda técnica', categoria: 'Salud', modalidad: 'fijo', monto_fijo: 0 },
  { nombre: 'Reclamos por centro de salud', categoria: 'Salud', modalidad: 'fijo', monto_fijo: 0 },
  { nombre: 'certificado de construcción de obras', categoria: 'Obras Municipales', modalidad: 'fijo', monto_fijo: 0 },
  { nombre: 'Regularización de viviendas', categoria: 'Obras Municipales', modalidad: 'fijo', monto_fijo: 0 },
  { nombre: 'Denuncias por obras ilegales', categoria: 'Obras Municipales', modalidad: 'fijo', monto_fijo: 0 },
  { nombre: 'Solicitud de rondas preventivas', categoria: 'Seguridad Pública', modalidad: 'fijo', monto_fijo: 0 },
  { nombre: 'Instalación de cámaras o alarmas comunitarias', categoria: 'Seguridad Pública', modalidad: 'fijo', monto_fijo: 0 },
  { nombre: 'Charlas de seguridad', categoria: 'Seguridad Pública', modalidad: 'fijo', monto_fijo: 0 },
  { nombre: 'Rectificación de datos o errores en licencias.', categoria: 'Tránsito y Transporte', modalidad: 'fijo', monto_fijo: 0 },
  { nombre: 'Permiso de circulación.', categoria: 'Tránsito y Transporte', modalidad: 'fijo', monto_fijo: 0 }
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

  for (const t of TRAMITES) {
    await conn.query(
      `INSERT INTO configuraciones_pago (tramite_nombre, anio, modalidad, monto_fijo, categoria, estado, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'activo', NOW(), NOW())
       ON DUPLICATE KEY UPDATE modalidad = VALUES(modalidad), monto_fijo = VALUES(monto_fijo), categoria = VALUES(categoria), estado = VALUES(estado), updated_at = NOW()`,
      [t.nombre, year, t.modalidad, t.monto_fijo, t.categoria]
    );
  }

  console.log('Configuraciones de pago específicas sembradas/actualizadas.');
  await conn.end();
}

run().catch(err => {
  console.error('Error sembrando configuraciones de pago específicas:', err.message);
  process.exit(1);
});
