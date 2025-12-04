/**
 * Modelo de tabla intermedia para la relación many-to-many entre Departamento y Usuario
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DepartamentoUsuario = sequelize.define('DepartamentoUsuario', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  departamento_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'departamentos',
      key: 'id_departamento'
    }
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuarios',
      key: 'id'
    }
  },
  fecha_asignacion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'departamento_usuario',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['departamento_id', 'usuario_id']
    }
  ]
});

module.exports = DepartamentoUsuario;
