/**
 * Pruebas unitarias para las utilidades de generación de PDF
 */

const pdfUtils = require('../../src/utils/pdf.utils');
const fs = require('fs');
const path = require('path');

// Mock de los módulos
jest.mock('fs', () => ({
  promises: {
    access: jest.fn(),
    mkdir: jest.fn(),
    writeFile: jest.fn()
  },
  existsSync: jest.fn()
}));

jest.mock('path', () => ({
  join: jest.fn((dir, file) => `${dir}/${file}`),
  dirname: jest.fn(path => path.substring(0, path.lastIndexOf('/')))
}));

jest.mock('pdfkit', () => {
  return jest.fn().mockImplementation(() => ({
    pipe: jest.fn().mockReturnThis(),
    fontSize: jest.fn().mockReturnThis(),
    font: jest.fn().mockReturnThis(),
    text: jest.fn().mockReturnThis(),
    moveDown: jest.fn().mockReturnThis(),
    image: jest.fn().mockReturnThis(),
    fillColor: jest.fn().mockReturnThis(),
    rect: jest.fn().mockReturnThis(),
    fill: jest.fn().mockReturnThis(),
    addPage: jest.fn().mockReturnThis(),
    table: jest.fn().mockReturnThis(),
    end: jest.fn()
  }));
});

jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
}));

describe('PDF Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.UPLOADS_DIR = 'uploads';
    process.env.PDF_DIR = 'pdf';
  });

  describe('generarReciboPago', () => {
    it('debería generar un recibo de pago en PDF', async () => {
      // Arrange
      const datosPago = {
        id: 123,
        fecha: new Date(),
        monto: 1500.50,
        concepto: 'Pago de impuesto predial',
        contribuyente: {
          nombre: 'Juan Pérez',
          documento: '12345678',
          direccion: 'Calle Principal 123'
        },
        tramite: {
          id: 456,
          tipo: 'Impuesto Predial',
          referencia: 'REF-2023-456'
        }
      };
      
      fs.existsSync.mockReturnValue(true);
      path.join.mockImplementation((...args) => args.join('/'));
      
      // Act
      const result = await pdfUtils.generarReciboPago(datosPago);
      
      // Assert
      expect(result).toBeDefined();
      expect(path.join).toHaveBeenCalledWith('uploads', 'pdf', expect.stringContaining('recibo-pago-123'));
      expect(fs.promises.writeFile).toHaveBeenCalled();
    });
    
    it('debería crear el directorio de PDF si no existe', async () => {
      // Arrange
      const datosPago = {
        id: 123,
        fecha: new Date(),
        monto: 1500.50,
        concepto: 'Pago de impuesto predial',
        contribuyente: {
          nombre: 'Juan Pérez',
          documento: '12345678',
          direccion: 'Calle Principal 123'
        },
        tramite: {
          id: 456,
          tipo: 'Impuesto Predial',
          referencia: 'REF-2023-456'
        }
      };
      
      fs.existsSync.mockReturnValue(false);
      path.join.mockImplementation((...args) => args.join('/'));
      
      // Act
      const result = await pdfUtils.generarReciboPago(datosPago);
      
      // Assert
      expect(fs.promises.mkdir).toHaveBeenCalledWith('uploads/pdf', { recursive: true });
      expect(fs.promises.writeFile).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
    
    it('debería manejar errores durante la generación del PDF', async () => {
      // Arrange
      const datosPago = {
        id: 123,
        fecha: new Date(),
        monto: 1500.50,
        concepto: 'Pago de impuesto predial',
        contribuyente: {
          nombre: 'Juan Pérez',
          documento: '12345678',
          direccion: 'Calle Principal 123'
        },
        tramite: {
          id: 456,
          tipo: 'Impuesto Predial',
          referencia: 'REF-2023-456'
        }
      };
      
      fs.existsSync.mockReturnValue(true);
      path.join.mockImplementation((...args) => args.join('/'));
      fs.promises.writeFile.mockRejectedValue(new Error('Error al escribir archivo'));
      
      // Act & Assert
      await expect(pdfUtils.generarReciboPago(datosPago)).rejects.toThrow('Error al generar el PDF');
    });
  });

  describe('generarReportePresupuesto', () => {
    it('debería generar un reporte de presupuesto en PDF', async () => {
      // Arrange
      const datosPresupuesto = {
        id: 789,
        periodo: '2023',
        departamento: 'Obras Públicas',
        montoTotal: 500000,
        montoEjecutado: 350000,
        partidas: [
          { concepto: 'Materiales', monto: 200000, ejecutado: 150000 },
          { concepto: 'Mano de obra', monto: 300000, ejecutado: 200000 }
        ]
      };
      
      fs.existsSync.mockReturnValue(true);
      path.join.mockImplementation((...args) => args.join('/'));
      
      // Act
      const result = await pdfUtils.generarReportePresupuesto(datosPresupuesto);
      
      // Assert
      expect(result).toBeDefined();
      expect(path.join).toHaveBeenCalledWith('uploads', 'pdf', expect.stringContaining('reporte-presupuesto-789'));
      expect(fs.promises.writeFile).toHaveBeenCalled();
    });
  });
});