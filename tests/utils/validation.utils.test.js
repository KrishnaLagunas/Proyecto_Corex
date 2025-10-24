/**
 * Pruebas unitarias para las utilidades de validación
 */

const validationUtils = require('../../src/utils/validation.utils');

describe('Validation Utils', () => {
  describe('isValidEmail', () => {
    it('debería validar correctamente un email válido', () => {
      // Arrange
      const validEmails = [
        'test@example.com',
        'user.name@domain.com',
        'user-name@domain.co.uk',
        'username123@gmail.com',
        'user+tag@example.org'
      ];
      
      // Act & Assert
      validEmails.forEach(email => {
        expect(validationUtils.isValidEmail(email)).toBe(true);
      });
    });
    
    it('debería rechazar un email inválido', () => {
      // Arrange
      const invalidEmails = [
        'test@',
        'test@domain',
        '@domain.com',
        'test@.com',
        'test@domain..com',
        'test@domain.com.',
        'test..name@domain.com',
        'test name@domain.com',
        'test@domain com'
      ];
      
      // Act & Assert
      invalidEmails.forEach(email => {
        expect(validationUtils.isValidEmail(email)).toBe(false);
      });
    });
    
    it('debería rechazar valores no string', () => {
      // Arrange
      const nonStringValues = [
        null,
        undefined,
        123,
        {},
        [],
        true
      ];
      
      // Act & Assert
      nonStringValues.forEach(value => {
        expect(validationUtils.isValidEmail(value)).toBe(false);
      });
    });
  });

  describe('isValidRFC', () => {
    it('debería validar correctamente un RFC de persona física', () => {
      // Arrange
      const validRFCs = [
        'ABCD123456XYZ',
        'XAXX010101000',
        'GODE561231ABC'
      ];
      
      // Act & Assert
      validRFCs.forEach(rfc => {
        expect(validationUtils.isValidRFC(rfc)).toBe(true);
      });
    });
    
    it('debería validar correctamente un RFC de persona moral', () => {
      // Arrange
      const validRFCs = [
        'ABC123456XYZ',
        'XYZ010101ABC',
        'EMP561231ABC'
      ];
      
      // Act & Assert
      validRFCs.forEach(rfc => {
        expect(validationUtils.isValidRFC(rfc)).toBe(true);
      });
    });
    
    it('debería rechazar un RFC inválido', () => {
      // Arrange
      const invalidRFCs = [
        'ABC12345',
        'ABCDEFGHIJKLM',
        '123456789012',
        'ABC-123456-XYZ',
        'ABC 123456 XYZ',
        'abc123456xyz'
      ];
      
      // Act & Assert
      invalidRFCs.forEach(rfc => {
        expect(validationUtils.isValidRFC(rfc)).toBe(false);
      });
    });
    
    it('debería rechazar valores no string', () => {
      // Arrange
      const nonStringValues = [
        null,
        undefined,
        123,
        {},
        [],
        true
      ];
      
      // Act & Assert
      nonStringValues.forEach(value => {
        expect(validationUtils.isValidRFC(value)).toBe(false);
      });
    });
  });

  describe('isValidCURP', () => {
    it('debería validar correctamente un CURP válido', () => {
      // Arrange
      const validCURPs = [
        'ABCD561231HDFXYZ01',
        'XEXX010101HNEXXXA4',
        'GODE561231MDFNZR07'
      ];
      
      // Act & Assert
      validCURPs.forEach(curp => {
        expect(validationUtils.isValidCURP(curp)).toBe(true);
      });
    });
    
    it('debería rechazar un CURP inválido', () => {
      // Arrange
      const invalidCURPs = [
        'ABCD56123',
        'ABCDEFGHIJKLMNOPQRS',
        '12345678901234567',
        'ABCD561231HDFXYZ0',
        'ABCD-561231-HDFXYZ01',
        'ABCD 561231 HDFXYZ01',
        'abcd561231hdfxyz01'
      ];
      
      // Act & Assert
      invalidCURPs.forEach(curp => {
        expect(validationUtils.isValidCURP(curp)).toBe(false);
      });
    });
    
    it('debería rechazar valores no string', () => {
      // Arrange
      const nonStringValues = [
        null,
        undefined,
        123,
        {},
        [],
        true
      ];
      
      // Act & Assert
      nonStringValues.forEach(value => {
        expect(validationUtils.isValidCURP(value)).toBe(false);
      });
    });
  });

  describe('sanitizeInput', () => {
    it('debería eliminar caracteres HTML peligrosos', () => {
      // Arrange
      const input = '<script>alert("XSS")</script>';
      const expected = '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;';
      
      // Act
      const result = validationUtils.sanitizeInput(input);
      
      // Assert
      expect(result).toBe(expected);
    });
    
    it('debería mantener texto normal sin cambios', () => {
      // Arrange
      const input = 'Texto normal sin caracteres especiales';
      
      // Act
      const result = validationUtils.sanitizeInput(input);
      
      // Assert
      expect(result).toBe(input);
    });
    
    it('debería manejar valores no string', () => {
      // Arrange
      const nonStringValues = [
        null,
        undefined,
        123,
        {},
        [],
        true
      ];
      
      // Act & Assert
      nonStringValues.forEach(value => {
        expect(validationUtils.sanitizeInput(value)).toBe('');
      });
    });
  });
});