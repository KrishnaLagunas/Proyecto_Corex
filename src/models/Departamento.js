const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Departamento = sequelize.define('Departamento', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id_departamento'
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'nombre_departamento'
  },
  // columnas globales: sin estado ni municipalidad_id
}, {
  tableName: 'departamentos',
  timestamps: false,
  underscored: true
});

module.exports = Departamento;
