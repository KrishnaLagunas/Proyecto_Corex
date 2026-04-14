// ... existing code ...
/**
 * Función central para cargar la vista inicial al recargar la página (F5)
 */
function cargarVistaInicial() {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        mainContent.classList.remove('d-none');
    }
    
    const currentPage = localStorage.getItem('currentPage') || 'dashboard';
    console.log('[INIT] Vista detectada:', currentPage);

    // Mapeo de páginas a funciones de carga
    const paginasMap = {
        'dashboard': () => typeof cargarDashboard === 'function' ? cargarDashboard() : null,
        'panel': () => typeof cargarDashboard === 'function' ? cargarDashboard() : null,
        'usuarios': () => typeof cargarUsuarios === 'function' ? cargarUsuarios() : null,
        'departamentos': () => typeof cargarDepartamentos === 'function' ? cargarDepartamentos() : null,
        'tramites': () => typeof cargarTramites === 'function' ? cargarTramites() : null,
        'pagos': () => typeof cargarPagos === 'function' ? cargarPagos() : null,
        'reportes': () => typeof cargarReportes === 'function' ? cargarReportes() : null,
        'portalCiudadano': () => typeof cargarPortalCiudadano === 'function' ? cargarPortalCiudadano() : null,
        'misTramites': () => typeof cargarMisTramites === 'function' ? cargarMisTramites() : null,
        'misPagos': () => typeof cargarMisPagos === 'function' ? cargarMisPagos() : null
    };

    if (paginasMap[currentPage]) {
        console.log('[INIT] Ejecutando render para:', currentPage);
        paginasMap[currentPage]();
    } else {
        console.warn('[INIT] Vista no reconocida, cargando dashboard por defecto');
        if (typeof cargarDashboard === 'function') cargarDashboard();
    }
}

// Hacerla disponible globalmente
window.cargarVistaInicial = cargarVistaInicial;

function cargarContenidoPagina(pagina) {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        mainContent.classList.remove('d-none');
    }
    mostrarCargando(true);
    
    // --- Verificación de Permisos (Seguridad) ---
    const uAuth = (typeof obtenerUsuario === 'function') ? obtenerUsuario() : JSON.parse(localStorage.getItem('usuario') || '{}');
    const rAuth = String(uAuth && (uAuth.rol || uAuth.role || uAuth.rol_nombre) || '').toLowerCase();
    
    const isSuper = rAuth.includes('super');
    const isAdmin = rAuth.includes('admin') && !isSuper;
    const isFuncionario = rAuth.includes('func') || rAuth.includes('secretaria') || rAuth.includes('direcc') || rAuth.includes('jefe') || rAuth.includes('encargado') || rAuth.includes('tesorer');
    
    // Módulos restringidos a Administradores
    const adminPages = ['usuarios', 'departamentos', 'presupuestos', 'proveedores', 'proyectos', 'reportes'];
    
    if (adminPages.includes(pagina)) {
        if (!isSuper && !isAdmin) {
            console.warn(`Acceso denegado a módulo administrativo '${pagina}' para rol '${rAuth}'. Redirigiendo...`);
            mostrarNotificacion('No tienes permisos para acceder a esta sección.', 'danger');
            
            // Redirigir según rol
            if (isFuncionario) {
                pagina = 'dashboard';
                try { localStorage.setItem('currentPage', 'dashboard'); } catch (_) {}
            } else {
                pagina = 'portal-inicio';
                try { localStorage.setItem('currentPage', 'portal-inicio'); } catch (_) {}
            }
        }
    }
    // ---------------------------------------------
    
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
                const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
                const rRaw = usuario && (usuario.rol || usuario.role || usuario.rol_nombre);
                rol = (rRaw || '').toString().toLowerCase();
                if (rol.includes('admin') && !rol.includes('super')) rol = 'admin';
                else if (rol.includes('func') || rol.includes('secretaria') || rol.includes('direcc') || rol.includes('jefe') || rol.includes('encargado') || rol.includes('tesorer')) rol = 'funcionario';
                
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
            if (typeof cargarReportes === 'function') {
                cargarReportes();
            } else {
                mainContent.innerHTML = '<div class="alert alert-info">Cargando reportes...</div>';
            }
            break;
            try {
                const preview = document.getElementById('report-preview');
                const getReportParams = () => {
                    const fechaInicio = document.getElementById('filtro-reporte-inicio').value;
                    const fechaFin = document.getElementById('filtro-reporte-fin').value;
                    
                    let params = '';
                    if (fechaInicio && fechaFin) {
                        params = `?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`;
                    }
                    return params;
                };

                const btnLimpiar = document.getElementById('btn-limpiar-filtros');
                if (btnLimpiar) {
                    btnLimpiar.onclick = () => {
                        document.getElementById('filtro-reporte-inicio').value = '';
                        document.getElementById('filtro-reporte-fin').value = '';
                    };
                }

                const renderCanvas = (title) => {
                    if (!preview) return null;
                    preview.innerHTML = `<div class="d-flex justify-content-between align-items-center mb-3"><h6 class="mb-0 fw-bold">${title}</h6><div class="d-flex align-items-center gap-2"><button id="btn-export-report-csv" class="btn btn-sm btn-outline-secondary border-0 shadow-sm">CSV</button><button id="btn-export-report-pdf" class="btn btn-sm btn-outline-primary border-0 shadow-sm">PDF</button><div class="small text-muted border-start ps-2">${new Date().toLocaleDateString('es-CL')}</div></div></div><div style="position:relative;height:360px"><canvas id="report-canvas"></canvas></div><div id="report-legend" class="mt-4"></div>`;
                    return document.getElementById('report-canvas');
                };
                const renderLegendFrom = (arr, labelKey, valueKey, suffix = '') => {
                    const legend = document.getElementById('report-legend');
                    if (!legend) return;
                    const html = arr.map(o => {
                        const label = String(o[labelKey] ?? '');
                        const value = Number(o[valueKey] ?? 0);
                        return `<div class="d-flex justify-content-between align-items-center py-1 border-bottom"><div class="text-truncate me-2">${label}</div><div class="fw-semibold">${value}${suffix}</div></div>`;
                    }).join('');
                    legend.innerHTML = html;
                };
                const genTramitesDepto = async () => {
                    try {
                        mostrarCargando(true);
                        const canvas = renderCanvas('Trámites por Departamento');
                        if (!canvas) return;
                        const resp = await fetchAPI('/tramites/stats/general' + getReportParams(), { method: 'GET' });
                        const arr = (resp && (resp.tramitesPorDepartamento || resp.data?.tramitesPorDepartamento)) || [];
                        const labels = arr.map(x => String(x.departamento_nombre || x.dataValues?.departamento_nombre || ''));
                        const data = arr.map(x => parseInt(x.dataValues?.total || x.total || 0));
                        if (labels.length === 0) {
                            preview.innerHTML = `<div class="alert alert-info">No hay datos disponibles para este reporte con los filtros seleccionados.</div>`;
                            return;
                        }
                        window.currentReportData = arr.map(x => ({ departamento: String(x.departamento_nombre || x.dataValues?.departamento_nombre || ''), total: parseInt(x.dataValues?.total || x.total || 0) }));
                        const btnCSV = document.getElementById('btn-export-report-csv');
                        const btnPDF = document.getElementById('btn-export-report-pdf');
                        if (btnCSV) btnCSV.onclick = () => { try { exportarCSV(window.currentReportData, 'tramites_por_departamento.csv'); } catch (_) {} };
                        if (btnPDF) btnPDF.onclick = () => { try { exportarReportePDF('Trámites por Departamento', ['departamento','total'], window.currentReportData, 'report-canvas'); } catch (_) {} };
                        crearGraficoBarras('report-canvas', labels, data, 'Trámites por Departamento');
                        renderLegendFrom(window.currentReportData, 'departamento', 'total', ' trámites');
                    } catch (e) {
                        preview.innerHTML = `<div class="alert alert-danger">Error al generar el reporte: ${e.message || e}</div>`;
                    } finally { mostrarCargando(false); }
                };
                const genTramitesEstado = async () => {
                    try {
                        mostrarCargando(true);
                        const canvas = renderCanvas('Trámites por Estado');
                        if (!canvas) return;
                        const params = getReportParams();
                        let resp = await fetchAPI('/dashboard/tramites/estado' + params, { method: 'GET', headers: { 'Cache-Control': 'no-cache' } });
                        let estados = (resp && (resp.tramitesPorEstado || resp.data?.tramitesPorEstado)) || [];
                        let labels = Array.isArray(estados) ? estados.map(e => String(e.estado || '')) : [];
                        let data = Array.isArray(estados) ? estados.map(e => parseInt(e.cantidad || e.dataValues?.cantidad || 0)) : [];
                        
                        if (!labels.length || (data.reduce((a,b)=>a+b,0) === 0)) {
                            try {
                                resp = await fetchAPI('/tramites/stats/general' + params, { method: 'GET', headers: { 'Cache-Control': 'no-cache' } });
                                estados = (resp && (resp.estadoPorTramite || resp.data?.estadoPorTramite)) || [];
                                labels = Array.isArray(estados) ? estados.map(e => String(e.estado || e.dataValues?.estado || '')) : [];
                                data = Array.isArray(estados) ? estados.map(e => parseInt(e.dataValues?.total || e.total || 0)) : [];
                            } catch (_) {}
                        }
                        if (labels.length === 0) {
                            preview.innerHTML = `<div class="alert alert-info">No hay datos disponibles para este reporte con los filtros seleccionados.</div>`;
                            return;
                        }
                        window.currentReportData = estados.map(e => ({ estado: String(e.estado || ''), total: parseInt(e.cantidad || e.dataValues?.cantidad || 0 || e.total || e.dataValues?.total || 0) }));
                        const btnCSV = document.getElementById('btn-export-report-csv');
                        const btnPDF = document.getElementById('btn-export-report-pdf');
                        if (btnCSV) btnCSV.onclick = () => { try { exportarCSV(window.currentReportData, 'tramites_por_estado.csv'); } catch (_) {} };
                        if (btnPDF) btnPDF.onclick = () => { try { exportarReportePDF('Trámites por Estado', ['estado','total'], window.currentReportData, 'report-canvas'); } catch (_) {} };
                        crearGraficoBarras('report-canvas', labels, data, 'Trámites por Estado');
                        renderLegendFrom(window.currentReportData, 'estado', 'total', ' trámites');
                    } catch (e) {
                        preview.innerHTML = `<div class="alert alert-danger">Error al generar el reporte: ${e.message || e}</div>`;
                    } finally { mostrarCargando(false); }
                };
                const genPagos = async () => {
                    try {
                        mostrarCargando(true);
                        const canvas = renderCanvas('Pagos mensuales');
                        if (!canvas) return;
                        const resp = await fetchAPI('/pagos/stats/general' + getReportParams(), { method: 'GET' });
                        const pagos = (resp && (resp.pagosPorMes || resp.data?.pagosPorMes)) || [];
                        const labels = pagos.map(p => String(p.mes || p.dataValues?.mes || ''));
                        const data = pagos.map(p => parseInt(p.total || p.dataValues?.total || 0));
                        if (labels.length === 0) {
                            preview.innerHTML = `<div class="alert alert-info">No hay datos disponibles para este reporte con los filtros seleccionados.</div>`;
                            return;
                        }
                        window.currentReportData = pagos.map(p => ({ mes: String(p.mes || p.dataValues?.mes || ''), pagos: parseInt(p.total || p.dataValues?.total || 0), monto_total: parseFloat(p.monto_total || p.dataValues?.monto_total || 0) }));
                        const btnCSV = document.getElementById('btn-export-report-csv');
                        const btnPDF = document.getElementById('btn-export-report-pdf');
                        if (btnCSV) btnCSV.onclick = () => { try { exportarCSV(window.currentReportData, 'pagos_mensuales.csv'); } catch (_) {} };
                        if (btnPDF) btnPDF.onclick = () => { try { exportarReportePDF('Pagos Mensuales', ['mes','pagos','monto_total'], window.currentReportData, 'report-canvas'); } catch (_) {} };
                        crearGraficoBarras('report-canvas', labels, data, 'Pagos');
                        renderLegendFrom(window.currentReportData, 'mes', 'pagos', ' pagos');
                    } catch (e) {
                        preview.innerHTML = `<div class="alert alert-danger">Error al generar el reporte: ${e.message || e}</div>`;
                    } finally { mostrarCargando(false); }
                };
                const genPagosEstado = async () => {
                    try {
                        mostrarCargando(true);
                        const canvas = renderCanvas('Pagos por Estado');
                        if (!canvas) return;
                        const resp = await fetchAPI('/pagos/stats/general' + getReportParams(), { method: 'GET' });
                        const estados = (resp && (resp.estadoPorPago || resp.data?.estadoPorPago)) || [];
                        const labels = estados.map(e => String(e.estado || e.dataValues?.estado || ''));
                        const data = estados.map(e => parseInt(e.dataValues?.total || e.total || 0));
                        if (labels.length === 0) {
                            preview.innerHTML = `<div class="alert alert-info">No hay datos disponibles para este reporte con los filtros seleccionados.</div>`;
                            return;
                        }
                        window.currentReportData = estados.map(e => ({ estado: String(e.estado || e.dataValues?.estado || ''), total: parseInt(e.dataValues?.total || e.total || 0) }));
                        const btnCSV = document.getElementById('btn-export-report-csv');
                        const btnPDF = document.getElementById('btn-export-report-pdf');
                        if (btnCSV) btnCSV.onclick = () => { try { exportarCSV(window.currentReportData, 'pagos_por_estado.csv'); } catch (_) {} };
                        if (btnPDF) btnPDF.onclick = () => { try { exportarReportePDF('Pagos por Estado', ['estado','total'], window.currentReportData, 'report-canvas'); } catch (_) {} };
                        crearGraficoBarras('report-canvas', labels, data, 'Pagos por Estado');
                        renderLegendFrom(window.currentReportData, 'estado', 'total', ' pagos');
                    } catch (e) {
                        preview.innerHTML = `<div class="alert alert-danger">Error al generar el reporte: ${e.message || e}</div>`;
                    } finally { mostrarCargando(false); }
                };
                const b1 = document.getElementById('btn-reporte-tramites-depto');
                const b2 = document.getElementById('btn-reporte-tramites-estado');
                const b3 = document.getElementById('btn-reporte-pagos');
                const b4 = document.getElementById('btn-reporte-pagos-estado');
                if (b1) b1.addEventListener('click', genTramitesDepto);
                if (b2) b2.addEventListener('click', genTramitesEstado);
                if (b3) b3.addEventListener('click', genPagos);
                if (b4) b4.addEventListener('click', genPagosEstado);
            } catch (_) {}
            mostrarCargando(false);
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
        case 'portalCiudadano': {
            const u = (typeof obtenerUsuario === 'function') ? obtenerUsuario() : null;
            if (typeof cargarPortalCiudadano === 'function') {
                cargarPortalCiudadano(u || {});
            } else {
                mainContent.innerHTML = '<div class="alert alert-info">Portal Ciudadano</div>';
            }
            break;
        }
        case 'misTramites': {
            const u = (typeof obtenerUsuario === 'function') ? obtenerUsuario() : null;
            if (typeof cargarMisTramites === 'function') {
                cargarMisTramites(u || {});
            } else {
                mostrarNotificacion('Error al cargar Mis Trámites', 'danger');
            }
            break;
        }
        case 'formularioNuevoTramite': {
            const u = (typeof obtenerUsuario === 'function') ? obtenerUsuario() : null;
            if (typeof cargarFormularioNuevoTramite === 'function') {
                cargarFormularioNuevoTramite(u || {});
            } else {
                mostrarNotificacion('Error al cargar Iniciar Trámite', 'danger');
            }
            break;
        }
        case 'misPagos': {
            const u = (typeof obtenerUsuario === 'function') ? obtenerUsuario() : null;
            if (typeof cargarMisPagos === 'function') {
                cargarMisPagos(u || {});
            } else {
                mostrarNotificacion('Error al cargar Mis Pagos', 'danger');
            }
            break;
        }
        default:
            mainContent.innerHTML = '<div class="alert alert-warning">Página no encontrada</div>';
    }

    // Guardar la página actual para F5
    localStorage.setItem('currentPage', pagina);
    
    // Actualizar estado activo en el menú
    try {
        const links = document.querySelectorAll('#menu-items .nav-link, .nav-link');
        links.forEach(l => {
            l.classList.remove('active');
            if (l.getAttribute('data-page') === pagina) {
                l.classList.add('active');
            }
        });
    } catch (_) {}

    if (mainContent) {
        mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    // Cerrar menú móvil si está abierto tras navegar
    if (window.mobileNav && typeof window.mobileNav.close === 'function') {
        window.mobileNav.close();
    }
    
    mostrarCargando(false);
}

document.addEventListener('DOMContentLoaded', () => {
    // Intentar restaurar la sesión una vez que app.js y sus funciones están listas
    if (typeof window.intentarRestaurarSesion === 'function') {
        window.intentarRestaurarSesion();
    } else {
        // Fallback si auth.js aún no define la función
        setTimeout(() => {
            if (typeof window.intentarRestaurarSesion === 'function') {
                window.intentarRestaurarSesion();
            }
        }, 100);
    }
    
    // Agregar eventos a los enlaces del menú
    document.addEventListener('click', (e) => {
        const enlace = e.target.closest('.nav-link');
        if (enlace) {
            e.preventDefault();
            const pagina = enlace.getAttribute('data-page');
            document.querySelectorAll('#menu-items .nav-link').forEach(el => el.classList.remove('active'));
            enlace.classList.add('active');
            try { localStorage.setItem('currentPage', pagina); } catch (_) {}
            const esCiudadano = ['portalCiudadano','misTramites','formularioNuevoTramite','misPagos'].includes(pagina);
            if (esCiudadano) {
                const u = (typeof obtenerUsuario === 'function') ? obtenerUsuario() : null;
                const map = {
                    portalCiudadano: () => typeof cargarPortalCiudadano === 'function' && cargarPortalCiudadano(u || {}),
                    misTramites: () => typeof cargarMisTramites === 'function' && cargarMisTramites(u || {}),
                    formularioNuevoTramite: () => typeof cargarFormularioNuevoTramite === 'function' && cargarFormularioNuevoTramite(u || {}),
                    misPagos: () => typeof cargarMisPagos === 'function' && cargarMisPagos(u || {})
                };
                if (map[pagina]) map[pagina]();
                
                // Cerrar menú móvil para ciudadanos también
                if (window.mobileNav && typeof window.mobileNav.close === 'function') {
                    window.mobileNav.close();
                }
            } else if (typeof cargarContenidoPagina === 'function') {
                cargarContenidoPagina(pagina);
            }
        }
    });

    // Delegación para el ojito de contraseña en caso de re-render (Login)
    document.addEventListener('click', (e) => {
        const toggle = e.target && e.target.closest && e.target.closest('#toggle-password');
        if (toggle) {
            e.preventDefault();
            const input = document.getElementById('password');
            if (!input) return;
            const toShow = input.type === 'password';
            input.type = toShow ? 'text' : 'password';
            const icon = toggle.querySelector('i');
            if (icon) {
                icon.classList.toggle('bi-eye', !toShow);
                icon.classList.toggle('bi-eye-slash', toShow);
            }
        }
    });

    // Delegación para botones de ver/ocultar contraseña (Genérico con clase .toggle-password-btn)
    document.addEventListener('click', (e) => {
        const btn = e.target && e.target.closest && e.target.closest('.toggle-password-btn');
        if (btn) {
            e.preventDefault();
            const inputId = btn.getAttribute('data-input');
            if (inputId) {
                const input = document.getElementById(inputId);
                if (input) {
                    const toShow = input.type === 'password';
                    input.type = toShow ? 'text' : 'password';
                    const icon = btn.querySelector('i');
                    if (icon) {
                        icon.classList.toggle('bi-eye', !toShow);
                        icon.classList.toggle('bi-eye-slash', toShow);
                    }
                }
            }
        }
    });
});

async function cargarReportes() {
    try {
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;
        
        mostrarCargando(true);
        mainContent.classList.remove('d-none');
        mainContent.classList.add('full-width');
        
        mainContent.innerHTML = `
            <div class="row mb-4">
                <div class="col-12 text-center">
                    <h2 class="section-title" style="display: inline-block; border-bottom: 3px solid #0d6efd; padding-bottom: 5px;">Reportes y Estadísticas</h2>
                </div>
            </div>

            <!-- Barra de Filtros Horizontal -->
            <div class="card no-hover mb-4 shadow-sm border-0 bg-light">
                <div class="card-body py-3">
                    <div class="row align-items-end g-3">
                        <div class="col-md-5">
                            <label for="filtro-reporte-inicio" class="form-label small fw-bold mb-1">
                                <i class="bi bi-calendar-event"></i> Fecha Inicio
                            </label>
                            <input type="date" id="filtro-reporte-inicio" class="form-control border-0 shadow-sm" placeholder="dd-mm-aaaa">
                        </div>
                        <div class="col-md-5">
                            <label for="filtro-reporte-fin" class="form-label small fw-bold mb-1">
                                <i class="bi bi-calendar-check"></i> Fecha Fin
                            </label>
                            <input type="date" id="filtro-reporte-fin" class="form-control border-0 shadow-sm" placeholder="dd-mm-aaaa">
                        </div>
                        <div class="col-md-2">
                            <button id="btn-limpiar-filtros" class="btn btn-outline-secondary w-100 shadow-sm border-0 bg-white">
                                <i class="bi bi-eraser"></i> Limpiar
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row">
                <div class="col-md-4">
                    <div class="card no-hover shadow-sm border-0">
                        <div class="card-header bg-white border-bottom-0 pt-3">
                            <h5 class="mb-0"><i class="bi bi-list-ul"></i> Reportes Disponibles</h5>
                        </div>
                        <div class="card-body">
                            <ul class="list-group list-group-flush">
                                <li class="list-group-item d-flex justify-content-between align-items-center py-3 border-bottom">
                                    <span>Trámites por Departamento</span>
                                    <button id="btn-reporte-tramites-depto" class="btn btn-sm btn-success shadow-sm d-flex align-items-center gap-1">
                                        <i class="bi bi-file-earmark-spreadsheet"></i> Generar
                                    </button>
                                </li>
                                <li class="list-group-item d-flex justify-content-between align-items-center py-3 border-bottom">
                                    <span>Trámites por Estado</span>
                                    <button id="btn-reporte-tramites-estado" class="btn btn-sm btn-success shadow-sm d-flex align-items-center gap-1">
                                        <i class="bi bi-bar-chart-line"></i> Generar
                                    </button>
                                </li>
                                <li class="list-group-item d-flex justify-content-between align-items-center py-3 border-bottom">
                                    <span>Pagos Mensuales</span>
                                    <button id="btn-reporte-pagos" class="btn btn-sm btn-success shadow-sm d-flex align-items-center gap-1">
                                        <i class="bi bi-cash-stack"></i> Generar
                                    </button>
                                </li>
                                <li class="list-group-item d-flex justify-content-between align-items-center py-3">
                                    <span>Pagos por Estado</span>
                                    <button id="btn-reporte-pagos-estado" class="btn btn-sm btn-success shadow-sm d-flex align-items-center gap-1">
                                        <i class="bi bi-graph-up"></i> Generar
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="col-md-8">
                    <div class="card no-hover shadow-sm border-0">
                        <div class="card-header bg-white border-bottom-0 pt-3">
                            <h5 class="mb-0"><i class="bi bi-eye"></i> Vista Previa</h5>
                        </div>
                        <div class="card-body" id="report-preview">
                            <div class="text-center py-5">
                                <i class="bi bi-bar-chart-line display-1 text-light"></i>
                                <p class="mt-3 text-muted">Seleccione un reporte para visualizar los resultados</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const preview = document.getElementById('report-preview');
        const getReportParams = () => {
            const fechaInicio = document.getElementById('filtro-reporte-inicio').value;
            const fechaFin = document.getElementById('filtro-reporte-fin').value;
            
            let params = '';
            if (fechaInicio && fechaFin) {
                params = `?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`;
            }
            return params;
        };

        const btnLimpiar = document.getElementById('btn-limpiar-filtros');
        if (btnLimpiar) {
            btnLimpiar.onclick = () => {
                document.getElementById('filtro-reporte-inicio').value = '';
                document.getElementById('filtro-reporte-fin').value = '';
            };
        }

        const renderCanvas = (title) => {
            if (!preview) return null;
            const today = new Date().toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
            preview.innerHTML = `
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h6 class="mb-0 fw-bold">${title}</h6>
                    <div class="d-flex align-items-center gap-2">
                        <button id="btn-export-report-csv" class="btn btn-sm btn-outline-secondary border shadow-sm bg-white" style="font-size: 0.75rem; color: #6c757d;">CSV</button>
                        <button id="btn-export-report-pdf" class="btn btn-sm btn-outline-secondary border shadow-sm bg-white" style="font-size: 0.75rem; color: #6c757d;">PDF</button>
                        <div class="small text-muted border-start ps-2" style="font-size: 0.85rem;">${today}</div>
                    </div>
                </div>
                <div style="position:relative;height:360px">
                    <canvas id="report-canvas"></canvas>
                </div>
                <div id="report-legend" class="mt-4"></div>
            `;
            return document.getElementById('report-canvas');
        };

        const renderLegendFrom = (arr, labelKey, valueKey, suffix = '') => {
            const legend = document.getElementById('report-legend');
            if (!legend) return;
            const html = arr.map(o => {
                const label = String(o[labelKey] ?? '');
                const value = Number(o[valueKey] ?? 0);
                return `<div class="d-flex justify-content-between align-items-center py-1 border-bottom"><div class="text-truncate me-2">${label}</div><div class="fw-semibold">${value}${suffix}</div></div>`;
            }).join('');
            legend.innerHTML = html;
        };

        const genTramitesDepto = async () => {
            try {
                mostrarCargando(true);
                const canvas = renderCanvas('Trámites por Departamento');
                if (!canvas) return;
                const resp = await fetchAPI('/tramites/stats/general' + getReportParams(), { method: 'GET' });
                const arr = (resp && (resp.tramitesPorDepartamento || resp.data?.tramitesPorDepartamento)) || [];
                const labels = arr.map(x => String(x.departamento_nombre || x.dataValues?.departamento_nombre || ''));
                const data = arr.map(x => parseInt(x.dataValues?.total || x.total || 0));
                
                if (labels.length === 0) {
                    preview.innerHTML = `<div class="alert alert-info">No hay datos disponibles para este reporte con los filtros seleccionados.</div>`;
                    return;
                }
                
                window.currentReportData = arr.map(x => ({ 
                    departamento: String(x.departamento_nombre || x.dataValues?.departamento_nombre || ''), 
                    total: parseInt(x.dataValues?.total || x.total || 0) 
                }));
                
                const btnCSV = document.getElementById('btn-export-report-csv');
                const btnPDF = document.getElementById('btn-export-report-pdf');
                if (btnCSV) btnCSV.onclick = () => { try { exportarCSV(window.currentReportData, 'tramites_por_departamento.csv'); } catch (_) {} };
                if (btnPDF) btnPDF.onclick = () => { try { exportarReportePDF('Trámites por Departamento', ['departamento','total'], window.currentReportData, 'report-canvas'); } catch (_) {} };
                
                crearGraficoBarras('report-canvas', labels, data, 'Trámites por Departamento');
                renderLegendFrom(window.currentReportData, 'departamento', 'total', ' trámites');
            } catch (e) {
                preview.innerHTML = `<div class="alert alert-danger">Error al generar el reporte: ${e.message || e}</div>`;
            } finally { mostrarCargando(false); }
        };

        const genTramitesEstado = async () => {
            try {
                mostrarCargando(true);
                const canvas = renderCanvas('Trámites por Estado');
                if (!canvas) return;
                const params = getReportParams();
                let resp = await fetchAPI('/dashboard/tramites/estado' + params, { method: 'GET', headers: { 'Cache-Control': 'no-cache' } });
                let estados = (resp && (resp.tramitesPorEstado || resp.data?.tramitesPorEstado)) || [];
                let labels = Array.isArray(estados) ? estados.map(e => String(e.estado || '')) : [];
                let data = Array.isArray(estados) ? estados.map(e => parseInt(e.cantidad || e.dataValues?.cantidad || 0)) : [];
                
                if (!labels.length || (data.reduce((a,b)=>a+b,0) === 0)) {
                    try {
                        resp = await fetchAPI('/tramites/stats/general' + params, { method: 'GET', headers: { 'Cache-Control': 'no-cache' } });
                        estados = (resp && (resp.estadoPorTramite || resp.data?.estadoPorTramite)) || [];
                        labels = Array.isArray(estados) ? estados.map(e => String(e.estado || e.dataValues?.estado || '')) : [];
                        data = Array.isArray(estados) ? estados.map(e => parseInt(e.dataValues?.total || e.total || 0)) : [];
                    } catch (_) {}
                }
                
                if (labels.length === 0) {
                    preview.innerHTML = `<div class="alert alert-info">No hay datos disponibles para este reporte con los filtros seleccionados.</div>`;
                    return;
                }
                
                window.currentReportData = estados.map(e => ({ 
                    estado: String(e.estado || ''), 
                    total: parseInt(e.cantidad || e.dataValues?.cantidad || 0 || e.total || e.dataValues?.total || 0) 
                }));
                
                const btnCSV = document.getElementById('btn-export-report-csv');
                const btnPDF = document.getElementById('btn-export-report-pdf');
                if (btnCSV) btnCSV.onclick = () => { try { exportarCSV(window.currentReportData, 'tramites_por_estado.csv'); } catch (_) {} };
                if (btnPDF) btnPDF.onclick = () => { try { exportarReportePDF('Trámites por Estado', ['estado','total'], window.currentReportData, 'report-canvas'); } catch (_) {} };
                
                crearGraficoBarras('report-canvas', labels, data, 'Trámites por Estado');
                renderLegendFrom(window.currentReportData, 'estado', 'total', ' trámites');
            } catch (e) {
                preview.innerHTML = `<div class="alert alert-danger">Error al generar el reporte: ${e.message || e}</div>`;
            } finally { mostrarCargando(false); }
        };

        const genPagos = async () => {
            try {
                mostrarCargando(true);
                const canvas = renderCanvas('Pagos mensuales');
                if (!canvas) return;
                const resp = await fetchAPI('/pagos/stats/general' + getReportParams(), { method: 'GET' });
                const pagos = (resp && (resp.pagosPorMes || resp.data?.pagosPorMes)) || [];
                const labels = pagos.map(p => String(p.mes || p.dataValues?.mes || ''));
                const data = pagos.map(p => parseInt(p.total || p.dataValues?.total || 0));
                
                if (labels.length === 0) {
                    preview.innerHTML = `<div class="alert alert-info">No hay datos disponibles para este reporte con los filtros seleccionados.</div>`;
                    return;
                }
                
                window.currentReportData = pagos.map(p => ({ 
                    mes: String(p.mes || p.dataValues?.mes || ''), 
                    pagos: parseInt(p.total || p.dataValues?.total || 0), 
                    monto_total: parseFloat(p.monto_total || p.dataValues?.monto_total || 0) 
                }));
                
                const btnCSV = document.getElementById('btn-export-report-csv');
                const btnPDF = document.getElementById('btn-export-report-pdf');
                if (btnCSV) btnCSV.onclick = () => { try { exportarCSV(window.currentReportData, 'pagos_mensuales.csv'); } catch (_) {} };
                if (btnPDF) btnPDF.onclick = () => { try { exportarReportePDF('Pagos Mensuales', ['mes','pagos','monto_total'], window.currentReportData, 'report-canvas'); } catch (_) {} };
                
                crearGraficoBarras('report-canvas', labels, data, 'Pagos');
                renderLegendFrom(window.currentReportData, 'mes', 'pagos', ' pagos');
            } catch (e) {
                preview.innerHTML = `<div class="alert alert-danger">Error al generar el reporte: ${e.message || e}</div>`;
            } finally { mostrarCargando(false); }
        };

        const genPagosEstado = async () => {
            try {
                mostrarCargando(true);
                const canvas = renderCanvas('Pagos por Estado');
                if (!canvas) return;
                const resp = await fetchAPI('/pagos/stats/general' + getReportParams(), { method: 'GET' });
                const estados = (resp && (resp.estadoPorPago || resp.data?.estadoPorPago)) || [];
                const labels = estados.map(e => String(e.estado || e.dataValues?.estado || ''));
                const data = estados.map(e => parseInt(e.dataValues?.total || e.total || 0));
                
                if (labels.length === 0) {
                    preview.innerHTML = `<div class="alert alert-info">No hay datos disponibles para este reporte con los filtros seleccionados.</div>`;
                    return;
                }
                
                window.currentReportData = estados.map(e => ({ 
                    estado: String(e.estado || e.dataValues?.estado || ''), 
                    total: parseInt(e.dataValues?.total || e.total || 0) 
                }));
                
                const btnCSV = document.getElementById('btn-export-report-csv');
                const btnPDF = document.getElementById('btn-export-report-pdf');
                if (btnCSV) btnCSV.onclick = () => { try { exportarCSV(window.currentReportData, 'pagos_por_estado.csv'); } catch (_) {} };
                if (btnPDF) btnPDF.onclick = () => { try { exportarReportePDF('Pagos por Estado', ['estado','total'], window.currentReportData, 'report-canvas'); } catch (_) {} };
                
                crearGraficoBarras('report-canvas', labels, data, 'Pagos por Estado');
                renderLegendFrom(window.currentReportData, 'estado', 'total', ' pagos');
            } catch (e) {
                preview.innerHTML = `<div class="alert alert-danger">Error al generar el reporte: ${e.message || e}</div>`;
            } finally { mostrarCargando(false); }
        };

        const b1 = document.getElementById('btn-reporte-tramites-depto');
        const b2 = document.getElementById('btn-reporte-tramites-estado');
        const b3 = document.getElementById('btn-reporte-pagos');
        const b4 = document.getElementById('btn-reporte-pagos-estado');
        if (b1) b1.onclick = genTramitesDepto;
        if (b2) b2.onclick = genTramitesEstado;
        if (b3) b3.onclick = genPagos;
        if (b4) b4.onclick = genPagosEstado;

        // Auto-generar el primero por defecto si se desea o dejarlo vacío
        // genTramitesDepto();

    } catch (error) {
        console.error('Error al cargar reportes:', error);
    } finally {
        mostrarCargando(false);
    }
}

window.cargarReportes = cargarReportes;
