-- Migración: agregar columnas de nombres/apellidos separados a usuarios
-- Fecha: 2025-10-08

USE erp_municipal;

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS primer_nombre VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS segundo_nombre VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS primer_apellido VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS segundo_apellido VARCHAR(100) NULL;

-- Poblar columnas nuevas desde nombre/apellido combinados si no existen
UPDATE usuarios
SET 
  primer_nombre = COALESCE(primer_nombre, SUBSTRING_INDEX(nombre, ' ', 1)),
  segundo_nombre = COALESCE(segundo_nombre, NULLIF(TRIM(SUBSTRING(nombre, LENGTH(SUBSTRING_INDEX(nombre, ' ', 1)) + 2)), '')),
  primer_apellido = COALESCE(primer_apellido, SUBSTRING_INDEX(apellido, ' ', 1)),
  segundo_apellido = COALESCE(segundo_apellido, NULLIF(TRIM(SUBSTRING(apellido, LENGTH(SUBSTRING_INDEX(apellido, ' ', 1)) + 2)), ''));