# Informe de Requerimientos del Sistema ERP Municipal

Fecha: 2025-12-01

## Requerimientos Funcionales

- Gestión de Municipalidades
  - Listar municipalidades con columnas: ID, Nombre, RUT, Email, Teléfono, Dirección, Región, Comuna, y Acciones (Ver, Editar, Eliminar).
  - Crear municipalidad con captura de datos: Nombre del municipio (obligatorio), RUT (obligatorio), Teléfono (obligatorio), Dirección (obligatorio), Región (obligatorio), Comuna (obligatorio), Correo electrónico (opcional).
  - Editar municipalidad mostrando los datos prellenados y permitiendo actualizar los mismos campos.
  - Ver detalle de municipalidad mostrando todos los campos relevantes.

- Rol Superadministrador
  - Ver el menú con acceso directo a la vista de `Municipalidades` como sección principal.
  - Crear usuarios exclusivamente con rol `Administrador`, obligando a seleccionar la `Municipalidad` asociada. No se muestran opciones de `Funcionario` ni otros roles.

- Rol Administrador
  - Acceder únicamente a los recursos de su `municipalidad_id`: trámites, pagos, usuarios, dashboard general y reportes, todos filtrados por su municipalidad.
  - Crear y gestionar funcionarios dentro de su propia municipalidad.

- Usuarios
  - Listar usuarios con filtro automático por `municipalidad_id` cuando el rol del solicitante es `administrador`.

- API de Municipalidades
  - Endpoints REST en `\api\municipalidades` para listar (con paginación), obtener por ID, crear, actualizar y eliminar municipalidades.
  - La API expone consistentemente `email` y `telefono`, normalizando los alias de base de datos (`email_contacto`, `telefono_contacto`).

## Requerimientos No Funcionales

- Seguridad y Control de Acceso
  - Autenticación basada en JWT y middleware `isAuthenticated`.
  - Autorización por roles con `hasRole`, mapeando nombres de rol y restringiendo acciones de Superadmin/Administrador.
  - Validación de entradas con Joi, rechazando datos inválidos y evitando campos desconocidos; esquemas ampliados para aceptar los campos de municipalidad.

- Usabilidad
  - Notificaciones de éxito/error en el frontend.
  - Indicador de carga durante operaciones.
  - Preselección de Región/Comuna en edición y buscador de municipalidades.

- Compatibilidad y Consistencia de Datos
  - Normalización de campos `email`/`telefono` para soportar los alias `email_contacto` y `telefono_contacto` provenientes de la base de datos.

- Rendimiento
  - Paginación y ordenamiento en listados usando `findAndCountAll`.

- Mantenibilidad
  - Separación clara entre controladores, rutas y validaciones.
  - Respuestas de API normalizadas para simplificar el renderizado en el frontend.

- Observabilidad y Manejo de Errores
  - Middleware centralizado de errores con logging.
  - Mensajes de error claros en API y notificaciones en UI.

## Trazabilidad Técnica (Referencias de Implementación)

- Menú Superadmin y carga de vista
  - `public/js/auth.js:1136-1147` y `public/js/auth.js:1163-1169`.

- Formulario de creación/edición de usuarios (Superadmin)
  - `public/js/usuarios.js:772-781`, `public/js/usuarios.js:787-799`.
  
- Validación y lógica de creación de usuarios
  - `src/controllers/usuarios.controller.js:237-249` (Superadmin solo crea Administradores y exige `municipalidad_id`).
  - `src/controllers/usuarios.controller.js:47-58` (listado de usuarios filtrado por `municipalidad_id` para Administradores).

- Gestión de Municipalidades (Frontend)
  - Tabla con columnas completas: `public/js/departamentos.js:381-396`, `public/js/departamentos.js:408-417`.
  - Formulario con campos completos y prellenado: `public/js/departamentos.js:470-521`.
  - Normalización previa de datos: `public/js/departamentos.js:357-366`.
  - Detalle de municipalidad: `public/js/departamentos.js:589-617`.

- Gestión de Municipalidades (Backend)
  - Listado con normalización de salida: `src/controllers/departamentos.controller.js:59-74`.
  - Detalle por ID con normalización: `src/controllers/departamentos.controller.js:86-94`.
  - Crear municipalidad aceptando todos los campos: `src/controllers/departamentos.controller.js:111-121`.
  - Actualizar municipalidad aceptando todos los campos: `src/controllers/departamentos.controller.js:167-179`.

- Validaciones
  - Joi para creación/actualización de municipalidad: `src/validations/departamento.validation.js:46-53`.
  - Middleware de validación que restringe/normaliza body: `src/middlewares/validator.middleware.js:13-23`.

- Alcance por municipalidad en controladores
  - Trámites: `src/controllers/tramites.controller.js:101-103`, `349-357`, `467-468`.
  - Pagos: `src/controllers/pagos.controller.js:84-119`, `225-233`, `334-342`.
  - Dashboard: `src/controllers/dashboard.controller.js:23-25`, `33-36`, `76`, `93`.

## Observaciones

- Registros creados antes de ampliar los esquemas de validación pueden tener campos en `NULL`; la edición ahora permite completarlos y la tabla los refleja tras guardar.

## Retroalimentación del Estado del Sistema

- Municipalidades
  - La vista principal para Superadministrador es “Gestión de Municipalidades”, con tabla completa y acciones Ver/Editar/Eliminar.
  - El formulario de creación/edición capta y prellena: Nombre, RUT, Email, Teléfono, Dirección, Región y Comuna.
  - La API normaliza y expone siempre `email` y `telefono` aunque la BD utilice `email_contacto` y `telefono_contacto`.
  - Se resolvió la falta de visualización de columnas adicionales en la tabla y el prellenado en edición.

- Usuarios y Roles
  - Superadministrador crea únicamente usuarios con rol `Administrador`, con `municipalidad_id` obligatorio (formulario y validación servidor).
  - Administrador ve y gestiona solo recursos de su municipalidad (usuarios, trámites, pagos, dashboard, reportes).
  - Listado de usuarios se auto-filtra por `municipalidad_id` cuando el solicitante es Administrador.

- Trámites
  - Endpoints de trámites integrados con filtrado por `municipalidad_id` cuando el rol es Administrador.
  - Estados de trámite manejados por la API; se verifica acceso y alcance por rol.
  - Lógica de listado y métricas preparada para restringir datos a la municipalidad correspondiente.

- Pagos
  - Endpoints de pagos con filtrado por `municipalidad_id` para Administradores.
  - Estados de pago consistentes (`pendiente`, `completado`, `rechazado`).
  - Integración con dashboard para métricas de pagos por municipalidad.

- Departamentos
  - Se mantiene compatibilidad con rutas de departamentos y municipalidades; el backend direcciona correctamente según el contexto.
  - Validaciones actualizadas para aceptar todos los campos requeridos en la creación/edición de municipalidades aun cuando se usen rutas históricas.

- Dashboard y Reportes
  - Métricas de trámites y pagos filtradas por `municipalidad_id` para Administradores.
  - Acceso global para Superadministrador.

- Seguridad y Validación
  - Autenticación basada en token con fallback controlado para desarrollo.
  - Autorización por rol para proteger creación/edición y acceso a endpoints.
  - Validaciones con Joi en crear/actualizar municipalidades y usuarios (ampliadas para evitar descarte de campos relevantes).

- Frontend (UX)
  - Normalización de datos antes de renderizar la tabla y el formulario evita celdas vacías por alias de columnas.
  - Indicador de carga y notificaciones de acción mejoran la experiencia.
  - Preselección de Región/Comuna en edición basada en el valor textual almacenado.

- Consideraciones de Datos Existentes
- Registros previos a la ampliación de validaciones pueden tener valores `NULL`; al editar se permite completar la información para normalizar el dataset.

## Guía Operativa Paso a Paso

- Inicio de sesión
  - Usuarios del sistema (Administrador, Superadministrador, Funcionario) inician sesión y obtienen un token JWT para acceder a la UI y API. `src/controllers/auth.controller.js:86-132`.

- Superadministrador: creación de municipalidades y administradores
  - Entra a “Gestión de Municipalidades” y crea una nueva municipalidad con todos los campos requeridos.
  - Crea un usuario Administrador y lo asocia a la municipalidad recién creada. La UI fuerza el rol “Administrador”. `public/js/usuarios.js:772-799`. Validación servidor: `src/controllers/usuarios.controller.js:237-249`.

- Administrador: gestión dentro de su municipalidad
  - Accede a usuarios, trámites, pagos, dashboard y reportes, siempre filtrados por su `municipalidad_id`. Lógica de scoping: `src/controllers/usuarios.controller.js:47-58`, `src/controllers/tramites.controller.js:101-103`, `src/controllers/pagos.controller.js:84-119`, `src/controllers/dashboard.controller.js:23-36`.
  - Puede crear y gestionar funcionarios vinculados a su municipalidad.

- Ciudadano: trámites y pagos
  - Inicia sesión o se autentica como ciudadano; el sistema sincroniza con la tabla `usuarios` si es necesario. `src/controllers/ciudadanos.controller.js:135-173`.
  - Crea/gestiona trámites propios; puede ver documentos asociados a sus trámites. Verificación de permisos: `src/controllers/tramites.controller.js:836-841`, documentos: `src/controllers/tramites.controller.js:607-622`.
  - Inicia pago de un trámite mediante Mercado Pago solicitando una preferencia y navegando al checkout. Endpoint: `POST /api/mercado-pago/preferencias` `src/routes/mercadopago.routes.js:11`, controlador: `src/controllers/mercadopago.controller.js:54-106`.

- Dashboard y reportes
  - Consulta métricas de trámites y pagos; los administradores ven datos acotados a su municipalidad, el superadministrador ve información global. `src/controllers/dashboard.controller.js:23-36`.

- Normalización de datos
  - La API de municipalidades normaliza `email` y `telefono` para coincidir con alias de BD; el frontend también normaliza antes de renderizar. `src/controllers/departamentos.controller.js:59-74`, `public/js/departamentos.js:357-366`.

## Ejemplos por Módulo

- Usuarios
  - Tabla de usuarios: listar, buscar por texto, filtrar por estado, crear, editar, activar/inactivar. Scoping por `municipalidad_id` para administradores. `src/controllers/usuarios.controller.js:47-110`, cambio de estado: `src/controllers/usuarios.controller.js:630-677`.
  - Acciones disponibles: crear administrador (Superadmin), crear funcionario/gestionar usuarios (Administrador de la municipalidad).

- Municipalidades
  - Tabla: columnas completas (ID, Nombre, RUT, Email, Teléfono, Dirección, Región, Comuna) y acciones Ver/Editar/Eliminar. `public/js/departamentos.js:381-396`, render de filas: `public/js/departamentos.js:408-417`.
  - Crear/Editar: formulario con prellenado; guarda todos los campos. Frontend: `public/js/departamentos.js:470-573`. Backend crear/actualizar: `src/controllers/departamentos.controller.js:111-121`, `src/controllers/departamentos.controller.js:167-179`.
  - Detalle: muestra campos normalizados con alias. `public/js/departamentos.js:589-617`.

- Departamentos
  - Compatibilidad con rutas históricas y validación extendida. Rutas: `src/routes/departamentos.routes.js:39-63`. Validaciones ampliadas: `src/validations/departamento.validation.js:46-53`.

- Trámites
  - CRUD y documentos asociados al trámite. Documentos por trámite: `src/controllers/tramites.controller.js:607-622`.
  - Permisos: ciudadanos solo ven sus trámites; administradores y funcionarios según reglas del sistema. `src/controllers/tramites.controller.js:836-841`.

- Pagos
  - Integración con Mercado Pago para crear preferencias y redirigir a checkout. `src/controllers/mercadopago.controller.js:54-106`.
  - Estados de pago consistentes y métricas en dashboard. `src/controllers/pagos.controller.js:84-119` y dashboard: `src/controllers/dashboard.controller.js:76, 93`.

- Dashboard
  - Métricas por municipalidad y globales, respetando roles. `src/controllers/dashboard.controller.js:23-36`.

- Seguridad
  - Inicio de sesión con JWT; autorización por rol; validaciones con Joi. `src/controllers/auth.controller.js:86-132`, `src/middlewares/auth.middleware.js:1-71`, `src/middlewares/validator.middleware.js:13-23`.

## Diagrama de Entidad–Relación

![Diagrama ER](assets/er-diagrama.svg)

### ER escrito con tablas solicitadas

- Entidades
  - `usuarios`: id, nombre, apellido, email, password, `id_rol` (FK), `municipalidad_id` (FK), rut, teléfono, dirección, estado.
  - `rol`: id, nombre.
  - `municipalidades`: id, nombre, rut, `email_contacto`, `telefono_contacto`, dirección, región, comuna, estado, created_at, updated_at.
  - `tramites`: id, `ciudadano_id` (FK a `usuarios`), `funcionario_id` (FK a `usuarios`), `municipalidad_id` (FK), estado, created_at, updated_at.
  - `documentos`: id, `tramite_id` (FK), `usuario_id` (FK), ruta_archivo, mime_type, tamaño, es_publico, created_at.
  - `pagos`: id, `tramite_id` (FK), `ciudadano_id` (FK a `usuarios`), `funcionario_id` (FK a `usuarios`), estado, monto, created_at.
  - `ciudadanos`: id, nombres y apellidos, rut, teléfono, email, dirección, `region_id` (FK), `comuna_id` (FK), password, estado.
  - `regiones`: id, nombre.
  - `comunas`: id, nombre, `region_id` (FK).
  - `departamentos`: id, nombre, `municipalidad_id` (FK).
  - `configuraciones_pago`: id, tramite_nombre, año, modalidad, monto_fijo, porcentaje, categoría, estado.

- Relaciones y cardinalidades
  - `usuarios` N–1 `rol`: cada usuario pertenece a un rol.
  - `usuarios` N–1 `municipalidades`: cada usuario pertenece a una municipalidad.
  - `tramites` N–1 `municipalidades`: cada trámite pertenece a una municipalidad.
  - `tramites` N–1 `usuarios` (como ciudadano): `tramites.ciudadano_id → usuarios.id`.
  - `tramites` N–1 `usuarios` (como funcionario): `tramites.funcionario_id → usuarios.id`.
  - `documentos` N–1 `tramites`: cada documento pertenece a un trámite.
  - `documentos` N–1 `usuarios`: cada documento lo sube un usuario.
  - `pagos` N–1 `tramites`: cada pago pertenece a un trámite.
  - `pagos` N–1 `usuarios` (ciudadano): `pagos.ciudadano_id → usuarios.id`.
  - `pagos` N–1 `usuarios` (funcionario): `pagos.funcionario_id → usuarios.id`.
  - `ciudadanos` N–1 `regiones`: `ciudadanos.region_id → regiones.id`.
  - `ciudadanos` N–1 `comunas`: `ciudadanos.comuna_id → comunas.id`.
  - `comunas` N–1 `regiones`: `comunas.region_id → regiones.id`.
  - `configuraciones_pago`: catálogo independiente para reglas de cobro (no tiene FK obligatorio; se vincula por `tramite_nombre/año/categoría`).
  - `departamentos` N–1 `municipalidades`: `departamentos.municipalidad_id → municipalidades.id`. Por cada municipalidad existe una serie de departamentos asociados.

Notas
- En el portal ciudadano, cuentas de `ciudadanos` pueden sincronizarse con `usuarios` para autenticación unificada; los trámites y pagos referencian `usuarios` para roles de ciudadano y funcionario.
- `municipalidades` almacenan Región y Comuna como texto para interfaz, aunque existan tablas `regiones` y `comunas` de referencia.

## Diagrama de Flujo: Superadministrador (Paso a Paso)

- Inicio de sesión
  - Paso: Ingresar credenciales y autenticar.
  - Decisión: ¿Usuario activo? Si no, rechazar; si sí, generar token JWT y acceder.
  - Resultado: Redirección al menú principal con “Municipalidades”.

- Gestión de municipalidades
  - Paso: Abrir “Gestión de Municipalidades”.
  - Acción: Listar municipalidades con columnas completas y acciones (Ver/Editar/Eliminar).
  - Decisión: ¿Crear nueva municipalidad? Si sí, mostrar formulario con Nombre, RUT, Email, Teléfono, Dirección, Región, Comuna.
  - Validación: Campos requeridos presentes; formato de email válido; RUT en formato correcto.
  - Persistencia: Guardar en `municipalidades` (normalizar `email_contacto`/`telefono_contacto`).
  - Resultado: Mostrar notificación de éxito y actualizar tabla.

- Creación de usuarios administradores
  - Paso: Abrir módulo “Administradores”.
  - Acción: Crear usuario con rol “Administrador” (única opción visible para Superadmin).
  - Decisión: ¿Municipalidad seleccionada? Si no, impedir creación; si sí, asociar `municipalidad_id`.
  - Validación: Email único, contraseña válida, estado inicial “activo”.
  - Persistencia: Guardar en `usuarios` con `id_rol` (administrador) y `municipalidad_id`.
  - Resultado: Notificación de éxito y usuario disponible para login.

- Supervisión y mantenimiento
  - Paso: Ver detalles/editar municipalidad.
  - Acción: Actualizar campos; prellenado de formulario con datos actuales.
  - Decisión: ¿Cambios válidos? Si sí, guardar; si no, mostrar errores.
  - Resultado: Tabla reflejada con datos actualizados.

- Reportes y dashboard
  - Paso: Revisar métricas globales (trámites, pagos, usuarios).
  - Alcance: Superadmin ve datos globales; administradores ven datos de su municipalidad.
  - Resultado: Visualización consolidada para toma de decisiones.

- Seguridad y errores
  - Paso: Aplicar autorización de acciones por rol (solo Superadmin crea administradores; borrar municipalidades con confirmación).
  - Validación: Schemas de Joi para entradas; middleware de errores con logging.
  - Resultado: Estado consistente del sistema y trazabilidad de errores.

## Diagrama de Flujo: Ciudadano (Paso a Paso)

- Registro o inicio de sesión
  - Paso: Si no tiene cuenta, registrarse en el portal ciudadano con nombres, apellidos, RUT, teléfono, email, password y región/comuna.
  - Decisión: ¿Email/RUT único y datos válidos? Si no, mostrar errores; si sí, crear cuenta en `ciudadanos` y hash de contraseña.
  - Alternativa: Si ya tiene cuenta, iniciar sesión como ciudadano; se sincroniza con `usuarios` si no existe. `src/controllers/ciudadanos.controller.js:135-173`.
  - Resultado: Acceso al panel del ciudadano.

- Inicio de trámite
  - Paso: Seleccionar el tipo de trámite disponible en su municipalidad.
  - Decisión: ¿Municipalidad corresponde? Se genera el trámite asociado a su `municipalidad_id`.
  - Persistencia: Crear el registro de `tramites` con `ciudadano_id` y estado inicial.
  - Resultado: Trámite creado y visible en su listado.

- Subir documentos
  - Paso: Adjuntar documentación requerida (PDF/JPG/PNG).
  - Validación: Formatos permitidos, tamaño máximo; asociar documento a trámite y usuario.
  - Persistencia: Guardar `documentos` con `tramite_id` y `usuario_id`.
  - Seguridad: Un ciudadano solo ve sus propios documentos. `src/controllers/tramites.controller.js:607-622`, `src/controllers/tramites.controller.js:836-841`.

- Pago del trámite (Mercado Pago)
  - Paso: Solicitar creación de preferencia para el pago del trámite.
  - Acción: Enviar `items` con título, cantidad, precio y moneda; el backend crea la preferencia.
  - Resultado: Recibir `init_point` y redirigir al checkout de Mercado Pago. `POST /api/mercado-pago/preferencias` `src/routes/mercadopago.routes.js:11`, `src/controllers/mercadopago.controller.js:54-106`.
  - Decisión: ¿Resultado del pago? `success`/`failure`/`pending` con retorno a `back_urls` y actualización de estado.

- Seguimiento del trámite
  - Paso: Revisar el estado del trámite en su panel.
  - Decisión: ¿Documentación completa y pago aprobado? El trámite avanza; si falta algo, se muestra estado y requerimientos.
  - Seguridad: El ciudadano solo puede consultar sus trámites; funcionarios/administradores ven según reglas y su municipalidad.

- Descarga y comprobantes
  - Paso: Descargar comprobante/boleta o resolución cuando esté disponible.
  - Persistencia: Se exponen los documentos públicos o específicos del trámite.

- Recuperación y soporte
  - Paso: Recuperar contraseña mediante email si es necesario; se actualiza en `ciudadanos` y sincroniza con `usuarios` si aplica. `src/controllers/ciudadanos.controller.js:304-368`.
  - Resultado: Nueva contraseña activa; reintentar login.

## Diagrama de Flujo: Funcionario (Paso a Paso)

- Inicio de sesión
  - Paso: Ingresar credenciales como funcionario (`rol` "secretaria comunitaria").
  - Decisión: ¿Usuario activo y rol permitido? Si sí, acceder con token JWT.
  - Resultado: Panel con acceso a trámites y pagos de su municipalidad.

- Bandeja de trámites
  - Paso: Listar trámites de su municipalidad; buscar por texto y filtrar por estado.
  - Alcance: Restricción por municipalidad definida en controladores de listados. Referencias de scoping: `src/controllers/tramites.controller.js:101-103` y `src/controllers/dashboard.controller.js:23-36`.
  - Acción: Abrir un trámite, revisar información y documentos.
  - Decisión: ¿Documentación completa? Si no, solicitar documentos adicionales al ciudadano.
  - Actualización de estado: Cambiar de `pendiente` a `en_proceso`, y posteriormente a `aprobado` o `rechazado` según evaluación.

- Documentación del trámite
  - Paso: Adjuntar documentos complementarios (informes, oficios) cuando corresponda.
  - Persistencia: Guardar `documentos` asociados al `tramite_id` y al `usuario_id` del funcionario.
  - Seguridad: Acceso limitado a trámites de su municipalidad.

- Validación de pagos
  - Paso: Consultar pagos asociados al trámite.
  - Alcance: Listados de pagos filtrados por `municipalidad_id` para roles no ciudadanos. `src/controllers/pagos.controller.js:84-119`.
  - Decisión: ¿Pago aprobado? Si sí, avanzar el trámite; si está pendiente, esperar confirmación.


- Reportes y métricas
  - Paso: Visualizar estadísticas acotadas a su municipalidad.
  - Referencia: `src/controllers/dashboard.controller.js:23-36`.

- Seguridad y cumplimiento
  - Paso: Acciones controladas por rol y ámbito; no puede editar usuarios administradores ni municipalidades.
  - Validación: Esquemas y middlewares de autorización aplican restricciones en API.

## Diseño del Modelo ER con Herramientas CASE

- Herramienta sugerida: MySQL Workbench (CASE)
  - Paso 1: Reverse Engineering
    - Abrir MySQL Workbench, conectar a la base `erp_municipal`.
    - Ejecutar “Database → Reverse Engineer” para importar tablas: `usuarios`, `rol`, `municipalidades`, `departamentos`, `tramites`, `documentos`, `pagos`, `ciudadanos`, `regiones`, `comunas`, `configuraciones_pago`.
  - Paso 2: Ajuste de relaciones
    - Definir FKs visibles: `usuarios.id_rol → rol.id`, `usuarios.municipalidad_id → municipalidades.id`, `departamentos.municipalidad_id → municipalidades.id`, `tramites.ciudadano_id → usuarios.id`, `tramites.funcionario_id → usuarios.id`, `tramites.municipalidad_id → municipalidades.id`, `documentos.tramite_id → tramites.id`, `documentos.usuario_id → usuarios.id`, `pagos.tramite_id → tramites.id`, `pagos.ciudadano_id → usuarios.id`, `pagos.funcionario_id → usuarios.id`, `ciudadanos.region_id → regiones.id`, `ciudadanos.comuna_id → comunas.id`, `comunas.region_id → regiones.id`.
  - Paso 3: Cardinalidades
    - Marcar 1–N y N–1 según la sección “ER escrito con tablas solicitadas”.
  - Paso 4: Estilos y exportación
    - Agrupar por módulo (Municipalidades/Usuarios/Trámites/Pagos/Ciudadanos/Geo).
    - Exportar a `SVG/PNG` y versionar junto al documento (`public/assets/er-diagrama.svg`).
  - Paso 5: Mantenimiento del diagrama
    - Ante cambios de esquema, volver a “Synchronize Model” para actualizar el modelo CASE y reexportar.

## Normalización de Tablas (Paso a Paso)

- Objetivo
  - Garantizar 1FN, 2FN y 3FN para las tablas: `usuarios`, `rol`, `municipalidades`, `departamentos`, `tramites`, `documentos`, `pagos`, `ciudadanos`, `regiones`, `comunas`, `configuraciones_pago`.

- Primera Forma Normal (1FN)
  - Requisito: atributos atómicos, sin grupos repetidos ni multivaluados.
  - Aplicación:
    - `municipalidades`: `email_contacto`, `telefono_contacto`, `direccion`, `region`, `comuna` son atómicos.
    - `usuarios`: nombres y apellidos están atomizados; email único; rut atomicidad y formato.
    - `documentos`: `ruta_archivo`, `mime_type`, `tamaño` únicos por registro.
    - `pagos`: `estado`, `monto` atómicos; un pago por fila.
    - `configuraciones_pago`: `tramite_nombre`, `anio`, `modalidad`, `monto_fijo`/`porcentaje` definidos sin listas.
    - `ciudadanos`: nombres/apellidos atomizados; `rut`, `telefono`, `email` atómicos.

- Segunda Forma Normal (2FN)
  - Requisito: todo atributo no clave depende completamente de la clave primaria; relevante en tablas con clave compuesta.
  - Aplicación:
    - Tablas con PK simple (`id`): cumplen 2FN trivially (`usuarios`, `rol`, `municipalidades`, `departamentos`, `tramites`, `documentos`, `pagos`, `ciudadanos`, `regiones`, `comunas`, `configuraciones_pago`).
    - Si se utiliza una tabla puente (p.ej., `departamento_usuario` con PK compuesta `departamento_id + usuario_id`), asegurar que cualquier atributo adicional (p.ej., `fecha_asignacion`) depende de ambos IDs.

- Tercera Forma Normal (3FN)
  - Requisito: no debe haber dependencias transitivas (atributo no clave dependiendo de otro atributo no clave).
  - Aplicación:
    - `usuarios`: `municipalidad_id` y `id_rol` son FKs; no introducen dependencias transitivas en atributos como `email`/`rut`.
    - `tramites`: los atributos dependen de `id`; referencias a ciudadano/funcionario/municipalidad no generan transitividad en otros campos.
    - `ciudadanos`: usar `comuna_id` que a su vez referencia `regiones` desde `comunas` evita transitividad directa. Si se almacenan ambos `region_id` y `comuna_id`, garantizar integridad para que `comuna.region_id = region_id` o eliminar `region_id` para 3FN estricta.
    - `municipalidades`: se mantienen `region` y `comuna` como texto por requisitos de interfaz; para 3FN estricta, se podría usar FKs a catálogos, pero se acepta como decisión de diseño UX.
    - `configuraciones_pago`: evitar que `modalidad` implique valores derivados en la misma fila (se permite `monto_fijo` o `porcentaje`, con validación de negocio que sean mutuamente excluyentes).

- Boyce-Codd Normal Form (BCNF) [opcional]
  - Requisito: toda dependencia funcional X→Y debe tener X como superclave.
  - Aplicación sugerida:
    - En `configuraciones_pago`, considerar índice único por (`tramite_nombre`, `anio`, `categoria`) para que la combinación actúe como clave de negocio.
    - En `usuarios`, `email` y `rut` deben ser únicos para que actúen como determinantes sin violar BCNF.

- Restricciones y claves recomendadas
  - Unicidad: `usuarios.email`, `usuarios.rut`, `ciudadanos.email`, `ciudadanos.rut`.
  - FKs: ver sección CASE (Paso 2). Añadir ON UPDATE/DELETE según reglas de negocio (normalmente `RESTRICT` o `CASCADE` en catálogos geo).
  - Checks/Enums: `usuarios.estado`, `pagos.estado`, `configuraciones_pago.modalidad`, `ciudadanos.estado`.
  - Índices: por búsqueda frecuente (`tramites.estado`, `pagos.estado`, `usuarios.municipalidad_id`).

- Decisiones de diseño aceptadas
  - `municipalidades` usa región/comuna como texto para simplificar UI; se normaliza de cara al frontend/ORM mediante alias y compatibilidad.
  - `departamentos` se relaciona N–1 con `municipalidades` para reflejar estructura organizacional.
