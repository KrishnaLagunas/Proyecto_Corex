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
        const departamentosRaw = response.departamentos || [];
        const departamentos = departamentosRaw.map(d => ({
            id: d.id,
            nombre: d.nombre,
            rut: d.rut || '',
            email: d.email || d.email_contacto || '',
            telefono: d.telefono || d.telefono_contacto || '',
            direccion: d.direccion || '',
            region: d.region || '',
            comuna: d.comuna || ''
        }));
        
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
                            <th class="text-center col-actions">Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="tabla-departamentos"></tbody>
                </table>
            `;
            try {
                if (window.mobileNav && typeof window.mobileNav.close === 'function') {
                    window.mobileNav.close();
                }
                const overlay = document.getElementById('nav-overlay');
                if (overlay) overlay.classList.remove('active');
                document.body.style.overflow = '';
            } catch (_) {}
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
                
                <td class="text-center col-actions">
                    <div class="btn-group btn-group-sm table-actions" role="group" aria-label="Acciones">
                        <button class="btn btn-view" onclick="verDetalleDepartamento(${departamento.id})" title="Ver detalles">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-edit" onclick="editarDepartamento(${departamento.id})" title="Editar departamento">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-danger" onclick="eliminarDepartamento(${departamento.id})" title="Eliminar departamento">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
        
        // Agregar eventos para filtros
        const buscarDepartamento = document.getElementById('buscar-departamento');
        if (buscarDepartamento) {
            buscarDepartamento.addEventListener('input', filtrarDepartamentos);
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
        
        let departamento = { nombre: '' };
        
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
                                    <div class="col-md-6"></div>
                                </div>
                                
                                <div class="row">
                                    
                                    <div class="col-md-6"></div>
                                </div>
                                
                                <div class="row">
                                    <div class="col-md-6"></div>
                                    
                                </div>

                                <div class="row">
                                    <div class="col-md-6"></div>
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
        
        

        // Agregar evento al formulario
        const formDepartamento = document.getElementById('form-departamento');
        formDepartamento.addEventListener('submit', guardarDepartamento);

        

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
        
    const departamentoData = { nombre: formData.get('nombre') };
        
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
        
        if (error.message.includes('nombre')) {
            mensaje = 'Ya existe un departamento con ese nombre';
        }
        
        mostrarNotificacion(mensaje + ': ' + error.message, 'danger');
    } finally {
        mostrarCargando(false);
    }
}

async function cargarMunicipalidades() {
    try {
        mostrarCargando(true);
        const response = await fetchAPI('/municipalidades');
        const departamentosRaw = response.departamentos || [];
        const departamentos = departamentosRaw.map(d => ({
            id: d.id,
            nombre: d.nombre,
            rut: d.rut ?? '',
            rutFmt: formatRut(d.rut ?? ''),
            email: d.email ?? d.email_contacto ?? '',
            telefono: d.telefono ?? d.telefono_contacto ?? '',
            direccion: d.direccion ?? '',
            region: d.region ?? '',
            comuna: d.comuna ?? '',
            estado: d.estado || 'activo'
        }));
        const mainContent = document.getElementById('main-content');
        if (!document.getElementById('tabla-departamentos')) {
            mainContent.classList.remove('d-none');
            mainContent.classList.add('full-width');
            mainContent.innerHTML = `
                <div class="row mb-3">
                    <div class="col-12 text-center">
                        <h2 class="section-title">Gestión de Municipalidades</h2>
                    </div>
                </div>
                <div class="row g-2 align-items-end mb-2" style="position:relative; z-index:1100;">
                    <div class="col-md-6" id="buscar-departamento-wrap" style="position:relative; z-index:1100;">
                        <input type="text" class="form-control" id="buscar-departamento" placeholder="Buscar municipalidad..." autocomplete="off" tabindex="0" aria-label="Buscar municipalidad" style="position:relative; z-index:1100;">
                    </div>
                </div>
                <div class="row mb-2">
                    <div class="col-md-3 offset-md-9 d-flex justify-content-end">
                        <button class="btn btn-primary btn-new-user" onclick="mostrarFormularioMunicipalidad()">
                            <i class="bi bi-building-add"></i> Nueva Municipalidad
                        </button>
                    </div>
                </div>
                <table class="table table-striped table-hover align-middle table-fullwidth">
                    <thead>
                        <tr>
                            <th class="text-center">ID</th>
                            <th>Nombre</th>
                            <th>RUT</th>
                            <th>Email</th>
                            <th>Teléfono</th>
                            <th>Dirección</th>
                            <th>Región</th>
                            <th>Comuna</th>
                            <th>Estado</th>
                            <th class="text-center col-actions">Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="tabla-departamentos"></tbody>
                </table>
            `;
        }
        const tabla = document.getElementById('tabla-departamentos');
        if ((departamentos || []).length === 0) {
            tabla.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center">No hay municipalidades registradas</td>
                </tr>
            `;
            return;
        }
        tabla.innerHTML = departamentos.map(d => `
            <tr>
                <td class="text-center">${d.id}</td>
                <td class="cell-wrap">${d.nombre}</td>
                <td class="cell-wrap">${d.rutFmt || ''}</td>
                <td class="cell-wrap">${d.email || d.email_contacto || ''}</td>
                <td class="cell-wrap">${d.telefono || d.telefono_contacto || ''}</td>
                <td class="cell-wrap">${d.direccion || ''}</td>
                <td class="cell-wrap">${d.region || ''}</td>
                <td class="cell-wrap">${d.comuna || ''}</td>
                <td class="cell-wrap">${d.estado || 'activo'}</td>
                <td class="text-center col-actions">
                    <div class="btn-group btn-group-sm table-actions" role="group" aria-label="Acciones">
                        <button class="btn btn-view" onclick="verDetalleMunicipalidad(${d.id})" title="Ver detalles">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-edit" onclick="editarMunicipalidad(${d.id})" title="Editar municipalidad">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-danger" onclick="confirmarEliminarMunicipalidad(${d.id}, '${(d.nombre || '').replace(/'/g, "\\'")}')" title="Eliminar municipalidad">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
        const buscar = document.getElementById('buscar-departamento');
        if (buscar) {
            buscar.removeAttribute('disabled');
            buscar.style.pointerEvents = 'auto';
            buscar.addEventListener('input', filtrarDepartamentos);
            // Asegurar foco inmediato en desktop
            try { buscar.focus(); } catch (_) {}
            const wrap = document.getElementById('buscar-departamento-wrap');
            if (wrap) {
                wrap.addEventListener('click', () => {
                    try { buscar.focus(); } catch (_) {}
                });
                wrap.style.pointerEvents = 'auto';
            }
        }
        try {
            if (window.mobileNav && typeof window.mobileNav.close === 'function') window.mobileNav.close();
            const overlay = document.getElementById('nav-overlay');
            if (overlay) overlay.classList.remove('active');
            document.body.style.overflow = '';
        } catch (_) {}
    } catch (error) {
        mostrarNotificacion('Error al cargar municipalidades: ' + (error.message || ''), 'danger');
    } finally {
        mostrarCargando(false);
    }
}

async function mostrarFormularioMunicipalidad(id = null) {
    try {
        mostrarCargando(true);
        let muni = { nombre: '', direccion: '', region: '', comuna: '', telefono: '', estado: 'activo' };
        let titulo = 'Nueva Municipalidad';
        let accion = 'crear';
        if (id) {
            muni = await fetchAPI(`/municipalidades/${id}`);
            titulo = 'Editar Municipalidad';
            accion = 'actualizar';
        }
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="row mb-3 align-items-center">
                <div class="col-4">
                    <button class="btn btn-outline-secondary" onclick="cargarMunicipalidades()">
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
                            <form id="form-municipalidad" data-accion="${accion}" data-id="${id || ''}">
                                <div class="row">
                                    <div class="col-md-12">
                                        <div class="mb-3">
                                            <label for="nombre" class="form-label">Nombre del municipio *</label>
                                            <input type="text" class="form-control" id="nombre" name="nombre" value="${muni.nombre || ''}" required>
                                        </div>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="rut" class="form-label">RUT *</label>
                                            <input type="text" class="form-control" id="rut" name="rut" value="${muni.rut || ''}" required>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="email" class="form-label">Correo electrónico</label>
                                            <input type="email" class="form-control" id="email" name="email" value="${muni.email || muni.email_contacto || ''}">
                                        </div>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="telefono" class="form-label">Teléfono *</label>
                                            <input type="text" class="form-control" id="telefono" name="telefono" value="${muni.telefono || muni.telefono_contacto || ''}" required>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="direccion" class="form-label">Dirección *</label>
                                            <input type="text" class="form-control" id="direccion" name="direccion" value="${muni.direccion || ''}" required>
                                        </div>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="estado" class="form-label">Estado *</label>
                                            <select class="form-select" id="estado" name="estado" required>
                                                <option value="activo" ${ (muni.estado || 'activo') === 'activo' ? 'selected' : '' }>Activo</option>
                                                <option value="inactivo" ${ (muni.estado || 'activo') === 'inactivo' ? 'selected' : '' }>Inactivo</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div class="col-md-6"></div>
                                </div>
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="region" class="form-label">Región *</label>
                                            <select class="form-select" id="region" name="region" required></select>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="comuna" class="form-label">Comuna *</label>
                                            <select class="form-select" id="comuna" name="comuna" required></select>
                                        </div>
                                    </div>
                                </div>
                                <div class="d-flex justify-content-center gap-2">
                                    <button type="submit" class="btn btn-primary btn-new-user">
                                        <i class="bi bi-save"></i> ${accion === 'crear' ? 'Crear' : 'Actualizar'} Municipalidad
                                    </button>
                                    <button type="button" class="btn btn-outline-secondary" onclick="cargarMunicipalidades()">Cancelar</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;
        await cargarRegionesYComunasEnFormulario(muni);
        const form = document.getElementById('form-municipalidad');
        form.addEventListener('submit', guardarMunicipalidad);
        const rutInput = form.querySelector('#rut');
        const telInput = form.querySelector('#telefono');
        if (rutInput) {
            rutInput.addEventListener('input', () => {
                rutInput.value = formatRutLive(rutInput.value);
            });
            rutInput.addEventListener('blur', () => {
                rutInput.value = formatRut(rutInput.value);
            });
        }
        if (telInput) {
            telInput.addEventListener('input', () => {
                telInput.value = formatPhoneLive(telInput.value);
            });
            telInput.addEventListener('blur', () => {
                telInput.value = formatPhoneLive(telInput.value);
            });
        }
    } catch (error) {
        mostrarNotificacion('Error al cargar formulario: ' + (error.message || ''), 'danger');
    } finally {
        mostrarCargando(false);
    }
}

async function guardarMunicipalidad(event) {
    event.preventDefault();
    try {
        mostrarCargando(true);
        const form = event.target;
        const accion = form.dataset.accion;
        const id = form.dataset.id;
        const nombre = (form.querySelector('#nombre') || {}).value || '';
        const rut = (form.querySelector('#rut') || {}).value || '';
        let rutNormalizado = normalizeRut(rut);
        try { console.log('[DEBUG][guardarMunicipalidad] RUT raw:', rut, ' -> normalizado:', rutNormalizado); } catch (_) {}
        if (!rutNormalizado && (rut || '').trim().length > 0) {
            rutNormalizado = String(rut).replace(/[\.\-\s]/g, '').replace(/[^0-9kK]/g, '').toLowerCase();
            try { console.log('[DEBUG][guardarMunicipalidad] RUT fallback normalizado:', rutNormalizado); } catch (_) {}
        }
        const email = (form.querySelector('#email') || {}).value || '';
        const direccion = (form.querySelector('#direccion') || {}).value || '';
        const telefono = (form.querySelector('#telefono') || {}).value || '';
        let telefonoNormalizado = (telefono || '').replace(/[^0-9]/g, '');
        try { console.log('[DEBUG][guardarMunicipalidad] Teléfono raw:', telefono, ' -> digits:', telefonoNormalizado); } catch (_) {}
        if (telefonoNormalizado.length === 9) {
            telefonoNormalizado = '+56' + telefonoNormalizado;
        } else if (telefonoNormalizado.startsWith('56') && telefonoNormalizado.length === 11) {
            telefonoNormalizado = '+' + telefonoNormalizado;
        }
        try { console.log('[DEBUG][guardarMunicipalidad] Teléfono normalizado final:', telefonoNormalizado); } catch (_) {}
        const regionSelect = form.querySelector('#region');
        const comunaSelect = form.querySelector('#comuna');
        const regionText = regionSelect.options[regionSelect.selectedIndex]?.text || '';
        const comunaText = comunaSelect.options[comunaSelect.selectedIndex]?.text || '';
        const estado = (form.querySelector('#estado') || {}).value || '';
        if (!rutNormalizado) {
            mostrarNotificacion('El RUT es obligatorio', 'danger');
            mostrarCargando(false);
            return;
        }
        if (!telefonoNormalizado && !telefono) {
            mostrarNotificacion('El teléfono es obligatorio', 'danger');
            mostrarCargando(false);
            return;
        }
        if (!email) {
            mostrarNotificacion('El correo electrónico es obligatorio', 'danger');
            mostrarCargando(false);
            return;
        }
        const payload = { nombre, rut: rutNormalizado, email, direccion, telefono: telefonoNormalizado || telefono, region: regionText, comuna: comunaText, estado };
        try {
            console.log('[DEBUG][guardarMunicipalidad] valores:', {
                accion,
                rutRaw: rut,
                rutNormalizado,
                telefonoRaw: telefono,
                telefonoNormalizado,
                email,
                direccion,
                regionText,
                comunaText,
                estado,
                payload
            });
        } catch (_) {}
        try {
            const listado = await fetchAPI('/municipalidades', { suppressErrorLog: true });
            const existentes = (listado.departamentos || []).map(d => (d.rut || '').replace(/[^0-9kK]/g, '').toLowerCase()).filter(Boolean);
            if (accion === 'crear' && rutNormalizado && existentes.includes(rutNormalizado)) {
                mostrarNotificacion('Ya existe una municipalidad con el RUT proporcionado', 'danger');
                return;
            }
        } catch (_) {}
        let response;
        if (accion === 'crear') {
            response = await fetchAPI('/municipalidades', { method: 'POST', body: payload });
        } else {
            response = await fetchAPI(`/municipalidades/${id}`, { method: 'PUT', body: payload });
        }
        mostrarNotificacion(response.message || `Municipalidad ${accion === 'crear' ? 'creada' : 'actualizada'} exitosamente`, 'success');
        cargarMunicipalidades();
    } catch (error) {
        let msg = error.message || '';
        if (/must be unique/i.test(msg) || /Duplicado/i.test(msg) || /duplicado/i.test(msg)) {
            msg = 'Ya existe una municipalidad con el RUT proporcionado';
        }
        mostrarNotificacion('Error al guardar municipalidad: ' + msg, 'danger');
    } finally {
        mostrarCargando(false);
    }
}

async function verDetalleMunicipalidad(id) {
    try {
        mostrarCargando(true);
        const d = await fetchAPI(`/municipalidades/${id}`);
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="row mb-4">
                <div class="col-12">
                    <button class="btn btn-outline-secondary mb-3" onclick="cargarMunicipalidades()">
                        <i class="bi bi-arrow-left"></i> Volver a la lista
                    </button>
                    <h2>Detalles de la Municipalidad</h2>
                </div>
            </div>
            <div class="row">
                <div class="col-md-8 offset-md-2">
                    <div class="card">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5>Información de la Municipalidad</h5>
                            <button class="btn btn-edit" onclick="editarMunicipalidad(${d.id})">
                                <i class="bi bi-pencil"></i> Editar
                            </button>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <p><strong>ID:</strong> ${d.id}</p>
                                    <p><strong>Nombre:</strong> ${d.nombre}</p>
                                </div>
                                <div class="col-md-6">
                                    <p><strong>RUT:</strong> ${formatRut(d.rut) || '-'}</p>
                                    <p><strong>Email:</strong> ${d.email || d.email_contacto || '-'}</p>
                                    <p><strong>Dirección:</strong> ${d.direccion || '-'}</p>
                                    <p><strong>Región:</strong> ${d.region || '-'}</p>
                                    <p><strong>Comuna:</strong> ${d.comuna || '-'}</p>
                                    <p><strong>Teléfono:</strong> ${d.telefono || d.telefono_contacto || '-'}</p>
                                    <p><strong>Estado:</strong> ${d.estado || 'activo'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        mostrarNotificacion('Error al cargar detalles: ' + (error.message || ''), 'danger');
    } finally {
        mostrarCargando(false);
    }
}

async function editarMunicipalidad(id) { await mostrarFormularioMunicipalidad(id); }

function ensureEliminarMunicipalidadModal() {
    if (document.getElementById('modal-eliminar-municipalidad')) return;
    const html = `
<div class="modal fade" id="modal-eliminar-municipalidad" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header bg-danger text-white">
        <h5 class="modal-title"><i class="bi bi-exclamation-triangle"></i> Confirmar eliminación</h5>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Cerrar"></button>
      </div>
      <div class="modal-body">
        <p id="msg-eliminar-muni" class="mb-2"></p>
        <div class="form-check mb-2">
          <input class="form-check-input" type="checkbox" value="1" id="chk-confirmar-eliminar-muni">
          <label class="form-check-label" for="chk-confirmar-eliminar-muni">
            Entiendo que esta acción no se puede deshacer
          </label>
        </div>
        <div class="mb-2">
          <label for="input-confirmar-eliminar-muni" class="form-label">Escribe ELIMINAR para confirmar</label>
          <input type="text" class="form-control" id="input-confirmar-eliminar-muni" placeholder="ELIMINAR">
        </div>
        <div id="error-eliminar-muni" class="text-danger small d-none">Debes marcar la casilla y escribir ELIMINAR.</div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
        <button type="button" class="btn btn-danger" id="btn-confirmar-eliminar-muni"><i class="bi bi-trash"></i> Eliminar</button>
      </div>
    </div>
  </div>
</div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    const btn = document.getElementById('btn-confirmar-eliminar-muni');
    if (btn) btn.addEventListener('click', eliminarMunicipalidadConfirmado);
}

function confirmarEliminarMunicipalidad(id, nombre) {
    ensureEliminarMunicipalidadModal();
    const modalEl = document.getElementById('modal-eliminar-municipalidad');
    const msg = document.getElementById('msg-eliminar-muni');
    const chk = document.getElementById('chk-confirmar-eliminar-muni');
    const input = document.getElementById('input-confirmar-eliminar-muni');
    const err = document.getElementById('error-eliminar-muni');
    if (msg) msg.textContent = `Vas a eliminar la municipalidad "${nombre}" (ID: ${id}).`;
    if (chk) chk.checked = false;
    if (input) { input.value = ''; input.dataset.muniId = String(id); }
    if (err) err.classList.add('d-none');
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
}

async function eliminarMunicipalidadConfirmado() {
    try {
        const input = document.getElementById('input-confirmar-eliminar-muni');
        const chk = document.getElementById('chk-confirmar-eliminar-muni');
        const err = document.getElementById('error-eliminar-muni');
        const id = parseInt(input?.dataset?.muniId || '0', 10);
        const okText = (input?.value || '').trim().toUpperCase() === 'ELIMINAR';
        if (!chk?.checked || !okText || !id) {
            if (err) err.classList.remove('d-none');
            return;
        }
        mostrarCargando(true);
        await fetchAPI(`/municipalidades/${id}`, { method: 'DELETE' });
        mostrarNotificacion('Municipalidad eliminada exitosamente', 'success');
        const modalEl = document.getElementById('modal-eliminar-municipalidad');
        try { bootstrap.Modal.getInstance(modalEl)?.hide(); } catch (_) {}
        cargarMunicipalidades();
    } catch (error) {
        mostrarNotificacion('Error al eliminar municipalidad: ' + (error.message || ''), 'danger');
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
                                </div>
                                <div class="col-md-6"></div>
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
    const filas = document.querySelectorAll('#tabla-departamentos tr');
    filas.forEach(fila => {
        const nombre = fila.cells[1].textContent.toLowerCase();
        fila.style.display = nombre.includes(busqueda) ? '' : 'none';
    });
}
