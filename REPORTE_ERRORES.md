# Reporte de Revisión de Código y Errores (Proyecto COREX)

Al examinar el proyecto en su totalidad, se han detectado varios errores, problemas de configuración y posibles focos de deuda técnica. A continuación, te presento el listado detallado separado por categorías:

## 1. Errores Críticos y de Pruebas (Testing)

> [!WARNING]
> Las pruebas unitarias están rotas y fallan en su totalidad debido a errores de configuración en los dependencias y *mocks*.

- **Configuración de Jest Defectuosa**: En las pruebas de controladores (ej. `tests/controllers/auth.controller.test.js`), la forma en la que se hacen los mocks del modelo genera el error `TypeError: Usuario.findOne.mockResolvedValue is not a function`. Esto hace que absolutamente todas las pruebas automatizadas fallen porque intentan usar funciones del sistema que no se inicializaron como *mocks* válidos.
- **Dependencias Faltantes para Pruebas**: 
  - `jest` no se encuentra instalado en la lista de `devDependencies` de `package.json`, a pesar de que el archivo `scripts/run_tests.js` depende de `npx jest`.
  - El script `test_usuarios.js` (E2E Test) requiere de la dependencia `puppeteer`, la cual no existe en el proyecto. Al intentar correr el archivo fallará inmediatamente con `Cannot find module 'puppeteer'`.

## 2. Errores Lógicos y Malas Prácticas en Controladores

> [!CAUTION]
> El código oculta activamente los errores en la ejecución silenciándolos, lo cual hará muy difícil hacer debug en producción si la aplicación falla.

- **Excepciones Silenciadas (Swallowed Exceptions)**: A lo largo de varios controladores (notoriamente `usuarios.controller.js` en las líneas 249, 443, 662-690, y `tramites.controller.js`), hay múltiples bloques de código envolviendo lógica en `try {} catch (_) {}` vacío (sin `console.log` ni `next(err)` o devolviendo alertas al cliente). Si la base de datos o el código falla ahí, la petición quedará colgando o generará un comportamiento indeseado sin que quede rastro en los logs.
- **Falta de Validación de Funcionario (TODO)**: En `src/controllers/tramites.controller.js` (Línea 1003) se dejó en el código el comentario `// TODO: Validar permisos de funcionario si aplica`. Esto es una vulnerabilidad potencial, ya que indica que se omitió una regla de seguridad en las validaciones de acceso de los trámites.

## 3. Seguridad y Archivos Sensibles

> [!WARNING]
> La presencia de contraseñas u otra información directa en los archivos de entorno locales que no fueron excluidos puede ser un peligro.

- **Variables de Entorno Hardcodeadas**: El archivo `.env` expone detalles sensibles de conexión como `DB_PASS=Klp61727` y `JWT_SECRET`. Si este archivo formó parte de commits en git, esas contraseñas se encuentran comprometidas y deben rotarse en entornos reales de producción.
- **Exposición de Variables JWT Críticas**: En configuraciones estándar el `JWT_SECRET` debe estar ofuscado por completo, su descubrimiento permite a un atacante generar tokens como administrador y evadir todas las protecciones.

## 4. Deuda Técnica y Arquitectura

> [!NOTE]
> Estas no causan que la aplicación deje de funcionar pero dificultan el desarrollo a futuro.

- **Múltiples Librerías de Validación**: En el `package.json` aparecen simultáneamente `express-validator` y `joi`. Utilizar dos herramientas diferentes que hacen el mismo trabajo (validación de esquemas) agrega complejidad innecesaria, incrementa el peso del paquete y genera código dispar dependiendo de quién programe cada módulo.
- **Falta de Linters y Formateadores**: Al no tener instalado `eslint` o `prettier` no existe una estandarización de estilo, permitiendo vulnerabilidades o malas prácticas, e.g. variables sin uso, importaciones innecesarias, etc.

## 5. Recomendaciones Iniciales

1. **Reparar el entorno de testing**: Instalar con `npm install -D jest puppeteer` y corregir la definición de mocks globales (`jest.mock(...)`) antes de avanzar.
2. **Limpiar `try / catch`**: Buscar todos los `catch (_) {}` (por ejemplo con la búsqueda en tu IDE) y en su lugar colocar herramientas de registro (`logger.error()`) o redireccionar al manejador central de Express (`next(error)`).
3. **Consolidar Validaciones**: Escoger entre `Joi` y `express-validator` y refactorizar todo el código a una sola directriz.
