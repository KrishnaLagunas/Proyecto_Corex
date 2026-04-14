const { Tramite, Pago, Municipalidad, sequelize } = require('./src/models');

async function listRemaining() {
  try {
    const tramites = await Tramite.findAll({ raw: true });
    console.log("Tramites remaining:", tramites.map(t => ({ id: t.id_tramite || t.id, muni: t.municipalidad_id, titulo: t.tipo })));

    const pagos = await Pago.findAll({ raw: true });
    console.log("Pagos remaining:", pagos.map(p => ({ id: p.id_pago || p.id, tramite_id: p.tramite_id })));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
listRemaining();
