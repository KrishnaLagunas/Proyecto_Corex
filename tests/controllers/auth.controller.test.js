/**
 * Pruebas unitarias para el controlador de autenticación
 */

const authController = require('../../src/controllers/auth.controller');
const { Usuario } = require('../../src/models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Mock de los módulos
jest.mock('../../src/models', () => ({
  Usuario: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
    update: jest.fn()
  }
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'token-de-prueba')
}));

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  genSalt: jest.fn(() => 'salt'),
  hash: jest.fn(() => 'hashed-password')
}));

jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

// Mocks para req, res y next
const mockRequest = () => {
  const req = {};
  req.body = {};
  req.params = {};
  req.userId = null;
  return req;
};

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn();

describe('Auth Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('debería devolver un token cuando las credenciales son válidas', async () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      req.body = { email: 'test@example.com', password: 'password123' };
      
      const mockUser = {
        id: 1,
        nombre: 'Test',
        apellido: 'User',
        email: 'test@example.com',
        role: 'superadmin',
        estado: 'activo'
      };
      
      Usuario.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      
      // Act
      await authController.login(req, res, mockNext);
      
      // Assert
      expect(Usuario.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(bcrypt.compare).toHaveBeenCalled();
      expect(jwt.sign).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        token: 'token-de-prueba',
        user: expect.objectContaining({
          id: 1,
          nombre: 'Test',
          apellido: 'User',
          email: 'test@example.com',
          role: 'superadmin'
        })
      }));
    });
    
    it('debería devolver un error 401 cuando el usuario no existe', async () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      req.body = { email: 'nonexistent@example.com', password: 'password123' };
      
      Usuario.findOne.mockResolvedValue(null);
      
      // Act
      await authController.login(req, res, mockNext);
      
      // Assert
      expect(Usuario.findOne).toHaveBeenCalledWith({ where: { email: 'nonexistent@example.com' } });
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.any(String)
      }));
    });
    
    it('debería devolver un error 401 cuando la contraseña es incorrecta', async () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      req.body = { email: 'test@example.com', password: 'wrongpassword' };
      
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedpassword'
      };
      
      Usuario.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);
      
      // Act
      await authController.login(req, res, mockNext);
      
      // Assert
      expect(Usuario.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(bcrypt.compare).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.any(String)
      }));
    });
    
    it('debería pasar el error al middleware de manejo de errores cuando ocurre una excepción', async () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      req.body = { email: 'test@example.com', password: 'password123' };
      
      const error = new Error('Database error');
      Usuario.findOne.mockRejectedValue(error);
      
      // Act
      await authController.login(req, res, mockNext);
      
      // Assert
      expect(Usuario.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
  
  // Aquí se pueden agregar más pruebas para los otros métodos del controlador
});
