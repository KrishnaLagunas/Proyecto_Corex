/**
 * Script para eliminar todos los usuarios excepto el administrador principal.
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

    // Verificar que el admin existe
    const admin = await Usuario.findOne({ where: { email: adminEmail } });
    if (!admin) {
      throw new Error(`No se encontró el usuario admin con email: ${adminEmail}`);
    }

    // Eliminar todos los usuarios cuyo email sea distinto al admin
    const deletedCount = await Usuario.destroy({
      where: {
        email: { [require('sequelize').Op.ne]: adminEmail }
      }
    });

    logger.info(`Usuarios eliminados (no admin): ${deletedCount}`);

    // Opcional: asegurar que el admin quede activo y rol admin
    admin.estado = 'activo';
    admin.role = 'admin';
    await admin.save();

    logger.info(`Admin preservado: ${admin.email} (id: ${admin.id})`);
  } catch (error) {
    logger.error(`Error al limpiar usuarios no admin: ${error.message}`);
    logger.error(error.stack);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

clearNonAdminUsers()
  .then(() => {
    logger.info('Limpieza de usuarios no admin finalizada.');
    process.exit(0);
  })
  .catch((err) => {
    logger.error(`Fallo inesperado: ${err.message}`);
    process.exit(1);
  });
