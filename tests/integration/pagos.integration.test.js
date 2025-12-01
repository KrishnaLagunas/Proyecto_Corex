/**
 * Pruebas de integración para el controlador de pagos
 */

const request = require('supertest');
const app = require('../../src/app');
const { sequelize } = require('../../src/config/database');
const { Usuario, Departamento, TipoTramite, Tramite, Pago, Concepto } = require('../../src/models');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

describe('Pagos Integration Tests', () => {
  let adminToken;
  let usuarioToken;
  let ciudadanoToken;
  let adminUser;
  let regularUser;
  let ciudadanoUser;
  let departamento;
  let tipoTramite;
  let tramiteCreado;
  let conceptoPago;
  let pagoCreado;
  
  beforeAll(async () => {
    // Configurar la base de datos de prueba
    await sequelize.sync({ force: true });
    
    // Crear un departamento de prueba
    departamento = await Departamento.create({
      nombre: 'Tesorería Municipal',
      descripcion: 'Departamento encargado de la gestión de pagos'
    });
    
    // Crear un tipo de trámite
    tipoTramite = await TipoTramite.create({
      nombre: 'Pago de Predial',
      descripcion: 'Pago de impuesto predial anual',
      costo: 1200.00,
      tiempo_estimado: 1, // días
      departamento_id: departamento.id,
      documentos_requeridos: JSON.stringify(['Identificación', 'Comprobante de propiedad']),
      estado: 'activo'
    });
    
    // Crear un concepto de pago
    conceptoPago = await Concepto.create({
      nombre: 'Impuesto Predial 2023',
      descripcion: 'Pago anual de impuesto predial',
      monto: 1200.00,
      tipo: 'impuesto',
      departamento_id: departamento.id
    });
    
    // Crear usuarios de prueba
    const salt = await bcrypt.genSalt(10);
    
    // Usuario administrador
    const adminPassword = await bcrypt.hash('admin123', salt);
    adminUser = await Usuario.create({
      nombre: 'Admin',
      apellido: 'Pagos',
      email: 'admin.pagos@example.com',
      password: adminPassword,
      role: 'admin',
      departamento_id: departamento.id,
      estado: 'activo'
    });
    
    // Usuario funcionario
    const userPassword = await bcrypt.hash('user123', salt);
    regularUser = await Usuario.create({
      nombre: 'Cajero',
      apellido: 'Municipal',
      email: 'cajero@example.com',
      password: userPassword,
      role: 'usuario',
      departamento_id: departamento.id,
      estado: 'activo'
    });
    
    // Usuario ciudadano
    const ciudadanoPassword = await bcrypt.hash('ciudadano123', salt);
    ciudadanoUser = await Usuario.create({
      nombre: 'Contribuyente',
      apellido: 'Ejemplo',
      email: 'contribuyente@example.com',
      password: ciudadanoPassword,
      role: 'ciudadano',
      estado: 'activo'
    });
    
    // Obtener tokens para los usuarios
    const adminLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin.pagos@example.com',
        password: 'admin123'
      });
    
    adminToken = adminLoginResponse.body.token;
    
    const userLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'cajero@example.com',
        password: 'user123'
      });
    
    usuarioToken = userLoginResponse.body.token;
    
    const ciudadanoLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'contribuyente@example.com',
        password: 'ciudadano123'
      });
    
    ciudadanoToken = ciudadanoLoginResponse.body.token;
    
    // Crear un trámite de prueba
    tramiteCreado = await Tramite.create({
      tipo_tramite_id: tipoTramite.id,
      usuario_id: ciudadanoUser.id,
      departamento_id: departamento.id,
      folio: 'PRED-2023-001',
      estado: 'aprobado',
      fecha_solicitud: new Date(),
      fecha_actualizacion: new Date(),
      observaciones: 'Trámite listo para pago'
    });
    
    // Crear un pago de prueba
    pagoCreado = await Pago.create({
      tramite_id: tramiteCreado.id,
      usuario_id: ciudadanoUser.id,
      concepto_id: conceptoPago.id,
      monto: 1200.00,
      referencia: 'REF-2023-001',
      estado: 'pendiente',
      fecha_pago: null,
      metodo_pago: null
    });
    
    // Crear un directorio temporal para recibos de pago si no existe
    const uploadsDir = path.join(__dirname, '../../uploads/recibos');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
  });
  
  afterAll(async () => {
    // Limpiar la base de datos después de las pruebas
    await sequelize.close();
  });
  
  describe('GET /api/pagos', () => {
    it('debería permitir a un administrador obtener todos los pagos', async () => {
      const response = await request(app)
        .get('/api/pagos')
        .set('x-access-token', adminToken);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      expect(response.body.some(pago => pago.referencia === 'REF-2023-001')).toBe(true);
    });
    
    it('debería permitir a un funcionario obtener los pagos', async () => {
      const response = await request(app)
        .get('/api/pagos')
        .set('x-access-token', usuarioToken);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
    });
    
    it('debería permitir a un ciudadano obtener solo sus pagos', async () => {
      const response = await request(app)
        .get('/api/pagos')
        .set('x-access-token', ciudadanoToken);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      
      // Verificar que todos los pagos pertenecen al ciudadano
      response.body.forEach(pago => {
        expect(pago.usuario_id).toBe(ciudadanoUser.id);
      });
    });
    
    it('debería rechazar solicitudes sin token', async () => {
      const response = await request(app)
        .get('/api/pagos');
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message');
    });
  });
  
  describe('GET /api/pagos/:id', () => {
    it('debería permitir a un administrador obtener un pago por ID', async () => {
      const response = await request(app)
        .get(`/api/pagos/${pagoCreado.id}`)
        .set('x-access-token', adminToken);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', pagoCreado.id);
      expect(response.body).toHaveProperty('referencia', 'REF-2023-001');
      expect(response.body).toHaveProperty('estado', 'pendiente');
      expect(response.body).toHaveProperty('monto', 1200.00);
    });
    
    it('debería permitir a un ciudadano obtener su propio pago', async () => {
      const response = await request(app)
        .get(`/api/pagos/${pagoCreado.id}`)
        .set('x-access-token', ciudadanoToken);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', pagoCreado.id);
      expect(response.body).toHaveProperty('referencia', 'REF-2023-001');
    });
    
    it('debería rechazar a un ciudadano que intenta acceder al pago de otro', async () => {
      // Crear otro ciudadano
      const salt = await bcrypt.genSalt(10);
      const otroCiudadanoPassword = await bcrypt.hash('otro123', salt);
      const otroCiudadano = await Usuario.create({
        nombre: 'Otro',
        apellido: 'Contribuyente',
        email: 'otro.contribuyente@example.com',
        password: otroCiudadanoPassword,
        role: 'ciudadano',
        estado: 'activo'
      });
      
      // Obtener token para el otro ciudadano
      const otroCiudadanoLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'otro.contribuyente@example.com',
          password: 'otro123'
        });
      
      const otroCiudadanoToken = otroCiudadanoLogin.body.token;
      
      // Intentar acceder al pago del primer ciudadano
      const response = await request(app)
        .get(`/api/pagos/${pagoCreado.id}`)
        .set('x-access-token', otroCiudadanoToken);
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message');
    });
    
    it('debería devolver 404 para un ID de pago inexistente', async () => {
      const response = await request(app)
        .get('/api/pagos/999')
        .set('x-access-token', adminToken);
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message');
    });
  });
  
  describe('POST /api/pagos', () => {
    it('debería permitir a un funcionario registrar un nuevo pago', async () => {
      const nuevoPago = {
        tramite_id: tramiteCreado.id,
        usuario_id: ciudadanoUser.id,
        concepto_id: conceptoPago.id,
        monto: 1200.00,
        metodo_pago: 'efectivo',
        observaciones: 'Pago en ventanilla'
      };
      
      const response = await request(app)
        .post('/api/pagos')
        .set('x-access-token', usuarioToken)
        .send(nuevoPago);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('referencia');
      expect(response.body).toHaveProperty('estado', 'pagado');
      expect(response.body).toHaveProperty('fecha_pago');
      expect(response.body).toHaveProperty('metodo_pago', 'efectivo');
      
      // Verificar que el pago fue creado en la base de datos
      const pagoRegistrado = await Pago.findByPk(response.body.id);
      expect(pagoRegistrado).not.toBeNull();
      expect(pagoRegistrado.estado).toBe('pagado');
    });
    
    it('debería rechazar la creación de un pago con datos incompletos', async () => {
      const pagoIncompleto = {
        tramite_id: tramiteCreado.id,
        // Falta usuario_id
        concepto_id: conceptoPago.id,
        monto: 1200.00
      };
      
      const response = await request(app)
        .post('/api/pagos')
        .set('x-access-token', usuarioToken)
        .send(pagoIncompleto);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
    
    it('debería rechazar a ciudadanos que intentan registrar pagos directamente', async () => {
      const nuevoPago = {
        tramite_id: tramiteCreado.id,
        usuario_id: ciudadanoUser.id,
        concepto_id: conceptoPago.id,
        monto: 1200.00,
        metodo_pago: 'efectivo'
      };
      
      const response = await request(app)
        .post('/api/pagos')
        .set('x-access-token', ciudadanoToken)
        .send(nuevoPago);
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message');
    });
  });
  
  describe('PUT /api/pagos/:id/estado', () => {
    let pagoParaActualizar;
    
    beforeEach(async () => {
      // Crear un pago para actualizar en cada prueba
      pagoParaActualizar = await Pago.create({
        tramite_id: tramiteCreado.id,
        usuario_id: ciudadanoUser.id,
        concepto_id: conceptoPago.id,
        monto: 1200.00,
        referencia: `REF-${Date.now()}`,
        estado: 'pendiente',
        fecha_pago: null,
        metodo_pago: null
      });
    });
    
    it('debería permitir a un funcionario actualizar el estado de un pago a pagado', async () => {
      const actualizacionEstado = {
        estado: 'pagado',
        metodo_pago: 'tarjeta',
        observaciones: 'Pago con tarjeta de crédito'
      };
      
      const response = await request(app)
        .put(`/api/pagos/${pagoParaActualizar.id}/estado`)
        .set('x-access-token', usuarioToken)
        .send(actualizacionEstado);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', pagoParaActualizar.id);
      expect(response.body).toHaveProperty('estado', 'pagado');
      expect(response.body).toHaveProperty('metodo_pago', 'tarjeta');
      expect(response.body).toHaveProperty('fecha_pago');
      
      // Verificar que el pago fue actualizado en la base de datos
      const pagoActualizado = await Pago.findByPk(pagoParaActualizar.id);
      expect(pagoActualizado.estado).toBe('pagado');
      expect(pagoActualizado.metodo_pago).toBe('tarjeta');
    });
    
    it('debería permitir a un funcionario actualizar el estado de un pago a cancelado', async () => {
      const actualizacionEstado = {
        estado: 'cancelado',
        observaciones: 'Pago cancelado por solicitud del contribuyente'
      };
      
      const response = await request(app)
        .put(`/api/pagos/${pagoParaActualizar.id}/estado`)
        .set('x-access-token', usuarioToken)
        .send(actualizacionEstado);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', pagoParaActualizar.id);
      expect(response.body).toHaveProperty('estado', 'cancelado');
      
      // Verificar que el pago fue actualizado en la base de datos
      const pagoActualizado = await Pago.findByPk(pagoParaActualizar.id);
      expect(pagoActualizado.estado).toBe('cancelado');
    });
    
    it('debería rechazar a ciudadanos que intentan actualizar el estado de un pago', async () => {
      const actualizacionEstado = {
        estado: 'pagado',
        metodo_pago: 'efectivo'
      };
      
      const response = await request(app)
        .put(`/api/pagos/${pagoParaActualizar.id}/estado`)
        .set('x-access-token', ciudadanoToken)
        .send(actualizacionEstado);
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message');
      
      // Verificar que el estado no cambió
      const pagoNoModificado = await Pago.findByPk(pagoParaActualizar.id);
      expect(pagoNoModificado.estado).toBe('pendiente');
    });
    
    it('debería rechazar actualización con estado inválido', async () => {
      const actualizacionInvalida = {
        estado: 'estado_inexistente'
      };
      
      const response = await request(app)
        .put(`/api/pagos/${pagoParaActualizar.id}/estado`)
        .set('x-access-token', usuarioToken)
        .send(actualizacionInvalida);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });
  
  describe('GET /api/pagos/:id/recibo', () => {
    let pagoConRecibo;
    
    beforeAll(async () => {
      // Crear un pago con estado pagado para generar recibo
      pagoConRecibo = await Pago.create({
        tramite_id: tramiteCreado.id,
        usuario_id: ciudadanoUser.id,
        concepto_id: conceptoPago.id,
        monto: 1200.00,
        referencia: 'REF-RECIBO-001',
        estado: 'pagado',
        fecha_pago: new Date(),
        metodo_pago: 'efectivo'
      });
    });
    
    it('debería permitir a un funcionario generar el recibo de un pago', async () => {
      const response = await request(app)
        .get(`/api/pagos/${pagoConRecibo.id}/recibo`)
        .set('x-access-token', usuarioToken)
        .set('Accept', 'application/pdf');
      
      expect(response.status).toBe(200);
      expect(response.type).toBe('application/pdf');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.headers['content-disposition']).toContain(`recibo-${pagoConRecibo.referencia}.pdf`);
    });
    
    it('debería permitir a un ciudadano generar el recibo de su propio pago', async () => {
      const response = await request(app)
        .get(`/api/pagos/${pagoConRecibo.id}/recibo`)
        .set('x-access-token', ciudadanoToken)
        .set('Accept', 'application/pdf');
      
      expect(response.status).toBe(200);
      expect(response.type).toBe('application/pdf');
    });
    
    it('debería rechazar la generación de recibo para un pago no pagado', async () => {
      // Crear un pago pendiente
      const pagoPendiente = await Pago.create({
        tramite_id: tramiteCreado.id,
        usuario_id: ciudadanoUser.id,
        concepto_id: conceptoPago.id,
        monto: 1200.00,
        referencia: 'REF-PENDIENTE-001',
        estado: 'pendiente',
        fecha_pago: null,
        metodo_pago: null
      });
      
      const response = await request(app)
        .get(`/api/pagos/${pagoPendiente.id}/recibo`)
        .set('x-access-token', usuarioToken)
        .set('Accept', 'application/pdf');
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
    
    it('debería rechazar a un ciudadano que intenta generar el recibo del pago de otro', async () => {
      // Crear otro ciudadano
      const salt = await bcrypt.genSalt(10);
      const otroCiudadanoPassword = await bcrypt.hash('otro123', salt);
      const otroCiudadano = await Usuario.create({
        nombre: 'Otro',
        apellido: 'Contribuyente',
        email: 'otro.contribuyente2@example.com',
        password: otroCiudadanoPassword,
        role: 'ciudadano',
        estado: 'activo'
      });
      
      // Obtener token para el otro ciudadano
      const otroCiudadanoLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'otro.contribuyente2@example.com',
          password: 'otro123'
        });
      
      const otroCiudadanoToken = otroCiudadanoLogin.body.token;
      
      // Intentar generar el recibo del pago del primer ciudadano
      const response = await request(app)
        .get(`/api/pagos/${pagoConRecibo.id}/recibo`)
        .set('x-access-token', otroCiudadanoToken)
        .set('Accept', 'application/pdf');
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message');
    });
  });
});
