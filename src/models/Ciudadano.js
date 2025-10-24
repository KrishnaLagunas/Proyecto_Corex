/**
 * Modelo de Ciudadano para el registro en el portal ciudadano
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const Ciudadano = sequelize.define('Ciudadano', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  primer_nombre: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 50]
    }
  },
  segundo_nombre: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  apellido_paterno: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 50]
    }
  },
  apellido_materno: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 50]
    }
  },
  rut: {
    type: DataTypes.STRING(12),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      is: /^[0-9]+-[0-9kK]$/i // Formato RUT chileno
    }
  },
  telefono: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      notEmpty: true
    }
  },
  direccion: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  region_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'regiones',
      key: 'id'
    }
  },
  comuna_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'comunas',
      key: 'id'
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [6, 255]
    }
  },
  estado: {
    type: DataTypes.ENUM('activo', 'inactivo', 'pendiente_verificacion'),
    defaultValue: 'pendiente_verificacion',
    allowNull: false
  },
  fecha_verificacion: {
    type: DataTypes.DATE,
    allowNull: true
  },
  token_verificacion: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'ciudadanos',
  timestamps: true,
  underscored: true,
  hooks: {
    beforeCreate: async (ciudadano) => {
      if (ciudadano.password) {
        const salt = await bcrypt.genSalt(10);
        ciudadano.password = await bcrypt.hash(ciudadano.password, salt);
      }
    },
    beforeUpdate: async (ciudadano) => {
      if (ciudadano.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        ciudadano.password = await bcrypt.hash(ciudadano.password, salt);
      }
    }
  }
});

// Método para comparar contraseñas
Ciudadano.prototype.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Método para generar nombre completo
Ciudadano.prototype.getNombreCompleto = function() {
  const nombres = [this.primer_nombre, this.segundo_nombre].filter(Boolean).join(' ');
  const apellidos = [this.apellido_paterno, this.apellido_materno].filter(Boolean).join(' ');
  return `${nombres} ${apellidos}`.trim();
};

// Método para generar token de verificación
Ciudadano.prototype.generateVerificationToken = function() {
  const crypto = require('crypto');
  this.token_verificacion = crypto.randomBytes(32).toString('hex');
  return this.token_verificacion;
};

module.exports = Ciudadano;