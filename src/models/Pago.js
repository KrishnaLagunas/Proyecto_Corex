/**
 * Modelo de Pago para la gestión de pagos de trámites y servicios
 */

const { DataTypes, Op } = require('sequelize');
const { sequelize } = require('../config/database');

const Pago = sequelize.define('Pago', {
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
  monto: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  fecha_pago: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  fecha_confirmacion: {
    type: DataTypes.DATE,
    allowNull: true
  },
  metodo_pago: {
    type: DataTypes.ENUM(
      'efectivo', 
      'tarjeta_credito', 
      'tarjeta_debito', 
      'transferencia', 
      'cheque', 
      'otro'
    ),
    allowNull: false
  },
  estado: {
    type: DataTypes.ENUM(
      'pendiente', 
      'procesando', 
      'completado', 
      'rechazado', 
      'reembolsado'
    ),
    defaultValue: 'pendiente',
    allowNull: false
  },
  referencia_externa: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Número de referencia de la pasarela de pago o transacción externa'
  },
  comprobante_url: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'URL al archivo PDF del comprobante de pago'
  },
  notas: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tramite_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'tramites',
      key: 'id'
    },
    comment: 'Trámite asociado al pago, si corresponde'
  },
  ciudadano_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuarios',
      key: 'id'
    },
    comment: 'Usuario que realiza el pago'
  },
  funcionario_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'usuarios',
      key: 'id'
    },
    comment: 'Funcionario que registra o procesa el pago, si aplica'
  }
}, {
  // Opciones del modelo
  tableName: 'pagos',
  timestamps: true,
  underscored: true,
  hooks: {
    beforeCreate: async (pago, options) => {
      if (!pago.codigo) {
        const fecha = new Date();
        const año = fecha.getFullYear().toString().substr(-2);
        const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
        const dia = fecha.getDate().toString().padStart(2, '0');
        
        // Contar pagos del día actual
        const count = await pago.constructor.count({
          where: {
            fecha_pago: {
              [Op.gte]: new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()),
              [Op.lt]: new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + 1)
            }
          }
        });
        
        // Generar código con formato: PAG-AÑOMESDIA-NÚMERO
        const numero = (count + 1).toString().padStart(4, '0');
        pago.codigo = `PAG-${año}${mes}${dia}-${numero}`;
      }
    }
  }
});

// Método para generar un código único para el pago
Pago.generateCodigo = async function() {
  const fecha = new Date();
  const año = fecha.getFullYear().toString().substr(-2);
  const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
  const dia = fecha.getDate().toString().padStart(2, '0');
  
  // Contar pagos del día actual
  const count = await this.count({
    where: {
      fecha_pago: {
        [Op.gte]: new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()),
        [Op.lt]: new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + 1)
      }
    }
  });
  
  // Generar código con formato: PAG-AÑOMESDIA-NÚMERO
  const numero = (count + 1).toString().padStart(4, '0');
  return `PAG-${año}${mes}${dia}-${numero}`;
};

module.exports = Pago;