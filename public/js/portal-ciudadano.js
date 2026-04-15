/**
 * Función para cargar el portal del ciudadano
 */
async function cargarPortalCiudadano() {
    try {
        mostrarCargando(true);
        
        // Obtener información del usuario actual
        const usuario = await fetchAPI('/usuarios/perfil');
        
        // Obtener trámites del ciudadano
        const tramos = await fetchAPI(`/tramites?ciudadanoId=${usuario.id}`);
        
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="row mb-4">
                <div class="col-12">
                    <button class="btn btn-outline-secondary mb-3" onclick="cargarPortalCiudadano()">
                        <i class="bi bi-arrow-left"></i> Volver al portal
                    </button>
                    <h2>Mis Trámites</h2>
                </div>
            </div>
            
            <div class="card mb-4">
                <div class="card-header">
                    <h5>Filtros</h5>
                </div>
                <div class="card-body">
                    <form id="form-filtros-tramites" class="row g-3">
                        <div class="col-md-4">
                            <label for="filtro-estado" class="form-label">Estado</label>
                            <select class="form-select" id="filtro-estado">
                                <option value="">Todos</option>
                                <option value="pendiente">Pendiente</option>
                                <option value="completado">Completado</option>
                                <option value="rechazado">Rechazado</option>
                            </select>
                        </div>
                        <div class="col-md-4">
                            <label for="filtro-fecha-desde" class="form-label">Fecha Desde</label>
                            <input type="date" class="form-control" id="filtro-fecha-desde">
                        </div>
                        <div class="col-md-4">
                            <label for="filtro-fecha-hasta" class="form-label">Fecha Hasta</label>
                            <input type="date" class="form-control" id="filtro-fecha-hasta">
                        </div>
                        <div class="col-12 text-end">
                            <button type="submit" class="btn btn-primary">
                                <i class="bi bi-search"></i> Filtrar
                            </button>
                            <button type="button" class="btn btn-outline-secondary" onclick="limpiarFiltrosTramitesCiudadano()">
                                <i class="bi bi-x-circle"></i> Limpiar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <h5>Listado de Trámites</h5>
                </div>
                <div class="card-body">
                    ${tramos.length === 0 ? `
                        <div class="alert alert-info">No tiene trámites registrados.</div>
                    ` : `
                        <div class="table-responsive">
                            <table class="table table-striped table-hover">
                                <thead>
                                    <tr>
                                        <th>Concepto</th>
                                        <th>Monto</th>
                                        <th>Fecha</th>
                                        <th>Estado</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${tramos.map(tramo => `
                                        <tr>
                                            <td>${tramo.concepto}</td>
                                            <td>${formatearMoneda(tramo.monto)}</td>
                                            <td>${formatearFecha(tramo.fecha)}</td>
                                            <td><span class="estado-${tramo.estado}">${tramo.estado}</span></td>
                                            <td>
                                                <button class="btn btn-sm btn-info" onclick="verDetalleTramiteCiudadano(${tramo.id})">
                                                    <i class="bi bi-eye"></i>
                                                </button>
                                                <button class="btn btn-sm btn-warning" onclick="editarTramiteCiudadano(${tramo.id})">
                                                    <i class="bi bi-pencil"></i> Editar
                                                </button>

                                                ${tramo.estado === 'pendiente' ? `
                                                    <button class="btn btn-sm btn-success" onclick="pagarEnLinea(${tramo.id})">
                                                        <i class="bi bi-credit-card"></i> Pagar
                                                    </button>
                                                ` : ''}
                                                ${tramo.estado === 'completado' ? `
                                                    <button class="btn btn-sm btn-secondary" onclick="descargarComprobantePago(${tramo.id})">
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
        
    } catch (error) {
        console.error('Error al cargar portal del ciudadano:', error);
        mostrarNotificacion('Error al cargar portal: ' + error.message, 'danger');
    } finally {
        mostrarCargando(false);
    }
}

/**
 * Función para ver todos los pagos del ciudadano
 */
async function verTodosPagosCiudadano() {
    try {
        mostrarCargando(true);
        
        // Obtener información del usuario actual
        const usuario = await fetchAPI('/usuarios/perfil');
        
        // Obtener pagos del ciudadano
        const pagos = await fetchAPI(`/pagos?ciudadanoId=${usuario.id}`);
        
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="row mb-4">
                <div class="col-12">
                    <button class="btn btn-outline-secondary mb-3" onclick="cargarPortalCiudadano()">
                        <i class="bi bi-arrow-left"></i> Volver al portal
                    </button>
                    <h2>Mis Pagos</h2>
                </div>
            </div>
            
            <div class="card mb-4">
                <div class="card-header">
                    <h5>Filtros</h5>
                </div>
                <div class="card-body">
                    <form id="form-filtros-pagos" class="row g-3">
                        <div class="col-md-4">
                            <label for="filtro-estado" class="form-label">Estado</label>
                            <select class="form-select" id="filtro-estado">
                                <option value="">Todos</option>
                                <option value="pendiente">Pendiente</option>
                                <option value="completado">Completado</option>
                                <option value="rechazado">Rechazado</option>
                            </select>
                        </div>
                        <div class="col-md-4">
                            <label for="filtro-fecha-desde" class="form-label">Fecha Desde</label>
                            <input type="date" class="form-control" id="filtro-fecha-desde">
                        </div>
                        <div class="col-md-4">
                            <label for="filtro-fecha-hasta" class="form-label">Fecha Hasta</label>
                            <input type="date" class="form-control" id="filtro-fecha-hasta">
                        </div>
                        <div class="col-12 text-end">
                            <button type="submit" class="btn btn-primary">
                                <i class="bi bi-search"></i> Filtrar
                            </button>
                            <button type="button" class="btn btn-outline-secondary" onclick="limpiarFiltrosPagosCiudadano()">
                                <i class="bi bi-x-circle"></i> Limpiar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5>Listado de Pagos</h5>
                    <div class="d-flex gap-2">
                        <button class="btn btn-warning" id="btn-iniciar-pago-seleccionados">
                            <i class="bi bi-credit-card"></i> Pagar
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <div id="contenedor-pago-existente" class="mb-4 d-none border p-3 rounded bg-light">
                        <h5 class="card-title text-center mb-3">Seleccione Método de Pago</h5>
                        <div id="opciones-pago-existente" class="d-grid gap-2 col-md-6 mx-auto">
                            <button class="btn btn-primary" onclick="mostrarFormularioTarjetaExistente('debito')">
                                <i class="bi bi-credit-card"></i> Débito
                            </button>
                            <button class="btn btn-primary" onclick="mostrarFormularioTarjetaExistente('credito')">
                                <i class="bi bi-credit-card-2-front"></i> Crédito
                            </button>
                            <button class="btn btn-info text-white" onclick="redirigirMercadoPagoExistente()">
                                <i class="bi bi-shop"></i> Mercado Pago
                            </button>
                        </div>
                        
                        <div id="formulario-tarjeta-existente" class="d-none mt-3 col-md-8 mx-auto">
                           <div class="card">
                              <div class="card-body">
                                 <h6 class="card-title" id="titulo-formulario-tarjeta-existente">Datos de la Tarjeta</h6>
                                 <form id="form-tarjeta-pago-existente">
                                    <div class="mb-3">
                                       <label class="form-label">Nombre del Titular</label>
                                       <input type="text" class="form-control" id="existente-nombre-titular" required>
                                    </div>
                                    <div class="mb-3">
                                       <label class="form-label">Número de Tarjeta</label>
                                       <input type="text" class="form-control" id="existente-numero-tarjeta" maxlength="16" placeholder="XXXX XXXX XXXX XXXX" required>
                                    </div>
                                    <div class="row">
                                       <div class="col-md-6 mb-3">
                                          <label class="form-label">Fecha Expiración</label>
                                          <input type="text" class="form-control" id="existente-fecha-expiracion" placeholder="MM/YY" maxlength="5" required>
                                       </div>
                                       <div class="col-md-6 mb-3">
                                          <label class="form-label">CVV</label>
                                          <input type="password" class="form-control" id="existente-codigo-seguridad" maxlength="3" placeholder="123" required>
                                       </div>
                                    </div>
                                    <div class="d-grid gap-2">
                                        <button type="button" class="btn btn-success" onclick="procesarPagoTarjetaExistente()">
                                           <i class="bi bi-lock"></i> Confirmar Pago
                                        </button>
                                        <button type="button" class="btn btn-secondary" onclick="cancelarPagoExistente()">
                                           Cancelar
                                        </button>
                                    </div>
                                 </form>
                              </div>
                           </div>
                        </div>
                    </div>
                    ${pagos.length === 0 ? `
                        <div class="alert alert-info">No tiene pagos registrados.</div>
                    ` : `
                        <div class="table-responsive">
                            <table class="table table-striped table-hover">
                                <thead>
                                    <tr>
                                        <th style="width:42px"><input type="checkbox" id="chk-select-all"></th>
                                        <th>Concepto</th>
                                        <th>Monto</th>
                                        <th>Fecha</th>
                                        <th>Vencimiento</th>
                                        <th>Estado</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody id="tabla-pagos">
                                    ${pagos.map(pago => `
                                        <tr>
                                            <td>
                                                ${pago.estado === 'pendiente' ? `<input type="checkbox" class="chk-pago" data-id="${pago.id}">` : '—'}
                                            </td>
                                            <td>${pago.concepto}</td>
                                            <td>${formatearMoneda(pago.monto)}</td>
                                            <td>${formatearFecha(pago.fecha)}</td>
                                            <td>${formatearFecha(pago.fechaVencimiento)}</td>
                                            <td><span class="estado-${pago.estado}">${pago.estado}</span></td>
                                            <td>
                                                <button class="btn btn-sm btn-info" onclick="verDetallePagoCiudadano(${pago.id})">
                                                    <i class="bi bi-eye"></i>
                                                </button>
                                                ${pago.estado === 'pendiente' ? `
                                                    <button class="btn btn-sm btn-success" onclick="pagarEnLinea(${pago.id})">
                                                        <i class="bi bi-credit-card"></i> Pagar
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
        formFiltros.addEventListener('submit', filtrarPagosCiudadano);
        
        const btnIniciarPago = document.getElementById('btn-iniciar-pago-seleccionados');
        if (btnIniciarPago) btnIniciarPago.addEventListener('click', mostrarOpcionesPagoExistente);
        
        const chkAll = document.getElementById('chk-select-all');
        if (chkAll) {
            chkAll.addEventListener('change', () => {
                document.querySelectorAll('#tabla-pagos input.chk-pago').forEach(chk => {
                    if (!chk.disabled) chk.checked = chkAll.checked;
                });
            });
        }
        
    } catch (error) {
        console.error('Error al cargar pagos:', error);
        mostrarNotificacion('Error al cargar pagos: ' + error.message, 'danger');
    } finally {
        mostrarCargando(false);
    }
}

/**
 * Función para filtrar pagos del ciudadano
 * @param {Event} e - Evento del formulario
 */
async function filtrarPagosCiudadano(e) {
    e.preventDefault();
    
    try {
        mostrarCargando(true);
        
        // Obtener valores de los filtros
        const estado = document.getElementById('filtro-estado').value;
        const fechaDesde = document.getElementById('filtro-fecha-desde').value;
        const fechaHasta = document.getElementById('filtro-fecha-hasta').value;
        
        // Obtener información del usuario actual
        const usuario = await fetchAPI('/usuarios/perfil');
        
        // Construir query string para filtros
        const queryParams = new URLSearchParams();
        queryParams.append('ciudadanoId', usuario.id);
        if (estado) queryParams.append('estado', estado);
        if (fechaDesde) queryParams.append('fechaDesde', fechaDesde);
        if (fechaHasta) queryParams.append('fechaHasta', fechaHasta);
        
        const pagos = await fetchAPI(`/pagos?${queryParams.toString()}`);
        
        const tablaPagos = document.getElementById('tabla-pagos');
        if (pagos.length === 0) {
            tablaPagos.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">No se encontraron pagos con los filtros seleccionados.</td>
                </tr>
            `;
        } else {
            tablaPagos.innerHTML = pagos.map(pago => `
                <tr>
                    <td>
                        ${pago.estado === 'pendiente' ? `<input type="checkbox" class="chk-pago" data-id="${pago.id}">` : '—'}
                    </td>
                    <td>${pago.concepto}</td>
                    <td>${formatearMoneda(pago.monto)}</td>
                    <td>${formatearFecha(pago.fecha)}</td>
                    <td>${formatearFecha(pago.fechaVencimiento)}</td>
                    <td><span class="estado-${pago.estado}">${pago.estado}</span></td>
                    <td>
                        <button class="btn btn-sm btn-info" onclick="verDetallePagoCiudadano(${pago.id})">
                            <i class="bi bi-eye"></i>
                        </button>
                        ${pago.estado === 'pendiente' ? `
                            <button class="btn btn-sm btn-success" onclick="pagarEnLinea(${pago.id})">
                                <i class="bi bi-credit-card"></i> Pagar
                            </button>
                        ` : ''}
                        ${pago.estado === 'completado' ? `
                            <span class="badge bg-success me-2">Pago completado</span>
                            <button class="btn btn-sm btn-secondary" onclick="descargarComprobantePago(${pago.id})">
                                <i class="bi bi-download"></i> Comprobante
                            </button>
                        ` : ''}
                    </td>
                </tr>
            `).join('');
        }
        
    } catch (error) {
        console.error('Error al filtrar pagos:', error);
        mostrarNotificacion('Error al filtrar pagos: ' + error.message, 'danger');
    } finally {
        mostrarCargando(false);
    }
}

/**
 * Función para limpiar los filtros de pagos
 */
function limpiarFiltrosPagosCiudadano() {
    document.getElementById('filtro-estado').value = '';
    document.getElementById('filtro-fecha-desde').value = '';
    document.getElementById('filtro-fecha-hasta').value = '';
    verTodosPagosCiudadano();
}

/**
 * Función para ver el detalle de un pago como ciudadano
 * @param {number} pagoId - ID del pago
 */
async function verDetallePagoCiudadano(pagoId) {
    try {
        mostrarCargando(true);
        
        const pago = await fetchAPI(`/pagos/${pagoId}`);
        
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="row mb-4">
                <div class="col-12">
                    <button class="btn btn-outline-secondary mb-3" onclick="verTodosPagosCiudadano()">
                        <i class="bi bi-arrow-left"></i> Volver a mis pagos
                    </button>
                    <h2>Detalle del Pago</h2>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-8 offset-md-2">
                    <div class="card">
                        <div class="card-header">
                            <h5>Información del Pago</h5>
                        </div>
                        <div class="card-body">
                            <div class="row mb-3">
                                <div class="col-md-6">
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
                            
                            ${pago.tramiteId ? `
                                <div class="mb-3">
                                    <p><strong>Trámite Asociado:</strong></p>
                                    <p>Tipo: ${pago.tramite?.tipo?.nombre}</p>
                                    <p>Código: ${pago.tramite?.codigo}</p>
                                    <button class="btn btn-info" onclick="verDetalleTramiteCiudadano(${pago.tramiteId})">
                                        <i class="bi bi-eye"></i> Ver Trámite
                                    </button>
                                </div>
                            ` : ''}
                            
                            ${pago.estado === 'pendiente' ? `
                                <div class="d-grid gap-2 mt-3">
                                    <button class="btn btn-success" onclick="pagarEnLinea(${pago.id})">
                                        <i class="bi bi-credit-card"></i> Pagar en Línea
                                    </button>
                                </div>
                            ` : ''}
                            
                            ${pago.estado === 'completado' ? `
                                <div class="d-grid gap-2 mt-3">
                                    <div class="alert alert-success mb-2">
                                        <i class="bi bi-check-circle-fill"></i> Pago completado
                                    </div>
                                    <button class="btn btn-secondary" onclick="descargarComprobantePago(${pago.id})">
                                        <i class="bi bi-download"></i> Descargar Comprobante
                                    </button>
                                </div>
                            ` : ''}
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
 * Función para pagar en línea
 * @param {number} pagoId - ID del pago
 */
async function pagarEnLinea(pagoId) {
    try {
        mostrarCargando(true);
        
        const pago = await fetchAPI(`/pagos/${pagoId}`);
        
        const cssId = 'pago-en-linea-css';
        if (!document.getElementById(cssId)) {
            const link = document.createElement('link');
            link.id = cssId;
            link.rel = 'stylesheet';
            link.href = '/css/pagar-en-linea.css';
            document.head.appendChild(link);
        }
        
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="payment-wrapper">
                <div class="payment-card">
                    <div class="payment-header">
                        <button class="btn btn-outline-secondary mb-3" onclick="verDetallePagoCiudadano(${pagoId})">
                            <i class="bi bi-arrow-left"></i> Volver al pago
                        </button>
                        <h2 class="payment-title">Compra de PayPal</h2>
                        <p class="payment-subtitle">Por favor, especificad los detalles a continuación:</p>
                    </div>
                    <div class="payment-body">
                         <form id="form-pago-online">
                             <input type="hidden" id="pago-id" value="${pagoId}">
                             
                             <div class="payment-section-title">Seleccionad vuestros productos favoritos</div>
                             <div class="payment-list">
                                 <div class="payment-item">
                                     <div class="payment-item-left">
                                         <input type="checkbox" checked disabled aria-label="Seleccionado">
                                         <div class="payment-item-info">
                                             <div class="payment-item-name">${pago.concepto}</div>
                                             <div class="payment-item-qty">
                                                 <span class="qty-label">Cantidad</span>
                                                 <select id="cantidad-pago" class="form-select form-select-sm" disabled>
                                                     <option value="1" selected>1</option>
                                                 </select>
                                             </div>
                                         </div>
                                     </div>
                                     <div class="payment-item-right">
                                         <div class="payment-item-price">${formatearMoneda(pago.monto)}</div>
                                     </div>
                                 </div>
                             </div>
                            
                            
                            
                            <div class="payment-total-row">
                                <div class="payment-total-label">Total</div>
                                <div class="payment-total-value" id="payment-total">${formatearMoneda(pago.monto)}</div>
                            </div>
                            
                            <div class="payment-actions">
                                <button type="button" class="btn btn-success btn-buy" onclick="redirigirAPaginaPago(${pagoId})">
                                    <i class="bi bi-credit-card"></i> Pagar Trámite
                                </button>
                                <button type="button" class="btn btn-outline-secondary" onclick="verDetallePagoCiudadano(${pagoId})">
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        
        // Configurar acción del botón "Pagar Trámite"
        const formPagoOnline = document.getElementById('form-pago-online');
        const btnPagar = formPagoOnline.querySelector('.btn-buy');
        if (btnPagar) {
            btnPagar.addEventListener('click', () => redirigirAPaginaPago(pagoId));
        }
        
    } catch (error) {
        console.error('Error al cargar formulario de pago en línea:', error);
        mostrarNotificacion('Error al cargar formulario: ' + error.message, 'danger');
    } finally {
        mostrarCargando(false);
    }
}

/**
 * Redirigir a página de pago (temporal)
 * Este flujo se reemplazará por API Key de pago.
 */
function redirigirAPaginaPago(pagoId) {
    window.location.href = '/pago.html';
}

async function pagarSeleccionados() {
    try {
        const seleccionados = Array.from(document.querySelectorAll('#tabla-pagos input.chk-pago:checked'))
            .map(chk => Number(chk.getAttribute('data-id')))
            .filter(Boolean);
        if (seleccionados.length === 0) {
            mostrarNotificacion('Seleccione al menos un pago pendiente', 'warning');
            return;
        }
        mostrarCargando(true);
        const payloadBase = {
            metodoPago: 'otro',
            observaciones: 'Procesado por acción masiva',
        };
        const resultados = await Promise.allSettled(seleccionados.map(id => fetchAPI(`/pagos/${id}/procesar`, {
            method: 'PUT',
            body: { ...payloadBase, referencia: `BULK-${Date.now()}-${id}`, fechaPago: new Date().toISOString() }
        })));
        const ok = resultados.filter(r => r.status === 'fulfilled').length;
        const fail = resultados.length - ok;
        mostrarNotificacion(`Pagos completados: ${ok}. Fallidos: ${fail}.`, ok > 0 ? 'success' : 'danger');
        await verTodosPagosCiudadano();
    } catch (error) {
        console.error('Error al pagar seleccionados:', error);
        mostrarNotificacion('Error al pagar seleccionados: ' + error.message, 'danger');
    } finally {
        mostrarCargando(false);
    }
}

async function simularSeleccionados() {
    try {
        const seleccionados = Array.from(document.querySelectorAll('#tabla-pagos input.chk-pago:checked'))
            .map(chk => Number(chk.getAttribute('data-id')))
            .filter(Boolean);
        if (seleccionados.length === 0) {
            mostrarNotificacion('Seleccione al menos un pago pendiente', 'warning');
            return;
        }
        mostrarCargando(true);
        const resultados = await Promise.allSettled(seleccionados.map(id => fetchAPI(`/pagos/${id}/procesar`, {
            method: 'PUT',
            body: { metodoPago: 'online', observaciones: 'Pago simulado desde portal ciudadano', referencia: `SIM-${Date.now()}-${id}`, fechaPago: new Date().toISOString() }
        })));
        const ok = resultados.filter(r => r.status === 'fulfilled').length;
        const fail = resultados.length - ok;
        mostrarNotificacion(`Pagos simulados: ${ok}. Fallidos: ${fail}.`, ok > 0 ? 'success' : 'danger');
        await verTodosPagosCiudadano();
    } catch (error) {
        console.error('Error al simular seleccionados:', error);
        mostrarNotificacion('Error al simular seleccionados: ' + error.message, 'danger');
    } finally {
        mostrarCargando(false);
    }
}

/**
 * Función para descargar comprobante de pago
 * @param {number} pagoId - ID del pago
 */
async function descargarComprobantePago(pagoId) {
    try {
        mostrarCargando(true);
        
        // Obtener el comprobante del servidor
        const response = await fetchAPI(`/pagos/${pagoId}/comprobante`, {
            method: 'GET',
            responseType: 'blob'
        });
        
        // Crear un objeto URL para el blob
        const url = window.URL.createObjectURL(new Blob([response]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `comprobante-pago-${pagoId}.pdf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        mostrarNotificacion('Comprobante descargado correctamente', 'success');
        
    } catch (error) {
        console.error('Error al descargar comprobante:', error);
        mostrarNotificacion('Error al descargar comprobante: ' + error.message, 'danger');
    } finally {
        mostrarCargando(false);
    }
}

/**
 * Función para ver todas las notificaciones
 */
async function verTodasNotificaciones() {
    try {
        mostrarCargando(true);
        
        // Obtener información del usuario actual
        const usuario = await fetchAPI('/usuarios/perfil');
        
        // Obtener notificaciones del ciudadano
        const notificaciones = await fetchAPI(`/notificaciones?usuarioId=${usuario.id}`);
        
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="row mb-4">
                <div class="col-12">
                    <button class="btn btn-outline-secondary mb-3" onclick="cargarPortalCiudadano()">
                        <i class="bi bi-arrow-left"></i> Volver al portal
                    </button>
                    <h2>Mis Notificaciones</h2>
                </div>
            </div>
            
            <div class="card mb-4">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5>Filtros</h5>
                    ${notificaciones.filter(n => !n.leida).length > 0 ? `
                        <button class="btn btn-sm btn-outline-secondary" onclick="marcarTodasLeidas()">
                            <i class="bi bi-check-all"></i> Marcar todas como leídas
                        </button>
                    ` : ''}
                </div>
                <div class="card-body">
                    <form id="form-filtros-notificaciones" class="row g-3">
                        <div class="col-md-4">
                            <label for="filtro-leida" class="form-label">Estado</label>
                            <select class="form-select" id="filtro-leida">
                                <option value="">Todos</option>
                                <option value="false">No leídas</option>
                                <option value="true">Leídas</option>
                            </select>
                        </div>
                        <div class="col-md-4">
                            <label for="filtro-fecha-desde" class="form-label">Fecha Desde</label>
                            <input type="date" class="form-control" id="filtro-fecha-desde">
                        </div>
                        <div class="col-md-4">
                            <label for="filtro-fecha-hasta" class="form-label">Fecha Hasta</label>
                            <input type="date" class="form-control" id="filtro-fecha-hasta">
                        </div>
                        <div class="col-12 text-end">
                            <button type="submit" class="btn btn-primary">
                                <i class="bi bi-search"></i> Filtrar
                            </button>
                            <button type="button" class="btn btn-outline-secondary" onclick="limpiarFiltrosNotificaciones()">
                                <i class="bi bi-x-circle"></i> Limpiar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <h5>Listado de Notificaciones</h5>
                </div>
                <div class="card-body">
                    ${notificaciones.length === 0 ? `
                        <div class="alert alert-info">No tiene notificaciones.</div>
                    ` : `
                        <div class="list-group" id="lista-notificaciones">
                            ${notificaciones.map(notif => `
                                <div class="list-group-item list-group-item-action ${!notif.leida ? 'list-group-item-info' : ''}">
                                    <div class="d-flex w-100 justify-content-between">
                                        <h6 class="mb-1">${notif.titulo}</h6>
                                        <small>${formatearFecha(notif.fecha)}</small>
                                    </div>
                                    <p class="mb-1">${notif.mensaje}</p>
                                    <div class="d-flex justify-content-between align-items-center">
                                        <small>${notif.leida ? 'Leída' : 'No leída'}</small>
                                        ${!notif.leida ? `
                                            <button class="btn btn-sm btn-outline-primary" onclick="marcarLeida(${notif.id})">
                                                <i class="bi bi-check"></i> Marcar como leída
                                            </button>
                                        ` : ''}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
            </div>
        `;
        
        // Agregar evento para el formulario de filtros
        const formFiltros = document.getElementById('form-filtros-notificaciones');
        formFiltros.addEventListener('submit', filtrarNotificaciones);
        
    } catch (error) {
        console.error('Error al cargar notificaciones:', error);
        mostrarNotificacion('Error al cargar notificaciones: ' + error.message, 'danger');
    } finally {
        mostrarCargando(false);
    }
}

/**
 * Función para filtrar notificaciones
 * @param {Event} e - Evento del formulario
 */
async function filtrarNotificaciones(e) {
    e.preventDefault();
    
    try {
        mostrarCargando(true);
        
        // Obtener valores de los filtros
        const leida = document.getElementById('filtro-leida').value;
        const fechaDesde = document.getElementById('filtro-fecha-desde').value;
        const fechaHasta = document.getElementById('filtro-fecha-hasta').value;
        
        // Obtener información del usuario actual
        const usuario = await fetchAPI('/usuarios/perfil');
        
        // Construir query string para filtros
        const queryParams = new URLSearchParams();
        queryParams.append('usuarioId', usuario.id);
        if (leida !== '') queryParams.append('leida', leida);
        if (fechaDesde) queryParams.append('fechaDesde', fechaDesde);
        if (fechaHasta) queryParams.append('fechaHasta', fechaHasta);
        
        const notificaciones = await fetchAPI(`/notificaciones?${queryParams.toString()}`);
        
        const listaNotificaciones = document.getElementById('lista-notificaciones');
        if (notificaciones.length === 0) {
            listaNotificaciones.innerHTML = `
                <div class="alert alert-info">No se encontraron notificaciones con los filtros seleccionados.</div>
            `;
        } else {
            listaNotificaciones.innerHTML = notificaciones.map(notif => `
                <div class="list-group-item list-group-item-action ${!notif.leida ? 'list-group-item-info' : ''}">
                    <div class="d-flex w-100 justify-content-between">
                        <h6 class="mb-1">${notif.titulo}</h6>
                        <small>${formatearFecha(notif.fecha)}</small>
                    </div>
                    <p class="mb-1">${notif.mensaje}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <small>${notif.leida ? 'Leída' : 'No leída'}</small>
                        ${!notif.leida ? `
                            <button class="btn btn-sm btn-outline-primary" onclick="marcarLeida(${notif.id})">
                                <i class="bi bi-check"></i> Marcar como leída
                            </button>
                        ` : ''}
                    </div>
                </div>
            `).join('');
        }
        
    } catch (error) {
        console.error('Error al filtrar notificaciones:', error);
        mostrarNotificacion('Error al filtrar notificaciones: ' + error.message, 'danger');
    } finally {
        mostrarCargando(false);
    }
}

/**
 * Función para limpiar los filtros de notificaciones
 */
function limpiarFiltrosNotificaciones() {
    document.getElementById('filtro-leida').value = '';
    document.getElementById('filtro-fecha-desde').value = '';
    document.getElementById('filtro-fecha-hasta').value = '';
    verTodasNotificaciones();
}

/**
 * Función para marcar una notificación como leída
 * @param {number} notificacionId - ID de la notificación
 */
async function marcarLeida(notificacionId) {
    try {
        mostrarCargando(true);
        
        await fetchAPI(`/notificaciones/${notificacionId}/marcar-leida`, {
            method: 'POST'
        });
        
        mostrarNotificacion('Notificación marcada como leída', 'success');
        verTodasNotificaciones();
        
    } catch (error) {
        console.error('Error al marcar notificación como leída:', error);
        mostrarNotificacion('Error al marcar notificación: ' + error.message, 'danger');
    } finally {
        mostrarCargando(false);
    }
}

/**
 * Función para marcar todas las notificaciones como leídas
 */
async function marcarTodasLeidas() {
    try {
        mostrarCargando(true);
        
        await fetchAPI('/notificaciones/marcar-todas-leidas', {
            method: 'POST'
        });
        
        mostrarNotificacion('Todas las notificaciones marcadas como leídas', 'success');
        verTodasNotificaciones();
        
    } catch (error) {
        console.error('Error al marcar todas las notificaciones como leídas:', error);
        mostrarNotificacion('Error al marcar notificaciones: ' + error.message, 'danger');
    } finally {
        mostrarCargando(false);
    }
}

// -------------------------
// Nuevo Trámite (Portal)
// -------------------------
async function mostrarFormularioNuevoTramite(tramiteAEditar = null) {
  try {
    mostrarCargando(true);

    const esEdicion = !!tramiteAEditar;
    const tiposTramite = await fetchAPI('/tramites/tipos?estado=activo');
    const departamentosResp = await fetchAPI('/departamentos?limit=100');
    const departamentos = Array.isArray(departamentosResp)
      ? departamentosResp
      : (departamentosResp?.departamentos || departamentosResp?.data || []);

    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
      <div class="row mb-4">
        <div class="col-12">
          <button class="btn btn-outline-secondary mb-3" onclick="cargarPortalCiudadano()">
            <i class="bi bi-arrow-left"></i> Volver al portal
          </button>
          <h2>${esEdicion ? 'Editar Trámite' : 'Nuevo Trámite'}</h2>
        </div>
      </div>
      <div class="row">
        <div class="col-md-8 offset-md-2">
          <div class="card">
            <div class="card-body">
              <form id="form-nuevo-tramite" data-id="${esEdicion ? tramiteAEditar.id : ''}">
                <div class="mb-3">
                  <label for="tipo-tramite" class="form-label">Tipo de Trámite</label>
                  <select class="form-select" id="tipo-tramite" required>
                    <option value="">Seleccione un tipo de trámite</option>
                    ${(Array.isArray(tiposTramite) ? tiposTramite : []).map(tipo => `<option value="${tipo.id}">${tipo.nombre}</option>`).join('')}
                  </select>
                </div>
                <div class="mb-3">
                  <label for="titulo" class="form-label">Título</label>
                  <input type="text" class="form-control" id="titulo" required value="${esEdicion ? (tramiteAEditar.titulo || '') : ''}" />
                </div>
                <div class="mb-3">
                  <label for="departamento" class="form-label">Departamento</label>
                  <select class="form-select" id="departamento" required>
                    <option value="">Seleccione un departamento</option>
                    ${departamentos.map(dep => `<option value="${dep.id}">${dep.nombre}</option>`).join('')}
                  </select>
                </div>
                <div class="mb-3">
                  <label for="descripcion" class="form-label">Descripción</label>
                  <textarea class="form-control" id="descripcion" rows="3" required>${esEdicion ? (tramiteAEditar.descripcion || '') : ''}</textarea>
                </div>
                
                <div class="mb-3">
                  <label for="documentos-tramite" class="form-label">Documentos Adjuntos</label>
                  <input type="file" id="documentos-tramite" class="form-control" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,image/*">
                  <div class="form-text">Formatos permitidos: PDF, Word, Excel, Imágenes. Máximo 7 archivos.</div>
                </div>

                <div id="modulo-pago" class="mt-3 d-none"></div>
                <div class="d-grid gap-2">
                  <button type="submit" id="btn-nuevo-tramite" class="btn btn-primary">
                    <i class="bi bi-send"></i> ${esEdicion ? 'Guardar Cambios' : 'Enviar Solicitud'}
                  </button>
                  <button type="button" class="btn btn-outline-secondary" onclick="cargarPortalCiudadano()">Cancelar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    `;

    if (esEdicion) {
      const tipoOpts = Array.from(document.getElementById('tipo-tramite').options);
      const matchOpt = tipoOpts.find(o => o.text.trim().toLowerCase() === (tramiteAEditar.tipo || '').toLowerCase());
      if (matchOpt) document.getElementById('tipo-tramite').value = matchOpt.value;
      document.getElementById('departamento').value = tramiteAEditar.departamento_id || '';
    }

    const form = document.getElementById('form-nuevo-tramite');
    form.addEventListener('submit', iniciarTramite);
  } catch (error) {
    console.error('Error al cargar formulario de nuevo trámite:', error);
    mostrarNotificacion('Error al cargar formulario: ' + error.message, 'danger');
  } finally {
    mostrarCargando(false);
  }
}

/**
 * Muestra el contenedor de opciones de pago para pagos existentes
 */
function mostrarOpcionesPagoExistente() {
    const seleccionados = document.querySelectorAll('#tabla-pagos input.chk-pago:checked');
    if (seleccionados.length === 0) {
        mostrarNotificacion('Seleccione al menos un pago pendiente', 'warning');
        return;
    }
    
    const contenedor = document.getElementById('contenedor-pago-existente');
    const opciones = document.getElementById('opciones-pago-existente');
    const formulario = document.getElementById('formulario-tarjeta-existente');
    
    if (contenedor) {
        contenedor.classList.remove('d-none');
        contenedor.scrollIntoView({ behavior: 'smooth' });
    }
    if (opciones) opciones.classList.remove('d-none');
    if (formulario) formulario.classList.add('d-none');
}

/**
 * Muestra formulario de tarjeta para pagos existentes
 */
function mostrarFormularioTarjetaExistente(tipo) {
    const opciones = document.getElementById('opciones-pago-existente');
    const formulario = document.getElementById('formulario-tarjeta-existente');
    const titulo = document.getElementById('titulo-formulario-tarjeta-existente');
    
    if (opciones) opciones.classList.add('d-none');
    if (formulario) {
        formulario.classList.remove('d-none');
        if (titulo) titulo.textContent = `Datos de Tarjeta de ${tipo === 'debito' ? 'Débito' : 'Crédito'}`;
        const form = document.getElementById('form-tarjeta-pago-existente');
        if (form) form.reset();
    }
}

/**
 * Cancela el proceso de pago existente
 */
function cancelarPagoExistente() {
    const contenedor = document.getElementById('contenedor-pago-existente');
    if (contenedor) contenedor.classList.add('d-none');
}

/**
 * Redirige a Mercado Pago para pagos existentes
 */
function redirigirMercadoPagoExistente() {
    mostrarNotificacion('Redirigiendo a Mercado Pago...', 'info');
    setTimeout(() => {
        window.open('https://www.mercadopago.cl/home', '_blank');
        procesarPagoBackend('mercado_pago');
    }, 1500);
}

/**
 * Procesa pago con tarjeta para pagos existentes
 */
function procesarPagoTarjetaExistente() {
    const titular = document.getElementById('existente-nombre-titular').value;
    const numero = document.getElementById('existente-numero-tarjeta').value;
    const expiracion = document.getElementById('existente-fecha-expiracion').value;
    const cvv = document.getElementById('existente-codigo-seguridad').value;

    if (!titular || !numero || !expiracion || !cvv) {
        mostrarNotificacion('Por favor complete todos los datos de la tarjeta', 'warning');
        return;
    }

    if (numero.length < 16 || cvv.length < 3) {
        mostrarNotificacion('Datos de tarjeta inválidos', 'warning');
        return;
    }

    mostrarCargando(true);
    setTimeout(() => {
        procesarPagoBackend('tarjeta');
    }, 2000);
}

/**
 * Función común para enviar pagos al backend
 */
async function procesarPagoBackend(metodo) {
    try {
        const seleccionados = Array.from(document.querySelectorAll('#tabla-pagos input.chk-pago:checked'))
            .map(chk => Number(chk.getAttribute('data-id')))
            .filter(Boolean);
            
        if (seleccionados.length === 0) return;

        const payloadBase = {
            metodoPago: metodo,
            observaciones: `Pago realizado vía ${metodo === 'mercado_pago' ? 'Mercado Pago' : 'Tarjeta'} (Portal)`,
        };

        const resultados = await Promise.allSettled(seleccionados.map(id => fetchAPI(`/pagos/${id}/procesar`, {
            method: 'PUT',
            body: { 
                ...payloadBase, 
                referencia: `ONLINE-${Date.now()}-${id}`, 
                fechaPago: new Date().toISOString() 
            }
        })));

        const ok = resultados.filter(r => r.status === 'fulfilled').length;
        const fail = resultados.length - ok;
        
        mostrarCargando(false);
        cancelarPagoExistente();
        
        if (ok > 0) {
            mostrarNotificacion(`Pago exitoso. Procesados: ${ok}.`, 'success');
            // Recargar listado
            await verTodosPagosCiudadano();
        } else {
            mostrarNotificacion('Error al procesar los pagos.', 'danger');
        }
        
    } catch (error) {
        console.error('Error al procesar pagos:', error);
        mostrarCargando(false);
        mostrarNotificacion('Error: ' + error.message, 'danger');
    }
}

async function iniciarTramite(e) {
  e.preventDefault();
  try {
    mostrarCargando(true);

    const tipoSelect = document.getElementById('tipo-tramite');
    const tipoTramiteId = tipoSelect.value;
    const tipoNombre = tipoSelect.options[tipoSelect.selectedIndex]?.text || '';

    const normalizarTipo = (nombre) => {
      const n = (nombre || '').toLowerCase();
      if (n.includes('licencia') && n.includes('conduc')) return 'licencia';
      if (n.includes('permiso') || n.includes('construcción') || n.includes('construccion')) return 'permiso';
      if (n.includes('certificado')) return 'certificado';
      if (n.includes('registro')) return 'registro';
      if (n.includes('solicitud')) return 'solicitud';
      if (n.includes('reclamo')) return 'reclamo';
      return 'otro';
    };

    const titulo = document.getElementById('titulo').value.trim();
    const descripcion = document.getElementById('descripcion').value.trim();
    const departamentoId = document.getElementById('departamento').value;

    if (!tipoTramiteId || !titulo || !descripcion || !departamentoId) {
      mostrarNotificacion('Complete todos los campos requeridos', 'warning');
      return;
    }

    const configPago = await obtenerConfiguracionPagoPorNombre(tipoNombre);
    const form = document.getElementById('form-nuevo-tramite');
    const moduloPago = document.getElementById('modulo-pago');
    const btnPrincipal = document.getElementById('btn-nuevo-tramite');

    if (configPago.requiere && form.dataset.pasoPago !== 'mostrado') {
      renderModuloPagoParaNuevoTramite(configPago);
      moduloPago.classList.remove('d-none');
      form.dataset.pasoPago = 'mostrado';
      btnPrincipal.innerHTML = '<i class=\"bi bi-credit-card\"></i> Continuar Pago';
      btnPrincipal.setAttribute('type', 'button');
      btnPrincipal.onclick = () => moduloPago.scrollIntoView({ behavior: 'smooth', block: 'start' });
      mostrarNotificacion('Este trámite requiere pago. Complete el módulo de cobro y luego envíe la solicitud.', 'info');
      return;
    }

    const form = document.getElementById('form-nuevo-tramite');
    const tramiteIdEdicion = form.dataset.id;
    const esEdicion = !!tramiteIdEdicion;

    if (!configPago.requiere || esEdicion) {
      const tipo = normalizarTipo(tipoNombre);
      const payloadTramite = {
        titulo,
        descripcion,
        tipo: tipoNombre,
        departamento_id: parseInt(departamentoId),
        requiere_pago: false,
        monto: 0
      };
      
      let tramiteGuardado;
      if (esEdicion) {
        let resp = await fetchAPI(`/tramites/${tramiteIdEdicion}`, { method: 'PUT', body: JSON.stringify(payloadTramite) });
        tramiteGuardado = resp.tramite || resp;
        mostrarNotificacion('Trámite actualizado correctamente', 'success');
      } else {
        let resp = await fetchAPI('/tramites', { method: 'POST', body: JSON.stringify(payloadTramite) });
        tramiteGuardado = resp.tramite || resp;
        mostrarNotificacion('Trámite iniciado correctamente', 'success');
      }
      
      const fileInput = document.getElementById('documentos-tramite');
      if (fileInput && fileInput.files.length > 0) {
          await subirDocumentosTramite(tramiteGuardado.id, fileInput.files);
      }

      await cargarPortalCiudadano();
    } else {
      mostrarNotificacion('Use el botón "Enviar Solicitud" dentro del módulo de pago.', 'info');
    }
  } catch (error) {
    console.error('Error al iniciar trámite:', error);
    mostrarNotificacion('Error al iniciar trámite: ' + error.message, 'danger');
  } finally {
    mostrarCargando(false);
  }
}

async function obtenerConfiguracionPagoPorNombre(nombre) {
  try {
    const norm = (nombre || '').toLowerCase();
    let clave = 'otro';
    if (norm.includes('licencia')) clave = 'licencia';
    else if (norm.includes('permiso') || norm.includes('construcción') || norm.includes('construccion')) clave = 'permiso';
    else if (norm.includes('certificado')) clave = 'certificado';
    else if (norm.includes('solicitud')) clave = 'solicitud';

    const resp = await fetchAPI(`/tramites/configuracion-pago?tramite_nombre=${encodeURIComponent(clave)}&estado=activo&order=DESC`);
    const data = Array.isArray(resp?.configuraciones)
      ? resp.configuraciones
      : (Array.isArray(resp?.data) ? resp.data : (Array.isArray(resp) ? resp : []));
    if (!data.length) {
      const n = (nombre || '').toLowerCase();
      if (n.includes('solicitud') && n.includes('ayuda') && (n.includes('técnica') || n.includes('tecnica'))) {
        return { requiere: true, tipo: 'fijo', montoFijo: 1000 };
      }
      return { requiere: false, tipo: 'gratis' };
    }

    const fijo = data.find(c => c.modalidad === 'fijo' && c.estado === 'activo');
    if (fijo) {
      return { requiere: true, tipo: 'fijo', montoFijo: parseFloat(fijo.monto_fijo || 0), anio: fijo.anio };
    }

    const porcentajeConfs = data.filter(c => c.modalidad === 'porcentaje' && c.estado === 'activo');
    if (porcentajeConfs.length) {
      const categoriasMap = {};
      porcentajeConfs.forEach(c => {
        const cat = c.categoria || 'General';
        if (!categoriasMap[cat]) categoriasMap[cat] = [];
        const p = parseFloat(c.porcentaje || 0);
        if (!categoriasMap[cat].includes(p)) categoriasMap[cat].push(p);
      });
      Object.keys(categoriasMap).forEach(cat => categoriasMap[cat].sort((a,b)=>a-b));
      return { requiere: true, tipo: 'porcentaje', categorias: categoriasMap };
    }

    return { requiere: false, tipo: 'gratis' };
  } catch (error) {
    console.error('Error al obtener configuración de pago:', error);
    return { requiere: false, tipo: 'gratis' };
  }
}

function renderModuloPagoParaNuevoTramite(config) {
  const moduloPago = document.getElementById('modulo-pago');
  if (!moduloPago) return;
  let contenido = '';
  if (config.tipo === 'fijo') {
    contenido = `
      <div class="card border-success">
        <div class="card-body">
          <h5 class="card-title">Módulo de Pago</h5>
          <div class="alert alert-info">Monto a pagar: <strong>${formatearMoneda(config.montoFijo)}</strong></div>
          <div class="row g-3">
            <div class="col-md-12 text-center" id="contenedor-boton-inicial-pago">
               <button type="button" class="btn btn-primary btn-lg" onclick="mostrarOpcionesPago()">
                  <i class="bi bi-credit-card-2-back"></i> Pagar
               </button>
            </div>

            <div id="contenedor-opciones-pago" class="col-md-12 d-none">
              <label class="form-label">Seleccione Método de Pago</label>
              <div class="d-grid gap-2">
                 <button type="button" class="btn btn-success btn-lg w-100 btn-payment-option" onclick="mostrarFormularioTarjeta('debito', ${config.montoFijo})">
                    <i class="bi bi-credit-card"></i> Débito
                 </button>
                 <button type="button" class="btn btn-warning btn-lg w-100 text-dark btn-payment-option" onclick="mostrarFormularioTarjeta('credito', ${config.montoFijo})">
                    <i class="bi bi-credit-card-2-front"></i> Crédito
                 </button>
                 <button type="button" class="btn btn-info btn-lg w-100 text-white btn-payment-option" onclick="redirigirMercadoPago(${config.montoFijo})">
                    <i class="bi bi-shop"></i> Mercado Pago
                 </button>
              </div>
            </div>
            
            <div id="formulario-tarjeta-container" class="col-12 d-none mt-3">
               <div class="card bg-light">
                  <div class="card-body">
                     <h6 class="card-title" id="titulo-formulario-tarjeta">Datos de la Tarjeta</h6>
                     <form id="form-tarjeta-pago">
                        <div class="mb-3">
                           <label for="nombre-titular" class="form-label">Nombre del Titular</label>
                           <input type="text" class="form-control" id="nombre-titular" required>
                        </div>
                        <div class="mb-3">
                           <label for="numero-tarjeta" class="form-label">Número de Tarjeta</label>
                           <input type="text" class="form-control" id="numero-tarjeta" maxlength="16" placeholder="XXXX XXXX XXXX XXXX" required>
                        </div>
                        <div class="row">
                           <div class="col-md-6 mb-3">
                              <label for="fecha-expiracion" class="form-label">Fecha Expiración</label>
                              <input type="text" class="form-control" id="fecha-expiracion" placeholder="MM/YY" maxlength="5" required>
                           </div>
                           <div class="col-md-6 mb-3">
                              <label for="codigo-seguridad" class="form-label">CVV</label>
                              <input type="password" class="form-control" id="codigo-seguridad" maxlength="3" placeholder="123" required>
                           </div>
                        </div>
                        <button type="button" class="btn btn-success w-100" onclick="procesarPagoTarjeta()">
                           <i class="bi bi-lock"></i> Pagar ${formatearMoneda(config.montoFijo)}
                        </button>
                     </form>
                  </div>
               </div>
            </div>

            <div class="col-md-12 mt-3 text-end">
                <button type="button" id="btn-enviar-con-pago" class="btn btn-secondary d-none">
                  <i class="bi bi-send"></i> Enviar Solicitud (Pago Procesado)
                </button>
            </div>
          </div>
        </div>
      </div>
    `;
  } else if (config.tipo === 'porcentaje') {
    const categorias = Object.keys(config.categorias);
    const opcionesCategoria = categorias.map(c => `<option value="${c}">${c}</option>`).join('');
    const opcionesPorcentaje = (cat) => (config.categorias[cat] || []).map(p => `<option value="${p}">${p}%</option>`).join('');
    const primeraCat = categorias[0];
    contenido = `
      <div class="card border-warning">
        <div class="card-body">
          <h5 class="card-title">Módulo de Pago</h5>
          <p class="mb-2">Permiso de Construcción: monto basado en porcentaje del presupuesto.</p>
          <div class="row g-3">
            <div class="col-md-4">
              <label class="form-label" for="categoria-construccion">Categoría</label>
              <select class="form-select" id="categoria-construccion">${opcionesCategoria}</select>
            </div>
            <div class="col-md-4">
              <label class="form-label" for="porcentaje-construccion">Porcentaje</label>
              <select class="form-select" id="porcentaje-construccion">${opcionesPorcentaje(primeraCat)}</select>
            </div>
            <div class="col-md-4">
              <label class="form-label" for="presupuesto-obra">Presupuesto de la obra (CLP)</label>
              <input type="number" min="0" id="presupuesto-obra" class="form-control" placeholder="Ej: 150000000" />
            </div>
          </div>
          <div class="mt-3">
            <button type="button" id="btn-enviar-con-pago" class="btn btn-success">
              <i class="bi bi-send"></i> Enviar Solicitud
            </button>
          </div>
        </div>
      </div>
    `;
  }

  moduloPago.innerHTML = contenido;
  moduloPago.dataset.configPago = JSON.stringify(config);

  const categoriaSel = document.getElementById('categoria-construccion');
  const porcentajeSel = document.getElementById('porcentaje-construccion');
  const presupuestoInp = document.getElementById('presupuesto-obra');

  function actualizarOpcionesPorcentaje() {
    const cat = categoriaSel.value;
    const opciones = (config.categorias[cat] || []).map(p => `<option value="${p}">${p}%</option>`).join('');
    porcentajeSel.innerHTML = opciones;
  }
  if (categoriaSel && porcentajeSel) categoriaSel.addEventListener('change', actualizarOpcionesPorcentaje);

  const btnEnviarConPago = document.getElementById('btn-enviar-con-pago');
  if (btnEnviarConPago) btnEnviarConPago.onclick = enviarSolicitudConPago;
}

/**
 * Muestra las opciones de pago (Débito, Crédito, Mercado Pago)
 */
function mostrarOpcionesPago() {
    const contenedorBoton = document.getElementById('contenedor-boton-inicial-pago');
    const contenedorOpciones = document.getElementById('contenedor-opciones-pago');
    
    if (contenedorBoton && contenedorOpciones) {
        contenedorBoton.classList.add('d-none');
        contenedorOpciones.classList.remove('d-none');
    }
}

/**
 * Muestra el formulario de tarjeta para débito o crédito
 * @param {string} tipo - 'debito' o 'credito'
 * @param {number} monto - Monto a pagar
 */
function mostrarFormularioTarjeta(tipo, monto) {
    const container = document.getElementById('formulario-tarjeta-container');
    const titulo = document.getElementById('titulo-formulario-tarjeta');
    
    if(container) {
        container.classList.remove('d-none');
        container.dataset.tipo = tipo; // Guardar el tipo (debito/credito)
        if(titulo) titulo.textContent = `Datos de Tarjeta de ${tipo === 'debito' ? 'Débito' : 'Crédito'}`;
        
        // Limpiar campos
        const form = document.getElementById('form-tarjeta-pago');
        if(form) form.reset();
        
        // Scroll al formulario
        container.scrollIntoView({ behavior: 'smooth' });
    }
}

/**
 * Redirige a Mercado Pago
 * @param {number} monto - Monto a pagar
 */
async function redirigirMercadoPago(montoInput) {
    try {
        mostrarCargando(true);
        let items = [];

        if (typeof montoInput === 'number' || (typeof montoInput === 'string' && !isNaN(parseFloat(montoInput)))) {
            // Caso: Nuevo Trámite (Monto fijo directo)
            const monto = parseFloat(montoInput);
            const tituloInput = document.getElementById('titulo');
            const titulo = tituloInput ? tituloInput.value : 'Nuevo Trámite';
            items.push({
                title: titulo,
                quantity: 1,
                unit_price: monto,
                currency_id: 'CLP'
            });
        } else {
            // Caso: Mis Pagos (Checkboxes)
            items = Array.from(document.querySelectorAll('#tabla-pagos input.chk-pago:checked'))
                .map(chk => {
                    const row = chk.closest('tr');
                    // Try to get description from row, fallback to generic
                    let desc = 'Pago Trámite';
                    if (row && row.cells.length > 1) {
                        desc = row.cells[1].textContent.trim();
                    }
                    const m = parseFloat(chk.getAttribute('data-monto'));
                    return {
                        title: desc,
                        quantity: 1,
                        unit_price: m,
                        currency_id: 'CLP',
                        id: chk.getAttribute('data-id')
                    };
                })
                .filter(item => item.unit_price > 0);
        }

        if (items.length === 0) {
            mostrarCargando(false);
            mostrarNotificacion('No hay pagos seleccionados o monto inválido.', 'warning');
            return;
        }

        const response = await fetchAPI('/mercado-pago/preferencias', {
            method: 'POST',
            body: { items: items }
        });

        if (response && response.init_point) {
            window.location.href = response.init_point;
        } else {
            throw new Error('No se recibió URL de pago');
        }

    } catch (error) {
        console.error('Error MP:', error);
        mostrarCargando(false);
        mostrarNotificacion('Error al iniciar Mercado Pago: ' + error.message, 'danger');
    }
}

/**
 * Procesa el pago con tarjeta (Simulado)
 */
function procesarPagoTarjeta() {
    mostrarCargando(true);
    setTimeout(() => {
        mostrarCargando(false);
        mostrarNotificacion('Pago procesado correctamente', 'success');
        const container = document.getElementById('formulario-tarjeta-container');
        const tipo = container ? (container.dataset.tipo || 'tarjeta') : 'tarjeta';
        if(container) container.classList.add('d-none');
        completarPagoExitoso(tipo);
    }, 500);
}

/**
 * Finaliza el proceso tras un pago exitoso
 * @param {string} metodo - Método utilizado
 */
async function completarPagoExitoso(metodo) {
    const moduloPago = document.getElementById('modulo-pago');
    
    // Marcar visualmente como pagado
    moduloPago.innerHTML = `
        <div class="alert alert-success">
            <h4><i class="bi bi-check-circle-fill"></i> Pago Realizado con Éxito</h4>
            <p>Método: ${metodo === 'mercado_pago' ? 'Mercado Pago' : 'Tarjeta Bancaria'}</p>
            <p>Puede proceder a enviar su solicitud.</p>
        </div>
        <div class="d-grid gap-2">
             <button type="button" class="btn btn-success btn-lg" onclick="enviarSolicitudPagada('${metodo}')">
               <i class="bi bi-send-check"></i> Finalizar y Enviar Solicitud
             </button>
        </div>
    `;
}

/**
 * Envía la solicitud final con el pago registrado
 * @param {string} metodoPago 
 */
async function enviarSolicitudPagada(metodoPago) {
    try {
        mostrarCargando(true);
        const tipoSelect = document.getElementById('tipo-tramite');
        const tipoNombre = tipoSelect.options[tipoSelect.selectedIndex]?.text || '';
        const titulo = document.getElementById('titulo').value.trim();
        const descripcion = document.getElementById('descripcion').value.trim();
        const departamentoId = document.getElementById('departamento').value;
        
        // Obtener configuración original guardada
        const moduloPago = document.getElementById('modulo-pago');
        const config = JSON.parse(moduloPago.dataset.configPago || '{}');

        const normalizarTipo = (nombre) => {
             const n = (nombre || '').toLowerCase();
             if (n.includes('licencia') && n.includes('conduc')) return 'licencia';
             if (n.includes('permiso') || n.includes('construcción') || n.includes('construccion')) return 'permiso';
             if (n.includes('certificado')) return 'certificado';
             if (n.includes('registro')) return 'registro';
             if (n.includes('solicitud')) return 'solicitud';
             if (n.includes('reclamo')) return 'reclamo';
             return 'otro';
        };

        const tipo = normalizarTipo(tipoNombre);

        // Normalizar método de pago para backend
        let metodoPagoNormalizado = metodoPago;
        if (metodoPago === 'debito') metodoPagoNormalizado = 'tarjeta_debito';
        else if (metodoPago === 'credito') metodoPagoNormalizado = 'tarjeta_credito';
        else if (metodoPago === 'tarjeta') metodoPagoNormalizado = 'tarjeta_credito';

        const nuevoTramite = {
            titulo,
            descripcion,
            tipo,
            departamento_id: parseInt(departamentoId),
            requiere_pago: true,
            monto: config.montoFijo || 0,
            estado_pago: 'completado',
            metodo_pago: metodoPagoNormalizado,
            fecha_pago: new Date().toISOString()
        };

        const creado = await fetchAPI('/tramites', { method: 'POST', body: JSON.stringify(nuevoTramite) });
        const tramite = creado?.tramite || creado;

        const usuario = await fetchAPI('/usuarios/perfil');
        const ciudadanoId = usuario?.id;
        const cuerpoPago = {
             monto: config.montoFijo || 0,
             metodo_pago: metodoPagoNormalizado,
             referencia_externa: 'PAGO-ONLINE-' + Date.now(),
             tramite_id: tramite.id,
             ciudadano_id: ciudadanoId
        };
        await fetchAPI('/pagos', { method: 'POST', body: JSON.stringify(cuerpoPago) });

        mostrarNotificacion('Trámite iniciado y pago registrado correctamente', 'success');
        await cargarPortalCiudadano();

    } catch (error) {
        console.error('Error al enviar solicitud pagada:', error);
        mostrarNotificacion('Error: ' + error.message, 'danger');
    } finally {
        mostrarCargando(false);
    }
}

async function enviarSolicitudConPago() {
  try {
    mostrarCargando(true);
    const tipoSelect = document.getElementById('tipo-tramite');
    const tipoNombre = tipoSelect.options[tipoSelect.selectedIndex]?.text || '';
    const normalizarTipo = (nombre) => {
      const n = (nombre || '').toLowerCase();
      if (n.includes('licencia') && n.includes('conduc')) return 'licencia';
      if (n.includes('permiso') || n.includes('construcción') || n.includes('construccion')) return 'permiso';
      if (n.includes('certificado')) return 'certificado';
      if (n.includes('registro')) return 'registro';
      if (n.includes('solicitud')) return 'solicitud';
      if (n.includes('reclamo')) return 'reclamo';
      return 'otro';
    };
    const tipo = normalizarTipo(tipoNombre);
    const titulo = document.getElementById('titulo').value.trim();
    const descripcion = document.getElementById('descripcion').value.trim();
    const departamentoId = parseInt(document.getElementById('departamento').value);

    // Flujo legacy para porcentajes u otros que no usan el nuevo selector
    const metodoPago = document.getElementById('metodo-pago')?.value || 'otro';
    const referenciaExterna = document.getElementById('referencia-externa')?.value || null;

    const moduloPago = document.getElementById('modulo-pago');
    let monto = 0;
    const config = JSON.parse(moduloPago?.dataset?.configPago || '{}');
    if (config.tipo === 'fijo') {
      monto = parseFloat(config.montoFijo || 0);
    } else {
      const presupuesto = parseFloat(document.getElementById('presupuesto-obra')?.value || '0');
      const porcentaje = parseFloat(document.getElementById('porcentaje-construccion')?.value || '0');
      if (!presupuesto || !porcentaje) {
        mostrarNotificacion('Ingrese presupuesto y porcentaje válidos', 'warning');
        mostrarCargando(false);
        return;
      }
      monto = presupuesto * (porcentaje / 100);
    }

    const nuevoTramite = {
      titulo,
      descripcion,
      tipo: tipoNombre,
      departamento_id: departamentoId,
      requiere_pago: true,
      monto
    };
    
    // Si estamos editando y llegamos hasta aquí (no debería, el flujo de pago no está para edición si ya se creó)
    const formNode = document.getElementById('form-nuevo-tramite');
    const idEdicion = formNode?.dataset?.id;
    let creado;
    
    if (idEdicion) {
        creado = await fetchAPI(`/tramites/${idEdicion}`, { method: 'PUT', body: JSON.stringify(nuevoTramite) });
    } else {
        creado = await fetchAPI('/tramites', { method: 'POST', body: JSON.stringify(nuevoTramite) });
    }
    
    const tramite = creado?.tramite || creado;

    const fileInput = document.getElementById('documentos-tramite');
    if (fileInput && fileInput.files.length > 0) {
        await subirDocumentosTramite(tramite.id, fileInput.files);
    }

    const usuario = await fetchAPI('/usuarios/perfil');
    const ciudadanoId = usuario?.id;
    const cuerpoPago = {
      monto,
      metodo_pago: metodoPago,
      referencia_externa: referenciaExterna,
      tramite_id: tramite.id,
      ciudadano_id: ciudadanoId
    };
    
    if (!idEdicion) {
      await fetchAPI('/pagos', { method: 'POST', body: JSON.stringify(cuerpoPago) });
      mostrarNotificacion('Solicitud enviada y pago registrado correctamente', 'success');
    } else {
      mostrarNotificacion('Trámite actualizado correctamente', 'success');
    }
    await cargarPortalCiudadano();
  } catch (err) {
    console.error('Error al enviar solicitud con pago:', err);
    mostrarNotificacion('Error al enviar solicitud: ' + err.message, 'danger');
  } finally {
    mostrarCargando(false);
  }
}

async function subirDocumentosTramite(tramiteId, files) {
    const lim = Math.min(files.length, 7);
    for (let i = 0; i < lim; i++) {
        const file = files[i];
        
        if (file.size > 5 * 1024 * 1024) {
            mostrarNotificacion(`El archivo ${file.name} supera los 5MB permitidos.`, 'warning');
            continue;
        }

        const formData = new FormData();
        formData.append('documento', file);
        formData.append('tipo', 'Adjunto del Ciudadano');

        try {
            const token = localStorage.getItem('token');
            const resp = await fetch(`/api/tramites/${tramiteId}/documentos`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            if (!resp.ok) console.error("Error al subir documento:", file.name);
        } catch (error) {
            console.error('Excepción al subir documento', error);
        }
    }
}

async function editarTramiteCiudadano(tramiteId) {
    try {
        mostrarCargando(true);
        const tramite = await fetchAPI(`/tramites/${tramiteId}`);
        await mostrarFormularioNuevoTramite(tramite);
    } catch (error) {
        console.error('Error al cargar trámite para editar:', error);
        mostrarNotificacion('No se pudo cargar la información del trámite', 'danger');
    } finally {
        mostrarCargando(false);
    }
}

