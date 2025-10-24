/**
 * Modelo de Departamento para la estructura organizacional del municipio
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Departamento = sequelize.define('Departamento', {
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
  // Rut del departamento
  rut: {
    type: DataTypes.STRING(12),
    allowNull: false,
    unique: true
  },
  // Email y teléfono del departamento (mapeados a columnas existentes)
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
  // Dirección física del departamento
  direccion: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  // Región y comuna
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
  // Opciones del modelo
  tableName: 'departamentos',
  timestamps: true,
  underscored: true
});

module.exports = Departamento;