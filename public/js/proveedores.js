/**
 * Módulo para la gestión de proveedores municipales
 * Este archivo contiene las funciones para administrar proveedores, contratos y pagos
 */

/**
 * Función para cargar la lista de proveedores
 */
async function cargarProveedores() {
    try {
        mostrarCargando(true);
        
        const proveedores = await fetchAPI('/proveedores');
        
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="row mb-4">
                <div class="col-12 d-flex justify-content-between align-items-center">
                    <h2>Gestión de Proveedores</h2>
                    <button class="btn btn-primary" onclick="mostrarFormularioProveedor()">
                        <i class="bi bi-plus-circle"></i> Nuevo Proveedor
                    </button>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <div class="row">
                        <div class="col-md-4">
                            <input type="text" class="form-control" id="buscar-proveedor" placeholder="Buscar proveedor...">
                        </div>
                        <div class="col-md-3">
                            <select class="form-select" id="filtro-tipo-servicio">
                                <option value="">Todos los servicios</option>
                                <option value="construccion">Construcción</option>
                                <option value="consultoria">Consultoría</option>
                                <option value="suministros">Suministros</option>
                                <option value="tecnologia">Tecnología</option>
                                <option value="mantenimiento">Mantenimiento</option>
                                <option value="otros">Otros</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <select class="form-select" id="filtro-estado">
                                <option value="">Todos los estados</option>
                                <option value="activo">Activo</option>
                                <option value="inactivo">Inactivo</option>
                            </select>
                        </div>
                        <div class="col-md-2">
                            <button class="btn btn-outline-secondary w-100" onclick="generarReporteProveedores()">
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
                                    <th>RUT/NIT</th>
                                    <th>Tipo de Servicio</th>
                                    <th>Contacto</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody id="tabla-proveedores">
                                ${proveedores.map(proveedor => `
                                    <tr>
                                        <td>${proveedor.id}</td>
                                        <td>${proveedor.nombre}</td>
                                        <td>${proveedor.rut_nit}</td>
                                        <td>${proveedor.tipo_servicio}</td>
                                        <td>${proveedor.email}</td>
                                        <td><span class="estado-${proveedor.estado}">${proveedor.estado}</span></td>
                                        <td>
                                            <button class="btn btn-sm btn-info" onclick="verDetalleProveedor(${proveedor.id})">
                                                <i class="bi bi-eye"></i>
                                            </button>
                                            <button class="btn btn-sm btn-primary" onclick="editarProveedor(${proveedor.id})">
                                                <i class="bi bi-pencil"></i>
                                            </button>
                                            <button class="btn btn-sm btn-${proveedor.estado === 'activo' ? 'warning' : 'success'}" 
                                                    onclick="cambiarEstadoProveedor(${proveedor.id}, '${proveedor.estado === 'activo' ? 'inactivo' : 'activo'}')">
                                                <i class="bi bi-${proveedor.estado === 'activo' ? 'x-circle' : 'check-circle'}"></i>
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
        const buscarProveedor = document.getElementById('buscar-proveedor');
        const filtroTipoServicio = document.getElementById('filtro-tipo-servicio');
        const filtroEstado = document.getElementById('filtro-estado');
        
        if (buscarProveedor && filtroTipoServicio && filtroEstado) {
            buscarProveedor.addEventListener('input', filtrarProveedores);
            filtroTipoServicio.addEventListener('change', filtrarProveedores);
            filtroEstado.addEventListener('change', filtrarProveedores);
        }
        
    } catch (error) {
        console.error('Error al cargar proveedores:', error);
        mostrarNotificacion('Error al cargar proveedores: ' + error.message, 'danger');
    } finally {
        mostrarCargando(false);
    }
}

/**
 * Función para filtrar proveedores según criterios de búsqueda
 */
function filtrarProveedores() {
    const busqueda = document.getElementById('buscar-proveedor').value.toLowerCase();
    const tipoServicio = document.getElementById('filtro-tipo-servicio').value;
    const estado = document.getElementById('filtro-estado').value;
    
    const filas = document.querySelectorAll('#tabla-proveedores tr');
    
    filas.forEach(fila => {
        const nombre = fila.cells[1].textContent.toLowerCase();
        const rut = fila.cells[2].textContent.toLowerCase();
        const servicio = fila.cells[3].textContent.toLowerCase();
        const estadoProveedor = fila.cells[5].textContent.toLowerCase();
        
        const coincideBusqueda = nombre.includes(busqueda) || rut.includes(busqueda);
        const coincideServicio = tipoServicio === '' || servicio === tipoServicio;
        const coincideEstado = estado === '' || estadoProveedor === estado;
        
        if (coincideBusqueda && coincideServicio && coincideEstado) {
            fila.style.display = '';
        } else {
            fila.style.display = 'none';
        }
    });
}

/**
 * Función para mostrar el formulario de creación/edición de proveedor
 * @param {number} proveedorId - ID del proveedor a editar (opcional)
 */
async function mostrarFormularioProveedor(proveedorId = null) {
    try {
        mostrarCargando(true);
        
        let proveedor = {
            codigo: '',
            razon_social: '',
            nombre_comercial: '',
            rut: '',
            direccion: '',
            ciudad: '',
            region: '',
            telefono: '',
            email: '',
            sitio_web: '',
            representante_legal: '',
            rut_representante: '',
            giro: '',
            categoria: 'servicios',
            estado: 'activo',
            calificacion: null,
            notas: '',
            cuenta_bancaria: '',
            banco: '',
            tipo_cuenta: ''
        };
        
        let titulo = 'Nuevo Proveedor';
        let accion = 'crear';
        
        if (proveedorId) {
            proveedor = await fetchAPI(`/proveedores/${proveedorId}`);
            titulo = 'Editar Proveedor';
            accion = 'actualizar';
        }
        
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="row mb-4">
                <div class="col-12">
                    <button class="btn btn-outline-secondary mb-3" onclick="cargarProveedores()">
                        <i class="bi bi-arrow-left"></i> Volver a la lista
                    </button>
                    <h2>${titulo}</h2>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-10 offset-md-1">
                    <div class="card">
                        <div class="card-body">
                            <form id="form-proveedor">
                                <input type="hidden" id="proveedor-id" value="${proveedor.id || ''}">
                                <input type="hidden" id="accion" value="${accion}">
                                
                                <div class="row mb-3">
                                    <div class="col-md-3">
                                        <label for="codigo" class="form-label">Código *</label>
                                        <input type="text" class="form-control" id="codigo" value="${proveedor.codigo}" required>
                                    </div>
                                    <div class="col-md-5">
                                        <label for="razon-social" class="form-label">Razón Social *</label>
                                        <input type="text" class="form-control" id="razon-social" value="${proveedor.razon_social}" required>
                                    </div>
                                    <div class="col-md-4">
                                        <label for="rut" class="form-label">RUT *</label>
                                        <input type="text" class="form-control" id="rut" value="${proveedor.rut}" required>
                                    </div>
                                </div>
                                
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <label for="nombre-comercial" class="form-label">Nombre Comercial</label>
                                        <input type="text" class="form-control" id="nombre-comercial" value="${proveedor.nombre_comercial || ''}">
                                    </div>
                                    <div class="col-md-6">
                                        <label for="giro" class="form-label">Giro *</label>
                                        <input type="text" class="form-control" id="giro" value="${proveedor.giro}" required>
                                    </div>
                                </div>
                                
                                <div class="row mb-3">
                                    <div class="col-md-4">
                                        <label for="categoria" class="form-label">Categoría *</label>
                                        <select class="form-select" id="categoria" required>
                                            <option value="servicios" ${proveedor.categoria === 'servicios' ? 'selected' : ''}>Servicios</option>
                                            <option value="construccion" ${proveedor.categoria === 'construccion' ? 'selected' : ''}>Construcción</option>
                                            <option value="tecnologia" ${proveedor.categoria === 'tecnologia' ? 'selected' : ''}>Tecnología</option>
                                            <option value="suministros" ${proveedor.categoria === 'suministros' ? 'selected' : ''}>Suministros</option>
                                            <option value="consultoria" ${proveedor.categoria === 'consultoria' ? 'selected' : ''}>Consultoría</option>
                                            <option value="otro" ${proveedor.categoria === 'otro' ? 'selected' : ''}>Otro</option>
                                        </select>
                                    </div>
                                    <div class="col-md-4">
                                        <label for="estado" class="form-label">Estado *</label>
                                        <select class="form-select" id="estado" required>
                                            <option value="activo" ${proveedor.estado === 'activo' ? 'selected' : ''}>Activo</option>
                                            <option value="inactivo" ${proveedor.estado === 'inactivo' ? 'selected' : ''}>Inactivo</option>
                                            <option value="bloqueado" ${proveedor.estado === 'bloqueado' ? 'selected' : ''}>Bloqueado</option>
                                        </select>
                                    </div>
                                    <div class="col-md-4">
                                        <label for="calificacion" class="form-label">Calificación</label>
                                        <select class="form-select" id="calificacion">
                                            <option value="">Sin calificar</option>
                                            <option value="1" ${proveedor.calificacion === 1 ? 'selected' : ''}>1 - Muy malo</option>
                                            <option value="2" ${proveedor.calificacion === 2 ? 'selected' : ''}>2 - Malo</option>
                                            <option value="3" ${proveedor.calificacion === 3 ? 'selected' : ''}>3 - Regular</option>
                                            <option value="4" ${proveedor.calificacion === 4 ? 'selected' : ''}>4 - Bueno</option>
                                            <option value="5" ${proveedor.calificacion === 5 ? 'selected' : ''}>5 - Excelente</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="direccion" class="form-label">Dirección *</label>
                                    <input type="text" class="form-control" id="direccion" value="${proveedor.direccion}" required>
                                </div>
                                
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <label for="ciudad" class="form-label">Ciudad *</label>
                                        <input type="text" class="form-control" id="ciudad" value="${proveedor.ciudad}" required>
                                    </div>
                                    <div class="col-md-6">
                                        <label for="region" class="form-label">Región *</label>
                                        <input type="text" class="form-control" id="region" value="${proveedor.region}" required>
                                    </div>
                                </div>
                                
                                <div class="row mb-3">
                                    <div class="col-md-4">
                                        <label for="telefono" class="form-label">Teléfono *</label>
                                        <input type="tel" class="form-control" id="telefono" value="${proveedor.telefono}" required>
                                    </div>
                                    <div class="col-md-4">
                                        <label for="email" class="form-label">Email *</label>
                                        <input type="email" class="form-control" id="email" value="${proveedor.email}" required>
                                    </div>
                                    <div class="col-md-4">
                                        <label for="sitio-web" class="form-label">Sitio Web</label>
                                        <input type="url" class="form-control" id="sitio-web" value="${proveedor.sitio_web || ''}">
                                    </div>
                                </div>
                                
                                <h5 class="mt-4 mb-3">Representante Legal</h5>
                                
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <label for="representante-legal" class="form-label">Nombre del Representante Legal *</label>
                                        <input type="text" class="form-control" id="representante-legal" value="${proveedor.representante_legal}" required>
                                    </div>
                                    <div class="col-md-6">
                                        <label for="rut-representante" class="form-label">RUT del Representante *</label>
                                        <input type="text" class="form-control" id="rut-representante" value="${proveedor.rut_representante}" required>
                                    </div>
                                </div>
                                
                                <h5 class="mt-4 mb-3">Información Bancaria</h5>
                                
                                <div class="row mb-3">
                                    <div class="col-md-4">
                                        <label for="banco" class="form-label">Banco</label>
                                        <input type="text" class="form-control" id="banco" value="${proveedor.banco || ''}">
                                    </div>
                                    <div class="col-md-4">
                                        <label for="tipo-cuenta" class="form-label">Tipo de Cuenta</label>
                                        <select class="form-select" id="tipo-cuenta">
                                            <option value="">Seleccione tipo</option>
                                            <option value="corriente" ${proveedor.tipo_cuenta === 'corriente' ? 'selected' : ''}>Cuenta Corriente</option>
                                            <option value="ahorro" ${proveedor.tipo_cuenta === 'ahorro' ? 'selected' : ''}>Cuenta de Ahorro</option>
                                            <option value="vista" ${proveedor.tipo_cuenta === 'vista' ? 'selected' : ''}>Cuenta Vista</option>
                                        </select>
                                    </div>
                                    <div class="col-md-4">
                                        <label for="cuenta-bancaria" class="form-label">Número de Cuenta</label>
                                        <input type="text" class="form-control" id="cuenta-bancaria" value="${proveedor.cuenta_bancaria || ''}">
                                    </div>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="notas" class="form-label">Notas</label>
                                    <textarea class="form-control" id="notas" rows="3">${proveedor.notas || ''}</textarea>
                                </div>
                                
                                <div class="d-grid gap-2">
                                    <button type="submit" class="btn btn-primary">
                                        <i class="bi bi-save"></i> Guardar
                                    </button>
                                    <button type="button" class="btn btn-outline-secondary" onclick="cargarProveedores()">
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
        const formProveedor = document.getElementById('form-proveedor');
        formProveedor.addEventListener('submit', guardarProveedor);

        // Listeners para normalización y validación de RUT (empresa y representante)
        const rutEmpresaInput = document.getElementById('rut');
        const rutRepInput = document.getElementById('rut-representante');
        const limpiarInputRut = (input) => {
            if (!input) return;
            input.classList.remove('is-invalid');
            const fb = input.parentElement.querySelector('.invalid-feedback');
            if (fb) fb.remove();
        };
        const marcarInputRutInvalido = (input, mensaje) => {
            if (!input) return;
            input.classList.add('is-invalid');
            let fb = input.parentElement.querySelector('.invalid-feedback');
            if (!fb) {
                fb = document.createElement('div');
                fb.className = 'invalid-feedback';
                input.parentElement.appendChild(fb);
            }
            fb.textContent = mensaje || 'RUT inválido';
        };
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
        const calcularDV = (numeroStr) => {
            let suma = 0;
            let multiplicador = 2;
            for (let i = numeroStr.length - 1; i >= 0; i--) {
                suma += parseInt(numeroStr[i], 10) * multiplicador;
                multiplicador = multiplicador === 7 ? 2 : (multiplicador + 1);
            }
            const resto = suma % 11;
            const dvCalculado = resto === 0 ? '0' : resto === 1 ? 'K' : (11 - resto).toString();
            return dvCalculado;
        };
        const validarRUT = (rut) => {
            const n = normalizarRUT(rut);
            if (!/^\d{8}-[\dK]$/.test(n)) return false;
            const [num, dv] = n.split('-');
            return calcularDV(num) === dv;
        };
        const wireRutInput = (input) => {
            if (!input) return;
            input.addEventListener('input', (e) => {
                const raw = (e.target.value || '').replace(/\./g, '');
                const limpio = raw.replace(/[^0-9kK]/g, '');
                e.target.value = limpio.slice(0, 9);
                limpiarInputRut(e.target);
            });
            input.addEventListener('blur', (e) => {
                const valor = e.target.value || '';
                const normalizado = normalizarRUT(valor);
                e.target.value = normalizado;
                if (normalizado && !validarRUT(normalizado)) {
                    marcarInputRutInvalido(e.target, 'RUT inválido. Formato 12345678-9 (sin puntos) y DV correcto');
                } else {
                    limpiarInputRut(e.target);
                }
            });
        };
        wireRutInput(rutEmpresaInput);
        wireRutInput(rutRepInput);
        
    } catch (error) {
        console.error('Error al cargar formulario de proveedor:', error);
        mostrarNotificacion('Error al cargar formulario: ' + error.message, 'danger');
    } finally {
        mostrarCargando(false);
    }
}

/**
 * Función para guardar un proveedor (crear o actualizar)
 * @param {Event} e - Evento del formulario
 */
async function guardarProveedor(e) {
    e.preventDefault();
    
    try {
        mostrarCargando(true);
        
        const proveedorId = document.getElementById('proveedor-id').value;
        const accion = document.getElementById('accion').value;
        
        const proveedor = {
            codigo: document.getElementById('codigo').value,
            razon_social: document.getElementById('razon-social').value,
            nombre_comercial: document.getElementById('nombre-comercial').value || null,
            rut: document.getElementById('rut').value,
            direccion: document.getElementById('direccion').value,
            ciudad: document.getElementById('ciudad').value,
            region: document.getElementById('region').value,
            telefono: document.getElementById('telefono').value,
            email: document.getElementById('email').value,
            sitio_web: document.getElementById('sitio-web').value || null,
            representante_legal: document.getElementById('representante-legal').value,
            rut_representante: document.getElementById('rut-representante').value,
            giro: document.getElementById('giro').value,
            categoria: document.getElementById('categoria').value,
            estado: document.getElementById('estado').value,
            calificacion: document.getElementById('calificacion').value || null,
            notas: document.getElementById('notas').value || null,
            cuenta_bancaria: document.getElementById('cuenta-bancaria').value || null,
            banco: document.getElementById('banco').value || null,
            tipo_cuenta: document.getElementById('tipo-cuenta').value || null
        };

        // Normalizar y validar RUTs
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
        const calcularDV = (numeroStr) => {
            let suma = 0;
            let multiplicador = 2;
            for (let i = numeroStr.length - 1; i >= 0; i--) {
                suma += parseInt(numeroStr[i], 10) * multiplicador;
                multiplicador = multiplicador === 7 ? 2 : (multiplicador + 1);
            }
            const resto = suma % 11;
            const dvCalculado = resto === 0 ? '0' : resto === 1 ? 'K' : (11 - resto).toString();
            return dvCalculado;
        };
        const validarRUT = (rut) => {
            const n = normalizarRUT(rut);
            if (!/^\d{8}-[\dK]$/.test(n)) return false;
            const [num, dv] = n.split('-');
            return calcularDV(num) === dv;
        };

        const rutEmpresaInput = document.getElementById('rut');
        const rutRepInput = document.getElementById('rut-representante');
        const marcarInvalido = (input, mensaje) => {
            if (!input) return;
            input.classList.add('is-invalid');
            let fb = input.parentElement.querySelector('.invalid-feedback');
            if (!fb) {
                fb = document.createElement('div');
                fb.className = 'invalid-feedback';
                input.parentElement.appendChild(fb);
            }
            fb.textContent = mensaje || 'Campo inválido';
        };
        const limpiarInvalido = (input) => {
            if (!input) return;
            input.classList.remove('is-invalid');
            const fb = input.parentElement.querySelector('.invalid-feedback');
            if (fb) fb.remove();
        };

        // Normalizar valores antes de enviar
        proveedor.rut = normalizarRUT(proveedor.rut);
        proveedor.rut_representante = normalizarRUT(proveedor.rut_representante);

        // Validaciones
        let errores = [];
        if (!validarRUT(proveedor.rut)) {
            errores.push('RUT de la empresa inválido');
            marcarInvalido(rutEmpresaInput, 'RUT inválido. Formato 12345678-9 (sin puntos) y DV correcto');
        } else {
            limpiarInvalido(rutEmpresaInput);
        }
        if (!validarRUT(proveedor.rut_representante)) {
            errores.push('RUT del representante inválido');
            marcarInvalido(rutRepInput, 'RUT inválido. Formato 12345678-9 (sin puntos) y DV correcto');
        } else {
            limpiarInvalido(rutRepInput);
        }
        if (errores.length) {
            mostrarNotificacion(errores.join('. '), 'danger');
            mostrarCargando(false);
            return;
        }
        
        let respuesta;
        
        if (accion === 'crear') {
            respuesta = await fetchAPI('/proveedores', {
                method: 'POST',
                body: JSON.stringify(proveedor)
            });
            mostrarNotificacion('Proveedor creado correctamente', 'success');
        } else {
            respuesta = await fetchAPI(`/proveedores/${proveedorId}`, {
                method: 'PUT',
                body: JSON.stringify(proveedor)
            });
            mostrarNotificacion('Proveedor actualizado correctamente', 'success');
        }
        
        cargarProveedores();
        
    } catch (error) {
        console.error('Error al guardar proveedor:', error);
        mostrarNotificacion('Error al guardar proveedor: ' + error.message, 'danger');
    } finally {
        mostrarCargando(false);
    }
}

/**
 * Función para editar un proveedor
 * @param {number} proveedorId - ID del proveedor a editar
 */
function editarProveedor(proveedorId) {
    mostrarFormularioProveedor(proveedorId);
}

/**
 * Función para cambiar el estado de un proveedor
 * @param {number} proveedorId - ID del proveedor
 * @param {string} nuevoEstado - Nuevo estado ('activo' o 'inactivo')
 */
async function cambiarEstadoProveedor(proveedorId, nuevoEstado) {
    try {
        mostrarCargando(true);
        
        await fetchAPI(`/proveedores/${proveedorId}/estado`, {
            method: 'PUT',
            body: JSON.stringify({ estado: nuevoEstado })
        });
        
        mostrarNotificacion(`Proveedor ${nuevoEstado === 'activo' ? 'activado' : 'desactivado'} correctamente`, 'success');
        cargarProveedores();
        
    } catch (error) {
        console.error('Error al cambiar estado del proveedor:', error);
        mostrarNotificacion('Error al cambiar estado: ' + error.message, 'danger');
    } finally {
        mostrarCargando(false);
    }
}

/**
 * Función para ver el detalle de un proveedor
 * @param {number} proveedorId - ID del proveedor
 */
async function verDetalleProveedor(proveedorId) {
    try {
        mostrarCargando(true);
        
        const proveedor = await fetchAPI(`/proveedores/${proveedorId}`);
        const contratos = await fetchAPI(`/proveedores/${proveedorId}/contratos`);
        const pagos = await fetchAPI(`/proveedores/${proveedorId}/pagos`);
        
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="row mb-4">
                <div class="col-12">
                    <button class="btn btn-outline-secondary mb-3" onclick="cargarProveedores()">
                        <i class="bi bi-arrow-left"></i> Volver a la lista
                    </button>
                    <h2>Detalle del Proveedor</h2>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-10 offset-md-1">
                    <div class="card mb-4">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="mb-0">Información General</h5>
                            <div>
                                <button class="btn btn-primary" onclick="editarProveedor(${proveedor.id})">
                                    <i class="bi bi-pencil"></i> Editar
                                </button>
                                <button class="btn btn-${proveedor.estado === 'activo' ? 'warning' : 'success'}" 
                                        onclick="cambiarEstadoProveedor(${proveedor.id}, '${proveedor.estado === 'activo' ? 'inactivo' : 'activo'}')">
                                    <i class="bi bi-${proveedor.estado === 'activo' ? 'x-circle' : 'check-circle'}"></i> 
                                    ${proveedor.estado === 'activo' ? 'Desactivar' : 'Activar'}
                                </button>
                                <button class="btn btn-info" onclick="generarReporteProveedor(${proveedor.id})">
                                    <i class="bi bi-file-earmark-text"></i> Generar Reporte
                                </button>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">ID:</div>
                                <div class="col-md-8">${proveedor.id}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Nombre o Razón Social:</div>
                                <div class="col-md-8">${proveedor.nombre}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">RUT/NIT:</div>
                                <div class="col-md-8">${proveedor.rut_nit}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Tipo de Servicio:</div>
                                <div class="col-md-8">${proveedor.tipo_servicio}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Estado:</div>
                                <div class="col-md-8"><span class="estado-${proveedor.estado}">${proveedor.estado}</span></div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Dirección:</div>
                                <div class="col-md-8">${proveedor.direccion || 'No especificada'}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Teléfono:</div>
                                <div class="col-md-8">${proveedor.telefono || 'No especificado'}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Email:</div>
                                <div class="col-md-8">${proveedor.email || 'No especificado'}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Sitio Web:</div>
                                <div class="col-md-8">
                                    ${proveedor.sitio_web ? `<a href="${proveedor.sitio_web}" target="_blank">${proveedor.sitio_web}</a>` : 'No especificado'}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="card mb-4">
                        <div class="card-header">
                            <h5>Información de Contacto</h5>
                        </div>
                        <div class="card-body">
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Nombre del Contacto:</div>
                                <div class="col-md-8">${proveedor.contacto_nombre || 'No especificado'}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Teléfono del Contacto:</div>
                                <div class="col-md-8">${proveedor.contacto_telefono || 'No especificado'}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Email del Contacto:</div>
                                <div class="col-md-8">${proveedor.contacto_email || 'No especificado'}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="card mb-4">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="mb-0">Contratos</h5>
                            <button class="btn btn-primary btn-sm" onclick="mostrarFormularioContrato(${proveedor.id})">
                                <i class="bi bi-plus-circle"></i> Nuevo Contrato
                            </button>
                        </div>
                        <div class="card-body">
                            ${!contratos || contratos.length === 0 ? `
                                <p>No hay contratos registrados para este proveedor.</p>
                            ` : `
                                <div class="table-responsive">
                                    <table class="table table-striped table-hover">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Número</th>
                                                <th>Descripción</th>
                                                <th>Fecha Inicio</th>
                                                <th>Fecha Fin</th>
                                                <th>Monto</th>
                                                <th>Estado</th>
                                                <th>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${contratos.map(contrato => `
                                                <tr>
                                                    <td>${contrato.id}</td>
                                                    <td>${contrato.numero}</td>
                                                    <td>${contrato.descripcion}</td>
                                                    <td>${formatearFecha(contrato.fecha_inicio)}</td>
                                                    <td>${formatearFecha(contrato.fecha_fin)}</td>
                                                    <td>${formatearMoneda(contrato.monto)}</td>
                                                    <td><span class="estado-${contrato.estado}">${contrato.estado}</span></td>
                                                    <td>
                                                        <button class="btn btn-sm btn-info" onclick="verDetalleContrato(${contrato.id})">
                                                            <i class="bi bi-eye"></i>
                                                        </button>
                                                        ${contrato.estado !== 'finalizado' && contrato.estado !== 'cancelado' ? `
                                                            <button class="btn btn-sm btn-primary" onclick="editarContrato(${contrato.id})">
                                                                <i class="bi bi-pencil"></i>
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
                    
                    <div class="card">
                        <div class="card-header">
                            <h5>Pagos Realizados</h5>
                        </div>
                        <div class="card-body">
                            ${!pagos || pagos.length === 0 ? `
                                <p>No hay pagos registrados para este proveedor.</p>
                            ` : `
                                <div class="table-responsive">
                                    <table class="table table-striped table-hover">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Fecha</th>
                                                <th>Monto</th>
                                                <th>Concepto</th>
                                                <th>Contrato</th>
                                                <th>Método de Pago</th>
                                                <th>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${pagos.map(pago => `
                                                <tr>
                                                    <td>${pago.id}</td>
                                                    <td>${formatearFecha(pago.fecha)}</td>
                                                    <td>${formatearMoneda(pago.monto)}</td>
                                                    <td>${pago.concepto}</td>
                                                    <td>${pago.contrato?.numero || 'N/A'}</td>
                                                    <td>${obtenerNombreMetodoPago(pago.metodo_pago)}</td>
                                                    <td>
                                                        <button class="btn btn-sm btn-info" onclick="verDetallePago(${pago.id})">
                                                            <i class="bi bi-eye"></i>
                                                        </button>
                                                        <button class="btn btn-sm btn-secondary" onclick="descargarComprobantePago(${pago.id})">
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
            </div>
        `;
        
    } catch (error) {
        console.error('Error al cargar detalle del proveedor:', error);
        mostrarNotificacion('Error al cargar detalle: ' + error.message, 'danger');
    } finally {
        mostrarCargando(false);
    }
}

/**
 * Función para mostrar el formulario de creación de contrato
 * @param {number} proveedorId - ID del proveedor
 */
async function mostrarFormularioContrato(proveedorId) {
    try {
        mostrarCargando(true);
        
        const proveedor = await fetchAPI(`/proveedores/${proveedorId}`);
        const responseProyectos = await fetchAPI('/proyectos');
        const proyectos = responseProyectos.proyectos || [];
        
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="row mb-4">
                <div class="col-12">
                    <button class="btn btn-outline-secondary mb-3" onclick="verDetalleProveedor(${proveedorId})">
                        <i class="bi bi-arrow-left"></i> Volver al proveedor
                    </button>
                    <h2>Nuevo Contrato</h2>
                    <p>Proveedor: ${proveedor.nombre}</p>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-10 offset-md-1">
                    <div class="card">
                        <div class="card-body">
                            <form id="form-contrato">
                                <input type="hidden" id="proveedor-id" value="${proveedorId}">
                                
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <label for="numero" class="form-label">Número de Contrato</label>
                                        <input type="text" class="form-control" id="numero" required>
                                    </div>
                                    <div class="col-md-6">
                                        <label for="estado" class="form-label">Estado</label>
                                        <select class="form-select" id="estado" required>
                                            <option value="borrador">Borrador</option>
                                            <option value="activo">Activo</option>
                                            <option value="finalizado">Finalizado</option>
                                            <option value="cancelado">Cancelado</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="descripcion" class="form-label">Descripción</label>
                                    <textarea class="form-control" id="descripcion" rows="3" required></textarea>
                                </div>
                                
                                <div class="row mb-3">
                                    <div class="col-md-4">
                                        <label for="fecha-inicio" class="form-label">Fecha de Inicio</label>
                                        <input type="date" class="form-control" id="fecha-inicio" value="${new Date().toISOString().split('T')[0]}" required>
                                    </div>
                                    <div class="col-md-4">
                                        <label for="fecha-fin" class="form-label">Fecha de Fin</label>
                                        <input type="date" class="form-control" id="fecha-fin" required>
                                    </div>
                                    <div class="col-md-4">
                                        <label for="monto" class="form-label">Monto</label>
                                        <div class="input-group">
                                            <span class="input-group-text">$</span>
                                            <input type="number" class="form-control" id="monto" min="0" step="0.01" required>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="proyecto" class="form-label">Proyecto Asociado (Opcional)</label>
                                    <select class="form-select" id="proyecto">
                                        <option value="">Ninguno</option>
                                        ${proyectos.map(proyecto => `
                                            <option value="${proyecto.id}">${proyecto.nombre}</option>
                                        `).join('')}
                                    </select>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="terminos" class="form-label">Términos y Condiciones</label>
                                    <textarea class="form-control" id="terminos" rows="4"></textarea>
                                </div>
                                
                                <div class="d-grid gap-2">
                                    <button type="submit" class="btn btn-primary">
                                        <i class="bi bi-save"></i> Guardar Contrato
                                    </button>
                                    <button type="button" class="btn btn-outline-secondary" onclick="verDetalleProveedor(${proveedorId})">
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
        const formContrato = document.getElementById('form-contrato');
        formContrato.addEventListener('submit', guardarContrato);
        
    } catch (error) {
        console.error('Error al cargar formulario de contrato:', error);
        mostrarNotificacion('Error al cargar formulario: ' + error.message, 'danger');
    } finally {
        mostrarCargando(false);
    }
}

/**
 * Función para guardar un contrato
 * @param {Event} e - Evento del formulario
 */
async function guardarContrato(e) {
    e.preventDefault();
    
    try {
        mostrarCargando(true);
        
        const proveedorId = document.getElementById('proveedor-id').value;
        
        const contrato = {
            proveedor_id: parseInt(proveedorId),
            numero: document.getElementById('numero').value,
            descripcion: document.getElementById('descripcion').value,
            fecha_inicio: document.getElementById('fecha-inicio').value,
            fecha_fin: document.getElementById('fecha-fin').value,
            monto: parseFloat(document.getElementById('monto').value),
            estado: document.getElementById('estado').value,
            terminos: document.getElementById('terminos').value,
            proyecto_id: document.getElementById('proyecto').value || null
        };
        
        await fetchAPI('/contratos', {
            method: 'POST',
            body: JSON.stringify(contrato)
        });
        
        mostrarNotificacion('Contrato creado correctamente', 'success');
        verDetalleProveedor(proveedorId);
        
    } catch (error) {
        console.error('Error al guardar contrato:', error);
        mostrarNotificacion('Error al guardar contrato: ' + error.message, 'danger');
    } finally {
        mostrarCargando(false);
    }
}

/**
 * Función para ver el detalle de un contrato
 * @param {number} contratoId - ID del contrato
 */
async function verDetalleContrato(contratoId) {
    try {
        mostrarCargando(true);
        
        const contrato = await fetchAPI(`/contratos/${contratoId}`);
        const pagos = await fetchAPI(`/contratos/${contratoId}/pagos`);
        
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="row mb-4">
                <div class="col-12">
                    <button class="btn btn-outline-secondary mb-3" onclick="verDetalleProveedor(${contrato.proveedor_id})">
                        <i class="bi bi-arrow-left"></i> Volver al proveedor
                    </button>
                    <h2>Detalle del Contrato</h2>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-10 offset-md-1">
                    <div class="card mb-4">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="mb-0">Información del Contrato</h5>
                            <div>
                                ${contrato.estado !== 'finalizado' && contrato.estado !== 'cancelado' ? `
                                    <button class="btn btn-primary" onclick="editarContrato(${contrato.id})">
                                        <i class="bi bi-pencil"></i> Editar
                                    </button>
                                    <button class="btn btn-success" onclick="mostrarFormularioPago(${contrato.id})">
                                        <i class="bi bi-cash"></i> Registrar Pago
                                    </button>
                                ` : ''}
                                <button class="btn btn-info" onclick="descargarContrato(${contrato.id})">
                                    <i class="bi bi-download"></i> Descargar
                                </button>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">ID:</div>
                                <div class="col-md-8">${contrato.id}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Número:</div>
                                <div class="col-md-8">${contrato.numero}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Proveedor:</div>
                                <div class="col-md-8">${contrato.proveedor?.nombre || 'N/A'}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Proyecto:</div>
                                <div class="col-md-8">${contrato.proyecto?.nombre || 'No asociado a proyecto'}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Fecha de Inicio:</div>
                                <div class="col-md-8">${formatearFecha(contrato.fecha_inicio)}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Fecha de Fin:</div>
                                <div class="col-md-8">${formatearFecha(contrato.fecha_fin)}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Monto:</div>
                                <div class="col-md-8">${formatearMoneda(contrato.monto)}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Estado:</div>
                                <div class="col-md-8"><span class="estado-${contrato.estado}">${contrato.estado}</span></div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Descripción:</div>
                                <div class="col-md-8">${contrato.descripcion}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Términos y Condiciones:</div>
                                <div class="col-md-8">${contrato.terminos || 'No especificados'}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="card">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="mb-0">Pagos Asociados</h5>
                            ${contrato.estado !== 'finalizado' && contrato.estado !== 'cancelado' ? `
                                <button class="btn btn-primary btn-sm" onclick="mostrarFormularioPago(${contrato.id})">
                                    <i class="bi bi-plus-circle"></i> Nuevo Pago
                                </button>
                            ` : ''}
                        </div>
                        <div class="card-body">
                            ${!pagos || pagos.length === 0 ? `
                                <p>No hay pagos registrados para este contrato.</p>
                            ` : `
                                <div class="table-responsive">
                                    <table class="table table-striped table-hover">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Fecha</th>
                                                <th>Monto</th>
                                                <th>Concepto</th>
                                                <th>Método de Pago</th>
                                                <th>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${pagos.map(pago => `
                                                <tr>
                                                    <td>${pago.id}</td>
                                                    <td>${formatearFecha(pago.fecha)}</td>
                                                    <td>${formatearMoneda(pago.monto)}</td>
                                                    <td>${pago.concepto}</td>
                                                    <td>${obtenerNombreMetodoPago(pago.metodo_pago)}</td>
                                                    <td>
                                                        <button class="btn btn-sm btn-info" onclick="verDetallePago(${pago.id})">
                                                            <i class="bi bi-eye"></i>
                                                        </button>
                                                        <button class="btn btn-sm btn-secondary" onclick="descargarComprobantePago(${pago.id})">
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
            </div>
        `;
        
    } catch (error) {
        console.error('Error al cargar detalle del contrato:', error);
        mostrarNotificacion('Error al cargar detalle: ' + error.message, 'danger');
    } finally {
        mostrarCargando(false);
    }
}

/**
 * Función para mostrar el formulario de registro de pago
 * @param {number} contratoId - ID del contrato
 */
async function mostrarFormularioPago(contratoId) {
    try {
        mostrarCargando(true);
        
        const contrato = await fetchAPI(`/contratos/${contratoId}`);
        
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="row mb-4">
                <div class="col-12">
                    <button class="btn btn-outline-secondary mb-3" onclick="verDetalleContrato(${contratoId})">
                        <i class="bi bi-arrow-left"></i> Volver al contrato
                    </button>
                    <h2>Registrar Pago</h2>
                    <p>Contrato: ${contrato.numero} - Proveedor: ${contrato.proveedor?.nombre || 'N/A'}</p>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-8 offset-md-2">
                    <div class="card">
                        <div class="card-body">
                            <form id="form-pago">
                                <input type="hidden" id="contrato-id" value="${contratoId}">
                                
                                <div class="mb-3">
                                    <label for="fecha" class="form-label">Fecha</label>
                                    <input type="date" class="form-control" id="fecha" value="${new Date().toISOString().split('T')[0]}" required>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="monto" class="form-label">Monto</label>
                                    <div class="input-group">
                                        <span class="input-group-text">$</span>
                                        <input type="number" class="form-control" id="monto" min="0" step="0.01" required>
                                    </div>
                                    <div class="form-text">Monto total del contrato: ${formatearMoneda(contrato.monto)}</div>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="concepto" class="form-label">Concepto</label>
                                    <input type="text" class="form-control" id="concepto" required>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="metodo-pago" class="form-label">Método de Pago</label>
                                    <select class="form-select" id="metodo-pago" required>
                                        <option value="">Seleccione un método</option>
                                        <option value="transferencia">Transferencia Bancaria</option>
                                        <option value="cheque">Cheque</option>
                                        <option value="efectivo">Efectivo</option>
                                        <option value="tarjeta">Tarjeta de Crédito/Débito</option>
                                    </select>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="referencia" class="form-label">Referencia de Pago</label>
                                    <input type="text" class="form-control" id="referencia">
                                    <div class="form-text">Número de transferencia, cheque, etc.</div>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="observaciones" class="form-label">Observaciones</label>
                                    <textarea class="form-control" id="observaciones" rows="3"></textarea>
                                </div>
                                
                                <div class="d-grid gap-2">
                                    <button type="submit" class="btn btn-primary">
                                        <i class="bi bi-save"></i> Registrar Pago
                                    </button>
                                    <button type="button" class="btn btn-outline-secondary" onclick="verDetalleContrato(${contratoId})">
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
        
    } catch (error) {
        console.error('Error al cargar formulario de pago:', error);
        mostrarNotificacion('Error al cargar formulario: ' + error.message, 'danger');
    } finally {
        mostrarCargando(false);
    }
}

/**
 * Función para guardar un pago
 * @param {Event} e - Evento del formulario
 */
async function guardarPago(e) {
    e.preventDefault();
    
    try {
        mostrarCargando(true);
        
        const contratoId = document.getElementById('contrato-id').value;
        
        const pago = {
            contrato_id: parseInt(contratoId),
            fecha: document.getElementById('fecha').value,
            monto: parseFloat(document.getElementById('monto').value),
            concepto: document.getElementById('concepto').value,
            metodo_pago: document.getElementById('metodo-pago').value,
            referencia: document.getElementById('referencia').value,
            observaciones: document.getElementById('observaciones').value
        };
        
        await fetchAPI('/pagos', {
            method: 'POST',
            body: JSON.stringify(pago)
        });
        
        mostrarNotificacion('Pago registrado correctamente', 'success');
        verDetalleContrato(contratoId);
        
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
                    <button class="btn btn-outline-secondary mb-3" onclick="verDetalleContrato(${pago.contrato_id})">
                        <i class="bi bi-arrow-left"></i> Volver al contrato
                    </button>
                    <h2>Detalle del Pago</h2>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-8 offset-md-2">
                    <div class="card">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="mb-0">Información del Pago</h5>
                            <button class="btn btn-secondary" onclick="descargarComprobantePago(${pago.id})">
                                <i class="bi bi-download"></i> Descargar Comprobante
                            </button>
                        </div>
                        <div class="card-body">
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">ID:</div>
                                <div class="col-md-8">${pago.id}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Contrato:</div>
                                <div class="col-md-8">${pago.contrato?.numero || 'N/A'}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Proveedor:</div>
                                <div class="col-md-8">${pago.contrato?.proveedor?.nombre || 'N/A'}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Fecha:</div>
                                <div class="col-md-8">${formatearFecha(pago.fecha)}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Monto:</div>
                                <div class="col-md-8">${formatearMoneda(pago.monto)}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Concepto:</div>
                                <div class="col-md-8">${pago.concepto}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Método de Pago:</div>
                                <div class="col-md-8">${obtenerNombreMetodoPago(pago.metodo_pago)}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Referencia:</div>
                                <div class="col-md-8">${pago.referencia || 'No especificada'}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Observaciones:</div>
                                <div class="col-md-8">${pago.observaciones || 'Sin observaciones'}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Registrado por:</div>
                                <div class="col-md-8">${pago.usuario?.nombre} ${pago.usuario?.apellido}</div>
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
 * Función para descargar el comprobante de un pago
 * @param {number} pagoId - ID del pago
 */
async function descargarComprobantePago(pagoId) {
    try {
        mostrarCargando(true);
        
        const comprobante = await fetchAPI(`/pagos/${pagoId}/comprobante`);
        
        // Simulación de descarga de comprobante
        setTimeout(() => {
            const a = document.createElement('a');
            a.href = `data:application/pdf;base64,${comprobante.base64}`;
            a.download = `comprobante_pago_${pagoId}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }, 1000);
        
        mostrarNotificacion('Comprobante generado correctamente', 'success');
        
    } catch (error) {
        console.error('Error al descargar comprobante:', error);
        mostrarNotificacion('Error al descargar comprobante: ' + error.message, 'danger');
    } finally {
        mostrarCargando(false);
    }
}

/**
 * Función para descargar un contrato
 * @param {number} contratoId - ID del contrato
 */
async function descargarContrato(contratoId) {
    try {
        mostrarCargando(true);
        
        const documento = await fetchAPI(`/contratos/${contratoId}/documento`);
        
        // Simulación de descarga de documento
        setTimeout(() => {
            const a = document.createElement('a');
            a.href = `data:application/pdf;base64,${documento.base64}`;
            a.download = `contrato_${contratoId}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }, 1000);
        
        mostrarNotificacion('Documento generado correctamente', 'success');
        
    } catch (error) {
        console.error('Error al descargar contrato:', error);
        mostrarNotificacion('Error al descargar contrato: ' + error.message, 'danger');
    } finally {
        mostrarCargando(false);
    }
}

/**
 * Función para generar un reporte de un proveedor específico
 * @param {number} proveedorId - ID del proveedor
 */
async function generarReporteProveedor(proveedorId) {
    try {
        mostrarCargando(true);
        
        const reporte = await fetchAPI(`/proveedores/${proveedorId}/reporte`);
        
        // Simulación de descarga de reporte
        setTimeout(() => {
            const a = document.createElement('a');
            a.href = `data:application/pdf;base64,${reporte.base64}`;
            a.download = `reporte_proveedor_${proveedorId}.pdf`;
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
 * Función para generar un reporte de todos los proveedores
 */
async function generarReporteProveedores() {
    try {
        mostrarCargando(true);
        
        // Obtener filtros actuales
        const busqueda = document.getElementById('buscar-proveedor')?.value || '';
        const tipoServicio = document.getElementById('filtro-tipo-servicio')?.value || '';
        const estado = document.getElementById('filtro-estado')?.value || '';
        
        const reporte = await fetchAPI('/proveedores/reporte', {
            method: 'POST',
            body: JSON.stringify({
                filtros: {
                    busqueda,
                    tipo_servicio: tipoServicio,
                    estado
                }
            })
        });
        
        // Simulación de descarga de reporte
        setTimeout(() => {
            const a = document.createElement('a');
            a.href = `data:application/pdf;base64,${reporte.base64}`;
            a.download = 'reporte_proveedores.pdf';
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
 * Función para editar un contrato
 * @param {number} contratoId - ID del contrato a editar
 */
async function editarContrato(contratoId) {
    try {
        mostrarCargando(true);
        
        const contrato = await fetchAPI(`/contratos/${contratoId}`);
        const proyectos = await fetchAPI('/proyectos');
        
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="row mb-4">
                <div class="col-12">
                    <button class="btn btn-outline-secondary mb-3" onclick="verDetalleContrato(${contratoId})">
                        <i class="bi bi-arrow-left"></i> Volver al contrato
                    </button>
                    <h2>Editar Contrato</h2>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-10 offset-md-1">
                    <div class="card">
                        <div class="card-body">
                            <form id="form-editar-contrato">
                                <input type="hidden" id="contrato-id" value="${contratoId}">
                                
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <label for="numero" class="form-label">Número de Contrato</label>
                                        <input type="text" class="form-control" id="numero" value="${contrato.numero}" required>
                                    </div>
                                    <div class="col-md-6">
                                        <label for="estado" class="form-label">Estado</label>
                                        <select class="form-select" id="estado" required>
                                            <option value="borrador" ${contrato.estado === 'borrador' ? 'selected' : ''}>Borrador</option>
                                            <option value="activo" ${contrato.estado === 'activo' ? 'selected' : ''}>Activo</option>
                                            <option value="finalizado" ${contrato.estado === 'finalizado' ? 'selected' : ''}>Finalizado</option>
                                            <option value="cancelado" ${contrato.estado === 'cancelado' ? 'selected' : ''}>Cancelado</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="descripcion" class="form-label">Descripción</label>
                                    <textarea class="form-control" id="descripcion" rows="3" required>${contrato.descripcion}</textarea>
                                </div>
                                
                                <div class="row mb-3">
                                    <div class="col-md-4">
                                        <label for="fecha-inicio" class="form-label">Fecha de Inicio</label>
                                        <input type="date" class="form-control" id="fecha-inicio" value="${contrato.fecha_inicio}" required>
                                    </div>
                                    <div class="col-md-4">
                                        <label for="fecha-fin" class="form-label">Fecha de Fin</label>
                                        <input type="date" class="form-control" id="fecha-fin" value="${contrato.fecha_fin}" required>
                                    </div>
                                    <div class="col-md-4">
                                        <label for="monto" class="form-label">Monto</label>
                                        <div class="input-group">
                                            <span class="input-group-text">$</span>
                                            <input type="number" class="form-control" id="monto" min="0" step="0.01" value="${contrato.monto}" required>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="proyecto" class="form-label">Proyecto Asociado (Opcional)</label>
                                    <select class="form-select" id="proyecto">
                                        <option value="">Ninguno</option>
                                        ${proyectos.map(proyecto => `
                                            <option value="${proyecto.id}" ${contrato.proyecto_id === proyecto.id ? 'selected' : ''}>${proyecto.nombre}</option>
                                        `).join('')}
                                    </select>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="terminos" class="form-label">Términos y Condiciones</label>
                                    <textarea class="form-control" id="terminos" rows="4">${contrato.terminos || ''}</textarea>
                                </div>
                                
                                <div class="d-grid gap-2">
                                    <button type="submit" class="btn btn-primary">
                                        <i class="bi bi-save"></i> Guardar Cambios
                                    </button>
                                    <button type="button" class="btn btn-outline-secondary" onclick="verDetalleContrato(${contratoId})">
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
        const formEditarContrato = document.getElementById('form-editar-contrato');
        formEditarContrato.addEventListener('submit', actualizarContrato);
        
    } catch (error) {
        console.error('Error al cargar formulario de edición de contrato:', error);
        mostrarNotificacion('Error al cargar formulario: ' + error.message, 'danger');
    } finally {
        mostrarCargando(false);
    }
}

/**
 * Función para actualizar un contrato
 * @param {Event} e - Evento del formulario
 */
async function actualizarContrato(e) {
    e.preventDefault();
    
    try {
        mostrarCargando(true);
        
        const contratoId = document.getElementById('contrato-id').value;
        
        const contrato = {
            numero: document.getElementById('numero').value,
            descripcion: document.getElementById('descripcion').value,
            fecha_inicio: document.getElementById('fecha-inicio').value,
            fecha_fin: document.getElementById('fecha-fin').value,
            monto: parseFloat(document.getElementById('monto').value),
            estado: document.getElementById('estado').value,
            terminos: document.getElementById('terminos').value,
            proyecto_id: document.getElementById('proyecto').value || null
        };
        
        await fetchAPI(`/contratos/${contratoId}`, {
            method: 'PUT',
            body: JSON.stringify(contrato)
        });
        
        mostrarNotificacion('Contrato actualizado correctamente', 'success');
        verDetalleContrato(contratoId);
        
    } catch (error) {
        console.error('Error al actualizar contrato:', error);
        mostrarNotificacion('Error al actualizar contrato: ' + error.message, 'danger');
    } finally {
        mostrarCargando(false);
    }
}