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
        
        // Construir query string para filtros
        const queryParams = new URLSearchParams();
        if (filtros.estado) queryParams.append('estado', filtros.estado);
        if (filtros.fechaDesde) queryParams.append('fechaDesde', filtros.fechaDesde);
        if (filtros.fechaHasta) queryParams.append('fechaHasta', filtros.fechaHasta);
        if (filtros.concepto) queryParams.append('concepto', filtros.concepto);
        if (filtros.ciudadanoId) queryParams.append('ciudadanoId', filtros.ciudadanoId);
        
        const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
        const respuesta = await fetchAPI(`/pagos${queryString}`);
        const pagos = Array.isArray(respuesta) ? respuesta : (respuesta.pagos || []);
        
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="row mb-4">
                <div class="col-md-8">
                    <h2>Gestión de Pagos</h2>
                </div>
                <div class="col-md-4 text-end">
                    <button class="btn btn-primary" onclick="mostrarFormularioPago()">
                        <i class="bi bi-plus-circle"></i> Nuevo Pago
                    </button>
                </div>
            </div>
            
            <div class="card mb-4">
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
                            <button type="submit" class="btn btn-primary">
                                <i class="bi bi-search"></i> Buscar
                            </button>
                            <button type="button" class="btn btn-outline-secondary" onclick="limpiarFiltrosPagos()">
                                <i class="bi bi-x-circle"></i> Limpiar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            
            <div class="card">
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
                                        <th>Concepto</th>
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
                                            <td>${pago.concepto || pago.codigo || ''}</td>
                                            <td>${formatearMoneda(pago.monto)}</td>
                                            <td>${formatearFecha(pago.fecha || pago.fecha_pago)}</td>
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
            <div class="row mb-4">
                <div class="col-12">
                    <button class="btn btn-outline-secondary mb-3" onclick="cargarPagos()">
                        <i class="bi bi-arrow-left"></i> Volver a pagos
                    </button>
                    <h2>Nuevo Pago</h2>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-8 offset-md-2">
                    <div class="card">
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
                                
                                <div class="d-grid gap-2">
                                    <button type="submit" class="btn btn-primary">
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
        
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="row mb-4">
                <div class="col-12">
                    <button class="btn btn-outline-secondary mb-3" onclick="cargarPagos()">
                        <i class="bi bi-arrow-left"></i> Volver a pagos
                    </button>
                    <h2>Detalle del Pago</h2>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-8">
                    <div class="card mb-4">
                        <div class="card-header">
                            <h5>Información del Pago</h5>
                        </div>
                        <div class="card-body">
                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <p><strong>ID:</strong> ${pago.id}</p>
                                    <p><strong>Concepto:</strong> ${pago.concepto}</p>
                                    <p><strong>Monto:</strong> ${formatearMoneda(pago.monto)}</p>
                                    <p><strong>Estado:</strong> <span class="estado-${pago.estado}">${pago.estado}</span></p>
                                </div>
                                <div class="col-md-6">
                                    <p><strong>Fecha de Creación:</strong> ${formatearFecha(pago.fechaCreacion)}</p>
                                    <p><strong>Fecha de Vencimiento:</strong> ${formatearFecha(pago.fechaVencimiento)}</p>
                                    ${pago.fechaPago ? `<p><strong>Fecha de Pago:</strong> ${formatearFecha(pago.fechaPago)}</p>` : ''}
                                    ${pago.metodoPago ? `<p><strong>Método de Pago:</strong> ${pago.metodoPago}</p>` : ''}
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <p><strong>Descripción:</strong></p>
                                <p>${pago.descripcion || 'Sin descripción'}</p>
                            </div>
                            
                            ${pago.estado === 'pendiente' ? `
                                <div class="d-flex gap-2">
                                    <button class="btn btn-success" onclick="procesarPago(${pago.id})">
                                        <i class="bi bi-check-circle"></i> Procesar Pago
                                    </button>
                                    <button class="btn btn-danger" onclick="anularPago(${pago.id})">
                                        <i class="bi bi-x-circle"></i> Anular Pago
                                    </button>
                                </div>
                            ` : ''}
                            
                            ${pago.estado === 'completado' ? `
                                <button class="btn btn-secondary" onclick="descargarComprobantePago(${pago.id})">
                                    <i class="bi bi-download"></i> Descargar Comprobante
                                </button>
                            ` : ''}
                        </div>
                    </div>
                    
                    ${pago.tramiteId ? `
                        <div class="card mb-4">
                            <div class="card-header">
                                <h5>Trámite Asociado</h5>
                            </div>
                            <div class="card-body">
                                <p><strong>Tipo de Trámite:</strong> ${pago.tramite?.tipo?.nombre}</p>
                                <p><strong>Código:</strong> ${pago.tramite?.codigo}</p>
                                <p><strong>Estado:</strong> <span class="estado-${pago.tramite?.estado}">${pago.tramite?.estado}</span></p>
                                <button class="btn btn-info" onclick="verDetalleTramite(${pago.tramiteId})">
                                    <i class="bi bi-eye"></i> Ver Trámite
                                </button>
                            </div>
                        </div>
                    ` : ''}
                </div>
                
                <div class="col-md-4">
                    <div class="card mb-4">
                        <div class="card-header">
                            <h5>Información del Ciudadano</h5>
                        </div>
                        <div class="card-body">
                            <p><strong>Nombre:</strong> ${pago.ciudadano?.nombre} ${pago.ciudadano?.apellido}</p>
                            <p><strong>Documento:</strong> ${pago.ciudadano?.documento}</p>
                            <p><strong>Email:</strong> ${pago.ciudadano?.email}</p>
                            <p><strong>Teléfono:</strong> ${pago.ciudadano?.telefono || 'No especificado'}</p>
                            <button class="btn btn-info" onclick="verPerfilUsuario(${pago.ciudadanoId})">
                                <i class="bi bi-person"></i> Ver Perfil
                            </button>
                        </div>
                    </div>
                    
                    <div class="card">
                        <div class="card-header">
                            <h5>Historial</h5>
                        </div>
                        <div class="card-body">
                            ${!pago.historial || pago.historial.length === 0 ? `
                                <p>No hay registros en el historial de este pago.</p>
                            ` : `
                                <div class="timeline">
                                    ${pago.historial.map((registro, index) => `
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
            responseType: 'blob'
        });
        const url = window.URL.createObjectURL(new Blob([response]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `constancia_tramite_${tramiteId}.pdf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error('Error al descargar constancia:', error);
        mostrarNotificacion('Error al descargar constancia: ' + error.message, 'danger');
    } finally {
        mostrarCargando(false);
    }
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