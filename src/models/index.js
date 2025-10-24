/**
 * Archivo principal de modelos
 * Define las relaciones entre los modelos y los exporta
 */

// Importar modelos
const Usuario = require('./Usuario');
const Ciudadano = require('./Ciudadano');
const Departamento = require('./Departamento');
const DepartamentoUsuario = require('./DepartamentoUsuario');
const Tramite = require('./Tramite');
const Documento = require('./Documento');
const Pago = require('./Pago');
const Presupuesto = require('./Presupuesto');
const Proveedor = require('./Proveedor');
const Contrato = require('./Contrato');
const Proyecto = require('./Proyecto');
const ConfiguracionPago = require('./ConfiguracionPago');

// Definir relaciones entre modelos

// Relaciones de Usuario
Usuario.hasMany(Tramite, { as: 'tramitesCiudadano', foreignKey: 'ciudadano_id' });
Usuario.hasMany(Tramite, { as: 'tramitesFuncionario', foreignKey: 'funcionario_id' });
Usuario.hasMany(Pago, { as: 'pagosCiudadano', foreignKey: 'ciudadano_id' });
Usuario.hasMany(Pago, { as: 'pagosFuncionario', foreignKey: 'funcionario_id' });
Usuario.hasMany(Documento, { foreignKey: 'usuario_id' });
Usuario.hasMany(Presupuesto, { foreignKey: 'responsable_id' });
Usuario.hasMany(Proveedor, { foreignKey: 'registrado_por' });
Usuario.hasMany(Contrato, { foreignKey: 'responsable_id' });
Usuario.hasMany(Proyecto, { foreignKey: 'responsable_id' });
Usuario.belongsTo(Departamento, { foreignKey: 'departamento_id' });
Usuario.belongsToMany(Departamento, { 
  as: 'DepartamentosAsignados', 
  through: DepartamentoUsuario, 
  foreignKey: 'usuario_id', 
  otherKey: 'departamento_id' 
});

// Relaciones de Departamento
Departamento.hasMany(Usuario, { foreignKey: 'departamento_id' });
Departamento.belongsToMany(Usuario, { 
  as: 'Funcionarios', 
  through: DepartamentoUsuario, 
  foreignKey: 'departamento_id', 
  otherKey: 'usuario_id' 
});
Departamento.hasMany(Tramite, { foreignKey: 'departamento_id' });
Departamento.hasMany(Presupuesto, { foreignKey: 'departamento_id' });
Departamento.hasMany(Contrato, { foreignKey: 'departamento_id' });
Departamento.hasMany(Proyecto, { foreignKey: 'departamento_id' });

// Relaciones de Trámite
Tramite.belongsTo(Usuario, { as: 'ciudadano', foreignKey: 'ciudadano_id' });
Tramite.belongsTo(Usuario, { as: 'funcionario', foreignKey: 'funcionario_id' });
Tramite.belongsTo(Departamento, { foreignKey: 'departamento_id' });
Tramite.hasMany(Documento, { foreignKey: 'tramite_id' });
Tramite.hasMany(Pago, { foreignKey: 'tramite_id' });

// Relaciones de Documento
Documento.belongsTo(Usuario, { foreignKey: 'usuario_id' });
Documento.belongsTo(Tramite, { foreignKey: 'tramite_id' });
Documento.hasOne(Contrato, { foreignKey: 'documento_id' });

// Relaciones de Pago
Pago.belongsTo(Usuario, { as: 'ciudadano', foreignKey: 'ciudadano_id' });
Pago.belongsTo(Usuario, { as: 'funcionario', foreignKey: 'funcionario_id' });
Pago.belongsTo(Tramite, { foreignKey: 'tramite_id' });

// Relaciones de Presupuesto
Presupuesto.belongsTo(Usuario, { as: 'responsable', foreignKey: 'responsable_id' });
Presupuesto.belongsTo(Departamento, { foreignKey: 'departamento_id' });
Presupuesto.hasMany(Proyecto, { foreignKey: 'presupuesto_id' });

// Relaciones de Proveedor
Proveedor.belongsTo(Usuario, { as: 'registrador', foreignKey: 'registrado_por' });
Proveedor.hasMany(Contrato, { foreignKey: 'proveedor_id' });

// Relaciones de Contrato
Contrato.belongsTo(Proveedor, { foreignKey: 'proveedor_id' });
Contrato.belongsTo(Departamento, { foreignKey: 'departamento_id' });
Contrato.belongsTo(Proyecto, { foreignKey: 'proyecto_id' });
Contrato.belongsTo(Usuario, { as: 'responsable', foreignKey: 'responsable_id' });
Contrato.belongsTo(Documento, { foreignKey: 'documento_id' });

// Relaciones de Proyecto
Proyecto.belongsTo(Departamento, { foreignKey: 'departamento_id' });
Proyecto.belongsTo(Usuario, { as: 'responsable', foreignKey: 'responsable_id' });
Proyecto.belongsTo(Presupuesto, { foreignKey: 'presupuesto_id' });
Proyecto.hasMany(Contrato, { foreignKey: 'proyecto_id' });

// Exportar modelos
module.exports = {
  Usuario,
  Ciudadano,
  Departamento,
  DepartamentoUsuario,
  Tramite,
  Documento,
  Pago,
  Presupuesto,
  Proveedor,
  Contrato,
  Proyecto,
  ConfiguracionPago
};