const { Tramite, Pago, sequelize } = require('./src/models');

async function deleteNullRecords() {
  try {
    const tramites = await Tramite.findAll({
      where: { municipalidad_id: null },
      attributes: ['id'] // Asumiendo que es "id"
    });

    const tramitesIds = tramites.map(t => t.id || t.id_tramite);
    const idsToLog = tramitesIds.filter(id => id !== undefined);

    if (idsToLog.length > 0) {
      console.log(`Se encontraron ${idsToLog.length} trámites nulos. Borrando pagos...`);
      const deletedPagos = await Pago.destroy({
        where: { tramite_id: idsToLog }
      });
      console.log(`Se han eliminado ${deletedPagos} pagos.`);

      const deletedTramites = await Tramite.destroy({
        where: { municipalidad_id: null }
      });
      console.log(`Se han eliminado ${deletedTramites} trámites.`);
    } else {
        console.log("No nulos found.");
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
deleteNullRecords();
