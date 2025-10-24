/**
 * Script para poblar tablas regiones y comunas usando la API DPA (Gobierno Digital).
 * Tablas: regiones (codigo, nombre), comunas (codigo, nombre, region_id)
 */
require('dotenv').config();
const { Sequelize } = require('sequelize');
const https = require('https');
const logger = require('../src/utils/logger');
// Evitar fallo por certificados en entorno local
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) {
          reject(new Error(`Error parseando JSON de ${url}: ${e.message}`));
        }
      });
    }).on('error', err => reject(err));
  });
}

async function seedRegionesComunas() {
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
    logger.info('Conexión DB OK para seed regiones/comunas');

    const regionesUrl = 'https://apis.digital.gob.cl/dpa/regiones';
    logger.info(`Obteniendo regiones desde ${regionesUrl}`);
    const regiones = await fetchJson(regionesUrl);

    // Insertar regiones: evitar duplicados por codigo
    for (const region of regiones) {
      const codigo = region.codigo;
      const nombre = region.nombre;
      const [exists] = await sequelize.query(
        'SELECT id FROM regiones WHERE codigo = :codigo',
        { replacements: { codigo } }
      );
      if (exists.length === 0) {
        await sequelize.query(
          'INSERT INTO regiones (codigo, nombre) VALUES (:codigo, :nombre)',
          { replacements: { codigo, nombre } }
        );
        logger.info(`Insertada región: ${codigo} - ${nombre}`);
      } else {
        logger.debug(`Región ya existe: ${codigo}`);
      }
    }

    // Obtener mapa codigo->id
    const [regRows] = await sequelize.query('SELECT id, codigo FROM regiones');
    const regionIdByCodigo = new Map(regRows.map(r => [r.codigo, r.id]));

    // Insertar comunas por región
    for (const region of regiones) {
      const regionCodigo = region.codigo;
      const comunasUrl = `https://apis.digital.gob.cl/dpa/regiones/${regionCodigo}/comunas`;
      logger.info(`Obteniendo comunas de región ${regionCodigo}`);
      const comunas = await fetchJson(comunasUrl);
      const regionId = regionIdByCodigo.get(regionCodigo);
      for (const comuna of comunas) {
        const cCodigo = comuna.codigo;
        const cNombre = comuna.nombre;
        const [exists] = await sequelize.query(
          'SELECT id FROM comunas WHERE codigo = :codigo',
          { replacements: { codigo: cCodigo } }
        );
        if (exists.length === 0) {
          await sequelize.query(
            'INSERT INTO comunas (codigo, nombre, region_id) VALUES (:codigo, :nombre, :region_id)',
            { replacements: { codigo: cCodigo, nombre: cNombre, region_id: regionId } }
          );
        }
      }
      logger.info(`Comunas insertadas/actualizadas para región ${regionCodigo}`);
    }

    await sequelize.close();
    logger.info('Seed regiones/comunas completado.');
    return true;
  } catch (err) {
    logger.error(`Error en seed regiones/comunas: ${err.message}`);
    logger.error(err.stack);
    process.exit(1);
  }
}

seedRegionesComunas()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));