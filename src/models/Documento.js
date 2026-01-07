/**
 * Modelo de Documento para la gestión de archivos y documentos
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Documento = sequelize.define('Documento', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tipo: {
    type: DataTypes.ENUM(
      'solicitud', 
      'certificado', 
      'comprobante', 
      'informe', 
      'anexo', 
      'otro'
    ),
    allowNull: false
  },
  ruta_archivo: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Nombre referencial del archivo o ruta antigua'
  },
  archivo_data: {
    type: DataTypes.BLOB('long'),
    allowNull: true,
    comment: 'Contenido binario del archivo'
  },
  mime_type: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  tamaño: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Tamaño del archivo en bytes'
  },
  es_publico: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Indica si el documento es accesible públicamente'
  },
  fecha_subida: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  fecha_expiracion: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha en que el documento deja de ser válido, si aplica'
  },
  tramite_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'tramites',
      key: 'id'
    }
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuarios',
      key: 'id'
    },
    comment: 'Usuario que subió el documento'
  }
}, {
  // Opciones del modelo
  tableName: 'documentos',
  timestamps: true,
  underscored: true,
  
  // Hooks para validaciones adicionales
  hooks: {
    beforeCreate: (documento) => {
      // Validar que exista contenido o ruta
      if ((!documento.ruta_archivo || documento.ruta_archivo.trim() === '') && !documento.archivo_data) {
        throw new Error('Debe proporcionar un archivo (contenido o ruta)');
      }
    }
  }
});

module.exports = Documento;