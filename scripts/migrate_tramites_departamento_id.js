/**
 * Migración: asignar departamento_id a trámites existentes según su tipo
 * Reglas de mapeo por defecto:
 *  - 'permiso'  -> Departamento que contiene 'obras'
 *  - 'licencia' -> Departamento que contiene 'tránsito'
 *  - 'certificado' -> Departamento que contiene 'administración'
 *  - 'reclamo'  -> Departamento que contiene 'desarrollo comunitario'
 *  - 'solicitud'-> Departamento que contiene 'desarrollo comunitario'
 * Fallbacks: si no hay coincidencia, usa 'Administración' o el primer departamento.
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');
const logger = require('../src/utils/logger');

async function run() {
  const dbName = process.env.DB_NAME;
  const dbUser = process.env.DB_USER;
  const dbPassword = process.env.DB_PASS;
  const dbHost = process.env.DB_HOST;

  const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
    host: dbHost,
    dialect: 'mysql',
    logging: msg => logger.debug(msg)
  });

  try {
    await sequelize.authenticate();
    logger.info('Conectado para migrar departamento_id de trámites...');

    // Cargar departamentos
    const [deps] = await sequelize.query(
      `SELECT id_departamento AS id, nombre_departamento AS nombre
       FROM departamentos`
    );
    if (!deps || deps.length === 0) {
      throw new Error('No hay departamentos en la base de datos');
    }
    const depsNorm = deps.map(d => ({ id: d.id, nombre: d.nombre, norm: (d.nombre || '').toLowerCase() }));
    const findByKeyword = (kw) => depsNorm.find(d => d.norm.includes(kw));

    const depObras = findByKeyword('obras') || findByKeyword('dom');
    const depTransito = findByKeyword('tránsito') || findByKeyword('transito');
    const depAdmin = findByKeyword('administración') || findByKeyword('administracion');
    const depDideco = findByKeyword('desarrollo comunitario') || findByKeyword('dideco');
    const fallback = depAdmin || depsNorm[0];

    // Cargar trámites sin departamento
    const [tramites] = await sequelize.query(
      `SELECT id, tipo FROM tramites WHERE departamento_id IS NULL`
    );

    let updated = 0;
    for (const t of tramites) {
      const tipo = (t.tipo || '').toLowerCase();
      let target = null;
      if (tipo === 'permiso') target = depObras || fallback;
      else if (tipo === 'licencia') target = depTransito || fallback;
      else if (tipo === 'certificado') target = depAdmin || fallback;
      else if (tipo === 'reclamo') target = depDideco || fallback;
      else if (tipo === 'solicitud') target = depDideco || fallback;
      else target = fallback;

      if (target && target.id) {
        await sequelize.query(
          `UPDATE tramites SET departamento_id = :depId WHERE id = :id`,
          { replacements: { depId: target.id, id: t.id } }
        );
        updated++;
      }
    }

    logger.info(`Migración completada. Trámites actualizados: ${updated}`);
    await sequelize.close();
    logger.info('Conexión cerrada.');
  } catch (err) {
    logger.error('Error en migración de departamento_id:', err);
    process.exit(1);
  }
}

run().then(() => {
  logger.info('Proceso de migración finalizado.');
  process.exit(0);
}).catch(err => {
  logger.error('Fallo inesperado en migración:', err);
  process.exit(1);
});

