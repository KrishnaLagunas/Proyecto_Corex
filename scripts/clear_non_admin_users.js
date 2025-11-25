/**
 * Script para eliminar todos los usuarios excepto el superadministrador principal.
 * Conserva al usuario con email 'admin@municipalidad.cl' y elimina el resto.
 */

require('dotenv').config();
const { sequelize } = require('../src/config/database');
const { Usuario } = require('../src/models');
const logger = require('../src/utils/logger');

async function clearNonAdminUsers() {
  try {
    await sequelize.authenticate();
    logger.info('Conexión a la base de datos establecida.');

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@municipalidad.cl';

    // Verificar que el superadmin existe
    const admin = await Usuario.findOne({ where: { email: adminEmail } });
    if (!admin) {
      throw new Error(`No se encontró el usuario superadmin con email: ${adminEmail}`);
    }

    // Eliminar todos los usuarios cuyo email sea distinto al admin
    const deletedCount = await Usuario.destroy({
      where: {
        email: { [require('sequelize').Op.ne]: adminEmail }
      }
    });

    logger.info(`Usuarios eliminados (no superadmin): ${deletedCount}`);

    // Opcional: asegurar que el superadmin quede activo y rol superadmin
    admin.estado = 'activo';
    admin.role = 'superadmin';
    await admin.save();

    logger.info(`Superadmin preservado: ${admin.email} (id: ${admin.id})`);
  } catch (error) {
    logger.error(`Error al limpiar usuarios no superadmin: ${error.message}`);
    logger.error(error.stack);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

clearNonAdminUsers()
  .then(() => {
    logger.info('Limpieza de usuarios no superadmin finalizada.');
    process.exit(0);
  })
  .catch((err) => {
    logger.error(`Fallo inesperado: ${err.message}`);
    process.exit(1);
  });
