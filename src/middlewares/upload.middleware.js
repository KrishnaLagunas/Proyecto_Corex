const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Asegura que el directorio exista
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Configuración de almacenamiento en memoria (BLOB en BD)
const documentosStorage = multer.memoryStorage();

// Filtro de tipos permitidos
function documentosFileFilter(req, file, cb) {
  const allowed = [
    'application/pdf', 
    'image/jpeg', 
    'image/png',
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx
  ];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Formato de archivo no permitido. Use PDF, Word, JPG o PNG'));
  }
}

const documentos = multer({
  storage: documentosStorage,
  fileFilter: documentosFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

module.exports = {
  documentos
};