const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MunicipalidadUsuario = sequelize.define('MunicipalidadUsuario', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  municipalidad_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'municipalidades',
      key: 'id'
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
  tableName: 'municipalidad_usuario',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['municipalidad_id', 'usuario_id']
    }
  ]
});

module.exports = MunicipalidadUsuario;
