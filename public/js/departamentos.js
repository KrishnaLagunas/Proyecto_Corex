/**
 * Gestión de Departamentos
 * Funciones para administrar departamentos del municipio
 */

/**
 * Función para cargar la lista de departamentos
 */
async function cargarDepartamentos() {
    try {
        mostrarCargando(true);
        
        const response = await fetchAPI('/departamentos');
        const departamentos = response.departamentos || [];
        
        // Verificar si el elemento main-content existe
        const mainContent = document.getElementById('main-content');
        if (!mainContent) {
            console.error('Elemento main-content no encontrado');
            mostrarCargando(false);
            return;
        }
        
        // Crear la estructura inicial si no existe
        if (!document.getElementById('tabla-departamentos')) {
            mainContent.classList.remove('d-none');
            mainContent.classList.add('full-width');
            mainContent.innerHTML = `
                <div class="row mb-3">
                    <div class="col-12 text-center">
                        <h2 class="section-title">Gestión de Departamentos</h2>
                    </div>
                </div>

                <div class="row g-2 align-items-end mb-2">
                    <div class="col-md-6">
                        <input type="text" class="form-control" id="buscar-departamento" placeholder="Buscar departamento...">
                    </div>
                    <div class="col-md-3">
                        <select class="form-select" id="filtro-estado-departamento">
                            <option value="">Todos los estados</option>
                            <option value="activo">Activo</option>
                            <option value="inactivo">Inactivo</option>
                        </select>
                    </div>
                </div>

                <div class="row mb-2">
                    <div class="col-md-3 offset-md-9 d-flex justify-content-end">
                        <button class="btn btn-primary btn-new-user" onclick="mostrarFormularioDepartamento()">
                            <i class="bi bi-building-add"></i> Nuevo Departamento
                        </button>
                    </div>
                </div>

                <table class="table table-striped table-hover align-middle table-fullwidth">
                    <thead>
                        <tr>
                            <th class="text-center">ID</th>
                            <th>Nombre</th>
                            <th class="text-nowrap">RUT</th>
                            <th class="text-nowrap">Teléfono</th>
                            <th>Email</th>
                            <th>Región</th>
                            <th>Comuna</th>
                            <th class="text-center">Estado</th>
                            <th class="text-center">Fecha creación</th>
                            <th class="text-center col-actions">Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="tabla-departamentos"></tbody>
                </table>
            `;
        }
        
        const tablaDepartamentos = document.getElementById('tabla-departamentos');
        
        if (departamentos.length === 0) {
            tablaDepartamentos.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">No hay departamentos registrados</td>
                </tr>
            `;
            return;
        }
        
        tablaDepartamentos.innerHTML = departamentos.map(departamento => `
            <tr>
                <td class="text-center">${departamento.id}</td>
                <td class="cell-wrap">${departamento.nombre}</td>
                <td class="cell-nowrap">${departamento.rut || 'Sin RUT'}</td>
                <td class="cell-nowrap">${departamento.telefono || 'Sin teléfono'}</td>
                <td class="cell-wrap cell-email">${departamento.email || 'Sin email'}</td>
                <td class="cell-wrap">${departamento.region || 'Sin región'}</td>
                <td class="cell-wrap">${departamento.comuna || 'Sin comuna'}</td>
                <td class="text-center"><span class="estado-${departamento.estado}">${departamento.estado}</span></td>
                <td class="text-center">${typeof formatearFecha === 'function' ? formatearFecha(departamento.createdAt) : (new Date(departamento.createdAt)).toLocaleDateString('es-CL')}</td>
                <td class="text-center col-actions">
                    <div class="btn-group btn-group-sm table-actions" role="group" aria-label="Acciones">
                        <button class="btn btn-view" onclick="verDetalleDepartamento(${departamento.id})" title="Ver detalles">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-edit" onclick="editarDepartamento(${departamento.id})" title="Editar departamento">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn ${departamento.estado === 'activo' ? 'btn-toggle' : 'btn-toggle btn-activate'}" onclick="cambiarEstadoDepartamento(${departamento.id}, '${departamento.estado === 'activo' ? 'inactivo' : 'activo'}')" title="${departamento.estado === 'activo' ? 'Desactivar' : 'Activar'} departamento">
                            <i class="bi ${departamento.estado === 'activo' ? 'bi-building-x' : 'bi-building-check'}"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
        
        // Agregar eventos para filtros
        const buscarDepartamento = document.getElementById('buscar-departamento');
        const filtroEstadoDepartamento = document.getElementById('filtro-estado-departamento');
        
        if (buscarDepartamento && filtroEstadoDepartamento) {
            buscarDepartamento.addEventListener('input', filtrarDepartamentos);
            filtroEstadoDepartamento.addEventListener('change', filtrarDepartamentos);
        }
        
    } catch (error) {
        console.error('Error al cargar departamentos:', error);
        mostrarNotificacion('Error al cargar departamentos: ' + error.message, 'danger');
        
        const tablaDepartamentos = document.getElementById('tabla-departamentos');
        if (tablaDepartamentos) {
            tablaDepartamentos.innerHTML = `
                <tr>
                    <td colspan="10" class="text-center text-danger">Error al cargar departamentos</td>
                </tr>
            `;
        } else {
            const mainContent = document.getElementById('main-content');
            if (mainContent) {
                mainContent.innerHTML = `
                    <div class="alert alert-danger" role="alert">
                        Error al cargar departamentos: ${error.message}
                    </div>
                `;
            }
        }
    } finally {
        mostrarCargando(false);
    }
}

/**
 * Función para mostrar el formulario de creación/edición de departamento
 */
async function mostrarFormularioDepartamento(departamentoId = null) {
    try {
        mostrarCargando(true);
        
        let departamento = {
            nombre: '',
            rut: '',
            telefono: '',
            email: '',
            region: '',
            comuna: ''
        };
        
        let titulo = 'Nuevo Departamento';
        let accion = 'crear';
        
        if (departamentoId) {
            departamento = await fetchAPI(`/departamentos/${departamentoId}`);
            titulo = 'Editar Departamento';
            accion = 'actualizar';
        }
        
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="row mb-3 align-items-center">
                <div class="col-4">
                    <button class="btn btn-outline-secondary" onclick="cargarGestionDepartamentos()">
                        <i class="bi bi-arrow-left"></i> Volver
                    </button>
                </div>
                <div class="col-4 text-center">
                    <h2 class="section-title">${titulo}</h2>
                </div>
                <div class="col-4"></div>
            </div>
            
            <div class="row">
                <div class="col-md-8 offset-md-2">
                    <div class="card no-hover">
                        <div class="card-body">
                            <form id="form-departamento" data-accion="${accion}" data-id="${departamentoId || ''}">
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="nombre" class="form-label">Nombre *</label>
                                            <input type="text" class="form-control" id="nombre" name="nombre" 
                                                   value="${departamento.nombre}" required>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="rut" class="form-label">RUT *</label>
                                            <input type="text" class="form-control" id="rut" name="rut" 
                                                   value="${departamento.rut || ''}" required>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="row">
                                    
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="telefono" class="form-label">Teléfono</label>
                                            <input type="tel" class="form-control" id="telefono" name="telefono" 
                                                   value="${departamento.telefono || ''}">
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="email" class="form-label">Email</label>
                                            <input type="email" class="form-control" id="email" name="email" 
                                                   value="${departamento.email || ''}">
                                        </div>
                                    </div>
                                    
                                </div>

                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="region" class="form-label">Región</label>
                                            <select class="form-select" id="region" name="region"></select>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="comuna" class="form-label">Comuna</label>
                                            <select class="form-select" id="comuna" name="comuna"></select>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="d-flex justify-content-center gap-2">
                                    <button type="submit" class="btn btn-primary btn-new-user">
                                        <i class="bi bi-save"></i> ${accion === 'crear' ? 'Crear' : 'Actualizar'} Departamento
                                    </button>
                                    <button type="button" class="btn btn-outline-secondary" onclick="cargarGestionDepartamentos()">
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Cargar regiones y comunas para selects dinámicos
        await cargarRegionesYComunasEnFormulario(departamento);

        // Agregar evento al formulario
        const formDepartamento = document.getElementById('form-departamento');
        formDepartamento.addEventListener('submit', guardarDepartamento);

        // Normalización y validación de RUT en el campo del formulario
        const rutInput = document.getElementById('rut');

        const normalizarRUT = (rut) => {
            const limpio = (rut || '')
                .replace(/\./g, '')
                .replace(/[^0-9kK]/g, '')
                .toUpperCase();
            if (limpio.length < 2) return limpio;
            const numero = limpio.slice(0, -1);
            const dv = limpio.slice(-1);
            return `${numero}-${dv}`;
        };

        const calcularDV = (numero) => {
            let suma = 0;
            let multiplicador = 2;
            for (let i = numero.length - 1; i >= 0; i--) {
                suma += parseInt(numero[i], 10) * multiplicador;
                multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
            }
            const resto = suma % 11;
            return resto === 0 ? '0' : resto === 1 ? 'K' : (11 - resto).toString();
        };

        const validarRUT = (rut) => {
            const n = normalizarRUT(rut);
            if (!/^\d{8}-[\dK]$/.test(n)) return false;
            const [num, dv] = n.split('-');
            return calcularDV(num) === dv;
        };

        const marcarInputRutInvalido = (input, mensaje) => {
            if (!input) return;
            input.classList.add('is-invalid');
            const fb = input.parentElement.querySelector('.invalid-feedback');
            if (!fb) {
                const div = document.createElement('div');
                div.className = 'invalid-feedback';
                div.textContent = mensaje || 'RUT inválido';
                input.parentElement.appendChild(div);
            } else {
                fb.textContent = mensaje || 'RUT inválido';
            }
        };

        const limpiarInputRut = (input) => {
            if (!input) return;
            input.classList.remove('is-invalid');
            const fb = input.parentElement.querySelector('.invalid-feedback');
            if (fb) fb.remove();
        };

        if (rutInput) {
            rutInput.addEventListener('input', (e) => {
                const raw = (e.target.value || '').replace(/\./g, '');
                const limpio = raw.replace(/[^0-9kK]/g, '');
                e.target.value = limpio.slice(0, 9);
                limpiarInputRut(e.target);
            });
            rutInput.addEventListener('blur', (e) => {
                const valor = e.target.value || '';
                const normalizado = normalizarRUT(valor);
                e.target.value = normalizado;
                if (normalizado && !validarRUT(normalizado)) {
                    marcarInputRutInvalido(e.target, 'RUT inválido. Formato 12345678-9 (sin puntos) y DV correcto');
                } else {
                    limpiarInputRut(e.target);
                }
            });
        }

        // Sin autocompletado de responsable: el formulario ahora es autónomo
        
    } catch (error) {
        console.error('Error al cargar formulario de departamento:', error);
        mostrarNotificacion('Error al cargar formulario: ' + error.message, 'danger');
    } finally {
        mostrarCargando(false);
    }
}

/**
 * Cargar regiones y comunas en los selects del formulario
 */
async function cargarRegionesYComunasEnFormulario(departamento) {
    try {
        const regionSelect = document.getElementById('region');
        const comunaSelect = document.getElementById('comuna');

        // Cargar regiones
        const regionesResp = await fetchAPI('/geografia/regiones');
        const regiones = regionesResp.regiones || regionesResp || [];

        regionSelect.innerHTML = '<option value="">Seleccione una región</option>' +
            regiones.map(r => `<option value="${r.id}">${r.nombre}</option>`).join('');

        // Preseleccionar región si el departamento tiene valor
        if (departamento.region) {
            const opt = Array.from(regionSelect.options).find(o => o.textContent === departamento.region);
            if (opt) {
                regionSelect.value = opt.value;
            }
        }

        // Manejar el cambio de región para cargar comunas
        regionSelect.addEventListener('change', async (e) => {
            const regionId = e.target.value;
            await cargarComunas(regionId, comunaSelect, null);
        });

        // Cargar comunas según la región seleccionada (en edición)
        const selectedRegionId = regionSelect.value || '';
        await cargarComunas(selectedRegionId, comunaSelect, departamento.comuna || null);
    } catch (error) {
        console.error('Error cargando regiones/comunas:', error);
        mostrarNotificacion('No se pudieron cargar regiones y comunas', 'warning');
    }
}

/**
 * Cargar comunas para una región dada y preseleccionar si aplica
 */
async function cargarComunas(regionId, comunaSelect, comunaNombrePreselect) {
    if (!comunaSelect) return;
    if (!regionId) {
        comunaSelect.innerHTML = '<option value="">Seleccione una comuna</option>';
        return;
    }

    try {
        const comunasResp = await fetchAPI(`/geografia/regiones/${regionId}/comunas`);
        const comunas = comunasResp.comunas || comunasResp || [];
        comunaSelect.innerHTML = '<option value="">Seleccione una comuna</option>' +
            comunas.map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('');

        if (comunaNombrePreselect) {
            const opt = Array.from(comunaSelect.options).find(o => o.textContent === comunaNombrePreselect);
            if (opt) {
                comunaSelect.value = opt.value;
            }
        }
    } catch (error) {
        console.error('Error cargando comunas:', error);
        mostrarNotificacion('No se pudieron cargar comunas de la región seleccionada', 'warning');
    }
}

/**
 * Función para guardar un departamento (crear o actualizar)
 */
async function guardarDepartamento(event) {
    event.preventDefault();
    
    try {
        mostrarCargando(true);
        
        const form = event.target;
        const formData = new FormData(form);
        const accion = form.dataset.accion;
        const departamentoId = form.dataset.id;
        
        const regionOption = document.querySelector('#region option:checked');
        const regionNombre = regionOption ? regionOption.textContent : (formData.get('region') || null);
        const departamentoData = {
            nombre: formData.get('nombre'),
            rut: formData.get('rut'),
            telefono: formData.get('telefono') || null,
            email: formData.get('email') || null,
            region: regionNombre,
            comuna: formData.get('comuna') || null
        };

        // Normalizar y validar RUT antes de enviar
        const rutInput = document.getElementById('rut');
        departamentoData.rut = normalizarRUT(departamentoData.rut);
        if (!validarRUT(departamentoData.rut)) {
            marcarInputRutInvalido(rutInput, 'RUT inválido. Formato 12345678-9 (sin puntos) y DV correcto');
            mostrarNotificacion('El RUT del departamento es inválido', 'danger');
            mostrarCargando(false);
            return;
        } else {
            limpiarInputRut(rutInput);
        }
        
        let response;
        if (accion === 'crear') {
            response = await fetchAPI('/departamentos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(departamentoData)
            });
        } else {
            response = await fetchAPI(`/departamentos/${departamentoId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(departamentoData)
            });
        }
        
        mostrarNotificacion(
            response.message || `Departamento ${accion === 'crear' ? 'creado' : 'actualizado'} exitosamente`,
            'success'
        );
        
        // Volver a la lista de departamentos
        cargarGestionDepartamentos();
        
    } catch (error) {
        console.error('Error al guardar departamento:', error);
        let mensaje = 'Error al guardar departamento';
        
        if (error.message.includes('rut')) {
            mensaje = 'Ya existe un departamento con ese RUT';
        } else if (error.message.includes('nombre')) {
            mensaje = 'Ya existe un departamento con ese nombre';
        }
        
        mostrarNotificacion(mensaje + ': ' + error.message, 'danger');
    } finally {
        mostrarCargando(false);
    }
}

/**
 * Función para ver detalles de un departamento
 */
async function verDetalleDepartamento(departamentoId) {
    try {
        mostrarCargando(true);
        
        const departamento = await fetchAPI(`/departamentos/${departamentoId}`);
        
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="row mb-4">
                <div class="col-12">
                    <button class="btn btn-outline-secondary mb-3" onclick="cargarGestionDepartamentos()">
                        <i class="bi bi-arrow-left"></i> Volver a la lista
                    </button>
                    <h2>Detalles del Departamento</h2>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-8 offset-md-2">
                    <div class="card">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5>Información del Departamento</h5>
                            <button class="btn btn-edit" onclick="editarDepartamento(${departamento.id})">
                                <i class="bi bi-pencil"></i> Editar
                            </button>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <p><strong>ID:</strong> ${departamento.id}</p>
                                    <p><strong>Nombre:</strong> ${departamento.nombre}</p>
                                    <p><strong>RUT:</strong> ${departamento.rut || 'No especificado'}</p>
                                    <p><strong>Estado:</strong> 
                                        <span class="badge ${departamento.estado === 'activo' ? 'bg-success' : 'bg-secondary'}">
                                            ${departamento.estado}
                                        </span>
                                    </p>
                                </div>
                                <div class="col-md-6">
                                    <p><strong>Teléfono:</strong> ${departamento.telefono || 'No especificado'}</p>
                                    <p><strong>Email:</strong> ${departamento.email || 'No especificado'}</p>
                                    <p><strong>Región:</strong> ${departamento.region || 'No especificada'}</p>
                                    <p><strong>Comuna:</strong> ${departamento.comuna || 'No especificada'}</p>
                                </div>
                            </div>
                            
                            
                            ${departamento.Funcionarios && departamento.Funcionarios.length > 0 ? `
                                <div class="row mt-3">
                                    <div class="col-12">
                                        <h6>Funcionarios Asignados:</h6>
                                        <div class="list-group">
                                            ${departamento.Funcionarios.map(funcionario => `
                                                <div class="list-group-item">
                                                    ${funcionario.nombre} ${funcionario.apellido} - ${funcionario.email}
                                                </div>
                                            `).join('')}
                                        </div>
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
    } catch (error) {
        console.error('Error al cargar detalles del departamento:', error);
        mostrarNotificacion('Error al cargar detalles: ' + error.message, 'danger');
    } finally {
        mostrarCargando(false);
    }
}

/**
 * Función para editar un departamento
 */
function editarDepartamento(departamentoId) {
    mostrarFormularioDepartamento(departamentoId);
}

/**
 * Alias para volver a la vista de lista
 */
function cargarGestionDepartamentos() {
    cargarDepartamentos();
}

/**
 * Función para cambiar el estado de un departamento (activar/desactivar)
 * @param {number} id - ID del departamento
 * @param {string} nuevoEstado - Nuevo estado ('activo' o 'inactivo')
 */
async function cambiarEstadoDepartamento(id, nuevoEstado) {
    const accion = nuevoEstado === 'activo' ? 'activar' : 'desactivar';
    
    if (!confirm(`¿Está seguro de que desea ${accion} este departamento?`)) {
        return;
    }

    try {
        mostrarCargando(true);
        
        const response = await fetchAPI(`/departamentos/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ estado: nuevoEstado })
        });

        mostrarNotificacion(`Departamento ${accion === 'activar' ? 'activado' : 'desactivado'} exitosamente`, 'success');
        await cargarDepartamentos();
        
    } catch (error) {
        console.error(`Error al ${accion} departamento:`, error);
        mostrarNotificacion(`Error al ${accion} departamento: ` + error.message, 'danger');
    } finally {
        mostrarCargando(false);
    }
}

/**
 * Función para eliminar un departamento
 */
async function eliminarDepartamento(departamentoId) {
    try {
        const confirmacion = confirm('¿Estás seguro de que deseas eliminar este departamento?');
        if (!confirmacion) return;
        
        mostrarCargando(true);
        
        const response = await fetchAPI(`/departamentos/${departamentoId}`, {
            method: 'DELETE'
        });
        
        mostrarNotificacion(response.message || 'Departamento eliminado exitosamente', 'success');
        
        // Recargar la lista de departamentos
        cargarDepartamentos();
        
    } catch (error) {
        console.error('Error al eliminar departamento:', error);
        let mensaje = 'Error al eliminar departamento';
        
        if (error.message.includes('proyecto')) {
            mensaje = 'No se puede eliminar el departamento porque tiene proyectos asociados';
        } else if (error.message.includes('funcionario')) {
            mensaje = 'No se puede eliminar el departamento porque tiene funcionarios asociados';
        }
        
        mostrarNotificacion(mensaje + ': ' + error.message, 'danger');
    } finally {
        mostrarCargando(false);
    }
}

/**
 * Función para filtrar departamentos según criterios de búsqueda
 */
function filtrarDepartamentos() {
    const busqueda = document.getElementById('buscar-departamento').value.toLowerCase();
    const estado = document.getElementById('filtro-estado-departamento').value;
    
    const filas = document.querySelectorAll('#tabla-departamentos tr');
    
    filas.forEach(fila => {
        const nombre = fila.cells[1].textContent.toLowerCase();
        const rut = fila.cells[2].textContent.toLowerCase();
        const estadoDept = fila.cells[8].textContent.toLowerCase();
        
        const coincideBusqueda = nombre.includes(busqueda) || rut.includes(busqueda);
        const coincideEstado = estado === '' || estadoDept.includes(estado);
        
        if (coincideBusqueda && coincideEstado) {
            fila.style.display = '';
        } else {
            fila.style.display = 'none';
        }
    });
}