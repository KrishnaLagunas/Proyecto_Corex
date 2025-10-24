/**
 * Pruebas unitarias para el módulo de logger
 */

const winston = require('winston');
const logger = require('../../src/utils/logger');

// Mock de winston
jest.mock('winston', () => {
  const mFormat = {
    combine: jest.fn(),
    timestamp: jest.fn(),
    printf: jest.fn(),
    colorize: jest.fn(),
    json: jest.fn(),
    simple: jest.fn()
  };
  
  const mTransports = {
    Console: jest.fn(),
    File: jest.fn()
  };
  
  return {
    format: mFormat,
    transports: mTransports,
    createLogger: jest.fn(() => ({
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      http: jest.fn()
    }))
  };
});

describe('Logger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = 'development';
    process.env.LOG_LEVEL = 'info';
  });

  it('debería crear una instancia de logger con la configuración correcta', () => {
    // Assert
    expect(winston.createLogger).toHaveBeenCalled();
    expect(winston.format.combine).toHaveBeenCalled();
    expect(winston.format.timestamp).toHaveBeenCalled();
    expect(winston.format.printf).toHaveBeenCalled();
    expect(winston.transports.Console).toHaveBeenCalled();
    expect(winston.transports.File).toHaveBeenCalled();
  });

  it('debería tener los métodos de logging necesarios', () => {
    // Assert
    expect(logger.info).toBeDefined();
    expect(logger.error).toBeDefined();
    expect(logger.warn).toBeDefined();
    expect(logger.debug).toBeDefined();
    expect(logger.http).toBeDefined();
  });

  it('debería usar el nivel de log de las variables de entorno', () => {
    // Arrange
    process.env.LOG_LEVEL = 'debug';
    
    // Act - Recargar el módulo para que tome la nueva configuración
    jest.resetModules();
    require('../../src/utils/logger');
    
    // Assert
    expect(winston.createLogger).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'debug'
      })
    );
  });

  it('debería configurar transports diferentes según el entorno', () => {
    // Arrange
    process.env.NODE_ENV = 'production';
    
    // Act - Recargar el módulo para que tome la nueva configuración
    jest.resetModules();
    require('../../src/utils/logger');
    
    // Assert
    expect(winston.transports.Console).toHaveBeenCalledWith(
      expect.objectContaining({
        level: expect.any(String)
      })
    );
    
    expect(winston.transports.File).toHaveBeenCalledWith(
      expect.objectContaining({
        filename: expect.stringContaining('logs/'),
        level: expect.any(String)
      })
    );
  });

  describe('Métodos de logging', () => {
    it('debería llamar al método info del logger', () => {
      // Act
      logger.info('Mensaje de información', { data: 'test' });
      
      // Assert
      expect(winston.createLogger().info).toHaveBeenCalledWith('Mensaje de información', { data: 'test' });
    });
    
    it('debería llamar al método error del logger', () => {
      // Arrange
      const error = new Error('Error de prueba');
      
      // Act
      logger.error('Mensaje de error', error);
      
      // Assert
      expect(winston.createLogger().error).toHaveBeenCalledWith('Mensaje de error', error);
    });
    
    it('debería llamar al método warn del logger', () => {
      // Act
      logger.warn('Mensaje de advertencia');
      
      // Assert
      expect(winston.createLogger().warn).toHaveBeenCalledWith('Mensaje de advertencia');
    });
    
    it('debería llamar al método debug del logger', () => {
      // Act
      logger.debug('Mensaje de depuración', { debug: true });
      
      // Assert
      expect(winston.createLogger().debug).toHaveBeenCalledWith('Mensaje de depuración', { debug: true });
    });
    
    it('debería llamar al método http del logger', () => {
      // Arrange
      const req = { method: 'GET', url: '/api/test' };
      
      // Act
      logger.http('Solicitud HTTP', req);
      
      // Assert
      expect(winston.createLogger().http).toHaveBeenCalledWith('Solicitud HTTP', req);
    });
  });
});