/**
 * Módulo para la gestión de proyectos municipales
 * Este archivo contiene las funciones para administrar proyectos, avances y reportes
 */

/**
 * Función para cargar la lista de proyectos
 */
async function cargarProyectos() {
    try {
        mostrarCargando(true);
        
        const proyectos = await fetchAPI('/proyectos');
        
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="row mb-4">
                <div class="col-12 d-flex justify-content-between align-items-center">
                    <h2>Gestión de Proyectos</h2>
                    <button class="btn btn-primary" onclick="mostrarFormularioProyecto()">
                        <i class="bi bi-plus-circle"></i> Nuevo Proyecto
                    </button>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <div class="row">
                        <div class="col-md-4">
                            <input type="text" class="form-control" id="buscar-proyecto" placeholder="Buscar proyecto...">
                        </div>
                        <div class="col-md-3">
                            <select class="form-select" id="filtro-departamento">
                                <option value="">Todos los departamentos</option>
                                <!-- Se cargará dinámicamente -->
                            </select>
                        </div>
                        <div class="col-md-3">
                            <select class="form-select" id="filtro-estado">
                                <option value="">Todos los estados</option>
                                <option value="planificado">Planificado</option>
                                <option value="en_progreso">En Progreso</option>
                                <option value="completado">Completado</option>
                                <option value="cancelado">Cancelado</option>
                            </select>
                        </div>
                        <div class="col-md-2">
                            <button class="btn btn-outline-secondary w-100" onclick="generarReporteProyectos()">
                                <i class="bi bi-file-earmark-text"></i> Reporte
                            </button>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-striped table-hover">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Nombre</th>
                                    <th>Departamento</th>
                                    <th>Presupuesto</th>
                                    <th>Avance</th>
                                    <th>Fecha Inicio</th>
                                    <th>Fecha Fin</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody id="tabla-proyectos">
                                ${proyectos.map(proyecto => {
                                    const porcentajeAvance = proyecto.porcentaje_avance || 0;
                                    return `
                                        <tr>
                                            <td>${proyecto.id}</td>
                                            <td>${proyecto.nombre}</td>
                                            <td>${proyecto.departamento?.nombre || 'N/A'}</td>
                                            <td>${formatearMoneda(proyecto.presupuesto_asignado)}</td>
                                            <td>
                                                <div class="progress">
                                                    <div class="progress-bar" 
                                                         role="progressbar" 
                                                         style="width: ${porcentajeAvance}%" 
                                                         aria-valuenow="${porcentajeAvance}" 
                                                         aria-valuemin="0" 
                                                         aria-valuemax="100">
                                                        ${porcentajeAvance}%
                                                    </div>
                                                </div>
                                            </td>
                                            <td>${formatearFecha(proyecto.fecha_inicio)}</td>
                                            <td>${formatearFecha(proyecto.fecha_fin)}</td>
                                            <td><span class="estado-${proyecto.estado}">${proyecto.estado}</span></td>
                                            <td>
                                                <button class="btn btn-sm btn-info" onclick="verDetalleProyecto(${proyecto.id})">
                                                    <i class="bi bi-eye"></i>
                                                </button>
                                                ${proyecto.estado !== 'completado' && proyecto.estado !== 'cancelado' ? `
                                                    <button class="btn btn-sm btn-primary" onclick="editarProyecto(${proyecto.id})">
                                                        <i class="bi bi-pencil"></i>
                                                    </button>
                                                    <button class="btn btn-sm btn-success" onclick="registrarAvanceProyecto(${proyecto.id})">
                                                        <i class="bi bi-graph-up"></i>
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
        
        // Cargar departamentos para el filtro
        cargarDepartamentosParaFiltro();
        
        // Agregar eventos para filtros
        const buscarProyecto = document.getElementById('buscar-proyecto');
        const filtroDepartamento = document.getElementById('filtro-departamento');
        const filtroEstado = document.getElementById('filtro-estado');
        
        if (buscarProyecto && filtroDepartamento && filtroEstado) {
            buscarProyecto.addEventListener('input', filtrarProyectos);
            filtroDepartamento.addEventListener('change', filtrarProyectos);
            filtroEstado.addEventListener('change', filtrarProyectos);
        }
        
    } catch (error) {
        console.error('Error al cargar proyectos:', error);
        mostrarNotificacion('Error al cargar proyectos: ' + error.message, 'danger');
    } finally {
        mostrarCargando(false);
    }
}

/**
 * Función para cargar departamentos en el filtro
 */
async function cargarDepartamentosParaFiltro() {
    try {
        const response = await fetchAPI('/departamentos');
        const departamentos = response.departamentos || [];
        const filtroDepartamento = document.getElementById('filtro-departamento');
        
        if (filtroDepartamento) {
            // Mantener la opción por defecto
            const opcionPorDefecto = filtroDepartamento.options[0];
            filtroDepartamento.innerHTML = '';
            filtroDepartamento.appendChild(opcionPorDefecto);
            
            // Agregar departamentos
            departamentos.forEach(departamento => {
                const option = document.createElement('option');
                option.value = departamento.id;
                option.textContent = departamento.nombre;
                filtroDepartamento.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error al cargar departamentos para filtro:', error);
    }
}

/**
 * Función para filtrar proyectos según criterios de búsqueda
 */
function filtrarProyectos() {
    const busqueda = document.getElementById('buscar-proyecto').value.toLowerCase();
    const departamentoId = document.getElementById('filtro-departamento').value;
    const estado = document.getElementById('filtro-estado').value;
    
    const filas = document.querySelectorAll('#tabla-proyectos tr');
    
    filas.forEach(fila => {
        const nombre = fila.cells[1].textContent.toLowerCase();
        const departamento = fila.cells[2].textContent;
        const estadoProyecto = fila.cells[7].textContent.toLowerCase();
        
        // Verificar si el departamento coincide con el ID seleccionado
        // Esto es una simplificación, en un caso real necesitaríamos almacenar el ID del departamento en algún atributo de la fila
        const coincideDepartamento = departamentoId === '' || departamento.includes(departamentoId);
        
        const coincideBusqueda = nombre.includes(busqueda);
        const coincideEstado = estado === '' || estadoProyecto === estado;
        
        if (coincideBusqueda && coincideDepartamento && coincideEstado) {
            fila.style.display = '';
        } else {
            fila.style.display = 'none';
        }
    });
}

/**
 * Función para mostrar el formulario de creación/edición de proyecto
 * @param {number} proyectoId - ID del proyecto a editar (opcional)
 */
async function mostrarFormularioProyecto(proyectoId = null) {
    try {
        mostrarCargando(true);
        
        // Obtener departamentos y presupuestos para los selects
        const responseDepartamentos = await fetchAPI('/departamentos');
        const departamentos = responseDepartamentos.departamentos || [];
        const responsePresupuestos = await fetchAPI('/presupuestos');
        const presupuestos = responsePresupuestos.presupuestos || [];
        const responseProveedores = await fetchAPI('/proveedores');
        const proveedores = responseProveedores.proveedores || [];
        
        let proyecto = {
            codigo: '',
            nombre: '',
            descripcion: '',
            tipo: 'infraestructura',
            fecha_inicio: new Date().toISOString().split('T')[0],
            fecha_fin: '',
            presupuesto_asignado: 0,
            ubicacion: '',
            beneficiarios: 0,
            objetivos: '',
            resultados_esperados: '',
            fuente_financiamiento: '',
            departamento_id: null,
            responsable_id: null,
            presupuesto_id: null,
            estado: 'planificacion'
        };
        
        let titulo = 'Nuevo Proyecto';
        let accion = 'crear';
        
        if (proyectoId) {
            proyecto = await fetchAPI(`/proyectos/${proyectoId}`);
            titulo = 'Editar Proyecto';
            accion = 'actualizar';
        }
        
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="row mb-4">
                <div class="col-12">
                    <button class="btn btn-outline-secondary mb-3" onclick="cargarProyectos()">
                        <i class="bi bi-arrow-left"></i> Volver a la lista
                    </button>
                    <h2>${titulo}</h2>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-10 offset-md-1">
                    <div class="card">
                        <div class="card-body">
                            <form id="form-proyecto">
                                <input type="hidden" id="proyecto-id" value="${proyecto.id || ''}">
                                <input type="hidden" id="accion" value="${accion}">
                                
                                <div class="row mb-3">
                                    <div class="col-md-4">
                                        <label for="codigo" class="form-label">Código *</label>
                                        <input type="text" class="form-control" id="codigo" value="${proyecto.codigo}" required>
                                    </div>
                                    <div class="col-md-6">
                                        <label for="nombre" class="form-label">Nombre del Proyecto *</label>
                                        <input type="text" class="form-control" id="nombre" value="${proyecto.nombre}" required>
                                    </div>
                                    <div class="col-md-2">
                                        <label for="tipo" class="form-label">Tipo *</label>
                                        <select class="form-select" id="tipo" required>
                                            <option value="infraestructura" ${proyecto.tipo === 'infraestructura' ? 'selected' : ''}>Infraestructura</option>
                                            <option value="social" ${proyecto.tipo === 'social' ? 'selected' : ''}>Social</option>
                                            <option value="ambiental" ${proyecto.tipo === 'ambiental' ? 'selected' : ''}>Ambiental</option>
                                            <option value="tecnologico" ${proyecto.tipo === 'tecnologico' ? 'selected' : ''}>Tecnológico</option>
                                            <option value="cultural" ${proyecto.tipo === 'cultural' ? 'selected' : ''}>Cultural</option>
                                            <option value="otro" ${proyecto.tipo === 'otro' ? 'selected' : ''}>Otro</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div class="row mb-3">
                                    <div class="col-md-8">
                                        <label for="ubicacion" class="form-label">Ubicación *</label>
                                        <input type="text" class="form-control" id="ubicacion" value="${proyecto.ubicacion}" placeholder="Dirección o zona del proyecto" required>
                                    </div>
                                    <div class="col-md-4">
                                        <label for="beneficiarios" class="form-label">Beneficiarios *</label>
                                        <input type="number" class="form-control" id="beneficiarios" value="${proyecto.beneficiarios}" min="0" required>
                                    </div>
                                </div>
                                
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <label for="fuente-financiamiento" class="form-label">Fuente de Financiamiento *</label>
                                        <input type="text" class="form-control" id="fuente-financiamiento" value="${proyecto.fuente_financiamiento}" placeholder="Ej: Municipal, Regional, Nacional" required>
                                    </div>
                                    <div class="col-md-6">
                                        <label for="estado" class="form-label">Estado *</label>
                                        <select class="form-select" id="estado" required>
                                            <option value="planificacion" ${proyecto.estado === 'planificacion' ? 'selected' : ''}>Planificación</option>
                                            <option value="en_ejecucion" ${proyecto.estado === 'en_ejecucion' ? 'selected' : ''}>En Ejecución</option>
                                            <option value="pausado" ${proyecto.estado === 'pausado' ? 'selected' : ''}>Pausado</option>
                                            <option value="cancelado" ${proyecto.estado === 'cancelado' ? 'selected' : ''}>Cancelado</option>
                                            <option value="finalizado" ${proyecto.estado === 'finalizado' ? 'selected' : ''}>Finalizado</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="descripcion" class="form-label">Descripción *</label>
                                    <textarea class="form-control" id="descripcion" rows="3" required>${proyecto.descripcion || ''}</textarea>
                                </div>
                                
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <label for="objetivos" class="form-label">Objetivos *</label>
                                        <textarea class="form-control" id="objetivos" rows="3" required>${proyecto.objetivos || ''}</textarea>
                                    </div>
                                    <div class="col-md-6">
                                        <label for="resultados-esperados" class="form-label">Resultados Esperados *</label>
                                        <textarea class="form-control" id="resultados-esperados" rows="3" required>${proyecto.resultados_esperados || ''}</textarea>
                                    </div>
                                </div>
                                
                                <div class="row mb-3">
                                    <div class="col-md-4">
                                        <label for="departamento" class="form-label">Departamento *</label>
                                        <select class="form-select" id="departamento" required>
                                            <option value="">Seleccione un departamento</option>
                                            ${departamentos.map(depto => `
                                                <option value="${depto.id}" ${proyecto.departamento_id === depto.id ? 'selected' : ''}>
                                                    ${depto.nombre}
                                                </option>
                                            `).join('')}
                                        </select>
                                    </div>
                                    <div class="col-md-4">
                                        <label for="responsable" class="form-label">Responsable *</label>
                                        <select class="form-select" id="responsable" required>
                                            <option value="">Seleccione un responsable</option>
                                            <!-- Se cargará dinámicamente según el departamento -->
                                        </select>
                                    </div>
                                    <div class="col-md-4">
                                        <label for="presupuesto" class="form-label">Presupuesto</label>
                                        <select class="form-select" id="presupuesto">
                                            <option value="">Seleccione un presupuesto</option>
                                            ${presupuestos.map(presup => `
                                                <option value="${presup.id}" ${proyecto.presupuesto_id === presup.id ? 'selected' : ''}>
                                                    ${presup.anio_fiscal} - ${formatearMoneda(presup.monto_total)}
                                                </option>
                                            `).join('')}
                                        </select>
                                    </div>
                                </div>
                                
                                <div class="row mb-3">
                                    <div class="col-md-4">
                                        <label for="fecha-inicio" class="form-label">Fecha de Inicio *</label>
                                        <input type="date" class="form-control" id="fecha-inicio" value="${proyecto.fecha_inicio ? proyecto.fecha_inicio.split('T')[0] : ''}" required>
                                    </div>
                                    <div class="col-md-4">
                                        <label for="fecha-fin-estimada" class="form-label">Fecha de Fin Estimada *</label>
                                        <input type="date" class="form-control" id="fecha-fin-estimada" value="${proyecto.fecha_fin_estimada ? proyecto.fecha_fin_estimada.split('T')[0] : ''}" required>
                                    </div>
                                    <div class="col-md-4">
                                        <label for="presupuesto-asignado" class="form-label">Presupuesto Asignado *</label>
                                        <div class="input-group">
                                            <span class="input-group-text">$</span>
                                            <input type="number" class="form-control" id="presupuesto-asignado" value="${proyecto.presupuesto_asignado}" min="0" step="0.01" required>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="mb-3">
                                    <label class="form-label">Proveedores Asociados</label>
                                    <div class="table-responsive">
                                        <table class="table table-sm table-bordered">
                                            <thead>
                                                <tr>
                                                    <th style="width: 50px;">Seleccionar</th>
                                                    <th>Proveedor</th>
                                                    <th>Servicio</th>
                                                    <th>Monto</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                ${proveedores.map(proveedor => `
                                                    <tr>
                                                        <td class="text-center">
                                                            <input type="checkbox" class="form-check-input proveedor-check" 
                                                                   data-id="${proveedor.id}" 
                                                                   ${proyecto.proveedores?.some(p => p.id === proveedor.id) ? 'checked' : ''}>
                                                        </td>
                                                        <td>${proveedor.nombre}</td>
                                                        <td>${proveedor.tipo_servicio}</td>
                                                        <td>
                                                            <div class="input-group input-group-sm">
                                                                <span class="input-group-text">$</span>
                                                                <input type="number" class="form-control proveedor-monto" 
                                                                       data-id="${proveedor.id}" 
                                                                       value="${proyecto.proveedores?.find(p => p.id === proveedor.id)?.pivot?.monto || 0}" 
                                                                       min="0" step="0.01">
                                                            </div>
                                                        </td>
                                                    </tr>
                                                `).join('')}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                
                                <div class="d-grid gap-2">
                                    <button type="submit" class="btn btn-primary">
                                        <i class="bi bi-save"></i> Guardar
                                    </button>
                                    <button type="button" class="btn btn-outline-secondary" onclick="cargarProyectos()">
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
        const formProyecto = document.getElementById('form-proyecto');
        formProyecto.addEventListener('submit', guardarProyecto);
        
    } catch (error) {
        console.error('Error al cargar formulario de proyecto:', error);
        mostrarNotificacion('Error al cargar formulario: ' + error.message, 'danger');
    } finally {
        mostrarCargando(false);
    }
}

/**
 * Función para guardar un proyecto (crear o actualizar)
 * @param {Event} e - Evento del formulario
 */
async function guardarProyecto(e) {
    e.preventDefault();
    
    try {
        mostrarCargando(true);
        
        const proyectoId = document.getElementById('proyecto-id').value;
        const accion = document.getElementById('accion').value;
        
        // Recopilar proveedores seleccionados
        const proveedoresSeleccionados = [];
        document.querySelectorAll('.proveedor-check:checked').forEach(checkbox => {
            const proveedorId = checkbox.dataset.id;
            const monto = document.querySelector(`.proveedor-monto[data-id="${proveedorId}"]`).value;
            
            proveedoresSeleccionados.push({
                id: parseInt(proveedorId),
                monto: parseFloat(monto)
            });
        });
        
        const proyecto = {
            codigo: document.getElementById('codigo').value,
            nombre: document.getElementById('nombre').value,
            descripcion: document.getElementById('descripcion').value,
            tipo: document.getElementById('tipo').value,
            fecha_inicio: document.getElementById('fecha-inicio').value,
            fecha_fin_estimada: document.getElementById('fecha-fin-estimada').value,
            presupuesto_asignado: parseFloat(document.getElementById('presupuesto-asignado').value),
            ubicacion: document.getElementById('ubicacion').value,
            beneficiarios: parseInt(document.getElementById('beneficiarios').value),
            objetivos: document.getElementById('objetivos').value,
            resultados_esperados: document.getElementById('resultados-esperados').value,
            fuente_financiamiento: document.getElementById('fuente-financiamiento').value,
            departamento_id: parseInt(document.getElementById('departamento').value),
            responsable_id: parseInt(document.getElementById('responsable').value) || null,
            presupuesto_id: parseInt(document.getElementById('presupuesto').value) || null,
            estado: document.getElementById('estado').value,
            proveedores: proveedoresSeleccionados
        };
        
        let respuesta;
        
        if (accion === 'crear') {
            respuesta = await fetchAPI('/proyectos', {
                method: 'POST',
                body: JSON.stringify(proyecto)
            });
            mostrarNotificacion('Proyecto creado correctamente', 'success');
        } else {
            respuesta = await fetchAPI(`/proyectos/${proyectoId}`, {
                method: 'PUT',
                body: JSON.stringify(proyecto)
            });
            mostrarNotificacion('Proyecto actualizado correctamente', 'success');
        }
        
        cargarProyectos();
        
    } catch (error) {
        console.error('Error al guardar proyecto:', error);
        mostrarNotificacion('Error al guardar proyecto: ' + error.message, 'danger');
    } finally {
        mostrarCargando(false);
    }
}

/**
 * Función para editar un proyecto
 * @param {number} proyectoId - ID del proyecto a editar
 */
function editarProyecto(proyectoId) {
    mostrarFormularioProyecto(proyectoId);
}

/**
 * Función para ver el detalle de un proyecto
 * @param {number} proyectoId - ID del proyecto
 */
async function verDetalleProyecto(proyectoId) {
    try {
        mostrarCargando(true);
        
        const proyecto = await fetchAPI(`/proyectos/${proyectoId}`);
        const avances = await fetchAPI(`/proyectos/${proyectoId}/avances`);
        
        const porcentajeAvance = proyecto.porcentaje_avance || 0;
        const porcentajePresupuesto = (proyecto.presupuesto_ejecutado / proyecto.presupuesto_asignado) * 100;
        
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="row mb-4">
                <div class="col-12">
                    <button class="btn btn-outline-secondary mb-3" onclick="cargarProyectos()">
                        <i class="bi bi-arrow-left"></i> Volver a la lista
                    </button>
                    <h2>Detalle del Proyecto</h2>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-10 offset-md-1">
                    <div class="card mb-4">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="mb-0">Información General</h5>
                            <div>
                                ${proyecto.estado !== 'completado' && proyecto.estado !== 'cancelado' ? `
                                    <button class="btn btn-primary" onclick="editarProyecto(${proyecto.id})">
                                        <i class="bi bi-pencil"></i> Editar
                                    </button>
                                    <button class="btn btn-success" onclick="registrarAvanceProyecto(${proyecto.id})">
                                        <i class="bi bi-graph-up"></i> Registrar Avance
                                    </button>
                                ` : ''}
                                <button class="btn btn-info" onclick="generarReporteProyecto(${proyecto.id})">
                                    <i class="bi bi-file-earmark-text"></i> Generar Reporte
                                </button>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">ID:</div>
                                <div class="col-md-8">${proyecto.id}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Nombre:</div>
                                <div class="col-md-8">${proyecto.nombre}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Departamento:</div>
                                <div class="col-md-8">${proyecto.departamento?.nombre || 'N/A'}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Presupuesto:</div>
                                <div class="col-md-8">${proyecto.presupuesto?.anio_fiscal || 'N/A'}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Fecha de Inicio:</div>
                                <div class="col-md-8">${formatearFecha(proyecto.fecha_inicio)}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Fecha de Fin:</div>
                                <div class="col-md-8">${formatearFecha(proyecto.fecha_fin)}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Estado:</div>
                                <div class="col-md-8"><span class="estado-${proyecto.estado}">${proyecto.estado}</span></div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Presupuesto Asignado:</div>
                                <div class="col-md-8">${formatearMoneda(proyecto.presupuesto_asignado)}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Presupuesto Ejecutado:</div>
                                <div class="col-md-8">${formatearMoneda(proyecto.presupuesto_ejecutado)}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Avance del Proyecto:</div>
                                <div class="col-md-8">
                                    <div class="progress">
                                        <div class="progress-bar" 
                                             role="progressbar" 
                                             style="width: ${porcentajeAvance}%" 
                                             aria-valuenow="${porcentajeAvance}" 
                                             aria-valuemin="0" 
                                             aria-valuemax="100">
                                            ${porcentajeAvance}%
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Ejecución Presupuestaria:</div>
                                <div class="col-md-8">
                                    <div class="progress">
                                        <div class="progress-bar ${porcentajePresupuesto > 90 ? 'bg-danger' : porcentajePresupuesto > 70 ? 'bg-warning' : 'bg-success'}" 
                                             role="progressbar" 
                                             style="width: ${porcentajePresupuesto}%" 
                                             aria-valuenow="${porcentajePresupuesto}" 
                                             aria-valuemin="0" 
                                             aria-valuemax="100">
                                            ${porcentajePresupuesto.toFixed(1)}%
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Descripción:</div>
                                <div class="col-md-8">${proyecto.descripcion || 'Sin descripción'}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="card mb-4">
                        <div class="card-header">
                            <h5>Proveedores Asociados</h5>
                        </div>
                        <div class="card-body">
                            ${!proyecto.proveedores || proyecto.proveedores.length === 0 ? `
                                <p>No hay proveedores asociados a este proyecto.</p>
                            ` : `
                                <div class="table-responsive">
                                    <table class="table table-striped table-hover">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Nombre</th>
                                                <th>Tipo de Servicio</th>
                                                <th>Monto Contratado</th>
                                                <th>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${proyecto.proveedores.map(proveedor => `
                                                <tr>
                                                    <td>${proveedor.id}</td>
                                                    <td>${proveedor.nombre}</td>
                                                    <td>${proveedor.tipo_servicio}</td>
                                                    <td>${formatearMoneda(proveedor.pivot.monto)}</td>
                                                    <td>
                                                        <button class="btn btn-sm btn-info" onclick="verDetalleProveedor(${proveedor.id})">
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
                    
                    <div class="card">
                        <div class="card-header">
                            <h5>Avances del Proyecto</h5>
                        </div>
                        <div class="card-body">
                            ${avances.length === 0 ? `
                                <p>No hay avances registrados para este proyecto.</p>
                            ` : `
                                <div class="table-responsive">
                                    <table class="table table-striped table-hover">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Fecha</th>
                                                <th>Porcentaje</th>
                                                <th>Descripción</th>
                                                <th>Registrado por</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${avances.map(avance => `
                                                <tr>
                                                    <td>${avance.id}</td>
                                                    <td>${formatearFecha(avance.fecha)}</td>
                                                    <td>${avance.porcentaje}%</td>
                                                    <td>${avance.descripcion}</td>
                                                    <td>${avance.usuario?.nombre} ${avance.usuario?.apellido}</td>
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
        console.error('Error al cargar detalle del proyecto:', error);
        mostrarNotificacion('Error al cargar detalle: ' + error.message, 'danger');
    } finally {
        mostrarCargando(false);
    }
}

/**
 * Función para mostrar el formulario de registro de avance de proyecto
 * @param {number} proyectoId - ID del proyecto
 */
async function registrarAvanceProyecto(proyectoId) {
    try {
        mostrarCargando(true);
        
        const proyecto = await fetchAPI(`/proyectos/${proyectoId}`);
        
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="row mb-4">
                <div class="col-12">
                    <button class="btn btn-outline-secondary mb-3" onclick="verDetalleProyecto(${proyectoId})">
                        <i class="bi bi-arrow-left"></i> Volver al proyecto
                    </button>
                    <h2>Registrar Avance de Proyecto</h2>
                    <p>Proyecto: ${proyecto.nombre}</p>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-8 offset-md-2">
                    <div class="card">
                        <div class="card-body">
                            <form id="form-avance">
                                <input type="hidden" id="proyecto-id" value="${proyectoId}">
                                
                                <div class="mb-3">
                                    <label for="fecha" class="form-label">Fecha</label>
                                    <input type="date" class="form-control" id="fecha" value="${new Date().toISOString().split('T')[0]}" required>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="porcentaje" class="form-label">Porcentaje de Avance</label>
                                    <div class="input-group">
                                        <input type="number" class="form-control" id="porcentaje" min="0" max="100" value="${proyecto.porcentaje_avance || 0}" required>
                                        <span class="input-group-text">%</span>
                                    </div>
                                    <div class="form-text">El porcentaje actual es ${proyecto.porcentaje_avance || 0}%</div>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="descripcion" class="form-label">Descripción del Avance</label>
                                    <textarea class="form-control" id="descripcion" rows="3" required></textarea>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="presupuesto-ejecutado" class="form-label">Presupuesto Ejecutado en este Avance</label>
                                    <div class="input-group">
                                        <span class="input-group-text">$</span>
                                        <input type="number" class="form-control" id="presupuesto-ejecutado" min="0" step="0.01" value="0" required>
                                    </div>
                                    <div class="form-text">Presupuesto total ejecutado hasta ahora: ${formatearMoneda(proyecto.presupuesto_ejecutado)}</div>
                                </div>
                                
                                <div class="d-grid gap-2">
                                    <button type="submit" class="btn btn-primary">
                                        <i class="bi bi-save"></i> Registrar Avance
                                    </button>
                                    <button type="button" class="btn btn-outline-secondary" onclick="verDetalleProyecto(${proyectoId})">
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
        const formAvance = document.getElementById('form-avance');
        formAvance.addEventListener('submit', guardarAvanceProyecto);
        
    } catch (error) {
        console.error('Error al cargar formulario de avance:', error);
        mostrarNotificacion('Error al cargar formulario: ' + error.message, 'danger');
    } finally {
        mostrarCargando(false);
    }
}

/**
 * Función para guardar un avance de proyecto
 * @param {Event} e - Evento del formulario
 */
async function guardarAvanceProyecto(e) {
    e.preventDefault();
    
    try {
        mostrarCargando(true);
        
        const proyectoId = document.getElementById('proyecto-id').value;
        
        const avance = {
            fecha: document.getElementById('fecha').value,
            porcentaje: parseInt(document.getElementById('porcentaje').value),
            descripcion: document.getElementById('descripcion').value,
            presupuesto_ejecutado: parseFloat(document.getElementById('presupuesto-ejecutado').value)
        };
        
        await fetchAPI(`/proyectos/${proyectoId}/avances`, {
            method: 'POST',
            body: JSON.stringify(avance)
        });
        
        mostrarNotificacion('Avance registrado correctamente', 'success');
        verDetalleProyecto(proyectoId);
        
    } catch (error) {
        console.error('Error al guardar avance:', error);
        mostrarNotificacion('Error al guardar avance: ' + error.message, 'danger');
    } finally {
        mostrarCargando(false);
    }
}

/**
 * Función para generar un reporte de un proyecto específico
 * @param {number} proyectoId - ID del proyecto
 */
async function generarReporteProyecto(proyectoId) {
    try {
        mostrarCargando(true);
        
        const reporte = await fetchAPI(`/proyectos/${proyectoId}/reporte`);
        
        // Aquí se podría mostrar el reporte en una ventana modal o redirigir a una página de reporte
        // Por simplicidad, mostraremos una notificación
        mostrarNotificacion('Reporte generado correctamente', 'success');
        
        // Simulación de descarga de reporte
        setTimeout(() => {
            const a = document.createElement('a');
            a.href = `data:application/pdf;base64,${reporte.base64}`;
            a.download = `reporte_proyecto_${proyectoId}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }, 1000);
        
    } catch (error) {
        console.error('Error al generar reporte:', error);
        mostrarNotificacion('Error al generar reporte: ' + error.message, 'danger');
    } finally {
        mostrarCargando(false);
    }
}

/**
 * Función para generar un reporte de todos los proyectos
 */
async function generarReporteProyectos() {
    try {
        mostrarCargando(true);
        
        // Obtener filtros actuales
        const busqueda = document.getElementById('buscar-proyecto').value;
        const departamentoId = document.getElementById('filtro-departamento').value;
        const estado = document.getElementById('filtro-estado').value;
        
        const filtros = {
            busqueda,
            departamento_id: departamentoId,
            estado
        };
        
        const reporte = await fetchAPI('/proyectos/reporte', {
            method: 'POST',
            body: JSON.stringify(filtros)
        });
        
        // Simulación de descarga de reporte
        setTimeout(() => {
            const a = document.createElement('a');
            a.href = `data:application/pdf;base64,${reporte.base64}`;
            a.download = 'reporte_proyectos.pdf';
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
 * Función para ver el detalle de un proveedor
 * @param {number} proveedorId - ID del proveedor
 */
async function verDetalleProveedor(proveedorId) {
    // Redirigir a la página de detalle del proveedor
    // Esta función debería estar definida en el módulo de proveedores
    if (typeof window.verDetalleProveedor === 'function') {
        window.verDetalleProveedor(proveedorId);
    } else {
        // Si la función no está disponible, cargar el módulo de proveedores
        const script = document.createElement('script');
        script.src = 'js/proveedores.js';
        script.onload = () => {
            window.verDetalleProveedor(proveedorId);
        };
        document.head.appendChild(script);
    }
}