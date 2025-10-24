/**
 * Script de mantenimiento: Vacía la tabla `departamentos` y limpia referencias.
 * - Deshabilita claves foráneas
 * - Pone en NULL `departamento_id` en tablas que referencian
 * - Elimina relaciones en `departamento_usuario`
 * - Trunca `departamentos`
 */

require('dotenv').config();
const { sequelize } = require('../src/config/database');

async function clearDepartamentos() {
  console.log('Iniciando limpieza de tabla `departamentos`...');
  const t = await sequelize.transaction();
  try {
    // Deshabilitar claves foráneas
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0;', { transaction: t });

    // Poner en NULL referencias directas
    const tablesWithDeptFK = [
      'usuarios',
      'tramites',
      'presupuestos',
      'contratos',
      'proyectos'
    ];
    for (const table of tablesWithDeptFK) {
      const sql = `UPDATE \`${table}\` SET \`departamento_id\` = NULL`;
      await sequelize.query(sql, { transaction: t });
    }

    // Borrar relaciones many-to-many
    await sequelize.query('TRUNCATE TABLE `departamento_usuario`;', { transaction: t });

    // Truncar departamentos
    await sequelize.query('TRUNCATE TABLE `departamentos`;', { transaction: t });

    // Rehabilitar claves foráneas
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;', { transaction: t });

    await t.commit();
    console.log('✅ Tabla `departamentos` vaciada correctamente. Referencias limpiadas.');
    process.exit(0);
  } catch (error) {
    await t.rollback();
    console.error('❌ Error al vaciar `departamentos`:', error);
    process.exit(1);
  }
}

clearDepartamentos();