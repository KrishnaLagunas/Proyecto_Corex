/**
 * Script para generar datos de prueba para el ERP Municipal
 * Este script utiliza Sequelize para insertar datos en la base de datos
 */

const bcrypt = require('bcryptjs');
const { sequelize } = require('../src/config/database');
const { 
  Usuario, 
  Departamento, 
  Tramite, 
  Documento, 
  Pago, 
  Presupuesto, 
  Proveedor, 
  Proyecto, 
  Contrato,
  ConfiguracionPago
} = require('../src/models');

// Función para hashear contraseñas
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Función principal para sembrar datos
async function seedData() {
  try {
    console.log('Iniciando la carga de datos de prueba...');
    
    // Sincronizar modelos con la base de datos (sin forzar)
    await sequelize.sync({ force: false });

    // Sembrar configuraciones de pago (independiente del resto de datos)
    try {
      const currentYear = new Date().getFullYear();
      const configPagoCount = await ConfiguracionPago.count();
      if (configPagoCount === 0) {
        await ConfiguracionPago.bulkCreate([
          { tramite_nombre: 'certificado', anio: currentYear, modalidad: 'fijo', monto_fijo: 2500, categoria: 'Certificados', estado: 'activo' },
          { tramite_nombre: 'licencia', anio: currentYear, modalidad: 'fijo', monto_fijo: 35000, categoria: 'Licencias', estado: 'activo' },
          { tramite_nombre: 'permiso', anio: currentYear, modalidad: 'porcentaje', porcentaje: 3.5, categoria: 'Obra Nueva/Ampliación', estado: 'activo' },
          { tramite_nombre: 'permiso', anio: currentYear, modalidad: 'porcentaje', porcentaje: 2.0, categoria: 'Obra Menor', estado: 'activo' },
          { tramite_nombre: 'permiso', anio: currentYear, modalidad: 'porcentaje', porcentaje: 1.5, categoria: 'Modificación de Proyecto', estado: 'activo' },
          { tramite_nombre: 'permiso', anio: currentYear, modalidad: 'porcentaje', porcentaje: 1.0, categoria: 'Demoliciones', estado: 'activo' }
        ], { ignoreDuplicates: true });
        console.log('Configuraciones de pago sembradas.');
      } else {
        console.log('Configuraciones de pago ya existen, omitiendo siembra.');
      }
    } catch (cfgErr) {
      console.warn('Advertencia al sembrar ConfiguracionPago:', cfgErr.message);
    }
    
    // Verificar si ya existen datos para evitar duplicados
    const usuariosCount = await Usuario.count();
    if (usuariosCount > 1) {
      console.log('Ya existen datos en la base de datos. Omitiendo la carga de datos de prueba.');
      return;
    }
    
    // Crear departamentos
    const departamentos = await Departamento.bulkCreate([
      {
        nombre: 'Administración',
        descripcion: 'Departamento de administración general',
        codigo: 'ADMIN-001',
        email_contacto: 'admin@municipalidad.cl',
        telefono_contacto: '123456789',
        estado: 'activo'
      },
      {
        nombre: 'Obras Municipales',
        descripcion: 'Dirección de obras municipales',
        codigo: 'DOM-001',
        email_contacto: 'obras@municipalidad.cl',
        telefono_contacto: '123456790',
        estado: 'activo'
      },
      {
        nombre: 'Tránsito',
        descripcion: 'Departamento de tránsito',
        codigo: 'TRANS-001',
        email_contacto: 'transito@municipalidad.cl',
        telefono_contacto: '123456791',
        estado: 'activo'
      },
      {
        nombre: 'Finanzas',
        descripcion: 'Departamento de finanzas',
        codigo: 'FIN-001',
        email_contacto: 'finanzas@municipalidad.cl',
        telefono_contacto: '123456792',
        estado: 'activo'
      },
      {
        nombre: 'Desarrollo Comunitario',
        descripcion: 'Dirección de desarrollo comunitario',
        codigo: 'DIDECO-001',
        email_contacto: 'dideco@municipalidad.cl',
        telefono_contacto: '123456793',
        estado: 'activo'
      }
    ], { ignoreDuplicates: true });
    
    // Sembrar configuraciones de pago
    const currentYear = new Date().getFullYear();
    await ConfiguracionPago.bulkCreate([
      { tramite_nombre: 'certificado', anio: currentYear, modalidad: 'fijo', monto_fijo: 2500, categoria: 'Certificados', estado: 'activo' },
      { tramite_nombre: 'licencia', anio: currentYear, modalidad: 'fijo', monto_fijo: 35000, categoria: 'Licencias', estado: 'activo' },
      { tramite_nombre: 'permiso', anio: currentYear, modalidad: 'porcentaje', porcentaje: 3.5, categoria: 'Obra Nueva/Ampliación', estado: 'activo' },
      { tramite_nombre: 'permiso', anio: currentYear, modalidad: 'porcentaje', porcentaje: 2.0, categoria: 'Obra Menor', estado: 'activo' },
      { tramite_nombre: 'permiso', anio: currentYear, modalidad: 'porcentaje', porcentaje: 1.5, categoria: 'Modificación de Proyecto', estado: 'activo' },
      { tramite_nombre: 'permiso', anio: currentYear, modalidad: 'porcentaje', porcentaje: 1.0, categoria: 'Demoliciones', estado: 'activo' }
    ], { ignoreDuplicates: true });
    
    // Crear usuarios
    const adminPassword = await hashPassword('admin123');
    const funcionarioPassword = await hashPassword('funcionario123');
    const ciudadanoPassword = await hashPassword('ciudadano123');
    
    const usuarios = await Usuario.bulkCreate([
      {
        nombre: 'Admin',
        apellido: 'Sistema',
        email: 'admin@municipalidad.cl',
        password: adminPassword,
        role: 'admin',
        rut: '11111111-1',
        telefono: '912345678',
        direccion: 'Calle Administración 123',
        estado: 'activo'
      },
      {
        nombre: 'Juan',
        apellido: 'Pérez',
        email: 'juan.perez@municipalidad.cl',
        password: funcionarioPassword,
        role: 'funcionario',
        rut: '12345678-9',
        telefono: '987654321',
        direccion: 'Calle Funcionario 456',
        departamento_id: departamentos[0].id,
        estado: 'activo'
      },
      {
        nombre: 'María',
        apellido: 'González',
        email: 'maria.gonzalez@municipalidad.cl',
        password: funcionarioPassword,
        role: 'funcionario',
        rut: '98765432-1',
        telefono: '912345678',
        direccion: 'Calle Funcionario 789',
        departamento_id: departamentos[1].id,
        estado: 'activo'
      },
      {
        nombre: 'Pedro',
        apellido: 'Soto',
        email: 'pedro.soto@gmail.com',
        password: ciudadanoPassword,
        role: 'ciudadano',
        rut: '11222333-4',
        telefono: '923456789',
        direccion: 'Calle Ciudadano 123',
        estado: 'activo'
      },
      {
        nombre: 'Ana',
        apellido: 'Muñoz',
        email: 'ana.munoz@gmail.com',
        password: ciudadanoPassword,
        role: 'ciudadano',
        rut: '22333444-5',
        telefono: '934567890',
        direccion: 'Calle Ciudadano 456',
        estado: 'activo'
      }
    ], { ignoreDuplicates: true });
    
    // Actualizar responsables de departamentos
    await Departamento.update(
      { responsable_id: usuarios[1].id },
      { where: { id: departamentos[0].id } }
    );
    
    await Departamento.update(
      { responsable_id: usuarios[2].id },
      { where: { id: departamentos[1].id } }
    );
    
    // Crear proveedores
    const proveedores = await Proveedor.bulkCreate([
      {
        codigo: 'PROV-001',
        razon_social: 'Constructora Los Andes S.A.',
        nombre_comercial: 'Constructora Los Andes',
        rut: '76123456-7',
        direccion: 'Av. Principal 1234',
        ciudad: 'Santiago',
        region: 'Metropolitana',
        telefono: '228765432',
        email: 'contacto@constructoralosandes.cl',
        sitio_web: 'www.constructoralosandes.cl',
        representante_legal: 'Roberto Gómez',
        rut_representante: '10987654-3',
        giro: 'Construcción',
        categoria: 'construccion',
        estado: 'activo',
        registrado_por: usuarios[0].id
      },
      {
        codigo: 'PROV-002',
        razon_social: 'Tecnología Municipal Ltda.',
        nombre_comercial: 'TecMuni',
        rut: '77234567-8',
        direccion: 'Calle Tecnología 567',
        ciudad: 'Santiago',
        region: 'Metropolitana',
        telefono: '227654321',
        email: 'contacto@tecmuni.cl',
        sitio_web: 'www.tecmuni.cl',
        representante_legal: 'Carolina Vega',
        rut_representante: '12345678-5',
        giro: 'Servicios Informáticos',
        categoria: 'tecnologia',
        estado: 'activo',
        registrado_por: usuarios[0].id
      },
      {
        codigo: 'PROV-003',
        razon_social: 'Suministros Municipales S.A.',
        nombre_comercial: 'SumiMuni',
        rut: '78345678-9',
        direccion: 'Av. Suministros 890',
        ciudad: 'Santiago',
        region: 'Metropolitana',
        telefono: '226543210',
        email: 'contacto@sumimuni.cl',
        sitio_web: 'www.sumimuni.cl',
        representante_legal: 'Jorge Pérez',
        rut_representante: '9876543-2',
        giro: 'Venta de Suministros',
        categoria: 'suministros',
        estado: 'activo',
        registrado_por: usuarios[0].id
      }
    ], { ignoreDuplicates: true });
    
    // Crear presupuestos
    const presupuestos = await Presupuesto.bulkCreate([
      {
        codigo: 'PRES-2023-001',
        nombre: 'Presupuesto Anual Obras 2023',
        descripcion: 'Presupuesto anual para el departamento de obras municipales',
        año_fiscal: 2023,
        monto_total: 500000000,
        monto_ejecutado: 250000000,
        fecha_inicio: '2023-01-01',
        fecha_fin: '2023-12-31',
        estado: 'en_ejecucion',
        departamento_id: departamentos[1].id,
        responsable_id: usuarios[2].id
      },
      {
        codigo: 'PRES-2023-002',
        nombre: 'Presupuesto Anual Desarrollo Comunitario 2023',
        descripcion: 'Presupuesto anual para el departamento de desarrollo comunitario',
        año_fiscal: 2023,
        monto_total: 300000000,
        monto_ejecutado: 150000000,
        fecha_inicio: '2023-01-01',
        fecha_fin: '2023-12-31',
        estado: 'en_ejecucion',
        departamento_id: departamentos[4].id,
        responsable_id: usuarios[1].id
      },
      {
        codigo: 'PRES-2023-003',
        nombre: 'Presupuesto Anual Administración 2023',
        descripcion: 'Presupuesto anual para el departamento de administración',
        año_fiscal: 2023,
        monto_total: 200000000,
        monto_ejecutado: 100000000,
        fecha_inicio: '2023-01-01',
        fecha_fin: '2023-12-31',
        estado: 'en_ejecucion',
        departamento_id: departamentos[0].id,
        responsable_id: usuarios[1].id
      }
    ], { ignoreDuplicates: true });
    
    // Crear proyectos
    const proyectos = await Proyecto.bulkCreate([
      {
        codigo: 'PROY-2023-001',
        nombre: 'Mejoramiento Plaza Central',
        descripcion: 'Proyecto de mejoramiento de la plaza central de la comuna',
        tipo: 'infraestructura',
        fecha_inicio: '2023-03-01',
        fecha_fin_estimada: '2023-08-31',
        presupuesto_asignado: 150000000,
        presupuesto_ejecutado: 75000000,
        estado: 'en_ejecucion',
        porcentaje_avance: 50,
        ubicacion: 'Plaza Central, Comuna',
        beneficiarios: 5000,
        objetivos: 'Mejorar el espacio público central de la comuna',
        departamento_id: departamentos[1].id,
        responsable_id: usuarios[2].id,
        presupuesto_id: presupuestos[0].id
      },
      {
        codigo: 'PROY-2023-002',
        nombre: 'Implementación Sistema Informático Municipal',
        descripcion: 'Proyecto de implementación de un nuevo sistema informático para la municipalidad',
        tipo: 'tecnologico',
        fecha_inicio: '2023-02-01',
        fecha_fin_estimada: '2023-07-31',
        presupuesto_asignado: 100000000,
        presupuesto_ejecutado: 60000000,
        estado: 'en_ejecucion',
        porcentaje_avance: 60,
        departamento_id: departamentos[0].id,
        responsable_id: usuarios[1].id,
        presupuesto_id: presupuestos[2].id
      },
      {
        codigo: 'PROY-2023-003',
        nombre: 'Programa de Apoyo al Adulto Mayor',
        descripcion: 'Programa social de apoyo al adulto mayor de la comuna',
        tipo: 'social',
        fecha_inicio: '2023-01-15',
        fecha_fin_estimada: '2023-12-15',
        presupuesto_asignado: 80000000,
        presupuesto_ejecutado: 40000000,
        estado: 'en_ejecucion',
        porcentaje_avance: 50,
        beneficiarios: 1000,
        objetivos: 'Mejorar la calidad de vida de los adultos mayores de la comuna',
        departamento_id: departamentos[4].id,
        responsable_id: usuarios[1].id,
        presupuesto_id: presupuestos[1].id
      }
    ], { ignoreDuplicates: true });
    
    // Crear contratos
    const contratos = await Contrato.bulkCreate([
      {
        codigo: 'CONT-2023-001',
        titulo: 'Contrato Mejoramiento Plaza Central',
        descripcion: 'Contrato para el mejoramiento de la plaza central de la comuna',
        tipo: 'obra',
        modalidad: 'licitacion_publica',
        fecha_inicio: '2023-03-01',
        fecha_termino: '2023-08-31',
        monto_total: 150000000,
        estado: 'activo',
        id_licitacion: 'LIC-2023-001',
        tiene_garantia: true,
        monto_garantia: 15000000,
        fecha_garantia: '2023-09-30',
        condiciones_pago: 'Pago contra avance de obra',
        proveedor_id: proveedores[0].id,
        departamento_id: departamentos[1].id,
        proyecto_id: proyectos[0].id,
        responsable_id: usuarios[2].id
      },
      {
        codigo: 'CONT-2023-002',
        titulo: 'Contrato Implementación Sistema Informático',
        descripcion: 'Contrato para la implementación de un nuevo sistema informático para la municipalidad',
        tipo: 'servicios',
        modalidad: 'licitacion_privada',
        fecha_inicio: '2023-02-01',
        fecha_termino: '2023-07-31',
        monto_total: 100000000,
        estado: 'activo',
        id_licitacion: 'LIC-2023-002',
        tiene_garantia: true,
        monto_garantia: 10000000,
        fecha_garantia: '2023-08-31',
        condiciones_pago: 'Pago por hitos de implementación',
        proveedor_id: proveedores[1].id,
        departamento_id: departamentos[0].id,
        proyecto_id: proyectos[1].id,
        responsable_id: usuarios[1].id
      },
      {
        codigo: 'CONT-2023-003',
        titulo: 'Contrato Suministro Materiales Oficina',
        descripcion: 'Contrato para el suministro de materiales de oficina para la municipalidad',
        tipo: 'suministro',
        modalidad: 'convenio_marco',
        fecha_inicio: '2023-01-01',
        fecha_termino: '2023-12-31',
        monto_total: 20000000,
        estado: 'activo',
        tiene_garantia: false,
        condiciones_pago: 'Pago mensual contra factura',
        proveedor_id: proveedores[2].id,
        departamento_id: departamentos[0].id,
        responsable_id: usuarios[1].id
      }
    ], { ignoreDuplicates: true });
    
    // Crear trámites
    const tramites = await Tramite.bulkCreate([
      {
        codigo: 'TRAM-2023-001',
        titulo: 'Solicitud Permiso de Edificación',
        descripcion: 'Solicitud de permiso para edificación de vivienda unifamiliar',
        tipo: 'permiso',
        estado: 'en_proceso',
        fecha_solicitud: new Date(),
        prioridad: 'media',
        requiere_pago: true,
        monto: 50000,
        ciudadano_id: usuarios[3].id,
        funcionario_id: usuarios[2].id,
        departamento_id: departamentos[1].id
      },
      {
        codigo: 'TRAM-2023-002',
        titulo: 'Solicitud Certificado de Residencia',
        descripcion: 'Solicitud de certificado de residencia para trámites personales',
        tipo: 'certificado',
        estado: 'pendiente',
        fecha_solicitud: new Date(),
        prioridad: 'baja',
        requiere_pago: true,
        monto: 5000,
        ciudadano_id: usuarios[4].id,
        departamento_id: departamentos[0].id
      },
      {
        codigo: 'TRAM-2023-003',
        titulo: 'Reclamo por Luminaria Pública',
        descripcion: 'Reclamo por luminaria pública sin funcionamiento en calle Los Olmos',
        tipo: 'reclamo',
        estado: 'en_proceso',
        fecha_solicitud: new Date(),
        prioridad: 'alta',
        requiere_pago: false,
        ciudadano_id: usuarios[3].id,
        funcionario_id: usuarios[1].id,
        departamento_id: departamentos[1].id
      }
    ], { ignoreDuplicates: true });
    
    // Crear documentos (para poblar la tabla documentos)
    const documentos = await Documento.bulkCreate([
      {
        nombre: 'Solicitud Permiso Edificación',
        descripcion: 'Formulario de solicitud firmado por el ciudadano',
        tipo: 'solicitud',
        ruta_archivo: '/uploads/documentos/solicitud_permiso_edificacion.pdf',
        mime_type: 'application/pdf',
        tamaño: 234567,
        es_publico: false,
        tramite_id: tramites[0].id,
        usuario_id: usuarios[3].id
      },
      {
        nombre: 'Comprobante de Pago Permiso',
        descripcion: 'Comprobante de transferencia por permiso de edificación',
        tipo: 'comprobante',
        ruta_archivo: '/uploads/documentos/comprobante_pago_permiso.pdf',
        mime_type: 'application/pdf',
        tamaño: 145672,
        es_publico: false,
        tramite_id: tramites[0].id,
        usuario_id: usuarios[2].id
      },
      {
        nombre: 'Certificado de Residencia',
        descripcion: 'Documento emitido por municipalidad',
        tipo: 'certificado',
        ruta_archivo: '/uploads/documentos/certificado_residencia.pdf',
        mime_type: 'application/pdf',
        tamaño: 125003,
        es_publico: true,
        tramite_id: tramites[1].id,
        usuario_id: usuarios[4].id
      }
    ], { ignoreDuplicates: true });

    // Crear pagos
    const pagos = await Pago.bulkCreate([
      {
        codigo: 'PAGO-2023-001',
        monto: 50000,
        fecha_pago: new Date(),
        metodo_pago: 'transferencia',
        estado: 'completado',
        referencia_externa: 'TRANS123456',
        notas: 'Pago por permiso de edificación',
        tramite_id: tramites[0].id,
        ciudadano_id: usuarios[3].id,
        funcionario_id: usuarios[2].id
      },
      {
        codigo: 'PAGO-2023-002',
        monto: 5000,
        fecha_pago: new Date(),
        metodo_pago: 'efectivo',
        estado: 'pendiente',
        notas: 'Pago pendiente por certificado de residencia',
        tramite_id: tramites[1].id,
        ciudadano_id: usuarios[4].id
      }
    ], { ignoreDuplicates: true });
    
    console.log('Datos de prueba cargados exitosamente.');
  } catch (error) {
    console.error('Error al cargar datos de prueba:', error);
  } finally {
    // Cerrar la conexión
    await sequelize.close();
  }
}

// Ejecutar la función de sembrado
seedData();