/**
 * Módulo para la gestión de pagos municipales
 * Incluye funciones para listar, filtrar, crear y gestionar pagos
 */

/**
 * Función para cargar la lista de pagos
 * @param {Object} filtros - Filtros para la búsqueda
 */
async function cargarPagos(filtros = {}) {
    try {
        mostrarCargando(true);
        // Detectar rol actual para controlar visibilidad de acciones
        const usuarioActual = (typeof obtenerUsuario === 'function') ? obtenerUsuario() : null;
        const rolActual = (usuarioActual && (usuarioActual.role || usuarioActual.rol)) || null;
        const puedeCrearPago = rolActual === 'admin';
        
        // Construir query string para filtros
        const queryParams = new URLSearchParams();
        if (filtros.estado) queryParams.append('estado', filtros.estado);
        if (filtros.fechaDesde) queryParams.append('fechaDesde', filtros.fechaDesde);
        if (filtros.fechaHasta) queryParams.append('fechaHasta', filtros.fechaHasta);
        if (filtros.concepto) queryParams.append('search', filtros.concepto);
        if (filtros.ciudadanoId) queryParams.append('ciudadanoId', filtros.ciudadanoId);
        
        const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
        const respuesta = await fetchAPI(`/pagos${queryString}`);
        const pagos = Array.isArray(respuesta) ? respuesta : (respuesta.pagos || []);
        
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="row mb-3">
                <div class="col-12 text-center">
                    <h2 class="section-title">Gestión de Pagos</h2>
                </div>
            </div>
            <div class="row mb-2">
                <div class="col-12 text-end">
                    ${puedeCrearPago ? `
                    <button class="btn btn-primary btn-new-user" onclick="mostrarFormularioPago()">
                        <i class="bi bi-plus-circle"></i> Nuevo Pago
                    </button>
                    ` : ''}
                </div>
            </div>
            
            <div class="card no-hover mb-4">
                <div class="card-header">
                    <h5>Filtros</h5>
                </div>
                <div class="card-body">
                    <form id="form-filtros-pagos" class="row g-3">
                        <div class="col-md-3">
                            <label for="filtro-estado" class="form-label">Estado</label>
                            <select class="form-select" id="filtro-estado">
                                <option value="">Todos</option>
                                <option value="pendiente" ${filtros.estado === 'pendiente' ? 'selected' : ''}>Pendiente</option>
                                <option value="completado" ${filtros.estado === 'completado' ? 'selected' : ''}>Completado</option>
                                <option value="rechazado" ${filtros.estado === 'rechazado' ? 'selected' : ''}>Rechazado</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label for="filtro-fecha-desde" class="form-label">Fecha Desde</label>
                            <input type="date" class="form-control" id="filtro-fecha-desde" value="${filtros.fechaDesde || ''}">
                        </div>
                        <div class="col-md-3">
                            <label for="filtro-fecha-hasta" class="form-label">Fecha Hasta</label>
                            <input type="date" class="form-control" id="filtro-fecha-hasta" value="${filtros.fechaHasta || ''}">
                        </div>
                        <div class="col-md-3">
                            <label for="filtro-concepto" class="form-label">Concepto</label>
                            <input type="text" class="form-control" id="filtro-concepto" value="${filtros.concepto || ''}">
                        </div>
                        <div class="col-12 text-end">
                            <button type="submit" class="btn btn-outline-primary">
                                <i class="bi bi-search"></i> Buscar
                            </button>
                            <button type="button" class="btn btn-outline-secondary" onclick="limpiarFiltrosPagos()">
                                <i class="bi bi-x-circle"></i> Limpiar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            
            <div class="card no-hover">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5>Listado de Pagos</h5>
                    <button class="btn btn-sm btn-outline-secondary" onclick="exportarPagos()">
                        <i class="bi bi-download"></i> Exportar
                    </button>
                </div>
                <div class="card-body">
                    ${pagos.length === 0 ? `
                        <div class="alert alert-info">No se encontraron pagos con los filtros seleccionados.</div>
                    ` : `
                        <div class="table-responsive">
                            <table class="table table-striped table-hover">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Código</th>
                                        <th>Monto</th>
                                        <th>Fecha</th>
                                        <th>Ciudadano</th>
                                        <th>Estado</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${pagos.map(pago => `
                                        <tr>
                                            <td>${pago.id}</td>
                                            <td>${pago.codigo || ''}</td>
                                            <td>${formatearMoneda(pago.monto)}</td>
                                            <td>${formatearFecha(pago.fecha_pago)}</td>
                                            <td>${pago.ciudadano?.nombre} ${pago.ciudadano?.apellido}</td>
                                            <td><span class="estado-${pago.estado}">${pago.estado}</span></td>
                                            <td>
                                                <button class="btn btn-sm btn-info" onclick="verDetallePago(${pago.id})">
                                                    <i class="bi bi-eye"></i>
                                                </button>
                                                ${pago.estado === 'pendiente' ? `
                                                    <button class="btn btn-sm btn-success" onclick="procesarPago(${pago.id})">
                                                        <i class="bi bi-check-circle"></i>
                                                    </button>
                                                    <button class="btn btn-sm btn-danger" onclick="anularPago(${pago.id})">
                                                        <i class="bi bi-x-circle"></i>
                                                    </button>
                                                ` : ''}
                                                ${pago.estado === 'completado' ? `
                                                    <button class="btn btn-sm btn-secondary" onclick="descargarComprobantePago(${pago.id})">
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
        `;
        
        // Agregar evento para el formulario de filtros
        const formFiltros = document.getElementById('form-filtros-pagos');
        formFiltros.addEventListener('submit', (e) => {
            e.preventDefault();
            const nuevosFiltros = {
                estado: document.getElementById('filtro-estado').value,
                fechaDesde: document.getElementById('filtro-fecha-desde').value,
                fechaHasta: document.getElementById('filtro-fecha-hasta').value,
                concepto: document.getElementById('filtro-concepto').value
            };
            cargarPagos(nuevosFiltros);
        });
        
    } catch (error) {
        console.error('Error al cargar pagos:', error);
        mostrarNotificacion('Error al cargar pagos: ' + error.message, 'danger');
    } finally {
        mostrarCargando(false);
    }
}

/**
 * Función para limpiar los filtros de pagos
 */
function limpiarFiltrosPagos() {
    document.getElementById('filtro-estado').value = '';
    document.getElementById('filtro-fecha-desde').value = '';
    document.getElementById('filtro-fecha-hasta').value = '';
    document.getElementById('filtro-concepto').value = '';
    cargarPagos();
}

/**
 * Función para mostrar el formulario de creación de pago
 * @param {number} ciudadanoId - ID del ciudadano (opcional)
 * @param {number} tramiteId - ID del trámite (opcional)
 */
async function mostrarFormularioPago(ciudadanoId = null, tramiteId = null) {
    try {
        // Restringir creación de pagos a administradores
        const usuarioActual = (typeof obtenerUsuario === 'function') ? obtenerUsuario() : null;
        const rolActual = (usuarioActual && (usuarioActual.role || usuarioActual.rol)) || null;
        if (rolActual !== 'admin') {
            mostrarNotificacion('No tienes permisos para crear pagos.', 'warning');
            if (typeof cargarPagos === 'function') cargarPagos();
            return;
        }
        mostrarCargando(true);
        
        // Obtener lista de ciudadanos si no se especifica uno
        let ciudadanos = [];
        if (!ciudadanoId) {
            const response = await fetchAPI('/usuarios?rol=ciudadano');
            ciudadanos = response.usuarios || [];
        }
        
        // Obtener lista de trámites si no se especifica uno
        let tramites = [];
        if (!tramiteId && ciudadanoId) {
            const respTramites = await fetchAPI(`/tramites?ciudadanoId=${ciudadanoId}&requierePago=true&estadoPago=pendiente`);
            tramites = Array.isArray(respTramites) ? respTramites : (respTramites.tramites || []);
        }
        
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="row mb-3 align-items-center">
                <div class="col-4">
                    <button class="btn btn-outline-secondary" onclick="cargarPagos()">
                        <i class="bi bi-arrow-left"></i> Volver
                    </button>
                </div>
                <div class="col-4 text-center">
                    <h2 class="section-title">Nuevo Pago</h2>
                </div>
                <div class="col-4"></div>
            </div>
            
            <div class="row">
                <div class="col-md-8 offset-md-2">
                    <div class="card no-hover">
                        <div class="card-body">
                            <form id="form-pago">
                                ${!ciudadanoId ? `
                                    <div class="mb-3">
                                        <label for="ciudadano" class="form-label">Ciudadano</label>
                                        <select class="form-select" id="ciudadano" required>
                                            <option value="">Seleccione un ciudadano</option>
                                            ${ciudadanos.map(c => `<option value="${c.id}">${c.nombre} ${c.apellido} - ${c.documento}</option>`).join('')}
                                        </select>
                                    </div>
                                ` : `<input type="hidden" id="ciudadano" value="${ciudadanoId}">`}
                                
                                ${!tramiteId ? `
                                    <div class="mb-3" id="contenedor-tramites" ${!ciudadanoId ? 'style="display:none;"' : ''}>
                                        <label for="tramite" class="form-label">Trámite Asociado</label>
                                        <select class="form-select" id="tramite">
                                            <option value="">Seleccione un trámite (opcional)</option>
                                            ${tramites.map(t => `<option value="${t.id}">${(t.tipo?.nombre || t.tipo || 'Trámite')} - ${t.codigo}</option>`).join('')}
                                        </select>
                                    </div>
                                ` : `<input type="hidden" id="tramite" value="${tramiteId}">`}
                                
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <label for="codigo" class="form-label">Código *</label>
                                        <input type="text" class="form-control" id="codigo" required>
                                    </div>
                                    <div class="col-md-6">
                                        <label for="monto" class="form-label">Monto *</label>
                                        <div class="input-group">
                                            <span class="input-group-text">$</span>
                                            <input type="number" class="form-control" id="monto" step="0.01" min="0.01" required>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <label for="fecha-pago" class="form-label">Fecha de Pago *</label>
                                        <input type="datetime-local" class="form-control" id="fecha-pago" required>
                                    </div>
                                    <div class="col-md-6">
                                        <label for="metodo-pago" class="form-label">Método de Pago *</label>
                                        <select class="form-select" id="metodo-pago" required>
                                            <option value="">Seleccione un método</option>
                                            <option value="efectivo">Efectivo</option>
                                            <option value="tarjeta_credito">Tarjeta de Crédito</option>
                                            <option value="tarjeta_debito">Tarjeta de Débito</option>
                                            <option value="transferencia">Transferencia</option>
                                            <option value="cheque">Cheque</option>
                                            <option value="otro">Otro</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <label for="estado" class="form-label">Estado *</label>
                                        <select class="form-select" id="estado" required>
                                            <option value="pendiente">Pendiente</option>
                                            <option value="procesando">Procesando</option>
                                            <option value="completado">Completado</option>
                                            <option value="rechazado">Rechazado</option>
                                            <option value="reembolsado">Reembolsado</option>
                                        </select>
                                    </div>
                                    <div class="col-md-6">
                                        <label for="referencia-externa" class="form-label">Referencia Externa</label>
                                        <input type="text" class="form-control" id="referencia-externa" maxlength="100">
                                    </div>
                                </div>
                                
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <label for="comprobante-url" class="form-label">URL del Comprobante</label>
                                        <input type="url" class="form-control" id="comprobante-url">
                                    </div>
                                    <div class="col-md-6">
                                        <label for="funcionario-id" class="form-label">Funcionario</label>
                                        <select class="form-select" id="funcionario-id">
                                            <option value="">Seleccione un funcionario</option>
                                            <!-- Las opciones se cargarán dinámicamente -->
                                        </select>
                                    </div>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="notas" class="form-label">Notas</label>
                                    <textarea class="form-control" id="notas" rows="3"></textarea>
                                </div>
                                
                                <div class="d-flex justify-content-center gap-2">
                                    <button type="submit" class="btn btn-primary btn-new-user">
                                        <i class="bi bi-save"></i> Guardar Pago
                                    </button>
                                    <button type="button" class="btn btn-outline-secondary" onclick="cargarPagos()">
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
        const formPago = document.getElementById('form-pago');
        formPago.addEventListener('submit', guardarPago);
        
        // Si no hay ciudadano preseleccionado, agregar evento para cargar trámites
        if (!ciudadanoId) {
            const selectCiudadano = document.getElementById('ciudadano');
            selectCiudadano.addEventListener('change', async () => {
                const ciudadanoSeleccionado = selectCiudadano.value;
                const contenedorTramites = document.getElementById('contenedor-tramites');
                const selectTramite = document.getElementById('tramite');
                
                if (ciudadanoSeleccionado) {
                    mostrarCargando(true);
                    try {
                        const respTramitesCiudadano = await fetchAPI(`/tramites?ciudadanoId=${ciudadanoSeleccionado}&requierePago=true&estadoPago=pendiente`);
                        const tramitesCiudadano = Array.isArray(respTramitesCiudadano) ? respTramitesCiudadano : (respTramitesCiudadano.tramites || []);
                        
                        // Limpiar y actualizar opciones
                        selectTramite.innerHTML = '<option value="">Seleccione un trámite (opcional)</option>';
                        tramitesCiudadano.forEach(t => {
                            const option = document.createElement('option');
                            option.value = t.id;
                            option.textContent = `${t.tipo.nombre} - ${t.codigo}`;
                            selectTramite.appendChild(option);
                        });
                        
                        contenedorTramites.style.display = 'block';
                    } catch (error) {
                        console.error('Error al cargar trámites:', error);
                        mostrarNotificacion('Error al cargar trámites: ' + error.message, 'danger');
                    } finally {
                        mostrarCargando(false);
                    }
                } else {
                    contenedorTramites.style.display = 'none';
                }
            });
        }
        
    } catch (error) {
        console.error('Error al cargar formulario de pago:', error);
        mostrarNotificacion('Error al cargar formulario: ' + error.message, 'danger');
    } finally {
        mostrarCargando(false);
    }
}

/**
 * Función para guardar un nuevo pago
 * @param {Event} e - Evento del formulario
 */
async function guardarPago(e) {
    e.preventDefault();
    
    try {
        mostrarCargando(true);
        
        const ciudadanoId = document.getElementById('ciudadano').value;
        const tramiteId = document.getElementById('tramite')?.value || null;
        const codigo = document.getElementById('codigo').value;
        const monto = document.getElementById('monto').value;
        const fechaPago = document.getElementById('fecha-pago').value;
        const metodoPago = document.getElementById('metodo-pago').value;
        const estado = document.getElementById('estado').value;
        const referenciaExterna = document.getElementById('referencia-externa').value;
        const comprobanteUrl = document.getElementById('comprobante-url').value;
        const funcionarioId = document.getElementById('funcionario-id').value;
        const notas = document.getElementById('notas').value;
        
        const nuevoPago = {
            codigo,
            monto: parseFloat(monto),
            fecha_pago: fechaPago,
            metodo_pago: metodoPago,
            estado,
            referencia_externa: referenciaExterna || null,
            comprobante_url: comprobanteUrl || null,
            notas: notas || null,
            tramite_id: tramiteId ? parseInt(tramiteId) : null,
            ciudadano_id: parseInt(ciudadanoId),
            funcionario_id: funcionarioId ? parseInt(funcionarioId) : null
        };
        
        await fetchAPI('/pagos', {
            method: 'POST',
            body: JSON.stringify(nuevoPago)
        });
        
        mostrarNotificacion('Pago creado correctamente', 'success');
        cargarPagos();
        
    } catch (error) {
        console.error('Error al guardar pago:', error);
        mostrarNotificacion('Error al guardar pago: ' + error.message, 'danger');
    } finally {
        mostrarCargando(false);
    }
}

/**
 * Función para ver el detalle de un pago
 * @param {number} pagoId - ID del pago
 */
async function verDetallePago(pagoId) {
    try {
        mostrarCargando(true);
        
        const pago = await fetchAPI(`/pagos/${pagoId}`);
        
        // Normalizar campos según el backend
        const codigo = pago.codigo || 'N/A';
        const estado = pago.estado || 'N/A';
        const monto = typeof formatearMoneda === 'function' ? formatearMoneda(pago.monto) : (pago.monto ?? 'N/A');
        const fechaPago = pago.fecha_pago ? formatearFecha(pago.fecha_pago) : '—';
        const metodoPago = pago.metodo_pago || '—';
        const referencia = pago.referencia_externa || '—';
        const notas = pago.notas || 'Sin observaciones';
        const estadoClase = estado === 'completado' ? 'success' : (estado === 'pendiente' ? 'warning' : (estado === 'rechazado' ? 'danger' : 'secondary'));
        const tieneComprobante = estado === 'completado';

        const tramite = pago.Tramite || null;
        const ciudadano = pago.ciudadano || null;

        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="row mb-2">
                <div class="col-12 d-flex align-items-center justify-content-between flex-wrap gap-2">
                    <div>
                        <button class="btn btn-sm btn-outline-secondary" onclick="cargarPagos()">
                            <i class="bi bi-arrow-left"></i> Volver a pagos
                        </button>
                    </div>
                    <h4 class="m-0">Detalle del Pago</h4>
                    ${tieneComprobante ? `
                    <button class="btn btn-sm btn-secondary" onclick="descargarComprobantePago(${pago.id})">
                        <i class="bi bi-download"></i> Comprobante
                    </button>` : ''}
                </div>
            </div>

            <div class="row">
                <div class="col-12">
                    <div class="card compact-card detalle-pago">
                        <div class="card-body py-2">
                            <!-- Resumen compacto -->
                            <div class="row row-cols-2 row-cols-lg-6 g-2 mb-2">
                                <div class="col">
                                    <div class="small text-muted">Código</div>
                                    <div class="small fw-semibold text-break">${codigo}</div>
                                </div>
                                <div class="col">
                                    <div class="small text-muted">Estado</div>
                                    <span class="badge rounded-pill p-1 small bg-${estadoClase} text-uppercase">${estado}</span>
                                </div>
                                <div class="col">
                                    <div class="small text-muted">Monto</div>
                                    <div class="small fw-semibold">${monto}</div>
                                </div>
                                <div class="col">
                                    <div class="small text-muted">Fecha pago</div>
                                    <div class="small fw-semibold">${fechaPago}</div>
                                </div>
                                <div class="col">
                                    <div class="small text-muted">Método</div>
                                    <div class="small fw-semibold">${metodoPago}</div>
                                </div>
                                <div class="col">
                                    <div class="small text-muted">Referencia</div>
                                    <div class="small fw-semibold text-break">${referencia}</div>
                                </div>
                            </div>

                            <!-- Información del ciudadano -->
                            ${ciudadano ? `
                            <hr class="my-2" />
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <h6 class="m-0">Ciudadano</h6>
                                ${ciudadano.id ? `<button class="btn btn-sm btn-info" onclick="verPerfilUsuario(${ciudadano.id})"><i class="bi bi-person"></i> Ver Perfil</button>` : ''}
                            </div>
                            <div class="row g-2">
                                <div class="col-12 col-md-6"><div class="small text-muted">Nombre</div><div class="small">${ciudadano.nombre || ''} ${ciudadano.apellido || ''}</div></div>
                                <div class="col-12 col-md-6"><div class="small text-muted">Email</div><div class="small">${ciudadano.email || '—'}</div></div>
                                <div class="col-12 col-md-6"><div class="small text-muted">Teléfono</div><div class="small">${ciudadano.telefono || '—'}</div></div>
                                <div class="col-12 col-md-6"><div class="small text-muted">RUT</div><div class="small font-monospace text-break">${ciudadano.rut || '—'}</div></div>
                            </div>` : ''}

                            <!-- Información del trámite -->
                            ${tramite ? `
                            <hr class="my-2" />
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <h6 class="m-0">Trámite asociado</h6>
                                <button class="btn btn-sm btn-info" onclick="verDetalleTramite(${tramite.id})"><i class="bi bi-eye"></i> Ver Trámite</button>
                            </div>
                            <div class="row g-2">
                                <div class="col-12 col-md-4"><div class="small text-muted">Código</div><div class="small">${tramite.codigo || '—'}</div></div>
                                <div class="col-12 col-md-4"><div class="small text-muted">Título</div><div class="small">${tramite.titulo || '—'}</div></div>
                                <div class="col-12 col-md-4"><div class="small text-muted">Tipo</div><div class="small text-uppercase">${tramite.tipo || '—'}</div></div>
                                <div class="col-12 col-md-4"><div class="small text-muted">Estado</div><div class="small text-uppercase">${tramite.estado || '—'}</div></div>
                                <div class="col-12 col-md-4"><div class="small text-muted">Prioridad</div><div class="small text-uppercase">${tramite.prioridad || '—'}</div></div>
                                <div class="col-12 col-md-4"><div class="small text-muted">Requiere pago</div><div class="small">${tramite.requiere_pago ? 'Sí' : 'No'}</div></div>
                                <div class="col-12 col-md-4"><div class="small text-muted">Monto</div><div class="small">${typeof formatearMoneda === 'function' ? formatearMoneda(tramite.monto) : (tramite.monto ?? '—')}</div></div>
                                <div class="col-12 col-md-4"><div class="small text-muted">Solicitud</div><div class="small">${tramite.fecha_solicitud ? formatearFecha(tramite.fecha_solicitud) : '—'}</div></div>
                                <div class="col-12 col-md-4"><div class="small text-muted">Actualización</div><div class="small">${tramite.fecha_actualizacion ? formatearFecha(tramite.fecha_actualizacion) : '—'}</div></div>
                            </div>` : ''}

                            <!-- Observaciones -->
                            ${notas ? `
                            <hr class="my-2" />
                            <h6>Observaciones</h6>
                            <p class="mb-0 small">${notas}</p>` : ''}

                            <!-- Acciones -->
                            <div class="d-flex gap-2 mt-2">
                                ${estado === 'pendiente' ? `<button class="btn btn-sm btn-success" onclick="procesarPago(${pago.id})"><i class="bi bi-check-circle"></i> Procesar</button>` : ''}
                                ${estado === 'pendiente' ? `<button class="btn btn-sm btn-outline-danger" onclick="anularPago(${pago.id})"><i class="bi bi-x-circle"></i> Anular</button>` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
    } catch (error) {
        console.error('Error al cargar detalle del pago:', error);
        mostrarNotificacion('Error al cargar detalle: ' + error.message, 'danger');
    } finally {
        mostrarCargando(false);
    }
}

/**
 * Función para procesar un pago
 * @param {number} pagoId - ID del pago
 */
async function procesarPago(pagoId) {
    try {
        mostrarCargando(true);
        
        const pago = await fetchAPI(`/pagos/${pagoId}`);
        
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="row mb-4">
                <div class="col-12">
                    <button class="btn btn-outline-secondary mb-3" onclick="verDetallePago(${pagoId})">
                        <i class="bi bi-arrow-left"></i> Volver al pago
                    </button>
                    <h2>Procesar Pago</h2>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-8 offset-md-2">
                    <div class="card">
                        <div class="card-body">
                            <form id="form-procesar-pago">
                                <input type="hidden" id="pago-id" value="${pagoId}">
                                
                                <div class="alert alert-info">
                                    <p><strong>Concepto:</strong> ${pago.concepto}</p>
                                    <p><strong>Monto a pagar:</strong> ${formatearMoneda(pago.monto)}</p>
                                    <p><strong>Ciudadano:</strong> ${pago.ciudadano?.nombre} ${pago.ciudadano?.apellido}</p>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="metodo-pago" class="form-label">Método de Pago</label>
                                    <select class="form-select" id="metodo-pago" required>
                                        <option value="">Seleccione un método</option>
                                        <option value="efectivo">Efectivo</option>
                                        <option value="tarjeta_credito">Tarjeta de Crédito</option>
                                        <option value="tarjeta_debito">Tarjeta de Débito</option>
                                        <option value="transferencia">Transferencia Bancaria</option>
                                    </select>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="referencia" class="form-label">Número de Referencia</label>
                                    <input type="text" class="form-control" id="referencia">
                                    <div class="form-text">Número de transacción, recibo o referencia del pago.</div>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="observaciones" class="form-label">Observaciones</label>
                                    <textarea class="form-control" id="observaciones" rows="3"></textarea>
                                </div>
                                
                                <div class="d-grid gap-2">
                                    <button type="submit" class="btn btn-success">
                                        <i class="bi bi-check-circle"></i> Confirmar Pago
                                    </button>
                                    <button type="button" class="btn btn-outline-secondary" onclick="verDetallePago(${pagoId})">
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
        const formProcesarPago = document.getElementById('form-procesar-pago');
        formProcesarPago.addEventListener('submit', confirmarPago);
        
    } catch (error) {
        console.error('Error al cargar formulario de procesamiento:', error);
        mostrarNotificacion('Error al cargar formulario: ' + error.message, 'danger');
    } finally {
        mostrarCargando(false);
    }
}

/**
 * Función para confirmar un pago
 * @param {Event} e - Evento del formulario
 */
async function confirmarPago(e) {
    e.preventDefault();
    
    try {
        mostrarCargando(true);
        
        const pagoId = document.getElementById('pago-id').value;
        const metodoPago = document.getElementById('metodo-pago').value;
        const referencia = document.getElementById('referencia').value;
        const observaciones = document.getElementById('observaciones').value;
        
        await fetchAPI(`/pagos/${pagoId}/procesar`, {
            method: 'PUT',
            body: JSON.stringify({
                metodoPago,
                referencia,
                observaciones
            })
        });
        
        mostrarNotificacion('Pago procesado correctamente', 'success');
        verDetallePago(pagoId);
        
    } catch (error) {
        console.error('Error al procesar pago:', error);
        mostrarNotificacion('Error al procesar pago: ' + error.message, 'danger');
    } finally {
        mostrarCargando(false);
    }
}

/**
 * Función para anular un pago
 * @param {number} pagoId - ID del pago
 */
async function anularPago(pagoId) {
    if (confirm('¿Está seguro de que desea anular este pago? Esta acción no se puede deshacer.')) {
        try {
            mostrarCargando(true);
            
            await fetchAPI(`/pagos/${pagoId}/anular`, {
                method: 'PUT'
            });
            
            mostrarNotificacion('Pago anulado correctamente', 'success');
            verDetallePago(pagoId);
            
        } catch (error) {
            console.error('Error al anular pago:', error);
            mostrarNotificacion('Error al anular pago: ' + error.message, 'danger');
        } finally {
            mostrarCargando(false);
        }
    }
}

/**
 * Función para descargar el comprobante de un pago
 * @param {number} pagoId - ID del pago
 */
async function descargarComprobantePago(pagoId) {
    try {
        mostrarCargando(true);
        
        const response = await fetchAPI(`/pagos/${pagoId}/comprobante`, {
            responseType: 'blob'
        });
        
        // Crear URL para el blob
        const url = window.URL.createObjectURL(new Blob([response]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `comprobante_pago_${pagoId}.pdf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
    } catch (error) {
        console.error('Error al descargar comprobante:', error);
        mostrarNotificacion('Error al descargar comprobante: ' + error.message, 'danger');
    } finally {
        mostrarCargando(false);
    }
}

// Nueva función: descargar constancia/boleta de trámite (gratuito o pagado)
async function descargarConstanciaTramite(tramiteId) {
    try {
        mostrarCargando(true);
        const response = await fetchAPI(`/tramites/${tramiteId}/constancia`, {
            responseType: 'blob',
            headers: { Accept: 'application/pdf' }
        });
        const url = window.URL.createObjectURL(new Blob([response]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `constancia_tramite_${tramiteId}.pdf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        try {
            const locales = typeof obtenerTramites === 'function' ? obtenerTramites() : [];
            const tramiteLocal = locales.find(t => String(t.id) === String(tramiteId));
            if (!tramiteLocal) {
                throw error;
            }
            if (tramiteLocal.requiere_pago && !tramiteLocal.pago_completado) {
                mostrarNotificacion('Este trámite aún no tiene el pago completado.', 'warning');
                return;
            }
            const sincronizado = await sincronizarTramiteLocal(tramiteLocal);
            if (sincronizado && sincronizado.id) {
                actualizarTramiteLocal(tramiteLocal.id, sincronizado);
                try {
                    const resp2 = await fetchAPI(`/tramites/${sincronizado.id}/constancia`, { responseType: 'blob', headers: { Accept: 'application/pdf' } });
                    const url2 = window.URL.createObjectURL(new Blob([resp2]));
                    const link2 = document.createElement('a');
                    link2.href = url2;
                    link2.setAttribute('download', `constancia_tramite_${sincronizado.id}.pdf`);
                    document.body.appendChild(link2);
                    link2.click();
                    document.body.removeChild(link2);
                    return;
                } catch (_) { /* fallback abajo */ }
            }
            // Generar PDF descargable en backend con datos locales
            const payload = await construirPayloadConstanciaLocal(tramiteLocal);
            try {
                const blob = await fetchAPI('/tramites/constancia/local', { method: 'POST', body: payload, responseType: 'blob', headers: { Accept: 'application/pdf' } });
                const url3 = window.URL.createObjectURL(blob);
                const link3 = document.createElement('a');
                link3.href = url3;
                link3.setAttribute('download', `constancia_tramite_${tramiteLocal.codigo || tramiteLocal.id}.pdf`);
                document.body.appendChild(link3);
                link3.click();
                document.body.removeChild(link3);
                return;
            } catch (_) {
                mostrarNotificacion('No se pudo generar un PDF descargable de la constancia.', 'danger');
                return;
            }
        } catch (e2) {
            mostrarNotificacion('Error al descargar constancia: ' + (error && error.message ? error.message : 'Intenta nuevamente'), 'danger');
        }
    } finally {
        mostrarCargando(false);
    }
}

async function generarConstanciaLocal(tramite) {
    let usuario = typeof obtenerUsuario === 'function' ? obtenerUsuario() : null;
    try {
        const perfil = await fetchAPI('/usuarios/perfil', { suppressErrorLog: true });
        if (perfil) {
            usuario = {
                ...usuario,
                ...perfil,
                municipalidad_id: perfil.municipalidad_id ?? usuario?.municipalidad_id,
                municipalidad_nombre: perfil.municipalidad_nombre || perfil.Municipalidad?.nombre || usuario?.municipalidad_nombre
            };
        }
    } catch (_) {}
    const fechaEmision = new Date();
    const codigo = tramite.codigo || `T-${tramite.id}`;
    const estado = String(tramite.estado || '').toUpperCase();
    const titulo = tramite.titulo || 'Trámite';
    const tipo = typeof obtenerNombreTipoTramite === 'function' ? obtenerNombreTipoTramite(tramite.tipo) : (tramite.tipo || '—');
    let nombreDepartamento = (tramite.Departamento && tramite.Departamento.nombre) || (tramite.departamento && tramite.departamento.nombre) || '';
    if (!nombreDepartamento && tramite.departamento_id) {
        try {
            const dep = await fetchAPI(`/departamentos/${tramite.departamento_id}`, { suppressErrorLog: true });
            nombreDepartamento = dep?.nombre || dep?.nombre_departamento || '';
        } catch (_) {}
    }
    const nombreMunicipalidad = usuario?.municipalidad_nombre || '';
    const requierePago = !!tramite.requiere_pago;
    const monto = parseFloat(tramite.monto || 0);
    const pagoCompletado = !!tramite.pago_completado;
    const ciudadanoNombre = usuario ? `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim() : '';
    const ciudadanoRut = (usuario && usuario.rut) ? usuario.rut : (tramite.ciudadano && tramite.ciudadano.rut ? tramite.ciudadano.rut : '');
    const ciudadanoEmail = (usuario && usuario.email) ? usuario.email : (tramite.ciudadano && tramite.ciudadano.email ? tramite.ciudadano.email : '');
    const ciudadanoDireccion = (usuario && usuario.direccion) ? usuario.direccion : (tramite.ciudadano && tramite.ciudadano.direccion ? tramite.ciudadano.direccion : '');
    const fechaSol = tramite.fecha_solicitud ? (typeof formatearFecha === 'function' ? formatearFecha(tramite.fecha_solicitud) : new Date(tramite.fecha_solicitud).toLocaleDateString('es-CL')) : '';
    const fechaAct = tramite.fecha_actualizacion ? (typeof formatearFecha === 'function' ? formatearFecha(tramite.fecha_actualizacion) : new Date(tramite.fecha_actualizacion).toLocaleDateString('es-CL')) : fechaSol;
    const montoFmt = typeof formatearMoneda === 'function' ? formatearMoneda(monto) : (monto ? `$${monto.toLocaleString('es-CL')}` : 'Gratis');
    const hoyFmt = fechaEmision.toLocaleDateString('es-CL');
    const estilos = `
      <style>
        body { font-family: Arial, sans-serif; color: #111; }
        .doc { max-width: 850px; margin: 0 auto; padding: 24px; }
        .hdr { text-align: center; margin-bottom: 12px; }
        .title { font-size: 20px; font-weight: 700; }
        .subtitle { font-size: 15px; font-weight: 600; }
        .section { margin-top: 12px; }
        .label { color: #666; font-size: 12px; }
        .value { font-size: 13px; font-weight: 600; }
        hr { border: 0; border-top: 1px solid #ddd; margin: 10px 0; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; }
        .foot { margin-top: 24px; font-size: 11px; color: #444; }
        @page { size: A4; margin: 20mm; }
      </style>
    `;
    const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Constancia de Trámite ${codigo}</title>
          ${estilos}
        </head>
        <body>
          <div class="doc">
            <div class="hdr">
              <div class="title">${nombreMunicipalidad || 'MUNICIPALIDAD'}</div>
              <div class="subtitle">CONSTANCIA / BOLETA DE TRÁMITE</div>
            </div>
            <div class="section grid">
              <div><div class="label">Código de Trámite</div><div class="value">${codigo}</div></div>
              <div><div class="label">Fecha de emisión</div><div class="value">${hoyFmt}</div></div>
              <div><div class="label">Estado</div><div class="value">${estado || '—'}</div></div>
              <div><div class="label">Solicitud</div><div class="value">${fechaSol || '—'}</div></div>
              <div><div class="label">Actualización</div><div class="value">${fechaAct || '—'}</div></div>
            </div>
            <hr />
            <div class="section">
              <div class="subtitle">Detalle del Trámite</div>
              <div class="grid">
                <div><div class="label">Título</div><div class="value">${titulo}</div></div>
                <div><div class="label">Tipo</div><div class="value">${tipo}</div></div>
                <div><div class="label">Departamento</div><div class="value">${nombreDepartamento || '—'}</div></div>
                <div><div class="label">Municipalidad</div><div class="value">${nombreMunicipalidad || '—'}</div></div>
              </div>
            </div>
            <hr />
            <div class="section">
              <div class="subtitle">Datos del Ciudadano</div>
              <div class="grid">
                <div><div class="label">Nombre</div><div class="value">${ciudadanoNombre || '—'}</div></div>
                <div><div class="label">RUT</div><div class="value">${ciudadanoRut || '—'}</div></div>
                <div><div class="label">Dirección</div><div class="value">${ciudadanoDireccion || '—'}</div></div>
                <div><div class="label">Email</div><div class="value">${ciudadanoEmail || '—'}</div></div>
              </div>
            </div>
            <hr />
            <div class="section">
              <div class="subtitle">Información de Pago</div>
              <div class="grid">
                <div><div class="label">Requiere pago</div><div class="value">${requierePago ? 'Sí' : 'No'}</div></div>
                <div><div class="label">Monto</div><div class="value">${montoFmt}</div></div>
                <div><div class="label">Pago completado</div><div class="value">${pagoCompletado ? 'Sí' : 'No'}</div></div>
              </div>
            </div>
            <div class="foot">
              Emitido y autorizado por la municipalidad correspondiente. Este documento es una constancia oficial del trámite realizado por el ciudadano.
            </div>
          </div>
          <script>window.print && window.print();</script>
        </body>
      </html>
    `;
    return html;
}

function imprimirHTML(html) {
    const w = window.open('', 'print', 'height=700,width=900');
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => { try { w.close(); } catch (_) {} }, 1500);
}

async function sincronizarTramiteLocal(tramiteLocal) {
    try {
        const usuario = typeof obtenerUsuario === 'function' ? obtenerUsuario() : null;
        const body = {
            titulo: tramiteLocal.titulo || 'Trámite',
            descripcion: tramiteLocal.descripcion || '—',
            tipo: tramiteLocal.tipo || 'solicitud',
            prioridad: tramiteLocal.prioridad || 'media',
            requiere_pago: !!tramiteLocal.requiere_pago,
            monto: Number(tramiteLocal.monto || 0),
            departamento_id: tramiteLocal.departamento_id,
            municipalidad_id: tramiteLocal.municipalidad_id || (usuario && usuario.municipalidad_id) || undefined
        };
        const res = await fetchAPI('/tramites', { method: 'POST', body });
        const creado = res?.tramite || res;
        return creado || null;
    } catch (_) {
        return null;
    }
}

function actualizarTramiteLocal(oldId, backendTramite) {
    try {
        const arr = typeof obtenerTramites === 'function' ? obtenerTramites() : [];
        const idx = arr.findIndex(t => String(t.id) === String(oldId));
        if (idx === -1) return;
        const prev = arr[idx];
        const next = {
            ...prev,
            id: backendTramite.id,
            codigo: backendTramite.codigo,
            requiere_pago: !!backendTramite.requiere_pago,
            monto: Number(backendTramite.monto || prev.monto || 0),
            fecha_solicitud: backendTramite.fecha_solicitud || prev.fecha_solicitud,
            municipalidad_id: backendTramite.municipalidad_id || prev.municipalidad_id,
            departamento_id: backendTramite.departamento_id || prev.departamento_id
        };
        arr[idx] = next;
        try { localStorage.setItem('tramites', JSON.stringify(arr)); } catch (_) {}
    } catch (_) {}
}

/**
 * Función para exportar la lista de pagos
 */
async function exportarPagos() {
    try {
        mostrarCargando(true);
        
        // Obtener filtros actuales
        const estado = document.getElementById('filtro-estado')?.value || '';
        const fechaDesde = document.getElementById('filtro-fecha-desde')?.value || '';
        const fechaHasta = document.getElementById('filtro-fecha-hasta')?.value || '';
        const concepto = document.getElementById('filtro-concepto')?.value || '';
        
        // Construir query string para filtros
        const queryParams = new URLSearchParams();
        if (estado) queryParams.append('estado', estado);
        if (fechaDesde) queryParams.append('fechaDesde', fechaDesde);
        if (fechaHasta) queryParams.append('fechaHasta', fechaHasta);
        if (concepto) queryParams.append('concepto', concepto);
        queryParams.append('formato', 'excel');
        
        const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
        const response = await fetchAPI(`/pagos/exportar${queryString}`, {
            responseType: 'blob'
        });
        
        // Crear URL para el blob
        const url = window.URL.createObjectURL(new Blob([response]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `pagos_${new Date().toISOString().split('T')[0]}.xlsx`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
    } catch (error) {
        console.error('Error al exportar pagos:', error);
        mostrarNotificacion('Error al exportar pagos: ' + error.message, 'danger');
    } finally {
        mostrarCargando(false);
    }
}

// Inicializar módulo cuando se cargue el contenido
document.addEventListener('DOMContentLoaded', () => {
    // Si estamos en la página de pagos, cargar la lista
    if (window.location.hash === '#pagos') {
        cargarPagos();
    }
});
async function construirPayloadConstanciaLocal(tramite) {
    let usuario = typeof obtenerUsuario === 'function' ? obtenerUsuario() : null;
    try {
        const perfil = await fetchAPI('/usuarios/perfil', { suppressErrorLog: true });
        if (perfil) {
            usuario = { ...usuario, ...perfil, municipalidad_nombre: perfil.municipalidad_nombre || perfil.Municipalidad?.nombre || usuario?.municipalidad_nombre };
        }
    } catch (_) {}
    let departamentoNombre = (tramite.Departamento && tramite.Departamento.nombre) || (tramite.departamento && tramite.departamento.nombre) || '';
    if (!departamentoNombre && tramite.departamento_id) {
        try {
            const dep = await fetchAPI(`/departamentos/${tramite.departamento_id}`, { suppressErrorLog: true });
            departamentoNombre = dep?.nombre || dep?.nombre_departamento || '';
        } catch (_) {}
    }
    return {
        codigo: tramite.codigo || `T-${tramite.id}`,
        titulo: tramite.titulo || 'Trámite',
        tipo: typeof obtenerNombreTipoTramite === 'function' ? obtenerNombreTipoTramite(tramite.tipo) : (tramite.tipo || '—'),
        estado: tramite.estado || 'pendiente',
        fecha_solicitud: tramite.fecha_solicitud || null,
        fecha_actualizacion: tramite.fecha_actualizacion || null,
        departamento_nombre: departamentoNombre,
        municipalidad_nombre: usuario?.municipalidad_nombre || '',
        ciudadano_nombre: usuario ? `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim() : (tramite.ciudadano && `${tramite.ciudadano.nombre || ''} ${tramite.ciudadano.apellido || ''}`.trim()) || '',
        ciudadano_rut: (usuario && usuario.rut) ? usuario.rut : (tramite.ciudadano && tramite.ciudadano.rut) || '',
        ciudadano_direccion: (usuario && usuario.direccion) ? usuario.direccion : (tramite.ciudadano && tramite.ciudadano.direccion) || '',
        ciudadano_email: (usuario && usuario.email) ? usuario.email : (tramite.ciudadano && tramite.ciudadano.email) || '',
        requiere_pago: !!tramite.requiere_pago,
        monto: Number(tramite.monto || 0),
        pago_completado: !!tramite.pago_completado
    };
}
