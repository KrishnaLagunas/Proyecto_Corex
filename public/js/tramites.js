/**
 * Función para cargar tipos de trámites
 */
async function cargarTiposTramites() {
    try {
        mostrarCargando(true);
        
        const tiposTramites = await fetchAPI('/tramites/tipos');
        
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="row mb-3 align-items-center">
                <div class="col-4">
                    <button class="btn btn-outline-secondary" onclick="cargarTramites()">
                        <i class="bi bi-arrow-left"></i> Volver
                    </button>
                </div>
                <div class="col-4 text-center">
                    <h2 class="section-title">Tipos de Trámites</h2>
                </div>
                <div class="col-4"></div>
            </div>

            <div class="row g-2 align-items-end mb-2">
                <div class="col-md-6">
                    <input type="text" class="form-control" id="buscar-tipo-tramite" placeholder="Buscar tipo de trámite...">
                </div>
                <div class="col-md-3">
                    <select class="form-select" id="filtro-estado">
                        <option value="">Todos los estados</option>
                        <option value="activo">Activo</option>
                        <option value="inactivo">Inactivo</option>
                    </select>
                </div>
                <div class="col-md-3 d-flex justify-content-end">
                    <button class="btn btn-report" onclick="generarReporteTiposTramites()">
                        <i class="bi bi-file-earmark-text"></i> Reporte
                    </button>
                </div>
            </div>

            <div class="row mb-2">
                <div class="col-md-3 offset-md-9 d-flex justify-content-end">
                    <button class="btn btn-primary btn-new-user" onclick="mostrarFormularioTipoTramite()">
                        <i class="bi bi-plus-circle"></i> Nuevo Tipo de Trámite
                    </button>
                </div>
            </div>

            <table class="table table-striped table-hover align-middle table-fullwidth">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Descripción</th>
                        <th>Costo</th>
                        <th>Tiempo Estimado</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody id="tabla-tipos-tramites">
                    ${tiposTramites.map(tipo => `
                        <tr>
                            <td>${tipo.id}</td>
                            <td class="text-uppercase">${tipo.nombre}</td>
                            <td>${tipo.descripcion.substring(0, 50)}${tipo.descripcion.length > 50 ? '...' : ''}</td>
                            <td>${formatearMoneda(tipo.costo)}</td>
                            <td>${tipo.tiempo_estimado} días</td>
                            <td><span class="estado-${tipo.estado}">${tipo.estado}</span></td>
                            <td>
                                <button class="btn btn-sm btn-info" onclick="verDetalleTipoTramite(${tipo.id})">
                                    <i class="bi bi-eye"></i>
                                </button>
                                <button class="btn btn-sm btn-edit" onclick="editarTipoTramite(${tipo.id})">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <button class="btn btn-sm btn-${tipo.estado === 'activo' ? 'warning' : 'success'}" 
                                        onclick="cambiarEstadoTipoTramite(${tipo.id}, '${tipo.estado === 'activo' ? 'inactivo' : 'activo'}')">
                                    <i class="bi bi-${tipo.estado === 'activo' ? 'x-circle' : 'check-circle'}"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        // Agregar eventos para filtros
        const buscarTipoTramite = document.getElementById('buscar-tipo-tramite');
        const filtroEstado = document.getElementById('filtro-estado');
        
        if (buscarTipoTramite && filtroEstado) {
            buscarTipoTramite.addEventListener('input', filtrarTiposTramites);
            filtroEstado.addEventListener('change', filtrarTiposTramites);
        }
        
    } catch (error) {
        console.error('Error al cargar tipos de trámites:', error);
        mostrarNotificacion('Error al cargar tipos de trámites: ' + error.message, 'danger');
    } finally {
        mostrarCargando(false);
    }
}

/**
 * Función para filtrar tipos de trámites según criterios de búsqueda
 */
function filtrarTiposTramites() {
    const busqueda = document.getElementById('buscar-tipo-tramite').value.toLowerCase();
    const estado = document.getElementById('filtro-estado').value;
    
    const filas = document.querySelectorAll('#tabla-tipos-tramites tr');
    
    filas.forEach(fila => {
        const nombre = fila.cells[1].textContent.toLowerCase();
        const descripcion = fila.cells[2].textContent.toLowerCase();
        const estadoTipoTramite = fila.cells[5].textContent.toLowerCase();
        
        const coincideBusqueda = nombre.includes(busqueda) || descripcion.includes(busqueda);
        const coincideEstado = estado === '' || estadoTipoTramite === estado;
        
        if (coincideBusqueda && coincideEstado) {
            fila.style.display = '';
        } else {
            fila.style.display = 'none';
        }
    });
}

/**
 * Función para mostrar el formulario de creación/edición de tipo de trámite
 * @param {number} tipoTramiteId - ID del tipo de trámite a editar (opcional)
 */
async function mostrarFormularioTipoTramite(tipoTramiteId = null) {
    try {
        mostrarCargando(true);
        
        let tipoTramite = {
            nombre: '',
            descripcion: '',
            costo: 0,
            tiempo_estimado: 1,
            requisitos: '',
            documentos_requeridos: '',
            estado: 'activo'
        };
        
        let titulo = 'Nuevo Tipo de Trámite';
        let accion = 'crear';
        
        if (tipoTramiteId) {
            tipoTramite = await fetchAPI(`/tipos-tramites/${tipoTramiteId}`);
            titulo = 'Editar Tipo de Trámite';
            accion = 'actualizar';
        }
        
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="row mb-4">
                <div class="col-12">
                    <button class="btn btn-outline-secondary mb-3" onclick="cargarTiposTramites()">
                        <i class="bi bi-arrow-left"></i> Volver a la lista
                    </button>
                    <h2>${titulo}</h2>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-10 offset-md-1">
                    <div class="card">
                        <div class="card-body">
                            <form id="form-tipo-tramite">
                                <input type="hidden" id="tipo-tramite-id" value="${tipoTramite.id || ''}">
                                <input type="hidden" id="accion" value="${accion}">
                                
                                <div class="row mb-3">
                                    <div class="col-md-8">
                                        <label for="nombre" class="form-label">Nombre</label>
                                        <input type="text" class="form-control" id="nombre" value="${tipoTramite.nombre}" required>
                                    </div>
                                    <div class="col-md-4">
                                        <label for="estado" class="form-label">Estado</label>
                                        <select class="form-select" id="estado" required>
                                            <option value="activo" ${tipoTramite.estado === 'activo' ? 'selected' : ''}>Activo</option>
                                            <option value="inactivo" ${tipoTramite.estado === 'inactivo' ? 'selected' : ''}>Inactivo</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="descripcion" class="form-label">Descripción</label>
                                    <textarea class="form-control" id="descripcion" rows="3" required>${tipoTramite.descripcion}</textarea>
                                </div>
                                
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <label for="costo" class="form-label">Costo</label>
                                        <div class="input-group">
                                            <span class="input-group-text">$</span>
                                            <input type="number" class="form-control" id="costo" min="0" step="0.01" value="${tipoTramite.costo}" required>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <label for="tiempo-estimado" class="form-label">Tiempo Estimado (días)</label>
                                        <input type="number" class="form-control" id="tiempo-estimado" min="1" value="${tipoTramite.tiempo_estimado}" required>
                                    </div>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="requisitos" class="form-label">Requisitos</label>
                                    <textarea class="form-control" id="requisitos" rows="4">${tipoTramite.requisitos || ''}</textarea>
                                    <div class="form-text">Ingrese cada requisito en una línea separada</div>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="documentos-requeridos" class="form-label">Documentos Requeridos</label>
                                    <textarea class="form-control" id="documentos-requeridos" rows="4">${tipoTramite.documentos_requeridos || ''}</textarea>
                                    <div class="form-text">Ingrese cada documento en una línea separada</div>
                                </div>
                                
                                <div class="d-grid gap-2">
                                    <button type="submit" class="btn btn-primary">
                                        <i class="bi bi-save"></i> Guardar
                                    </button>
                                    <button type="button" class="btn btn-outline-secondary" onclick="cargarTiposTramites()">
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Agregar evento para el formulario
        const formTipoTramite = document.getElementById('form-tipo-tramite');
        formTipoTramite.addEventListener('submit', guardarTipoTramite);
        
    } catch (error) {
        console.error('Error al cargar formulario de tipo de trámite:', error);
        mostrarNotificacion('Error al cargar formulario: ' + error.message, 'danger');
    } finally {
        mostrarCargando(false);
    }
}

/**
 * Función para guardar un tipo de trámite (crear o actualizar)
 * @param {Event} e - Evento del formulario
 */
async function guardarTipoTramite(e) {
    e.preventDefault();
    
    try {
        mostrarCargando(true);
        
        const tipoTramiteId = document.getElementById('tipo-tramite-id').value;
        const accion = document.getElementById('accion').value;
        
        const tipoTramite = {
            nombre: document.getElementById('nombre').value,
            descripcion: document.getElementById('descripcion').value,
            costo: parseFloat(document.getElementById('costo').value),
            tiempo_estimado: parseInt(document.getElementById('tiempo-estimado').value),
            requisitos: document.getElementById('requisitos').value,
            documentos_requeridos: document.getElementById('documentos-requeridos').value,
            estado: document.getElementById('estado').value
        };
        
        let respuesta;
        
        if (accion === 'crear') {
            respuesta = await fetchAPI('/tramites/tipos', {
                method: 'POST',
                body: JSON.stringify(tipoTramite)
            });
            mostrarNotificacion('Tipo de trámite creado correctamente', 'success');
        } else {
            respuesta = await fetchAPI(`/tipos-tramites/${tipoTramiteId}`, {
                method: 'PUT',
                body: JSON.stringify(tipoTramite)
            });
            mostrarNotificacion('Tipo de trámite actualizado correctamente', 'success');
        }
        
        cargarTiposTramites();
        
    } catch (error) {
        console.error('Error al guardar tipo de trámite:', error);
        mostrarNotificacion('Error al guardar tipo de trámite: ' + error.message, 'danger');
    } finally {
        mostrarCargando(false);
    }
}

/**
 * Función para editar un tipo de trámite
 * @param {number} tipoTramiteId - ID del tipo de trámite a editar
 */
function editarTipoTramite(tipoTramiteId) {
    mostrarFormularioTipoTramite(tipoTramiteId);
}

/**
 * Función para cambiar el estado de un tipo de trámite
 * @param {number} tipoTramiteId - ID del tipo de trámite
 * @param {string} nuevoEstado - Nuevo estado ('activo' o 'inactivo')
 */
async function cambiarEstadoTipoTramite(tipoTramiteId, nuevoEstado) {
    try {
        mostrarCargando(true);
        
        await fetchAPI(`/tipos-tramites/${tipoTramiteId}/estado`, {
            method: 'PUT',
            body: JSON.stringify({ estado: nuevoEstado })
        });
        
        mostrarNotificacion(`Tipo de trámite ${nuevoEstado === 'activo' ? 'activado' : 'desactivado'} correctamente`, 'success');
        cargarTiposTramites();
        
    } catch (error) {
        console.error('Error al cambiar estado del tipo de trámite:', error);
        mostrarNotificacion('Error al cambiar estado: ' + error.message, 'danger');
    } finally {
        mostrarCargando(false);
    }
}

/**
 * Función para ver el detalle de un tipo de trámite
 * @param {number} tipoTramiteId - ID del tipo de trámite
 */
async function verDetalleTipoTramite(tipoTramiteId) {
    try {
        mostrarCargando(true);
        
        const tipoTramite = await fetchAPI(`/tipos-tramites/${tipoTramiteId}`);
        const tramites = await fetchAPI(`/tipos-tramites/${tipoTramiteId}/tramites`);
        
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="row mb-4">
                <div class="col-12">
                    <button class="btn btn-outline-secondary mb-3" onclick="cargarTiposTramites()">
                        <i class="bi bi-arrow-left"></i> Volver a la lista
                    </button>
                    <h2>Detalle del Tipo de Trámite</h2>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-10 offset-md-1">
                    <div class="card mb-4">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="mb-0">Información General</h5>
                            <div>
                                <button class="btn btn-primary" onclick="editarTipoTramite(${tipoTramite.id})">
                                    <i class="bi bi-pencil"></i> Editar
                                </button>
                                <button class="btn btn-${tipoTramite.estado === 'activo' ? 'warning' : 'success'}" 
                                        onclick="cambiarEstadoTipoTramite(${tipoTramite.id}, '${tipoTramite.estado === 'activo' ? 'inactivo' : 'activo'}')">
                                    <i class="bi bi-${tipoTramite.estado === 'activo' ? 'x-circle' : 'check-circle'}"></i> 
                                    ${tipoTramite.estado === 'activo' ? 'Desactivar' : 'Activar'}
                                </button>
                                <button class="btn btn-info" onclick="generarReporteTipoTramite(${tipoTramite.id})">
                                    <i class="bi bi-file-earmark-text"></i> Generar Reporte
                                </button>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">ID:</div>
                                <div class="col-md-8">${tipoTramite.id}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Nombre:</div>
                                <div class="col-md-8">${tipoTramite.nombre}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Estado:</div>
                                <div class="col-md-8"><span class="estado-${tipoTramite.estado}">${tipoTramite.estado}</span></div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Costo:</div>
                                <div class="col-md-8">${formatearMoneda(tipoTramite.costo)}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Tiempo Estimado:</div>
                                <div class="col-md-8">${tipoTramite.tiempo_estimado} días</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Descripción:</div>
                                <div class="col-md-8">${tipoTramite.descripcion}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="card mb-4">
                        <div class="card-header">
                            <h5>Requisitos</h5>
                        </div>
                        <div class="card-body">
                            ${!tipoTramite.requisitos ? `
                                <p>No hay requisitos especificados para este tipo de trámite.</p>
                            ` : `
                                <ul>
                                    ${tipoTramite.requisitos.split('\n').map(req => `
                                        <li>${req.trim()}</li>
                                    `).join('')}
                                </ul>
                            `}
                        </div>
                    </div>
                    
                    <div class="card mb-4">
                        <div class="card-header">
                            <h5>Documentos Requeridos</h5>
                        </div>
                        <div class="card-body">
                            ${!tipoTramite.documentos_requeridos ? `
                                <p>No hay documentos requeridos especificados para este tipo de trámite.</p>
                            ` : `
                                <ul>
                                    ${tipoTramite.documentos_requeridos.split('\n').map(doc => `
                                        <li>${doc.trim()}</li>
                                    `).join('')}
                                </ul>
                            `}
                        </div>
                    </div>
                    
                    <div class="card">
                        <div class="card-header">
                            <h5>Trámites Asociados</h5>
                        </div>
                        <div class="card-body">
                            ${!tramites || tramites.length === 0 ? `
                                <p>No hay trámites asociados a este tipo.</p>
                            ` : `
                                <div class="table-responsive">
                                    <table class="table table-striped table-hover">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Ciudadano</th>
                                                <th>Fecha Solicitud</th>
                                                <th>Estado</th>
                                                <th>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${tramites.map(tramite => `
                                                <tr>
                                                    <td>${tramite.id}</td>
                                                    <td>${tramite.ciudadano?.nombre} ${tramite.ciudadano?.apellido}</td>
                                                    <td>${formatearFecha(tramite.fecha_solicitud)}</td>
                                                    <td><span class="estado-${tramite.estado}" data-estado="${tramite.estado}">${obtenerNombreEstadoTramite(tramite.estado)}</span></td>
                                                    <td>
                                                        <button class="btn btn-sm btn-info" onclick="verDetalleTramite(${tramite.id})">
                                                            <i class="bi bi-eye"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            `}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
    } catch (error) {
        console.error('Error al cargar detalle del tipo de trámite:', error);
        mostrarNotificacion('Error al cargar detalle: ' + error.message, 'danger');
    } finally {
        mostrarCargando(false);
    }
}

/**
 * Función para generar un reporte de un tipo de trámite específico
 * @param {number} tipoTramiteId - ID del tipo de trámite
 */
async function generarReporteTipoTramite(tipoTramiteId) {
    try {
        mostrarCargando(true);
        
        const reporte = await fetchAPI(`/tipos-tramites/${tipoTramiteId}/reporte`);
        
        // Simulación de descarga de reporte
        setTimeout(() => {
            const a = document.createElement('a');
            a.href = `data:application/pdf;base64,${reporte.base64}`;
            a.download = `reporte_tipo_tramite_${tipoTramiteId}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }, 1000);
        
        mostrarNotificacion('Reporte generado correctamente', 'success');
        
    } catch (error) {
        console.error('Error al generar reporte:', error);
        mostrarNotificacion('Error al generar reporte: ' + error.message, 'danger');
    } finally {
        mostrarCargando(false);
    }
}

/**
 * Función para generar un reporte de todos los tipos de trámites
 */
async function generarReporteTiposTramites() {
    try {
        mostrarCargando(true);
        
        // Obtener filtros actuales
        const busqueda = document.getElementById('buscar-tipo-tramite')?.value || '';
        const estado = document.getElementById('filtro-estado')?.value || '';
        
        const reporte = await fetchAPI('/tipos-tramites/reporte', {
            method: 'POST',
            body: JSON.stringify({
                filtros: {
                    busqueda,
                    estado
                }
            })
        });
        
        // Simulación de descarga de reporte
        setTimeout(() => {
            const a = document.createElement('a');
            a.href = `data:application/pdf;base64,${reporte.base64}`;
            a.download = 'reporte_tipos_tramites.pdf';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }, 1000);
        
        mostrarNotificacion('Reporte generado correctamente', 'success');
        
    } catch (error) {
        console.error('Error al generar reporte:', error);
        mostrarNotificacion('Error al generar reporte: ' + error.message, 'danger');
    } finally {
        mostrarCargando(false);
    }
}

/**
 * Función para cargar la lista de trámites
 */
async function cargarTramites() {
    try {
        mostrarCargando(true);
        
        let tramites = [];
        let tiposTramites = [];
        try {
            const respTramites = await fetchAPI('/tramites?limit=100');
            tramites = Array.isArray(respTramites) ? respTramites : (respTramites.tramites || []);
        } catch (e) {
            console.warn('Error obteniendo trámites, mostrando lista vacía:', e?.message || e);
        }
        try {
            const respTipos = await fetchAPI('/tramites/tipos');
            tiposTramites = Array.isArray(respTipos) ? respTipos : (respTipos.tipos || respTipos || []);
        } catch (e) {
            console.warn('Error obteniendo tipos de trámites, selector sin opciones:', e?.message || e);
        }
        // Detectar rol actual para controlar acciones disponibles
        const usuarioActual = (typeof obtenerUsuario === 'function') ? obtenerUsuario() : null;
        const rolActual = (usuarioActual && (usuarioActual.role || usuarioActual.rol)) || null;
        const puedeGestionarTipos = rolActual === 'superadmin';
        const puedeCrearTramite = rolActual === 'superadmin';
        const btnGestionTipos = puedeGestionarTipos ? `
            <button class="btn btn-ghost-secondary me-2" onclick="cargarTiposTramites()">
                <i class="bi bi-gear"></i> Gestionar Tipos de Trámites
            </button>
        ` : '';
        const btnNuevoTramite = puedeCrearTramite ? `
            <button class="btn btn-primary btn-new-user" onclick="mostrarFormularioTramite()">
                <i class="bi bi-plus-circle"></i> Nuevo Trámite
            </button>
        ` : '';
        
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="row mb-3">
                <div class="col-12 text-center">
                    <h2 class="section-title">Gestión de Trámites</h2>
                </div>
            </div>

            <div class="card no-hover">
                <div class="card-header">
                    <div class="row">
                        <div class="col-md-3">
                            <input type="text" class="form-control" id="buscar-tramite" placeholder="Buscar trámite...">
                        </div>
                        <div class="col-md-3">
                            <select class="form-select" id="filtro-tipo-tramite">
                                <option value="">Todos los tipos</option>
                                ${tiposTramites.map(tipo => `
                                    <option value="${tipo.id}">${tipo.nombre}</option>
                                `).join('')}
                            </select>
                        </div>
                        <div class="col-md-2">
                            <select class="form-select" id="filtro-estado">
                                <option value="">Todos los estados</option>
                                <option value="pendiente">Pendiente</option>
                                <option value="en_proceso">En Proceso</option>
                                <option value="completado">Completado</option>
                                <option value="rechazado">Rechazado</option>
                            </select>
                        </div>
                        <div class="col-md-2">
                            <input type="date" class="form-control" id="filtro-fecha" placeholder="Fecha">
                        </div>
                <div class="col-md-2">
                    <button class="btn btn-report w-100" onclick="generarReporteTramites()">
                        <i class="bi bi-file-earmark-text"></i> Reporte
                    </button>
                </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="row mb-2">
                        <div class="col-12 d-flex justify-content-end">
                            ${btnGestionTipos}
                            ${btnNuevoTramite}
                        </div>
                    </div>
                    <div class="table-responsive">
                        <table class="table table-striped table-hover">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Tipo</th>
                                    <th>Ciudadano</th>
                                    <th>Fecha Solicitud</th>
                                    <th>Fecha Actualización</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody id="tabla-tramites">
                                ${tramites.map(tramite => `
                                    <tr>
                                        <td>${tramite.id}</td>
                                        <td class="text-uppercase">${tramite.tipo || 'N/A'}</td>
                                        <td>${tramite.ciudadano?.nombre} ${tramite.ciudadano?.apellido}</td>
                                        <td>${formatearFecha(tramite.fecha_solicitud)}</td>
                                        <td>${formatearFecha(tramite.fecha_actualizacion)}</td>
                                        <td><span class="estado-${tramite.estado}" data-estado="${tramite.estado}">${obtenerNombreEstadoTramite(tramite.estado)}</span></td>
                                        <td>
                                            <button class="btn btn-sm btn-info" onclick="verDetalleTramite(${tramite.id})">
                                                <i class="bi bi-eye"></i>
                                            </button>
                                            <button class="btn btn-sm btn-primary" onclick="actualizarEstadoTramite(${tramite.id})">
                                                <i class="bi bi-pencil"></i>
                                            </button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        
        // Agregar eventos para filtros
        const buscarTramite = document.getElementById('buscar-tramite');
        const filtroTipoTramite = document.getElementById('filtro-tipo-tramite');
        const filtroEstado = document.getElementById('filtro-estado');
        const filtroFecha = document.getElementById('filtro-fecha');
        
        if (buscarTramite && filtroTipoTramite && filtroEstado && filtroFecha) {
            buscarTramite.addEventListener('input', filtrarTramites);
            filtroTipoTramite.addEventListener('change', filtrarTramites);
            filtroEstado.addEventListener('change', filtrarTramites);
            filtroFecha.addEventListener('change', filtrarTramites);
        }
        
    } catch (error) {
        console.error('Error al cargar trámites:', error);
        mostrarNotificacion('Error al cargar trámites: ' + error.message, 'danger');
    } finally {
        mostrarCargando(false);
    }
}

/**
 * Función para filtrar trámites según criterios de búsqueda
 */
function filtrarTramites() {
    const busqueda = document.getElementById('buscar-tramite').value.toLowerCase();
    const tipoTramite = document.getElementById('filtro-tipo-tramite').value;
    const estado = document.getElementById('filtro-estado').value;
    const fecha = document.getElementById('filtro-fecha').value;
    
    const filas = document.querySelectorAll('#tabla-tramites tr');
    
    filas.forEach(fila => {
        const id = fila.cells[0].textContent.toLowerCase();
        const tipo = fila.cells[1].textContent.toLowerCase();
        const ciudadano = fila.cells[2].textContent.toLowerCase();
        const fechaSolicitud = fila.cells[3].textContent;
        const estadoSpan = fila.cells[5].querySelector('span');
        const estadoTramiteCodigo = estadoSpan && estadoSpan.dataset ? estadoSpan.dataset.estado : fila.cells[5].textContent.toLowerCase();
        
        const coincideBusqueda = id.includes(busqueda) || tipo.includes(busqueda) || ciudadano.includes(busqueda);
        const coincideTipo = tipoTramite === '' || fila.cells[1].textContent.includes(tipoTramite);
        const coincideEstado = estado === '' || estadoTramiteCodigo === estado;
        const coincideFecha = fecha === '' || fechaSolicitud.includes(fecha);
        
        if (coincideBusqueda && coincideTipo && coincideEstado && coincideFecha) {
            fila.style.display = '';
        } else {
            fila.style.display = 'none';
        }
    });
}

/**
 * Función para mostrar el formulario de creación de trámite
 */
async function mostrarFormularioTramite() {
    try {
        // Restringir creación de trámites a administradores
        const usuarioActual = (typeof obtenerUsuario === 'function') ? obtenerUsuario() : null;
        const rolActual = (usuarioActual && (usuarioActual.role || usuarioActual.rol)) || null;
        if (rolActual !== 'superadmin') {
            mostrarNotificacion('No tienes permisos para crear trámites.', 'warning');
            if (typeof cargarTramites === 'function') cargarTramites();
            return;
        }
        mostrarCargando(true);
        
        const responseTipos = await fetchAPI('/tramites/tipos');
        const tiposTramites = Array.isArray(responseTipos) ? responseTipos : (responseTipos.tiposTramites || responseTipos.data || []);
        const responseUsuarios = await fetchAPI('/usuarios?rol=ciudadano&estado=activo');
        const ciudadanos = responseUsuarios.usuarios || [];
        
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="row mb-3 align-items-center">
                <div class="col-4">
                    <button class="btn btn-outline-secondary" onclick="cargarTramites()">
                        <i class="bi bi-arrow-left"></i> Volver
                    </button>
                </div>
                <div class="col-4 text-center">
                    <h2 class="section-title">Nuevo Trámite</h2>
                </div>
                <div class="col-4"></div>
            </div>
            
            <div class="row">
                <div class="col-md-10 offset-md-1">
                    <div class="card no-hover">
                        <div class="card-body">
                            <form id="form-tramite">
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <label for="codigo" class="form-label">Código</label>
                                        <input type="text" class="form-control" id="codigo" required>
                                    </div>
                                    <div class="col-md-6">
                                        <label for="titulo" class="form-label">Título</label>
                                        <input type="text" class="form-control" id="titulo" required>
                                    </div>
                                </div>
                                
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <label for="tipo" class="form-label">Tipo</label>
                                        <select class="form-select" id="tipo" required>
                                            <option value="">Seleccione un tipo</option>
                                            ${(Array.isArray(tiposTramites) ? tiposTramites : []).map(t => `<option value="${t.nombre}">${t.nombre}</option>`).join('')}
                                        </select>
                                    </div>
                                    <div class="col-md-6">
                                        <label for="estado" class="form-label">Estado</label>
                                        <select class="form-select" id="estado" required>
                                            <option value="pendiente">Pendiente</option>
                                            <option value="en_proceso">En Proceso</option>
                                            <option value="aprobado">Aprobado</option>
                                            <option value="rechazado">Rechazado</option>
                                            <option value="completado">Completado</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <label for="fecha_inicio" class="form-label">Fecha de Inicio</label>
                                        <input type="date" class="form-control" id="fecha_inicio" required>
                                    </div>
                                    <div class="col-md-6">
                                        <label for="fecha_limite" class="form-label">Fecha Límite</label>
                                        <input type="date" class="form-control" id="fecha_limite">
                                    </div>
                                </div>
                                
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <label for="prioridad" class="form-label">Prioridad</label>
                                        <select class="form-select" id="prioridad" required>
                                            <option value="baja">Baja</option>
                                            <option value="media" selected>Media</option>
                                            <option value="alta">Alta</option>
                                            <option value="urgente">Urgente</option>
                                        </select>
                                    </div>
                                    <div class="col-md-6">
                                        <label for="ciudadano" class="form-label">Ciudadano</label>
                                        <select class="form-select" id="ciudadano" required>
                                            <option value="">Seleccione un ciudadano</option>
                                            ${ciudadanos.map(ciudadano => `
                                                <option value="${ciudadano.id}">${ciudadano.nombre} ${ciudadano.apellido} - ${ciudadano.documento}</option>
                                            `).join('')}
                                        </select>
                                    </div>
                                </div>
                                
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <label for="monto" class="form-label">Monto</label>
                                        <input type="number" class="form-control" id="monto" step="0.01" min="0">
                                    </div>
                                    <div class="col-md-6">
                                        <label for="requiere_pago" class="form-label">Requiere Pago</label>
                                        <select class="form-select" id="requiere_pago">
                                            <option value="false">No</option>
                                            <option value="true">Sí</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="descripcion" class="form-label">Descripción</label>
                                    <textarea class="form-control" id="descripcion" rows="3" required></textarea>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="notas_internas" class="form-label">Notas Internas</label>
                                    <textarea class="form-control" id="notas_internas" rows="3"></textarea>
                                </div>
                                
                                <div id="info-tipo-tramite" class="alert alert-info d-none">
                                    <h5>Información del Tipo de Trámite</h5>
                                    <div id="info-tipo-tramite-contenido"></div>
                                </div>
                                
                                <div class="d-flex justify-content-center gap-2">
                                    <button type="submit" class="btn btn-primary btn-new-user">
                                        <i class="bi bi-save"></i> Crear Trámite
                                    </button>
                                    <button type="button" class="btn btn-outline-secondary" onclick="cargarTramites()">
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Agregar evento para el formulario
        const formTramite = document.getElementById('form-tramite');
        formTramite.addEventListener('submit', guardarTramite);
        
        // Agregar evento para mostrar información del tipo de trámite seleccionado
        const selectTipoTramite = document.getElementById('tipo');
        selectTipoTramite.addEventListener('change', async function() {
            const tipoTramiteId = this.value;
            if (tipoTramiteId) {
                const tipoTramite = await fetchAPI(`/tipos-tramites/${tipoTramiteId}`);
                const infoTipoTramite = document.getElementById('info-tipo-tramite');
                const infoContenido = document.getElementById('info-tipo-tramite-contenido');
                
                infoContenido.innerHTML = `
                    <p><strong>Descripción:</strong> ${tipoTramite.descripcion}</p>
                    <p><strong>Costo:</strong> ${formatearMoneda(tipoTramite.costo)}</p>
                    <p><strong>Tiempo Estimado:</strong> ${tipoTramite.tiempo_estimado} días</p>
                    
                    ${tipoTramite.requisitos ? `
                        <p><strong>Requisitos:</strong></p>
                        <ul>
                            ${tipoTramite.requisitos.split('\n').map(req => `
                                <li>${req.trim()}</li>
                            `).join('')}
                        </ul>
                    ` : ''}
                    
                    ${tipoTramite.documentos_requeridos ? `
                        <p><strong>Documentos Requeridos:</strong></p>
                        <ul>
                            ${tipoTramite.documentos_requeridos.split('\n').map(doc => `
                                <li>${doc.trim()}</li>
                            `).join('')}
                        </ul>
                    ` : ''}
                `;
                
                infoTipoTramite.classList.remove('d-none');
            } else {
                document.getElementById('info-tipo-tramite').classList.add('d-none');
            }
        });
        
    } catch (error) {
        console.error('Error al cargar formulario de trámite:', error);
        mostrarNotificacion('Error al cargar formulario: ' + error.message, 'danger');
    } finally {
        mostrarCargando(false);
    }
}

/**
 * Función para guardar un trámite
 * @param {Event} e - Evento del formulario
 */
async function guardarTramite(e) {
    e.preventDefault();
    
    try {
        mostrarCargando(true);
        
        const tramite = {
            codigo: document.getElementById('codigo').value,
            titulo: document.getElementById('titulo').value,
            tipo: document.getElementById('tipo').value,
            estado: document.getElementById('estado').value,
            fecha_inicio: document.getElementById('fecha_inicio').value,
            fecha_limite: document.getElementById('fecha_limite').value || null,
            prioridad: document.getElementById('prioridad').value,
            descripcion: document.getElementById('descripcion').value,
            notas_internas: document.getElementById('notas_internas').value || null,
            requiere_pago: document.getElementById('requiere_pago').value === 'true',
            monto: parseFloat(document.getElementById('monto').value) || null,
            pago_completado: false,
            ciudadano_id: parseInt(document.getElementById('ciudadano').value),
            funcionario_id: 1 // Valor por defecto, debería obtenerse del usuario logueado
        };
        
        const respuesta = await fetchAPI('/tramites', {
            method: 'POST',
            body: JSON.stringify(tramite)
        });
        
        mostrarNotificacion('Trámite creado correctamente', 'success');
        verDetalleTramite(respuesta.id);
        
    } catch (error) {
        console.error('Error al guardar trámite:', error);
        mostrarNotificacion('Error al guardar trámite: ' + error.message, 'danger');
    } finally {
        mostrarCargando(false);
    }
}

/**
 * Función para ver el detalle de un trámite
 * @param {number} tramiteId - ID del trámite
 */
async function verDetalleTramite(tramiteId) {
    try {
        mostrarCargando(true);
        
        const tramite = await fetchAPI(`/tramites/${tramiteId}`);
        const documentos = await fetchAPI(`/tramites/${tramiteId}/documentos`);
        const pagos = await fetchAPI(`/tramites/${tramiteId}/pagos`);
        const historial = await fetchAPI(`/tramites/${tramiteId}/historial`);
        
        // Resumen de documentos para cabecera
        const documentoResumen = (!documentos || documentos.length === 0)
            ? 'Ninguno'
            : documentos.map(d => d.nombre).join(', ');
        
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="row mb-4">
                <div class="col-12">
                    <button class="btn btn-outline-secondary mb-3" onclick="cargarTramites()">
                        <i class="bi bi-arrow-left"></i> Volver a la lista
                    </button>
                    <h2>Detalle del Trámite</h2>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-10 offset-md-1">
                    <div class="row g-3">
                    <div class="col-12 col-md-6">
                    <div class="card compact-card h-100">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="mb-0">Información General</h5>
                            <div>
                                <button class="btn btn-primary btn-sm" onclick="actualizarEstadoTramite(${tramite.id})">
                                    <i class="bi bi-pencil"></i> Actualizar Estado
                                </button>
                                <button class="btn btn-info btn-sm" onclick="generarReporteTramite(${tramite.id})">
                                    <i class="bi bi-file-earmark-text"></i> Generar Reporte
                                </button>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">ID:</div>
                                <div class="col-md-8">${tramite.id}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Tipo de Trámite:</div>
                                <div class="col-md-8">${obtenerNombreTipoTramite(tramite.tipo) || 'N/A'}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Ciudadano:</div>
                                <div class="col-md-8">${tramite.ciudadano?.nombre} ${tramite.ciudadano?.apellido}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Documento:</div>
                                <div class="col-md-8">${documentoResumen}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Estado:</div>
                                <div class="col-md-8"><span class="estado-${tramite.estado}">${obtenerNombreEstadoTramite(tramite.estado)}</span></div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Fecha de Solicitud:</div>
                                <div class="col-md-8">${formatearFecha(tramite.fecha_solicitud)}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Fecha de Actualización:</div>
                                <div class="col-md-8">${formatearFecha(tramite.fecha_actualizacion)}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Descripción:</div>
                                <div class="col-md-8">${tramite.descripcion}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Observaciones:</div>
                                <div class="col-md-8">${tramite.observaciones || 'Sin observaciones'}</div>
                            </div>
                        </div>
                    </div>
                    </div>
                    
                    <div class="col-12 col-md-6">
                    <div class="card compact-card h-100">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="mb-0">Documentos</h5>
                            <button class="btn btn-primary btn-sm" onclick="mostrarFormularioDocumento(${tramite.id})">
                                <i class="bi bi-plus-circle"></i> Agregar Documento
                            </button>
                        </div>
                        <div class="card-body">
                            ${!documentos || documentos.length === 0 ? `
                                <p>No hay documentos asociados a este trámite.</p>
                            ` : `
                                <div class="table-responsive">
                                    <table class="table table-striped table-hover">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Nombre</th>
                                                <th>Tipo</th>
                                                <th>Fecha</th>
                                                <th>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${documentos.map(documento => `
                                                <tr>
                                                    <td>${documento.id}</td>
                                                    <td>${documento.nombre}</td>
                                                    <td>${documento.tipo}</td>
                                                    <td>${formatearFecha(documento.fecha_subida)}</td>
                                                    <td>
                                                        <button class="btn btn-sm btn-info" onclick="verDocumento(${documento.id})">
                                                            <i class="bi bi-eye"></i>
                                                        </button>
                                                        <button class="btn btn-sm btn-secondary" onclick="descargarDocumento(${documento.id})">
                                                            <i class="bi bi-download"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            `}
                        </div>
                    </div>
                    </div>
                    
                    <div class="col-12 col-md-6">
                    <div class="card compact-card h-100">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="mb-0">Pagos</h5>
                            ${tramite.estado !== 'rechazado' && !pagos.some(p => p.estado === 'completado') ? `
                                <button class="btn btn-primary btn-sm" onclick="mostrarFormularioPagoTramite(${tramite.id})">
                                    <i class="bi bi-check-circle-fill"></i> Pago completado
                                </button>
                            ` : ''}
                        </div>
                        <div class="card-body">
                            ${!pagos || pagos.length === 0 ? `
                                <p>No hay pagos asociados a este trámite.</p>
                            ` : `
                                <div class="table-responsive">
                                    <table class="table table-striped table-hover">
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
                                            ${pagos.map(pago => `
                                                <tr>
                                                    <td>${pago.id}</td>
                                                    <td>${pago.concepto}</td>
                                                    <td>${formatearMoneda(pago.monto)}</td>
                                                    <td>${formatearFecha(pago.fecha)}</td>
                                                    <td><span class="estado-${pago.estado}">${pago.estado}</span></td>
                                                    <td>
                                                        <button class="btn btn-sm btn-info" onclick="verDetallePagoTramite(${pago.id})">
                                                            <i class="bi bi-eye"></i>
                                                        </button>
                                                        ${pago.estado === 'completado' ? `
                                                            <button class="btn btn-sm btn-secondary" onclick="descargarComprobantePagoTramite(${pago.id})">
                                                                <i class="bi bi-download"></i>
                                                            </button>
                                                        ` : ''}
                                                    </td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            `}
                        </div>
                    </div>
                    </div>
                    
                    <div class="col-12 col-md-6">
                    <div class="card compact-card h-100">
                        <div class="card-header">
                            <h5>Historial</h5>
                        </div>
                        <div class="card-body">
                            ${!historial || historial.length === 0 ? `
                                <p>No hay registros en el historial de este trámite.</p>
                            ` : `
                                <div class="timeline">
                                    ${historial.map((registro, index) => `
                                        <div class="timeline-item">
                                            <div class="timeline-date">${formatearFecha(registro.fecha)}</div>
                                            <div class="timeline-content">
                                                <h6>${registro.accion}</h6>
                                                <p>${registro.descripcion}</p>
                                                <small>Por: ${registro.usuario?.nombre} ${registro.usuario?.apellido}</small>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            `}
                        </div>
                    </div>
                    </div>
                    </div>
                </div>
            </div>
        `;
        
    } catch (error) {
        console.error('Error al cargar detalle del trámite:', error);
        mostrarNotificacion('Error al cargar detalle: ' + error.message, 'danger');
    } finally {
        mostrarCargando(false);
    }
}

/**
 * Función para actualizar el estado de un trámite
 * @param {number} tramiteId - ID del trámite
 */
async function actualizarEstadoTramite(tramiteId) {
    try {
        mostrarCargando(true);
        
        const tramite = await fetchAPI(`/tramites/${tramiteId}`);
        
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="row mb-4">
                <div class="col-12">
                    <button class="btn btn-outline-secondary mb-3" onclick="verDetalleTramite(${tramiteId})">
                        <i class="bi bi-arrow-left"></i> Volver al trámite
                    </button>
                    <h2>Actualizar Estado del Trámite</h2>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-8 offset-md-2">
                    <div class="card">
                        <div class="card-body">
                            <form id="form-actualizar-estado">
                                <input type="hidden" id="tramite-id" value="${tramiteId}">
                                
                                <div class="mb-3">
                                    <label for="estado-actual" class="form-label">Estado Actual</label>
                                    <input type="text" class="form-control" id="estado-actual" value="${obtenerNombreEstadoTramite(tramite.estado)}" disabled>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="nuevo-estado" class="form-label">Nuevo Estado</label>
                                    <select class="form-select" id="nuevo-estado" required>
                                        <option value="">Seleccione un estado</option>
                                        <option value="pendiente" ${tramite.estado === 'pendiente' ? 'selected' : ''}>Pendiente</option>
                                        <option value="en_proceso" ${tramite.estado === 'en_proceso' ? 'selected' : ''}>En Proceso</option>
                                        <option value="en_revision" ${tramite.estado === 'en_revision' ? 'selected' : ''}>En Revisión</option>
                                        <option value="aprobado" ${tramite.estado === 'aprobado' ? 'selected' : ''}>Aprobado</option>
                                        <option value="rechazado" ${tramite.estado === 'rechazado' ? 'selected' : ''}>Rechazado</option>
                                        <option value="finalizado" ${tramite.estado === 'finalizado' ? 'selected' : ''}>Finalizado</option>
                                    </select>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="observaciones" class="form-label">Observaciones</label>
                                    <textarea class="form-control" id="observaciones" rows="4" required></textarea>
                                </div>
                                
                                <div class="d-grid gap-2">
                                    <button type="submit" class="btn btn-primary">
                                        <i class="bi bi-save"></i> Guardar Cambios
                                    </button>
                                    <button type="button" class="btn btn-outline-secondary" onclick="verDetalleTramite(${tramiteId})">
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Agregar evento para el formulario
        const formActualizarEstado = document.getElementById('form-actualizar-estado');
        formActualizarEstado.addEventListener('submit', guardarActualizacionEstado);
        
    } catch (error) {
        console.error('Error al cargar formulario de actualización de estado:', error);
        mostrarNotificacion('Error al cargar formulario: ' + error.message, 'danger');
    } finally {
        mostrarCargando(false);
    }
}

/**
 * Función para guardar la actualización de estado de un trámite
 * @param {Event} e - Evento del formulario
 */
async function guardarActualizacionEstado(e) {
    e.preventDefault();
    
    try {
        mostrarCargando(true);
        
        const tramiteId = document.getElementById('tramite-id').value;
        const nuevoEstado = document.getElementById('nuevo-estado').value;
        const observaciones = document.getElementById('observaciones').value;
        
        await fetchAPI(`/tramites/${tramiteId}/estado`, {
            method: 'PUT',
            body: JSON.stringify({
                estado: nuevoEstado,
                observaciones: observaciones
            })
        });
        
        mostrarNotificacion('Estado actualizado correctamente', 'success');
        verDetalleTramite(tramiteId);
        
    } catch (error) {
        console.error('Error al actualizar estado:', error);
        mostrarNotificacion('Error al actualizar estado: ' + error.message, 'danger');
    } finally {
        mostrarCargando(false);
    }
}

/**
 * Función para mostrar el formulario de subida de documento
 * @param {number} tramiteId - ID del trámite
 */
async function mostrarFormularioDocumento(tramiteId) {
    try {
        mostrarCargando(true);
        
        const tramite = await fetchAPI(`/tramites/${tramiteId}`);
        
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="row mb-4">
                <div class="col-12">
                    <button class="btn btn-outline-secondary mb-3" onclick="verDetalleTramite(${tramiteId})">
                        <i class="bi bi-arrow-left"></i> Volver al trámite
                    </button>
                    <h2>Agregar Documento</h2>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-8 offset-md-2">
                    <div class="card">
                        <div class="card-body">
                            <form id="form-documento">
                                <input type="hidden" id="tramite-id" value="${tramiteId}">
                                
                                <div class="mb-3">
                                    <label for="nombre" class="form-label">Nombre del Documento</label>
                                    <input type="text" class="form-control" id="nombre" required>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="tipo" class="form-label">Tipo de Documento</label>
                                    <select class="form-select" id="tipo" required>
                                        <option value="">Seleccione un tipo</option>
                                        <option value="identificacion">Identificación</option>
                                        <option value="comprobante_domicilio">Comprobante de Domicilio</option>
                                        <option value="solicitud">Solicitud</option>
                                        <option value="comprobante_pago">Comprobante de Pago</option>
                                        <option value="otro">Otro</option>
                                    </select>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="descripcion" class="form-label">Descripción</label>
                                    <textarea class="form-control" id="descripcion" rows="3"></textarea>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="archivo" class="form-label">Archivo</label>
                                    <input type="file" class="form-control" id="archivo" required>
                                    <div class="form-text">Formatos permitidos: PDF, JPG, PNG. Tamaño máximo: 5MB</div>
                                </div>
                                
                                <div class="d-grid gap-2">
                                    <button type="submit" class="btn btn-primary">
                                        <i class="bi bi-upload"></i> Subir Documento
                                    </button>
                                    <button type="button" class="btn btn-outline-secondary" onclick="verDetalleTramite(${tramiteId})">
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Agregar evento para el formulario
        const formDocumento = document.getElementById('form-documento');
        formDocumento.addEventListener('submit', subirDocumento);
        
    } catch (error) {
        console.error('Error al cargar formulario de documento:', error);
        mostrarNotificacion('Error al cargar formulario: ' + error.message, 'danger');
    } finally {
        mostrarCargando(false);
    }
}

/**
 * Función para subir un documento al trámite
 * @param {Event} e - Evento del formulario
 */
async function subirDocumento(e) {
    e.preventDefault();
    
    try {
        mostrarCargando(true);
        
        const tramiteId = document.getElementById('tramite-id').value;
        const nombre = document.getElementById('nombre').value;
        const tipo = document.getElementById('tipo').value;
        const descripcion = document.getElementById('descripcion').value;
        const archivo = document.getElementById('archivo').files[0];
        
        // Validar tamaño del archivo (5MB máximo)
        if (archivo.size > 5 * 1024 * 1024) {
            throw new Error('El archivo excede el tamaño máximo permitido (5MB)');
        }
        
        // Validar formato del archivo
        const formatosPermitidos = ['application/pdf', 'image/jpeg', 'image/png'];
        if (!formatosPermitidos.includes(archivo.type)) {
            throw new Error('Formato de archivo no permitido. Use PDF, JPG o PNG');
        }
        
        // Crear FormData para enviar el archivo
        const formData = new FormData();
        formData.append('nombre', nombre);
        formData.append('tipo', tipo);
        formData.append('descripcion', descripcion);
        formData.append('archivo', archivo);
        
        // Enviar al servidor
        await fetchAPI(`/tramites/${tramiteId}/documentos`, {
            method: 'POST',
            body: formData,
            headers: {}
        });
        
        mostrarNotificacion('Documento subido correctamente', 'success');
        verDetalleTramite(tramiteId);
        
    } catch (error) {
        console.error('Error al subir documento:', error);
        mostrarNotificacion('Error al subir documento: ' + error.message, 'danger');
    } finally {
        mostrarCargando(false);
    }
}
