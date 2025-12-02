/**
 * Modelo de Contrato para la gestión de contratos con proveedores
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Contrato = sequelize.define('Contrato', {
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
  titulo: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tipo: {
    type: DataTypes.ENUM(
      'servicios', 
      'obra', 
      'suministro', 
      'consultoria', 
      'concesion', 
      'otro'
    ),
    allowNull: false
  },
  modalidad: {
    type: DataTypes.ENUM(
      'licitacion_publica', 
      'licitacion_privada', 
      'trato_directo', 
      'convenio_marco', 
      'otro'
    ),
    allowNull: false
  },
  fecha_inicio: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  fecha_termino: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  monto_total: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  moneda: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'CLP'
  },
  estado: {
    type: DataTypes.ENUM(
      'borrador', 
      'en_revision', 
      'aprobado', 
      'activo', 
      'finalizado', 
      'cancelado'
    ),
    defaultValue: 'borrador',
    allowNull: false
  },
  id_licitacion: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'ID de la licitación en Mercado Público, si aplica'
  },
  tiene_garantia: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  monto_garantia: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true
  },
  fecha_garantia: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: 'Fecha de vencimiento de la garantía'
  },
  condiciones_pago: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  proveedor_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'proveedores',
      key: 'id'
    }
  },
  municipalidad_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'municipalidades',
      key: 'id'
    }
  },
  proyecto_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'proyectos',
      key: 'id'
    },
    comment: 'Proyecto asociado al contrato, si aplica'
  },
  responsable_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuarios',
      key: 'id'
    },
    comment: 'Usuario responsable del contrato'
  },
  documento_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'documentos',
      key: 'id'
    },
    comment: 'Documento del contrato firmado'
  }
}, {
  // Opciones del modelo
  tableName: 'contratos',
  timestamps: true,
  underscored: true,
  
  // Hooks para validaciones adicionales
  hooks: {
    beforeCreate: (contrato) => {
      // Validar que la fecha de término sea posterior a la fecha de inicio
      if (new Date(contrato.fecha_termino) <= new Date(contrato.fecha_inicio)) {
        throw new Error('La fecha de término debe ser posterior a la fecha de inicio');
      }
    },
    beforeUpdate: (contrato) => {
      // Validar que la fecha de término sea posterior a la fecha de inicio
      if (contrato.changed('fecha_termino') || contrato.changed('fecha_inicio')) {
        if (new Date(contrato.fecha_termino) <= new Date(contrato.fecha_inicio)) {
          throw new Error('La fecha de término debe ser posterior a la fecha de inicio');
        }
      }
    }
  }
});

// Método para generar un código único para el contrato
Contrato.generateCodigo = async function(tipo) {
  const fecha = new Date();
  const año = fecha.getFullYear().toString().substr(-2);
  
  // Obtener el prefijo según el tipo de contrato
  let prefijo = '';
  switch (tipo) {
    case 'servicios': prefijo = 'SERV'; break;
    case 'obra': prefijo = 'OBRA'; break;
    case 'suministro': prefijo = 'SUM'; break;
    case 'consultoria': prefijo = 'CONS'; break;
    case 'concesion': prefijo = 'CONC'; break;
    default: prefijo = 'CONT';
  }
  
  // Contar contratos del mismo tipo en el año actual
  const count = await this.count({
    where: {
      tipo,
      fecha_inicio: {
        [sequelize.Op.gte]: new Date(fecha.getFullYear(), 0, 1),
        [sequelize.Op.lt]: new Date(fecha.getFullYear() + 1, 0, 1)
      }
    }
  });
  
  // Generar código con formato: TIPO-AÑO-NÚMERO
  const numero = (count + 1).toString().padStart(3, '0');
  return `${prefijo}-${año}-${numero}`;
};

module.exports = Contrato;
