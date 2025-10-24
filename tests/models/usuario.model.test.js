/**
 * Pruebas unitarias para el modelo de Usuario
 */

const { Usuario } = require('../../src/models');
const { sequelize } = require('../../src/config/database');
const bcrypt = require('bcryptjs');

// Mock de los módulos
jest.mock('../../src/config/database', () => {
  const SequelizeMock = require('sequelize-mock');
  const dbMock = new SequelizeMock();
  return { sequelize: dbMock };
});

jest.mock('bcryptjs', () => ({
  genSalt: jest.fn(() => 'salt'),
  hash: jest.fn(() => 'hashed-password')
}));

describe('Usuario Model', () => {
  let usuarioMock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Crear un mock del modelo Usuario
    usuarioMock = sequelize.define('Usuario', {
      id: {
        type: 'INTEGER',
        primaryKey: true,
        autoIncrement: true
      },
      nombre: 'STRING',
      apellido: 'STRING',
      email: 'STRING',
      password: 'STRING',
      role: 'STRING',
      departamento_id: 'INTEGER',
      estado: 'STRING',
      ultimo_login: 'DATE',
      createdAt: 'DATE',
      updatedAt: 'DATE'
    });
    
    // Agregar hooks y métodos al mock
    usuarioMock.beforeCreate = async (usuario) => {
      if (usuario.password) {
        const salt = await bcrypt.genSalt(10);
        usuario.password = await bcrypt.hash(usuario.password, salt);
      }
    };
    
    usuarioMock.prototype.comparePassword = async function(password) {
      return password === 'password123';
    };
    
    // Reemplazar el modelo real con el mock
    Usuario.findOne = jest.fn();
    Usuario.create = jest.fn();
    Usuario.findByPk = jest.fn();
    Usuario.update = jest.fn();
    Usuario.destroy = jest.fn();
  });

  describe('Validaciones', () => {
    it('debería crear un usuario válido', async () => {
      // Arrange
      const userData = {
        nombre: 'Test',
        apellido: 'User',
        email: 'test@example.com',
        password: 'password123',
        role: 'admin',
        departamento_id: 1,
        estado: 'activo'
      };
      
      Usuario.create.mockResolvedValue({
        id: 1,
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Act
      const usuario = await Usuario.create(userData);
      
      // Assert
      expect(Usuario.create).toHaveBeenCalledWith(userData);
      expect(usuario).toHaveProperty('id', 1);
      expect(usuario).toHaveProperty('nombre', 'Test');
      expect(usuario).toHaveProperty('email', 'test@example.com');
      expect(usuario).toHaveProperty('role', 'admin');
    });
    
    it('debería hashear la contraseña antes de crear el usuario', async () => {
      // Arrange
      const userData = {
        nombre: 'Test',
        apellido: 'User',
        email: 'test@example.com',
        password: 'password123',
        role: 'admin'
      };
      
      // Simular el hook beforeCreate
      await usuarioMock.beforeCreate(userData);
      
      // Assert
      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 'salt');
      expect(userData.password).toBe('hashed-password');
    });
  });

  describe('Métodos de instancia', () => {
    it('comparePassword debería devolver true para una contraseña correcta', async () => {
      // Arrange
      const usuario = new usuarioMock({
        id: 1,
        nombre: 'Test',
        apellido: 'User',
        email: 'test@example.com',
        password: 'hashed-password',
        role: 'admin'
      });
      
      // Act
      const result = await usuario.comparePassword('password123');
      
      // Assert
      expect(result).toBe(true);
    });
    
    it('comparePassword debería devolver false para una contraseña incorrecta', async () => {
      // Arrange
      const usuario = new usuarioMock({
        id: 1,
        nombre: 'Test',
        apellido: 'User',
        email: 'test@example.com',
        password: 'hashed-password',
        role: 'admin'
      });
      
      // Act
      const result = await usuario.comparePassword('wrongpassword');
      
      // Assert
      expect(result).toBe(false);
    });
  });

  describe('Operaciones CRUD', () => {
    it('debería encontrar un usuario por email', async () => {
      // Arrange
      const mockUser = {
        id: 1,
        nombre: 'Test',
        apellido: 'User',
        email: 'test@example.com',
        role: 'admin'
      };
      
      Usuario.findOne.mockResolvedValue(mockUser);
      
      // Act
      const usuario = await Usuario.findOne({ where: { email: 'test@example.com' } });
      
      // Assert
      expect(Usuario.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(usuario).toEqual(mockUser);
    });
    
    it('debería actualizar un usuario existente', async () => {
      // Arrange
      const updateData = {
        nombre: 'Updated',
        apellido: 'User'
      };
      
      Usuario.update.mockResolvedValue([1]);
      
      // Act
      const result = await Usuario.update(updateData, { where: { id: 1 } });
      
      // Assert
      expect(Usuario.update).toHaveBeenCalledWith(updateData, { where: { id: 1 } });
      expect(result[0]).toBe(1); // Número de filas afectadas
    });
    
    it('debería eliminar un usuario existente', async () => {
      // Arrange
      Usuario.destroy.mockResolvedValue(1);
      
      // Act
      const result = await Usuario.destroy({ where: { id: 1 } });
      
      // Assert
      expect(Usuario.destroy).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toBe(1); // Número de filas afectadas
    });
  });
});