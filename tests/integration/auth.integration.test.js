/**
 * Pruebas de integración para la autenticación
 */

const request = require('supertest');
const app = require('../../src/app');
const { sequelize } = require('../../src/config/database');
const { Usuario } = require('../../src/models');
const bcrypt = require('bcryptjs');

describe('Auth Integration Tests', () => {
  let testUser;
  
  beforeAll(async () => {
    // Configurar la base de datos de prueba
    await sequelize.sync({ force: true });
    
    // Crear un usuario de prueba
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    
    testUser = await Usuario.create({
      nombre: 'Test',
      apellido: 'User',
      email: 'test@example.com',
      password: hashedPassword,
      role: 'superadmin',
      estado: 'activo'
    });
  });
  
  afterAll(async () => {
    // Limpiar la base de datos después de las pruebas
    await sequelize.close();
  });
  
  describe('POST /api/auth/login', () => {
    it('debería autenticar a un usuario con credenciales válidas', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id', testUser.id);
      expect(response.body.user).toHaveProperty('email', 'test@example.com');
      expect(response.body.user).toHaveProperty('role', 'superadmin');
      expect(response.body.user).not.toHaveProperty('password');
    });
    
    it('debería rechazar credenciales inválidas', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
      expect(response.body).not.toHaveProperty('token');
    });
    
    it('debería rechazar un email inexistente', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
      expect(response.body).not.toHaveProperty('token');
    });
    
    it('debería rechazar solicitudes con datos incompletos', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com'
          // Sin contraseña
        });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });
  
  describe('GET /api/auth/profile', () => {
    let authToken;
    
    beforeAll(async () => {
      // Obtener un token de autenticación para las pruebas
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });
      
      authToken = response.body.token;
    });
    
    it('debería obtener el perfil del usuario autenticado', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('x-access-token', authToken);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', testUser.id);
      expect(response.body).toHaveProperty('email', 'test@example.com');
      expect(response.body).toHaveProperty('nombre', 'Test');
      expect(response.body).toHaveProperty('role', 'superadmin');
      expect(response.body).not.toHaveProperty('password');
    });
    
    it('debería rechazar solicitudes sin token', async () => {
      const response = await request(app)
        .get('/api/auth/profile');
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message');
    });
    
    it('debería rechazar solicitudes con token inválido', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('x-access-token', 'invalid-token');
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
    });
  });
  
  describe('POST /api/auth/change-password', () => {
    let authToken;
    
    beforeAll(async () => {
      // Obtener un token de autenticación para las pruebas
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });
      
      authToken = response.body.token;
    });
    
    it('debería cambiar la contraseña correctamente', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('x-access-token', authToken)
        .send({
          currentPassword: 'password123',
          newPassword: 'newpassword123'
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      
      // Verificar que podemos iniciar sesión con la nueva contraseña
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'newpassword123'
        });
      
      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body).toHaveProperty('token');
    });
    
    it('debería rechazar contraseñas actuales incorrectas', async () => {
      // Obtener un nuevo token con la contraseña actualizada
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'newpassword123'
        });
      
      const newToken = loginResponse.body.token;
      
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('x-access-token', newToken)
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'anotherpassword123'
        });
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
    });
    
    it('debería rechazar solicitudes con datos incompletos', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('x-access-token', authToken)
        .send({
          currentPassword: 'newpassword123'
          // Sin nueva contraseña
        });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });
});
