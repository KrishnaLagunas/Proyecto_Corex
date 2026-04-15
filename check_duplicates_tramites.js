const { ConfiguracionPago } = require('./src/models');
const { sequelize } = require('./src/config/database');
const { Op } = require('sequelize');

async function checkDuplicates() {
  try {
    console.log('--- Buscando duplicados en Tipos de Trámite ---');
    
    // Buscar registros agrupados por nombre y categoría
    const duplicates = await ConfiguracionPago.findAll({
      attributes: [
        'tramite_nombre', 
        'categoria', 
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['tramite_nombre', 'categoria'],
      having: sequelize.where(sequelize.fn('COUNT', sequelize.col('id')), '>', 1)
    });

    console.log(`Se encontraron ${duplicates.length} grupos con nombres/categorías duplicadas.\n`);

    for (const group of duplicates) {
      const { tramite_nombre, categoria, count } = group.dataValues;
      console.log(`Trámite: "${tramite_nombre}" | Categoría: "${categoria}" | Repeticiones: ${count}`);
      
      const records = await ConfiguracionPago.findAll({
        where: { tramite_nombre, categoria },
        order: [['id', 'ASC']]
      });

      records.forEach(r => {
        console.log(`  - ID: ${r.id}, Año: ${r.anio}, Costo: ${r.monto_fijo || r.porcentaje + '%' || '0'}, Estado: ${r.estado}`);
      });
      console.log('------------------------------------------------');
    }

  } catch (error) {
    console.error('Error al verificar duplicados:', error);
  } finally {
    process.exit();
  }
}

checkDuplicates();
