require('dotenv').config();
const { sequelize } = require('../src/config/database');
const { Pago } = require('../src/models');

async function run() {
  try {
    console.log('Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('OK: conexión establecida');

    const qi = sequelize.getQueryInterface();
    const pagosDesc = await qi.describeTable('pagos');
    console.log('Tabla pagos:', pagosDesc);

    const count = await Pago.count();
    console.log('Conteo de pagos:', count);

    const sample = await Pago.findAll({ limit: 1, order: [['id', 'ASC']] });
    console.log('Ejemplo pago:', sample.map(p => p.toJSON()));

    await sequelize.close();
    console.log('Conexión cerrada.');
    process.exit(0);
  } catch (err) {
    console.error('Error inspeccionando pagos:', err);
    process.exit(1);
  }
}

run();