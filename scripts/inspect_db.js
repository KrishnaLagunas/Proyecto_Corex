require('dotenv').config();
const { sequelize } = require('../src/config/database');
const Usuario = require('../src/models/Usuario');
const Departamento = require('../src/models/Departamento');

async function run() {
  try {
    console.log('Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('OK: conexión establecida');

    const qi = sequelize.getQueryInterface();
    console.log('\nEstructura de tablas:');
    const usuariosDesc = await qi.describeTable('usuarios');
    const departamentosDesc = await qi.describeTable('departamentos');
    console.log('Tabla usuarios:', usuariosDesc);
    console.log('Tabla departamentos:', departamentosDesc);

    // Mostrar índices
    const [usuariosIndexes] = await sequelize.query('SHOW INDEX FROM usuarios');
    const [departamentosIndexes] = await sequelize.query('SHOW INDEX FROM departamentos');
    console.log('Índices usuarios:', usuariosIndexes);
    console.log('Índices departamentos:', departamentosIndexes);

    console.log('\nConteos y ejemplos:');
    const usuariosCount = await Usuario.count();
    const departamentosCount = await Departamento.count();
    console.log(`Usuarios: ${usuariosCount}`);
    console.log(`Departamentos: ${departamentosCount}`);

    const usuariosSample = await Usuario.findAll({
      limit: 5,
      order: [['id', 'ASC']],
      attributes: ['id', 'nombre', 'apellido', 'email', 'role', 'rut', 'departamento_id', 'estado']
    });
    const departamentosSample = await Departamento.findAll({
      limit: 5,
      order: [['id', 'ASC']],
      attributes: ['id', 'nombre', 'rut', 'estado']
    });
    console.log('Ejemplo usuarios:', usuariosSample.map(u => u.toJSON()));
    console.log('Ejemplo departamentos:', departamentosSample.map(d => d.toJSON()));

    await sequelize.close();
    console.log('\nCerrada la conexión.');
  } catch (err) {
    console.error('Error inspeccionando la BD:', err);
    process.exitCode = 1;
  }
}

run();