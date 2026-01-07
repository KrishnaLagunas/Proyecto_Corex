const { sequelize } = require('../src/config/database');

async function run() {
  try {
    console.log('Iniciando corrección de tabla documentos...');
    await sequelize.authenticate();
    console.log('Conectado a la BD.');

    // 1. Agregar columna archivo_data (LONGBLOB)
    try {
        // MySQL: LONGBLOB para archivos grandes (hasta 4GB)
        await sequelize.query("ALTER TABLE documentos ADD COLUMN archivo_data LONGBLOB NULL COMMENT 'Contenido binario del archivo'");
        console.log('Columna archivo_data agregada exitosamente.');
    } catch (e) {
        if (e.original && e.original.code === 'ER_DUP_FIELDNAME') {
            console.log('La columna archivo_data ya existe.');
        } else {
            console.error('Error al agregar columna archivo_data:', e);
            // No lanzamos error fatal, quizás ya existe con otro error
        }
    }
    
    // 2. Hacer ruta_archivo opcional (NULLABLE)
    try {
        await sequelize.query("ALTER TABLE documentos MODIFY COLUMN ruta_archivo VARCHAR(255) NULL");
        console.log('Columna ruta_archivo modificada a NULLABLE.');
    } catch (e) {
         console.error('Error al modificar ruta_archivo:', e);
    }

    console.log('Corrección completada exitosamente.');
    process.exit(0);
  } catch (error) {
    console.error('Error fatal durante la corrección:', error);
    process.exit(1);
  }
}

run();