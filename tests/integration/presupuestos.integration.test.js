/**
 * Pruebas de integración para el controlador de presupuestos
 */

const request = require('supertest');
const app = require('../../src/app');
const { sequelize } = require('../../src/config/database');
const { Usuario, Departamento, Presupuesto, PartidaPresupuestal, MovimientoPresupuestal } = require('../../src/models');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

describe('Presupuestos Integration Tests', () => {
  let adminToken;
  let usuarioToken;
  let ciudadanoToken;
  let adminUser;
  let regularUser;
  let ciudadanoUser;
  let departamento;
  let presupuestoAnual;
  let partidaPresupuestal;
  
  beforeAll(async () => {
    // Configurar la base de datos de prueba
    await sequelize.sync({ force: true });
    
    // Crear un departamento de prueba
    departamento = await Departamento.create({
      nombre: 'Finanzas Municipales',
      descripcion: 'Departamento encargado de la gestión financiera'
    });
    
    // Crear usuarios de prueba
    const salt = await bcrypt.genSalt(10);
    
    // Usuario superadministrador
    const adminPassword = await bcrypt.hash('admin123', salt);
    adminUser = await Usuario.create({
      nombre: 'Superadmin',
      apellido: 'Finanzas',
      email: 'admin.finanzas@example.com',
      password: adminPassword,
      role: 'superadmin',
      departamento_id: departamento.id,
      estado: 'activo'
    });
    
    // Usuario funcionario
    const userPassword = await bcrypt.hash('user123', salt);
    regularUser = await Usuario.create({
      nombre: 'Contador',
      apellido: 'Municipal',
      email: 'contador@example.com',
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
      email: 'ciudadano.finanzas@example.com',
      password: ciudadanoPassword,
      role: 'ciudadano',
      estado: 'activo'
    });
    
    // Obtener tokens para los usuarios
    const adminLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin.finanzas@example.com',
        password: 'admin123'
      });
    
    adminToken = adminLoginResponse.body.token;
    
    const userLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'contador@example.com',
        password: 'user123'
      });
    
    usuarioToken = userLoginResponse.body.token;
    
    const ciudadanoLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'ciudadano.finanzas@example.com',
        password: 'ciudadano123'
      });
    
    ciudadanoToken = ciudadanoLoginResponse.body.token;
    
    // Crear un presupuesto anual
    presupuestoAnual = await Presupuesto.create({
      año: 2023,
      monto_total: 10000000.00,
      descripcion: 'Presupuesto anual 2023',
      estado: 'aprobado',
      fecha_aprobacion: new Date(),
      usuario_id: adminUser.id
    });
    
    // Crear una partida presupuestal
    partidaPresupuestal = await PartidaPresupuestal.create({
      presupuesto_id: presupuestoAnual.id,
      departamento_id: departamento.id,
      nombre: 'Obras Públicas',
      descripcion: 'Fondos para obras públicas municipales',
      monto_asignado: 2000000.00,
      monto_ejercido: 500000.00,
      codigo: 'OP-2023-001'
    });
    
    // Crear un directorio temporal para reportes si no existe
    const uploadsDir = path.join(__dirname, '../../uploads/reportes');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
  });
  
  afterAll(async () => {
    // Limpiar la base de datos después de las pruebas
    await sequelize.close();
  });
  
  describe('GET /api/presupuestos', () => {
    it('debería permitir a un administrador obtener todos los presupuestos', async () => {
      const response = await request(app)
        .get('/api/presupuestos')
        .set('x-access-token', adminToken);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      expect(response.body.some(presupuesto => presupuesto.año === 2023)).toBe(true);
    });
    
    it('debería permitir a un funcionario obtener los presupuestos', async () => {
      const response = await request(app)
        .get('/api/presupuestos')
        .set('x-access-token', usuarioToken);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
    });
    
    it('debería rechazar a ciudadanos que intentan acceder a los presupuestos', async () => {
      const response = await request(app)
        .get('/api/presupuestos')
        .set('x-access-token', ciudadanoToken);
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message');
    });
    
    it('debería rechazar solicitudes sin token', async () => {
      const response = await request(app)
        .get('/api/presupuestos');
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message');
    });
  });
  
  describe('GET /api/presupuestos/:id', () => {
    it('debería permitir a un administrador obtener un presupuesto por ID', async () => {
      const response = await request(app)
        .get(`/api/presupuestos/${presupuestoAnual.id}`)
        .set('x-access-token', adminToken);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', presupuestoAnual.id);
      expect(response.body).toHaveProperty('año', 2023);
      expect(response.body).toHaveProperty('monto_total', 10000000.00);
      expect(response.body).toHaveProperty('estado', 'aprobado');
    });
    
    it('debería permitir a un funcionario obtener un presupuesto por ID', async () => {
      const response = await request(app)
        .get(`/api/presupuestos/${presupuestoAnual.id}`)
        .set('x-access-token', usuarioToken);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', presupuestoAnual.id);
    });
    
    it('debería rechazar a ciudadanos que intentan acceder a un presupuesto', async () => {
      const response = await request(app)
        .get(`/api/presupuestos/${presupuestoAnual.id}`)
        .set('x-access-token', ciudadanoToken);
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message');
    });
    
    it('debería devolver 404 para un ID de presupuesto inexistente', async () => {
      const response = await request(app)
        .get('/api/presupuestos/999')
        .set('x-access-token', adminToken);
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message');
    });
  });
  
  describe('POST /api/presupuestos', () => {
    it('debería permitir a un administrador crear un nuevo presupuesto', async () => {
      const nuevoPresupuesto = {
        año: 2024,
        monto_total: 12000000.00,
        descripcion: 'Presupuesto anual 2024',
        estado: 'borrador'
      };
      
      const response = await request(app)
        .post('/api/presupuestos')
        .set('x-access-token', adminToken)
        .send(nuevoPresupuesto);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('año', 2024);
      expect(response.body).toHaveProperty('monto_total', 12000000.00);
      expect(response.body).toHaveProperty('estado', 'borrador');
      expect(response.body).toHaveProperty('usuario_id', adminUser.id);
      
      // Verificar que el presupuesto fue creado en la base de datos
      const presupuestoCreado = await Presupuesto.findByPk(response.body.id);
      expect(presupuestoCreado).not.toBeNull();
      expect(presupuestoCreado.año).toBe(2024);
    });
    
    it('debería rechazar la creación de un presupuesto con año duplicado', async () => {
      const presupuestoDuplicado = {
        año: 2023, // Año ya existente
        monto_total: 11000000.00,
        descripcion: 'Intento de presupuesto duplicado',
        estado: 'borrador'
      };
      
      const response = await request(app)
        .post('/api/presupuestos')
        .set('x-access-token', adminToken)
        .send(presupuestoDuplicado);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
    
    it('debería rechazar a funcionarios que intentan crear presupuestos', async () => {
      const nuevoPresupuesto = {
        año: 2025,
        monto_total: 13000000.00,
        descripcion: 'Presupuesto anual 2025',
        estado: 'borrador'
      };
      
      const response = await request(app)
        .post('/api/presupuestos')
        .set('x-access-token', usuarioToken)
        .send(nuevoPresupuesto);
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message');
    });
  });
  
  describe('PUT /api/presupuestos/:id', () => {
    it('debería permitir a un administrador actualizar un presupuesto', async () => {
      const actualizacionPresupuesto = {
        monto_total: 10500000.00,
        descripcion: 'Presupuesto anual 2023 (actualizado)'
      };
      
      const response = await request(app)
        .put(`/api/presupuestos/${presupuestoAnual.id}`)
        .set('x-access-token', adminToken)
        .send(actualizacionPresupuesto);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', presupuestoAnual.id);
      expect(response.body).toHaveProperty('monto_total', 10500000.00);
      expect(response.body).toHaveProperty('descripcion', 'Presupuesto anual 2023 (actualizado)');
      
      // Verificar que el presupuesto fue actualizado en la base de datos
      const presupuestoActualizado = await Presupuesto.findByPk(presupuestoAnual.id);
      expect(presupuestoActualizado.monto_total).toBe(10500000.00);
    });
    
    it('debería rechazar la actualización de un presupuesto aprobado a borrador', async () => {
      const actualizacionInvalida = {
        estado: 'borrador' // No se puede cambiar de aprobado a borrador
      };
      
      const response = await request(app)
        .put(`/api/presupuestos/${presupuestoAnual.id}`)
        .set('x-access-token', adminToken)
        .send(actualizacionInvalida);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      
      // Verificar que el estado no cambió
      const presupuestoNoModificado = await Presupuesto.findByPk(presupuestoAnual.id);
      expect(presupuestoNoModificado.estado).toBe('aprobado');
    });
    
    it('debería rechazar a funcionarios que intentan actualizar presupuestos', async () => {
      const actualizacionPresupuesto = {
        descripcion: 'Intento de modificación por funcionario'
      };
      
      const response = await request(app)
        .put(`/api/presupuestos/${presupuestoAnual.id}`)
        .set('x-access-token', usuarioToken)
        .send(actualizacionPresupuesto);
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message');
    });
  });
  
  describe('PUT /api/presupuestos/:id/aprobar', () => {
    let presupuestoBorrador;
    
    beforeEach(async () => {
      // Crear un presupuesto en estado borrador para cada prueba
      presupuestoBorrador = await Presupuesto.create({
        año: Date.now(), // Usar timestamp para evitar duplicados
        monto_total: 15000000.00,
        descripcion: 'Presupuesto para aprobar',
        estado: 'borrador',
        usuario_id: adminUser.id
      });
    });
    
    it('debería permitir a un administrador aprobar un presupuesto', async () => {
      const response = await request(app)
        .put(`/api/presupuestos/${presupuestoBorrador.id}/aprobar`)
        .set('x-access-token', adminToken);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', presupuestoBorrador.id);
      expect(response.body).toHaveProperty('estado', 'aprobado');
      expect(response.body).toHaveProperty('fecha_aprobacion');
      
      // Verificar que el presupuesto fue aprobado en la base de datos
      const presupuestoAprobado = await Presupuesto.findByPk(presupuestoBorrador.id);
      expect(presupuestoAprobado.estado).toBe('aprobado');
      expect(presupuestoAprobado.fecha_aprobacion).not.toBeNull();
    });
    
    it('debería rechazar la aprobación de un presupuesto ya aprobado', async () => {
      // Primero aprobar el presupuesto
      await request(app)
        .put(`/api/presupuestos/${presupuestoBorrador.id}/aprobar`)
        .set('x-access-token', adminToken);
      
      // Intentar aprobar nuevamente
      const response = await request(app)
        .put(`/api/presupuestos/${presupuestoBorrador.id}/aprobar`)
        .set('x-access-token', adminToken);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
    
    it('debería rechazar a funcionarios que intentan aprobar presupuestos', async () => {
      const response = await request(app)
        .put(`/api/presupuestos/${presupuestoBorrador.id}/aprobar`)
        .set('x-access-token', usuarioToken);
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message');
      
      // Verificar que el presupuesto no fue aprobado
      const presupuestoNoAprobado = await Presupuesto.findByPk(presupuestoBorrador.id);
      expect(presupuestoNoAprobado.estado).toBe('borrador');
    });
  });
  
  describe('GET /api/presupuestos/:id/partidas', () => {
    it('debería permitir a un administrador obtener las partidas de un presupuesto', async () => {
      const response = await request(app)
        .get(`/api/presupuestos/${presupuestoAnual.id}/partidas`)
        .set('x-access-token', adminToken);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      expect(response.body.some(partida => partida.nombre === 'Obras Públicas')).toBe(true);
    });
    
    it('debería permitir a un funcionario obtener las partidas de un presupuesto', async () => {
      const response = await request(app)
        .get(`/api/presupuestos/${presupuestoAnual.id}/partidas`)
        .set('x-access-token', usuarioToken);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
    });
    
    it('debería rechazar a ciudadanos que intentan acceder a las partidas', async () => {
      const response = await request(app)
        .get(`/api/presupuestos/${presupuestoAnual.id}/partidas`)
        .set('x-access-token', ciudadanoToken);
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message');
    });
  });
  
  describe('POST /api/presupuestos/:id/partidas', () => {
    it('debería permitir a un administrador crear una nueva partida presupuestal', async () => {
      const nuevaPartida = {
        departamento_id: departamento.id,
        nombre: 'Servicios Públicos',
        descripcion: 'Fondos para servicios públicos municipales',
        monto_asignado: 1500000.00,
        codigo: 'SP-2023-001'
      };
      
      const response = await request(app)
        .post(`/api/presupuestos/${presupuestoAnual.id}/partidas`)
        .set('x-access-token', adminToken)
        .send(nuevaPartida);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('presupuesto_id', presupuestoAnual.id);
      expect(response.body).toHaveProperty('nombre', 'Servicios Públicos');
      expect(response.body).toHaveProperty('monto_asignado', 1500000.00);
      expect(response.body).toHaveProperty('monto_ejercido', 0);
      
      // Verificar que la partida fue creada en la base de datos
      const partidaCreada = await PartidaPresupuestal.findByPk(response.body.id);
      expect(partidaCreada).not.toBeNull();
      expect(partidaCreada.nombre).toBe('Servicios Públicos');
    });
    
    it('debería rechazar la creación de una partida con código duplicado', async () => {
      const partidaDuplicada = {
        departamento_id: departamento.id,
        nombre: 'Otra Partida',
        descripcion: 'Intento de partida con código duplicado',
        monto_asignado: 1000000.00,
        codigo: 'SP-2023-001' // Código ya existente
      };
      
      const response = await request(app)
        .post(`/api/presupuestos/${presupuestoAnual.id}/partidas`)
        .set('x-access-token', adminToken)
        .send(partidaDuplicada);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
    
    it('debería rechazar a funcionarios que intentan crear partidas', async () => {
      const nuevaPartida = {
        departamento_id: departamento.id,
        nombre: 'Intento Funcionario',
        descripcion: 'Intento de creación por funcionario',
        monto_asignado: 1000000.00,
        codigo: 'IF-2023-001'
      };
      
      const response = await request(app)
        .post(`/api/presupuestos/${presupuestoAnual.id}/partidas`)
        .set('x-access-token', usuarioToken)
        .send(nuevaPartida);
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message');
    });
  });
  
  describe('POST /api/presupuestos/partidas/:id/movimientos', () => {
    it('debería permitir a un administrador registrar un movimiento presupuestal', async () => {
      const nuevoMovimiento = {
        tipo: 'gasto',
        monto: 100000.00,
        concepto: 'Pago a proveedor de materiales',
        referencia: 'FAC-2023-001'
      };
      
      const response = await request(app)
        .post(`/api/presupuestos/partidas/${partidaPresupuestal.id}/movimientos`)
        .set('x-access-token', adminToken)
        .send(nuevoMovimiento);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('partida_id', partidaPresupuestal.id);
      expect(response.body).toHaveProperty('tipo', 'gasto');
      expect(response.body).toHaveProperty('monto', 100000.00);
      expect(response.body).toHaveProperty('usuario_id', adminUser.id);
      
      // Verificar que el movimiento fue creado en la base de datos
      const movimientoCreado = await MovimientoPresupuestal.findByPk(response.body.id);
      expect(movimientoCreado).not.toBeNull();
      
      // Verificar que el monto ejercido de la partida fue actualizado
      const partidaActualizada = await PartidaPresupuestal.findByPk(partidaPresupuestal.id);
      expect(partidaActualizada.monto_ejercido).toBe(600000.00); // 500000 + 100000
    });
    
    it('debería permitir a un funcionario registrar un movimiento presupuestal', async () => {
      const nuevoMovimiento = {
        tipo: 'gasto',
        monto: 50000.00,
        concepto: 'Pago de servicios',
        referencia: 'FAC-2023-002'
      };
      
      const response = await request(app)
        .post(`/api/presupuestos/partidas/${partidaPresupuestal.id}/movimientos`)
        .set('x-access-token', usuarioToken)
        .send(nuevoMovimiento);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('usuario_id', regularUser.id);
      
      // Verificar que el monto ejercido de la partida fue actualizado
      const partidaActualizada = await PartidaPresupuestal.findByPk(partidaPresupuestal.id);
      expect(partidaActualizada.monto_ejercido).toBe(650000.00); // 600000 + 50000
    });
    
    it('debería rechazar un movimiento que excede el presupuesto disponible', async () => {
      const movimientoExcesivo = {
        tipo: 'gasto',
        monto: 2000000.00, // Excede el presupuesto disponible
        concepto: 'Gasto excesivo',
        referencia: 'FAC-2023-003'
      };
      
      const response = await request(app)
        .post(`/api/presupuestos/partidas/${partidaPresupuestal.id}/movimientos`)
        .set('x-access-token', adminToken)
        .send(movimientoExcesivo);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      
      // Verificar que el monto ejercido no cambió
      const partidaNoModificada = await PartidaPresupuestal.findByPk(partidaPresupuestal.id);
      expect(partidaNoModificada.monto_ejercido).toBe(650000.00);
    });
    
    it('debería rechazar a ciudadanos que intentan registrar movimientos', async () => {
      const nuevoMovimiento = {
        tipo: 'gasto',
        monto: 10000.00,
        concepto: 'Intento de ciudadano',
        referencia: 'CIU-2023-001'
      };
      
      const response = await request(app)
        .post(`/api/presupuestos/partidas/${partidaPresupuestal.id}/movimientos`)
        .set('x-access-token', ciudadanoToken)
        .send(nuevoMovimiento);
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message');
    });
  });
  
  describe('GET /api/presupuestos/:id/reporte', () => {
    it('debería permitir a un administrador generar un reporte del presupuesto', async () => {
      const response = await request(app)
        .get(`/api/presupuestos/${presupuestoAnual.id}/reporte`)
        .set('x-access-token', adminToken)
        .set('Accept', 'application/pdf');
      
      expect(response.status).toBe(200);
      expect(response.type).toBe('application/pdf');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.headers['content-disposition']).toContain(`presupuesto-${presupuestoAnual.año}.pdf`);
    });
    
    it('debería permitir a un funcionario generar un reporte del presupuesto', async () => {
      const response = await request(app)
        .get(`/api/presupuestos/${presupuestoAnual.id}/reporte`)
        .set('x-access-token', usuarioToken)
        .set('Accept', 'application/pdf');
      
      expect(response.status).toBe(200);
      expect(response.type).toBe('application/pdf');
    });
    
    it('debería rechazar a ciudadanos que intentan generar reportes', async () => {
      const response = await request(app)
        .get(`/api/presupuestos/${presupuestoAnual.id}/reporte`)
        .set('x-access-token', ciudadanoToken)
        .set('Accept', 'application/pdf');
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message');
    });
  });
});
