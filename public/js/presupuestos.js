/**
 * Módulo para la gestión de presupuestos municipales
 * Este archivo contiene las funciones para administrar presupuestos, partidas y ejecución presupuestaria
 */

/**
 * Función para cargar la lista de presupuestos
 */
async function cargarPresupuestos() {
    try {
        mostrarCargando(true);
        
        const presupuestos = await fetchAPI('/presupuestos');
        
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="row mb-4">
                <div class="col-12 d-flex justify-content-between align-items-center">
                    <h2>Gestión de Presupuestos</h2>
                    <button class="btn btn-primary" onclick="mostrarFormularioPresupuesto()">
                        <i class="bi bi-plus-circle"></i> Nuevo Presupuesto
                    </button>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <div class="row">
                        <div class="col-md-6">
                            <input type="text" class="form-control" id="buscar-presupuesto" placeholder="Buscar presupuesto...">
                        </div>
                        <div class="col-md-3">
                            <select class="form-select" id="filtro-anio">
                                <option value="">Todos los años</option>
                                ${obtenerAniosFiltro().map(anio => `<option value="${anio}">${anio}</option>`).join('')}
                            </select>
                        </div>
                        <div class="col-md-3">
                            <select class="form-select" id="filtro-estado">
                                <option value="">Todos los estados</option>
                                <option value="activo">Activo</option>
                                <option value="cerrado">Cerrado</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-striped table-hover">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Año Fiscal</th>
                                    <th>Monto Total</th>
                                    <th>Monto Ejecutado</th>
                                    <th>% Ejecución</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody id="tabla-presupuestos">
                                ${presupuestos.map(presupuesto => {
                                    const porcentajeEjecucion = (presupuesto.monto_ejecutado / presupuesto.monto_total) * 100;
                                    return `
                                        <tr>
                                            <td>${presupuesto.id}</td>
                                            <td>${presupuesto.anio_fiscal}</td>
                                            <td>${formatearMoneda(presupuesto.monto_total)}</td>
                                            <td>${formatearMoneda(presupuesto.monto_ejecutado)}</td>
                                            <td>
                                                <div class="progress">
                                                    <div class="progress-bar ${porcentajeEjecucion > 90 ? 'bg-danger' : porcentajeEjecucion > 70 ? 'bg-warning' : 'bg-success'}" 
                                                         role="progressbar" 
                                                         style="width: ${porcentajeEjecucion}%" 
                                                         aria-valuenow="${porcentajeEjecucion}" 
                                                         aria-valuemin="0" 
                                                         aria-valuemax="100">
                                                        ${porcentajeEjecucion.toFixed(1)}%
                                                    </div>
                                                </div>
                                            </td>
                                            <td><span class="estado-${presupuesto.estado}">${presupuesto.estado}</span></td>
                                            <td>
                                                <button class="btn btn-sm btn-info" onclick="verDetallePresupuesto(${presupuesto.id})">
                                                    <i class="bi bi-eye"></i>
                                                </button>
                                                ${presupuesto.estado === 'activo' ? `
                                                    <button class="btn btn-sm btn-primary" onclick="editarPresupuesto(${presupuesto.id})">
                                                        <i class="bi bi-pencil"></i>
                                                    </button>
                                                    <button class="btn btn-sm btn-warning" onclick="cambiarEstadoPresupuesto(${presupuesto.id}, 'cerrado')">
                                                        <i class="bi bi-lock"></i>
                                                    </button>
                                                ` : ''}
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        
        // Agregar eventos para filtros
        const buscarPresupuesto = document.getElementById('buscar-presupuesto');
        const filtroAnio = document.getElementById('filtro-anio');
        const filtroEstado = document.getElementById('filtro-estado');
        
        if (buscarPresupuesto && filtroAnio && filtroEstado) {
            buscarPresupuesto.addEventListener('input', filtrarPresupuestos);
            filtroAnio.addEventListener('change', filtrarPresupuestos);
            filtroEstado.addEventListener('change', filtrarPresupuestos);
        }
        
    } catch (error) {
        console.error('Error al cargar presupuestos:', error);
        mostrarNotificacion('Error al cargar presupuestos: ' + error.message, 'danger');
    } finally {
        mostrarCargando(false);
    }
}

/**
 * Función para obtener años para el filtro
 * @returns {Array} - Array de años para el filtro
 */
function obtenerAniosFiltro() {
    const anioActual = new Date().getFullYear();
    const anios = [];
    
    // Incluir 3 años anteriores, el actual y 2 años futuros
    for (let i = anioActual - 3; i <= anioActual + 2; i++) {
        anios.push(i);
    }
    
    return anios;
}

/**
 * Función para filtrar presupuestos según criterios de búsqueda
 */
function filtrarPresupuestos() {
    const busqueda = document.getElementById('buscar-presupuesto').value.toLowerCase();
    const anio = document.getElementById('filtro-anio').value;
    const estado = document.getElementById('filtro-estado').value;
    
    const filas = document.querySelectorAll('#tabla-presupuestos tr');
    
    filas.forEach(fila => {
        const anioFiscal = fila.cells[1].textContent;
        const estadoPresupuesto = fila.cells[5].textContent.toLowerCase();
        
        const coincideBusqueda = anioFiscal.includes(busqueda);
        const coincideAnio = anio === '' || anioFiscal === anio;
        const coincideEstado = estado === '' || estadoPresupuesto === estado;
        
        if (coincideBusqueda && coincideAnio && coincideEstado) {
            fila.style.display = '';
        } else {
            fila.style.display = 'none';
        }
    });
}

/**
 * Función para mostrar el formulario de creación/edición de presupuesto
 * @param {number} presupuestoId - ID del presupuesto a editar (opcional)
 */
async function mostrarFormularioPresupuesto(presupuestoId = null) {
    try {
        mostrarCargando(true);
        
        let presupuesto = {
            codigo: '',
            nombre: '',
            descripcion: '',
            anio_fiscal: new Date().getFullYear(),
            monto_total: 0,
            fecha_inicio: '',
            fecha_fin: '',
            estado: 'planificacion',
            notas: '',
            departamento_id: null,
            responsable_id: null
        };
        
        let titulo = 'Nuevo Presupuesto';
        let accion = 'crear';
        
        if (presupuestoId) {
            presupuesto = await fetchAPI(`/presupuestos/${presupuestoId}`);
            titulo = 'Editar Presupuesto';
            accion = 'actualizar';
        }
        
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="row mb-4">
                <div class="col-12">
                    <button class="btn btn-outline-secondary mb-3" onclick="cargarPresupuestos()">
                        <i class="bi bi-arrow-left"></i> Volver a la lista
                    </button>
                    <h2>${titulo}</h2>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-8 offset-md-2">
                    <div class="card">
                        <div class="card-body">
                            <form id="form-presupuesto">
                                <input type="hidden" id="presupuesto-id" value="${presupuesto.id || ''}">
                                <input type="hidden" id="accion" value="${accion}">
                                
                                <div class="row mb-3">
                                    <div class="col-md-4">
                                        <label for="codigo" class="form-label">Código *</label>
                                        <input type="text" class="form-control" id="codigo" value="${presupuesto.codigo}" required>
                                    </div>
                                    <div class="col-md-8">
                                        <label for="nombre" class="form-label">Nombre *</label>
                                        <input type="text" class="form-control" id="nombre" value="${presupuesto.nombre}" required>
                                    </div>
                                </div>
                                
                                <div class="row mb-3">
                                    <div class="col-md-4">
                                        <label for="anio-fiscal" class="form-label">Año Fiscal *</label>
                                        <select class="form-select" id="anio-fiscal" required ${accion === 'actualizar' ? 'disabled' : ''}>
                                            ${obtenerAniosFiltro().map(anio => `
                                                <option value="${anio}" ${presupuesto.anio_fiscal == anio ? 'selected' : ''}>
                                                    ${anio}
                                                </option>
                                            `).join('')}
                                        </select>
                                    </div>
                                    <div class="col-md-4">
                                        <label for="monto-total" class="form-label">Monto Total *</label>
                                        <div class="input-group">
                                            <span class="input-group-text">$</span>
                                            <input type="number" class="form-control" id="monto-total" value="${presupuesto.monto_total}" min="0" step="0.01" required>
                                        </div>
                                    </div>
                                    <div class="col-md-4">
                                        <label for="estado" class="form-label">Estado *</label>
                                        <select class="form-select" id="estado" required>
                                            <option value="planificacion" ${presupuesto.estado === 'planificacion' ? 'selected' : ''}>Planificación</option>
                                            <option value="aprobado" ${presupuesto.estado === 'aprobado' ? 'selected' : ''}>Aprobado</option>
                                            <option value="en_ejecucion" ${presupuesto.estado === 'en_ejecucion' ? 'selected' : ''}>En Ejecución</option>
                                            <option value="cerrado" ${presupuesto.estado === 'cerrado' ? 'selected' : ''}>Cerrado</option>
                                            <option value="anulado" ${presupuesto.estado === 'anulado' ? 'selected' : ''}>Anulado</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <label for="fecha-inicio" class="form-label">Fecha de Inicio *</label>
                                        <input type="date" class="form-control" id="fecha-inicio" value="${presupuesto.fecha_inicio}" required>
                                    </div>
                                    <div class="col-md-6">
                                        <label for="fecha-fin" class="form-label">Fecha de Fin *</label>
                                        <input type="date" class="form-control" id="fecha-fin" value="${presupuesto.fecha_fin}" required>
                                    </div>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="descripcion" class="form-label">Descripción</label>
                                    <textarea class="form-control" id="descripcion" rows="3">${presupuesto.descripcion || ''}</textarea>
                                </div>
                                
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <label for="departamento-id" class="form-label">Departamento</label>
                                        <select class="form-select" id="departamento-id">
                                            <option value="">Seleccione un departamento</option>
                                            <!-- Las opciones se cargarán dinámicamente -->
                                        </select>
                                    </div>
                                    <div class="col-md-6">
                                        <label for="responsable-id" class="form-label">Responsable *</label>
                                        <select class="form-select" id="responsable-id" required>
                                            <option value="">Seleccione un responsable</option>
                                            <!-- Las opciones se cargarán dinámicamente -->
                                        </select>
                                    </div>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="notas" class="form-label">Notas</label>
                                    <textarea class="form-control" id="notas" rows="3">${presupuesto.notas || ''}</textarea>
                                </div>
                                
                                <div class="d-grid gap-2">
                                    <button type="submit" class="btn btn-primary">
                                        <i class="bi bi-save"></i> Guardar
                                    </button>
                                    <button type="button" class="btn btn-outline-secondary" onclick="cargarPresupuestos()">
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
        const formPresupuesto = document.getElementById('form-presupuesto');
        formPresupuesto.addEventListener('submit', guardarPresupuesto);
        
    } catch (error) {
        console.error('Error al cargar formulario de presupuesto:', error);
        mostrarNotificacion('Error al cargar formulario: ' + error.message, 'danger');
    } finally {
        mostrarCargando(false);
    }
}

/**
 * Función para guardar un presupuesto (crear o actualizar)
 * @param {Event} e - Evento del formulario
 */
async function guardarPresupuesto(e) {
    e.preventDefault();
    
    try {
        mostrarCargando(true);
        
        const presupuestoId = document.getElementById('presupuesto-id').value;
        const accion = document.getElementById('accion').value;
        
        const presupuesto = {
            codigo: document.getElementById('codigo').value,
            nombre: document.getElementById('nombre').value,
            descripcion: document.getElementById('descripcion').value,
            anio_fiscal: parseInt(document.getElementById('anio-fiscal').value),
            monto_total: parseFloat(document.getElementById('monto-total').value),
            fecha_inicio: document.getElementById('fecha-inicio').value,
            fecha_fin: document.getElementById('fecha-fin').value,
            estado: document.getElementById('estado').value,
            notas: document.getElementById('notas').value || null,
            departamento_id: document.getElementById('departamento-id').value || null,
            responsable_id: document.getElementById('responsable-id').value || null
        };
        
        let respuesta;
        
        if (accion === 'crear') {
            respuesta = await fetchAPI('/presupuestos', {
                method: 'POST',
                body: JSON.stringify(presupuesto)
            });
            mostrarNotificacion('Presupuesto creado correctamente', 'success');
        } else {
            respuesta = await fetchAPI(`/presupuestos/${presupuestoId}`, {
                method: 'PUT',
                body: JSON.stringify(presupuesto)
            });
            mostrarNotificacion('Presupuesto actualizado correctamente', 'success');
        }
        
        cargarPresupuestos();
        
    } catch (error) {
        console.error('Error al guardar presupuesto:', error);
        mostrarNotificacion('Error al guardar presupuesto: ' + error.message, 'danger');
    } finally {
        mostrarCargando(false);
    }
}

/**
 * Función para editar un presupuesto
 * @param {number} presupuestoId - ID del presupuesto a editar
 */
function editarPresupuesto(presupuestoId) {
    mostrarFormularioPresupuesto(presupuestoId);
}

/**
 * Función para ver el detalle de un presupuesto
 * @param {number} presupuestoId - ID del presupuesto
 */
async function verDetallePresupuesto(presupuestoId) {
    try {
        mostrarCargando(true);
        
        const presupuesto = await fetchAPI(`/presupuestos/${presupuestoId}`);
        const partidas = await fetchAPI(`/presupuestos/${presupuestoId}/partidas`);
        
        const porcentajeEjecucion = (presupuesto.monto_ejecutado / presupuesto.monto_total) * 100;
        
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="row mb-4">
                <div class="col-12">
                    <button class="btn btn-outline-secondary mb-3" onclick="cargarPresupuestos()">
                        <i class="bi bi-arrow-left"></i> Volver a la lista
                    </button>
                    <h2>Detalle del Presupuesto</h2>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-10 offset-md-1">
                    <div class="card mb-4">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="mb-0">Información General</h5>
                            <div>
                                ${presupuesto.estado === 'activo' ? `
                                    <button class="btn btn-primary" onclick="editarPresupuesto(${presupuesto.id})">
                                        <i class="bi bi-pencil"></i> Editar
                                    </button>
                                    <button class="btn btn-warning" onclick="cambiarEstadoPresupuesto(${presupuesto.id}, 'cerrado')">
                                        <i class="bi bi-lock"></i> Cerrar Presupuesto
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">ID:</div>
                                <div class="col-md-8">${presupuesto.id}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Año Fiscal:</div>
                                <div class="col-md-8">${presupuesto.anio_fiscal}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Monto Total:</div>
                                <div class="col-md-8">${formatearMoneda(presupuesto.monto_total)}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Monto Ejecutado:</div>
                                <div class="col-md-8">${formatearMoneda(presupuesto.monto_ejecutado)}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Porcentaje de Ejecución:</div>
                                <div class="col-md-8">
                                    <div class="progress">
                                        <div class="progress-bar ${porcentajeEjecucion > 90 ? 'bg-danger' : porcentajeEjecucion > 70 ? 'bg-warning' : 'bg-success'}" 
                                             role="progressbar" 
                                             style="width: ${porcentajeEjecucion}%" 
                                             aria-valuenow="${porcentajeEjecucion}" 
                                             aria-valuemin="0" 
                                             aria-valuemax="100">
                                            ${porcentajeEjecucion.toFixed(1)}%
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Estado:</div>
                                <div class="col-md-8"><span class="estado-${presupuesto.estado}">${presupuesto.estado}</span></div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Descripción:</div>
                                <div class="col-md-8">${presupuesto.descripcion || 'Sin descripción'}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="card mb-4">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="mb-0">Partidas Presupuestarias</h5>
                            ${presupuesto.estado === 'activo' ? `
                                <button class="btn btn-primary" onclick="mostrarFormularioPartida(${presupuesto.id})">
                                    <i class="bi bi-plus-circle"></i> Nueva Partida
                                </button>
                            ` : ''}
                        </div>
                        <div class="card-body">
                            ${partidas.length === 0 ? `
                                <p>No hay partidas presupuestarias registradas.</p>
                            ` : `
                                <div class="table-responsive">
                                    <table class="table table-striped table-hover">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Nombre</th>
                                                <th>Categoría</th>
                                                <th>Monto Asignado</th>
                                                <th>Monto Ejecutado</th>
                                                <th>% Ejecución</th>
                                                <th>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${partidas.map(partida => {
                                                const porcentajeEjecucionPartida = (partida.monto_ejecutado / partida.monto_asignado) * 100;
                                                return `
                                                    <tr>
                                                        <td>${partida.id}</td>
                                                        <td>${partida.nombre}</td>
                                                        <td>${partida.categoria}</td>
                                                        <td>${formatearMoneda(partida.monto_asignado)}</td>
                                                        <td>${formatearMoneda(partida.monto_ejecutado)}</td>
                                                        <td>
                                                            <div class="progress">
                                                                <div class="progress-bar ${porcentajeEjecucionPartida > 90 ? 'bg-danger' : porcentajeEjecucionPartida > 70 ? 'bg-warning' : 'bg-success'}" 
                                                                     role="progressbar" 
                                                                     style="width: ${porcentajeEjecucionPartida}%" 
                                                                     aria-valuenow="${porcentajeEjecucionPartida}" 
                                                                     aria-valuemin="0" 
                                                                     aria-valuemax="100">
                                                                    ${porcentajeEjecucionPartida.toFixed(1)}%
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <button class="btn btn-sm btn-info" onclick="verDetallePartida(${partida.id})">
                                                                <i class="bi bi-eye"></i>
                                                            </button>
                                                            ${presupuesto.estado === 'activo' ? `
                                                                <button class="btn btn-sm btn-primary" onclick="editarPartida(${partida.id})">
                                                                    <i class="bi bi-pencil"></i>
                                                                </button>
                                                            ` : ''}
                                                        </td>
                                                    </tr>
                                                `;
                                            }).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            `}
                        </div>
                    </div>
                    
                    <div class="card">
                        <div class="card-header">
                            <h5>Proyectos Asociados</h5>
                        </div>
                        <div class="card-body" id="proyectos-presupuesto">
                            <div class="text-center">
                                <div class="spinner-border text-primary" role="status">
                                    <span class="visually-hidden">Cargando...</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Cargar proyectos asociados al presupuesto
        cargarProyectosPresupuesto(presupuestoId);
        
    } catch (error) {
        console.error('Error al cargar detalle del presupuesto:', error);
        mostrarNotificacion('Error al cargar detalle: ' + error.message, 'danger');
    } finally {
        mostrarCargando(false);
    }
}

/**
 * Función para cargar los proyectos asociados a un presupuesto
 * @param {number} presupuestoId - ID del presupuesto
 */
async function cargarProyectosPresupuesto(presupuestoId) {
    try {
        const proyectos = await fetchAPI(`/presupuestos/${presupuestoId}/proyectos`);
        
        const proyectosContainer = document.getElementById('proyectos-presupuesto');
        
        if (proyectos.length === 0) {
            proyectosContainer.innerHTML = '<p>No hay proyectos asociados a este presupuesto.</p>';
            return;
        }
        
        proyectosContainer.innerHTML = `
            <div class="table-responsive">
                <table class="table table-striped table-hover">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nombre</th>
                            <th>Departamento</th>
                            <th>Presupuesto</th>
                            <th>Ejecutado</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${proyectos.map(proyecto => `
                            <tr>
                                <td>${proyecto.id}</td>
                                <td>${proyecto.nombre}</td>
                                <td>${proyecto.departamento?.nombre || 'N/A'}</td>
                                <td>${formatearMoneda(proyecto.presupuesto_asignado)}</td>
                                <td>${formatearMoneda(proyecto.presupuesto_ejecutado)}</td>
                                <td><span class="estado-${proyecto.estado}">${proyecto.estado}</span></td>
                                <td>
                                    <button class="btn btn-sm btn-info" onclick="verDetalleProyecto(${proyecto.id})">
                                        <i class="bi bi-eye"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
    } catch (error) {
        console.error('Error al cargar proyectos del presupuesto:', error);
        const proyectosContainer = document.getElementById('proyectos-presupuesto');
        proyectosContainer.innerHTML = '<div class="alert alert-danger">Error al cargar proyectos</div>';
    }
}

/**
 * Función para cambiar el estado de un presupuesto
 * @param {number} presupuestoId - ID del presupuesto
 * @param {string} nuevoEstado - Nuevo estado (activo/cerrado)
 */
async function cambiarEstadoPresupuesto(presupuestoId, nuevoEstado) {
    try {
        mostrarCargando(true);
        
        await fetchAPI(`/presupuestos/${presupuestoId}/estado`, {
            method: 'PUT',
            body: JSON.stringify({ estado: nuevoEstado })
        });
        
        mostrarNotificacion(`Presupuesto ${nuevoEstado === 'activo' ? 'activado' : 'cerrado'} correctamente`, 'success');
        cargarPresupuestos();
        
    } catch (error) {
        console.error('Error al cambiar estado del presupuesto:', error);
        mostrarNotificacion('Error al cambiar estado: ' + error.message, 'danger');
    } finally {
        mostrarCargando(false);
    }
}

/**
 * Función para mostrar el formulario de creación/edición de partida presupuestaria
 * @param {number} presupuestoId - ID del presupuesto (para nueva partida)
 * @param {number} partidaId - ID de la partida a editar (opcional)
 */
async function mostrarFormularioPartida(presupuestoId, partidaId = null) {
    try {
        mostrarCargando(true);
        
        let partida = {
            nombre: '',
            categoria: 'operativa',
            monto_asignado: 0,
            descripcion: ''
        };
        
        let presupuesto = null;
        let titulo = 'Nueva Partida Presupuestaria';
        let accion = 'crear';
        
        if (partidaId) {
            partida = await fetchAPI(`/partidas/${partidaId}`);
            presupuestoId = partida.presupuesto_id;
            titulo = 'Editar Partida Presupuestaria';
            accion = 'actualizar';
        }
        
        presupuesto = await fetchAPI(`/presupuestos/${presupuestoId}`);
        
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="row mb-4">
                <div class="col-12">
                    <button class="btn btn-outline-secondary mb-3" onclick="verDetallePresupuesto(${presupuestoId})">
                        <i class="bi bi-arrow-left"></i> Volver al presupuesto
                    </button>
                    <h2>${titulo}</h2>
                    <p>Presupuesto: ${presupuesto.anio_fiscal} - ${formatearMoneda(presupuesto.monto_total)}</p>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-8 offset-md-2">
                    <div class="card">
                        <div class="card-body">
                            <form id="form-partida">
                                <input type="hidden" id="partida-id" value="${partida.id || ''}">
                                <input type="hidden" id="presupuesto-id" value="${presupuestoId}">
                                <input type="hidden" id="accion" value="${accion}">
                                
                                <div class="mb-3">
                                    <label for="nombre" class="form-label">Nombre</label>
                                    <input type="text" class="form-control" id="nombre" value="${partida.nombre}" required>
                                </div>
                                
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <label for="categoria" class="form-label">Categoría</label>
                                        <select class="form-select" id="categoria" required>
                                            <option value="operativa" ${partida.categoria === 'operativa' ? 'selected' : ''}>Operativa</option>
                                            <option value="inversion" ${partida.categoria === 'inversion' ? 'selected' : ''}>Inversión</option>
                                            <option value="social" ${partida.categoria === 'social' ? 'selected' : ''}>Social</option>
                                            <option value="administrativa" ${partida.categoria === 'administrativa' ? 'selected' : ''}>Administrativa</option>
                                        </select>
                                    </div>
                                    <div class="col-md-6">
                                        <label for="monto-asignado" class="form-label">Monto Asignado</label>
                                        <div class="input-group">
                                            <span class="input-group-text">$</span>
                                            <input type="number" class="form-control" id="monto-asignado" value="${partida.monto_asignado}" min="0" step="0.01" required>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="descripcion" class="form-label">Descripción</label>
                                    <textarea class="form-control" id="descripcion" rows="3">${partida.descripcion || ''}</textarea>
                                </div>
                                
                                <div class="d-grid gap-2">
                                    <button type="submit" class="btn btn-primary">
                                        <i class="bi bi-save"></i> Guardar
                                    </button>
                                    <button type="button" class="btn btn-outline-secondary" onclick="verDetallePresupuesto(${presupuestoId})">
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
        const formPartida = document.getElementById('form-partida');
        formPartida.addEventListener('submit', guardarPartida);
        
    } catch (error) {
        console.error('Error al cargar formulario de partida:', error);
        mostrarNotificacion('Error al cargar formulario: ' + error.message, 'danger');
    } finally {
        mostrarCargando(false);
    }
}

/**
 * Función para guardar una partida presupuestaria (crear o actualizar)
 * @param {Event} e - Evento del formulario
 */
async function guardarPartida(e) {
    e.preventDefault();
    
    try {
        mostrarCargando(true);
        
        const partidaId = document.getElementById('partida-id').value;
        const presupuestoId = document.getElementById('presupuesto-id').value;
        const accion = document.getElementById('accion').value;
        
        const partida = {
            nombre: document.getElementById('nombre').value,
            categoria: document.getElementById('categoria').value,
            monto_asignado: parseFloat(document.getElementById('monto-asignado').value),
            descripcion: document.getElementById('descripcion').value,
            presupuesto_id: parseInt(presupuestoId)
        };
        
        let respuesta;
        
        if (accion === 'crear') {
            respuesta = await fetchAPI('/partidas', {
                method: 'POST',
                body: JSON.stringify(partida)
            });
            mostrarNotificacion('Partida creada correctamente', 'success');
        } else {
            respuesta = await fetchAPI(`/partidas/${partidaId}`, {
                method: 'PUT',
                body: JSON.stringify(partida)
            });
            mostrarNotificacion('Partida actualizada correctamente', 'success');
        }
        
        verDetallePresupuesto(presupuestoId);
        
    } catch (error) {
        console.error('Error al guardar partida:', error);
        mostrarNotificacion('Error al guardar partida: ' + error.message, 'danger');
    } finally {
        mostrarCargando(false);
    }
}

/**
 * Función para editar una partida presupuestaria
 * @param {number} partidaId - ID de la partida a editar
 */
function editarPartida(partidaId) {
    mostrarFormularioPartida(null, partidaId);
}

/**
 * Función para ver el detalle de una partida presupuestaria
 * @param {number} partidaId - ID de la partida
 */
async function verDetallePartida(partidaId) {
    try {
        mostrarCargando(true);
        
        const partida = await fetchAPI(`/partidas/${partidaId}`);
        const presupuesto = await fetchAPI(`/presupuestos/${partida.presupuesto_id}`);
        
        const porcentajeEjecucion = (partida.monto_ejecutado / partida.monto_asignado) * 100;
        
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="row mb-4">
                <div class="col-12">
                    <button class="btn btn-outline-secondary mb-3" onclick="verDetallePresupuesto(${partida.presupuesto_id})">
                        <i class="bi bi-arrow-left"></i> Volver al presupuesto
                    </button>
                    <h2>Detalle de Partida Presupuestaria</h2>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-8 offset-md-2">
                    <div class="card mb-4">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="mb-0">Información de la Partida</h5>
                            <div>
                                ${presupuesto.estado === 'activo' ? `
                                    <button class="btn btn-primary" onclick="editarPartida(${partida.id})">
                                        <i class="bi bi-pencil"></i> Editar
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">ID:</div>
                                <div class="col-md-8">${partida.id}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Nombre:</div>
                                <div class="col-md-8">${partida.nombre}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Categoría:</div>
                                <div class="col-md-8">${partida.categoria}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Presupuesto:</div>
                                <div class="col-md-8">${presupuesto.anio_fiscal}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Monto Asignado:</div>
                                <div class="col-md-8">${formatearMoneda(partida.monto_asignado)}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Monto Ejecutado:</div>
                                <div class="col-md-8">${formatearMoneda(partida.monto_ejecutado)}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Porcentaje de Ejecución:</div>
                                <div class="col-md-8">
                                    <div class="progress">
                                        <div class="progress-bar ${porcentajeEjecucion > 90 ? 'bg-danger' : porcentajeEjecucion > 70 ? 'bg-warning' : 'bg-success'}" 
                                             role="progressbar" 
                                             style="width: ${porcentajeEjecucion}%" 
                                             aria-valuenow="${porcentajeEjecucion}" 
                                             aria-valuemin="0" 
                                             aria-valuemax="100">
                                            ${porcentajeEjecucion.toFixed(1)}%
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Descripción:</div>
                                <div class="col-md-8">${partida.descripcion || 'Sin descripción'}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="card">
                        <div class="card-header">
                            <h5>Movimientos de la Partida</h5>
                        </div>
                        <div class="card-body" id="movimientos-partida">
                            <div class="text-center">
                                <div class="spinner-border text-primary" role="status">
                                    <span class="visually-hidden">Cargando...</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Cargar movimientos de la partida
        cargarMovimientosPartida(partidaId);
        
    } catch (error) {
        console.error('Error al cargar detalle de la partida:', error);
        mostrarNotificacion('Error al cargar detalle: ' + error.message, 'danger');
    } finally {
        mostrarCargando(false);
    }
}

/**
 * Función para cargar los movimientos de una partida presupuestaria
 * @param {number} partidaId - ID de la partida
 */
async function cargarMovimientosPartida(partidaId) {
    try {
        const movimientos = await fetchAPI(`/partidas/${partidaId}/movimientos`);
        
        const movimientosContainer = document.getElementById('movimientos-partida');
        
        if (movimientos.length === 0) {
            movimientosContainer.innerHTML = '<p>No hay movimientos registrados para esta partida.</p>';
            return;
        }
        
        movimientosContainer.innerHTML = `
            <div class="table-responsive">
                <table class="table table-striped table-hover">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Fecha</th>
                            <th>Tipo</th>
                            <th>Monto</th>
                            <th>Descripción</th>
                            <th>Proyecto</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${movimientos.map(movimiento => `
                            <tr>
                                <td>${movimiento.id}</td>
                                <td>${formatearFecha(movimiento.fecha)}</td>
                                <td>${movimiento.tipo}</td>
                                <td>${formatearMoneda(movimiento.monto)}</td>
                                <td>${movimiento.descripcion || 'N/A'}</td>
                                <td>${movimiento.proyecto ? `<a href="#" onclick="verDetalleProyecto(${movimiento.proyecto.id}); return false;">${movimiento.proyecto.nombre}</a>` : 'N/A'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
    } catch (error) {
        console.error('Error al cargar movimientos de la partida:', error);
        const movimientosContainer = document.getElementById('movimientos-partida');
        movimientosContainer.innerHTML = '<div class="alert alert-danger">Error al cargar movimientos</div>';
    }
}