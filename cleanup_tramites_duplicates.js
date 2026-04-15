const { ConfiguracionPago } = require('./src/models');
const { sequelize } = require('./src/config/database');
const { Op } = require('sequelize');

async function cleanupDuplicates() {
  const transaction = await sequelize.transaction();
  try {
    console.log('--- Iniciando limpieza de duplicados en ConfiguracionPago ---');

    // 1. Encontrar grupos duplicados (mismos campos clave)
    const duplicates = await ConfiguracionPago.findAll({
      attributes: [
        'tramite_nombre', 
        'categoria', 
        'anio',
        'modalidad',
        'monto_fijo',
        'porcentaje',
        'estado',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['tramite_nombre', 'categoria', 'anio', 'modalidad', 'monto_fijo', 'porcentaje', 'estado'],
      having: sequelize.where(sequelize.fn('COUNT', sequelize.col('id')), '>', 1),
      transaction
    });

    console.log(`Se detectaron ${duplicates.length} tipos de trámites con registros idénticos.`);

    let deletedCount = 0;

    for (const group of duplicates) {
      const { tramite_nombre, categoria, anio, modalidad, monto_fijo, porcentaje, estado } = group.dataValues;
      
      // Obtener todos los IDs para este grupo, ordenados por ID (mantener el primero)
      const records = await ConfiguracionPago.findAll({
        where: { 
          tramite_nombre, 
          categoria, 
          anio, 
          modalidad, 
          monto_fijo: monto_fijo || null, 
          porcentaje: porcentaje || null, 
          estado 
        },
        attributes: ['id'],
        order: [['id', 'ASC']],
        transaction
      });

      if (records.length > 1) {
        // El primer registro se queda, los demás se van
        const idsToDelete = records.slice(1).map(r => r.id);
        console.log(`Borrando ${idsToDelete.length} duplicados para: "${tramite_nombre}"`);
        
        await ConfiguracionPago.destroy({
          where: { id: { [Op.in]: idsToDelete } },
          transaction
        });
        
        deletedCount += idsToDelete.length;
      }
    }

    await transaction.commit();
    console.log(`\nLimpieza completada exitosamente. Se eliminaron ${deletedCount} registros duplicados.`);

  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error('Error durante la limpieza:', error);
  } finally {
    process.exit();
  }
}

cleanupDuplicates();
