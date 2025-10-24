/**
 * Pruebas unitarias para las utilidades de archivo
 */

const fileUtils = require('../../src/utils/file.utils');
const fs = require('fs');
const path = require('path');

// Mock de los módulos
jest.mock('fs', () => ({
  promises: {
    access: jest.fn(),
    mkdir: jest.fn(),
    writeFile: jest.fn(),
    readFile: jest.fn(),
    unlink: jest.fn()
  },
  existsSync: jest.fn(),
  createReadStream: jest.fn(),
  createWriteStream: jest.fn()
}));

jest.mock('path', () => ({
  join: jest.fn((dir, file) => `${dir}/${file}`),
  dirname: jest.fn(path => path.substring(0, path.lastIndexOf('/'))),
  extname: jest.fn(path => {
    const parts = path.split('.');
    return parts.length > 1 ? `.${parts[parts.length - 1]}` : '';
  }),
  basename: jest.fn(path => {
    const parts = path.split('/');
    return parts[parts.length - 1];
  })
}));

jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
}));

describe('File Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.UPLOADS_DIR = 'uploads';
  });

  describe('saveFile', () => {
    it('debería guardar un archivo correctamente', async () => {
      // Arrange
      const fileData = Buffer.from('contenido del archivo');
      const fileName = 'test-file.pdf';
      const subDir = 'documentos';
      
      fs.existsSync.mockReturnValue(true);
      path.join.mockImplementation((...args) => args.join('/'));
      fs.promises.writeFile.mockResolvedValue();
      
      // Act
      const result = await fileUtils.saveFile(fileData, fileName, subDir);
      
      // Assert
      expect(result).toBeDefined();
      expect(path.join).toHaveBeenCalledWith('uploads', 'documentos', expect.stringContaining('test-file'));
      expect(fs.promises.writeFile).toHaveBeenCalled();
    });
    
    it('debería crear el directorio si no existe', async () => {
      // Arrange
      const fileData = Buffer.from('contenido del archivo');
      const fileName = 'test-file.pdf';
      const subDir = 'documentos';
      
      fs.existsSync.mockReturnValue(false);
      path.join.mockImplementation((...args) => args.join('/'));
      fs.promises.mkdir.mockResolvedValue();
      fs.promises.writeFile.mockResolvedValue();
      
      // Act
      const result = await fileUtils.saveFile(fileData, fileName, subDir);
      
      // Assert
      expect(fs.promises.mkdir).toHaveBeenCalledWith('uploads/documentos', { recursive: true });
      expect(fs.promises.writeFile).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
    
    it('debería manejar errores durante el guardado del archivo', async () => {
      // Arrange
      const fileData = Buffer.from('contenido del archivo');
      const fileName = 'test-file.pdf';
      const subDir = 'documentos';
      
      fs.existsSync.mockReturnValue(true);
      path.join.mockImplementation((...args) => args.join('/'));
      fs.promises.writeFile.mockRejectedValue(new Error('Error al escribir archivo'));
      
      // Act & Assert
      await expect(fileUtils.saveFile(fileData, fileName, subDir)).rejects.toThrow('Error al guardar el archivo');
    });
  });

  describe('getFile', () => {
    it('debería obtener un archivo correctamente', async () => {
      // Arrange
      const filePath = 'uploads/documentos/test-file.pdf';
      const fileContent = Buffer.from('contenido del archivo');
      
      fs.promises.access.mockResolvedValue();
      fs.promises.readFile.mockResolvedValue(fileContent);
      
      // Act
      const result = await fileUtils.getFile(filePath);
      
      // Assert
      expect(result).toEqual(fileContent);
      expect(fs.promises.access).toHaveBeenCalledWith(filePath, fs.constants.F_OK);
      expect(fs.promises.readFile).toHaveBeenCalledWith(filePath);
    });
    
    it('debería lanzar un error si el archivo no existe', async () => {
      // Arrange
      const filePath = 'uploads/documentos/nonexistent-file.pdf';
      
      fs.promises.access.mockRejectedValue(new Error('ENOENT: no such file or directory'));
      
      // Act & Assert
      await expect(fileUtils.getFile(filePath)).rejects.toThrow('Archivo no encontrado');
    });
  });

  describe('deleteFile', () => {
    it('debería eliminar un archivo correctamente', async () => {
      // Arrange
      const filePath = 'uploads/documentos/test-file.pdf';
      
      fs.promises.access.mockResolvedValue();
      fs.promises.unlink.mockResolvedValue();
      
      // Act
      await fileUtils.deleteFile(filePath);
      
      // Assert
      expect(fs.promises.access).toHaveBeenCalledWith(filePath, fs.constants.F_OK);
      expect(fs.promises.unlink).toHaveBeenCalledWith(filePath);
    });
    
    it('debería manejar el caso cuando el archivo no existe', async () => {
      // Arrange
      const filePath = 'uploads/documentos/nonexistent-file.pdf';
      
      fs.promises.access.mockRejectedValue(new Error('ENOENT: no such file or directory'));
      
      // Act
      await fileUtils.deleteFile(filePath);
      
      // Assert
      expect(fs.promises.access).toHaveBeenCalledWith(filePath, fs.constants.F_OK);
      expect(fs.promises.unlink).not.toHaveBeenCalled();
    });
  });

  describe('isValidFileType', () => {
    it('debería validar correctamente tipos de archivo permitidos', () => {
      // Arrange
      const allowedTypes = ['pdf', 'jpg', 'png'];
      const validFiles = [
        { originalname: 'document.pdf' },
        { originalname: 'image.jpg' },
        { originalname: 'photo.png' }
      ];
      
      // Act & Assert
      validFiles.forEach(file => {
        expect(fileUtils.isValidFileType(file, allowedTypes)).toBe(true);
      });
    });
    
    it('debería rechazar tipos de archivo no permitidos', () => {
      // Arrange
      const allowedTypes = ['pdf', 'jpg', 'png'];
      const invalidFiles = [
        { originalname: 'document.doc' },
        { originalname: 'script.js' },
        { originalname: 'data.csv' }
      ];
      
      // Act & Assert
      invalidFiles.forEach(file => {
        expect(fileUtils.isValidFileType(file, allowedTypes)).toBe(false);
      });
    });
    
    it('debería manejar nombres de archivo sin extensión', () => {
      // Arrange
      const allowedTypes = ['pdf', 'jpg', 'png'];
      const fileWithoutExt = { originalname: 'noextension' };
      
      // Act
      const result = fileUtils.isValidFileType(fileWithoutExt, allowedTypes);
      
      // Assert
      expect(result).toBe(false);
    });
    
    it('debería manejar valores inválidos', () => {
      // Arrange
      const allowedTypes = ['pdf', 'jpg', 'png'];
      const invalidValues = [null, undefined, {}, [], 123, true];
      
      // Act & Assert
      invalidValues.forEach(value => {
        expect(fileUtils.isValidFileType(value, allowedTypes)).toBe(false);
      });
    });
  });
});