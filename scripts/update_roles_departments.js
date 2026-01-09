const { Rol, Departamento } = require('../src/models');
const { Op } = require('sequelize');

async function updateRolesAndDepartments() {
  try {
    console.log('Iniciando actualización de roles y departamentos...');

    // 1. Actualizar Roles
    // Mapping: Old Name -> New Name
    const roleUpdates = [
      { old: 'secretaria comunitaria', new: 'secretaria de educación' },
      { old: 'tesoreria municipal', new: 'secretaria de salud' },
      { old: 'secretaria partes', new: 'secretaria de seguridad' }
    ];

    for (const update of roleUpdates) {
      const rol = await Rol.findOne({ where: { nombre: update.old } });
      if (rol) {
        rol.nombre = update.new;
        await rol.save();
        console.log(`Rol actualizado: "${update.old}" -> "${update.new}"`);
      } else {
        console.log(`Rol "${update.old}" no encontrado. Verificando si ya existe "${update.new}"...`);
        const existingNew = await Rol.findOne({ where: { nombre: update.new } });
        if (!existingNew) {
            // Si no existe el viejo ni el nuevo, crearlo? Mejor no, solo actualizar si existe.
            // O quizás crear si falta. Pero el usuario dijo "eliminar esos 3 y poner...".
            // Si ya se corrió el script, no estarán.
            console.log(`No se encontró "${update.old}" ni "${update.new}". Creando "${update.new}"...`);
            await Rol.create({ nombre: update.new });
        } else {
            console.log(`Rol "${update.new}" ya existe.`);
        }
      }
    }

    // 2. Actualizar Departamentos
    // "Departamento de Seguridad Publica" (actualmente "Dirección de Seguridad Publica")
    const seguridad = await Departamento.findOne({ 
        where: { 
            nombre: { [Op.like]: '%Seguridad%' } 
        } 
    });
    
    if (seguridad) {
        // Asegurar que se llame "Departamento de Seguridad Pública"
        // El usuario pidió "departamento de seguridad publica"
        const newName = 'Departamento de Seguridad Pública';
        if (seguridad.nombre !== newName) {
            console.log(`Departamento actualizado: "${seguridad.nombre}" -> "${newName}"`);
            seguridad.nombre = newName;
            await seguridad.save();
        } else {
            console.log(`Departamento de Seguridad ya tiene el nombre correcto.`);
        }
    } else {
        console.log('Departamento de Seguridad no encontrado. Creándolo...');
        await Departamento.create({ 
            nombre: 'Departamento de Seguridad Pública',
            email: 'seguridad@municipalidad.cl',
            telefono: '1403',
            estado: 'activo'
        });
    }

    // Verificar Educación y Salud
    const educacion = await Departamento.findOne({ where: { nombre: 'Departamento de Educación' } });
    if (!educacion) {
        console.log('Creando Departamento de Educación...');
        await Departamento.create({
            nombre: 'Departamento de Educación',
            email: 'educacion@municipalidad.cl',
            telefono: '600 123 4567',
            estado: 'activo'
        });
    }

    const salud = await Departamento.findOne({ where: { nombre: 'Departamento de Salud' } });
    if (!salud) {
        console.log('Creando Departamento de Salud...');
        await Departamento.create({
            nombre: 'Departamento de Salud',
            email: 'salud@municipalidad.cl',
            telefono: '600 123 8888',
            estado: 'activo'
        });
    }

    console.log('Actualización de base de datos completada.');

  } catch (error) {
    console.error('Error durante la actualización:', error);
  }
}

updateRolesAndDepartments();
