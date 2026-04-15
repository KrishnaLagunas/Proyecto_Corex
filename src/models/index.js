/**
 * Archivo principal de modelos
 * Define las relaciones entre los modelos y los exporta
 */

// Importar modelos
const Usuario = require('./Usuario');
const Ciudadano = require('./Ciudadano');
const Municipalidad = require('./Municipalidad');
const MunicipalidadUsuario = require('./MunicipalidadUsuario');
const Tramite = require('./Tramite');
const Documento = require('./Documento');
const Pago = require('./Pago');
// Proyecto deshabilitado
const ConfiguracionPago = require('./ConfiguracionPago');
const Rol = require('./Rol');
const Departamento = require('./Departamento');
const DepartamentoUsuario = require('./DepartamentoUsuario');
const PerfilUsuario = require('./PerfilUsuario');

// Definir relaciones entre modelos

// Relaciones de Usuario
Usuario.hasMany(Tramite, { as: 'tramitesCiudadano', foreignKey: 'ciudadano_id' });
Usuario.hasMany(Tramite, { as: 'tramitesFuncionario', foreignKey: 'funcionario_id' });
Usuario.hasMany(Pago, { as: 'pagosCiudadano', foreignKey: 'ciudadano_id' });
Usuario.hasMany(Pago, { as: 'pagosFuncionario', foreignKey: 'funcionario_id' });
Usuario.hasMany(Documento, { foreignKey: 'usuario_id' });
// Usuario.hasMany(Proyecto, { foreignKey: 'responsable_id' });
Usuario.belongsTo(Municipalidad, { foreignKey: 'municipalidad_id' });
Usuario.belongsTo(Rol, { foreignKey: 'id_rol' });
Usuario.belongsToMany(Departamento, { 
  as: 'Departamentos', 
  through: DepartamentoUsuario, 
  foreignKey: 'usuario_id', 
  otherKey: 'departamento_id' 
});
Usuario.belongsToMany(Municipalidad, { 
  as: 'MunicipalidadesAsignadas', 
  through: MunicipalidadUsuario, 
  foreignKey: 'usuario_id', 
  otherKey: 'municipalidad_id' 
});
Usuario.hasOne(PerfilUsuario, { foreignKey: 'usuario_id' });
PerfilUsuario.belongsTo(Usuario, { foreignKey: 'usuario_id' });

// Relaciones de Municipalidad
Municipalidad.hasMany(Usuario, { foreignKey: 'municipalidad_id' });
Municipalidad.belongsToMany(Usuario, { 
  as: 'Funcionarios', 
  through: MunicipalidadUsuario, 
  foreignKey: 'municipalidad_id', 
  otherKey: 'usuario_id' 
});
Municipalidad.hasMany(Tramite, { foreignKey: 'municipalidad_id' });
// Municipalidad.hasMany(Proyecto, { foreignKey: 'municipalidad_id' });
// Relaciones de Departamento deshabilitadas (departamentos globales)
Departamento.belongsToMany(Usuario, {
  through: DepartamentoUsuario,
  foreignKey: 'departamento_id',
  otherKey: 'usuario_id'
});

Usuario.belongsToMany(Departamento, {
  through: DepartamentoUsuario,
  foreignKey: 'usuario_id',
  otherKey: 'departamento_id'
});

// Relaciones de Trámite
Tramite.belongsTo(Usuario, { as: 'ciudadano', foreignKey: 'ciudadano_id' });
Tramite.belongsTo(Usuario, { as: 'funcionario', foreignKey: 'funcionario_id' });
Tramite.belongsTo(Municipalidad, { foreignKey: 'municipalidad_id' });
Tramite.belongsTo(Departamento, { foreignKey: 'departamento_id' });
Departamento.hasMany(Tramite, { foreignKey: 'departamento_id' });
Tramite.hasMany(Documento, { foreignKey: 'tramite_id' });
Tramite.hasMany(Pago, { foreignKey: 'tramite_id' });

ConfiguracionPago.belongsTo(Departamento, { foreignKey: 'departamento_id' });
Departamento.hasMany(ConfiguracionPago, { foreignKey: 'departamento_id' });
Departamento.belongsToMany(Usuario, { 
  as: 'Funcionarios', 
  through: DepartamentoUsuario, 
  foreignKey: 'departamento_id', 
  otherKey: 'usuario_id' 
});

// Relaciones de Documento
Documento.belongsTo(Usuario, { as: 'usuario', foreignKey: 'usuario_id' });
Documento.belongsTo(Tramite, { foreignKey: 'tramite_id' });

// Relaciones de Pago
Pago.belongsTo(Usuario, { as: 'ciudadano', foreignKey: 'ciudadano_id' });
Pago.belongsTo(Usuario, { as: 'funcionario', foreignKey: 'funcionario_id' });
Pago.belongsTo(Tramite, { foreignKey: 'tramite_id' });

// Relaciones de Proyecto deshabilitadas

// Exportar modelos
module.exports = {
  Usuario,
  Ciudadano,
  Municipalidad,
  MunicipalidadUsuario,
  Tramite,
  Documento,
  Pago,
  // Proyecto,
  ConfiguracionPago,
  Rol,
  Departamento,
  DepartamentoUsuario,
  PerfilUsuario
};
