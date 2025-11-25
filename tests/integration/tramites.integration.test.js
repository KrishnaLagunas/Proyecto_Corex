/**
 * Pruebas de integración para el controlador de trámites
 */

const request = require('supertest');
const app = require('../../src/app');
const { sequelize } = require('../../src/config/database');
const { Usuario, Departamento, TipoTramite, Tramite, Documento } = require('../../src/models');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

describe('Trámites Integration Tests', () => {
  let adminToken;
  let usuarioToken;
  let ciudadanoToken;
  let adminUser;
  let regularUser;
  let ciudadanoUser;
  let departamento;
  let tipoTramite;
  let tramiteCreado;
  
  beforeAll(async () => {
    // Configurar la base de datos de prueba
    await sequelize.sync({ force: true });
    
    // Crear un departamento de prueba
    departamento = await Departamento.create({
      nombre: 'Departamento de Trámites',
      descripcion: 'Departamento para gestión de trámites'
    });
    
    // Crear un tipo de trámite
    tipoTramite = await TipoTramite.create({
      nombre: 'Licencia de Construcción',
      descripcion: 'Permiso para construcción de inmuebles',
      costo: 1500.00,
      tiempo_estimado: 15, // días
      departamento_id: departamento.id,
      documentos_requeridos: JSON.stringify(['Identificación', 'Comprobante de domicilio', 'Planos arquitectónicos']),
      estado: 'activo'
    });
    
    // Crear usuarios de prueba
    const salt = await bcrypt.genSalt(10);
    
    // Usuario superadministrador
    const adminPassword = await bcrypt.hash('admin123', salt);
    adminUser = await Usuario.create({
      nombre: 'Superadmin',
      apellido: 'Trámites',
      email: 'admin.tramites@example.com',
      password: adminPassword,
      role: 'superadmin',
      departamento_id: departamento.id,
      estado: 'activo'
    });
    
    // Usuario funcionario
    const userPassword = await bcrypt.hash('user123', salt);
    regularUser = await Usuario.create({
      nombre: 'Funcionario',
      apellido: 'Trámites',
      email: 'funcionario.tramites@example.com',
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
      email: 'ciudadano@example.com',
      password: ciudadanoPassword,
      role: 'ciudadano',
      estado: 'activo'
    });
    
    // Obtener tokens para los usuarios
    const adminLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin.tramites@example.com',
        password: 'admin123'
      });
    
    adminToken = adminLoginResponse.body.token;
    
    const userLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'funcionario.tramites@example.com',
        password: 'user123'
      });
    
    usuarioToken = userLoginResponse.body.token;
    
    const ciudadanoLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'ciudadano@example.com',
        password: 'ciudadano123'
      });
    
    ciudadanoToken = ciudadanoLoginResponse.body.token;
    
    // Crear un trámite de prueba
    tramiteCreado = await Tramite.create({
      tipo_tramite_id: tipoTramite.id,
      usuario_id: ciudadanoUser.id,
      departamento_id: departamento.id,
      folio: 'TRM-2023-001',
      estado: 'en_revision',
      fecha_solicitud: new Date(),
      fecha_actualizacion: new Date(),
      observaciones: 'Trámite de prueba para integración'
    });
    
    // Crear un directorio temporal para archivos de prueba si no existe
    const uploadsDir = path.join(__dirname, '../../uploads/test');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
  });
  
  afterAll(async () => {
    // Limpiar la base de datos después de las pruebas
    await sequelize.close();
  });
  
  describe('GET /api/tramites', () => {
    it('debería permitir a un administrador obtener todos los trámites', async () => {
      const response = await request(app)
        .get('/api/tramites')
        .set('x-access-token', adminToken);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      expect(response.body.some(tramite => tramite.folio === 'TRM-2023-001')).toBe(true);
    });
    
    it('debería permitir a un funcionario obtener los trámites de su departamento', async () => {
      const response = await request(app)
        .get('/api/tramites')
        .set('x-access-token', usuarioToken);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      expect(response.body.some(tramite => tramite.folio === 'TRM-2023-001')).toBe(true);
    });
    
    it('debería permitir a un ciudadano obtener solo sus trámites', async () => {
      const response = await request(app)
        .get('/api/tramites')
        .set('x-access-token', ciudadanoToken);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      expect(response.body.some(tramite => tramite.folio === 'TRM-2023-001')).toBe(true);
      
      // Verificar que todos los trámites pertenecen al ciudadano
      response.body.forEach(tramite => {
        expect(tramite.usuario_id).toBe(ciudadanoUser.id);
      });
    });
    
    it('debería rechazar solicitudes sin token', async () => {
      const response = await request(app)
        .get('/api/tramites');
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message');
    });
  });
  
  describe('GET /api/tramites/:id', () => {
    it('debería permitir a un administrador obtener un trámite por ID', async () => {
      const response = await request(app)
        .get(`/api/tramites/${tramiteCreado.id}`)
        .set('x-access-token', adminToken);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', tramiteCreado.id);
      expect(response.body).toHaveProperty('folio', 'TRM-2023-001');
      expect(response.body).toHaveProperty('estado', 'en_revision');
    });
    
    it('debería permitir a un ciudadano obtener su propio trámite', async () => {
      const response = await request(app)
        .get(`/api/tramites/${tramiteCreado.id}`)
        .set('x-access-token', ciudadanoToken);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', tramiteCreado.id);
      expect(response.body).toHaveProperty('folio', 'TRM-2023-001');
    });
    
    it('debería rechazar a un ciudadano que intenta acceder al trámite de otro', async () => {
      // Crear otro ciudadano
      const salt = await bcrypt.genSalt(10);
      const otroCiudadanoPassword = await bcrypt.hash('otro123', salt);
      const otroCiudadano = await Usuario.create({
        nombre: 'Otro',
        apellido: 'Ciudadano',
        email: 'otro.ciudadano@example.com',
        password: otroCiudadanoPassword,
        role: 'ciudadano',
        estado: 'activo'
      });
      
      // Obtener token para el otro ciudadano
      const otroCiudadanoLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'otro.ciudadano@example.com',
          password: 'otro123'
        });
      
      const otroCiudadanoToken = otroCiudadanoLogin.body.token;
      
      // Intentar acceder al trámite del primer ciudadano
      const response = await request(app)
        .get(`/api/tramites/${tramiteCreado.id}`)
        .set('x-access-token', otroCiudadanoToken);
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message');
    });
    
    it('debería devolver 404 para un ID de trámite inexistente', async () => {
      const response = await request(app)
        .get('/api/tramites/999')
        .set('x-access-token', adminToken);
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message');
    });
  });
  
  describe('POST /api/tramites', () => {
    it('debería permitir a un ciudadano crear un nuevo trámite', async () => {
      const nuevoTramite = {
        tipo_tramite_id: tipoTramite.id,
        observaciones: 'Solicitud de licencia para construcción residencial'
      };
      
      const response = await request(app)
        .post('/api/tramites')
        .set('x-access-token', ciudadanoToken)
        .send(nuevoTramite);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('folio');
      expect(response.body).toHaveProperty('estado', 'pendiente');
      expect(response.body).toHaveProperty('usuario_id', ciudadanoUser.id);
      expect(response.body).toHaveProperty('tipo_tramite_id', tipoTramite.id);
      
      // Verificar que el trámite fue creado en la base de datos
      const tramiteCreado = await Tramite.findByPk(response.body.id);
      expect(tramiteCreado).not.toBeNull();
    });
    
    it('debería rechazar la creación de un trámite con tipo de trámite inexistente', async () => {
      const tramiteInvalido = {
        tipo_tramite_id: 999, // ID inexistente
        observaciones: 'Este trámite debería fallar'
      };
      
      const response = await request(app)
        .post('/api/tramites')
        .set('x-access-token', ciudadanoToken)
        .send(tramiteInvalido);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
    
    it('debería rechazar la creación de un trámite sin tipo de trámite', async () => {
      const tramiteIncompleto = {
        observaciones: 'Falta el tipo de trámite'
      };
      
      const response = await request(app)
        .post('/api/tramites')
        .set('x-access-token', ciudadanoToken)
        .send(tramiteIncompleto);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });
  
  describe('PUT /api/tramites/:id/estado', () => {
    it('debería permitir a un funcionario actualizar el estado de un trámite', async () => {
      const actualizacionEstado = {
        estado: 'aprobado',
        observaciones: 'Trámite revisado y aprobado'
      };
      
      const response = await request(app)
        .put(`/api/tramites/${tramiteCreado.id}/estado`)
        .set('x-access-token', usuarioToken)
        .send(actualizacionEstado);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', tramiteCreado.id);
      expect(response.body).toHaveProperty('estado', 'aprobado');
      expect(response.body).toHaveProperty('observaciones', 'Trámite revisado y aprobado');
      
      // Verificar que el trámite fue actualizado en la base de datos
      const tramiteActualizado = await Tramite.findByPk(tramiteCreado.id);
      expect(tramiteActualizado.estado).toBe('aprobado');
    });
    
    it('debería rechazar a un ciudadano que intenta actualizar el estado de un trámite', async () => {
      const actualizacionEstado = {
        estado: 'cancelado',
        observaciones: 'Intento de cancelar el trámite'
      };
      
      const response = await request(app)
        .put(`/api/tramites/${tramiteCreado.id}/estado`)
        .set('x-access-token', ciudadanoToken)
        .send(actualizacionEstado);
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message');
      
      // Verificar que el estado no cambió
      const tramiteNoModificado = await Tramite.findByPk(tramiteCreado.id);
      expect(tramiteNoModificado.estado).toBe('aprobado'); // Sigue con el estado anterior
    });
    
    it('debería rechazar actualización con estado inválido', async () => {
      const actualizacionInvalida = {
        estado: 'estado_inexistente',
        observaciones: 'Estado no válido'
      };
      
      const response = await request(app)
        .put(`/api/tramites/${tramiteCreado.id}/estado`)
        .set('x-access-token', usuarioToken)
        .send(actualizacionInvalida);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });
  
  describe('POST /api/tramites/:id/documentos', () => {
    it('debería permitir a un ciudadano subir un documento para su trámite', async () => {
      // Crear un archivo de prueba
      const testFilePath = path.join(__dirname, '../../uploads/test/test-documento.pdf');
      fs.writeFileSync(testFilePath, 'Contenido de prueba para PDF', 'utf8');
      
      const response = await request(app)
        .post(`/api/tramites/${tramiteCreado.id}/documentos`)
        .set('x-access-token', ciudadanoToken)
        .attach('documento', testFilePath)
        .field('tipo', 'Identificación')
        .field('descripcion', 'INE del solicitante');
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('tramite_id', tramiteCreado.id);
      expect(response.body).toHaveProperty('tipo', 'Identificación');
      expect(response.body).toHaveProperty('archivo_url');
      
      // Verificar que el documento fue creado en la base de datos
      const documentoCreado = await Documento.findByPk(response.body.id);
      expect(documentoCreado).not.toBeNull();
      
      // Limpiar el archivo de prueba
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
    });
    
    it('debería rechazar a un ciudadano que intenta subir un documento para el trámite de otro', async () => {
      // Crear otro ciudadano y su trámite
      const salt = await bcrypt.genSalt(10);
      const otroCiudadanoPassword = await bcrypt.hash('otro123', salt);
      const otroCiudadano = await Usuario.create({
        nombre: 'Otro',
        apellido: 'Ciudadano',
        email: 'otro.ciudadano2@example.com',
        password: otroCiudadanoPassword,
        role: 'ciudadano',
        estado: 'activo'
      });
      
      const otroTramite = await Tramite.create({
        tipo_tramite_id: tipoTramite.id,
        usuario_id: otroCiudadano.id,
        departamento_id: departamento.id,
        folio: 'TRM-2023-002',
        estado: 'pendiente',
        fecha_solicitud: new Date(),
        fecha_actualizacion: new Date(),
        observaciones: 'Otro trámite de prueba'
      });
      
      // Obtener token para el otro ciudadano
      const otroCiudadanoLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'otro.ciudadano2@example.com',
          password: 'otro123'
        });
      
      const otroCiudadanoToken = otroCiudadanoLogin.body.token;
      
      // Crear un archivo de prueba
      const testFilePath = path.join(__dirname, '../../uploads/test/test-documento2.pdf');
      fs.writeFileSync(testFilePath, 'Contenido de prueba para PDF', 'utf8');
      
      // Intentar subir un documento al trámite del primer ciudadano
      const response = await request(app)
        .post(`/api/tramites/${tramiteCreado.id}/documentos`)
        .set('x-access-token', otroCiudadanoToken)
        .attach('documento', testFilePath)
        .field('tipo', 'Identificación')
        .field('descripcion', 'INE del solicitante');
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message');
      
      // Limpiar el archivo de prueba
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
    });
  });
  
  describe('GET /api/tramites/:id/documentos', () => {
    let documentoCreado;
    
    beforeAll(async () => {
      // Crear un documento de prueba
      documentoCreado = await Documento.create({
        tramite_id: tramiteCreado.id,
        tipo: 'Comprobante de domicilio',
        descripcion: 'Recibo de luz',
        archivo_url: '/uploads/test/comprobante.pdf',
        fecha_subida: new Date()
      });
    });
    
    it('debería permitir a un funcionario obtener los documentos de un trámite', async () => {
      const response = await request(app)
        .get(`/api/tramites/${tramiteCreado.id}/documentos`)
        .set('x-access-token', usuarioToken);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      expect(response.body.some(doc => doc.id === documentoCreado.id)).toBe(true);
    });
    
    it('debería permitir a un ciudadano obtener los documentos de su propio trámite', async () => {
      const response = await request(app)
        .get(`/api/tramites/${tramiteCreado.id}/documentos`)
        .set('x-access-token', ciudadanoToken);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      expect(response.body.some(doc => doc.id === documentoCreado.id)).toBe(true);
    });
  });
});
