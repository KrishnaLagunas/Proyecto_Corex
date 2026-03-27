const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ConfiguracionPago = sequelize.define('ConfiguracionPago', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  tramite_nombre: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  anio: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  modalidad: {
    type: DataTypes.ENUM('fijo', 'porcentaje'),
    allowNull: false,
    defaultValue: 'fijo'
  },
  monto_fijo: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  porcentaje: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  categoria: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  estado: {
    type: DataTypes.ENUM('activo', 'inactivo'),
    allowNull: false,
    defaultValue: 'activo'
  },
  departamento_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'departamentos',
      key: 'id'
    }
  }
}, {
  tableName: 'configuraciones_pago',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: false,
      fields: ['tramite_nombre', 'anio', 'categoria']
    }
  ]
});

module.exports = ConfiguracionPago;