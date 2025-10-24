/**
 * Pruebas unitarias para el middleware de validación
 */

const validateMiddleware = require('../../src/middlewares/validate.middleware');
const Joi = require('joi');

// Mock para el logger
jest.mock('../../src/utils/logger', () => ({
  error: jest.fn(),
  debug: jest.fn()
}));

// Mocks para req, res y next
const mockRequest = () => {
  const req = {};
  req.body = {};
  req.params = {};
  req.query = {};
  return req;
};

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn();

describe('Validate Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('debería llamar a next() cuando la validación es exitosa', () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      req.body = { name: 'Test User', email: 'test@example.com' };
      
      const schema = Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required()
      });
      
      const middleware = validateMiddleware(schema, 'body');
      
      // Act
      middleware(req, res, mockNext);
      
      // Assert
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
    
    it('debería devolver un error 400 cuando la validación falla', () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      req.body = { name: 'Test User' }; // Falta el email requerido
      
      const schema = Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required()
      });
      
      const middleware = validateMiddleware(schema, 'body');
      
      // Act
      middleware(req, res, mockNext);
      
      // Assert
      expect(mockNext).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.any(String),
        details: expect.any(Array)
      }));
    });
    
    it('debería validar los parámetros de la ruta cuando se especifica "params"', () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      req.params = { id: '123' };
      
      const schema = Joi.object({
        id: Joi.string().required()
      });
      
      const middleware = validateMiddleware(schema, 'params');
      
      // Act
      middleware(req, res, mockNext);
      
      // Assert
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith();
    });
    
    it('debería validar los parámetros de consulta cuando se especifica "query"', () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      req.query = { page: '1', limit: '10' };
      
      const schema = Joi.object({
        page: Joi.string().required(),
        limit: Joi.string().required()
      });
      
      const middleware = validateMiddleware(schema, 'query');
      
      // Act
      middleware(req, res, mockNext);
      
      // Assert
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith();
    });
    
    it('debería formatear los errores de validación correctamente', () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      req.body = { age: 'not-a-number' };
      
      const schema = Joi.object({
        name: Joi.string().required(),
        age: Joi.number().integer().required()
      });
      
      const middleware = validateMiddleware(schema, 'body');
      
      // Act
      middleware(req, res, mockNext);
      
      // Assert
      expect(mockNext).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Error de validación',
        details: expect.arrayContaining([
          expect.objectContaining({
            message: expect.any(String),
            path: expect.any(Array),
            type: expect.any(String)
          })
        ])
      }));
    });
  });
});