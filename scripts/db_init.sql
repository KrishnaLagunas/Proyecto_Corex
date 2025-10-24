-- Script de inicialización de la base de datos para el ERP Municipal

-- Crear la base de datos si no existe
CREATE DATABASE IF NOT EXISTS erp_municipal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Usar la base de datos
USE erp_municipal;

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  -- Nuevos campos: nombres y apellidos separados
  primer_nombre VARCHAR(100),
  segundo_nombre VARCHAR(100),
  primer_apellido VARCHAR(100),
  segundo_apellido VARCHAR(100),
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'funcionario', 'ciudadano') NOT NULL DEFAULT 'ciudadano',
  rut VARCHAR(12) UNIQUE,
  telefono VARCHAR(20),
  direccion VARCHAR(200),
  estado ENUM('activo', 'inactivo', 'bloqueado') DEFAULT 'activo',
  ultimo_login DATETIME,
  token_recuperacion VARCHAR(255),
  expiracion_token DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_rut (rut),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de regiones (Chile)
CREATE TABLE IF NOT EXISTS regiones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(10) NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_codigo_region (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de comunas (Chile)
CREATE TABLE IF NOT EXISTS comunas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(10) NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  region_id INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (region_id) REFERENCES regiones(id) ON DELETE CASCADE,
  INDEX idx_codigo_comuna (codigo),
  INDEX idx_region (region_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla simplificada para UI: regiones_ui (idregion, region, comuna)
CREATE TABLE IF NOT EXISTS regiones_ui (
  idregion INT NOT NULL,
  region VARCHAR(100) NOT NULL,
  comuna VARCHAR(100) NOT NULL,
  PRIMARY KEY (idregion, comuna),
  INDEX idx_region_nombre (region),
  INDEX idx_comuna_nombre (comuna)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de departamentos
CREATE TABLE IF NOT EXISTS departamentos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  -- Nuevo: RUT del departamento
  rut VARCHAR(12) UNIQUE,
  email_contacto VARCHAR(100),
  telefono_contacto VARCHAR(20),
  region VARCHAR(100),
  comuna VARCHAR(100),
  estado ENUM('activo', 'inactivo') DEFAULT 'activo',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_rut_departamento (rut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de trámites
CREATE TABLE IF NOT EXISTS tramites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(20) NOT NULL UNIQUE,
  titulo VARCHAR(100) NOT NULL,
  descripcion TEXT,
  tipo ENUM('certificado', 'permiso', 'licencia', 'reclamo', 'solicitud', 'otro') NOT NULL,
  estado ENUM('pendiente', 'en_proceso', 'en_revision', 'aprobado', 'rechazado', 'finalizado') NOT NULL DEFAULT 'pendiente',
  fecha_solicitud DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_finalizacion DATETIME,
  prioridad ENUM('baja', 'media', 'alta', 'urgente') NOT NULL DEFAULT 'media',
  notas_internas TEXT,
  requiere_pago BOOLEAN DEFAULT FALSE,
  monto DECIMAL(10,2) DEFAULT 0,
  pago_completado BOOLEAN DEFAULT FALSE,
  ciudadano_id INT NOT NULL,
  funcionario_id INT,
  departamento_id INT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (ciudadano_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (funcionario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  FOREIGN KEY (departamento_id) REFERENCES departamentos(id) ON DELETE SET NULL,
  INDEX idx_codigo (codigo),
  INDEX idx_estado (estado),
  INDEX idx_fecha_solicitud (fecha_solicitud),
  INDEX idx_ciudadano (ciudadano_id),
  INDEX idx_funcionario (funcionario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de documentos
CREATE TABLE IF NOT EXISTS documentos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  tipo ENUM('solicitud', 'certificado', 'comprobante', 'informe', 'anexo', 'otro') NOT NULL,
  ruta_archivo VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100),
  tamaño INT,
  es_publico BOOLEAN DEFAULT FALSE,
  fecha_subida DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_expiracion DATETIME,
  tramite_id INT,
  usuario_id INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tramite_id) REFERENCES tramites(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_tipo (tipo),
  INDEX idx_tramite (tramite_id),
  INDEX idx_usuario (usuario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de pagos
CREATE TABLE IF NOT EXISTS pagos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(20) NOT NULL UNIQUE,
  monto DECIMAL(10,2) NOT NULL,
  fecha_pago DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metodo_pago ENUM('efectivo', 'tarjeta_credito', 'tarjeta_debito', 'transferencia', 'cheque', 'otro') NOT NULL,
  estado ENUM('pendiente', 'procesando', 'completado', 'rechazado', 'reembolsado') NOT NULL DEFAULT 'pendiente',
  referencia_externa VARCHAR(100),
  comprobante_url VARCHAR(255),
  notas TEXT,
  tramite_id INT,
  ciudadano_id INT NOT NULL,
  funcionario_id INT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tramite_id) REFERENCES tramites(id) ON DELETE SET NULL,
  FOREIGN KEY (ciudadano_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (funcionario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  INDEX idx_codigo (codigo),
  INDEX idx_estado (estado),
  INDEX idx_fecha_pago (fecha_pago),
  INDEX idx_tramite (tramite_id),
  INDEX idx_ciudadano (ciudadano_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de presupuestos
CREATE TABLE IF NOT EXISTS presupuestos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(20) NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  año_fiscal INT NOT NULL,
  monto_total DECIMAL(15,2) NOT NULL,
  monto_ejecutado DECIMAL(15,2) NOT NULL DEFAULT 0,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  estado ENUM('planificacion', 'aprobado', 'en_ejecucion', 'cerrado', 'anulado') NOT NULL DEFAULT 'planificacion',
  notas TEXT,
  departamento_id INT,
  responsable_id INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (departamento_id) REFERENCES departamentos(id) ON DELETE SET NULL,
  FOREIGN KEY (responsable_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_codigo (codigo),
  INDEX idx_año_fiscal (año_fiscal),
  INDEX idx_estado (estado),
  INDEX idx_departamento (departamento_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de proveedores
CREATE TABLE IF NOT EXISTS proveedores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(20) NOT NULL UNIQUE,
  razon_social VARCHAR(150) NOT NULL,
  nombre_comercial VARCHAR(150),
  rut VARCHAR(12) NOT NULL UNIQUE,
  direccion VARCHAR(200) NOT NULL,
  ciudad VARCHAR(100) NOT NULL,
  region VARCHAR(100) NOT NULL,
  telefono VARCHAR(20) NOT NULL,
  email VARCHAR(100) NOT NULL,
  sitio_web VARCHAR(150),
  representante_legal VARCHAR(150) NOT NULL,
  rut_representante VARCHAR(12) NOT NULL,
  giro VARCHAR(150) NOT NULL,
  categoria ENUM('servicios', 'construccion', 'tecnologia', 'suministros', 'consultoria', 'otro') NOT NULL,
  estado ENUM('activo', 'inactivo', 'bloqueado') NOT NULL DEFAULT 'activo',
  fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  calificacion INT,
  notas TEXT,
  cuenta_bancaria VARCHAR(50),
  banco VARCHAR(100),
  tipo_cuenta VARCHAR(50),
  registrado_por INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (registrado_por) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_codigo (codigo),
  INDEX idx_rut (rut),
  INDEX idx_categoria (categoria),
  INDEX idx_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de proyectos
CREATE TABLE IF NOT EXISTS proyectos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(20) NOT NULL UNIQUE,
  nombre VARCHAR(150) NOT NULL,
  descripcion TEXT,
  tipo ENUM('infraestructura', 'social', 'ambiental', 'tecnologico', 'cultural', 'otro') NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin_estimada DATE NOT NULL,
  fecha_fin_real DATE,
  presupuesto_asignado DECIMAL(15,2) NOT NULL,
  presupuesto_ejecutado DECIMAL(15,2) NOT NULL DEFAULT 0,
  estado ENUM('planificacion', 'en_ejecucion', 'pausado', 'cancelado', 'finalizado') NOT NULL DEFAULT 'planificacion',
  porcentaje_avance INT NOT NULL DEFAULT 0,
  ubicacion VARCHAR(200),
  beneficiarios INT,
  objetivos TEXT,
  resultados_esperados TEXT,
  fuente_financiamiento VARCHAR(100),
  departamento_id INT NOT NULL,
  responsable_id INT NOT NULL,
  presupuesto_id INT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (departamento_id) REFERENCES departamentos(id) ON DELETE CASCADE,
  FOREIGN KEY (responsable_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (presupuesto_id) REFERENCES presupuestos(id) ON DELETE SET NULL,
  INDEX idx_codigo (codigo),
  INDEX idx_estado (estado),
  INDEX idx_tipo (tipo),
  INDEX idx_departamento (departamento_id),
  INDEX idx_responsable (responsable_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de contratos
CREATE TABLE IF NOT EXISTS contratos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(20) NOT NULL UNIQUE,
  titulo VARCHAR(150) NOT NULL,
  descripcion TEXT,
  tipo ENUM('servicios', 'obra', 'suministro', 'consultoria', 'concesion', 'otro') NOT NULL,
  modalidad ENUM('licitacion_publica', 'licitacion_privada', 'trato_directo', 'convenio_marco', 'otro') NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_termino DATE NOT NULL,
  monto_total DECIMAL(15,2) NOT NULL,
  moneda VARCHAR(3) NOT NULL DEFAULT 'CLP',
  estado ENUM('borrador', 'en_revision', 'aprobado', 'activo', 'finalizado', 'cancelado') NOT NULL DEFAULT 'borrador',
  id_licitacion VARCHAR(50),
  tiene_garantia BOOLEAN DEFAULT FALSE,
  monto_garantia DECIMAL(15,2),
  fecha_garantia DATE,
  condiciones_pago TEXT,
  proveedor_id INT NOT NULL,
  departamento_id INT NOT NULL,
  proyecto_id INT,
  responsable_id INT NOT NULL,
  documento_id INT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE CASCADE,
  FOREIGN KEY (departamento_id) REFERENCES departamentos(id) ON DELETE CASCADE,
  FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE SET NULL,
  FOREIGN KEY (responsable_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (documento_id) REFERENCES documentos(id) ON DELETE SET NULL,
  INDEX idx_codigo (codigo),
  INDEX idx_estado (estado),
  INDEX idx_tipo (tipo),
  INDEX idx_proveedor (proveedor_id),
  INDEX idx_proyecto (proyecto_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar usuario administrador por defecto
INSERT INTO usuarios (nombre, apellido, email, password, role, estado)
VALUES ('Admin', 'Sistema', 'admin@municipalidad.cl', '$2a$10$XgzYRVnrXefxQDYLHAECnOQp.RQlYUU3AEPeQA9vOHWRQXCGY1w.i', 'admin', 'activo');
-- Nota: La contraseña es 'admin123' hasheada con bcrypt

-- Insertar departamentos iniciales
INSERT INTO departamentos (nombre, email_contacto, telefono_contacto, estado)
VALUES 
('Administración', 'admin@municipalidad.cl', '123456789', 'activo'),
('Obras Municipales', 'obras@municipalidad.cl', '123456790', 'activo'),
('Tránsito', 'transito@municipalidad.cl', '123456791', 'activo'),
('Finanzas', 'finanzas@municipalidad.cl', '123456792', 'activo'),
('Desarrollo Comunitario', 'dideco@municipalidad.cl', '123456793', 'activo');