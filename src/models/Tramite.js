/**
 * Modelo de Trámite para la gestión de trámites municipales
 */

const { DataTypes, Op } = require('sequelize');
const { sequelize } = require('../config/database');

const Tramite = sequelize.define('Tramite', {
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
    type: DataTypes.STRING(100),
    allowNull: false
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tipo: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  estado: {
    type: DataTypes.ENUM(
      'pendiente', 
      'en_proceso', 
      'en_revision', 
      'aprobado', 
      'rechazado', 
      'finalizado'
    ),
    defaultValue: 'pendiente',
    allowNull: false
  },
  fecha_solicitud: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  fecha_actualizacion: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  fecha_finalizacion: {
    type: DataTypes.DATE,
    allowNull: true
  },
  prioridad: {
    type: DataTypes.ENUM('baja', 'media', 'alta', 'urgente'),
    defaultValue: 'media',
    allowNull: false
  },
  notas_internas: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  requiere_pago: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  monto: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0
  },
  pago_completado: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  ciudadano_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuarios',
      key: 'id'
    }
  },
  funcionario_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'usuarios',
      key: 'id'
    }
  },
  departamento_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'departamentos',
      key: 'id_departamento'
    }
  },
  municipalidad_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'municipalidades',
      key: 'id'
    }
  }
}, {
  // Opciones del modelo
  tableName: 'tramites',
  timestamps: true,
  underscored: true,
  
  // Hooks para actualizar la fecha de actualización
  hooks: {
    beforeCreate: async (tramite) => {
      // Generar código automáticamente
      tramite.codigo = await Tramite.generateCodigo(tramite.tipo);
    },
    beforeUpdate: (tramite) => {
      tramite.fecha_actualizacion = new Date();
      
      // Si el estado cambia a finalizado, establecer la fecha de finalización
      if (tramite.changed('estado') && 
          (tramite.estado === 'aprobado' || tramite.estado === 'rechazado' || tramite.estado === 'finalizado')) {
        tramite.fecha_finalizacion = new Date();
      }
    }
  }
});

  // Método para generar un código único para el trámite
  Tramite.generateCodigo = async function(tipo) {
    const fecha = new Date();
    const año = fecha.getFullYear().toString().substr(-2);
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    
    // Obtener el prefijo según el tipo de trámite
    const nombre = String(tipo || '').trim().toLowerCase();
    const tiposCert = ['certificado de construcción de obras'];
    const tiposPerm = ['permiso de circulación.', 'permiso de circulación', 'regularización de viviendas'];
    const tiposLic = ['rectificación de datos o errores en licencias.', 'rectificación de datos o errores en licencias'];
    const tiposRecl = ['denuncias por obras ilegales', 'reclamos por centro de salud', 'reclamos y revisiones de casos de convivencia escolar'];
    const tiposSol = [
      'solicitudes de becas municipales',
      'solicitud de traslado de establecimiento',
      'solicitud de cambio de consultorio',
      'solicitud de inscripción de consultorio',
      'solicitud de ayuda técnica',
      'solicitud de rondas preventivas',
      'instalación de cámaras o alarmas comunitarias',
      'charlas de seguridad'
    ];
    let prefijo = 'TRM';
    if (tiposCert.includes(nombre)) prefijo = 'CERT';
    else if (tiposPerm.includes(nombre)) prefijo = 'PERM';
    else if (tiposLic.includes(nombre)) prefijo = 'LIC';
    else if (tiposRecl.includes(nombre)) prefijo = 'REC';
    else if (tiposSol.includes(nombre)) prefijo = 'SOL';
    
    // Contar trámites del mismo tipo en el mes actual
    const nombresGrupo = [nombre];
    if (prefijo === 'CERT') nombresGrupo.push(...tiposCert);
    else if (prefijo === 'PERM') nombresGrupo.push(...tiposPerm);
    else if (prefijo === 'LIC') nombresGrupo.push(...tiposLic);
    else if (prefijo === 'REC') nombresGrupo.push(...tiposRecl);
    else if (prefijo === 'SOL') nombresGrupo.push(...tiposSol);
    const count = await this.count({
      where: {
        tipo: { [Op.in]: Array.from(new Set(nombresGrupo)) },
        fecha_solicitud: {
          [Op.gte]: new Date(fecha.getFullYear(), fecha.getMonth(), 1),
          [Op.lt]: new Date(fecha.getFullYear(), fecha.getMonth() + 1, 1)
        }
      }
    });
    
    // Generar código con formato: TIPO-AÑO-MES-NÚMERO
    const numero = (count + 1).toString().padStart(4, '0');
    return `${prefijo}-${año}${mes}-${numero}`;
  };

module.exports = Tramite;
