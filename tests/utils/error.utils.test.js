/**
 * Pruebas unitarias para las utilidades de error
 */

const errorUtils = require('../../src/utils/error.utils');

describe('Error Utils', () => {
  describe('AppError', () => {
    it('debería crear un error con los valores predeterminados', () => {
      // Act
      const error = new errorUtils.AppError('Mensaje de error');
      
      // Assert
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Mensaje de error');
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
      expect(error.stack).toBeDefined();
    });
    
    it('debería crear un error con el código de estado personalizado', () => {
      // Act
      const error = new errorUtils.AppError('Mensaje de error', 400);
      
      // Assert
      expect(error.message).toBe('Mensaje de error');
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(true);
    });
    
    it('debería crear un error con isOperational personalizado', () => {
      // Act
      const error = new errorUtils.AppError('Mensaje de error', 400, false);
      
      // Assert
      expect(error.message).toBe('Mensaje de error');
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(false);
    });
  });

  describe('handleError', () => {
    let originalConsoleError;
    let mockConsoleError;
    
    beforeEach(() => {
      // Guardar la implementación original de console.error
      originalConsoleError = console.error;
      // Crear un mock para console.error
      mockConsoleError = jest.fn();
      console.error = mockConsoleError;
    });
    
    afterEach(() => {
      // Restaurar la implementación original de console.error
      console.error = originalConsoleError;
    });
    
    it('debería manejar errores operacionales', () => {
      // Arrange
      const error = new errorUtils.AppError('Error operacional', 400);
      
      // Act
      errorUtils.handleError(error);
      
      // Assert
      expect(mockConsoleError).toHaveBeenCalledWith('ERROR OPERACIONAL: ', expect.any(Object));
    });
    
    it('debería manejar errores no operacionales', () => {
      // Arrange
      const error = new errorUtils.AppError('Error no operacional', 500, false);
      
      // Act
      errorUtils.handleError(error);
      
      // Assert
      expect(mockConsoleError).toHaveBeenCalledWith('ERROR NO OPERACIONAL: ', expect.any(Object));
    });
    
    it('debería manejar errores estándar', () => {
      // Arrange
      const error = new Error('Error estándar');
      
      // Act
      errorUtils.handleError(error);
      
      // Assert
      expect(mockConsoleError).toHaveBeenCalledWith('ERROR NO OPERACIONAL: ', expect.any(Object));
    });
  });

  describe('handleErrorMiddleware', () => {
    let req, res, next;
    
    beforeEach(() => {
      req = {};
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };
      next = jest.fn();
    });
    
    it('debería responder con el código de estado y mensaje del error', () => {
      // Arrange
      const error = new errorUtils.AppError('Error de validación', 400);
      
      // Act
      errorUtils.handleErrorMiddleware(error, req, res, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Error de validación'
      });
    });
    
    it('debería manejar errores de validación de Sequelize', () => {
      // Arrange
      const error = {
        name: 'SequelizeValidationError',
        errors: [
          { message: 'El campo nombre es requerido' },
          { message: 'El campo email debe ser válido' }
        ]
      };
      
      // Act
      errorUtils.handleErrorMiddleware(error, req, res, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Error de validación',
        errors: ['El campo nombre es requerido', 'El campo email debe ser válido']
      });
    });
    
    it('debería manejar errores de clave única de Sequelize', () => {
      // Arrange
      const error = {
        name: 'SequelizeUniqueConstraintError',
        errors: [
          { message: 'El email ya está en uso' }
        ]
      };
      
      // Act
      errorUtils.handleErrorMiddleware(error, req, res, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Error de validación',
        errors: ['El email ya está en uso']
      });
    });
    
    it('debería manejar errores de base de datos de Sequelize', () => {
      // Arrange
      const error = {
        name: 'SequelizeDatabaseError',
        message: 'Error en la consulta SQL'
      };
      
      // Act
      errorUtils.handleErrorMiddleware(error, req, res, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Error en la base de datos'
      });
    });
    
    it('debería manejar errores genéricos', () => {
      // Arrange
      const error = new Error('Error inesperado');
      
      // Act
      errorUtils.handleErrorMiddleware(error, req, res, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Error interno del servidor'
      });
    });
    
    it('debería incluir detalles del error en desarrollo', () => {
      // Arrange
      process.env.NODE_ENV = 'development';
      const error = new Error('Error inesperado');
      error.stack = 'Stack trace de prueba';
      
      // Act
      errorUtils.handleErrorMiddleware(error, req, res, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Error inesperado',
        stack: 'Stack trace de prueba'
      });
      
      // Restaurar
      process.env.NODE_ENV = 'test';
    });
  });
});