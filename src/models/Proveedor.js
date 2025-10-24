/**
 * Modelo de Proveedor para la gestión de proveedores municipales
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Proveedor = sequelize.define('Proveedor', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  codigo: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  razon_social: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  nombre_comercial: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  rut: {
    type: DataTypes.STRING(12),
    allowNull: false,
    unique: true
  },
  direccion: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  ciudad: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  region: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  telefono: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  sitio_web: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  representante_legal: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  rut_representante: {
    type: DataTypes.STRING(12),
    allowNull: false
  },
  giro: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  categoria: {
    type: DataTypes.ENUM(
      'servicios', 
      'construccion', 
      'tecnologia', 
      'suministros', 
      'consultoria', 
      'otro'
    ),
    allowNull: false
  },
  estado: {
    type: DataTypes.ENUM('activo', 'inactivo', 'bloqueado'),
    defaultValue: 'activo',
    allowNull: false
  },
  fecha_registro: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  calificacion: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 5
    },
    comment: 'Calificación del proveedor de 1 a 5'
  },
  notas: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  cuenta_bancaria: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  banco: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  tipo_cuenta: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  registrado_por: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuarios',
      key: 'id'
    },
    comment: 'Usuario que registró al proveedor'
  }
}, {
  // Opciones del modelo
  tableName: 'proveedores',
  timestamps: true,
  underscored: true
});

// Método para generar un código único para el proveedor
Proveedor.generateCodigo = async function() {
  const fecha = new Date();
  const año = fecha.getFullYear().toString().substr(-2);
  
  // Contar proveedores registrados en el año actual
  const count = await this.count({
    where: {
      fecha_registro: {
        [sequelize.Op.gte]: new Date(fecha.getFullYear(), 0, 1),
        [sequelize.Op.lt]: new Date(fecha.getFullYear() + 1, 0, 1)
      }
    }
  });
  
  // Generar código con formato: PROV-AÑO-NÚMERO
  const numero = (count + 1).toString().padStart(4, '0');
  return `PROV-${año}-${numero}`;
};

module.exports = Proveedor;