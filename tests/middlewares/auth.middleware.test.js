/**
 * Pruebas unitarias para el middleware de autenticación
 */

const authMiddleware = require('../../src/middlewares/auth.middleware');
const jwt = require('jsonwebtoken');
const { Usuario } = require('../../src/models');

// Mock de los módulos
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn()
}));

jest.mock('../../src/models', () => ({
  Usuario: {
    findByPk: jest.fn()
  }
}));

jest.mock('../../src/utils/logger', () => ({
  error: jest.fn(),
  debug: jest.fn()
}));

// Mocks para req, res y next
const mockRequest = () => {
  const req = {};
  req.headers = {};
  return req;
};

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn();

describe('Auth Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  describe('verifyToken', () => {
    it('debería verificar un token válido y establecer userId en la solicitud', async () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      req.headers['x-access-token'] = 'valid-token';
      
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(null, { id: 1 });
      });
      
      const mockUser = {
        id: 1,
        nombre: 'Test',
        apellido: 'User',
        email: 'test@example.com',
        role: 'superadmin',
        estado: 'activo'
      };
      
      Usuario.findByPk.mockResolvedValue(mockUser);
      
      // Act
      await authMiddleware.verifyToken(req, res, mockNext);
      
      // Assert
      expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret', expect.any(Function));
      expect(Usuario.findByPk).toHaveBeenCalledWith(1);
      expect(req.userId).toBe(1);
      expect(req.userRole).toBe('superadmin');
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith();
    });
    
    it('debería rechazar solicitudes sin token', async () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      req.headers['x-access-token'] = '';
      
      // Act
      await authMiddleware.verifyToken(req, res, mockNext);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.any(String)
      }));
      expect(mockNext).not.toHaveBeenCalled();
    });
    
    it('debería rechazar tokens inválidos', async () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      req.headers['x-access-token'] = 'invalid-token';
      
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(new Error('Token inválido'), null);
      });
      
      // Act
      await authMiddleware.verifyToken(req, res, mockNext);
      
      // Assert
      expect(jwt.verify).toHaveBeenCalledWith('invalid-token', 'test-secret', expect.any(Function));
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.any(String)
      }));
      expect(mockNext).not.toHaveBeenCalled();
    });
    
    it('debería rechazar tokens de usuarios inexistentes', async () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      req.headers['x-access-token'] = 'valid-token';
      
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(null, { id: 999 });
      });
      
      Usuario.findByPk.mockResolvedValue(null);
      
      // Act
      await authMiddleware.verifyToken(req, res, mockNext);
      
      // Assert
      expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret', expect.any(Function));
      expect(Usuario.findByPk).toHaveBeenCalledWith(999);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.any(String)
      }));
      expect(mockNext).not.toHaveBeenCalled();
    });
    
    it('debería rechazar tokens de usuarios inactivos', async () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      req.headers['x-access-token'] = 'valid-token';
      
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(null, { id: 1 });
      });
      
      const mockUser = {
        id: 1,
        nombre: 'Test',
        apellido: 'User',
        email: 'test@example.com',
        role: 'superadmin',
        estado: 'inactivo'
      };
      
      Usuario.findByPk.mockResolvedValue(mockUser);
      
      // Act
      await authMiddleware.verifyToken(req, res, mockNext);
      
      // Assert
      expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret', expect.any(Function));
      expect(Usuario.findByPk).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.any(String)
      }));
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('isSuperadmin', () => {
    it('debería permitir el acceso a usuarios con rol de superadministrador', () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      req.userRole = 'superadmin';
      
      // Act
      authMiddleware.isAdmin(req, res, mockNext);
      
      // Assert
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith();
    });
    
    it('debería rechazar el acceso a usuarios sin rol de superadministrador', () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      req.userRole = 'usuario';
      
      // Act
      authMiddleware.isAdmin(req, res, mockNext);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.any(String)
      }));
      expect(mockNext).not.toHaveBeenCalled();
    });
    
    it('debería rechazar el acceso a solicitudes sin rol de usuario', () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      req.userRole = undefined;
      
      // Act
      authMiddleware.isAdmin(req, res, mockNext);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.any(String)
      }));
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
