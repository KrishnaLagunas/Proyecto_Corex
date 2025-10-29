# ERP Municipal

## Descripción

Sistema de Gestión Municipal (ERP) para la administración eficiente de recursos, trámites, presupuestos, contratos y proyectos municipales. Esta aplicación proporciona una plataforma integral para la gestión interna del municipio y servicios al ciudadano.

## Características

- **Gestión de Usuarios y Departamentos**: Administración de funcionarios, roles y departamentos municipales.
- **Trámites Municipales**: Seguimiento y gestión de trámites ciudadanos.
- **Gestión Financiera**: Control de presupuestos, pagos y finanzas municipales.
- **Proveedores y Contratos**: Administración de proveedores y contratos municipales.
- **Proyectos Municipales**: Seguimiento de proyectos, avances y recursos asignados.
- **Portal Ciudadano**: Interfaz para que los ciudadanos realicen trámites y consultas.

## Tecnologías

- **Backend**: Node.js, Express.js
- **Base de Datos**: MySQL, Sequelize ORM
- **Autenticación**: JWT (JSON Web Tokens)
- **Documentación**: Generación de PDFs con PDFKit
- **Logging**: Winston

## Instalación

1. Clonar el repositorio:
   ```
   git clone https://github.com/tu-usuario/erp-municipal.git
   cd erp-municipal
   ```

2. Instalar dependencias:
   ```
   npm install
   ```

3. Configurar variables de entorno:
   ```
   cp .env.example .env
   ```
   Editar el archivo `.env` con la configuración de tu entorno.

   Credenciales Mercado Pago (Sandbox):
   - Inicia sesión con tu `Seller Test User` en el Panel de Desarrolladores y copia el `Access Token` de TEST (formato `TEST-...`).
   - En `.env` define:
     - `MERCADO_PAGO_ACCESS_TOKEN=TEST-...`
     - `PUBLIC_BASE_URL=http://localhost:3001` (o tu dominio público en producción)
   - Reinicia el servidor después de cambiar `.env`.

4. Inicializar la base de datos y cargar datos de prueba:
   ```
   npm run setup
   ```
   
   También puedes ejecutar los scripts por separado:
   ```
   npm run db:init   # Solo inicializa la base de datos
   npm run db:seed   # Solo carga los datos de prueba
   ```

5. Iniciar la aplicación:
   ```
   npm run dev
   ```

6. Ejecutar pruebas:
   ```
   npm test              # Ejecutar pruebas unitarias
   npm run test:integration  # Ejecutar pruebas de integración
   ```

## Estructura del Proyecto

```
├── src/
│   ├── config/         # Configuración de la aplicación
│   ├── controllers/    # Controladores de la API
│   ├── middlewares/    # Middlewares de Express
│   ├── models/         # Modelos de Sequelize
│   ├── routes/         # Rutas de la API
│   ├── utils/          # Utilidades y helpers
│   ├── validations/    # Esquemas de validación
│   ├── app.js          # Configuración de Express
│   └── server.js       # Punto de entrada de la aplicación
├── public/             # Archivos estáticos
├── uploads/            # Archivos subidos
├── logs/               # Logs de la aplicación
├── scripts/            # Scripts de inicialización
└── tests/              # Pruebas
```

## API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/profile` - Obtener perfil de usuario
- `PUT /api/auth/change-password` - Cambiar contraseña

### Usuarios
- `GET /api/usuarios` - Listar usuarios
- `GET /api/usuarios/:id` - Obtener usuario por ID
- `POST /api/usuarios` - Crear usuario
- `PUT /api/usuarios/:id` - Actualizar usuario
- `DELETE /api/usuarios/:id` - Eliminar usuario

### Departamentos
- `GET /api/departamentos` - Listar departamentos
- `GET /api/departamentos/:id` - Obtener departamento por ID
- `POST /api/departamentos` - Crear departamento
- `PUT /api/departamentos/:id` - Actualizar departamento
- `DELETE /api/departamentos/:id` - Eliminar departamento

### Trámites
- `GET /api/tramites` - Listar trámites
- `GET /api/tramites/:id` - Obtener trámite por ID
- `POST /api/tramites` - Crear trámite
- `PUT /api/tramites/:id` - Actualizar trámite
- `DELETE /api/tramites/:id` - Eliminar trámite

### Presupuestos
- `GET /api/presupuestos` - Listar presupuestos
- `GET /api/presupuestos/:id` - Obtener presupuesto por ID
- `POST /api/presupuestos` - Crear presupuesto
- `PUT /api/presupuestos/:id` - Actualizar presupuesto
- `DELETE /api/presupuestos/:id` - Eliminar presupuesto

### Proveedores
- `GET /api/proveedores` - Listar proveedores
- `GET /api/proveedores/:id` - Obtener proveedor por ID
- `POST /api/proveedores` - Crear proveedor
- `PUT /api/proveedores/:id` - Actualizar proveedor
- `DELETE /api/proveedores/:id` - Eliminar proveedor

### Contratos
- `GET /api/contratos` - Listar contratos
- `GET /api/contratos/:id` - Obtener contrato por ID
- `POST /api/contratos` - Crear contrato
- `PUT /api/contratos/:id` - Actualizar contrato
- `DELETE /api/contratos/:id` - Eliminar contrato

### Proyectos
- `GET /api/proyectos` - Listar proyectos
- `GET /api/proyectos/:id` - Obtener proyecto por ID
- `POST /api/proyectos` - Crear proyecto
- `PUT /api/proyectos/:id` - Actualizar proyecto
- `DELETE /api/proyectos/:id` - Eliminar proyecto

## Licencia

Este proyecto está licenciado bajo la Licencia ISC.

Sistema de Gestión Municipal que integra múltiples módulos para la administración eficiente de recursos, trámites y servicios municipales.

## Características

- **Autenticación y Seguridad**: Sistema de registro, login y gestión de roles (Admin, Funcionario, Ciudadano)
- **Trámites**: Gestión completa de trámites municipales
- **Pagos**: Registro y seguimiento de pagos con generación de comprobantes
- **Presupuestos y Finanzas**: Administración de presupuestos municipales
- **Proveedores y Contratos**: Gestión de proveedores y contratos
- **Proyectos Municipales**: Seguimiento de proyectos y asignación de recursos
- **Portal Ciudadano**: Interfaz para ciudadanos para realizar trámites y consultas

## Tecnologías

- **Backend**: Node.js, Express.js, Sequelize ORM
- **Frontend**: HTML5, Bootstrap, CSS3/SCSS
- **Base de datos**: MySQL
- **Autenticación**: JWT (JSON Web Tokens)

## Requisitos

- Node.js (v14 o superior)
- MySQL (v5.7 o superior)
- npm o yarn

## Instalación

1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd erp-municipal
```

2. Instalar dependencias

```bash
npm install
```

3. Configurar variables de entorno

Copiar el archivo `.env.example` a `.env` y configurar las variables según el entorno:

```bash
cp .env.example .env
# Editar el archivo .env con los valores correspondientes
```

4. Inicializar la base de datos

```bash
npm run db:create
npm run db:migrate
npm run db:seed
```

5. Iniciar el servidor

```bash
npm run dev
```

El servidor estará disponible en http://localhost:3000

## Estructura del Proyecto

```
├── src/
│   ├── config/         # Configuración de la aplicación
│   ├── controllers/    # Controladores de la API
│   ├── middlewares/    # Middlewares personalizados
│   ├── models/         # Modelos de Sequelize
│   ├── routes/         # Rutas de la API
│   ├── services/       # Servicios de negocio
│   ├── utils/          # Utilidades y helpers
│   ├── validations/    # Validaciones de datos
│   └── app.js          # Punto de entrada de la aplicación
├── public/             # Archivos estáticos y frontend
├── scripts/            # Scripts de utilidad
└── tests/              # Pruebas automatizadas
```

## Módulos

### Autenticación y Seguridad
- Registro de usuarios
- Login seguro
- Gestión de roles y permisos
- Recuperación de contraseña

### Trámites
- Creación y seguimiento de trámites
- Asignación a funcionarios
- Historial de cambios
- Descarga de certificados

### Pagos
- Registro de pagos
- Generación de comprobantes en PDF
- Historial de pagos por ciudadano

### Presupuestos y Finanzas
- Gestión de presupuestos
- Registro de gastos
- Reportes comparativos
- Exportación de informes

### Proveedores y Contratos
- Registro de proveedores
- Gestión de contratos
- Vinculación a proyectos

### Proyectos Municipales
- Registro de proyectos
- Asignación de presupuesto
- Seguimiento financiero
- Reportes de avance

### Portal Ciudadano
- Consulta de trámites
- Descarga de certificados
- Interacción con la municipalidad

## Licencia

ISC