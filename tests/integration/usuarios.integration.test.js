/**
 * Pruebas de integración para el controlador de usuarios
 */

const request = require('supertest');
const app = require('../../src/app');
const { sequelize } = require('../../src/config/database');
const { Usuario, Departamento } = require('../../src/models');
const bcrypt = require('bcryptjs');

describe('Usuarios Integration Tests', () => {
  let adminToken;
  let usuarioToken;
  let adminUser;
  let regularUser;
  let departamento;
  
  beforeAll(async () => {
    // Configurar la base de datos de prueba
    await sequelize.sync({ force: true });
    
    // Crear un departamento de prueba
    departamento = await Departamento.create({
      nombre: 'Departamento de Prueba',
      descripcion: 'Departamento para pruebas de integración'
    });
    
    // Crear un usuario administrador
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('admin123', salt);
    
    adminUser = await Usuario.create({
      nombre: 'Admin',
      apellido: 'User',
      email: 'admin@example.com',
      password: adminPassword,
      role: 'admin',
      departamento_id: departamento.id,
      estado: 'activo'
    });
    
    // Crear un usuario regular
    const userPassword = await bcrypt.hash('user123', salt);
    
    regularUser = await Usuario.create({
      nombre: 'Regular',
      apellido: 'User',
      email: 'user@example.com',
      password: userPassword,
      role: 'usuario',
      departamento_id: departamento.id,
      estado: 'activo'
    });
    
    // Obtener tokens para ambos usuarios
    const adminLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'admin123'
      });
    
    adminToken = adminLoginResponse.body.token;
    
    const userLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user@example.com',
        password: 'user123'
      });
    
    usuarioToken = userLoginResponse.body.token;
  });
  
  afterAll(async () => {
    // Limpiar la base de datos después de las pruebas
    await sequelize.close();
  });
  
  describe('GET /api/usuarios', () => {
    it('debería permitir a un administrador obtener todos los usuarios', async () => {
      const response = await request(app)
        .get('/api/usuarios')
        .set('x-access-token', adminToken);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
      expect(response.body.some(user => user.email === 'admin@example.com')).toBe(true);
      expect(response.body.some(user => user.email === 'user@example.com')).toBe(true);
    });
    
    it('debería rechazar a usuarios no administradores', async () => {
      const response = await request(app)
        .get('/api/usuarios')
        .set('x-access-token', usuarioToken);
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message');
    });
    
    it('debería rechazar solicitudes sin token', async () => {
      const response = await request(app)
        .get('/api/usuarios');
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message');
    });
  });
  
  describe('GET /api/usuarios/:id', () => {
    it('debería permitir a un administrador obtener un usuario por ID', async () => {
      const response = await request(app)
        .get(`/api/usuarios/${regularUser.id}`)
        .set('x-access-token', adminToken);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', regularUser.id);
      expect(response.body).toHaveProperty('email', 'user@example.com');
      expect(response.body).toHaveProperty('nombre', 'Regular');
      expect(response.body).not.toHaveProperty('password');
    });
    
    it('debería permitir a un usuario obtener su propio perfil', async () => {
      const response = await request(app)
        .get(`/api/usuarios/${regularUser.id}`)
        .set('x-access-token', usuarioToken);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', regularUser.id);
      expect(response.body).toHaveProperty('email', 'user@example.com');
    });
    
    it('debería rechazar a un usuario que intenta acceder al perfil de otro', async () => {
      const response = await request(app)
        .get(`/api/usuarios/${adminUser.id}`)
        .set('x-access-token', usuarioToken);
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message');
    });
    
    it('debería devolver 404 para un ID de usuario inexistente', async () => {
      const response = await request(app)
        .get('/api/usuarios/999')
        .set('x-access-token', adminToken);
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message');
    });
  });
  
  describe('POST /api/usuarios', () => {
    it('debería permitir a un administrador crear un nuevo usuario', async () => {
      const newUser = {
        nombre: 'Nuevo',
        apellido: 'Usuario',
        email: 'nuevo@example.com',
        password: 'nuevo123',
        role: 'usuario',
        departamento_id: departamento.id
      };
      
      const response = await request(app)
        .post('/api/usuarios')
        .set('x-access-token', adminToken)
        .send(newUser);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email', 'nuevo@example.com');
      expect(response.body).toHaveProperty('nombre', 'Nuevo');
      expect(response.body).toHaveProperty('estado', 'activo');
      expect(response.body).not.toHaveProperty('password');
      
      // Verificar que el usuario fue creado en la base de datos
      const createdUser = await Usuario.findOne({ where: { email: 'nuevo@example.com' } });
      expect(createdUser).not.toBeNull();
    });
    
    it('debería rechazar la creación de un usuario con email duplicado', async () => {
      const duplicateUser = {
        nombre: 'Duplicado',
        apellido: 'Usuario',
        email: 'nuevo@example.com', // Email ya existente
        password: 'duplicado123',
        role: 'usuario',
        departamento_id: departamento.id
      };
      
      const response = await request(app)
        .post('/api/usuarios')
        .set('x-access-token', adminToken)
        .send(duplicateUser);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
    
    it('debería rechazar a usuarios no administradores', async () => {
      const newUser = {
        nombre: 'Otro',
        apellido: 'Usuario',
        email: 'otro@example.com',
        password: 'otro123',
        role: 'usuario',
        departamento_id: departamento.id
      };
      
      const response = await request(app)
        .post('/api/usuarios')
        .set('x-access-token', usuarioToken)
        .send(newUser);
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message');
    });
  });
  
  describe('PUT /api/usuarios/:id', () => {
    it('debería permitir a un administrador actualizar un usuario', async () => {
      const updateData = {
        nombre: 'Regular Actualizado',
        apellido: 'User Actualizado'
      };
      
      const response = await request(app)
        .put(`/api/usuarios/${regularUser.id}`)
        .set('x-access-token', adminToken)
        .send(updateData);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', regularUser.id);
      expect(response.body).toHaveProperty('nombre', 'Regular Actualizado');
      expect(response.body).toHaveProperty('apellido', 'User Actualizado');
      
      // Verificar que el usuario fue actualizado en la base de datos
      const updatedUser = await Usuario.findByPk(regularUser.id);
      expect(updatedUser.nombre).toBe('Regular Actualizado');
    });
    
    it('debería permitir a un usuario actualizar su propio perfil', async () => {
      const updateData = {
        nombre: 'Regular Modificado',
        apellido: 'User Modificado'
      };
      
      const response = await request(app)
        .put(`/api/usuarios/${regularUser.id}`)
        .set('x-access-token', usuarioToken)
        .send(updateData);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('nombre', 'Regular Modificado');
      
      // Verificar que el usuario fue actualizado en la base de datos
      const updatedUser = await Usuario.findByPk(regularUser.id);
      expect(updatedUser.nombre).toBe('Regular Modificado');
    });
    
    it('debería rechazar a un usuario que intenta actualizar el perfil de otro', async () => {
      const updateData = {
        nombre: 'Intento Modificar Admin'
      };
      
      const response = await request(app)
        .put(`/api/usuarios/${adminUser.id}`)
        .set('x-access-token', usuarioToken)
        .send(updateData);
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message');
    });
    
    it('debería rechazar la actualización de un rol por un usuario no administrador', async () => {
      const updateData = {
        role: 'admin' // Intento de escalada de privilegios
      };
      
      const response = await request(app)
        .put(`/api/usuarios/${regularUser.id}`)
        .set('x-access-token', usuarioToken)
        .send(updateData);
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message');
      
      // Verificar que el rol no cambió
      const unchangedUser = await Usuario.findByPk(regularUser.id);
      expect(unchangedUser.role).toBe('usuario');
    });
  });
  
  describe('DELETE /api/usuarios/:id', () => {
    let userToDelete;
    
    beforeEach(async () => {
      // Crear un usuario para eliminar en cada prueba
      const salt = await bcrypt.genSalt(10);
      const password = await bcrypt.hash('delete123', salt);
      
      userToDelete = await Usuario.create({
        nombre: 'Usuario',
        apellido: 'Eliminar',
        email: `delete${Date.now()}@example.com`,
        password: password,
        role: 'usuario',
        departamento_id: departamento.id,
        estado: 'activo'
      });
    });
    
    it('debería permitir a un administrador eliminar un usuario', async () => {
      const response = await request(app)
        .delete(`/api/usuarios/${userToDelete.id}`)
        .set('x-access-token', adminToken);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      
      // Verificar que el usuario fue eliminado o desactivado
      const deletedUser = await Usuario.findByPk(userToDelete.id);
      expect(deletedUser.estado).toBe('inactivo');
    });
    
    it('debería rechazar a usuarios no administradores', async () => {
      const response = await request(app)
        .delete(`/api/usuarios/${userToDelete.id}`)
        .set('x-access-token', usuarioToken);
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message');
      
      // Verificar que el usuario no fue eliminado
      const unchangedUser = await Usuario.findByPk(userToDelete.id);
      expect(unchangedUser.estado).toBe('activo');
    });
    
    it('debería devolver 404 para un ID de usuario inexistente', async () => {
      const response = await request(app)
        .delete('/api/usuarios/999')
        .set('x-access-token', adminToken);
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message');
    });
  });
});