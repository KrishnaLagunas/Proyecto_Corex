/**
 * Modelo de Usuario para la autenticación y gestión de usuarios
 * Alineado con nombres de columnas reales en la base de datos
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const Usuario = sequelize.define('Usuario', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  // Nuevo: nombres separados
  primer_nombre: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  segundo_nombre: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  apellido: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  primer_apellido: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  segundo_apellido: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('admin', 'funcionario', 'ciudadano'),
    allowNull: true
  },
  rut: {
    type: DataTypes.STRING(12),
    allowNull: true,
    unique: true
  },
  telefono: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  direccion: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  fecha_nacimiento: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  celular: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  // Nuevo: campos de gestión de sesión y recuperación
  ultimo_login: {
    type: DataTypes.DATE,
    allowNull: true
  },
  token_recuperacion: {
    type: DataTypes.STRING,
    allowNull: true
  },
  expiracion_token: {
    type: DataTypes.DATE,
    allowNull: true
  },
  departamento_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'departamentos',
      key: 'id'
    }
  },
  estado: {
    type: DataTypes.ENUM('activo', 'inactivo', 'bloqueado'),
    allowNull: true
  }
}, {
  // Opciones del modelo
  tableName: 'usuarios',
  timestamps: true,
  underscored: true,
  
  // Hooks (ganchos) para acciones antes/después de operaciones
  hooks: {
    // Hash de la contraseña antes de crear o actualizar un usuario
    beforeCreate: async (usuario) => {
      if (usuario.password) {
        const salt = await bcrypt.genSalt(10);
        usuario.password = await bcrypt.hash(usuario.password, salt);
      }
    },
    beforeUpdate: async (usuario) => {
      if (usuario.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        usuario.password = await bcrypt.hash(usuario.password, salt);
      }
    }
  }
});

// Método para comparar contraseñas (para login)
Usuario.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Método para generar un token de recuperación de contraseña
Usuario.prototype.generateRecoveryToken = function() {
  const token = Math.random().toString(36).substring(2, 15) +
               Math.random().toString(36).substring(2, 15);

  this.token_recuperacion = token;
  // Expira en 24 horas
  this.expiracion_token = new Date(Date.now() + 24 * 60 * 60 * 1000);

  return token;
};

module.exports = Usuario;