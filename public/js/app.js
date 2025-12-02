// ... existing code ...
function cargarContenidoPagina(pagina) {
    const mainContent = document.getElementById('main-content');
    mostrarCargando(true);
    
    switch (pagina) {
        case 'panel-superadmin': {
            const mainContent = document.getElementById('main-content');
            const u = (typeof obtenerUsuario === 'function') ? obtenerUsuario() : null;
            if (typeof cargarInterfazSuperadmin === 'function') {
                cargarInterfazSuperadmin(u || {});
            } else {
                if (mainContent) {
                    mainContent.classList.remove('d-none');
                    mainContent.innerHTML = '<div class="alert alert-info">Panel de Superadministrador</div>';
                }
            }
            break;
        }
        case 'dashboard': {
            // Permitir dashboard para 'admin' y 'funcionario' con sesión válida
            let rol, token;
            try {
                const usuario = JSON.parse(localStorage.getItem('usuario'));
                rol = usuario && (usuario.rol || usuario.role);
                token = localStorage.getItem('token');
            } catch (e) { rol = undefined; token = undefined; }

            // Validar sesión
            if (!token) {
                // Evitar flicker del login: no renderizar login aquí, dejar que auth.js lo gestione
                break;
            }

            // Restringir solo a roles no autorizados
            if (rol !== 'admin' && rol !== 'funcionario') {
                mostrarNotificacion('Acceso denegado: tu rol no puede ver el panel de control', 'warning');
                if (typeof cargarPortalCiudadano === 'function') {
                    try { const u = JSON.parse(localStorage.getItem('usuario')); cargarPortalCiudadano(u); } catch { cargarPortalCiudadano(); }
                } else {
                    mainContent.innerHTML = '<div class="alert alert-info">Seleccione una opción válida del menú.</div>';
                }
                break;
            }

            // Cargar dashboard completo (admin)
            if (typeof cargarDashboard === 'function') {
                cargarDashboard();
            } else {
                // Crear un dashboard básico si la función no está disponible
                mainContent.innerHTML = `
                    <div class="dashboard-container">
                        <div class="row">
                            <div class="col-md-12">
                                <h2>Panel de Control</h2>
                            </div>
                        </div>
                        <div class="row mt-4">
                            <div class="col-md-3">
                                <div class="card dashboard-card">
                                    <div class="card-body">
                                        <h5 class="card-title">Usuarios</h5>
                                        <p class="card-text">Total: 24</p>
                                        <div class="progress">
                                            <div class="progress-bar" role="progressbar" style="width: 75%"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="card dashboard-card">
                                    <div class="card-body">
                                        <h5 class="card-title">Trámites</h5>
                                        <p class="card-text">Total: 156</p>
                                        <div class="progress">
                                            <div class="progress-bar" role="progressbar" style="width: 65%"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="card dashboard-card">
                                    <div class="card-body">
                                        <h5 class="card-title">Pagos</h5>
                                        <p class="card-text">Total: 42</p>
                                        <div class="progress">
                                            <div class="progress-bar" role="progressbar" style="width: 55%"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }
            break;
        }
        case 'usuarios':
            // Cargar tabla de usuarios
            if (typeof cargarUsuarios === 'function') {
                cargarUsuarios();
            } else {
                mostrarNotificacion('Error al cargar el módulo de usuarios', 'danger');
            }
            break;
        case 'departamentos':
            // Cargar tabla de departamentos
            if (typeof cargarDepartamentos === 'function') {
                cargarDepartamentos();
            } else {
                mostrarNotificacion('Error al cargar el módulo de departamentos', 'danger');
            }
            break;
        case 'tramites':
            // Cargar tabla de trámites
            if (typeof cargarTramites === 'function') {
                cargarTramites();
            } else {
                mostrarNotificacion('Error al cargar el módulo de trámites', 'danger');
            }
            break;
        case 'pagos':
            if (typeof cargarPagos === 'function') {
                cargarPagos();
            } else {
                mostrarNotificacion('Error al cargar el módulo de pagos', 'danger');
            }
            break;
        case 'presupuestos':
            if (typeof cargarPresupuestos === 'function') {
                cargarPresupuestos();
            } else {
                mostrarNotificacion('Error al cargar el módulo de presupuestos', 'danger');
            }
            break;
        case 'proveedores':
            if (typeof cargarProveedores === 'function') {
                cargarProveedores();
            } else {
                mostrarNotificacion('Error al cargar el módulo de proveedores', 'danger');
            }
            break;
        case 'proyectos':
            if (typeof cargarProyectos === 'function') {
                cargarProyectos();
            } else {
                mostrarNotificacion('Error al cargar el módulo de proyectos', 'danger');
            }
            break;
        case 'reportes':
            // Cargar interfaz de reportes con título centrado y botones estilizados
            mainContent.classList.remove('d-none');
            mainContent.classList.add('full-width');
            mainContent.innerHTML = `
                <div class="row mb-3">
                    <div class="col-12 text-center">
                        <h2 class="section-title">Reportes y Estadísticas</h2>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-4">
                        <div class="card no-hover">
                            <div class="card-header">
                                <h5>Reportes Disponibles</h5>
                            </div>
                            <div class="card-body">
                                <ul class="list-group">
                                    <li class="list-group-item d-flex justify-content-between align-items-center">
                                        Trámites por Departamento
                                        <button class="btn btn-sm btn-outline-primary"><i class="bi bi-file-earmark-text"></i> Generar</button>
                                    </li>
                                    <li class="list-group-item d-flex justify-content-between align-items-center">
                                        Ejecución Presupuestaria
                                        <button class="btn btn-sm btn-outline-primary"><i class="bi bi-graph-up"></i> Generar</button>
                                    </li>
                                    <li class="list-group-item d-flex justify-content-between align-items-center">
                                        Pagos Mensuales
                                        <button class="btn btn-sm btn-outline-primary"><i class="bi bi-cash-coin"></i> Generar</button>
                                    </li>
                                    <li class="list-group-item d-flex justify-content-between align-items-center">
                                        Proyectos por Estado
                                        <button class="btn btn-sm btn-outline-primary"><i class="bi bi-bar-chart"></i> Generar</button>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-8">
                        <div class="card no-hover">
                            <div class="card-header">
                                <h5>Vista Previa</h5>
                            </div>
                            <div class="card-body">
                                <p class="text-center">Seleccione un reporte para visualizar</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            break;
        case 'portal-inicio':
            // Cargar portal ciudadano
            if (typeof cargarPortalCiudadano === 'function') {
                cargarPortalCiudadano();
            } else {
                mainContent.innerHTML = `
                    <div class="portal-container">
                        <div class="row">
                            <div class="col-md-12">
                                <h2>Portal Ciudadano</h2>
                                <p>Bienvenido al portal de servicios municipales</p>
                            </div>
                        </div>
                        <div class="row mt-4">
                            <div class="col-md-4">
                                <div class="card">
                                    <div class="card-body">
                                        <h5 class="card-title">Mis Trámites</h5>
                                        <p class="card-text">Consulta y gestiona tus trámites municipales</p>
                                        <button class="btn btn-primary">Acceder</button>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="card">
                                    <div class="card-body">
                                        <h5 class="card-title">Pagos Municipales</h5>
                                        <p class="card-text">Realiza pagos de servicios e impuestos</p>
                                        <button class="btn btn-primary">Acceder</button>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="card">
                                    <div class="card-body">
                                        <h5 class="card-title">Nuevo Trámite</h5>
                                        <p class="card-text">Inicia un nuevo trámite municipal</p>
                                        <button class="btn btn-primary">Iniciar</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }
            break;
        case 'portal-tramites':
            // Cargar trámites del ciudadano
            if (typeof cargarTramitesCiudadano === 'function') {
                cargarTramitesCiudadano();
            } else {
                mainContent.innerHTML = `
                    <div class="row mb-4">
                        <div class="col-12">
                            <h2>Mis Trámites</h2>
                        </div>
                    </div>
                    <div class="card">
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-striped">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Tipo</th>
                                            <th>Fecha</th>
                                            <th>Estado</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>1001</td>
                                            <td>Licencia de Construcción</td>
                                            <td>15/05/2023</td>
                                            <td><span class="badge bg-warning">En proceso</span></td>
                                            <td>
                                                <button class="btn btn-sm btn-info">Ver</button>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>1002</td>
                                            <td>Certificado de Residencia</td>
                                            <td>10/06/2023</td>
                                            <td><span class="badge bg-success">Completado</span></td>
                                            <td>
                                                <button class="btn btn-sm btn-info">Ver</button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                `;
            }
            break;
        case 'portal-pagos':
            // Cargar pagos del ciudadano
            if (typeof cargarPagosCiudadano === 'function') {
                cargarPagosCiudadano();
            } else {
                mainContent.innerHTML = `
                    <div class="row mb-4">
                        <div class="col-12">
                            <h2>Mis Pagos</h2>
                        </div>
                    </div>
                    <div class="card">
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-striped">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Concepto</th>
                                            <th>Monto</th>
                                            <th>Fecha</th>
                                            <th>Estado</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>2001</td>
                                            <td>Impuesto Predial</td>
                                            <td>$250.00</td>
                                            <td>05/01/2023</td>
                                            <td><span class="badge bg-success">Completado</span></td>
                                            <td>
                                                <button class="btn btn-sm btn-info">Recibo</button>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>2002</td>
                                            <td>Servicio de Agua</td>
                                            <td>$75.50</td>
                                            <td>10/02/2023</td>
                                            <td><span class="badge bg-danger">Pendiente</span></td>
                                            <td>
                                                <button class="btn btn-sm btn-primary">Pagar</button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                `;
            }
            break;
        case 'portal-nuevo-tramite':
            // Cargar formulario de nuevo trámite
            if (typeof mostrarFormularioNuevoTramite === 'function') {
                mostrarFormularioNuevoTramite();
            } else {
                mainContent.innerHTML = `
                    <div class="row mb-4">
                        <div class="col-12">
                            <h2>Nuevo Trámite</h2>
                        </div>
                    </div>
                    <div class="card">
                        <div class="card-body">
                            <form id="form-nuevo-tramite">
                                <div class="mb-3">
                                    <label for="tipo-tramite" class="form-label">Tipo de Trámite</label>
                                    <select class="form-select" id="tipo-tramite" required>
                                        <option value="">Seleccione un tipo de trámite</option>
                                        <option value="licencia_construccion">Licencia de Construcción</option>
                                        <option value="certificado_residencia">Certificado de Residencia</option>
                                        <option value="permiso_comercial">Permiso Comercial</option>
                                        <option value="reclamo">Reclamo o Sugerencia</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label for="descripcion-tramite" class="form-label">Descripción</label>
                                    <textarea class="form-control" id="descripcion-tramite" rows="3" required></textarea>
                                </div>
                                <div class="mb-3">
                                    <label for="documentos-tramite" class="form-label">Documentos de Respaldo</label>
                                    <input type="file" class="form-control" id="documentos-tramite" multiple>
                                </div>
                                <div class="d-grid gap-2 d-md-flex justify-content-md-end">
                                    <button type="button" class="btn btn-secondary me-md-2">Cancelar</button>
                                    <button type="submit" class="btn btn-primary">Enviar Trámite</button>
                                </div>
                            </form>
                        </div>
                    </div>
                `;
            }
            break;
        default:
            mainContent.innerHTML = '<div class="alert alert-warning">Página no encontrada</div>';
    }
    
    mostrarCargando(false);
}

document.addEventListener('DOMContentLoaded', () => {
    (async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const perfil = await fetchAPI('/usuarios/perfil', { suppressErrorLog: true });
            const rol = perfil && (perfil.rol || perfil.role);
            if (perfil && (rol === 'admin' || rol === 'funcionario')) {
                localStorage.setItem('usuario', JSON.stringify({ id: perfil.id, nombre: perfil.nombre || '', apellido: perfil.apellido || '', email: perfil.email, role: rol }));
                const lastPage = localStorage.getItem('currentPage') || 'dashboard';
                if (typeof cargarContenidoPagina === 'function') {
                    cargarContenidoPagina(lastPage);
                    try {
                        const menu = document.getElementById('menu-items');
                        if (menu) {
                            const links = menu.querySelectorAll('.nav-link');
                            links.forEach(l => l.classList.remove('active'));
                            const active = menu.querySelector(`.nav-link[data-page="${lastPage}"]`);
                            if (active) active.classList.add('active');
                        }
                    } catch (_) {}
  }
}

async function cargarReportes() {
  try {
    mostrarCargando(true);
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;
    mainContent.classList.remove('d-none');
    mainContent.innerHTML = `
      <div class="container py-4">
        <div class="row mb-3">
          <div class="col-12 text-center">
            <h2 class="section-title">Reportes</h2>
          </div>
        </div>
        <div class="row g-3">
          <div class="col-md-6">
            <div class="card">
              <div class="card-body">
                <h5 class="card-title">Resumen de Trámites</h5>
                <p class="card-text">Conteos y estados generales.</p>
                <button class="btn btn-primary" id="btn-reporte-tramites">Ver</button>
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="card">
              <div class="card-body">
                <h5 class="card-title">Resumen de Pagos</h5>
                <p class="card-text">Montos y transacciones.</p>
                <button class="btn btn-primary" id="btn-reporte-pagos">Ver</button>
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="card">
              <div class="card-body">
                <h5 class="card-title">Departamentos</h5>
                <p class="card-text">Actividad por departamento.</p>
                <button class="btn btn-primary" id="btn-reporte-departamentos">Ver</button>
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="card">
              <div class="card-body">
                <h5 class="card-title">Exportar</h5>
                <p class="card-text">Descargar informes generales.</p>
                <button class="btn btn-outline-secondary" id="btn-reporte-exportar">Descargar</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  } catch (error) {
  } finally {
    mostrarCargando(false);
  }
}

window.cargarReportes = cargarReportes;
        } catch (_) {
            // Mantener sesión en caso de error transitorio
        }
    })();
    
    // Agregar eventos a los enlaces del menú
    document.addEventListener('click', (e) => {
        const enlace = e.target.closest('.nav-link');
        if (enlace) {
            e.preventDefault();
            const pagina = enlace.getAttribute('data-page');
            document.querySelectorAll('#menu-items .nav-link').forEach(el => el.classList.remove('active'));
            enlace.classList.add('active');
            try { localStorage.setItem('currentPage', pagina); } catch (_) {}
            if (typeof cargarContenidoPagina === 'function') {
                cargarContenidoPagina(pagina);
            }
        }
    });
});
