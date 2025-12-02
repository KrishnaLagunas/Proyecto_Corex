/**
 * Modelo de Proyecto para la gestión de proyectos municipales
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Proyecto = sequelize.define('Proyecto', {
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
    type: DataTypes.STRING(150),
    allowNull: false
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tipo: {
    type: DataTypes.ENUM(
      'infraestructura', 
      'social', 
      'ambiental', 
      'tecnologico', 
      'cultural', 
      'otro'
    ),
    allowNull: false
  },
  fecha_inicio: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  fecha_fin_estimada: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  fecha_fin_real: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  presupuesto_asignado: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  presupuesto_ejecutado: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0
  },
  estado: {
    type: DataTypes.ENUM(
      'planificacion', 
      'en_ejecucion', 
      'pausado', 
      'cancelado', 
      'finalizado'
    ),
    defaultValue: 'planificacion',
    allowNull: false
  },
  porcentaje_avance: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    }
  },
  ubicacion: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  beneficiarios: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Número estimado de beneficiarios del proyecto'
  },
  objetivos: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  resultados_esperados: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  fuente_financiamiento: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  municipalidad_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'municipalidades',
      key: 'id'
    }
  },
  responsable_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuarios',
      key: 'id'
    },
    comment: 'Usuario responsable del proyecto'
  },
  presupuesto_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'presupuestos',
      key: 'id'
    },
    comment: 'Presupuesto asociado al proyecto, si aplica'
  }
}, {
  // Opciones del modelo
  tableName: 'proyectos',
  timestamps: true,
  underscored: true,
  
  // Hooks para validaciones adicionales
  hooks: {
    beforeCreate: (proyecto) => {
      // Validar que la fecha de fin estimada sea posterior a la fecha de inicio
      if (new Date(proyecto.fecha_fin_estimada) <= new Date(proyecto.fecha_inicio)) {
        throw new Error('La fecha de fin estimada debe ser posterior a la fecha de inicio');
      }
      
      // Validar que el presupuesto ejecutado no sea mayor al presupuesto asignado
      if (parseFloat(proyecto.presupuesto_ejecutado) > parseFloat(proyecto.presupuesto_asignado)) {
        throw new Error('El presupuesto ejecutado no puede ser mayor al presupuesto asignado');
      }
    },
    beforeUpdate: (proyecto) => {
      // Validar que la fecha de fin estimada sea posterior a la fecha de inicio
      if (proyecto.changed('fecha_fin_estimada') || proyecto.changed('fecha_inicio')) {
        if (new Date(proyecto.fecha_fin_estimada) <= new Date(proyecto.fecha_inicio)) {
          throw new Error('La fecha de fin estimada debe ser posterior a la fecha de inicio');
        }
      }
      
      // Validar que el presupuesto ejecutado no sea mayor al presupuesto asignado
      if (proyecto.changed('presupuesto_ejecutado') || proyecto.changed('presupuesto_asignado')) {
        if (parseFloat(proyecto.presupuesto_ejecutado) > parseFloat(proyecto.presupuesto_asignado)) {
          throw new Error('El presupuesto ejecutado no puede ser mayor al presupuesto asignado');
        }
      }
      
      // Si el estado cambia a finalizado, establecer la fecha de fin real
      if (proyecto.changed('estado') && proyecto.estado === 'finalizado' && !proyecto.fecha_fin_real) {
        proyecto.fecha_fin_real = new Date();
      }
    }
  }
});

// Método para generar un código único para el proyecto
Proyecto.generateCodigo = async function(tipo) {
  const fecha = new Date();
  const año = fecha.getFullYear().toString().substr(-2);
  
  // Obtener el prefijo según el tipo de proyecto
  let prefijo = '';
  switch (tipo) {
    case 'infraestructura': prefijo = 'INFR'; break;
    case 'social': prefijo = 'SOC'; break;
    case 'ambiental': prefijo = 'AMB'; break;
    case 'tecnologico': prefijo = 'TEC'; break;
    case 'cultural': prefijo = 'CULT'; break;
    default: prefijo = 'PROY';
  }
  
  // Contar proyectos del mismo tipo en el año actual
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

module.exports = Proyecto;
