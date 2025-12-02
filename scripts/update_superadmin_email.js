require('dotenv').config();
const { Usuario, Rol } = require('../src/models');

async function main() {
  const targetRut = '19.773.246-6';
  const newEmail = process.env.SUPERADMIN_EMAIL_UPDATE || 'superadmin@corex.com';

  let user = await Usuario.findOne({ where: { rut: targetRut } });
  if (!user) {
    console.log('No existe usuario con el rut indicado. Creando superadministrador...');
    let rol = await Rol.findOne({ where: { nombre: 'superadministrador' } });
    if (!rol) rol = await Rol.create({ nombre: 'superadministrador' });
    const password = process.env.SUPERADMIN_PASSWORD || 'SuperAdmin#2025';
    user = await Usuario.create({
      nombre: 'Super',
      apellido: 'Administrador',
      email: newEmail,
      password,
      rut: targetRut,
      id_rol: rol.id,
      estado: 'activo'
    });
    console.log('Usuario superadministrador creado:', { email: user.email });
    console.log('Credenciales:', { email: user.email, password });
    return;
  }

  // Actualizar email si es distinto
  if (user.email !== newEmail) {
    user.email = newEmail;
    await user.save();
    console.log('Email actualizado para superadministrador:', { email: user.email });
  } else {
    console.log('El email ya está actualizado:', { email: user.email });
  }

  console.log('Listo. Usa estas credenciales:', { email: user.email, password: process.env.SUPERADMIN_PASSWORD || 'SuperAdmin#2025' });
}

main().catch(err => {
  console.error('Error actualizando email de superadmin:', err.message);
  process.exit(1);
});

