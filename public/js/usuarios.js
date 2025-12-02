/**
 * Función para cargar la página de cambio de contraseña
 */
async function cargarCambioPassword() {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="row mb-4">
            <div class="col-12">
                <h2>Cambiar Contraseña</h2>
            </div>
        </div>
        
        <div class="row">
            <div class="col-md-6 offset-md-3">
                <div class="card">
                    <div class="card-body">
                        <form id="form-cambio-password">
                            <div class="mb-3">
                                <label for="password-actual" class="form-label">Contraseña Actual</label>
                                <input type="password" class="form-control" id="password-actual" required>
                            </div>
                            
                            <div class="mb-3">
                                <label for="password-nuevo" class="form-label">Nueva Contraseña</label>
                                <input type="password" class="form-control" id="password-nuevo" required>
                            </div>
                            
                            <div class="mb-3">
                                <label for="confirmar-password-nuevo" class="form-label">Confirmar Nueva Contraseña</label>
                                <input type="password" class="form-control" id="confirmar-password-nuevo" required>
                            </div>
                            
                            <div class="d-grid gap-2">
                                <button type="submit" class="btn btn-primary">
                                    <i class="bi bi-key"></i> Cambiar Contraseña
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Agregar evento para el formulario
    const formCambioPassword = document.getElementById('form-cambio-password');
    formCambioPassword.addEventListener('submit', cambiarPassword);
}

/**
 * Función para cambiar la contraseña del usuario
 * @param {Event} e - Evento del formulario
 */
async function cambiarPassword(e) {
    e.preventDefault();
    
    const passwordActual = document.getElementById('password-actual').value;
    const passwordNuevo = document.getElementById('password-nuevo').value.trim();
    const confirmarPasswordNuevo = document.getElementById('confirmar-password-nuevo').value.trim();

    // Validación de complejidad
    if (!validarPasswordFuerte(passwordNuevo)) {
        mostrarNotificacion('La contraseña debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas, números y un carácter especial.', 'warning');
        return;
    }
    
    if (passwordNuevo !== confirmarPasswordNuevo) {
        mostrarNotificacion('Las contraseñas no coinciden', 'warning');
        return;
    }
    
    try {
        mostrarCargando(true);
        
        await fetchAPI('/usuarios/cambiar-password', {
            method: 'PUT',
            body: JSON.stringify({
                password_actual: passwordActual,
                password_nuevo: passwordNuevo
            })
        });
        
        mostrarNotificacion('Contraseña cambiada correctamente', 'success');
        document.getElementById('form-cambio-password').reset();
        
    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        mostrarNotificacion('Error al cambiar contraseña: ' + error.message, 'danger');
    } finally {
        mostrarCargando(false);
    }
}

/**
 * Función para cargar el perfil del usuario
 */
async function cargarPerfil() {
    try {
        mostrarCargando(true);
        
        const usuario = await fetchAPI('/usuarios/perfil');
        
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="row mb-4">
                <div class="col-12">
                    <h2>Mi Perfil</h2>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-8 offset-md-2">
                    <div class="card mb-4">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="mb-0">Información Personal</h5>
                            <button class="btn btn-primary" id="btn-editar-perfil">
                                <i class="bi bi-pencil"></i> Editar
                            </button>
                        </div>
                        <div class="card-body">
                            <div id="vista-perfil">
                                <div class="row mb-3">
                                    <div class="col-md-4 fw-bold">Nombre:</div>
                                    <div class="col-md-8">${usuario.nombre} ${usuario.apellido}</div>
                                </div>
                                <div class="row mb-3">
                                    <div class="col-md-4 fw-bold">Email:</div>
                                    <div class="col-md-8">${usuario.email}</div>
                                </div>
                                <div class="row mb-3">
                                    <div class="col-md-4 fw-bold">Rol:</div>
                                    <div class="col-md-8">${usuario.role}</div>
                                </div>
                                ${usuario.departamento ? `
                                    <div class="row mb-3">
                                        <div class="col-md-4 fw-bold">Departamento:</div>
                                        <div class="col-md-8">${usuario.departamento.nombre}</div>
                                    </div>
                                ` : ''}
                            </div>
                            
                            <div id="form-perfil" class="d-none">
                                <form id="editar-perfil-form">
                                    <div class="row mb-3">
                                        <div class="col-md-6">
                                            <label for="perfil-nombre" class="form-label">Nombre</label>
                                            <input type="text" class="form-control" id="perfil-nombre" value="${usuario.nombre}" required>
                                        </div>
                                        <div class="col-md-6">
                                            <label for="perfil-apellido" class="form-label">Apellido</label>
                                            <input type="text" class="form-control" id="perfil-apellido" value="${usuario.apellido}" required>
                                        </div>
                                    </div>
                                    
                                    <div class="mb-3">
                                        <label for="perfil-email" class="form-label">Email</label>
                <input type="text" class="form-control" id="perfil-email" value="${usuario.email}" required>
                                    </div>
                                    
                                    <div class="d-grid gap-2">
                                        <button type="submit" class="btn btn-primary">
                                            <i class="bi bi-save"></i> Guardar Cambios
                                        </button>
                                        <button type="button" class="btn btn-outline-secondary" id="btn-cancelar-edicion">
                                            Cancelar
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                    
                    <div class="card">
                        <div class="card-header">
                            <h5>Seguridad</h5>
                        </div>
                        <div class="card-body">
                            <div class="d-grid gap-2">
                                <button class="btn btn-warning" onclick="cargarCambioPassword()">
                                    <i class="bi bi-key"></i> Cambiar Contraseña
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Agregar eventos para edición de perfil
        const btnEditarPerfil = document.getElementById('btn-editar-perfil');
        const btnCancelarEdicion = document.getElementById('btn-cancelar-edicion');
        const vistaPerfil = document.getElementById('vista-perfil');
        const formPerfil = document.getElementById('form-perfil');
        const formEditarPerfil = document.getElementById('editar-perfil-form');
        
        btnEditarPerfil.addEventListener('click', () => {
            vistaPerfil.classList.add('d-none');
            formPerfil.classList.remove('d-none');
        });
        
        btnCancelarEdicion.addEventListener('click', () => {
            formPerfil.classList.add('d-none');
            vistaPerfil.classList.remove('d-none');
        });
        
        formEditarPerfil.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            try {
                mostrarCargando(true);
                
                const datosActualizados = {
                    nombre: document.getElementById('perfil-nombre').value,
                    apellido: document.getElementById('perfil-apellido').value,
                    email: document.getElementById('perfil-email').value
                };
                
                await fetchAPI('/usuarios/perfil', {
                    method: 'PUT',
                    body: JSON.stringify(datosActualizados)
                });
                
                mostrarNotificacion('Perfil actualizado correctamente', 'success');
                cargarPerfil();
                
            } catch (error) {
                console.error('Error al actualizar perfil:', error);
                mostrarNotificacion('Error al actualizar perfil: ' + error.message, 'danger');
            } finally {
                mostrarCargando(false);
            }
        });
        
    } catch (error) {
        console.error('Error al cargar perfil:', error);
        mostrarNotificacion('Error al cargar perfil: ' + error.message, 'danger');
    } finally {
        mostrarCargando(false);
    }
}

/**
 * Función para validar RUT en tiempo real (formato)
 * @param {Event} e - Evento del input
 */
function validarRutEnTiempoReal(e) {
    const input = e.target;
    let valor = input.value.replace(/[^0-9kK]/g, '');
    
    // Formatear automáticamente
    if (valor.length > 1) {
        const cuerpo = valor.slice(0, -1);
        const dv = valor.slice(-1);
        if (cuerpo.length > 0) {
            valor = cuerpo + '-' + dv;
        }
    }
    
    input.value = valor;
    
    // Remover clases de validación previas
    input.classList.remove('is-valid', 'is-invalid');
    
    // Validar formato básico
     const rutPattern = /^\d{8}-[\dkK]$/;
     if (valor.length > 0 && !rutPattern.test(valor)) {
         input.classList.add('is-invalid');
         mostrarErrorRut(input, '❌ Formato incorrecto. Use: 12345678-9 (sin puntos, exactamente 8 dígitos)');
     } else if (valor.length > 0) {
         removerErrorRut(input);
     }
}

/**
 * Función para validar RUT completo (incluyendo dígito verificador)
 * @param {Event} e - Evento del input
 */
function validarRutCompleto(e) {
    const input = e.target;
    const valor = input.value;
    
    if (!valor) return;
    
    const rutPattern = /^\d{8}-[\dkK]$/;
    
    // Validar formato
     if (!rutPattern.test(valor)) {
         input.classList.add('is-invalid');
         mostrarErrorRut(input, '❌ Formato incorrecto. Use: 12345678-9 (sin puntos, con guión, exactamente 8 dígitos)');
         return;
     }
     
     // Validar longitud exacta
     const cuerpo = valor.split('-')[0];
     if (cuerpo.length !== 8) {
         input.classList.add('is-invalid');
         mostrarErrorRut(input, '❌ RUT inválido. Debe tener exactamente 8 dígitos antes del guión (ej: 12345678-9)');
         return;
     }
     
     // Validar dígito verificador
     if (!validarDigitoVerificadorRut(valor)) {
         input.classList.add('is-invalid');
         mostrarErrorRut(input, '❌ Dígito verificador incorrecto. Verifique el último dígito');
         return;
     }
    
    // RUT válido
     input.classList.remove('is-invalid');
     input.classList.add('is-valid');
     removerErrorRut(input);
     mostrarExitoRut(input, '✅ RUT válido');
}

/**
 * Función para validar el dígito verificador del RUT
 * @param {string} rut - RUT a validar
 * @returns {boolean} - True si es válido
 */
function validarDigitoVerificadorRut(rut) {
    const rutLimpio = rut.replace(/\./g, '').replace('-', '');
    const cuerpo = rutLimpio.slice(0, -1);
    const dv = rutLimpio.slice(-1).toLowerCase();
    
    let suma = 0;
    let multiplicador = 2;
    
    for (let i = cuerpo.length - 1; i >= 0; i--) {
        suma += parseInt(cuerpo[i]) * multiplicador;
        multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
    }
    
    const resto = suma % 11;
    const dvCalculado = resto === 0 ? '0' : resto === 1 ? 'k' : (11 - resto).toString();
    
    return dv === dvCalculado;
}

/**
 * Función para mostrar error de RUT
 * @param {HTMLElement} input - Input del RUT
 * @param {string} mensaje - Mensaje de error
 */
function mostrarErrorRut(input, mensaje) {
    removerErrorRut(input);
    removerExitoRut(input);
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'invalid-feedback';
    errorDiv.textContent = mensaje;
    errorDiv.id = 'rut-error';
    
    input.parentNode.appendChild(errorDiv);
}

/**
 * Función para mostrar éxito de RUT
 * @param {HTMLElement} input - Input del RUT
 * @param {string} mensaje - Mensaje de éxito
 */
function mostrarExitoRut(input, mensaje) {
    removerErrorRut(input);
    removerExitoRut(input);
    
    const exitoDiv = document.createElement('div');
     exitoDiv.className = 'valid-feedback';
     exitoDiv.textContent = mensaje;
     exitoDiv.id = input.id + '-success';
     
     input.parentNode.appendChild(exitoDiv);
}

/**
 * Función para remover error de RUT
 * @param {HTMLElement} input - Input del RUT
 */
function removerErrorRut(input) {
    const errorExistente = document.getElementById('rut-error');
    if (errorExistente) {
        errorExistente.remove();
    }
    if (input) {
        input.classList.remove('is-invalid', 'is-valid');
    }
}

/**
 * Normaliza un RUT al formato canónico: 12345678-9 (sin puntos, guión antes del DV, DV en mayúscula)
 * No corrige el dígito verificador: solo formatea.
 */
function normalizarRut(valor) {
    let v = (valor || '').toString().trim();
    // Eliminar puntos y espacios, dejar solo dígitos y k/K
    v = v.replace(/\./g, '').replace(/\s+/g, '').replace(/[^0-9kK-]/g, '');
    const solo = v.replace(/[^0-9kK]/g, '');
    if (solo.length === 0) return '';
    const cuerpo = solo.slice(0, Math.max(1, solo.length - 1));
    const dv = solo.slice(-1).toUpperCase();
    return `${cuerpo}-${dv}`;
}

/**
 * Normaliza teléfono: deja solo dígitos y un '+' al inicio si existe.
 * En input (typing=true) no fuerza formato final, solo limpia.
 */
function normalizarTelefono(valor, typing = false) {
    let v = (valor || '').toString();
    // Conservar solo dígitos y un '+' si está al inicio
    v = v.trim();
    const tienePlus = v.startsWith('+');
    const soloDigitos = v.replace(/\D/g, '');
    return tienePlus ? `+${soloDigitos}` : soloDigitos;
}

/**
 * Función para remover éxito de RUT
 * @param {HTMLElement} input - Input del RUT
 */
function removerExitoRut(input) {
     const exitoExistente = document.getElementById(input.id + '-success');
     if (exitoExistente) {
         exitoExistente.remove();
     }
 }

/**
 * Función para mostrar/ocultar contraseñas
 * @param {string} inputId - ID del campo de contraseña
 */
function togglePassword(inputId) {
    const passwordInput = document.getElementById(inputId);
    const passwordIcon = document.getElementById(inputId + '-icon');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        passwordIcon.className = 'bi bi-eye-slash';
    } else {
        passwordInput.type = 'password';
        passwordIcon.className = 'bi bi-eye';
    }
}

// Entrada principal del módulo Usuarios: lista o formulario
function cargarUsuarios(usuarioId = null) {
    if (usuarioId) {
        if (typeof mostrarFormularioUsuario === 'function') {
            mostrarFormularioUsuario(usuarioId);
        }
    } else {
        if (typeof mostrarListaUsuarios === 'function') {
            mostrarListaUsuarios();
        } else {
            mostrarListaUsuarios();
        }
    }
}

// Renderiza vista de lista de usuarios con filtros y paginación
async function mostrarListaUsuarios() {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;
    mainContent.classList.remove('d-none');
    mainContent.classList.add('full-width');

    mainContent.innerHTML = `
        <div class="row mb-3">
            <div class="col-12 text-center">
                <h2 class="section-title">Gestión de Usuarios</h2>
            </div>
        </div>

        <div class="row g-2 align-items-end mb-2">
            <div class="col-md-5">
                <input type="text" class="form-control" id="buscar-usuario" placeholder="Buscar por nombre, apellido, email o RUT">
            </div>
            <div class="col-md-3">
                <select class="form-select" id="filtro-rol-usuario">
                    <option value="">Todos los roles</option>
                    <option value="superadministrador">superadministrador</option>
                    <option value="administrador">administrador</option>
                    <option value="funcionario">funcionario</option>
                    <option value="secretaria comunitaria">secretaria comunitaria</option>
                    <option value="secretaria de obras">secretaria de obras</option>
                    <option value="secretaria de transito">secretaria de transito</option>
                    <option value="secretaria partes">secretaria partes</option>
                    <option value="tesoreria municipal">tesoreria municipal</option>
                    <option value="ciudadano">ciudadano</option>
                </select>
            </div>
            <div class="col-md-3">
                <select class="form-select" id="filtro-estado-usuario">
                    <option value="">Todos los estados</option>
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                </select>
            </div>
        </div>

        <div class="row mb-2">
            <div class="col-md-3 offset-md-9 d-flex justify-content-end">
                <button class="btn btn-primary btn-new-user" id="btn-nuevo-usuario">
                    <i class="bi bi-person-plus"></i> Nuevo Usuario
                </button>
            </div>
        </div>

        <table class="table table-striped table-hover align-middle table-fullwidth">
                <thead>
                    <tr>
                        <th class="text-center">ID</th>
                        <th>Nombre</th>
                        <th>Email</th>
                        <th class="text-nowrap">RUT</th>
                        <th class="text-center">Rol</th>
                        <th>Departamento</th>
                        <th class="text-center">Estado</th>
                        <th class="text-center">Creado</th>
                        <th class="text-center col-actions">Acciones</th>
                    </tr>
                </thead>
                <tbody id="tabla-usuarios"></tbody>
        </table>
        <div class="d-flex justify-content-center mt-3" id="paginacion-usuarios"></div>
    `;

    document.getElementById('btn-nuevo-usuario').addEventListener('click', () => mostrarFormularioUsuario());
    document.getElementById('buscar-usuario').addEventListener('input', () => actualizarTablaUsuarios(1));
    document.getElementById('filtro-rol-usuario').addEventListener('change', () => actualizarTablaUsuarios(1));
    document.getElementById('filtro-estado-usuario').addEventListener('change', () => actualizarTablaUsuarios(1));

    await actualizarTablaUsuarios(1);
}

// Actualiza la tabla de usuarios y la paginación
async function actualizarTablaUsuarios(page = 1) {
    const tbody = document.getElementById('tabla-usuarios');
    const pagContainer = document.getElementById('paginacion-usuarios');
    const buscar = document.getElementById('buscar-usuario')?.value.trim();
    const rol = document.getElementById('filtro-rol-usuario')?.value;
    const estado = document.getElementById('filtro-estado-usuario')?.value;

    try {
        mostrarCargando(true);

        const params = new URLSearchParams();
        params.set('page', page);
        params.set('limit', (CONFIG?.PAGINACION?.ITEMS_POR_PAGINA) || 10);
        if (buscar) params.set('search', buscar);
        // El backend espera 'id_rol' numérico; como no lo tenemos aquí,
        // filtramos por rol en el cliente y no enviamos este parámetro.
        if (estado) params.set('estado', estado);

        const resp = await fetchAPI(`/usuarios?${params.toString()}`);
        let usuarios = resp.usuarios || [];
        // Filtro por rol en cliente usando nombre del rol devuelto por relación Rol
        if (rol) {
            const rolLower = String(rol).toLowerCase();
            usuarios = usuarios.filter(u => {
                const nombreRol = (u.Rol?.nombre || u.rol_nombre || '').toLowerCase();
                return nombreRol === rolLower;
            });
        }
        const pagination = resp.pagination || { total: usuarios.length, currentPage: page, limit: (CONFIG?.PAGINACION?.ITEMS_POR_PAGINA) || 10 };

        if (!tbody) return;
        if (usuarios.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center">No hay usuarios que coincidan</td>
                </tr>
            `;
        } else {
            tbody.innerHTML = usuarios.map(u => `
                <tr>
                    <td class="text-center">${u.id}</td>
                    <td class="cell-wrap">${(u.nombre || '')} ${(u.apellido || '')}</td>
                    <td class="cell-wrap cell-email">${u.email || ''}</td>
                    <td class="cell-nowrap">${u.rut || ''}</td>
                    <td class="text-center">${u.Rol?.nombre || u.rol_nombre || ''}</td>
                    <td class="cell-wrap">${u.Municipalidad?.nombre || 'N/A'}</td>
                    <td class="text-center"><span class="estado-${u.estado}">${u.estado}</span></td>
                    <td class="text-center">${typeof formatearFecha === 'function' ? formatearFecha(u.createdAt) : ''}</td>
                    <td class="text-center col-actions">
                        <div class="btn-group btn-group-sm table-actions" role="group" aria-label="Acciones">
                            <button class="btn btn-view" onclick="verDetalleUsuario(${u.id})" title="Ver">
                                <i class="bi bi-eye"></i>
                            </button>
                            <button class="btn btn-edit" onclick="editarUsuario(${u.id})" title="Editar">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn ${u.estado === 'activo' ? 'btn-toggle' : 'btn-toggle btn-activate'}" onclick="cambiarEstadoUsuario(${u.id}, '${u.estado === 'activo' ? 'inactivo' : 'activo'}')" title="${u.estado === 'activo' ? 'Desactivar' : 'Activar'}">
                                <i class="bi ${u.estado === 'activo' ? 'bi-person-x' : 'bi-person-check'}"></i>
                            </button>
                            <button class="btn btn-outline-danger" onclick="eliminarUsuario(${u.id})" title="Eliminar">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }

        if (pagContainer) {
            pagContainer.innerHTML = '';
            const nav = crearPaginacion(pagination.total, pagination.currentPage, pagination.limit || 10, (p) => actualizarTablaUsuarios(p));
            pagContainer.appendChild(nav);
        }
    } catch (error) {
        console.error('Error al cargar usuarios:', error);
        if (error.status === 401) {
            mostrarNotificacion('Sesión expirada. Inicia sesión nuevamente.', 'warning');
            if (typeof mostrarFormularioLogin === 'function') {
                mostrarFormularioLogin();
            }
            return;
        }
        if (error.status === 403) {
            mostrarNotificacion('No tienes permisos para ver usuarios.', 'warning');
            return;
        }
        mostrarNotificacion('Error al cargar usuarios: ' + (error.message || ''), 'danger');
        tbody && (tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center text-danger">Error al cargar usuarios</td>
            </tr>
        `);
    } finally {
        mostrarCargando(false);
    }
}

// Eliminar usuario con confirmación
async function eliminarUsuario(usuarioId) {
    if (!usuarioId) return;
    const ok = await mostrarModalConfirmacion({
        titulo: 'Confirmar eliminación',
        mensaje: '¿Seguro que deseas eliminar este usuario? Esta acción no se puede deshacer.',
        confirmarTexto: 'Confirmar',
        cancelarTexto: 'Cancelar',
        tipo: 'danger'
    });
    if (!ok) return;

    try {
        mostrarCargando(true);
        await fetchAPI(`/usuarios/${usuarioId}`, { method: 'DELETE' });
        mostrarNotificacion('Usuario eliminado correctamente', 'success');
        actualizarTablaUsuarios(1);
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        if (error.status === 401) {
            mostrarNotificacion('Sesión expirada. Inicia sesión nuevamente.', 'warning');
            if (typeof mostrarFormularioLogin === 'function') mostrarFormularioLogin();
        } else if (error.status === 403) {
            mostrarNotificacion('No tienes permisos para eliminar usuarios.', 'warning');
        } else {
            mostrarNotificacion('Error al eliminar usuario: ' + (error.message || ''), 'danger');
        }
    } finally {
        mostrarCargando(false);
    }
}

function mostrarModalConfirmacion(opts) {
    const o = opts || {};
    const titulo = o.titulo || 'Confirmación';
    const mensaje = o.mensaje || '';
    const confirmarTexto = o.confirmarTexto || 'Confirmar';
    const cancelarTexto = o.cancelarTexto || 'Cancelar';
    const tipo = o.tipo || 'primary';
    return new Promise((resolve) => {
        const existingBackdrop = document.getElementById('confirm-backdrop');
        const existingModal = document.getElementById('confirm-modal');
        if (existingBackdrop) existingBackdrop.remove();
        if (existingModal) existingModal.remove();
        const backdrop = document.createElement('div');
        backdrop.id = 'confirm-backdrop';
        backdrop.className = 'modal-backdrop fade show';
        backdrop.style.zIndex = '1050';
        const modal = document.createElement('div');
        modal.id = 'confirm-modal';
        modal.className = 'modal fade show';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.style.display = 'block';
        modal.style.zIndex = '1055';
        modal.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
              <div class="modal-content">
                <div class="modal-header">
                  <h5 class="modal-title">${titulo}</h5>
                  <button type="button" class="btn-close" aria-label="Cerrar"></button>
                </div>
                <div class="modal-body">${mensaje}</div>
                <div class="modal-footer">
                  <button type="button" class="btn btn-outline-secondary" id="confirm-cancel">${cancelarTexto}</button>
                  <button type="button" class="btn btn-${tipo}" id="confirm-accept">${confirmarTexto}</button>
                </div>
              </div>
            </div>`;
        const cleanup = () => {
            try { modal.remove(); } catch (_) {}
            try { backdrop.remove(); } catch (_) {}
        };
        document.body.appendChild(backdrop);
        document.body.appendChild(modal);
        const btnClose = modal.querySelector('.btn-close');
        const btnCancel = modal.querySelector('#confirm-cancel');
        const btnAccept = modal.querySelector('#confirm-accept');
        if (btnClose) btnClose.onclick = () => { cleanup(); resolve(false); };
        if (btnCancel) btnCancel.onclick = () => { cleanup(); resolve(false); };
        if (btnAccept) btnAccept.onclick = () => { cleanup(); resolve(true); };
        setTimeout(() => {
            const focusTarget = btnAccept || btnCancel || btnClose;
            try { focusTarget && focusTarget.focus(); } catch (_) {}
        }, 50);
        document.addEventListener('keydown', function esc(e) {
            if (e.key === 'Escape') {
                document.removeEventListener('keydown', esc);
                cleanup();
                resolve(false);
            }
        });
    });
}

// Formulario de creación/edición de usuarios
async function mostrarFormularioUsuario(usuarioId = null) {
    try {
        mostrarCargando(true);

        let usuario = null;
        let titulo = 'Nuevo Usuario';
        let accion = 'crear';

        if (usuarioId) {
            usuario = await fetchAPI(`/usuarios/${usuarioId}`);
            titulo = 'Editar Usuario';
            accion = 'actualizar';
        }

        const currentUser = (typeof obtenerUsuario === 'function') ? obtenerUsuario() : null;
        const esSuperadmin = currentUser?.rol_nombre === 'superadministrador';
        // Cargar departamentos para el select
        let departamentos = [];
        let municipalidades = [];
        try {
            const respDept = await fetchAPI('/departamentos');
            departamentos = respDept.departamentos || [];
        } catch (_) { /* opcional */ }
        if (esSuperadmin) {
            try {
                const respMuni = await fetchAPI('/municipalidades');
                municipalidades = respMuni.departamentos || [];
            } catch (_) { /* opcional */ }
        }

        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;
        mainContent.classList.remove('d-none');
        mainContent.innerHTML = `
            <div class="row mb-3 align-items-center">
                <div class="col-4">
                    <button class="btn btn-outline-secondary" onclick="cargarUsuarios()">
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
                            <form id="form-usuario" data-accion="${accion}" data-id="${usuarioId || ''}">
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="primer_nombre" class="form-label">Primer nombre</label>
                                            <input type="text" class="form-control" id="primer_nombre" value="${usuario?.primer_nombre || ''}" required>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="segundo_nombre" class="form-label">Segundo nombre</label>
                                            <input type="text" class="form-control" id="segundo_nombre" value="${usuario?.segundo_nombre || ''}" placeholder="Opcional">
                                        </div>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="primer_apellido" class="form-label">Primer apellido</label>
                                            <input type="text" class="form-control" id="primer_apellido" value="${usuario?.primer_apellido || ''}" required>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="segundo_apellido" class="form-label">Segundo apellido</label>
                                            <input type="text" class="form-control" id="segundo_apellido" value="${usuario?.segundo_apellido || ''}" placeholder="Opcional">
                                        </div>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="email" class="form-label">Email</label>
                                            <input type="email" class="form-control" id="email" value="${usuario?.email || ''}" required>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="rut" class="form-label">RUT</label>
                                            <input type="text" class="form-control" id="rut" value="${usuario?.rut || ''}" required>
                                        </div>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="telefono" class="form-label">Teléfono</label>
                                            <input type="text" class="form-control" id="telefono" value="${usuario?.telefono || ''}" required>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="direccion" class="form-label">Dirección</label>
                                            <input type="text" class="form-control" id="direccion" value="${usuario?.direccion || ''}" required>
                                        </div>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="region" class="form-label">Región</label>
                                            <select class="form-select" id="region">
                                                <option value="">Seleccione una región</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="comuna" class="form-label">Comuna</label>
                                            <select class="form-select" id="comuna">
                                                <option value="">Seleccione una comuna</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="role" class="form-label">Rol</label>
                                            <select class="form-select" id="role" required>
                                                ${(() => {
                                                    const actual = (usuario?.Rol?.nombre || usuario?.rol_nombre || '').toLowerCase();
                                                    const opts = [
                                                        'superadministrador',
                                                        'administrador',
                                                        'funcionario',
                                                        'secretaria comunitaria',
                                                        'secretaria de obras',
                                                        'secretaria de transito',
                                                        'secretaria partes',
                                                        'tesoreria municipal',
                                                        'ciudadano'
                                                    ];
                                                    if (esSuperadmin) {
                                                        return opts.map(n => `<option value="${n}" ${n==='administrador'?'selected':''}>${n}</option>`).join('');
                                                    } else {
                                                        return ['','superadministrador','administrador','funcionario','secretaria comunitaria','secretaria de obras','secretaria de transito','secretaria partes','tesoreria municipal','ciudadano']
                                                            .map(n => n ? `<option value="${n}" ${actual===n?'selected':''}>${n}</option>` : '<option value="">Selecciona rol</option>')
                                                            .join('');
                                                    }
                                                })()}
                                            </select>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            ${esSuperadmin ? `
                                                <label for="municipalidad_id" class="form-label">Municipalidad</label>
                                                <select class="form-select" id="municipalidad_id" required>
                                                    <option value="">Selecciona municipalidad</option>
                                                    ${municipalidades.map(m => `<option value="${m.id}">${m.nombre}</option>`).join('')}
                                                </select>
                                            ` : `
                                                <label for="departamento_id" class="form-label">Departamento (solo funcionario)</label>
                                                <select class="form-select" id="departamento_id">
                                                    <option value="">Ninguno</option>
                                                    ${departamentos.map(d => `<option value="${d.id}" ${usuario?.departamento_id === d.id || usuario?.Departamento?.id === d.id ? 'selected' : ''}>${d.nombre}</option>`).join('')}
                                                </select>
                                            `}
                                        </div>
                                    </div>
                                </div>
                                ${usuarioId ? '' : `
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="password" class="form-label">Contraseña</label>
                                            <input type="password" class="form-control" id="password" required>
                                            <div id="password_hint" class="form-text">Debe tener 8+, mayúscula, minúscula, número y símbolo (@$!%*?&#.).</div>
                                        </div>
                                    </div>
                                </div>`}
                                <div class="d-flex justify-content-center gap-2">
                                    <button type="submit" class="btn btn-primary btn-new-user">
                                        <i class="bi bi-save"></i> Guardar
                                    </button>
                                    <button type="button" class="btn btn-outline-secondary" onclick="cargarUsuarios()">Cancelar</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;
        // Enlazar eventos de validación/formateo en tiempo real (escopados al formulario)
        const formEl = document.getElementById('form-usuario');
        const rutInput = formEl?.querySelector('#rut');
        if (rutInput) {
            // Normaliza valor inicial si existe
            rutInput.value = normalizarRut(rutInput.value);
            rutInput.addEventListener('input', validarRutEnTiempoReal);
            rutInput.addEventListener('blur', validarRutCompleto);
        }
        const telInput = formEl?.querySelector('#telefono');
        if (telInput) {
            telInput.addEventListener('input', (e) => {
                const v = normalizarTelefono(e.target.value, true);
                e.target.value = v;
            });
            telInput.addEventListener('blur', (e) => {
                e.target.value = normalizarTelefono(e.target.value);
            });
        }
        // Ayuda en tiempo real para contraseña fuerte
        const passInput = formEl?.querySelector('#password');
        if (passInput) {
            passInput.addEventListener('input', (e) => {
                const hintEl = formEl?.querySelector('#password_hint');
                if (!hintEl) return;
                const issues = obtenerFaltasPassword(e.target.value);
                hintEl.textContent = issues.length === 0
                    ? 'Contraseña fuerte'
                    : 'Falta: ' + issues.join(', ');
            });
        }

        formEl?.addEventListener('submit', guardarUsuario);

        // Cargar regiones y comunas en los selects con preselección cuando edita
        await cargarRegionesYComunasEnFormularioUsuario(usuario || null);
    } catch (error) {
        console.error('Error al mostrar formulario de usuario:', error);
        mostrarNotificacion('Error al cargar formulario: ' + (error.message || ''), 'danger');
    } finally {
        mostrarCargando(false);
    }
}

// Guardar creación/edición de usuario
async function guardarUsuario(e) {
    e.preventDefault();

    const form = document.getElementById('form-usuario');
    const accion = form?.dataset?.accion;
    const usuarioId = form?.dataset?.id;

    // Importante: usar selecciones relativas al formulario para evitar colisiones de IDs
    const primer_nombre = form?.querySelector('#primer_nombre')?.value.trim();
    const segundo_nombre = form?.querySelector('#segundo_nombre')?.value.trim();
    const primer_apellido = form?.querySelector('#primer_apellido')?.value.trim();
    const segundo_apellido = form?.querySelector('#segundo_apellido')?.value.trim();
    const email = form?.querySelector('#email')?.value.trim();
    let rut = form?.querySelector('#rut')?.value.trim();
    let telefono = form?.querySelector('#telefono')?.value.trim();
    const direccion = form?.querySelector('#direccion')?.value.trim();
    const regionSelect = form?.querySelector('#region');
    const comunaSelect = form?.querySelector('#comuna');
    const regionNombre = (regionSelect && regionSelect.selectedIndex > 0)
        ? regionSelect.options[regionSelect.selectedIndex].text
        : '';
    const comunaNombre = comunaSelect?.value?.trim() || '';
    const role = form?.querySelector('#role')?.value;
    const departamento_id_raw = form?.querySelector('#departamento_id')?.value;
    const departamento_id = departamento_id_raw ? parseInt(departamento_id_raw) : null;
    const municipalidad_id_raw = form?.querySelector('#municipalidad_id')?.value;
    const municipalidad_id = municipalidad_id_raw ? parseInt(municipalidad_id_raw) : null;
    const password = form?.querySelector('#password')?.value;

    // Normalizar antes de validar/enviar (con valores por defecto seguros)
    rut = normalizarRut(rut || '');
    telefono = normalizarTelefono(telefono || '');
    // Reflejar normalización en los inputs (evita discrepancias visuales)
    const rutEl = form?.querySelector('#rut');
    if (rutEl) rutEl.value = rut;
    const telEl = form?.querySelector('#telefono');
    if (telEl) telEl.value = telefono;

    // Validación más descriptiva de campos obligatorios
    const faltantes = [];
    const reportarFalta = (id, mensaje) => {
        const el = form?.querySelector(`#${id}`);
        if (el) marcarCampoInvalidoUsuarios(el, mensaje);
        faltantes.push(mensaje);
    };

    const isEmpty = (v) => (v ?? '').toString().trim().length === 0;
    if (isEmpty(primer_nombre)) reportarFalta('primer_nombre', 'El campo "primer_nombre" es obligatorio');
    if (isEmpty(primer_apellido)) reportarFalta('primer_apellido', 'El campo "primer_apellido" es obligatorio');
    if (isEmpty(email)) reportarFalta('email', 'El campo "email" es obligatorio');
    // RUT se valida con reglas específicas más abajo; aquí solo chequeamos vacío
    if (isEmpty(rut)) reportarFalta('rut', 'El campo "rut" es obligatorio');
    if (isEmpty(telefono)) reportarFalta('telefono', 'El campo "telefono" es obligatorio');
    if (isEmpty(direccion)) reportarFalta('direccion', 'El campo "direccion" es obligatorio');
    if (isEmpty(role)) reportarFalta('role', 'El campo "role" es obligatorio');
    if (!usuarioId && isEmpty(password)) reportarFalta('password', 'La contraseña es obligatoria');

    if (faltantes.length > 0) {
        mostrarNotificacion('Completa los campos obligatorios: ' + faltantes.join(', '), 'warning');
        return;
    }

    // Validar RUT con reglas exactas de backend
    const rutCheck = validarRutValor(rut, { exacto8: true });
    if (!rutCheck.valido) {
        const inputRut = form?.querySelector('#rut');
        if (inputRut) marcarCampoInvalidoUsuarios(inputRut, rutCheck.mensaje);
        mostrarNotificacion(rutCheck.mensaje, 'warning');
        return;
    }

    const currentUser = (typeof obtenerUsuario === 'function') ? obtenerUsuario() : null;
    const esSuperadmin = currentUser?.rol_nombre === 'superadministrador';
    if (role === 'funcionario' && !departamento_id) {
        mostrarNotificacion('El departamento es obligatorio para funcionarios', 'warning');
        return;
    }
    if (esSuperadmin && role === 'admin' && !municipalidad_id) {
        mostrarNotificacion('La municipalidad es obligatoria para administradores', 'warning');
        const el = form?.querySelector('#municipalidad_id');
        if (el) marcarCampoInvalidoUsuarios(el, 'Seleccione una municipalidad');
        return;
    }

    if (!usuarioId) {
        const passIssues = obtenerFaltasPassword(password);
        if (passIssues.length > 0) {
            const passEl = form?.querySelector('#password');
            if (passEl) marcarCampoInvalidoUsuarios(passEl, 'Falta: ' + passIssues.join(', '));
            mostrarNotificacion('La contraseña debe ser fuerte: falta ' + passIssues.join(', '), 'warning');
            return;
        }
    }

    const direccionCompuesta = [direccion, comunaNombre, regionNombre].filter(Boolean).join(', ');
    const payload = { 
        primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
        email, rut, telefono, direccion: direccionCompuesta, role 
    };
    if (esSuperadmin && role === 'admin') payload.municipalidad_id = municipalidad_id;
    if (!esSuperadmin && departamento_id) payload.municipalidad_id = departamento_id;
    if (!usuarioId) payload.password = password;

    try {
        mostrarCargando(true);
        if (accion === 'actualizar' && usuarioId) {
            try { console.log('[USUARIOS][UPDATE][PAYLOAD]', { id: usuarioId, ...payload }); } catch (_) {}
            await fetchAPI(`/usuarios/${usuarioId}`, { method: 'PUT', body: payload });
            mostrarNotificacion('Usuario actualizado correctamente', 'success');
        } else {
            try { console.log('[USUARIOS][CREATE][PAYLOAD]', payload); } catch (_) {}
            if (esSuperadmin && role === 'admin') {
                await fetchAPI('/superadmin/usuarios/administradores', { method: 'POST', body: payload });
            } else {
                await fetchAPI('/usuarios', { method: 'POST', body: payload });
            }
            mostrarNotificacion('Usuario creado correctamente', 'success');
        }
        cargarUsuarios();
    } catch (error) {
        console.error('Error al guardar usuario:', error);
        if (error.status === 401) {
            mostrarNotificacion('Sesión expirada. Inicia sesión nuevamente.', 'warning');
            if (typeof mostrarFormularioLogin === 'function') mostrarFormularioLogin();
        } else if (error.status === 403) {
            mostrarNotificacion('No tienes permisos para gestionar usuarios.', 'warning');
        } else {
            mostrarNotificacion('Error al guardar usuario: ' + (error.message || ''), 'danger');
        }
    } finally {
        mostrarCargando(false);
    }
}

// Formulario específico para crear administradores (SUPERADMINISTRADOR)
async function mostrarFormularioCrearAdministrador() {
    try {
        mostrarCargando(true);

        // Cargar municipalidades para el select
        let municipalidades = [];
        try {
            const respDept = await fetchAPI('/departamentos');
            municipalidades = respDept.departamentos || [];
        } catch (_) { /* opcional */ }

        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;
        mainContent.classList.remove('d-none');
        mainContent.innerHTML = `
            <div class="row mb-3 align-items-center">
                <div class="col-4">
                    <button class="btn btn-outline-secondary" onclick="cargarInterfazSuperadmin({ nombre: '', apellido: '' })">
                        <i class="bi bi-arrow-left"></i> Volver
                    </button>
                </div>
                <div class="col-4 text-center">
                    <h2 class="section-title">Crear Administrador</h2>
                </div>
                <div class="col-4"></div>
            </div>

            <div class="row">
                <div class="col-md-8 offset-md-2">
                    <div class="card no-hover">
                        <div class="card-body">
                            <form id="form-admin-super" data-accion="crear">
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="primer_nombre" class="form-label">Primer nombre</label>
                                            <input type="text" class="form-control" id="primer_nombre" required>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="segundo_nombre" class="form-label">Segundo nombre</label>
                                            <input type="text" class="form-control" id="segundo_nombre" placeholder="Opcional">
                                        </div>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="primer_apellido" class="form-label">Primer apellido</label>
                                            <input type="text" class="form-control" id="primer_apellido" required>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="segundo_apellido" class="form-label">Segundo apellido</label>
                                            <input type="text" class="form-control" id="segundo_apellido" placeholder="Opcional">
                                        </div>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="email" class="form-label">Email</label>
                                            <input type="email" class="form-control" id="email" required>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="rut" class="form-label">RUT</label>
                                            <input type="text" class="form-control" id="rut" required>
                                        </div>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="telefono" class="form-label">Teléfono</label>
                                            <input type="text" class="form-control" id="telefono" required>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="direccion" class="form-label">Dirección</label>
                                            <input type="text" class="form-control" id="direccion" required>
                                        </div>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="municipalidad_id" class="form-label">Municipalidad</label>
                                            <select class="form-select" id="municipalidad_id" required>
                                                <option value="">Selecciona municipalidad</option>
                                                ${municipalidades.map(m => `<option value="${m.id}">${m.nombre}</option>`).join('')}
                                            </select>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="password" class="form-label">Contraseña</label>
                                            <input type="password" class="form-control" id="password" required>
                                            <div id="password_hint" class="form-text">Debe tener 8+, mayúscula, minúscula, número y símbolo (@$!%*?&#.).</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="d-flex justify-content-center gap-2">
                                    <button type="submit" class="btn btn-success">
                                        <i class="bi bi-person-plus"></i> Crear Administrador
                                    </button>
                                    <button type="button" class="btn btn-outline-secondary" onclick="cargarInterfazSuperadmin({ nombre: '', apellido: '' })">Cancelar</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const formEl = document.getElementById('form-admin-super');
        const rutInput = formEl?.querySelector('#rut');
        if (rutInput) {
            rutInput.addEventListener('input', validarRutEnTiempoReal);
            rutInput.addEventListener('blur', validarRutCompleto);
        }
        const telInput = formEl?.querySelector('#telefono');
        if (telInput) {
            telInput.addEventListener('input', (e) => {
                const v = normalizarTelefono(e.target.value, true);
                e.target.value = v;
            });
            telInput.addEventListener('blur', (e) => {
                e.target.value = normalizarTelefono(e.target.value);
            });
        }
        const passInput = formEl?.querySelector('#password');
        if (passInput) {
            passInput.addEventListener('input', (e) => {
                const hintEl = formEl?.querySelector('#password_hint');
                if (!hintEl) return;
                const issues = obtenerFaltasPassword(e.target.value);
                hintEl.textContent = issues.length === 0
                    ? 'Contraseña fuerte'
                    : 'Falta: ' + issues.join(', ');
            });
        }

        formEl?.addEventListener('submit', guardarAdministradorSuperadmin);
    } catch (error) {
        console.error('Error al mostrar formulario de admin:', error);
        mostrarNotificacion('Error al cargar formulario: ' + (error.message || ''), 'danger');
    } finally {
        mostrarCargando(false);
    }
}

async function guardarAdministradorSuperadmin(e) {
    e.preventDefault();
    const form = document.getElementById('form-admin-super');

    const primer_nombre = form?.querySelector('#primer_nombre')?.value.trim();
    const segundo_nombre = form?.querySelector('#segundo_nombre')?.value.trim();
    const primer_apellido = form?.querySelector('#primer_apellido')?.value.trim();
    const segundo_apellido = form?.querySelector('#segundo_apellido')?.value.trim();
    const email = form?.querySelector('#email')?.value.trim();
    let rut = form?.querySelector('#rut')?.value.trim();
    let telefono = form?.querySelector('#telefono')?.value.trim();
    const direccion = form?.querySelector('#direccion')?.value.trim();
    const municipalidad_id_raw = form?.querySelector('#municipalidad_id')?.value;
    const municipalidad_id = municipalidad_id_raw ? parseInt(municipalidad_id_raw) : null;
    const password = form?.querySelector('#password')?.value;

    rut = normalizarRut(rut || '');
    telefono = normalizarTelefono(telefono || '');

    const faltantes = [];
    const reportar = (id, msg) => {
        const el = form?.querySelector(`#${id}`);
        if (el) marcarCampoInvalidoUsuarios(el, msg);
        faltantes.push(msg);
    };
    const isEmpty = (v) => (v ?? '').toString().trim().length === 0;
    if (isEmpty(primer_nombre)) reportar('primer_nombre', 'El campo "primer_nombre" es obligatorio');
    if (isEmpty(primer_apellido)) reportar('primer_apellido', 'El campo "primer_apellido" es obligatorio');
    if (isEmpty(email)) reportar('email', 'El campo "email" es obligatorio');
    if (isEmpty(rut)) reportar('rut', 'El campo "rut" es obligatorio');
    if (isEmpty(telefono)) reportar('telefono', 'El campo "telefono" es obligatorio');
    if (isEmpty(direccion)) reportar('direccion', 'El campo "direccion" es obligatorio');
    if (!municipalidad_id) reportar('municipalidad_id', 'Debe seleccionar una municipalidad');
    if (isEmpty(password)) reportar('password', 'La contraseña es obligatoria');
    if (faltantes.length > 0) {
        mostrarNotificacion('Completa los campos obligatorios: ' + faltantes.join(', '), 'warning');
        return;
    }

    const rutCheck = validarRutValor(rut, { exacto8: true });
    if (!rutCheck.valido) {
        const inputRut = form?.querySelector('#rut');
        if (inputRut) marcarCampoInvalidoUsuarios(inputRut, rutCheck.mensaje);
        mostrarNotificacion(rutCheck.mensaje, 'warning');
        return;
    }
    const passIssues = obtenerFaltasPassword(password);
    if (passIssues.length > 0) {
        const passEl = form?.querySelector('#password');
        if (passEl) marcarCampoInvalidoUsuarios(passEl, 'Falta: ' + passIssues.join(', '));
        mostrarNotificacion('La contraseña debe ser fuerte: falta ' + passIssues.join(', '), 'warning');
        return;
    }

    const payload = {
        primer_nombre,
        segundo_nombre,
        primer_apellido,
        segundo_apellido,
        email,
        password,
        rut,
        telefono,
        direccion,
        municipalidad_id
    };

    try {
        mostrarCargando(true);
        await fetchAPI('/superadmin/usuarios/administradores', { method: 'POST', body: payload });
        mostrarNotificacion('Administrador creado correctamente', 'success');
        cargarInterfazSuperadmin({ nombre: '', apellido: '' });
    } catch (error) {
        console.error('Error al crear administrador:', error);
        if (error.status === 401) {
            mostrarNotificacion('Sesión expirada. Inicia sesión nuevamente.', 'warning');
        } else if (error.status === 403) {
            mostrarNotificacion('No tienes permisos para crear administradores.', 'warning');
        } else {
            mostrarNotificacion('Error al crear administrador: ' + (error.message || ''), 'danger');
        }
    } finally {
        mostrarCargando(false);
    }
}

/**
 * Valida que una contraseña cumpla requisitos mínimos de seguridad
 * - Al menos 8 caracteres
 * - Incluye mayúsculas, minúsculas, números y un carácter especial
 */
function validarPasswordFuerte(password) {
    // Reglas: al menos una minúscula, una mayúscula, un número y un carácter especial de este conjunto: @ $ ! % * ? & # .
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#.]).{8,}$/;
    return regex.test(password || '');
}

// Devuelve lista de requisitos faltantes para la contraseña
function obtenerFaltasPassword(password) {
    const v = password || '';
    const faltas = [];
    if (v.length < 8) faltas.push('mínimo 8 caracteres');
    if (!/[A-Z]/.test(v)) faltas.push('una mayúscula');
    if (!/[a-z]/.test(v)) faltas.push('una minúscula');
    if (!/\d/.test(v)) faltas.push('un número');
    if (!/[@$!%*?&#.]/.test(v)) faltas.push('un símbolo (@$!%*?&#.)');
    return faltas;
}

// Validador de email simple y robusto sin dependencias externas
function isValidEmail(email) {
    if (typeof email !== 'string') return false;
    const value = email.trim();
    // chequeo básico usuario@dominio.tld
    const basic = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    if (!basic) return false;
    // evitar puntos consecutivos y punto final
    if (value.includes('..')) return false;
    if (value.endsWith('.')) return false;
    return true;
}

// Valida un RUT y devuelve estado y mensaje específico
function validarRutValor(valor, opciones = {}) {
    const { exacto8 = false } = opciones;
    const rutPattern = exacto8 ? /^\d{8}-[\dkK]$/ : /^\d{7,8}-[\dkK]$/;
    if (!rutPattern.test(valor)) {
        const mensajeBase = exacto8
            ? 'El RUT debe tener el formato 12345678-9 (sin puntos, con guión) y exactamente 8 dígitos antes del guión'
            : 'El RUT debe tener el formato 1234567-8 o 12345678-9 (sin puntos, con guión)';
        return { valido: false, mensaje: mensajeBase };
    }
    const cuerpo = valor.split('-')[0];
    if (exacto8 && cuerpo.length !== 8) {
        return { valido: false, mensaje: 'El RUT debe tener exactamente 8 dígitos antes del guión' };
    }
    if (!validarDigitoVerificadorRut(valor)) {
        return { valido: false, mensaje: 'El dígito verificador del RUT no es válido' };
    }
    return { valido: true, mensaje: null };
}

// Helpers de feedback por campo (Usuarios)
function marcarCampoInvalidoUsuarios(input, mensaje) {
    input.classList.add('is-invalid');
    // Registrar el campo inválido para poder reportarlo aunque no se vea en rojo
    try {
        if (!window.__invalidCamposUsuarios) {
            window.__invalidCamposUsuarios = new Set();
        }
        if (input && input.id) {
            window.__invalidCamposUsuarios.add(input.id);
        }
    } catch (_) { /* noop */ }
    let container = input.parentElement;
    if (container && container.classList && container.classList.contains('input-group')) {
        container = container.parentElement || container;
    }
    let fb = container.querySelector(`.invalid-feedback[data-for="${input.id}"]`);
    if (!fb) {
        fb = document.createElement('div');
        fb.className = 'invalid-feedback';
        fb.setAttribute('data-for', input.id);
        container.appendChild(fb);
    }
    fb.textContent = mensaje || 'Campo inválido';
}

function limpiarCampoInvalidoUsuarios(input) {
    input.classList.remove('is-invalid');
    // Remover del registro de campos inválidos
    try {
        if (window.__invalidCamposUsuarios && input && input.id) {
            window.__invalidCamposUsuarios.delete(input.id);
        }
    } catch (_) { /* noop */ }
    let container = input.parentElement;
    if (container && container.classList && container.classList.contains('input-group')) {
        container = container.parentElement || container;
    }
    const fb = container.querySelector(`.invalid-feedback[data-for="${input.id}"]`);
    if (fb) fb.remove();
}

/**
 * Función para editar un usuario
 * @param {number} usuarioId - ID del usuario a editar
 */
function editarUsuario(usuarioId) {
    mostrarFormularioUsuario(usuarioId);
}

/**
 * Función para ver el detalle de un usuario
 * @param {number} usuarioId - ID del usuario
 */
async function verDetalleUsuario(usuarioId) {
    try {
        mostrarCargando(true);
        
        const usuario = await fetchAPI(`/usuarios/${usuarioId}`);
        
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="row mb-4">
                <div class="col-12">
                    <button class="btn btn-outline-secondary mb-3" onclick="cargarUsuarios()">
                        <i class="bi bi-arrow-left"></i> Volver a la lista
                    </button>
                    <h2>Detalle del Usuario</h2>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-8 offset-md-2">
                    <div class="card">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="mb-0">Información del Usuario</h5>
                            <div>
                                <button class="btn btn-edit" onclick="editarUsuario(${usuario.id})">
                                    <i class="bi bi-pencil"></i> Editar
                                </button>
                                <button class="btn btn-toggle ${usuario.estado === 'activo' ? '' : 'btn-activate'}" 
                                        onclick="cambiarEstadoUsuario(${usuario.id}, '${usuario.estado === 'activo' ? 'inactivo' : 'activo'}')">
                                    <i class="bi ${usuario.estado === 'activo' ? 'bi-person-x' : 'bi-person-check'}"></i>
                                    ${usuario.estado === 'activo' ? 'Desactivar' : 'Activar'}
                                </button>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">ID:</div>
                                <div class="col-md-8">${usuario.id}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Nombre:</div>
                                <div class="col-md-8">${usuario.nombre} ${usuario.apellido}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Email:</div>
                                <div class="col-md-8">${usuario.email}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Rol:</div>
                                <div class="col-md-8">${usuario.role}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Departamento:</div>
                                <div class="col-md-8">${usuario.departamento?.nombre || 'N/A'}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Estado:</div>
                                <div class="col-md-8"><span class="estado-${usuario.estado}">${usuario.estado}</span></div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Fecha de Creación:</div>
                                <div class="col-md-8">${formatearFecha(usuario.createdAt)}</div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-md-4 fw-bold">Última Actualización:</div>
                                <div class="col-md-8">${formatearFecha(usuario.updatedAt)}</div>
                            </div>
                        </div>
                    </div>
                    
                    ${usuario.role === 'ciudadano' ? `
                        <div class="card mt-4">
                            <div class="card-header">
                                <h5>Trámites del Ciudadano</h5>
                            </div>
                            <div class="card-body" id="tramites-ciudadano">
                                <div class="text-center">
                                    <div class="spinner-border text-primary" role="status">
                                        <span class="visually-hidden">Cargando...</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        // Si es ciudadano, cargar sus trámites
        if (usuario.role === 'ciudadano') {
            cargarTramitesCiudadano(usuario.id);
        }
        
    } catch (error) {
        console.error('Error al cargar detalle del usuario:', error);
        mostrarNotificacion('Error al cargar detalle: ' + error.message, 'danger');
    } finally {
        mostrarCargando(false);
    }
}

/**
 * Función para cargar los trámites de un ciudadano
 * @param {number} usuarioId - ID del ciudadano
 */
async function cargarTramitesCiudadano(usuarioId) {
    try {
        const tramites = await fetchAPI(`/usuarios/${usuarioId}/tramites`);
        
        const tramitesContainer = document.getElementById('tramites-ciudadano');
        
        if (tramites.length === 0) {
            tramitesContainer.innerHTML = '<p>Este ciudadano no tiene trámites registrados.</p>';
            return;
        }
        
        tramitesContainer.innerHTML = `
            <div class="table-responsive">
                <table class="table table-striped table-hover">
                    <thead>
                        <tr>
                            <th>Folio</th>
                            <th>Tipo</th>
                            <th>Fecha</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tramites.map(tramite => `
                            <tr>
                                <td>${tramite.folio}</td>
                                <td class="text-uppercase">${tramite.tipo || 'N/A'}</td>
                                <td>${formatearFecha(tramite.fecha_solicitud)}</td>
                                <td><span class="estado-${tramite.estado}">${tramite.estado}</span></td>
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
        `;
        
    } catch (error) {
        console.error('Error al cargar trámites del ciudadano:', error);
        const tramitesContainer = document.getElementById('tramites-ciudadano');
        tramitesContainer.innerHTML = '<div class="alert alert-danger">Error al cargar trámites</div>';
    }
}

/**
 * Función para cambiar el estado de un usuario
 * @param {number} usuarioId - ID del usuario
 * @param {string} nuevoEstado - Nuevo estado (activo/inactivo)
 */
async function cambiarEstadoUsuario(usuarioId, nuevoEstado) {
    try {
        mostrarCargando(true);
        
        await fetchAPI(`/usuarios/${usuarioId}/estado`, {
            method: 'PUT',
            body: JSON.stringify({ estado: nuevoEstado })
        });
        
        mostrarNotificacion(`Usuario ${nuevoEstado === 'activo' ? 'activado' : 'desactivado'} correctamente`, 'success');
        cargarUsuarios();
        
    } catch (error) {
        console.error('Error al cambiar estado del usuario:', error);
        mostrarNotificacion('Error al cambiar estado: ' + error.message, 'danger');
    } finally {
        mostrarCargando(false);
    }
}

/**
 * Función para cargar la página de cambio de contraseña
 */
async function cargarCambioPassword() {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="row mb-4">
            <div class="col-12">
                <h2>Cambiar Contraseña</h2>
            </div>
        </div>
        
        <div class="row">
            <div class="col-md-6 offset-md-3">
                <div class="card">
                    <div class="card-body">
                        <form id="form-cambio-password">
                            <div class="mb-3">
                                <label for="password-actual" class="form-label">Contraseña Actual</label>
                                <input type="password" class="form-control" id="password-actual" required>
                            </div>
                            
                            <div class="mb-3">
                                <label for="password-nuevo" class="form-label">Nueva Contraseña</label>
                                <input type="password" class="form-control" id="password-nuevo" required>
                            </div>
                            
                            <div class="mb-3">
                                <label for="confirmar-password-nuevo" class="form-label">Confirmar Nueva Contraseña</label>
                                <input type="password" class="form-control" id="confirmar-password-nuevo" required>
                            </div>
                            
                            <div class="d-grid gap-2">
                                <button type="submit" class="btn btn-primary">
                                    <i class="bi bi-key"></i> Cambiar Contraseña
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Agregar evento para el formulario
    const formCambioPassword = document.getElementById('form-cambio-password');
    formCambioPassword.addEventListener('submit', cambiarPassword);
}

/**
 * Función para cambiar la contraseña del usuario
 * @param {Event} e - Evento del formulario
 */
async function cambiarPassword(e) {
    e.preventDefault();
    
    const passwordActual = document.getElementById('password-actual').value;
    const passwordNuevo = document.getElementById('password-nuevo').value.trim();
    const confirmarPasswordNuevo = document.getElementById('confirmar-password-nuevo').value.trim();

    // Validación de complejidad
    if (!validarPasswordFuerte(passwordNuevo)) {
        mostrarNotificacion('La contraseña debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas, números y un carácter especial.', 'warning');
        return;
    }
    
    if (passwordNuevo !== confirmarPasswordNuevo) {
        mostrarNotificacion('Las contraseñas no coinciden', 'warning');
        return;
    }
    
    try {
        mostrarCargando(true);
        
        await fetchAPI('/usuarios/cambiar-password', {
            method: 'PUT',
            body: JSON.stringify({
                password_actual: passwordActual,
                password_nuevo: passwordNuevo
            })
        });
        
        mostrarNotificacion('Contraseña cambiada correctamente', 'success');
        document.getElementById('form-cambio-password').reset();
        
    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        mostrarNotificacion('Error al cambiar contraseña: ' + error.message, 'danger');
    } finally {
        mostrarCargando(false);
    }
}

/**
 * Función para cargar el perfil del usuario
 */
async function cargarPerfil() {
    try {
        mostrarCargando(true);
        
        const usuario = await fetchAPI('/usuarios/perfil');
        
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="row mb-4">
                <div class="col-12">
                    <h2>Mi Perfil</h2>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-8 offset-md-2">
                    <div class="card mb-4">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="mb-0">Información Personal</h5>
                            <button class="btn btn-primary" id="btn-editar-perfil">
                                <i class="bi bi-pencil"></i> Editar
                            </button>
                        </div>
                        <div class="card-body">
                            <div id="vista-perfil">
                                <div class="row mb-3">
                                    <div class="col-md-4 fw-bold">Nombre:</div>
                                    <div class="col-md-8">${usuario.nombre} ${usuario.apellido}</div>
                                </div>
                                <div class="row mb-3">
                                    <div class="col-md-4 fw-bold">Email:</div>
                                    <div class="col-md-8">${usuario.email}</div>
                                </div>
                                <div class="row mb-3">
                                    <div class="col-md-4 fw-bold">Rol:</div>
                                    <div class="col-md-8">${usuario.role}</div>
                                </div>
                                ${usuario.departamento ? `
                                    <div class="row mb-3">
                                        <div class="col-md-4 fw-bold">Departamento:</div>
                                        <div class="col-md-8">${usuario.departamento.nombre}</div>
                                    </div>
                                ` : ''}
                            </div>
                            
                            <div id="form-perfil" class="d-none">
                                <form id="editar-perfil-form">
                                    <div class="row mb-3">
                                        <div class="col-md-6">
                                            <label for="perfil-nombre" class="form-label">Nombre</label>
                                            <input type="text" class="form-control" id="perfil-nombre" value="${usuario.nombre}" required>
                                        </div>
                                        <div class="col-md-6">
                                            <label for="perfil-apellido" class="form-label">Apellido</label>
                                            <input type="text" class="form-control" id="perfil-apellido" value="${usuario.apellido}" required>
                                        </div>
                                    </div>
                                    
                                    <div class="mb-3">
                                        <label for="perfil-email" class="form-label">Email</label>
                <input type="text" class="form-control" id="perfil-email" value="${usuario.email}" required>
                                    </div>
                                    
                                    <div class="d-grid gap-2">
                                        <button type="submit" class="btn btn-primary">
                                            <i class="bi bi-save"></i> Guardar Cambios
                                        </button>
                                        <button type="button" class="btn btn-outline-secondary" id="btn-cancelar-edicion">
                                            Cancelar
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                    
                    <div class="card">
                        <div class="card-header">
                            <h5>Seguridad</h5>
                        </div>
                        <div class="card-body">
                            <div class="d-grid gap-2">
                                <button class="btn btn-warning" onclick="cargarCambioPassword()">
                                    <i class="bi bi-key"></i> Cambiar Contraseña
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Agregar eventos para edición de perfil
        const btnEditarPerfil = document.getElementById('btn-editar-perfil');
        const btnCancelarEdicion = document.getElementById('btn-cancelar-edicion');
        const vistaPerfil = document.getElementById('vista-perfil');
        const formPerfil = document.getElementById('form-perfil');
        const formEditarPerfil = document.getElementById('editar-perfil-form');
        
        btnEditarPerfil.addEventListener('click', () => {
            vistaPerfil.classList.add('d-none');
            formPerfil.classList.remove('d-none');
        });
        
        btnCancelarEdicion.addEventListener('click', () => {
            formPerfil.classList.add('d-none');
            vistaPerfil.classList.remove('d-none');
        });
        
        formEditarPerfil.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            try {
                mostrarCargando(true);
                
                const datosActualizados = {
                    nombre: document.getElementById('perfil-nombre').value,
                    apellido: document.getElementById('perfil-apellido').value,
                    email: document.getElementById('perfil-email').value
                };
                
                await fetchAPI('/usuarios/perfil', {
                    method: 'PUT',
                    body: JSON.stringify(datosActualizados)
                });
                
                mostrarNotificacion('Perfil actualizado correctamente', 'success');
                cargarPerfil();
                
            } catch (error) {
                console.error('Error al actualizar perfil:', error);
                mostrarNotificacion('Error al actualizar perfil: ' + error.message, 'danger');
            } finally {
                mostrarCargando(false);
            }
        });
        
    } catch (error) {
        console.error('Error al cargar perfil:', error);
        mostrarNotificacion('Error al cargar perfil: ' + error.message, 'danger');
    } finally {
        mostrarCargando(false);
    }
}

/**
 * Función para validar RUT en tiempo real (formato)
 * @param {Event} e - Evento del input
 */
function validarRutEnTiempoReal(e) {
    const input = e.target;
    let valor = input.value.replace(/[^0-9kK]/g, '');
    
    // Formatear automáticamente
    if (valor.length > 1) {
        const cuerpo = valor.slice(0, -1);
        const dv = valor.slice(-1);
        if (cuerpo.length > 0) {
            valor = cuerpo + '-' + dv;
        }
    }
    
    input.value = valor;
    
    // Remover clases de validación previas
    input.classList.remove('is-valid', 'is-invalid');
    
    // Validar formato básico
     const rutPattern = /^\d{8}-[\dkK]$/;
     if (valor.length > 0 && !rutPattern.test(valor)) {
         input.classList.add('is-invalid');
         mostrarErrorRut(input, '❌ Formato incorrecto. Use: 12345678-9 (sin puntos, exactamente 8 dígitos)');
     } else if (valor.length > 0) {
         removerErrorRut(input);
     }
}

/**
 * Función para validar RUT completo (incluyendo dígito verificador)
 * @param {Event} e - Evento del input
 */
function validarRutCompleto(e) {
    const input = e.target;
    const valor = input.value;
    
    if (!valor) return;
    
    const rutPattern = /^\d{8}-[\dkK]$/;
    
    // Validar formato
     if (!rutPattern.test(valor)) {
         input.classList.add('is-invalid');
         mostrarErrorRut(input, '❌ Formato incorrecto. Use: 12345678-9 (sin puntos, con guión, exactamente 8 dígitos)');
         return;
     }
     
     // Validar longitud exacta
     const cuerpo = valor.split('-')[0];
     if (cuerpo.length !== 8) {
         input.classList.add('is-invalid');
         mostrarErrorRut(input, '❌ RUT inválido. Debe tener exactamente 8 dígitos antes del guión (ej: 12345678-9)');
         return;
     }
     
     // Validar dígito verificador
     if (!validarDigitoVerificadorRut(valor)) {
         input.classList.add('is-invalid');
         mostrarErrorRut(input, '❌ Dígito verificador incorrecto. Verifique el último dígito');
         return;
     }
    
    // RUT válido
     input.classList.remove('is-invalid');
     input.classList.add('is-valid');
     removerErrorRut(input);
     mostrarExitoRut(input, '✅ RUT válido');
}

/**
 * Función para validar el dígito verificador del RUT
 * @param {string} rut - RUT a validar
 * @returns {boolean} - True si es válido
 */
function validarDigitoVerificadorRut(rut) {
    const rutLimpio = rut.replace(/\./g, '').replace('-', '');
    const cuerpo = rutLimpio.slice(0, -1);
    const dv = rutLimpio.slice(-1).toLowerCase();
    
    let suma = 0;
    let multiplicador = 2;
    
    for (let i = cuerpo.length - 1; i >= 0; i--) {
        suma += parseInt(cuerpo[i]) * multiplicador;
        multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
    }
    
    const resto = suma % 11;
    const dvCalculado = resto === 0 ? '0' : resto === 1 ? 'k' : (11 - resto).toString();
    
    return dv === dvCalculado;
}

/**
 * Función para mostrar error de RUT
 * @param {HTMLElement} input - Input del RUT
 * @param {string} mensaje - Mensaje de error
 */
function mostrarErrorRut(input, mensaje) {
    removerErrorRut(input);
    removerExitoRut(input);
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'invalid-feedback';
    errorDiv.textContent = mensaje;
    errorDiv.id = 'rut-error';
    
    input.parentNode.appendChild(errorDiv);
}

/**
 * Función para mostrar éxito de RUT
 * @param {HTMLElement} input - Input del RUT
 * @param {string} mensaje - Mensaje de éxito
 */
function mostrarExitoRut(input, mensaje) {
    removerErrorRut(input);
    removerExitoRut(input);
    
    const exitoDiv = document.createElement('div');
     exitoDiv.className = 'valid-feedback';
     exitoDiv.textContent = mensaje;
     exitoDiv.id = input.id + '-success';
     
     input.parentNode.appendChild(exitoDiv);
}

/**
 * Función para remover error de RUT
 * @param {HTMLElement} input - Input del RUT
 */
function removerErrorRut(input) {
    const errorExistente = document.getElementById('rut-error');
    if (errorExistente) {
        errorExistente.remove();
    }
    if (input) {
        input.classList.remove('is-invalid', 'is-valid');
    }
}

/**
 * Normaliza un RUT al formato canónico: 12345678-9 (sin puntos, guión antes del DV, DV en mayúscula)
 * No corrige el dígito verificador: solo formatea.
 */
function normalizarRut(valor) {
    let v = (valor || '').toString().trim();
    // Eliminar puntos y espacios, dejar solo dígitos y k/K
    v = v.replace(/\./g, '').replace(/\s+/g, '').replace(/[^0-9kK-]/g, '');
    const solo = v.replace(/[^0-9kK]/g, '');
    if (solo.length === 0) return '';
    const cuerpo = solo.slice(0, Math.max(1, solo.length - 1));
    const dv = solo.slice(-1).toUpperCase();
    return `${cuerpo}-${dv}`;
}

/**
 * Normaliza teléfono: deja solo dígitos y un '+' al inicio si existe.
 * En input (typing=true) no fuerza formato final, solo limpia.
 */
function normalizarTelefono(valor, typing = false) {
    let v = (valor || '').toString();
    // Conservar solo dígitos y un '+' si está al inicio
    v = v.trim();
    const tienePlus = v.startsWith('+');
    const soloDigitos = v.replace(/\D/g, '');
    return tienePlus ? `+${soloDigitos}` : soloDigitos;
}

/**
 * Función para remover éxito de RUT
 * @param {HTMLElement} input - Input del RUT
 */
function removerExitoRut(input) {
     const exitoExistente = document.getElementById(input.id + '-success');
     if (exitoExistente) {
         exitoExistente.remove();
     }
 }

/**
 * Función para mostrar/ocultar contraseñas
 * @param {string} inputId - ID del campo de contraseña
 */
function togglePassword(inputId) {
    const passwordInput = document.getElementById(inputId);
    const passwordIcon = document.getElementById(inputId + '-icon');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        passwordIcon.className = 'bi bi-eye-slash';
    } else {
        passwordInput.type = 'password';
        passwordIcon.className = 'bi bi-eye';
    }
}

/**
 * Cargar regiones y comunas en los selects del formulario de usuario
 */
async function cargarRegionesYComunasEnFormularioUsuario(usuario = null) {
    try {
        const regionSelect = document.getElementById('region');
        const comunaSelect = document.getElementById('comuna');
        if (!regionSelect || !comunaSelect) return;

        // Cargar regiones
        regionSelect.innerHTML = '<option value="">Seleccione una región</option>';
        const regionesResp = await fetchAPI('/geografia/regiones');
        const regiones = regionesResp.regiones || regionesResp || [];
        regionSelect.innerHTML = '<option value="">Seleccione una región</option>' +
            regiones.map(r => `<option value="${r.id}">${r.nombre}</option>`).join('');

        // Intentar preseleccionar región y comuna si se está editando
        if (usuario) {
            const direccion = (usuario.direccion || '').trim();
            // Si el backend enviara campos separados, usarlos primero
            let preferRegion = (usuario.region || '').trim();
            let preferComuna = (usuario.comuna || '').trim();
            if (!preferRegion || !preferComuna) {
                const partes = direccion.split(',').map(p => p.trim()).filter(Boolean);
                // Heurística: último elemento = región, penúltimo = comuna
                if (!preferRegion && partes.length >= 1) {
                    preferRegion = partes[partes.length - 1];
                }
                if (!preferComuna && partes.length >= 2) {
                    preferComuna = partes[partes.length - 2];
                }
            }

            // Buscar opción de región por texto (case-insensitive)
            if (preferRegion) {
                const optRegion = Array.from(regionSelect.options).find(o => (o.textContent || '').trim().toLowerCase() === preferRegion.toLowerCase());
                if (optRegion) {
                    regionSelect.value = optRegion.value;
                    // Cargar comunas y luego preseleccionar la comuna preferida
                    await cargarComunasUsuario(optRegion.value, comunaSelect, preferComuna || null);
                }
            }
        }

        // Al cambiar región, cargar comunas
        regionSelect.addEventListener('change', async (e) => {
            const regionId = e.target.value;
            await cargarComunasUsuario(regionId, comunaSelect);
        });
    } catch (error) {
        console.error('Error cargando regiones/comunas (usuarios):', error);
        mostrarNotificacion('No se pudieron cargar regiones y comunas', 'warning');
    }
}

/**
 * Cargar comunas para una región dada en el formulario de usuario
 */
async function cargarComunasUsuario(regionId, comunaSelect, comunaNombrePreselect = null) {
    try {
        if (!comunaSelect) return;
        comunaSelect.innerHTML = '<option value="">Seleccione una comuna</option>';
        if (!regionId) return;
        // Mostrar estado de carga
        comunaSelect.innerHTML = '<option value="">Cargando comunas...</option>';
        const comunasResp = await fetchAPI(`/geografia/regiones/${regionId}/comunas`);
        const comunas = comunasResp.comunas || comunasResp || [];
        comunaSelect.innerHTML = '<option value="">Seleccione una comuna</option>' +
            comunas.map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('');

        // Preselección de comuna si se proporcionó
        if (comunaNombrePreselect) {
            const optComuna = Array.from(comunaSelect.options).find(o => (o.textContent || '').trim().toLowerCase() === comunaNombrePreselect.toLowerCase());
            if (optComuna) {
                comunaSelect.value = optComuna.value;
            }
        }
    } catch (error) {
        console.error('Error cargando comunas (usuarios):', error);
        mostrarNotificacion('No se pudieron cargar comunas de la región seleccionada', 'warning');
        comunaSelect.innerHTML = '<option value="">No disponibles</option>';
    }
}
