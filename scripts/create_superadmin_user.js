require('dotenv').config();
const { Usuario, Rol } = require('../src/models');

async function main() {
  const email = process.env.SUPERADMIN_EMAIL || 'superadmin@corex.local';
  const password = process.env.SUPERADMIN_PASSWORD || 'SuperAdmin#2025';
  const rut = '19.773.246-6';

  // Asegurar rol superadministrador
  let rol = await Rol.findOne({ where: { nombre: 'superadministrador' } });
  if (!rol) {
    rol = await Rol.create({ nombre: 'superadministrador' });
    console.log('Rol superadministrador creado');
  }

  // Verificar existencia por email o rut
  const existing = await Usuario.findOne({ where: { email } })
    || await Usuario.findOne({ where: { rut } });
  if (existing) {
    console.log('Usuario ya existe:', { email: existing.email, rut: existing.rut });
    console.log('Credenciales:', { email, password });
    return;
  }

  // Crear usuario superadministrador
  const user = await Usuario.create({
    nombre: 'Super',
    apellido: 'Administrador',
    email,
    password,
    rut,
    telefono: null,
    direccion: null,
    id_rol: rol.id,
    municipalidad_id: null,
    estado: 'activo'
  });

  console.log('Usuario superadministrador creado:', { id: user.id, email: user.email, rut: user.rut });
  console.log('Credenciales:', { email, password });
}

main().catch(err => {
  console.error('Error creando superadministrador:', err.message);
  process.exit(1);
});

