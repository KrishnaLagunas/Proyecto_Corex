const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Asegura que el directorio exista
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Configuración de almacenamiento para documentos de trámites
const documentosStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const baseDir = path.join(__dirname, '../uploads/documentos');
    ensureDir(baseDir);
    cb(null, baseDir);
  },
  filename: (req, file, cb) => {
    const tramiteId = req.params?.id || 'unknown';
    const timestamp = Date.now();
    const safeOriginal = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_');
    cb(null, `${tramiteId}_${timestamp}_${safeOriginal}`);
  }
});

// Filtro de tipos permitidos
function documentosFileFilter(req, file, cb) {
  const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Formato de archivo no permitido. Use PDF, JPG o PNG'));
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