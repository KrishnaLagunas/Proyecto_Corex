require('dotenv').config();
const { sequelize } = require('../src/config/database');
const { Rol, Usuario } = require('../src/models');

async function createSuperadmin() {
  try {
    await sequelize.authenticate();
    const [rolSuper] = await Rol.findOrCreate({ where: { nombre: 'superadministrador' }, defaults: { nombre: 'superadministrador' } });
    let user = await Usuario.findOne({ where: { email: 'superadmin@municipalidad.cl' } });
    if (!user) {
      user = await Usuario.create({
        nombre: 'Super',
        apellido: 'Administrador',
        email: 'superadmin@municipalidad.cl',
        password: 'super123',
        rut: '99999999-9',
        id_rol: rolSuper.id,
        estado: 'activo'
      });
      console.log('Superadministrador creado');
    } else {
      await user.update({ id_rol: rolSuper.id, estado: 'activo' });
      console.log('Superadministrador actualizado');
    }
  } catch (err) {
    console.error('Error creando superadministrador:', err.message);
    process.exit(1);
  } finally {
    try { await sequelize.close(); } catch (_) {}
    process.exit(0);
  }
}

createSuperadmin();
