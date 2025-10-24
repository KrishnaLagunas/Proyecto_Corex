/**
 * Pruebas unitarias para las utilidades de fecha
 */

const dateUtils = require('../../src/utils/date.utils');

describe('Date Utils', () => {
  describe('formatDate', () => {
    it('debería formatear una fecha correctamente', () => {
      // Arrange
      const date = new Date('2023-05-15T10:30:00');
      
      // Act
      const result = dateUtils.formatDate(date);
      
      // Assert
      expect(result).toBe('15/05/2023');
    });
    
    it('debería manejar fechas en formato string', () => {
      // Arrange
      const dateStr = '2023-05-15T10:30:00';
      
      // Act
      const result = dateUtils.formatDate(dateStr);
      
      // Assert
      expect(result).toBe('15/05/2023');
    });
    
    it('debería devolver una cadena vacía para valores inválidos', () => {
      // Arrange
      const invalidValues = [null, undefined, 'invalid-date', {}, [], true];
      
      // Act & Assert
      invalidValues.forEach(value => {
        expect(dateUtils.formatDate(value)).toBe('');
      });
    });
  });

  describe('formatDateTime', () => {
    it('debería formatear una fecha y hora correctamente', () => {
      // Arrange
      const date = new Date('2023-05-15T10:30:45');
      
      // Act
      const result = dateUtils.formatDateTime(date);
      
      // Assert
      expect(result).toBe('15/05/2023 10:30:45');
    });
    
    it('debería manejar fechas en formato string', () => {
      // Arrange
      const dateStr = '2023-05-15T10:30:45';
      
      // Act
      const result = dateUtils.formatDateTime(dateStr);
      
      // Assert
      expect(result).toBe('15/05/2023 10:30:45');
    });
    
    it('debería devolver una cadena vacía para valores inválidos', () => {
      // Arrange
      const invalidValues = [null, undefined, 'invalid-date', {}, [], true];
      
      // Act & Assert
      invalidValues.forEach(value => {
        expect(dateUtils.formatDateTime(value)).toBe('');
      });
    });
  });

  describe('parseDate', () => {
    it('debería convertir una cadena de fecha a objeto Date', () => {
      // Arrange
      const dateStr = '15/05/2023';
      const expected = new Date('2023-05-15T00:00:00');
      
      // Act
      const result = dateUtils.parseDate(dateStr);
      
      // Assert
      expect(result.getFullYear()).toBe(expected.getFullYear());
      expect(result.getMonth()).toBe(expected.getMonth());
      expect(result.getDate()).toBe(expected.getDate());
    });
    
    it('debería manejar diferentes formatos de fecha', () => {
      // Arrange
      const formats = [
        { input: '15-05-2023', expected: new Date('2023-05-15T00:00:00') },
        { input: '15.05.2023', expected: new Date('2023-05-15T00:00:00') },
        { input: '2023/05/15', expected: new Date('2023-05-15T00:00:00') }
      ];
      
      // Act & Assert
      formats.forEach(format => {
        const result = dateUtils.parseDate(format.input);
        expect(result.getFullYear()).toBe(format.expected.getFullYear());
        expect(result.getMonth()).toBe(format.expected.getMonth());
        expect(result.getDate()).toBe(format.expected.getDate());
      });
    });
    
    it('debería devolver null para valores inválidos', () => {
      // Arrange
      const invalidValues = [null, undefined, 'invalid-date', '32/05/2023', '15/13/2023', {}, [], true];
      
      // Act & Assert
      invalidValues.forEach(value => {
        expect(dateUtils.parseDate(value)).toBeNull();
      });
    });
  });

  describe('addDays', () => {
    it('debería agregar días correctamente a una fecha', () => {
      // Arrange
      const date = new Date('2023-05-15T10:30:00');
      const daysToAdd = 5;
      const expected = new Date('2023-05-20T10:30:00');
      
      // Act
      const result = dateUtils.addDays(date, daysToAdd);
      
      // Assert
      expect(result.getFullYear()).toBe(expected.getFullYear());
      expect(result.getMonth()).toBe(expected.getMonth());
      expect(result.getDate()).toBe(expected.getDate());
      expect(result.getHours()).toBe(expected.getHours());
      expect(result.getMinutes()).toBe(expected.getMinutes());
    });
    
    it('debería manejar valores negativos para restar días', () => {
      // Arrange
      const date = new Date('2023-05-15T10:30:00');
      const daysToSubtract = -5;
      const expected = new Date('2023-05-10T10:30:00');
      
      // Act
      const result = dateUtils.addDays(date, daysToSubtract);
      
      // Assert
      expect(result.getFullYear()).toBe(expected.getFullYear());
      expect(result.getMonth()).toBe(expected.getMonth());
      expect(result.getDate()).toBe(expected.getDate());
      expect(result.getHours()).toBe(expected.getHours());
      expect(result.getMinutes()).toBe(expected.getMinutes());
    });
    
    it('debería manejar el cambio de mes correctamente', () => {
      // Arrange
      const date = new Date('2023-05-30T10:30:00');
      const daysToAdd = 5;
      const expected = new Date('2023-06-04T10:30:00');
      
      // Act
      const result = dateUtils.addDays(date, daysToAdd);
      
      // Assert
      expect(result.getFullYear()).toBe(expected.getFullYear());
      expect(result.getMonth()).toBe(expected.getMonth());
      expect(result.getDate()).toBe(expected.getDate());
    });
    
    it('debería manejar el cambio de año correctamente', () => {
      // Arrange
      const date = new Date('2023-12-30T10:30:00');
      const daysToAdd = 5;
      const expected = new Date('2024-01-04T10:30:00');
      
      // Act
      const result = dateUtils.addDays(date, daysToAdd);
      
      // Assert
      expect(result.getFullYear()).toBe(expected.getFullYear());
      expect(result.getMonth()).toBe(expected.getMonth());
      expect(result.getDate()).toBe(expected.getDate());
    });
    
    it('debería devolver null para valores de fecha inválidos', () => {
      // Arrange
      const invalidValues = [null, undefined, 'invalid-date', {}, [], true];
      
      // Act & Assert
      invalidValues.forEach(value => {
        expect(dateUtils.addDays(value, 5)).toBeNull();
      });
    });
  });

  describe('calculateDaysBetween', () => {
    it('debería calcular correctamente los días entre dos fechas', () => {
      // Arrange
      const startDate = new Date('2023-05-15T10:30:00');
      const endDate = new Date('2023-05-20T10:30:00');
      
      // Act
      const result = dateUtils.calculateDaysBetween(startDate, endDate);
      
      // Assert
      expect(result).toBe(5);
    });
    
    it('debería devolver un valor negativo si la fecha de inicio es posterior a la fecha de fin', () => {
      // Arrange
      const startDate = new Date('2023-05-20T10:30:00');
      const endDate = new Date('2023-05-15T10:30:00');
      
      // Act
      const result = dateUtils.calculateDaysBetween(startDate, endDate);
      
      // Assert
      expect(result).toBe(-5);
    });
    
    it('debería devolver 0 si las fechas son iguales', () => {
      // Arrange
      const date = new Date('2023-05-15T10:30:00');
      
      // Act
      const result = dateUtils.calculateDaysBetween(date, date);
      
      // Assert
      expect(result).toBe(0);
    });
    
    it('debería ignorar las horas, minutos y segundos al calcular los días', () => {
      // Arrange
      const startDate = new Date('2023-05-15T10:30:00');
      const endDate = new Date('2023-05-16T08:15:00');
      
      // Act
      const result = dateUtils.calculateDaysBetween(startDate, endDate);
      
      // Assert
      expect(result).toBe(1);
    });
    
    it('debería devolver NaN para valores de fecha inválidos', () => {
      // Arrange
      const validDate = new Date('2023-05-15T10:30:00');
      const invalidValues = [null, undefined, 'invalid-date', {}, [], true];
      
      // Act & Assert
      invalidValues.forEach(value => {
        expect(isNaN(dateUtils.calculateDaysBetween(value, validDate))).toBe(true);
        expect(isNaN(dateUtils.calculateDaysBetween(validDate, value))).toBe(true);
      });
    });
  });
});