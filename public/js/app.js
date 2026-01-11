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
                const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
                const rRaw = usuario && (usuario.rol || usuario.role || usuario.rol_nombre);
                rol = (rRaw || '').toString().toLowerCase();
                if (rol.includes('admin') && !rol.includes('super')) rol = 'admin';
                else if (rol.includes('func') || rol.includes('secretaria')) rol = 'funcionario';
                
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
                                        <button id="btn-reporte-tramites-depto" class="btn btn-sm btn-outline-primary"><i class="bi bi-file-earmark-text"></i> Generar</button>
                                    </li>
                                    <li class="list-group-item d-flex justify-content-between align-items-center">
                                        Trámites por Estado
                                        <button id="btn-reporte-tramites-estado" class="btn btn-sm btn-outline-primary"><i class="bi bi-bar-chart"></i> Generar</button>
                                    </li>
                                    <li class="list-group-item d-flex justify-content-between align-items-center">
                                        Pagos Mensuales
                                        <button id="btn-reporte-pagos" class="btn btn-sm btn-outline-primary"><i class="bi bi-cash-coin"></i> Generar</button>
                                    </li>
                                    <li class="list-group-item d-flex justify-content-between align-items-center">
                                        Pagos por Estado
                                        <button id="btn-reporte-pagos-estado" class="btn btn-sm btn-outline-primary"><i class="bi bi-graph-up"></i> Generar</button>
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
                            <div class="card-body" id="report-preview">
                                <p class="text-center">Seleccione un reporte para visualizar</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            try {
                const preview = document.getElementById('report-preview');
                const renderCanvas = (title) => {
                    if (!preview) return null;
                    preview.innerHTML = `<div class="d-flex justify-content-between align-items-center mb-2"><h6 class="mb-0">${title}</h6><div class="d-flex align-items-center gap-2"><button id="btn-export-report-csv" class="btn btn-sm btn-outline-secondary">Descargar CSV</button><button id="btn-export-report-pdf" class="btn btn-sm btn-outline-primary">Descargar PDF</button><div class="small text-muted">Generado ${new Date().toLocaleString('es-CL')}</div></div></div><div style="position:relative;height:360px"><canvas id="report-canvas"></canvas></div><div id="report-legend" class="mt-3"></div>`;
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
                        const resp = await fetchAPI('/tramites/stats/general', { method: 'GET' });
                        const arr = (resp && (resp.tramitesPorDepartamento || resp.data?.tramitesPorDepartamento)) || [];
                        const labels = arr.map(x => String(x.departamento_nombre || x.dataValues?.departamento_nombre || ''));
                        const data = arr.map(x => parseInt(x.dataValues?.total || x.total || 0));
                        if (labels.length === 0) {
                            preview.innerHTML = `<div class="alert alert-info">No hay datos disponibles para este reporte.</div>`;
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
                        try { const u = JSON.parse(localStorage.getItem('usuario') || '{}'); console.log('[REPORT][Trámites por Estado] Usuario actual', { id: u.id, role: (u.role||u.rol||u.rol_nombre), municipalidad_id: u.municipalidad_id, municipalidad_nombre: u.municipalidad_nombre }); } catch (_) {}
                        console.log('[REPORT][Trámites por Estado] Fetch inicio');
                        let resp = await fetchAPI('/dashboard/tramites/estado', { method: 'GET', headers: { 'Cache-Control': 'no-cache' } });
                        console.log('[REPORT][Trámites por Estado] Respuesta API', resp);
                        let estados = (resp && (resp.tramitesPorEstado || resp.data?.tramitesPorEstado)) || [];
                        let labels = Array.isArray(estados) ? estados.map(e => String(e.estado || '')) : [];
                        let data = Array.isArray(estados) ? estados.map(e => parseInt(e.cantidad || e.dataValues?.cantidad || 0)) : [];
                        console.log('[REPORT][Trámites por Estado] Estados normalizados', { labels, data });
                        if (!labels.length || (data.reduce((a,b)=>a+b,0) === 0)) {
                            try {
                                console.log('[REPORT][Trámites por Estado] Fallback a /tramites/stats/general');
                                resp = await fetchAPI('/tramites/stats/general', { method: 'GET', headers: { 'Cache-Control': 'no-cache' } });
                                console.log('[REPORT][Trámites por Estado] Respuesta fallback', resp);
                                estados = (resp && (resp.estadoPorTramite || resp.data?.estadoPorTramite)) || [];
                                labels = Array.isArray(estados) ? estados.map(e => String(e.estado || e.dataValues?.estado || '')) : [];
                                data = Array.isArray(estados) ? estados.map(e => parseInt(e.dataValues?.total || e.total || 0)) : [];
                                console.log('[REPORT][Trámites por Estado] Datos fallback normalizados', { labels, data });
                            } catch (_) {}
                        }
                        if (labels.length === 0) {
                            preview.innerHTML = `<div class="alert alert-info">No hay datos disponibles para este reporte.</div>`;
                            return;
                        }
                        window.currentReportData = estados.map(e => ({ estado: String(e.estado || ''), total: parseInt(e.cantidad || e.dataValues?.cantidad || 0) }));
                        const btnCSV = document.getElementById('btn-export-report-csv');
                        const btnPDF = document.getElementById('btn-export-report-pdf');
                        if (btnCSV) btnCSV.onclick = () => { try { exportarCSV(window.currentReportData, 'tramites_por_estado.csv'); } catch (_) {} };
                        if (btnPDF) btnPDF.onclick = () => { try { exportarReportePDF('Trámites por Estado', ['estado','total'], window.currentReportData, 'report-canvas'); } catch (_) {} };
                        crearGraficoBarras('report-canvas', labels, data, 'Trámites por Estado');
                        renderLegendFrom(window.currentReportData, 'estado', 'total', ' trámites');
                    } catch (e) {
                        console.error('[REPORT][Trámites por Estado] Error', e);
                        preview.innerHTML = `<div class="alert alert-danger">Error al generar el reporte: ${e.message || e}</div>`;
                    } finally { mostrarCargando(false); }
                };
                const genPagos = async () => {
                    try {
                        mostrarCargando(true);
                        const canvas = renderCanvas('Pagos mensuales');
                        if (!canvas) return;
                        const resp = await fetchAPI('/pagos/stats/general', { method: 'GET' });
                        const pagos = (resp && (resp.pagosPorMes || resp.data?.pagosPorMes)) || [];
                        const labels = pagos.map(p => String(p.mes || p.dataValues?.mes || ''));
                        const data = pagos.map(p => parseInt(p.total || p.dataValues?.total || 0));
                        if (labels.length === 0) {
                            preview.innerHTML = `<div class="alert alert-info">No hay datos disponibles para este reporte.</div>`;
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
                        const resp = await fetchAPI('/pagos/stats/general', { method: 'GET' });
                        const estados = (resp && (resp.estadoPorPago || resp.data?.estadoPorPago)) || [];
                        const labels = estados.map(e => String(e.estado || e.dataValues?.estado || ''));
                        const data = estados.map(e => parseInt(e.dataValues?.total || e.total || 0));
                        if (labels.length === 0) {
                            preview.innerHTML = `<div class="alert alert-info">No hay datos disponibles para este reporte.</div>`;
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
    
    mostrarCargando(false);
}

document.addEventListener('DOMContentLoaded', () => {
    (async () => {
        try {
            const token = (function(){
                try{
                    const u = JSON.parse(localStorage.getItem('usuario'));
                    const r = u && (u.rol || u.role);
                    const name = (function(rr){const s=String(rr||'').toLowerCase();if(s.includes('superadmin'))return 'corex_session_superadmin';if(s.includes('admin'))return 'corex_session_admin';return 'corex_session_ciudadano'})(r);
                    const v = (function(n){try{const a=n+'=';const ca=document.cookie.split(';');for(let i=0;i<ca.length;i++){let c=ca[i];while(c.charAt(0)===' ')c=c.substring(1);if(c.indexOf(a)===0)return decodeURIComponent(c.substring(a.length));}return null;}catch(_){return null}})(name);
                    return v || localStorage.getItem('token');
                }catch(_){return localStorage.getItem('token');}
            })();
            if (!token) return;

            // Fix F5: Evitar parpadeo del login si ya hay sesión
            try {
                if (window._loginRenderTimeoutId) clearTimeout(window._loginRenderTimeoutId);
                const loginContainer = document.getElementById('login-container');
                if (loginContainer) loginContainer.classList.add('d-none');
                const footer = document.querySelector('footer');
                if (footer) footer.classList.remove('d-none');
                
                // Asegurar que auth.js no muestre el login después
                if (typeof cancelarMostrarLogin === 'function') cancelarMostrarLogin();
            } catch (_) {}

            const perfil = await fetchAPI('/usuarios/perfil', { suppressErrorLog: true });
            
            // Fallback: Si falla el perfil pero hay usuario local, intentar usarlo
            let uLocal = null;
            try { uLocal = JSON.parse(localStorage.getItem('usuario')); } catch (_) {}
            
            const pFinal = perfil || uLocal;
            const rol = pFinal && (pFinal.rol || pFinal.role);
            
            if (pFinal && (rol === 'admin' || rol === 'funcionario')) {
                // Actualizar usuario en localStorage si tenemos perfil fresco
                if (perfil) {
                    try { localStorage.setItem('usuario', JSON.stringify(perfil)); } catch (_) {}
                }
                
                // sessionStorage removed
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
