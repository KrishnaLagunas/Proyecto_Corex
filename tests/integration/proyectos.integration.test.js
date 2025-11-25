/**
 * Pruebas de integración para el controlador de proyectos municipales
 */

const request = require('supertest');
const app = require('../../src/app');
const { sequelize } = require('../../src/config/database');
const { Usuario, Departamento, Proyecto, Presupuesto, Proveedor, Contrato } = require('../../src/models');
const bcrypt = require('bcryptjs');

describe('Proyectos Municipales Integration Tests', () => {
  let adminToken;
  let usuarioToken;
  let ciudadanoToken;
  let adminUser;
  let regularUser;
  let ciudadanoUser;
  let departamento;
  let presupuesto;
  let proveedor;
  let contrato;
  let proyectoCreado;
  
  beforeAll(async () => {
    // Configurar la base de datos de prueba
    await sequelize.sync({ force: true });
    
    // Crear un departamento de prueba
    departamento = await Departamento.create({
      nombre: 'Obras Públicas',
      descripcion: 'Departamento encargado de proyectos y obras municipales'
    });
    
    // Crear usuarios de prueba
    const salt = await bcrypt.genSalt(10);
    
    // Usuario superadministrador
    const adminPassword = await bcrypt.hash('admin123', salt);
    adminUser = await Usuario.create({
      nombre: 'Superadmin',
      apellido: 'Proyectos',
      email: 'admin.proyectos@example.com',
      password: adminPassword,
      role: 'superadmin',
      departamento_id: departamento.id,
      estado: 'activo'
    });
    
    // Usuario funcionario
    const userPassword = await bcrypt.hash('user123', salt);
    regularUser = await Usuario.create({
      nombre: 'Supervisor',
      apellido: 'Obras',
      email: 'supervisor@example.com',
      password: userPassword,
      role: 'usuario',
      departamento_id: departamento.id,
      estado: 'activo'
    });
    
    // Usuario ciudadano
    const ciudadanoPassword = await bcrypt.hash('ciudadano123', salt);
    ciudadanoUser = await Usuario.create({
      nombre: 'Ciudadano',
      apellido: 'Ejemplo',
      email: 'ciudadano.proyectos@example.com',
      password: ciudadanoPassword,
      role: 'ciudadano',
      estado: 'activo'
    });
    
    // Obtener tokens para los usuarios
    const adminLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin.proyectos@example.com',
        password: 'admin123'
      });
    
    adminToken = adminLoginResponse.body.token;
    
    const userLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'supervisor@example.com',
        password: 'user123'
      });
    
    usuarioToken = userLoginResponse.body.token;
    
    const ciudadanoLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'ciudadano.proyectos@example.com',
        password: 'ciudadano123'
      });
    
    ciudadanoToken = ciudadanoLoginResponse.body.token;
    
    // Crear un presupuesto de prueba
    presupuesto = await Presupuesto.create({
      nombre: 'Presupuesto Obras 2023',
      descripcion: 'Presupuesto anual para obras públicas',
      monto_total: 10000000.00,
      fecha_inicio: '2023-01-01',
      fecha_fin: '2023-12-31',
      estado: 'aprobado',
      departamento_id: departamento.id,
      usuario_id: adminUser.id
    });
    
    // Crear un proveedor de prueba
    proveedor = await Proveedor.create({
      nombre: 'Constructora Municipal',
      rfc: 'CMU010101XYZ',
      direccion: 'Av. Principal 123, Ciudad',
      telefono: '5551234567',
      email: 'contacto@constructoramunicipal.com',
      tipo: 'construccion',
      estado: 'activo',
      usuario_id: adminUser.id
    });
    
    // Crear un contrato de prueba
    contrato = await Contrato.create({
      numero: 'CONT-OBRA-2023-001',
      descripcion: 'Contrato para obras municipales',
      monto: 5000000.00,
      fecha_inicio: '2023-01-15',
      fecha_fin: '2023-12-15',
      tipo: 'obra',
      estado: 'vigente',
      proveedor_id: proveedor.id,
      usuario_id: adminUser.id
    });
    
    // Crear un proyecto de prueba
    proyectoCreado = await Proyecto.create({
      nombre: 'Pavimentación Avenida Central',
      descripcion: 'Proyecto de pavimentación y rehabilitación de la Avenida Central',
      ubicacion: 'Avenida Central entre Calle 1 y Calle 10',
      fecha_inicio: '2023-02-01',
      fecha_fin_estimada: '2023-06-30',
      presupuesto_asignado: 2000000.00,
      estado: 'en_proceso',
      departamento_id: departamento.id,
      presupuesto_id: presupuesto.id,
      contrato_id: contrato.id,
      usuario_id: adminUser.id
    });
  });
  
  afterAll(async () => {
    // Limpiar la base de datos después de las pruebas
    await sequelize.close();
  });
  
  describe('GET /api/proyectos', () => {
    it('debería permitir a un administrador obtener todos los proyectos', async () => {
      const response = await request(app)
        .get('/api/proyectos')
        .set('x-access-token', adminToken);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      expect(response.body.some(proyecto => proyecto.nombre === 'Pavimentación Avenida Central')).toBe(true);
    });
    
    it('debería permitir a un funcionario obtener todos los proyectos', async () => {
      const response = await request(app)
        .get('/api/proyectos')
        .set('x-access-token', usuarioToken);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
    });
    
    it('debería permitir a ciudadanos obtener proyectos públicos', async () => {
      const response = await request(app)
        .get('/api/proyectos/publicos')
        .set('x-access-token', ciudadanoToken);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
    
    it('debería rechazar solicitudes sin token', async () => {
      const response = await request(app)
        .get('/api/proyectos');
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message');
    });
  });
  
  describe('GET /api/proyectos/:id', () => {
    it('debería permitir a un administrador obtener un proyecto por ID', async () => {
      const response = await request(app)
        .get(`/api/proyectos/${proyectoCreado.id}`)
        .set('x-access-token', adminToken);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', proyectoCreado.id);
      expect(response.body).toHaveProperty('nombre', 'Pavimentación Avenida Central');
      expect(response.body).toHaveProperty('estado', 'en_proceso');
      expect(response.body).toHaveProperty('presupuesto_asignado', 2000000.00);
    });
    
    it('debería permitir a un funcionario obtener un proyecto por ID', async () => {
      const response = await request(app)
        .get(`/api/proyectos/${proyectoCreado.id}`)
        .set('x-access-token', usuarioToken);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', proyectoCreado.id);
    });
    
    it('debería permitir a ciudadanos obtener detalles públicos de un proyecto', async () => {
      const response = await request(app)
        .get(`/api/proyectos/publicos/${proyectoCreado.id}`)
        .set('x-access-token', ciudadanoToken);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', proyectoCreado.id);
      expect(response.body).toHaveProperty('nombre');
      expect(response.body).toHaveProperty('descripcion');
      expect(response.body).toHaveProperty('ubicacion');
      expect(response.body).toHaveProperty('estado');
      // No debería incluir información sensible como montos exactos o detalles de contrato
      expect(response.body).not.toHaveProperty('contrato_id');
    });
    
    it('debería devolver 404 para un ID de proyecto inexistente', async () => {
      const response = await request(app)
        .get('/api/proyectos/999')
        .set('x-access-token', adminToken);
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message');
    });
  });
  
  describe('POST /api/proyectos', () => {
    it('debería permitir a un administrador crear un nuevo proyecto', async () => {
      const nuevoProyecto = {
        nombre: 'Construcción Parque Municipal',
        descripcion: 'Proyecto de construcción del nuevo parque municipal',
        ubicacion: 'Zona Centro, entre Calles 5 y 6',
        fecha_inicio: '2023-03-01',
        fecha_fin_estimada: '2023-08-31',
        presupuesto_asignado: 1500000.00,
        estado: 'planificacion',
        departamento_id: departamento.id,
        presupuesto_id: presupuesto.id,
        contrato_id: contrato.id
      };
      
      const response = await request(app)
        .post('/api/proyectos')
        .set('x-access-token', adminToken)
        .send(nuevoProyecto);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('nombre', 'Construcción Parque Municipal');
      expect(response.body).toHaveProperty('estado', 'planificacion');
      expect(response.body).toHaveProperty('usuario_id', adminUser.id);
      
      // Verificar que el proyecto fue creado en la base de datos
      const proyectoCreado = await Proyecto.findOne({ where: { nombre: 'Construcción Parque Municipal' } });
      expect(proyectoCreado).not.toBeNull();
    });
    
    it('debería permitir a un funcionario crear un nuevo proyecto', async () => {
      const nuevoProyecto = {
        nombre: 'Renovación Alumbrado Público',
        descripcion: 'Proyecto de renovación del alumbrado público en la zona norte',
        ubicacion: 'Zona Norte, Colonias A, B y C',
        fecha_inicio: '2023-04-01',
        fecha_fin_estimada: '2023-07-31',
        presupuesto_asignado: 800000.00,
        estado: 'planificacion',
        departamento_id: departamento.id,
        presupuesto_id: presupuesto.id,
        contrato_id: contrato.id
      };
      
      const response = await request(app)
        .post('/api/proyectos')
        .set('x-access-token', usuarioToken)
        .send(nuevoProyecto);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('nombre', 'Renovación Alumbrado Público');
      expect(response.body).toHaveProperty('usuario_id', regularUser.id);
    });
    
    it('debería rechazar la creación de un proyecto con presupuesto excesivo', async () => {
      const proyectoExcesivo = {
        nombre: 'Proyecto Excesivo',
        descripcion: 'Proyecto con presupuesto que excede el disponible',
        ubicacion: 'Zona Sur',
        fecha_inicio: '2023-05-01',
        fecha_fin_estimada: '2023-09-30',
        presupuesto_asignado: 20000000.00, // Excede el presupuesto total disponible
        estado: 'planificacion',
        departamento_id: departamento.id,
        presupuesto_id: presupuesto.id,
        contrato_id: contrato.id
      };
      
      const response = await request(app)
        .post('/api/proyectos')
        .set('x-access-token', adminToken)
        .send(proyectoExcesivo);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
    
    it('debería rechazar la creación de un proyecto con datos incompletos', async () => {
      const proyectoIncompleto = {
        nombre: 'Proyecto Incompleto',
        descripcion: 'Proyecto con datos faltantes',
        // Faltan campos obligatorios
        estado: 'planificacion'
      };
      
      const response = await request(app)
        .post('/api/proyectos')
        .set('x-access-token', adminToken)
        .send(proyectoIncompleto);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
    
    it('debería rechazar a ciudadanos que intentan crear proyectos', async () => {
      const nuevoProyecto = {
        nombre: 'Intento Ciudadano',
        descripcion: 'Proyecto intentado por un ciudadano',
        ubicacion: 'Algún lugar',
        fecha_inicio: '2023-06-01',
        fecha_fin_estimada: '2023-10-31',
        presupuesto_asignado: 500000.00,
        estado: 'planificacion',
        departamento_id: departamento.id,
        presupuesto_id: presupuesto.id,
        contrato_id: contrato.id
      };
      
      const response = await request(app)
        .post('/api/proyectos')
        .set('x-access-token', ciudadanoToken)
        .send(nuevoProyecto);
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message');
    });
  });
  
  describe('PUT /api/proyectos/:id', () => {
    it('debería permitir a un administrador actualizar un proyecto', async () => {
      const actualizacionProyecto = {
        descripcion: 'Descripción actualizada del proyecto de pavimentación',
        fecha_fin_estimada: '2023-07-31', // Extensión de la fecha
        presupuesto_asignado: 2200000.00 // Incremento del presupuesto
      };
      
      const response = await request(app)
        .put(`/api/proyectos/${proyectoCreado.id}`)
        .set('x-access-token', adminToken)
        .send(actualizacionProyecto);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', proyectoCreado.id);
      expect(response.body).toHaveProperty('descripcion', 'Descripción actualizada del proyecto de pavimentación');
      expect(response.body).toHaveProperty('fecha_fin_estimada');
      expect(response.body).toHaveProperty('presupuesto_asignado', 2200000.00);
      
      // Verificar que el proyecto fue actualizado en la base de datos
      const proyectoActualizado = await Proyecto.findByPk(proyectoCreado.id);
      expect(proyectoActualizado.presupuesto_asignado).toBe(2200000.00);
    });
    
    it('debería permitir a un funcionario actualizar información básica de un proyecto', async () => {
      const actualizacionProyecto = {
        descripcion: 'Nueva descripción por funcionario',
        ubicacion: 'Ubicación actualizada: Avenida Central completa'
      };
      
      const response = await request(app)
        .put(`/api/proyectos/${proyectoCreado.id}`)
        .set('x-access-token', usuarioToken)
        .send(actualizacionProyecto);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', proyectoCreado.id);
      expect(response.body).toHaveProperty('descripcion', 'Nueva descripción por funcionario');
      expect(response.body).toHaveProperty('ubicacion', 'Ubicación actualizada: Avenida Central completa');
    });
    
    it('debería rechazar la actualización con presupuesto excesivo', async () => {
      const actualizacionInvalida = {
        presupuesto_asignado: 15000000.00 // Excede el presupuesto disponible
      };
      
      const response = await request(app)
        .put(`/api/proyectos/${proyectoCreado.id}`)
        .set('x-access-token', adminToken)
        .send(actualizacionInvalida);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
    
    it('debería rechazar a ciudadanos que intentan actualizar proyectos', async () => {
      const actualizacionProyecto = {
        descripcion: 'Intento de actualización por ciudadano'
      };
      
      const response = await request(app)
        .put(`/api/proyectos/${proyectoCreado.id}`)
        .set('x-access-token', ciudadanoToken)
        .send(actualizacionProyecto);
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message');
    });
  });
  
  describe('PUT /api/proyectos/:id/estado', () => {
    it('debería permitir a un administrador cambiar el estado de un proyecto', async () => {
      const actualizacionEstado = {
        estado: 'completado',
        observaciones: 'Proyecto finalizado antes de lo previsto'
      };
      
      const response = await request(app)
        .put(`/api/proyectos/${proyectoCreado.id}/estado`)
        .set('x-access-token', adminToken)
        .send(actualizacionEstado);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', proyectoCreado.id);
      expect(response.body).toHaveProperty('estado', 'completado');
      
      // Verificar que el estado fue actualizado en la base de datos
      const proyectoActualizado = await Proyecto.findByPk(proyectoCreado.id);
      expect(proyectoActualizado.estado).toBe('completado');
    });
    
    it('debería permitir a un funcionario cambiar ciertos estados de un proyecto', async () => {
      // Primero crear otro proyecto para esta prueba
      const otroProyecto = await Proyecto.create({
        nombre: 'Mantenimiento Edificio Municipal',
        descripcion: 'Proyecto de mantenimiento del edificio principal',
        ubicacion: 'Plaza Central #1',
        fecha_inicio: '2023-03-15',
        fecha_fin_estimada: '2023-05-15',
        presupuesto_asignado: 300000.00,
        estado: 'en_proceso',
        departamento_id: departamento.id,
        presupuesto_id: presupuesto.id,
        contrato_id: contrato.id,
        usuario_id: regularUser.id
      });
      
      const actualizacionEstado = {
        estado: 'en_revision',
        observaciones: 'Proyecto listo para revisión final'
      };
      
      const response = await request(app)
        .put(`/api/proyectos/${otroProyecto.id}/estado`)
        .set('x-access-token', usuarioToken)
        .send(actualizacionEstado);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', otroProyecto.id);
      expect(response.body).toHaveProperty('estado', 'en_revision');
    });
    
    it('debería rechazar a funcionarios que intentan marcar un proyecto como cancelado', async () => {
      // Crear otro proyecto para esta prueba
      const proyectoParaCancelar = await Proyecto.create({
        nombre: 'Proyecto Para Cancelar',
        descripcion: 'Este proyecto será intentado cancelar por un funcionario',
        ubicacion: 'Zona Este',
        fecha_inicio: '2023-04-01',
        fecha_fin_estimada: '2023-08-01',
        presupuesto_asignado: 400000.00,
        estado: 'en_proceso',
        departamento_id: departamento.id,
        presupuesto_id: presupuesto.id,
        contrato_id: contrato.id,
        usuario_id: adminUser.id
      });
      
      const actualizacionEstado = {
        estado: 'cancelado',
        observaciones: 'Intento de cancelación por funcionario'
      };
      
      const response = await request(app)
        .put(`/api/proyectos/${proyectoParaCancelar.id}/estado`)
        .set('x-access-token', usuarioToken)
        .send(actualizacionEstado);
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message');
      
      // Verificar que el estado no cambió
      const proyectoNoModificado = await Proyecto.findByPk(proyectoParaCancelar.id);
      expect(proyectoNoModificado.estado).toBe('en_proceso');
    });
  });
  
  describe('POST /api/proyectos/:id/avances', () => {
    it('debería permitir a un administrador registrar un avance de proyecto', async () => {
      const nuevoAvance = {
        descripcion: 'Finalización de la primera etapa',
        porcentaje_completado: 30,
        fecha: '2023-03-15',
        observaciones: 'Avance según lo planeado'
      };
      
      const response = await request(app)
        .post(`/api/proyectos/${proyectoCreado.id}/avances`)
        .set('x-access-token', adminToken)
        .send(nuevoAvance);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('proyecto_id', proyectoCreado.id);
      expect(response.body).toHaveProperty('porcentaje_completado', 30);
      expect(response.body).toHaveProperty('usuario_id', adminUser.id);
    });
    
    it('debería permitir a un funcionario registrar un avance de proyecto', async () => {
      const nuevoAvance = {
        descripcion: 'Avance en la segunda etapa',
        porcentaje_completado: 45,
        fecha: '2023-04-01',
        observaciones: 'Progreso normal'
      };
      
      const response = await request(app)
        .post(`/api/proyectos/${proyectoCreado.id}/avances`)
        .set('x-access-token', usuarioToken)
        .send(nuevoAvance);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('proyecto_id', proyectoCreado.id);
      expect(response.body).toHaveProperty('porcentaje_completado', 45);
      expect(response.body).toHaveProperty('usuario_id', regularUser.id);
    });
    
    it('debería rechazar avances con porcentaje inválido', async () => {
      const avanceInvalido = {
        descripcion: 'Avance con porcentaje inválido',
        porcentaje_completado: 120, // Porcentaje mayor a 100
        fecha: '2023-04-15',
        observaciones: 'Este avance no debería ser aceptado'
      };
      
      const response = await request(app)
        .post(`/api/proyectos/${proyectoCreado.id}/avances`)
        .set('x-access-token', adminToken)
        .send(avanceInvalido);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
    
    it('debería rechazar a ciudadanos que intentan registrar avances', async () => {
      const nuevoAvance = {
        descripcion: 'Intento de avance por ciudadano',
        porcentaje_completado: 50,
        fecha: '2023-04-20',
        observaciones: 'Este avance no debería ser aceptado'
      };
      
      const response = await request(app)
        .post(`/api/proyectos/${proyectoCreado.id}/avances`)
        .set('x-access-token', ciudadanoToken)
        .send(nuevoAvance);
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message');
    });
  });
  
  describe('GET /api/proyectos/:id/avances', () => {
    it('debería permitir a un administrador obtener los avances de un proyecto', async () => {
      const response = await request(app)
        .get(`/api/proyectos/${proyectoCreado.id}/avances`)
        .set('x-access-token', adminToken);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2); // Dos avances registrados previamente
      expect(response.body.some(avance => avance.porcentaje_completado === 30)).toBe(true);
      expect(response.body.some(avance => avance.porcentaje_completado === 45)).toBe(true);
    });
    
    it('debería permitir a un funcionario obtener los avances de un proyecto', async () => {
      const response = await request(app)
        .get(`/api/proyectos/${proyectoCreado.id}/avances`)
        .set('x-access-token', usuarioToken);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
    });
    
    it('debería permitir a ciudadanos obtener avances públicos de un proyecto', async () => {
      const response = await request(app)
        .get(`/api/proyectos/publicos/${proyectoCreado.id}/avances`)
        .set('x-access-token', ciudadanoToken);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      // Verificar que solo se muestran datos públicos
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('descripcion');
        expect(response.body[0]).toHaveProperty('porcentaje_completado');
        expect(response.body[0]).toHaveProperty('fecha');
        // No debería incluir información sensible
        expect(response.body[0]).not.toHaveProperty('usuario_id');
      }
    });
  });
  
  describe('GET /api/proyectos/departamento/:id', () => {
    it('debería permitir a un administrador obtener proyectos por departamento', async () => {
      const response = await request(app)
        .get(`/api/proyectos/departamento/${departamento.id}`)
        .set('x-access-token', adminToken);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      expect(response.body.every(proyecto => proyecto.departamento_id === departamento.id)).toBe(true);
    });
    
    it('debería permitir a un funcionario obtener proyectos por departamento', async () => {
      const response = await request(app)
        .get(`/api/proyectos/departamento/${departamento.id}`)
        .set('x-access-token', usuarioToken);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
    
    it('debería rechazar a ciudadanos que intentan acceder a proyectos por departamento', async () => {
      const response = await request(app)
        .get(`/api/proyectos/departamento/${departamento.id}`)
        .set('x-access-token', ciudadanoToken);
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message');
    });
  });
  
  describe('GET /api/proyectos/reporte/:id', () => {
    it('debería permitir a un administrador generar un reporte de proyecto', async () => {
      const response = await request(app)
        .get(`/api/proyectos/reporte/${proyectoCreado.id}`)
        .set('x-access-token', adminToken)
        .set('Accept', 'application/pdf');
      
      expect(response.status).toBe(200);
      expect(response.type).toBe('application/pdf');
      expect(response.headers['content-disposition']).toContain('attachment');
    });
    
    it('debería permitir a un funcionario generar un reporte de proyecto', async () => {
      const response = await request(app)
        .get(`/api/proyectos/reporte/${proyectoCreado.id}`)
        .set('x-access-token', usuarioToken)
        .set('Accept', 'application/pdf');
      
      expect(response.status).toBe(200);
      expect(response.type).toBe('application/pdf');
    });
    
    it('debería rechazar a ciudadanos que intentan generar reportes de proyectos', async () => {
      const response = await request(app)
        .get(`/api/proyectos/reporte/${proyectoCreado.id}`)
        .set('x-access-token', ciudadanoToken)
        .set('Accept', 'application/pdf');
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message');
    });
  });
});
