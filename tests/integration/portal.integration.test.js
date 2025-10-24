/**
 * Pruebas de integración para el portal ciudadano
 */

const request = require('supertest');
const app = require('../../src/app');
const { sequelize } = require('../../src/config/database');
const { Usuario, Departamento, TipoTramite, Tramite, Documento, Pago } = require('../../src/models');
const bcrypt = require('bcryptjs');

describe('Portal Ciudadano Integration Tests', () => {
  let ciudadanoToken;
  let adminToken;
  let ciudadanoUser;
  let adminUser;
  let departamento;
  let tipoTramite;
  let tramiteCreado;
  let documentoCreado;
  let pagoCreado;
  
  beforeAll(async () => {
    // Configurar la base de datos de prueba
    await sequelize.sync({ force: true });
    
    // Crear un departamento de prueba
    departamento = await Departamento.create({
      nombre: 'Atención Ciudadana',
      descripcion: 'Departamento encargado de atención al ciudadano'
    });
    
    // Crear usuarios de prueba
    const salt = await bcrypt.genSalt(10);
    
    // Usuario ciudadano
    const ciudadanoPassword = await bcrypt.hash('ciudadano123', salt);
    ciudadanoUser = await Usuario.create({
      nombre: 'Ciudadano',
      apellido: 'Portal',
      email: 'ciudadano.portal@example.com',
      password: ciudadanoPassword,
      role: 'ciudadano',
      estado: 'activo'
    });
    
    // Usuario administrador
    const adminPassword = await bcrypt.hash('admin123', salt);
    adminUser = await Usuario.create({
      nombre: 'Admin',
      apellido: 'Portal',
      email: 'admin.portal@example.com',
      password: adminPassword,
      role: 'admin',
      departamento_id: departamento.id,
      estado: 'activo'
    });
    
    // Obtener tokens para los usuarios
    const ciudadanoLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'ciudadano.portal@example.com',
        password: 'ciudadano123'
      });
    
    ciudadanoToken = ciudadanoLoginResponse.body.token;
    
    const adminLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin.portal@example.com',
        password: 'admin123'
      });
    
    adminToken = adminLoginResponse.body.token;
    
    // Crear un tipo de trámite de prueba
    tipoTramite = await TipoTramite.create({
      nombre: 'Licencia de Construcción',
      descripcion: 'Permiso para realizar obras de construcción',
      requisitos: 'Identificación oficial, comprobante de domicilio, planos arquitectónicos',
      costo: 1500.00,
      tiempo_estimado: 15,
      departamento_id: departamento.id,
      usuario_id: adminUser.id
    });
    
    // Crear un trámite de prueba para el ciudadano
    tramiteCreado = await Tramite.create({
      descripcion: 'Solicitud de licencia para construcción de casa habitación',
      estado: 'en_proceso',
      fecha_solicitud: new Date(),
      fecha_actualizacion: new Date(),
      tipo_tramite_id: tipoTramite.id,
      usuario_id: ciudadanoUser.id,
      departamento_id: departamento.id
    });
    
    // Crear un documento asociado al trámite
    documentoCreado = await Documento.create({
      nombre: 'Identificación',
      tipo: 'identificacion',
      ruta: '/uploads/documentos/identificacion_ciudadano.pdf',
      estado: 'aprobado',
      tramite_id: tramiteCreado.id,
      usuario_id: ciudadanoUser.id
    });
    
    // Crear un pago asociado al trámite
    pagoCreado = await Pago.create({
      monto: 1500.00,
      concepto: 'Pago de licencia de construcción',
      fecha_pago: new Date(),
      metodo_pago: 'transferencia',
      referencia: 'REF123456',
      estado: 'completado',
      tramite_id: tramiteCreado.id,
      usuario_id: ciudadanoUser.id
    });
  });
  
  afterAll(async () => {
    // Limpiar la base de datos después de las pruebas
    await sequelize.close();
  });
  
  describe('GET /api/portal/tramites', () => {
    it('debería permitir a un ciudadano obtener sus trámites', async () => {
      const response = await request(app)
        .get('/api/portal/tramites')
        .set('x-access-token', ciudadanoToken);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      expect(response.body.some(tramite => tramite.id === tramiteCreado.id)).toBe(true);
      expect(response.body[0]).toHaveProperty('tipo_tramite');
    });
    
    it('debería rechazar solicitudes sin token', async () => {
      const response = await request(app)
        .get('/api/portal/tramites');
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message');
    });
    
    it('debería rechazar solicitudes de administradores a la ruta de portal ciudadano', async () => {
      const response = await request(app)
        .get('/api/portal/tramites')
        .set('x-access-token', adminToken);
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message');
    });
  });
  
  describe('GET /api/portal/tramites/:id', () => {
    it('debería permitir a un ciudadano obtener detalles de su trámite', async () => {
      const response = await request(app)
        .get(`/api/portal/tramites/${tramiteCreado.id}`)
        .set('x-access-token', ciudadanoToken);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', tramiteCreado.id);
      expect(response.body).toHaveProperty('estado', 'en_proceso');
      expect(response.body).toHaveProperty('tipo_tramite');
      expect(response.body.tipo_tramite).toHaveProperty('nombre', 'Licencia de Construcción');
      expect(response.body).toHaveProperty('documentos');
      expect(Array.isArray(response.body.documentos)).toBe(true);
      expect(response.body.documentos.length).toBeGreaterThanOrEqual(1);
      expect(response.body).toHaveProperty('pagos');
      expect(Array.isArray(response.body.pagos)).toBe(true);
      expect(response.body.pagos.length).toBeGreaterThanOrEqual(1);
    });
    
    it('debería rechazar a un ciudadano que intenta acceder a un trámite que no le pertenece', async () => {
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
      const otroCiudadanoLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'otro.ciudadano@example.com',
          password: 'otro123'
        });
      
      const otroCiudadanoToken = otroCiudadanoLoginResponse.body.token;
      
      // Intentar acceder al trámite del primer ciudadano
      const response = await request(app)
        .get(`/api/portal/tramites/${tramiteCreado.id}`)
        .set('x-access-token', otroCiudadanoToken);
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message');
    });
  });
  
  describe('POST /api/portal/tramites', () => {
    it('debería permitir a un ciudadano crear un nuevo trámite', async () => {
      const nuevoTramite = {
        descripcion: 'Solicitud de permiso para evento en vía pública',
        tipo_tramite_id: tipoTramite.id
      };
      
      const response = await request(app)
        .post('/api/portal/tramites')
        .set('x-access-token', ciudadanoToken)
        .send(nuevoTramite);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('descripcion', 'Solicitud de permiso para evento en vía pública');
      expect(response.body).toHaveProperty('estado', 'pendiente');
      expect(response.body).toHaveProperty('usuario_id', ciudadanoUser.id);
      expect(response.body).toHaveProperty('tipo_tramite_id', tipoTramite.id);
      
      // Verificar que el trámite fue creado en la base de datos
      const tramiteCreado = await Tramite.findOne({ 
        where: { descripcion: 'Solicitud de permiso para evento en vía pública' } 
      });
      expect(tramiteCreado).not.toBeNull();
    });
    
    it('debería rechazar la creación de un trámite con datos incompletos', async () => {
      const tramiteIncompleto = {
        descripcion: 'Trámite incompleto'
        // Falta tipo_tramite_id
      };
      
      const response = await request(app)
        .post('/api/portal/tramites')
        .set('x-access-token', ciudadanoToken)
        .send(tramiteIncompleto);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });
  
  describe('POST /api/portal/tramites/:id/documentos', () => {
    it('debería permitir a un ciudadano subir un documento para su trámite', async () => {
      // Simular la subida de un archivo
      const response = await request(app)
        .post(`/api/portal/tramites/${tramiteCreado.id}/documentos`)
        .set('x-access-token', ciudadanoToken)
        .field('nombre', 'Comprobante de Domicilio')
        .field('tipo', 'comprobante_domicilio')
        .attach('documento', Buffer.from('contenido de prueba'), 'comprobante.pdf');
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('nombre', 'Comprobante de Domicilio');
      expect(response.body).toHaveProperty('tipo', 'comprobante_domicilio');
      expect(response.body).toHaveProperty('tramite_id', tramiteCreado.id);
      expect(response.body).toHaveProperty('usuario_id', ciudadanoUser.id);
      expect(response.body).toHaveProperty('ruta');
      expect(response.body).toHaveProperty('estado', 'pendiente');
    });
    
    it('debería rechazar a un ciudadano que intenta subir un documento a un trámite que no le pertenece', async () => {
      // Crear otro ciudadano y su trámite
      const salt = await bcrypt.genSalt(10);
      const otroCiudadanoPassword = await bcrypt.hash('otro123', salt);
      const otroCiudadano = await Usuario.create({
        nombre: 'Otro',
        apellido: 'Ciudadano2',
        email: 'otro.ciudadano2@example.com',
        password: otroCiudadanoPassword,
        role: 'ciudadano',
        estado: 'activo'
      });
      
      const otroTramite = await Tramite.create({
        descripcion: 'Otro trámite de otro ciudadano',
        estado: 'pendiente',
        fecha_solicitud: new Date(),
        fecha_actualizacion: new Date(),
        tipo_tramite_id: tipoTramite.id,
        usuario_id: otroCiudadano.id,
        departamento_id: departamento.id
      });
      
      // Obtener token para el otro ciudadano
      const otroCiudadanoLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'otro.ciudadano2@example.com',
          password: 'otro123'
        });
      
      const otroCiudadanoToken = otroCiudadanoLoginResponse.body.token;
      
      // Intentar subir un documento al trámite del primer ciudadano
      const response = await request(app)
        .post(`/api/portal/tramites/${tramiteCreado.id}/documentos`)
        .set('x-access-token', otroCiudadanoToken)
        .field('nombre', 'Documento Intruso')
        .field('tipo', 'otro')
        .attach('documento', Buffer.from('contenido intruso'), 'intruso.pdf');
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message');
    });
  });
  
  describe('GET /api/portal/pagos', () => {
    it('debería permitir a un ciudadano obtener sus pagos', async () => {
      const response = await request(app)
        .get('/api/portal/pagos')
        .set('x-access-token', ciudadanoToken);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      expect(response.body.some(pago => pago.id === pagoCreado.id)).toBe(true);
      expect(response.body[0]).toHaveProperty('tramite');
    });
  });
  
  describe('GET /api/portal/pagos/:id', () => {
    it('debería permitir a un ciudadano obtener detalles de su pago', async () => {
      const response = await request(app)
        .get(`/api/portal/pagos/${pagoCreado.id}`)
        .set('x-access-token', ciudadanoToken);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', pagoCreado.id);
      expect(response.body).toHaveProperty('monto', 1500.00);
      expect(response.body).toHaveProperty('concepto', 'Pago de licencia de construcción');
      expect(response.body).toHaveProperty('estado', 'completado');
      expect(response.body).toHaveProperty('tramite');
      expect(response.body.tramite).toHaveProperty('id', tramiteCreado.id);
    });
    
    it('debería rechazar a un ciudadano que intenta acceder a un pago que no le pertenece', async () => {
      // Crear otro ciudadano y su pago
      const salt = await bcrypt.genSalt(10);
      const otroCiudadanoPassword = await bcrypt.hash('otro123', salt);
      const otroCiudadano = await Usuario.create({
        nombre: 'Otro',
        apellido: 'Ciudadano3',
        email: 'otro.ciudadano3@example.com',
        password: otroCiudadanoPassword,
        role: 'ciudadano',
        estado: 'activo'
      });
      
      const otroTramite = await Tramite.create({
        descripcion: 'Otro trámite para pago',
        estado: 'pendiente',
        fecha_solicitud: new Date(),
        fecha_actualizacion: new Date(),
        tipo_tramite_id: tipoTramite.id,
        usuario_id: otroCiudadano.id,
        departamento_id: departamento.id
      });
      
      const otroPago = await Pago.create({
        monto: 1500.00,
        concepto: 'Pago de otro ciudadano',
        fecha_pago: new Date(),
        metodo_pago: 'efectivo',
        referencia: 'REF789012',
        estado: 'completado',
        tramite_id: otroTramite.id,
        usuario_id: otroCiudadano.id
      });
      
      // Obtener token para el otro ciudadano
      const otroCiudadanoLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'otro.ciudadano3@example.com',
          password: 'otro123'
        });
      
      const otroCiudadanoToken = otroCiudadanoLoginResponse.body.token;
      
      // Intentar acceder al pago del primer ciudadano
      const response = await request(app)
        .get(`/api/portal/pagos/${pagoCreado.id}`)
        .set('x-access-token', otroCiudadanoToken);
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message');
    });
  });
  
  describe('GET /api/portal/pagos/:id/recibo', () => {
    it('debería permitir a un ciudadano obtener el recibo de su pago', async () => {
      const response = await request(app)
        .get(`/api/portal/pagos/${pagoCreado.id}/recibo`)
        .set('x-access-token', ciudadanoToken)
        .set('Accept', 'application/pdf');
      
      expect(response.status).toBe(200);
      expect(response.type).toBe('application/pdf');
      expect(response.headers['content-disposition']).toContain('attachment');
    });
    
    it('debería rechazar a un ciudadano que intenta obtener un recibo de pago que no le pertenece', async () => {
      // Usar el otro ciudadano y pago creados anteriormente
      const otroCiudadanoLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'otro.ciudadano3@example.com',
          password: 'otro123'
        });
      
      const otroCiudadanoToken = otroCiudadanoLoginResponse.body.token;
      
      // Intentar acceder al recibo del primer ciudadano
      const response = await request(app)
        .get(`/api/portal/pagos/${pagoCreado.id}/recibo`)
        .set('x-access-token', otroCiudadanoToken)
        .set('Accept', 'application/pdf');
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message');
    });
  });
  
  describe('GET /api/portal/tipos-tramite', () => {
    it('debería permitir a un ciudadano obtener los tipos de trámite disponibles', async () => {
      const response = await request(app)
        .get('/api/portal/tipos-tramite')
        .set('x-access-token', ciudadanoToken);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      expect(response.body.some(tipo => tipo.id === tipoTramite.id)).toBe(true);
      expect(response.body[0]).toHaveProperty('nombre');
      expect(response.body[0]).toHaveProperty('descripcion');
      expect(response.body[0]).toHaveProperty('requisitos');
      expect(response.body[0]).toHaveProperty('costo');
      expect(response.body[0]).toHaveProperty('tiempo_estimado');
    });
  });
  
  describe('GET /api/portal/perfil', () => {
    it('debería permitir a un ciudadano obtener su perfil', async () => {
      const response = await request(app)
        .get('/api/portal/perfil')
        .set('x-access-token', ciudadanoToken);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', ciudadanoUser.id);
      expect(response.body).toHaveProperty('nombre', 'Ciudadano');
      expect(response.body).toHaveProperty('apellido', 'Portal');
      expect(response.body).toHaveProperty('email', 'ciudadano.portal@example.com');
      expect(response.body).toHaveProperty('role', 'ciudadano');
      // No debería incluir la contraseña
      expect(response.body).not.toHaveProperty('password');
    });
  });
  
  describe('PUT /api/portal/perfil', () => {
    it('debería permitir a un ciudadano actualizar su perfil', async () => {
      const actualizacionPerfil = {
        nombre: 'Ciudadano Actualizado',
        apellido: 'Portal Actualizado',
        telefono: '5551234567',
        direccion: 'Nueva Dirección 123, Ciudad'
      };
      
      const response = await request(app)
        .put('/api/portal/perfil')
        .set('x-access-token', ciudadanoToken)
        .send(actualizacionPerfil);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', ciudadanoUser.id);
      expect(response.body).toHaveProperty('nombre', 'Ciudadano Actualizado');
      expect(response.body).toHaveProperty('apellido', 'Portal Actualizado');
      expect(response.body).toHaveProperty('telefono', '5551234567');
      expect(response.body).toHaveProperty('direccion', 'Nueva Dirección 123, Ciudad');
      
      // Verificar que el perfil fue actualizado en la base de datos
      const usuarioActualizado = await Usuario.findByPk(ciudadanoUser.id);
      expect(usuarioActualizado.nombre).toBe('Ciudadano Actualizado');
      expect(usuarioActualizado.apellido).toBe('Portal Actualizado');
    });
    
    it('debería rechazar la actualización del correo a uno ya existente', async () => {
      const actualizacionInvalida = {
        email: 'admin.portal@example.com' // Email ya existente
      };
      
      const response = await request(app)
        .put('/api/portal/perfil')
        .set('x-access-token', ciudadanoToken)
        .send(actualizacionInvalida);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });
  
  describe('PUT /api/portal/perfil/password', () => {
    it('debería permitir a un ciudadano cambiar su contraseña', async () => {
      const cambioPassword = {
        currentPassword: 'ciudadano123',
        newPassword: 'nuevaPassword123',
        confirmPassword: 'nuevaPassword123'
      };
      
      const response = await request(app)
        .put('/api/portal/perfil/password')
        .set('x-access-token', ciudadanoToken)
        .send(cambioPassword);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      
      // Verificar que la contraseña fue actualizada intentando iniciar sesión con la nueva
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'ciudadano.portal@example.com',
          password: 'nuevaPassword123'
        });
      
      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body).toHaveProperty('token');
    });
    
    it('debería rechazar el cambio de contraseña con contraseña actual incorrecta', async () => {
      const cambioInvalido = {
        currentPassword: 'passwordIncorrecta',
        newPassword: 'otraNueva123',
        confirmPassword: 'otraNueva123'
      };
      
      const response = await request(app)
        .put('/api/portal/perfil/password')
        .set('x-access-token', ciudadanoToken)
        .send(cambioInvalido);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
    
    it('debería rechazar el cambio de contraseña cuando las nuevas no coinciden', async () => {
      const cambioInvalido = {
        currentPassword: 'nuevaPassword123',
        newPassword: 'otraNueva123',
        confirmPassword: 'noCoincide123'
      };
      
      const response = await request(app)
        .put('/api/portal/perfil/password')
        .set('x-access-token', ciudadanoToken)
        .send(cambioInvalido);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });
});