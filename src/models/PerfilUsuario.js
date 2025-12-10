const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const PerfilUsuario = sequelize.define('PerfilUsuario', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  usuario_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'usuarios', key: 'id' } },
  nombre_usuario: { type: DataTypes.STRING(150), allowNull: true },
  rol: { type: DataTypes.STRING(50), allowNull: true },
  foto_url: { type: DataTypes.STRING(255), allowNull: true }
}, {
  tableName: 'perfil_usuario',
  timestamps: true
})

module.exports = PerfilUsuario
