/**
 * Pruebas de integración para el controlador de proveedores
 */

const request = require('supertest');
const app = require('../../src/app');
const { sequelize } = require('../../src/config/database');
const { Usuario, Departamento, Proveedor, Contrato } = require('../../src/models');
const bcrypt = require('bcryptjs');

describe('Proveedores Integration Tests', () => {
  let adminToken;
  let usuarioToken;
  let ciudadanoToken;
  let adminUser;
  let regularUser;
  let ciudadanoUser;
  let departamento;
  let proveedorCreado;
  
  beforeAll(async () => {
    // Configurar la base de datos de prueba
    await sequelize.sync({ force: true });
    
    // Crear un departamento de prueba
    departamento = await Departamento.create({
      nombre: 'Adquisiciones',
      descripcion: 'Departamento encargado de compras y proveedores'
    });
    
    // Crear usuarios de prueba
    const salt = await bcrypt.genSalt(10);
    
    // Usuario administrador
    const adminPassword = await bcrypt.hash('admin123', salt);
    adminUser = await Usuario.create({
      nombre: 'Admin',
      apellido: 'Proveedores',
      email: 'admin.proveedores@example.com',
      password: adminPassword,
      role: 'admin',
      departamento_id: departamento.id,
      estado: 'activo'
    });
    
    // Usuario funcionario
    const userPassword = await bcrypt.hash('user123', salt);
    regularUser = await Usuario.create({
      nombre: 'Comprador',
      apellido: 'Municipal',
      email: 'comprador@example.com',
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
      email: 'ciudadano.proveedores@example.com',
      password: ciudadanoPassword,
      role: 'ciudadano',
      estado: 'activo'
    });
    
    // Obtener tokens para los usuarios
    const adminLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin.proveedores@example.com',
        password: 'admin123'
      });
    
    adminToken = adminLoginResponse.body.token;
    
    const userLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'comprador@example.com',
        password: 'user123'
      });
    
    usuarioToken = userLoginResponse.body.token;
    
    const ciudadanoLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'ciudadano.proveedores@example.com',
        password: 'ciudadano123'
      });
    
    ciudadanoToken = ciudadanoLoginResponse.body.token;
    
    // Crear un proveedor de prueba
    proveedorCreado = await Proveedor.create({
      nombre: 'Construcciones XYZ',
      rfc: 'CXY010101ABC',
      direccion: 'Av. Principal 123, Ciudad',
      telefono: '5551234567',
      email: 'contacto@construccionesxyz.com',
      tipo: 'construccion',
      estado: 'activo',
      usuario_id: adminUser.id
    });
  });
  
  afterAll(async () => {
    // Limpiar la base de datos después de las pruebas
    await sequelize.close();
  });
  
  describe('GET /api/proveedores', () => {
    it('debería permitir a un administrador obtener todos los proveedores', async () => {
      const response = await request(app)
        .get('/api/proveedores')
        .set('x-access-token', adminToken);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      expect(response.body.some(proveedor => proveedor.rfc === 'CXY010101ABC')).toBe(true);
    });
    
    it('debería permitir a un funcionario obtener todos los proveedores', async () => {
      const response = await request(app)
        .get('/api/proveedores')
        .set('x-access-token', usuarioToken);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
    });
    
    it('debería rechazar a ciudadanos que intentan acceder a los proveedores', async () => {
      const response = await request(app)
        .get('/api/proveedores')
        .set('x-access-token', ciudadanoToken);
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message');
    });
    
    it('debería rechazar solicitudes sin token', async () => {
      const response = await request(app)
        .get('/api/proveedores');
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message');
    });
  });
  
  describe('GET /api/proveedores/:id', () => {
    it('debería permitir a un administrador obtener un proveedor por ID', async () => {
      const response = await request(app)
        .get(`/api/proveedores/${proveedorCreado.id}`)
        .set('x-access-token', adminToken);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', proveedorCreado.id);
      expect(response.body).toHaveProperty('nombre', 'Construcciones XYZ');
      expect(response.body).toHaveProperty('rfc', 'CXY010101ABC');
      expect(response.body).toHaveProperty('estado', 'activo');
    });
    
    it('debería permitir a un funcionario obtener un proveedor por ID', async () => {
      const response = await request(app)
        .get(`/api/proveedores/${proveedorCreado.id}`)
        .set('x-access-token', usuarioToken);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', proveedorCreado.id);
    });
    
    it('debería rechazar a ciudadanos que intentan acceder a un proveedor', async () => {
      const response = await request(app)
        .get(`/api/proveedores/${proveedorCreado.id}`)
        .set('x-access-token', ciudadanoToken);
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message');
    });
    
    it('debería devolver 404 para un ID de proveedor inexistente', async () => {
      const response = await request(app)
        .get('/api/proveedores/999')
        .set('x-access-token', adminToken);
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message');
    });
  });
  
  describe('POST /api/proveedores', () => {
    it('debería permitir a un administrador crear un nuevo proveedor', async () => {
      const nuevoProveedor = {
        nombre: 'Suministros ABC',
        rfc: 'SAB020202DEF',
        direccion: 'Calle Secundaria 456, Ciudad',
        telefono: '5559876543',
        email: 'contacto@suministrosabc.com',
        tipo: 'suministros',
        estado: 'activo'
      };
      
      const response = await request(app)
        .post('/api/proveedores')
        .set('x-access-token', adminToken)
        .send(nuevoProveedor);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('nombre', 'Suministros ABC');
      expect(response.body).toHaveProperty('rfc', 'SAB020202DEF');
      expect(response.body).toHaveProperty('usuario_id', adminUser.id);
      
      // Verificar que el proveedor fue creado en la base de datos
      const proveedorCreado = await Proveedor.findOne({ where: { rfc: 'SAB020202DEF' } });
      expect(proveedorCreado).not.toBeNull();
    });
    
    it('debería permitir a un funcionario crear un nuevo proveedor', async () => {
      const nuevoProveedor = {
        nombre: 'Servicios Municipales',
        rfc: 'SMU030303GHI',
        direccion: 'Plaza Principal 789, Ciudad',
        telefono: '5551112233',
        email: 'contacto@serviciosmunicipales.com',
        tipo: 'servicios',
        estado: 'activo'
      };
      
      const response = await request(app)
        .post('/api/proveedores')
        .set('x-access-token', usuarioToken)
        .send(nuevoProveedor);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('nombre', 'Servicios Municipales');
      expect(response.body).toHaveProperty('usuario_id', regularUser.id);
    });
    
    it('debería rechazar la creación de un proveedor con RFC duplicado', async () => {
      const proveedorDuplicado = {
        nombre: 'Construcciones XYZ Duplicado',
        rfc: 'CXY010101ABC', // RFC ya existente
        direccion: 'Otra Dirección 123, Ciudad',
        telefono: '5551234567',
        email: 'otro@construccionesxyz.com',
        tipo: 'construccion',
        estado: 'activo'
      };
      
      const response = await request(app)
        .post('/api/proveedores')
        .set('x-access-token', adminToken)
        .send(proveedorDuplicado);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
    
    it('debería rechazar la creación de un proveedor con datos incompletos', async () => {
      const proveedorIncompleto = {
        nombre: 'Proveedor Incompleto',
        // Falta RFC
        direccion: 'Alguna Dirección, Ciudad',
        telefono: '5551234567',
        email: 'incompleto@example.com'
      };
      
      const response = await request(app)
        .post('/api/proveedores')
        .set('x-access-token', adminToken)
        .send(proveedorIncompleto);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
    
    it('debería rechazar a ciudadanos que intentan crear proveedores', async () => {
      const nuevoProveedor = {
        nombre: 'Intento Ciudadano',
        rfc: 'ICU040404JKL',
        direccion: 'Calle Ciudadano 123, Ciudad',
        telefono: '5554445566',
        email: 'ciudadano@intento.com',
        tipo: 'servicios',
        estado: 'activo'
      };
      
      const response = await request(app)
        .post('/api/proveedores')
        .set('x-access-token', ciudadanoToken)
        .send(nuevoProveedor);
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message');
    });
  });
  
  describe('PUT /api/proveedores/:id', () => {
    it('debería permitir a un administrador actualizar un proveedor', async () => {
      const actualizacionProveedor = {
        nombre: 'Construcciones XYZ Actualizado',
        telefono: '5559998877',
        email: 'nuevo@construccionesxyz.com'
      };
      
      const response = await request(app)
        .put(`/api/proveedores/${proveedorCreado.id}`)
        .set('x-access-token', adminToken)
        .send(actualizacionProveedor);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', proveedorCreado.id);
      expect(response.body).toHaveProperty('nombre', 'Construcciones XYZ Actualizado');
      expect(response.body).toHaveProperty('telefono', '5559998877');
      expect(response.body).toHaveProperty('email', 'nuevo@construccionesxyz.com');
      
      // Verificar que el proveedor fue actualizado en la base de datos
      const proveedorActualizado = await Proveedor.findByPk(proveedorCreado.id);
      expect(proveedorActualizado.nombre).toBe('Construcciones XYZ Actualizado');
    });
    
    it('debería permitir a un funcionario actualizar un proveedor', async () => {
      const actualizacionProveedor = {
        direccion: 'Nueva Dirección 456, Ciudad',
        telefono: '5551234567'
      };
      
      const response = await request(app)
        .put(`/api/proveedores/${proveedorCreado.id}`)
        .set('x-access-token', usuarioToken)
        .send(actualizacionProveedor);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', proveedorCreado.id);
      expect(response.body).toHaveProperty('direccion', 'Nueva Dirección 456, Ciudad');
    });
    
    it('debería rechazar la actualización con RFC duplicado', async () => {
      // Primero crear otro proveedor
      const otroProveedor = await Proveedor.create({
        nombre: 'Otro Proveedor',
        rfc: 'OPR050505MNO',
        direccion: 'Otra Calle 789, Ciudad',
        telefono: '5552223344',
        email: 'contacto@otroproveedor.com',
        tipo: 'servicios',
        estado: 'activo',
        usuario_id: adminUser.id
      });
      
      // Intentar actualizar con RFC duplicado
      const actualizacionInvalida = {
        rfc: 'OPR050505MNO' // RFC de otro proveedor
      };
      
      const response = await request(app)
        .put(`/api/proveedores/${proveedorCreado.id}`)
        .set('x-access-token', adminToken)
        .send(actualizacionInvalida);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
    
    it('debería rechazar a ciudadanos que intentan actualizar proveedores', async () => {
      const actualizacionProveedor = {
        nombre: 'Intento Actualización Ciudadano'
      };
      
      const response = await request(app)
        .put(`/api/proveedores/${proveedorCreado.id}`)
        .set('x-access-token', ciudadanoToken)
        .send(actualizacionProveedor);
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message');
    });
  });
  
  describe('PUT /api/proveedores/:id/estado', () => {
    it('debería permitir a un administrador cambiar el estado de un proveedor', async () => {
      const actualizacionEstado = {
        estado: 'inactivo',
        motivo: 'Proveedor suspendido temporalmente'
      };
      
      const response = await request(app)
        .put(`/api/proveedores/${proveedorCreado.id}/estado`)
        .set('x-access-token', adminToken)
        .send(actualizacionEstado);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', proveedorCreado.id);
      expect(response.body).toHaveProperty('estado', 'inactivo');
      
      // Verificar que el estado fue actualizado en la base de datos
      const proveedorActualizado = await Proveedor.findByPk(proveedorCreado.id);
      expect(proveedorActualizado.estado).toBe('inactivo');
    });
    
    it('debería rechazar a funcionarios que intentan cambiar el estado de un proveedor', async () => {
      const actualizacionEstado = {
        estado: 'activo',
        motivo: 'Reactivación de proveedor'
      };
      
      const response = await request(app)
        .put(`/api/proveedores/${proveedorCreado.id}/estado`)
        .set('x-access-token', usuarioToken)
        .send(actualizacionEstado);
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message');
      
      // Verificar que el estado no cambió
      const proveedorNoModificado = await Proveedor.findByPk(proveedorCreado.id);
      expect(proveedorNoModificado.estado).toBe('inactivo');
    });
  });
  
  describe('POST /api/proveedores/:id/contratos', () => {
    it('debería permitir a un administrador crear un nuevo contrato para un proveedor', async () => {
      const nuevoContrato = {
        numero: 'CONT-2023-001',
        descripcion: 'Contrato para suministro de materiales',
        monto: 500000.00,
        fecha_inicio: '2023-01-01',
        fecha_fin: '2023-12-31',
        tipo: 'suministro',
        estado: 'vigente'
      };
      
      const response = await request(app)
        .post(`/api/proveedores/${proveedorCreado.id}/contratos`)
        .set('x-access-token', adminToken)
        .send(nuevoContrato);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('proveedor_id', proveedorCreado.id);
      expect(response.body).toHaveProperty('numero', 'CONT-2023-001');
      expect(response.body).toHaveProperty('monto', 500000.00);
      expect(response.body).toHaveProperty('estado', 'vigente');
      expect(response.body).toHaveProperty('usuario_id', adminUser.id);
      
      // Verificar que el contrato fue creado en la base de datos
      const contratoCreado = await Contrato.findOne({ where: { numero: 'CONT-2023-001' } });
      expect(contratoCreado).not.toBeNull();
    });
    
    it('debería rechazar la creación de un contrato con número duplicado', async () => {
      const contratoDuplicado = {
        numero: 'CONT-2023-001', // Número ya existente
        descripcion: 'Otro contrato con número duplicado',
        monto: 300000.00,
        fecha_inicio: '2023-02-01',
        fecha_fin: '2023-12-31',
        tipo: 'servicio',
        estado: 'vigente'
      };
      
      const response = await request(app)
        .post(`/api/proveedores/${proveedorCreado.id}/contratos`)
        .set('x-access-token', adminToken)
        .send(contratoDuplicado);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
    
    it('debería rechazar a funcionarios que intentan crear contratos', async () => {
      const nuevoContrato = {
        numero: 'CONT-2023-002',
        descripcion: 'Intento de contrato por funcionario',
        monto: 200000.00,
        fecha_inicio: '2023-03-01',
        fecha_fin: '2023-12-31',
        tipo: 'servicio',
        estado: 'vigente'
      };
      
      const response = await request(app)
        .post(`/api/proveedores/${proveedorCreado.id}/contratos`)
        .set('x-access-token', usuarioToken)
        .send(nuevoContrato);
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message');
    });
  });
  
  describe('GET /api/proveedores/:id/contratos', () => {
    it('debería permitir a un administrador obtener los contratos de un proveedor', async () => {
      const response = await request(app)
        .get(`/api/proveedores/${proveedorCreado.id}/contratos`)
        .set('x-access-token', adminToken);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      expect(response.body.some(contrato => contrato.numero === 'CONT-2023-001')).toBe(true);
    });
    
    it('debería permitir a un funcionario obtener los contratos de un proveedor', async () => {
      const response = await request(app)
        .get(`/api/proveedores/${proveedorCreado.id}/contratos`)
        .set('x-access-token', usuarioToken);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
    });
    
    it('debería rechazar a ciudadanos que intentan acceder a los contratos', async () => {
      const response = await request(app)
        .get(`/api/proveedores/${proveedorCreado.id}/contratos`)
        .set('x-access-token', ciudadanoToken);
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message');
    });
  });
});