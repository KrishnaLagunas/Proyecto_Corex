const { ConfiguracionPago } = require('./src/models');
const { sequelize } = require('./src/config/database');
const { Op } = require('sequelize');

async function cleanupPunctuationDuplicates() {
  const transaction = await sequelize.transaction();
  try {
    console.log('--- Limpiando duplicados por puntuación (puntos finales) ---');

    // 1. Obtener todas las configuraciones activas
    const configs = await ConfiguracionPago.findAll({ transaction });
    
    // 2. Agrupar por nombre normalizado
    const groups = {};
    configs.forEach(c => {
      const normalized = c.tramite_nombre.trim().replace(/\.+$/, '');
      if (!groups[normalized]) groups[normalized] = [];
      groups[normalized].push(c);
    });

    let totalDeleted = 0;

    // 3. Procesar cada grupo
    for (const name in groups) {
      const records = groups[name];
      if (records.length > 1) {
        // Encontrar el mejor registro (el que tenga costo > 0, o el más nuevo)
        records.sort((a, b) => {
          const costoA = parseFloat(a.monto_fijo || a.porcentaje || 0);
          const costoB = parseFloat(b.monto_fijo || b.porcentaje || 0);
          if (costoA !== costoB) return costoB - costoA; // Mayor costo primero
          return b.id - a.id; // ID más nuevo después
        });

        const best = records[0];
        const toDelete = records.slice(1).map(r => r.id);

        console.log(`Para "${name}":`);
        console.log(`  - Mantenemos ID: ${best.id} (Costo: ${best.monto_fijo})`);
        console.log(`  - Borramos IDs: ${toDelete.join(', ')}`);

        await ConfiguracionPago.destroy({
          where: { id: { [Op.in]: toDelete } },
          transaction
        });
        totalDeleted += toDelete.length;
      }
    }

    await transaction.commit();
    console.log(`\nLimpieza terminada. Se eliminaron ${totalDeleted} registros redundantes.`);

  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error('Error en la limpieza:', error);
  } finally {
    process.exit();
  }
}

cleanupPunctuationDuplicates();
