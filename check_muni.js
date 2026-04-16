const { Municipalidad } = require('./src/models');
const { sequelize } = require('./src/config/database');

async function check() {
  try {
    const total = await Municipalidad.count();
    console.log('Total municipalidades:', total);
    const all = await Municipalidad.findAll({ raw: true });
    console.log('Datos:', JSON.stringify(all, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
