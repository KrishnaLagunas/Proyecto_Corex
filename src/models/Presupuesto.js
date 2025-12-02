/**
 * Modelo de Presupuesto para la gestión financiera municipal
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Presupuesto = sequelize.define('Presupuesto', {
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
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  año_fiscal: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 2000,
      max: 2100
    }
  },
  monto_total: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  monto_ejecutado: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0
  },
  fecha_inicio: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  fecha_fin: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  estado: {
    type: DataTypes.ENUM(
      'planificacion', 
      'aprobado', 
      'en_ejecucion', 
      'cerrado', 
      'anulado'
    ),
    defaultValue: 'planificacion',
    allowNull: false
  },
  notas: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  municipalidad_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'municipalidades',
      key: 'id'
    },
    comment: 'Municipalidad a la que pertenece el presupuesto, si aplica'
  },
  responsable_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuarios',
      key: 'id'
    },
    comment: 'Usuario responsable del presupuesto'
  }
}, {
  // Opciones del modelo
  tableName: 'presupuestos',
  timestamps: true,
  underscored: true,
  
  // Hooks para validaciones adicionales
  hooks: {
    beforeCreate: (presupuesto) => {
      // Validar que la fecha de fin sea posterior a la fecha de inicio
      if (new Date(presupuesto.fecha_fin) <= new Date(presupuesto.fecha_inicio)) {
        throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
      }
      
      // Validar que el monto ejecutado no sea mayor al monto total
      if (parseFloat(presupuesto.monto_ejecutado) > parseFloat(presupuesto.monto_total)) {
        throw new Error('El monto ejecutado no puede ser mayor al monto total');
      }
    },
    beforeUpdate: (presupuesto) => {
      // Validar que la fecha de fin sea posterior a la fecha de inicio
      if (presupuesto.changed('fecha_fin') || presupuesto.changed('fecha_inicio')) {
        if (new Date(presupuesto.fecha_fin) <= new Date(presupuesto.fecha_inicio)) {
          throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
        }
      }
      
      // Validar que el monto ejecutado no sea mayor al monto total
      if (presupuesto.changed('monto_ejecutado') || presupuesto.changed('monto_total')) {
        if (parseFloat(presupuesto.monto_ejecutado) > parseFloat(presupuesto.monto_total)) {
          throw new Error('El monto ejecutado no puede ser mayor al monto total');
        }
      }
    }
  }
});

// Método para generar un código único para el presupuesto
Presupuesto.generateCodigo = async function(año) {
  // Contar presupuestos del mismo año fiscal
  const count = await this.count({
    where: {
      año_fiscal: año
    }
  });
  
  // Generar código con formato: PRES-AÑO-NÚMERO
  const numero = (count + 1).toString().padStart(3, '0');
  return `PRES-${año}-${numero}`;
};

module.exports = Presupuesto;
