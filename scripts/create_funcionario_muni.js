/**
 * Script para crear un departamento "Municipalidad" (si no existe)
 * y un usuario con rol "funcionario" asignado a ese departamento.
 */
require('dotenv').config();
const { sequelize, testConnection } = require('../src/config/database');
const { Departamento, Usuario } = require('../src/models');
const { cleanName } = require('../src/utils/text.utils');

(async () => {
  try {
    const ok = await testConnection();
    if (!ok) {
      console.error('❌ No se pudo conectar a la base de datos.');
      process.exit(1);
    }

    // 1) Obtener o crear departamento "Municipalidad"
    const nombreDepto = 'Municipalidad';
    let depto = await Departamento.findOne({ where: { nombre: nombreDepto } });
    if (!depto) {
      console.log('ℹ️ Departamento "Municipalidad" no existe. Creando...');
      depto = await Departamento.create({
        nombre: nombreDepto,
        rut: '87654321-4',
        telefono: '222-123456',
        email: 'contacto@municipalidad.cl',
        region: 'Región Metropolitana',
        comuna: 'Santiago',
        estado: 'activo'
      });
      console.log(`✅ Departamento creado: id=${depto.id}, nombre=${depto.nombre}`);
    } else {
      console.log(`✅ Departamento existente: id=${depto.id}, nombre=${depto.nombre}`);
    }

    // 2) Crear usuario funcionario asignado a "Municipalidad"
    const primer_nombre = 'Carlos';
    const segundo_nombre = '';
    const primer_apellido = 'Pérez';
    const segundo_apellido = '';
    const email = 'carlos.perez@municipalidad.cl';
    const rut = '23456789-6';
    const telefono = '912345678';
    const direccion = 'Av. Municipalidad 123, Santiago';
    const role = 'funcionario';

    // Evitar duplicados por email o rut
    const existeEmail = await Usuario.findOne({ where: { email } });
    if (existeEmail) {
      console.log('⚠️ Ya existe un usuario con ese email. Saliendo.');
      process.exit(0);
    }
    const existeRut = await Usuario.findOne({ where: { rut } });
    if (existeRut) {
      console.log('⚠️ Ya existe un usuario con ese RUT. Saliendo.');
      process.exit(0);
    }

    const nombreCompuesto = cleanName([primer_nombre, segundo_nombre].filter(Boolean).join(' '));
    const apellidoCompuesto = cleanName([primer_apellido, segundo_apellido].filter(Boolean).join(' '));

    const passwordPlano = 'Funci0n@Municipalidad';

    const nuevo = await Usuario.create({
      nombre: nombreCompuesto,
      apellido: apellidoCompuesto,
      primer_nombre,
      segundo_nombre,
      primer_apellido,
      segundo_apellido,
      email,
      password: passwordPlano, // Se hashea en hook beforeCreate
      rut,
      telefono,
      direccion,
      role,
      departamento_id: depto.id,
      estado: 'activo'
    });

    console.log(`✅ Usuario creado: id=${nuevo.id}, email=${nuevo.email}, role=${nuevo.role}, departamento_id=${nuevo.departamento_id}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creando funcionario/municipalidad:', err);
    process.exit(1);
  } finally {
    try { await sequelize.close(); } catch {}
  }
})();