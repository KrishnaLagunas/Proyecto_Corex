const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Municipalidad = sequelize.define('Municipalidad', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  rut: {
    type: DataTypes.STRING(12),
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: { isEmail: true },
    field: 'email_contacto'
  },
  telefono: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'telefono_contacto'
  },
  direccion: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  region: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  comuna: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  estado: {
    type: DataTypes.ENUM('activo', 'inactivo'),
    defaultValue: 'activo'
  }
}, {
  tableName: 'municipalidades',
  timestamps: true,
  underscored: true
});

module.exports = Municipalidad;
