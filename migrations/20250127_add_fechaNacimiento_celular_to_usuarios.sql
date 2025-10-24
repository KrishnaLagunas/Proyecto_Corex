-- Migración para agregar campos fechaNacimiento y celular a la tabla usuarios
-- Fecha: 2025-01-27

USE erp_municipal;

-- Agregar campo fechaNacimiento
ALTER TABLE usuarios 
ADD COLUMN fecha_nacimiento DATE NULL AFTER rut;

-- Agregar campo celular
ALTER TABLE usuarios 
ADD COLUMN celular VARCHAR(20) NULL AFTER fecha_nacimiento;

-- Hacer que telefono y direccion sean opcionales (NULL)
ALTER TABLE usuarios 
MODIFY COLUMN telefono VARCHAR(20) NULL;

ALTER TABLE usuarios 
MODIFY COLUMN direccion VARCHAR(200) NULL;

-- Agregar índices para mejorar el rendimiento
CREATE INDEX idx_fecha_nacimiento ON usuarios(fecha_nacimiento);
CREATE INDEX idx_celular ON usuarios(celular);

-- Comentarios para documentar los cambios
ALTER TABLE usuarios 
COMMENT = 'Tabla de usuarios actualizada con campos fecha_nacimiento y celular para registro completo de ciudadanos';