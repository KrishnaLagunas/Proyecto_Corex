-- Script para generar datos de prueba para el ERP Municipal

USE erp_municipal;

-- Insertar usuarios de prueba
INSERT INTO usuarios (nombre, apellido, email, password, role, rut, telefono, direccion, estado)
VALUES 
-- Funcionarios
('Juan', 'Pérez', 'jperez@municipalidad.cl', '$2a$10$XgzYRVnrXefxQDYLHAECnOQp.RQlYUU3AEPeQA9vOHWRQXCGY1w.i', 'funcionario', '12345678-9', '912345678', 'Calle Funcionario 123', 'activo'),
('María', 'González', 'mgonzalez@municipalidad.cl', '$2a$10$XgzYRVnrXefxQDYLHAECnOQp.RQlYUU3AEPeQA9vOHWRQXCGY1w.i', 'funcionario', '98765432-1', '987654321', 'Avenida Municipal 456', 'activo'),
('Pedro', 'Soto', 'psoto@municipalidad.cl', '$2a$10$XgzYRVnrXefxQDYLHAECnOQp.RQlYUU3AEPeQA9vOHWRQXCGY1w.i', 'funcionario', '11222333-4', '911223344', 'Pasaje Funcionario 789', 'activo'),

-- Ciudadanos
('Ana', 'Martínez', 'amartinez@mail.com', '$2a$10$XgzYRVnrXefxQDYLHAECnOQp.RQlYUU3AEPeQA9vOHWRQXCGY1w.i', 'ciudadano', '11111111-1', '911111111', 'Calle Ciudadano 111', 'activo'),
('Carlos', 'López', 'clopez@mail.com', '$2a$10$XgzYRVnrXefxQDYLHAECnOQp.RQlYUU3AEPeQA9vOHWRQXCGY1w.i', 'ciudadano', '22222222-2', '922222222', 'Avenida Vecino 222', 'activo'),
('Laura', 'Díaz', 'ldiaz@mail.com', '$2a$10$XgzYRVnrXefxQDYLHAECnOQp.RQlYUU3AEPeQA9vOHWRQXCGY1w.i', 'ciudadano', '33333333-3', '933333333', 'Pasaje Residente 333', 'activo'),
('Roberto', 'Silva', 'rsilva@mail.com', '$2a$10$XgzYRVnrXefxQDYLHAECnOQp.RQlYUU3AEPeQA9vOHWRQXCGY1w.i', 'ciudadano', '44444444-4', '944444444', 'Calle Contribuyente 444', 'activo'),
('Carmen', 'Rojas', 'crojas@mail.com', '$2a$10$XgzYRVnrXefxQDYLHAECnOQp.RQlYUU3AEPeQA9vOHWRQXCGY1w.i', 'ciudadano', '55555555-5', '955555555', 'Avenida Habitante 555', 'activo');
-- Nota: Todas las contraseñas son 'admin123' hasheadas con bcrypt

-- Actualizar responsables de departamentos
UPDATE departamentos SET responsable_id = 2 WHERE codigo = 'ADMIN-001';
UPDATE departamentos SET responsable_id = 3 WHERE codigo = 'DOM-001';
UPDATE departamentos SET responsable_id = 4 WHERE codigo = 'TRANS-001';
UPDATE departamentos SET responsable_id = 2 WHERE codigo = 'FIN-001';
UPDATE departamentos SET responsable_id = 3 WHERE codigo = 'DIDECO-001';

-- Insertar trámites de prueba
INSERT INTO tramites (codigo, titulo, descripcion, tipo, estado, fecha_solicitud, prioridad, requiere_pago, monto, ciudadano_id, funcionario_id, departamento_id)
VALUES
('CERT-2301-0001', 'Certificado de Residencia', 'Solicitud de certificado de residencia para trámites bancarios', 'certificado', 'finalizado', DATE_SUB(NOW(), INTERVAL 30 DAY), 'media', true, 5000.00, 5, 2, 1),
('PERM-2301-0001', 'Permiso de Construcción', 'Solicitud de permiso para ampliación de vivienda', 'permiso', 'en_proceso', DATE_SUB(NOW(), INTERVAL 15 DAY), 'alta', true, 150000.00, 6, 3, 2),
('LIC-2301-0001', 'Licencia de Conducir', 'Renovación de licencia de conducir clase B', 'licencia', 'en_revision', DATE_SUB(NOW(), INTERVAL 10 DAY), 'media', true, 45000.00, 7, 4, 3),
('REC-2301-0001', 'Reclamo por Ruidos', 'Reclamo por ruidos molestos de local comercial', 'reclamo', 'pendiente', DATE_SUB(NOW(), INTERVAL 5 DAY), 'baja', false, 0.00, 8, NULL, 5),
('SOL-2301-0001', 'Solicitud de Poda', 'Solicitud de poda de árbol en vía pública', 'solicitud', 'aprobado', DATE_SUB(NOW(), INTERVAL 20 DAY), 'baja', false, 0.00, 9, 2, 5);

-- Insertar pagos de prueba
INSERT INTO pagos (codigo, monto, fecha_pago, metodo_pago, estado, referencia_externa, notas, tramite_id, ciudadano_id, funcionario_id)
VALUES
('PAG-230101-0001', 5000.00, DATE_SUB(NOW(), INTERVAL 28 DAY), 'efectivo', 'completado', NULL, 'Pago realizado en caja municipal', 1, 5, 2),
('PAG-230115-0001', 75000.00, DATE_SUB(NOW(), INTERVAL 14 DAY), 'transferencia', 'completado', 'TRANS123456', 'Primera cuota permiso construcción', 2, 6, 3),
('PAG-230115-0002', 75000.00, DATE_SUB(NOW(), INTERVAL 13 DAY), 'tarjeta_credito', 'pendiente', 'TC987654', 'Segunda cuota permiso construcción', 2, 6, NULL),
('PAG-230120-0001', 45000.00, DATE_SUB(NOW(), INTERVAL 9 DAY), 'tarjeta_debito', 'procesando', 'TD456789', 'Pago licencia de conducir', 3, 7, 4);

-- Insertar documentos de prueba
INSERT INTO documentos (nombre, descripcion, tipo, ruta_archivo, mime_type, tamaño, es_publico, tramite_id, usuario_id)
VALUES
('certificado_residencia.pdf', 'Certificado de residencia emitido', 'certificado', '/documentos/certificados/cert_res_5.pdf', 'application/pdf', 125000, false, 1, 2),
('solicitud_construccion.pdf', 'Formulario de solicitud de permiso', 'solicitud', '/documentos/permisos/sol_const_6.pdf', 'application/pdf', 250000, false, 2, 6),
('planos_construccion.pdf', 'Planos de la ampliación', 'anexo', '/documentos/permisos/planos_6.pdf', 'application/pdf', 1500000, false, 2, 6),
('solicitud_licencia.pdf', 'Formulario de renovación de licencia', 'solicitud', '/documentos/licencias/sol_lic_7.pdf', 'application/pdf', 180000, false, 3, 7),
('foto_reclamo.jpg', 'Fotografía adjunta al reclamo', 'anexo', '/documentos/reclamos/foto_8.jpg', 'image/jpeg', 2500000, false, 4, 8),
('solicitud_poda.pdf', 'Formulario de solicitud de poda', 'solicitud', '/documentos/solicitudes/sol_poda_9.pdf', 'application/pdf', 150000, false, 5, 9);

-- Insertar presupuestos de prueba
INSERT INTO presupuestos (codigo, nombre, descripcion, año_fiscal, monto_total, monto_ejecutado, fecha_inicio, fecha_fin, estado, departamento_id, responsable_id)
VALUES
('PRES-2023-001', 'Presupuesto Operativo Administración', 'Presupuesto para gastos operativos del departamento', 2023, 50000000.00, 15000000.00, '2023-01-01', '2023-12-31', 'en_ejecucion', 1, 2),
('PRES-2023-002', 'Presupuesto Obras Municipales', 'Presupuesto para proyectos de obras municipales', 2023, 250000000.00, 75000000.00, '2023-01-01', '2023-12-31', 'en_ejecucion', 2, 3),
('PRES-2023-003', 'Presupuesto Tránsito', 'Presupuesto para departamento de tránsito', 2023, 80000000.00, 30000000.00, '2023-01-01', '2023-12-31', 'en_ejecucion', 3, 4),
('PRES-2023-004', 'Presupuesto Finanzas', 'Presupuesto para departamento de finanzas', 2023, 40000000.00, 12000000.00, '2023-01-01', '2023-12-31', 'en_ejecucion', 4, 2),
('PRES-2023-005', 'Presupuesto DIDECO', 'Presupuesto para desarrollo comunitario', 2023, 120000000.00, 45000000.00, '2023-01-01', '2023-12-31', 'en_ejecucion', 5, 3);

-- Insertar proveedores de prueba
INSERT INTO proveedores (codigo, razon_social, nombre_comercial, rut, direccion, ciudad, region, telefono, email, sitio_web, representante_legal, rut_representante, giro, categoria, estado, calificacion, cuenta_bancaria, banco, tipo_cuenta, registrado_por)
VALUES
('PROV-23-0001', 'Constructora Los Andes SpA', 'Constructora Los Andes', '76123456-7', 'Av. Construcción 123', 'Santiago', 'Metropolitana', '912345678', 'contacto@losandes.cl', 'www.losandes.cl', 'Jorge Construcción', '12345678-9', 'Construcción y obras civiles', 'construccion', 'activo', 4, '123456789', 'Banco Estado', 'Corriente', 1),
('PROV-23-0002', 'Tecnología Municipal Ltda.', 'TecMuni', '76234567-8', 'Calle Tecnología 456', 'Santiago', 'Metropolitana', '923456789', 'contacto@tecmuni.cl', 'www.tecmuni.cl', 'Ana Tecnología', '23456789-0', 'Servicios informáticos', 'tecnologia', 'activo', 5, '234567890', 'Banco Santander', 'Corriente', 1),
('PROV-23-0003', 'Suministros Oficina S.A.', 'OficiMuni', '76345678-9', 'Pasaje Suministros 789', 'Santiago', 'Metropolitana', '934567890', 'contacto@oficimuni.cl', 'www.oficimuni.cl', 'Pedro Suministros', '34567890-1', 'Venta de artículos de oficina', 'suministros', 'activo', 3, '345678901', 'Banco de Chile', 'Corriente', 1),
('PROV-23-0004', 'Consultores Municipales SpA', 'ConMuni', '76456789-0', 'Av. Consultoría 321', 'Santiago', 'Metropolitana', '945678901', 'contacto@conmuni.cl', 'www.conmuni.cl', 'Laura Consultora', '45678901-2', 'Servicios de consultoría', 'consultoria', 'activo', 4, '456789012', 'Banco BCI', 'Corriente', 1),
('PROV-23-0005', 'Servicios Generales Ltda.', 'ServiMuni', '76567890-1', 'Calle Servicios 654', 'Santiago', 'Metropolitana', '956789012', 'contacto@servimuni.cl', 'www.servimuni.cl', 'Carlos Servicios', '56789012-3', 'Servicios generales', 'servicios', 'activo', 3, '567890123', 'Banco Itaú', 'Corriente', 1);

-- Insertar proyectos de prueba
INSERT INTO proyectos (codigo, nombre, descripcion, tipo, fecha_inicio, fecha_fin_estimada, presupuesto_asignado, presupuesto_ejecutado, estado, porcentaje_avance, ubicacion, beneficiarios, objetivos, departamento_id, responsable_id, presupuesto_id)
VALUES
('INFR-23-001', 'Mejoramiento Plaza Central', 'Proyecto de renovación de la plaza central de la comuna', 'infraestructura', '2023-03-01', '2023-08-31', 120000000.00, 60000000.00, 'en_ejecucion', 50, 'Plaza Central, Comuna', 15000, 'Mejorar espacios públicos para la comunidad', 2, 3, 2),
('SOC-23-001', 'Programa Adulto Mayor Activo', 'Programa de actividades para adultos mayores', 'social', '2023-02-15', '2023-12-15', 35000000.00, 15000000.00, 'en_ejecucion', 40, 'Centro Comunitario Municipal', 2500, 'Mejorar calidad de vida de adultos mayores', 5, 3, 5),
('AMB-23-001', 'Reforestación Parque Municipal', 'Proyecto de plantación de árboles nativos', 'ambiental', '2023-04-01', '2023-10-31', 25000000.00, 10000000.00, 'en_ejecucion', 40, 'Parque Municipal', 30000, 'Aumentar áreas verdes y mejorar calidad del aire', 5, 3, 5),
('TEC-23-001', 'Modernización Sistemas Municipales', 'Actualización de sistemas informáticos', 'tecnologico', '2023-01-15', '2023-07-15', 50000000.00, 30000000.00, 'en_ejecucion', 60, 'Edificio Consistorial', 500, 'Mejorar eficiencia de procesos internos', 1, 2, 1),
('CULT-23-001', 'Festival Cultural Comunal', 'Festival anual de cultura y artes', 'cultural', '2023-05-01', '2023-12-15', 40000000.00, 15000000.00, 'en_ejecucion', 35, 'Diversos puntos de la comuna', 20000, 'Fomentar actividades culturales y artísticas', 5, 3, 5);

-- Insertar contratos de prueba
INSERT INTO contratos (codigo, titulo, descripcion, tipo, modalidad, fecha_inicio, fecha_termino, monto_total, estado, tiene_garantia, monto_garantia, fecha_garantia, condiciones_pago, proveedor_id, departamento_id, proyecto_id, responsable_id)
VALUES
('OBRA-23-001', 'Contrato Mejoramiento Plaza Central', 'Contrato para la ejecución del proyecto de mejoramiento', 'obra', 'licitacion_publica', '2023-03-01', '2023-08-31', 120000000.00, 'activo', true, 12000000.00, '2023-09-30', 'Pagos mensuales contra avance', 1, 2, 1, 3),
('SERV-23-001', 'Contrato Programa Adulto Mayor', 'Contrato para la implementación del programa', 'servicios', 'licitacion_privada', '2023-02-15', '2023-12-15', 35000000.00, 'activo', true, 3500000.00, '2023-12-31', 'Pagos trimestrales', 5, 5, 2, 3),
('SERV-23-002', 'Contrato Reforestación', 'Contrato para el proyecto de reforestación', 'servicios', 'licitacion_publica', '2023-04-01', '2023-10-31', 25000000.00, 'activo', true, 2500000.00, '2023-11-30', 'Pagos contra hitos de avance', 5, 5, 3, 3),
('CONS-23-001', 'Contrato Modernización Sistemas', 'Contrato para la modernización de sistemas', 'consultoria', 'licitacion_publica', '2023-01-15', '2023-07-15', 50000000.00, 'activo', true, 5000000.00, '2023-08-15', 'Pagos mensuales', 2, 1, 4, 2),
('SERV-23-003', 'Contrato Festival Cultural', 'Contrato para la organización del festival', 'servicios', 'licitacion_privada', '2023-05-01', '2023-12-15', 40000000.00, 'activo', false, NULL, NULL, 'Pagos contra eventos realizados', 4, 5, 5, 3);