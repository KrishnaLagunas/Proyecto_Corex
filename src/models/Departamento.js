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
  estado: {
    type: DataTypes.ENUM('activo', 'inactivo'),
    allowNull: false,
    defaultValue: 'activo',
    field: 'estado'
  },
  municipalidad_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'municipalidad_id'
  }
}, {
  tableName: 'departamentos',
  timestamps: false,
  underscored: true
});

module.exports = Departamento;
