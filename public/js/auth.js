/**
 * Módulo de autenticación y gestión de usuarios
 * Maneja el login, registro y redirección según el rol del usuario
 */

// Usuarios de prueba para demostración
const usuariosPrueba = [
    {
        id: 1,
        nombre: 'Admin',
        apellido: 'Sistema',
        email: 'admin@municipalidad.cl',
        password: 'admin123',
        role: 'admin',
        estado: 'activo'
    },
    {
        id: 2,
        nombre: 'Juan',
        apellido: 'Pérez',
        email: 'funcionario@municipalidad.cl',
        password: 'func123',
        role: 'funcionario',
        estado: 'activo'
    },
    {
        id: 3,
        nombre: 'María',
        apellido: 'González',
        email: 'ciudadano@ejemplo.com',
        password: 'ciud123',
        role: 'ciudadano',
        estado: 'activo'
    }
];

// Inicializar el módulo de autenticación
document.addEventListener('DOMContentLoaded', () => {
    try {
        const params = new URLSearchParams(window.location.search || '');
        const resetToken = params.get('resetToken');
        if (resetToken) {
            mostrarFormularioResetConToken(resetToken);
            return;
        }
    } catch (_) {}
    try { const t = (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('token') : null) || localStorage.getItem('token'); if (!t) { clearCorexCookies(); } } catch (_) { try { clearCorexCookies(); } catch (_) {} }
    programarMostrarLogin(0);
    
    // Configurar el evento de submit del formulario de login
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', manejarLogin);
    }
    const toggleBtn = document.getElementById('toggle-password');
    const passwordInput = document.getElementById('password');
    if (toggleBtn && passwordInput) {
        toggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const show = passwordInput.type === 'password';
            passwordInput.type = show ? 'text' : 'password';
            toggleBtn.innerHTML = show ? '<i class="bi bi-eye"></i>' : '<i class="bi bi-eye-slash"></i>';
        });
    }
    
    // Configurar el evento de submit del formulario de registro
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', manejarRegistro);
    }
    (async () => {
        try {
            const t = (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('token') : null) || localStorage.getItem('token');
            if (!t) return;
            const usrStr = (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('usuario') : null) || localStorage.getItem('usuario');
            if (usrStr) {
                const u = JSON.parse(usrStr);
                if (u && u.role) {
                    redirigirSegunRol(u);
                    return;
                }
            }
            const perfil = await fetchAPI('/usuarios/perfil', { suppressErrorLog: true });
            if (perfil && perfil.id) {
              const rol = (perfil.rol || perfil.role || perfil.rol_nombre || '').toString().toLowerCase();
              const roleFinal = rol === 'administrador' ? 'admin' : rol;
              const u = {
                id: perfil.id,
                nombre: perfil.nombre || '',
                apellido: perfil.apellido || '',
                email: perfil.email,
                role: roleFinal,
                ultimo_login: perfil.ultimo_login || null,
                municipalidad_id: perfil.municipalidad_id || (perfil.Municipalidad && perfil.Municipalidad.id) || null,
                municipalidad_nombre: perfil.municipalidad_nombre || (perfil.Municipalidad && perfil.Municipalidad.nombre) || null
              };
              if (typeof sessionStorage !== 'undefined') { sessionStorage.setItem('usuario', JSON.stringify(u)); }
              redirigirSegunRol(u);
            }
        } catch (_) {}
    })();
});

    // Asegurar evento del botón Cerrar sesión en la barra blanca
    const btnLogoutNavStatic = document.getElementById('btn-logout-nav');
    if (btnLogoutNavStatic) {
        btnLogoutNavStatic.addEventListener('click', confirmarCerrarSesion);
    }
    document.addEventListener('click', (e) => {
        const btn = e.target && e.target.closest && e.target.closest('#btn-logout-nav');
        if (btn) {
            e.preventDefault();
            confirmarCerrarSesion();
        }
    });

    // Delegación para el ojito de contraseña en caso de re-render
    document.addEventListener('click', (e) => {
        const toggle = e.target && e.target.closest && e.target.closest('#toggle-password');
        if (toggle) {
            e.preventDefault();
            const input = document.getElementById('password');
            if (!input) return;
            const toShow = input.type === 'password';
            input.type = toShow ? 'text' : 'password';
            const icon = toggle.querySelector('i');
            if (icon) {
                icon.classList.toggle('bi-eye', toShow);
                icon.classList.toggle('bi-eye-slash', !toShow);
            }
        }
    });

    document.addEventListener('submit', (e) => {
        const form = e.target && e.target.closest && e.target.closest('#login-form');
        if (form) {
            e.preventDefault();
            manejarLogin(e);
        }
    }, true);

    // Normalización y validación en tiempo real para campo RUT del registro
    const rutInput = document.getElementById('rut');
    if (rutInput) {
        // Limpiar formato mientras escribe: solo dígitos y K/k
        rutInput.addEventListener('input', (e) => {
            const raw = (e.target.value || '').replace(/\./g, '');
            // Permitir solo dígitos y K/k, remover guiones intermedios
            const limpio = raw.replace(/[^0-9kK]/g, '');
            // No formateamos aún para no interferir con la escritura del DV
            e.target.value = limpio.slice(0, 9); // 8 dígitos + 1 DV máx
            // Quitar estado inválido si está corrigiendo
            limpiarCampoInvalido(e.target);
        });
        // Al salir del campo: normalizar a 8 dígitos + guión + DV y validar
        rutInput.addEventListener('blur', (e) => {
            const normalizado = normalizarRUT(e.target.value || '');
            e.target.value = normalizado;
            if (normalizado && !validarRUT(normalizado)) {
                marcarCampoInvalido(e.target, 'RUT inválido. Formato 12345678-9 y DV correcto');
            } else {
                limpiarCampoInvalido(e.target);
            }
        });
    }
    
    // Configurar eventos para mostrar/ocultar formularios
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');
    const registerLink = document.getElementById('register-link');
    const backToLoginLink = document.getElementById('back-to-login');
    
    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', (e) => {
            e.preventDefault();
            mostrarFormularioRegistro();
        });
    }
    
    if (showLoginLink) {
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            mostrarFormularioLogin();
        });
    }

    // Event listener para el enlace "Registrarse al Portal Ciudadano"
    if (registerLink) {
        registerLink.addEventListener('click', (e) => {
            e.preventDefault();
            mostrarFormularioRegistro();
        });
    }

    // Event listener para el enlace "Volver al Login"
    if (backToLoginLink) {
        backToLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            mostrarFormularioLogin();
        });
    }
    
    // Configurar el evento de click del enlace de olvidar contraseña
    const forgotPasswordLink = document.getElementById('forgot-password-link');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            mostrarFormularioRecuperarPassword();
        });
    }


function programarMostrarLogin(delay) {
    try { if (window._loginRenderTimeoutId) clearTimeout(window._loginRenderTimeoutId); } catch (_) {}
    window._loginRenderTimeoutId = setTimeout(() => {
        try {
            const t = (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('token') : null) || localStorage.getItem('token');
            if (!t) mostrarFormularioLogin();
        } catch (_) { mostrarFormularioLogin(); }
        window._loginRenderTimeoutId = null;
    }, typeof delay === 'number' ? delay : 600);
}

function cancelarMostrarLogin() {
    try { if (window._loginRenderTimeoutId) { clearTimeout(window._loginRenderTimeoutId); window._loginRenderTimeoutId = null; } } catch (_) {}
}

/**
 * Maneja el evento de submit del formulario de login
 * @param {Event} e - Evento de submit
 */
async function manejarLogin(e) {
    e.preventDefault();
    
    // Obtener los valores del formulario
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const loginError = document.getElementById('login-error');
    const passwordInput = document.getElementById('password');
    const passwordError = document.getElementById('password-error');

    // Limpiar estados de error previos
    if (loginError) {
        loginError.classList.add('d-none');
        loginError.textContent = '';
    }
    if (passwordInput) {
        passwordInput.classList.remove('is-invalid');
    }
    if (passwordError) {
        passwordError.classList.add('d-none');
        passwordError.textContent = '';
    }
    
    // Mostrar indicador de carga
    mostrarCargando(true);
    
    try {
        // Intentar primero login como usuario del sistema (/api/auth/login)
        let response = null;
        let errAuth = null;
        let errCiudadano = null;

        try {
            response = await fetchAPI('/auth/login', {
                method: 'POST',
                body: { email, password },
                suppressErrorLog: true
            });
        } catch (e1) {
            errAuth = e1;
        }

        // Si el primer intento falla, intentar login de ciudadano
        if (!response) {
            try {
                response = await fetchAPI('/ciudadanos/login', {
                method: 'POST',
                body: { email, password },
                suppressErrorLog: true
            });
            } catch (e2) {
                errCiudadano = e2;
            }
        }

        // Si no hubo respuesta válida, decidir qué error mostrar
        if (!response) {
            const isUnauthorized = (err) => !!err && (err.status === 401 || (err.message && err.message.toLowerCase().includes('unauthorized')));
            const auth401 = isUnauthorized(errAuth);
            const ciudadano401 = isUnauthorized(errCiudadano);

            if (auth401 || ciudadano401) {
                // Contraseña incorrecta: marcar el campo y mostrar error específico
                if (passwordInput) {
                    passwordInput.classList.add('is-invalid');
                }
                if (passwordError) {
                    passwordError.textContent = 'Contraseña incorrecta';
                    passwordError.classList.remove('d-none');
                }
                // Mostrar alerta de error clara
                if (loginError) {
                    loginError.textContent = 'Contraseña incorrecta';
                    loginError.classList.remove('d-none');
                }
                return; // No mostrar alerta genérica
            }

            // Error genérico de login
            if (loginError) {
                const msg = (errAuth && errAuth.message) || (errCiudadano && errCiudadano.message) || 'Error al iniciar sesión. Verifica tus credenciales.';
                loginError.textContent = msg;
                loginError.classList.remove('d-none');
            }
            return;
        }

        // Validar respuesta: /auth/login no incluye "success", /ciudadanos/login sí
        const token = response.token;
        if (!token) {
            throw new Error(response.message || 'Error en el inicio de sesión');
        }

        // Normalizar datos de usuario para ambos tipos de respuesta
        const user = response.user || response.data || {};
        const normalizarRol = (r) => {
            const s = (r || '').toString().toLowerCase();
            if (s.includes('admin')) return 'admin';
            if (s.includes('func')) return 'funcionario';
            if (s.includes('ciud') || s === 'user' || s === 'usuario') return 'ciudadano';
            return s || 'ciudadano';
        };
        const rolNombreBackend = (user.rol_nombre || '').toString().toLowerCase();
        const roleFromBackend = rolNombreBackend
            ? (rolNombreBackend === 'administrador' ? 'admin' : rolNombreBackend)
            : normalizarRol(user.role);
        const portal = (response.portal || '').toString().toLowerCase();
        const roleFinal = portal === 'superadmin' ? 'superadministrador'
            : portal === 'admin' ? 'admin'
            : portal === 'ciudadano' ? 'ciudadano'
            : roleFromBackend;
        const usuarioInfo = {
            id: user.id,
            nombre: user.nombre || user.primer_nombre || '',
            apellido: user.apellido || user.apellido_paterno || '',
            email: user.email,
            role: roleFinal,
            nombre_completo: user.nombre_completo || `${user.nombre || user.primer_nombre || ''} ${user.apellido || user.apellido_paterno || ''}`.trim(),
            municipalidad_id: user.municipalidad_id || null,
            municipalidad_nombre: user.municipalidad_nombre || null
        };

        try { clearCorexCookies(); } catch (_) {}
        setSessionToken(token, { role: roleFinal, userId: user.id });
        try { if (typeof sessionStorage !== 'undefined') { sessionStorage.setItem('usuario', JSON.stringify(usuarioInfo)); } else { localStorage.setItem('usuario', JSON.stringify(usuarioInfo)); } } catch (_) {}

        // Redirigir según el rol del usuario
        redirigirSegunRol(usuarioInfo);
        
    } catch (error) {
        if (loginError) {
            loginError.textContent = error.message || 'Error al iniciar sesión. Verifica tus credenciales.';
            loginError.classList.remove('d-none');
        }
    } finally {
        // Ocultar indicador de carga
        mostrarCargando(false);
    }
}

// Limpiar error de contraseña al escribir
document.addEventListener('input', (e) => {
    if (e.target && e.target.id === 'password') {
        const passwordInput = document.getElementById('password');
        const passwordError = document.getElementById('password-error');
        if (passwordInput) {
            passwordInput.classList.remove('is-invalid');
        }
        if (passwordError) {
            passwordError.classList.add('d-none');
            passwordError.textContent = '';
        }
    }
});

/**
 * Redirige al usuario a la sección correspondiente según su rol
 * @param {Object} usuario - Información del usuario
 */
async function redirigirSegunRol(usuario) {
    cancelarMostrarLogin();
    limpiarFondoLogin();
    // Ocultar el formulario de login
    const loginContainer = document.getElementById('login-container');
    if (loginContainer) {
        loginContainer.classList.add('d-none');
    }
    
    // Mostrar elementos comunes de la interfaz
    const header = document.querySelector('.header');
    const footer = document.querySelector('footer');
    
    if (header) header.classList.add('d-none');
    if (footer) footer.classList.remove('d-none');
    
    try {
        const esAdmin = String(usuario?.role || '').toLowerCase() === 'admin';
        const faltaMuni = esAdmin && (!usuario.municipalidad_nombre || !usuario.municipalidad_id);
        const faltaUltimoLogin = !usuario.ultimo_login;
        if (faltaMuni || faltaUltimoLogin) {
            const perfil = await fetchAPI('/usuarios/perfil');
            if (perfil && perfil.id) {
                usuario.municipalidad_id = perfil.municipalidad_id || (perfil.Municipalidad && perfil.Municipalidad.id) || usuario.municipalidad_id || null;
                usuario.municipalidad_nombre = perfil.municipalidad_nombre || (perfil.Municipalidad && perfil.Municipalidad.nombre) || usuario.municipalidad_nombre || '';
                usuario.ultimo_login = perfil.ultimo_login || usuario.ultimo_login || null;
                try { localStorage.setItem('usuario', JSON.stringify(usuario)); } catch (_) {}
            }
        }
        try {
            const perfilFoto = await fetchAPI('/usuarios/perfil-usuario', { suppressErrorLog: true });
            if (perfilFoto && perfilFoto.foto_url) {
                usuario.foto_url = perfilFoto.foto_url;
                try { localStorage.setItem('usuario', JSON.stringify(usuario)); } catch (_) {}
                try { sessionStorage.setItem('usuario', JSON.stringify(usuario)); } catch (_) {}
            }
        } catch (_) {}
    } catch (_) {}

    const userInfo = document.getElementById('user-info');
    if (userInfo) { userInfo.innerHTML = ''; }
    const navActions = document.querySelector('#main-navbar .nav-actions');
    if (navActions) {
        const existing = document.getElementById('user-profile-block');
        if (existing) existing.remove();
        const perfilHTML = `
            <div class="user-profile" id="user-profile-block" title="Ver perfil">
                ${usuario.foto_url ? `
                <div class="user-avatar" id="user-avatar">
                    <img src="${usuario.foto_url}" alt="Foto de perfil">
                </div>` : `
                <div class="user-avatar" id="user-avatar">
                    <i class="bi bi-person-circle"></i>
                </div>`}
            </div>
        `;
        navActions.insertAdjacentHTML('afterbegin', perfilHTML);
        const avatarEl = document.getElementById('user-avatar');
        if (avatarEl) {
            avatarEl.style.cursor = 'pointer';
            avatarEl.addEventListener('click', async () => {
                try {
                    const perfil = await fetchAPI('/usuarios/perfil-usuario');
                    const modalEl = document.getElementById('perfilUsuarioModal');
                    const modal = new bootstrap.Modal(modalEl);
                    const nombreEl = document.getElementById('perfil-modal-nombre');
                    const rolEl = document.getElementById('perfil-modal-rol');
                    const emailEl = document.getElementById('perfil-modal-email');
                    const avatarModal = document.getElementById('perfil-modal-avatar');
                    const ultimoEl = document.getElementById('perfil-modal-ultimo');
                    if (nombreEl) nombreEl.textContent = `${perfil.nombre || ''} ${perfil.apellido || ''}`.trim();
                    if (rolEl) rolEl.textContent = obtenerNombreRol(perfil.role || usuario.role);
                    if (emailEl) emailEl.textContent = perfil.email || usuario.email;
                    if (avatarModal) {
                        avatarModal.innerHTML = perfil.foto_url ? `<img src="${perfil.foto_url}" style="width:100%;height:100%;object-fit:cover;">` : '<i class="bi bi-person-circle" style="font-size:2rem;"></i>';
                    }
                    if (ultimoEl) {
                        const fecha = perfil.ultimo_login || usuario.ultimo_login || null;
                        const texto = fecha ? ((typeof formatearFecha === 'function') ? formatearFecha(fecha) : new Date(fecha).toLocaleString('es-ES')) : '';
                        ultimoEl.textContent = texto || '';
                    }
                    const fileInput = document.getElementById('perfil-modal-file');
                    const selectBtn = document.getElementById('perfil-modal-select');
                    const guardarBtn = document.getElementById('perfil-modal-guardar');
                    if (fileInput) fileInput.value = '';
                    if (selectBtn && fileInput) {
                        selectBtn.onclick = () => fileInput.click();
                    }
                    if (fileInput && avatarModal) {
                        fileInput.onchange = () => {
                            const f = fileInput.files && fileInput.files[0];
                            if (!f) return;
                            const previewUrl = URL.createObjectURL(f);
                            avatarModal.innerHTML = `<img src="${previewUrl}" style="width:100%;height:100%;object-fit:cover;">`;
                        };
                    }
                    if (fileInput && guardarBtn) {
                        guardarBtn.onclick = async () => {
                            const f = fileInput.files && fileInput.files[0];
                            if (!f) { modal.hide(); return; }
                            const fd = new FormData();
                            fd.append('foto', f);
                            const data = await fetchAPI('/usuarios/perfil-usuario/foto', { method: 'POST', body: fd });
                            const newUrl = data.foto_url;
                            const avatar = document.getElementById('user-avatar');
                            if (avatar) {
                                avatar.innerHTML = `<img src="${newUrl}" alt="Foto de perfil">`;
                            }
                            if (avatarModal) {
                                avatarModal.innerHTML = `<img src="${newUrl}" style="width:100%;height:100%;object-fit:cover;">`;
                            }
                            try {
                                const usuarioLS = JSON.parse(localStorage.getItem('usuario') || '{}');
                                usuarioLS.foto_url = newUrl;
                                localStorage.setItem('usuario', JSON.stringify(usuarioLS));
                            } catch (_) {}
                            try {
                                const usuarioSS = JSON.parse(sessionStorage.getItem('usuario') || '{}');
                                usuarioSS.foto_url = newUrl;
                                sessionStorage.setItem('usuario', JSON.stringify(usuarioSS));
                            } catch (_) {}
                            modal.hide();
                        };
                    }
                    modal.show();
                } catch (e) {}
            });
        }
    }
    
    // Redirigir según el rol
    switch (usuario.role) {
        case 'superadministrador':
            cargarInterfazSuperadmin(usuario);
            break;
        case 'admin':
            cargarInterfazAdmin(usuario);
            break;
        case 'funcionario':
            cargarInterfazFuncionario(usuario);
            break;
        case 'ciudadano':
            cargarPortalCiudadano(usuario);
            break;
        default:
            console.error('Rol no reconocido:', usuario.role, '— mostrando interfaz de administrador por defecto');
            cargarInterfazAdmin(usuario);
    }
}

async function cargarInterfazSuperadmin(usuario) {
    try {
        const navbar = document.getElementById('main-navbar');
        if (navbar) navbar.classList.remove('d-none');
        try { generarMenu('superadmin'); } catch (_) {}
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.classList.remove('d-none');
            mainContent.innerHTML = `
              <div class="container py-4">
                <div class="row mb-3 align-items-center">
                  <div class="col-4">
                    <div class="d-flex align-items-center gap-2">
                      <i class="bi bi-hand-thumbs-up"></i>
                      <span>Bienvenido ${(usuario.nombre + ' ' + usuario.apellido).toLowerCase()}</span>
                    </div>
                  </div>
                  <div class="col-4 text-center">
                    <h2 class="section-title">Panel de Superadministrador</h2>
                  </div>
                  <div class="col-4"></div>
                </div>
                <div class="row">
                  <div class="col-md-6 mb-4">
                    <div class="card shadow-sm">
                      <div class="card-body text-center">
                        <i class="bi bi-building fs-1 text-primary mb-3"></i>
                        <h5 class="card-title">Gestionar Municipalidades</h5>
                        <p class="card-text">Crear, editar y ver municipalidades.</p>
                        <a href="#" class="btn btn-primary" id="btn-gestion-municipalidades">Acceder</a>
                      </div>
                    </div>
                  </div>
                  <div class="col-md-6 mb-4">
                    <div class="card shadow-sm">
                      <div class="card-body text-center">
                        <i class="bi bi-people fs-1 text-success mb-3"></i>
                        <h5 class="card-title">Crear Nuevos Usuarios</h5>
                        <p class="card-text">Crear usuarios y asignarlos.</p>
                        <a href="#" class="btn btn-success" id="btn-crear-administradores">Acceder</a>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="row">
                  <div class="col-md-6 offset-md-3 mb-4">
                    <div class="card shadow-sm">
                      <div class="card-body text-center">
                        <i class="bi bi-bar-chart-line fs-1 text-info mb-3"></i>
                        <h5 class="card-title">Supervisión Multi-Municipalidad</h5>
                        <p class="card-text">Ver ranking y métricas de todas las municipalidades.</p>
                        <a href="#" class="btn btn-info" id="btn-supervision-multi">Acceder</a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            `;
            const btnGestionMunicipalidades = document.getElementById('btn-gestion-municipalidades');
            if (btnGestionMunicipalidades) {
                btnGestionMunicipalidades.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (typeof cargarMunicipalidades === 'function') {
                        cargarMunicipalidades();
                    } else if (typeof cargarDepartamentos === 'function') {
                        cargarDepartamentos();
                    }
                });
            }
            const btnCrearAdministradores = document.getElementById('btn-crear-administradores');
            if (btnCrearAdministradores) {
                btnCrearAdministradores.addEventListener('click', (e) => {
                    e.preventDefault();
                    try { localStorage.setItem('currentPage', 'usuarios'); } catch (_) {}
                    const menu = document.getElementById('menu-items');
                    if (menu) {
                        const links = menu.querySelectorAll('.nav-link');
                        links.forEach(l => l.classList.remove('active'));
                        const adminsLink = menu.querySelector('.nav-link[data-page="usuarios"]');
                        if (adminsLink) adminsLink.classList.add('active');
                    }
                    if (typeof mostrarFormularioUsuario === 'function') {
                        mostrarFormularioUsuario();
                    } else if (typeof cargarUsuarios === 'function') {
                        cargarUsuarios();
                    }
                });
            }
            const btnSupervisionMulti = document.getElementById('btn-supervision-multi');
            if (btnSupervisionMulti) {
                btnSupervisionMulti.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (typeof mostrarSupervisionMultiMunicipalidad === 'function') {
                        mostrarSupervisionMultiMunicipalidad();
                    } else {
                        if (typeof cargarDashboard === 'function') cargarDashboard();
                    }
                });
            }
        }
    } catch (_) {}
}

/**
 * Carga la interfaz para administradores
 * @param {Object} usuario - Información del usuario
 */
async function cargarInterfazAdmin(usuario) {
    try {
        console.log('Cargando interfaz de administrador para:', usuario.nombre);
        const navbar = document.getElementById('main-navbar');
        if (navbar) navbar.classList.remove('d-none');
        try { generarMenu('admin'); } catch (e) { console.warn('Error generando menú admin', e); }
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.classList.remove('d-none');
            const lastPage = (typeof localStorage !== 'undefined' && localStorage.getItem('currentPage')) || 'dashboard';
            try {
                if (typeof cargarContenidoPagina === 'function') {
                    cargarContenidoPagina(lastPage);
                } else if (typeof cargarDashboard === 'function') {
                    cargarDashboard();
                }
            } catch (e) {
                console.error('Error al cargar sección inicial:', e);
            }
        }
    } catch (err) {
        console.error('Error en cargarInterfazAdmin:', err);
        try {
            const mc = document.getElementById('main-content');
            if (mc) {
                mc.classList.remove('d-none');
                mc.innerHTML = '<div class="container py-4"><div class="alert alert-warning">No se pudo cargar la interfaz administrativa. Intente actualizar.</div></div>';
            }
        } catch (_) {}
    }
}

/**
 * Carga la interfaz para funcionarios
 * @param {Object} usuario - Información del usuario
 */
function cargarInterfazFuncionario(usuario) {
    console.log('Cargando interfaz de funcionario para:', usuario.nombre);
    
    // Mostrar el menú de navegación
    const navbar = document.getElementById('main-navbar');
    if (navbar) navbar.classList.remove('d-none');
    
    // Generar menú para funcionarios
    generarMenu('funcionario');
    
    // Mostrar el contenido principal
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        mainContent.classList.remove('d-none');
        
        const lastPage = (typeof localStorage !== 'undefined' && localStorage.getItem('currentPage')) || 'dashboard';
        if (typeof cargarContenidoPagina === 'function') {
            cargarContenidoPagina(lastPage);
        } else if (typeof cargarDashboard === 'function') {
            cargarDashboard();
        } else {
            mainContent.innerHTML = '<div class="alert alert-info">Sección inicial no disponible.</div>';
        }
    }
}

/**
 * Carga el portal ciudadano
 * @param {Object} usuario - Información del usuario
 */
async function cargarPortalCiudadano(usuario) {
    // Asegurar usuario cuando no se pasa como argumento (compatibilidad con app.js)
    if (!usuario || !usuario.id) {
        try {
            const localUser = (typeof obtenerUsuario === 'function') ? obtenerUsuario() : null;
            if (localUser && localUser.id) {
                usuario = localUser;
            } else {
                // Intentar obtener el perfil desde la API
                const perfil = await fetchAPI('/usuarios/perfil');
                if (perfil && perfil.id) usuario = perfil;
            }
        } catch (e) {
            console.warn('No se pudo obtener el usuario actual', e);
        }
    }

    console.log('Cargando portal ciudadano para:', usuario?.nombre || usuario?.email || usuario?.id || 'usuario');
    
    // Mostrar el menú principal con estilo Corex y generar menú de ciudadano
    const navbar = document.getElementById('main-navbar');
    if (navbar) navbar.classList.remove('d-none');
    try { localStorage.setItem('currentPage', 'portalCiudadano'); } catch (_) {}
    try { generarMenu('ciudadano'); } catch (_) {}
    
    // Obtener trámites del usuario desde la API
    const tramitesUsuario = await obtenerTramitesUsuarioAPI(usuario.id);
    
    // Ordenar trámites por fecha (más recientes primero)
    tramitesUsuario.sort((a, b) => new Date(b.fecha_solicitud) - new Date(a.fecha_solicitud));
    
    // Tomar los 3 más recientes
    const tramitesRecientes = tramitesUsuario.slice(0, 3);
    
    // Mostrar el contenido principal
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        mainContent.classList.remove('d-none');
        
        // Preparar contenido de trámites recientes
        let contenidoTramitesRecientes = '';
        
        if (tramitesRecientes.length === 0) {
            contenidoTramitesRecientes = `<p>No tienes trámites recientes.</p>`;
        } else {
            contenidoTramitesRecientes = `
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Código</th>
                                <th>Tipo</th>
                                <th>Título</th>
                                <th>Fecha</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tramitesRecientes.map(tramite => `
                                <tr>
                                    <td>${tramite.codigo}</td>
                                    <td class="text-uppercase">${obtenerNombreTipoTramite(tramite.tipo)}</td>
                                    <td>${tramite.titulo}</td>
                                    <td>${formatearFecha(tramite.fecha_solicitud)}</td>
                                    <td>
                                        <span class="badge ${obtenerColorEstadoTramite(tramite.pago_completado ? 'pagado' : tramite.estado)}" data-estado="${tramite.pago_completado ? 'pagado' : tramite.estado}">
                                            ${obtenerNombreEstadoTramite(tramite.pago_completado ? 'pagado' : tramite.estado)}
                                        </span>
                                    </td>
                                    <td>
                                        <button class="btn btn-sm btn-secondary me-2" onclick="descargarConstanciaTramite(${tramite.id})">
                                            <i class="bi bi-download"></i> Descargar boleta
                                        </button>
                                        <button class="btn btn-sm btn-primary ver-detalle-tramite" data-id="${tramite.id}">
                                            <i class="bi bi-eye"></i> Ver
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }
        
        // Cargar portal ciudadano
        mainContent.innerHTML = `
            <div class="container py-4">
                <div class="row mb-3 align-items-center">
                    <div class="col-4">
                        <div class="d-flex align-items-center gap-2">
                            <i class="bi bi-hand-thumbs-up"></i>
                            <span>Bienvenido/a ${usuario.nombre} ${usuario.apellido}</span>
                        </div>
                    </div>
                    <div class="col-4 text-center">
                        <h2 class="section-title">Portal Ciudadano</h2>
                    </div>
                    <div class="col-4"></div>
                </div>
                <div class="row">
                    <div class="col-md-4 mb-4">
                        <div class="card shadow-sm h-100">
                            <div class="card-body d-flex flex-column align-items-center text-center">
                                <i class="bi bi-file-earmark-text fs-1 text-primary mb-3"></i>
                                <h5 class="card-title">Mis Trámites</h5>
                                <p class="card-text">Consulta y realiza seguimiento de tus trámites municipales.</p>
                                <a href="#" class="btn btn-primary mt-auto" id="btn-mis-tramites">Ver Mis Trámites</a>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4 mb-4">
                        <div class="card shadow-sm h-100">
                            <div class="card-body d-flex flex-column align-items-center text-center">
                                <i class="bi bi-plus-circle fs-1 text-success mb-3"></i>
                                <h5 class="card-title">Nuevo Trámite</h5>
                                <p class="card-text">Inicia un nuevo trámite municipal desde aquí.</p>
                                <a href="#" class="btn btn-success mt-auto" id="btn-nuevo-tramite">Iniciar Trámite</a>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4 mb-4">
                        <div class="card shadow-sm h-100">
                            <div class="card-body d-flex flex-column align-items-center text-center">
                                <i class="bi bi-cash-coin fs-1 text-warning mb-3"></i>
                                <h5 class="card-title">Mis Pagos</h5>
                                <p class="card-text">Consulta y realiza pagos de tus trámites.</p>
                                <a href="#" class="btn btn-warning text-white mt-auto" id="btn-mis-pagos">Ver Mis Pagos</a>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="row mt-4">
                    <div class="col-12">
                        <div class="card shadow-sm">
                            <div class="card-header d-flex justify-content-between align-items-center">
                                <h5 class="mb-0">Trámites Recientes</h5>
                                ${tramitesRecientes.length > 0 ? `
                                    <a href="#" class="btn btn-sm btn-outline-primary" id="btn-ver-todos-tramites">
                                        Ver todos
                                    </a>
                                ` : ''}
                            </div>
                            <div class="card-body">
                                ${contenidoTramitesRecientes}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Agregar eventos a los botones
        const btnMisTramites = document.getElementById('btn-mis-tramites');
        const btnNuevoTramite = document.getElementById('btn-nuevo-tramite');
        const btnMisPagos = document.getElementById('btn-mis-pagos');
        const btnVerTodosTramites = document.getElementById('btn-ver-todos-tramites');
        const botonesVerDetalle = document.querySelectorAll('.ver-detalle-tramite');
        const btnLogoutPortal = document.getElementById('btn-logout-portal');
        
        if (btnMisTramites) {
            btnMisTramites.addEventListener('click', (e) => {
                e.preventDefault();
                cargarMisTramites(usuario);
            });
        }
        
        if (btnNuevoTramite) {
            btnNuevoTramite.addEventListener('click', (e) => {
                e.preventDefault();
                cargarFormularioNuevoTramite(usuario);
            });
        }
        
        if (btnMisPagos) {
            btnMisPagos.addEventListener('click', (e) => {
                e.preventDefault();
                cargarMisPagos(usuario);
            });
        }
        
        if (btnVerTodosTramites) {
            btnVerTodosTramites.addEventListener('click', (e) => {
                e.preventDefault();
                cargarMisTramites(usuario);
            });
        }

        if (botonesVerDetalle && botonesVerDetalle.length > 0) {
            botonesVerDetalle.forEach(boton => {
                boton.addEventListener('click', (e) => {
                    e.preventDefault();
                    const tramiteId = e.currentTarget.getAttribute('data-id');
                    // Abrir modal con diseño y detalle del trámite
                    mostrarDetalleTramiteModal(parseInt(tramiteId));
                });
            });
        }

        if (btnLogoutPortal) {
            btnLogoutPortal.addEventListener('click', (e) => {
                e.preventDefault();
                cerrarSesion();
            });
        }
        

        // Refresco automático de “Trámites Recientes” al crear un nuevo trámite
        if (window.__onTramiteCreadoPortal) {
            window.removeEventListener('tramite:creado', window.__onTramiteCreadoPortal);
        }
        window.__onTramiteCreadoPortal = () => {
            cargarPortalCiudadano(usuario);
        };
        window.addEventListener('tramite:creado', window.__onTramiteCreadoPortal);
    }
}

/**
 * Muestra el formulario de login
 */
function mostrarFormularioLogin() {
    try { clearCorexCookies(); } catch (_) {}
    // Mostrar el contenedor de login
    const loginContainer = document.getElementById('login-container');
    const registerContainer = document.getElementById('register-container');
    
    if (loginContainer) {
        loginContainer.classList.remove('d-none');
    }
    
    if (registerContainer) {
        registerContainer.classList.add('d-none');
    }
    
    // Ocultar elementos de la interfaz
    const header = document.querySelector('.header');
    const navbar = document.getElementById('main-navbar');
    const mainContent = document.getElementById('main-content');
    
    if (header) header.classList.add('d-none');
    if (navbar) navbar.classList.add('d-none');
    if (mainContent) mainContent.classList.add('d-none');
    try {
        const c1 = document.getElementById('login-chart-tramites');
        const c2 = document.getElementById('login-chart-pagos');
        const c3 = document.getElementById('login-chart-usuarios');
        const c4 = document.getElementById('login-chart-departamentos');
        if (window.Chart && (c1 || c2 || c3 || c4)) {
            const mkDonut = (el, vals, colors) => {
                const ctx = el.getContext('2d');
                return new Chart(ctx, { type: 'doughnut', data: { labels: vals.map((_, i) => 'v' + i), datasets: [{ data: vals, backgroundColor: colors }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { display: false } } } });
            };
            const mkBar = (el, labels, vals, color) => {
                const ctx = el.getContext('2d');
                return new Chart(ctx, { type: 'bar', data: { labels, datasets: [{ data: vals, backgroundColor: color }] }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } } });
            };
            if (c1) mkDonut(c1, [3, 5, 2], ['#1E3A8A', '#FF9800', '#2E7D32']);
            if (c2) mkDonut(c2, [4, 3, 1], ['#2E7D32', '#FF9800', '#e74c3c']);
            if (c3) mkBar(c3, ['Activos', 'Inactivos'], [18, 6], 'rgba(78,115,223,0.8)');
            if (c4) mkBar(c4, ['Activos', 'Inactivos'], [7, 2], 'rgba(30,64,175,0.8)');
        }
        const pickExisting = async (base) => {
            const exts = ['webp','jpg','png'];
            for (let i = 0; i < exts.length; i++) {
                const url = `/imagenes/${base}.${exts[i]}`;
                try {
                    await new Promise((resolve, reject) => { const img = new Image(); img.onload = resolve; img.onerror = reject; img.src = url; });
                    return url;
                } catch (_) {}
            }
            return null;
        };
        const urls = ['/images/muni1.jpg','/images/muni2.jpg','/images/muni3.jpg','/images/muni4.jpg','/images/muni5.jpg'];
        const bg1 = document.getElementById('login-bg');
        const bg2 = document.getElementById('login-bg2');
        if (bg1 && bg2) {
            let idx = 0;
            let cur = bg1, next = bg2;
            const apply = (el, url) => { el.style.backgroundImage = `url('${url}')`; };
            apply(cur, urls[idx]);
            cur.classList.add('active');
            next.classList.remove('active');
            if (window.__loginBgInterval) { try { clearInterval(window.__loginBgInterval); } catch (_) {} }
            window.__loginBgInterval = setInterval(() => {
                idx = (idx + 1) % urls.length;
                apply(next, urls[idx]);
                next.classList.add('active');
                cur.classList.remove('active');
                const tmp = cur; cur = next; next = tmp;
            }, 8000);
        } else {
            const bgUrl = urls[0];
            document.body.style.backgroundImage = `url('${bgUrl}')`;
            document.body.style.backgroundRepeat = 'no-repeat';
            document.body.style.backgroundPosition = 'center center';
            document.body.style.backgroundSize = 'cover';
        }
    } catch (_) {}
    const toggleBtn = document.getElementById('toggle-password');
    const passwordInput = document.getElementById('password');
    if (toggleBtn && passwordInput) {
        toggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const show = passwordInput.type === 'password';
            passwordInput.type = show ? 'text' : 'password';
            toggleBtn.innerHTML = show ? '<i class="bi bi-eye"></i>' : '<i class="bi bi-eye-slash"></i>';
        });
    }
}

/**
 * Muestra el formulario de recuperación de contraseña
 */
function mostrarFormularioRecuperarPassword() {
    const loginContainer = document.getElementById('login-container');
    if (loginContainer) {
        // Guardar el HTML original del formulario de login para restaurarlo luego
        if (!loginContainer.dataset.originalHtml) {
            loginContainer.dataset.originalHtml = loginContainer.innerHTML;
        }

        loginContainer.innerHTML = `
            <div class="row justify-content-center">
                <div class="col-md-6 col-lg-5">
                    <div class="card shadow">
                        <div class="card-header bg-primary text-white text-center py-3">
                            <h3 class="mb-0"><i class="bi bi-building me-2"></i>Sistema ERP Municipal</h3>
                            <p class="mb-0">Gestión Municipal Inteligente</p>
                        </div>
                        <div class="card-body p-4">
                            <h4 class="text-center mb-4">Recuperar Contraseña</h4>
                            <form id="smtp-reset-form">
                                <div class="mb-3">
                                    <label for="smtp-recovery-email" class="form-label">Introduzca el correo electrónico</label>
                                    <div class="input-group">
                                        <span class="input-group-text"><i class="bi bi-envelope"></i></span>
                                        <input type="email" class="form-control" id="smtp-recovery-email" name="email" required>
                                    </div>
                                </div>
                                <div class="d-grid gap-2 mt-2">
                                    <button type="submit" id="btn-smtp-reset" class="btn btn-primary">Enviar enlace</button>
                                </div>
                                <div id="smtp-message" class="alert mt-3 d-none"></div>
                            </form>
                        </div>
                        <div class="card-footer text-center py-3">
                            <div class="small">
                                <a href="#" id="back-to-login-recovery">Volver al inicio de sesión</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Configurar eventos
        const backToLogin = document.getElementById('back-to-login-recovery');
        const smtpForm = document.getElementById('smtp-reset-form');
        const smtpMessage = document.getElementById('smtp-message');
        
        if (smtpForm) {
            smtpForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('smtp-recovery-email').value;
                if (!email) {
                    if (smtpMessage) {
                        smtpMessage.textContent = 'Debe ingresar su correo electrónico.';
                        smtpMessage.className = 'alert alert-warning mt-3';
                        smtpMessage.classList.remove('d-none');
                    }
                    return;
                }
                mostrarCargando(true);
                try {
                    let resp;
                    try {
                        resp = await fetchAPI('/auth/request-reset', { method: 'POST', body: { email }, suppressErrorLog: true });
                    } catch (_) {}
                    if (!resp) {
                        try {
                            resp = await fetchAPI('/ciudadanos/request-reset', { method: 'POST', body: { email }, suppressErrorLog: true });
                        } catch (_) {}
                    }
                    if (smtpMessage) {
                        smtpMessage.textContent = 'Correo enviado exitosamente';
                        smtpMessage.className = 'alert alert-success mt-3';
                        smtpMessage.classList.remove('d-none');
                    }
                } catch (error) {
                    if (smtpMessage) {
                        smtpMessage.textContent = 'No se pudo enviar el correo.';
                        smtpMessage.className = 'alert alert-danger mt-3';
                        smtpMessage.classList.remove('d-none');
                    }
                } finally {
                    mostrarCargando(false);
                }
            });
        }

        // Sin formulario de token: solo envío de correo
        
        if (backToLogin) {
            backToLogin.addEventListener('click', (e) => {
                e.preventDefault();
                // Restaurar el formulario de login original sin recargar la página
                const original = loginContainer.dataset.originalHtml;
                if (original) {
                    loginContainer.innerHTML = original;
                    mostrarFormularioLogin();

                    // Reatachar eventos claves del login/registro
                    const loginForm2 = document.getElementById('login-form');
                    if (loginForm2) loginForm2.addEventListener('submit', manejarLogin);

                    const forgotPasswordLink2 = document.getElementById('forgot-password-link');
                    if (forgotPasswordLink2) {
                        forgotPasswordLink2.addEventListener('click', (ev) => {
                            ev.preventDefault();
                            mostrarFormularioRecuperarPassword();
                        });
                    }

                    const registerForm2 = document.getElementById('register-form');
                    if (registerForm2) registerForm2.addEventListener('submit', manejarRegistro);

                    const rutInput2 = document.getElementById('rut');
                    if (rutInput2) {
                        rutInput2.addEventListener('input', (ev) => {
                            const raw = (ev.target.value || '').replace(/\./g, '');
                            const limpio = raw.replace(/[^0-9kK]/g, '');
                            ev.target.value = limpio.slice(0, 9);
                            limpiarCampoInvalido(ev.target);
                        });
                        rutInput2.addEventListener('blur', (ev) => {
                            const normalizado = normalizarRUT(ev.target.value || '');
                            ev.target.value = normalizado;
                            if (normalizado && !validarRUT(normalizado)) {
                                marcarCampoInvalido(ev.target, 'RUT inválido. Formato 12345678-9 y DV correcto');
                            } else {
                                limpiarCampoInvalido(ev.target);
                            }
                        });
                    }

                    const showRegisterLink2 = document.getElementById('show-register');
                    if (showRegisterLink2) {
                        showRegisterLink2.addEventListener('click', (ev) => {
                            ev.preventDefault();
                            mostrarFormularioRegistro();
                        });
                    }
                    const showLoginLink2 = document.getElementById('show-login');
                    if (showLoginLink2) {
                        showLoginLink2.addEventListener('click', (ev) => {
                            ev.preventDefault();
                            mostrarFormularioLogin();
                        });
                    }
                    const registerLink2 = document.getElementById('register-link');
                    if (registerLink2) {
                        registerLink2.addEventListener('click', (ev) => {
                            ev.preventDefault();
                            mostrarFormularioRegistro();
                        });
                    }
                    const backToLoginLink2 = document.getElementById('back-to-login');
                    if (backToLoginLink2) {
                        backToLoginLink2.addEventListener('click', (ev) => {
                            ev.preventDefault();
                            mostrarFormularioLogin();
                        });
                    }
                } else {
                    // Fallback
                    mostrarFormularioLogin();
                }
            });
        }
    }
}

function mostrarFormularioResetConToken(token) {
    const loginContainer = document.getElementById('login-container');
    if (loginContainer) {
        const header = document.querySelector('.header');
        const navbar = document.getElementById('main-navbar');
        const mainContent = document.getElementById('main-content');
        if (header) header.classList.add('d-none');
        if (navbar) navbar.classList.add('d-none');
        if (mainContent) mainContent.classList.add('d-none');

        try {
            const urls = ['/images/muni1.jpg','/images/muni2.jpg','/images/muni3.jpg','/images/muni4.jpg','/images/muni5.jpg'];
            const bg1 = document.getElementById('login-bg');
            const bg2 = document.getElementById('login-bg2');
            if (bg1 && bg2) {
                let idx = 0;
                let cur = bg1, next = bg2;
                const apply = (el, url) => { el.style.backgroundImage = `url('${url}')`; };
                apply(cur, urls[idx]);
                cur.classList.add('active');
                next.classList.remove('active');
                if (window.__loginBgInterval) { try { clearInterval(window.__loginBgInterval); } catch (_) {} }
                window.__loginBgInterval = setInterval(() => {
                    idx = (idx + 1) % urls.length;
                    apply(next, urls[idx]);
                    next.classList.add('active');
                    cur.classList.remove('active');
                    const tmp = cur; cur = next; next = tmp;
                }, 8000);
            } else {
                const bgUrl = urls[0];
                document.body.style.backgroundImage = `url('${bgUrl}')`;
                document.body.style.backgroundRepeat = 'no-repeat';
                document.body.style.backgroundPosition = 'center center';
                document.body.style.backgroundSize = 'cover';
            }
        } catch (_) {}

        if (!loginContainer.dataset.originalHtml) {
            loginContainer.dataset.originalHtml = loginContainer.innerHTML;
        }
        loginContainer.innerHTML = `
            <div class="row justify-content-center">
                <div class="col-md-6 col-lg-5">
                    <div class="card shadow">
                        <div class="card-header bg-primary text-white text-center py-3">
                            <h3 class="mb-0"><i class="bi bi-building me-2"></i>Sistema ERP Municipal</h3>
                            <p class="mb-0">Gestión Municipal Inteligente</p>
                        </div>
                        <div class="card-body p-4">
                            <h4 class="text-center mb-4">Cambiar Contraseña</h4>
                            <form id="token-reset-form">
                                <div class="mb-3">
                                    <label for="token-new-password" class="form-label">Nueva Contraseña</label>
                                    <div class="input-group">
                                        <span class="input-group-text"><i class="bi bi-key"></i></span>
                                        <input type="password" class="form-control" id="token-new-password" required>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label for="token-confirm-password" class="form-label">Confirmar Contraseña</label>
                                    <div class="input-group">
                                        <span class="input-group-text"><i class="bi bi-shield-lock"></i></span>
                                        <input type="password" class="form-control" id="token-confirm-password" required>
                                    </div>
                                </div>
                        <div class="d-grid gap-2 mt-2">
                            <button type="submit" id="btn-token-reset" class="btn btn-success">Cambiar Contraseña</button>
                        </div>
                        <div id="token-message" class="alert mt-3 d-none"></div>
                        <div id="token-hint" class="alert alert-info mt-2" style="font-size: 0.9rem;">
                            La contraseña debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas, números y un carácter especial.
                        </div>
                            </form>
                        </div>
                        <div class="card-footer text-center py-3">
                            <div class="small">
                                <a href="#" id="back-to-login-from-token">Volver al inicio de sesión</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        const tokenForm = document.getElementById('token-reset-form');
        const tokenMessage = document.getElementById('token-message');
        const backLink = document.getElementById('back-to-login-from-token');
        if (backLink) backLink.addEventListener('click', (e) => { e.preventDefault(); mostrarFormularioLogin(); });
        if (tokenForm) {
            tokenForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const password = document.getElementById('token-new-password').value;
                const confirm = document.getElementById('token-confirm-password').value;
                const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-\[\]{};:'",.<>/?`~|=])[A-Za-z\d!@#$%^&*()_+\-\[\]{};:'",.<>/?`~|=]{8,}$/;
                if (!strongRegex.test(password)) {
                    const hint = document.getElementById('token-hint');
                    if (hint) { hint.className = 'alert alert-warning mt-2'; }
                    return;
                } else {
                    const hint = document.getElementById('token-hint');
                    if (hint) { hint.className = 'alert alert-info mt-2'; }
                }
                if (password !== confirm) {
                    if (tokenMessage) {
                        tokenMessage.textContent = 'Las contraseñas no coinciden.';
                        tokenMessage.className = 'alert alert-danger mt-3';
                        tokenMessage.classList.remove('d-none');
                    }
                    return;
                }
                mostrarCargando(true);
                try {
                    let resp;
                    try { console.log('[RESET][TRY AUTH]', { token: String(token).slice(0,8)+'...', len: password.length }); } catch(_) {}
                    try {
                        resp = await fetchAPI('/auth/reset-password', { method: 'POST', body: { token, newPassword: password, confirmPassword: password }, suppressErrorLog: true });
                    } catch (_) {}
                    if (!resp) {
                        try { console.log('[RESET][TRY CIUDADANO]', { token: String(token).slice(0,8)+'...', len: password.length }); } catch(_) {}
                        try {
                            resp = await fetchAPI('/ciudadanos/reset-password', { method: 'POST', body: { token, password, confirm_password: password }, suppressErrorLog: true });
                        } catch (_) {}
                    }
                    if (tokenMessage) {
                        const msg = (resp && (resp.message || resp.msg)) || (resp && resp.success ? 'Contraseña restablecida correctamente' : 'Proceso completado');
                        tokenMessage.textContent = msg;
                        tokenMessage.className = 'alert alert-success mt-3';
                        tokenMessage.classList.remove('d-none');
                    }
                    const ok = (resp && ((resp.message || '').toLowerCase().includes('exitosamente') || (resp.message || '').toLowerCase().includes('correctamente') || resp.success));
                    if (ok) {
                        try {
                            const btn = document.getElementById('btn-token-reset');
                            const p1 = document.getElementById('token-new-password');
                            const p2 = document.getElementById('token-confirm-password');
                            if (btn) { btn.disabled = true; btn.textContent = 'Contraseña actualizada'; }
                            if (p1) p1.disabled = true;
                            if (p2) p2.disabled = true;
                        } catch (_) {}
                    }
                } catch (error) {
                    if (tokenMessage) {
                        tokenMessage.textContent = (error && error.message) ? error.message : 'No se pudo restablecer la contraseña.';
                        tokenMessage.className = 'alert alert-danger mt-3';
                        tokenMessage.classList.remove('d-none');
                    }
                } finally {
                    mostrarCargando(false);
                }
            });
        }
    }
}

/**
 * Genera el menú según el rol del usuario
 * @param {string} rol - Rol del usuario
 */
function generarMenu(rol) {
    const menuItems = document.getElementById('menu-items');
    if (!menuItems) return;
    const currentPage = (typeof localStorage !== 'undefined' && localStorage.getItem('currentPage')) || 'dashboard';
    let menuHTML = '';
    
    // Menú para administradores
    if (rol === 'admin') {
        menuHTML = `
            <li class="nav-item">
                <a href="#" class="nav-link ${currentPage==='dashboard'?'active':''}" data-page="dashboard">
                    <i class="bi bi-speedometer2"></i> Panel
                </a>
            </li>
            <li class="nav-item">
                <a href="#" class="nav-link ${currentPage==='usuarios'?'active':''}" data-page="usuarios">
                    <i class="bi bi-people"></i> Usuarios
                </a>
            </li>
            <li class="nav-item">
                <a href="#" class="nav-link ${currentPage==='departamentos'?'active':''}" data-page="departamentos">
                    <i class="bi bi-building"></i> Departamentos
                </a>
            </li>
            <li class="nav-item">
                <a href="#" class="nav-link ${currentPage==='tramites'?'active':''}" data-page="tramites">
                    <i class="bi bi-file-earmark-text"></i> Trámites
                </a>
            </li>
            <li class="nav-item">
                <a href="#" class="nav-link ${currentPage==='pagos'?'active':''}" data-page="pagos">
                    <i class="bi bi-cash-coin"></i> Pagos
                </a>
            </li>
            <li class="nav-item">
                <a href="#" class="nav-link ${currentPage==='reportes'?'active':''}" data-page="reportes">
                    <i class="bi bi-bar-chart"></i> Reportes
                </a>
            </li>
        `;
    } else if (rol === 'funcionario') {
        // Menú para funcionarios con Dashboard propio
        menuHTML = `
            <li class="nav-item">
                <a href="#" class="nav-link ${currentPage==='dashboard'?'active':''}" data-page="dashboard">
                    <i class="bi bi-speedometer2"></i> Panel
                </a>
            </li>
            <li class="nav-item">
                <a href="#" class="nav-link ${currentPage==='tramites'?'active':''}" data-page="tramites">
                    <i class="bi bi-file-earmark-text"></i> Trámites
                </a>
            </li>
            <li class="nav-item">
                <a href="#" class="nav-link ${currentPage==='pagos'?'active':''}" data-page="pagos">
                    <i class="bi bi-cash-coin"></i> Pagos
                </a>
            </li>
        `;
    } else if (rol === 'superadmin') {
        const pageKey = currentPage || 'panel-superadmin';
        menuHTML = `
            <li class="nav-item">
                <a href="#" class="nav-link ${pageKey==='panel-superadmin'?'active':''}" data-page="panel-superadmin">
                    <i class="bi bi-speedometer2"></i> Panel
                </a>
            </li>
            <li class="nav-item">
                <a href="#" class="nav-link ${pageKey==='municipalidades'?'active':''}" data-page="municipalidades">
                    <i class="bi bi-building"></i> Municipalidades
                </a>
            </li>
            <li class="nav-item">
                <a href="#" class="nav-link ${pageKey==='usuarios'?'active':''}" data-page="usuarios">
                    <i class="bi bi-people"></i> Administradores
                </a>
            </li>
        `;
    } else if (rol === 'ciudadano') {
        menuHTML = `
            <li class="nav-item">
                <a href="#" class="nav-link ${currentPage==='portalCiudadano'?'active':''}" data-page="portalCiudadano">
                    <i class="bi bi-house"></i> Portal
                </a>
            </li>
            <li class="nav-item">
                <a href="#" class="nav-link ${currentPage==='misTramites'?'active':''}" data-page="misTramites">
                    <i class="bi bi-file-earmark-text"></i> Mis Trámites
                </a>
            </li>
            <li class="nav-item">
                <a href="#" class="nav-link ${currentPage==='formularioNuevoTramite'?'active':''}" data-page="formularioNuevoTramite">
                    <i class="bi bi-plus-circle"></i> Iniciar Trámite
                </a>
            </li>
            <li class="nav-item">
                <a href="#" class="nav-link ${currentPage==='misPagos'?'active':''}" data-page="misPagos">
                    <i class="bi bi-cash-coin"></i> Mis Pagos
                </a>
            </li>
        `;
    }
    
    menuItems.innerHTML = menuHTML;
    
    // Agregar eventos a los enlaces del menú
    const enlaces = menuItems.querySelectorAll('.nav-link');
    enlaces.forEach(enlace => {
        enlace.addEventListener('click', (e) => {
            e.preventDefault();
            
            enlaces.forEach(e => e.classList.remove('active'));
            enlace.classList.add('active');
            
            // Cargar la página correspondiente
            const pagina = enlace.getAttribute('data-page');
            try { localStorage.setItem('currentPage', pagina); } catch (_) {}
            if (pagina === 'panel-superadmin') {
                const u = (typeof obtenerUsuario === 'function') ? obtenerUsuario() : null;
                if (typeof cargarInterfazSuperadmin === 'function') cargarInterfazSuperadmin(u || {});
            } else if (pagina === 'municipalidades' && typeof cargarMunicipalidades === 'function') {
                cargarMunicipalidades();
            } else if (pagina && typeof window[`cargar${pagina.charAt(0).toUpperCase() + pagina.slice(1)}`] === 'function') {
                window[`cargar${pagina.charAt(0).toUpperCase() + pagina.slice(1)}`]();
            } else {
                console.log(`Función para cargar ${pagina} no encontrada`);
            }
        });
    });
}

/**
 * Obtiene el nombre del rol para mostrar en la interfaz
 * @param {string} role - Código del rol
 * @returns {string} Nombre del rol
 */
function obtenerNombreRol(role) {
    switch (role) {
        case 'admin':
            return 'Administrador';
        case 'funcionario':
            return 'Funcionario Municipal';
        case 'ciudadano':
            return 'Ciudadano';
        case 'superadministrador':
            return 'Superadministrador';
        default:
            return role;
    }
}

/**
 * Obtiene el usuario actual desde localStorage
 * @returns {Object|null} Información del usuario o null si no hay usuario
 */
function obtenerUsuario() {
    const usuarioJSON = (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('usuario') : null) || localStorage.getItem('usuario');
    return usuarioJSON ? JSON.parse(usuarioJSON) : null;
}

/**
 * Cierra la sesión del usuario
 */
function cerrarSesion() {
    // Eliminar información de sesión
    try { if (typeof sessionStorage !== 'undefined') { sessionStorage.removeItem('token'); sessionStorage.removeItem('usuario'); } } catch (_) {}
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    try { clearCorexCookies(); } catch (_) {}
    
    // Recargar la página para mostrar el login
    window.location.reload();
}

/**
 * Muestra u oculta el indicador de carga
 * @param {boolean} mostrar - Indica si se debe mostrar el indicador
 */
function mostrarCargando(mostrar) {
    const loading = document.getElementById('loading');
    if (loading) {
        if (mostrar) {
            loading.classList.remove('d-none');
        } else {
            loading.classList.add('d-none');
        }
    }
}

// Funciones para gestionar trámites en localStorage y en la API
async function guardarTramite(tramite) {
    try {
        const response = await fetchAPI('/tramites', {
            method: 'POST',
            body: tramite
        });
        console.log('Trámite guardado en la base de datos:', response);
        const creado = (response && (response.tramite || response)) || null;
        if (creado && creado.id) {
            try {
                const tramites = obtenerTramites();
                const idx = tramites.findIndex(t => t.codigo === creado.codigo);
                const merged = {
                    id: creado.id,
                    codigo: creado.codigo,
                    titulo: creado.titulo,
                    descripcion: creado.descripcion,
                    tipo: creado.tipo,
                    estado: creado.estado,
                    fecha_solicitud: creado.fecha_solicitud,
                    departamento_id: creado.departamento_id,
                    municipalidad_id: creado.municipalidad_id,
                    ciudadano_id: creado.ciudadano_id,
                    requiere_pago: !!creado.requiere_pago,
                    monto: Number(creado.monto || 0),
                    pago_completado: !!creado.pago_completado,
                    prioridad: creado.prioridad || 'media'
                };
                if (idx >= 0) {
                    tramites[idx] = merged;
                } else {
                    tramites.push(merged);
                }
                localStorage.setItem('tramites', JSON.stringify(tramites));
            } catch (_) {}
        }
        return creado || true;
    } catch (error) {
        console.warn('No se pudo guardar el trámite en la base de datos:', error);
        throw error;
    }
}

function obtenerTramites() {
    const tramitesJSON = localStorage.getItem('tramites');
    return tramitesJSON ? JSON.parse(tramitesJSON) : [];
}

async function obtenerTramitesAPI() {
    try {
        const response = await fetchAPI('/tramites');
        return response.data || [];
    } catch (error) {
        console.warn('No se pudieron obtener los trámites de la API, usando localStorage:', error);
        return obtenerTramites();
    }
}

function obtenerTramitesUsuario(usuarioId) {
    // Primero intentamos obtener de localStorage
    const tramites = obtenerTramites();
    return tramites.filter(t => t.ciudadano_id === usuarioId);
}

async function obtenerTramitesUsuarioAPI(usuarioId) {
    try {
        let res = await fetchAPI(`/tramites?ciudadanoId=${usuarioId}`);
        let apiLista = Array.isArray(res?.tramites) ? res.tramites : (Array.isArray(res) ? res : []);
        const porCodigo = new Map();
        apiLista.forEach(t => { if (t && t.codigo) porCodigo.set(String(t.codigo), t); });

        const locales = obtenerTramitesUsuario(usuarioId) || [];
        for (const lt of locales) {
            const cod = lt && lt.codigo ? String(lt.codigo) : null;
            if (!cod) continue;
            if (!porCodigo.has(cod)) {
                try {
                    const r2 = await fetchAPI(`/tramites?search=${encodeURIComponent(cod)}&ciudadanoId=${usuarioId}&_ts=${Date.now()}`);
                    const lista2 = Array.isArray(r2?.tramites) ? r2.tramites : (Array.isArray(r2) ? r2 : []);
                    const match = lista2.find(x => x.codigo === cod);
                    if (match) porCodigo.set(cod, match);
                } catch (_) {}
            }
        }

        const combinada = Array.from(porCodigo.values()).filter(t => typeof t.id === 'number' && !!t.id);
        combinada.sort((a, b) => new Date(b.fecha_solicitud) - new Date(a.fecha_solicitud));
        // Si aún no hay resultados, forzar cache-bust
        if (!combinada.length) {
            const r3 = await fetchAPI(`/tramites?ciudadanoId=${usuarioId}&_ts=${Date.now()}`);
            const l3 = Array.isArray(r3?.tramites) ? r3.tramites : (Array.isArray(r3) ? r3 : []);
            l3.sort((a, b) => new Date(b.fecha_solicitud) - new Date(a.fecha_solicitud));
            return l3;
        }
        return combinada;
    } catch (error) {
        console.warn('No se pudieron obtener los trámites del usuario de la API, usando localStorage:', error);
        const locales = obtenerTramitesUsuario(usuarioId) || [];
        const porCodigo = new Map();
        for (const lt of locales) { const cod = lt && lt.codigo ? String(lt.codigo) : null; if (cod && !porCodigo.has(cod)) porCodigo.set(cod, lt); }
        const lsorted = Array.from(porCodigo.values()).sort((a, b) => new Date(b.fecha_solicitud) - new Date(a.fecha_solicitud));
        return lsorted.filter(t => typeof t.id === 'number');
    }
}

// Funciones para las secciones del portal ciudadano
async function cargarMisTramites(usuario) {
    // Asegurar perfil de usuario si no se pasa como argumento
    if (!usuario || !usuario.id) {
        try {
            const localUser = (typeof obtenerUsuario === 'function') ? obtenerUsuario() : null;
            if (localUser && localUser.id) {
                usuario = localUser;
            } else {
                const perfil = await fetchAPI('/usuarios/perfil');
                if (perfil && perfil.id) usuario = perfil;
            }
        } catch (_) {}
    }
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        // Obtener trámites del usuario desde la API
        const tramitesUsuario = await obtenerTramitesUsuarioAPI(usuario.id);
        const ocultosRaw = localStorage.getItem('__tramites_ocultos');
        const ocultos = Array.isArray(JSON.parse(ocultosRaw || '[]')) ? JSON.parse(ocultosRaw || '[]') : [];
        const listaFiltrada = Array.isArray(tramitesUsuario) ? tramitesUsuario.filter(t => !ocultos.includes(t.id)) : [];
        const pagosCompletadosPorTramite = new Set();
        try {
            const respPagos = await fetchAPI(`/pagos?ciudadanoId=${usuario.id}`);
            const pagos = Array.isArray(respPagos) ? respPagos : (respPagos.pagos || []);
            pagos.forEach(p => {
                const tid = p.tramite_id ?? p.tramiteId;
                if (tid && String(p.estado).toLowerCase() === 'completado') pagosCompletadosPorTramite.add(tid);
            });
        } catch (_) {}
        
        let contenidoTramites = '';
        
        if (tramitesUsuario.length === 0) {
            contenidoTramites = `
                <div class="alert alert-info">
                    <i class="bi bi-info-circle-fill me-2"></i>
                    No tienes trámites activos en este momento.
                </div>
            `;
        } else {
            contenidoTramites = `
                <div class="table-responsive">
                    <table class="table table-hover w-100" id="tabla-mis-tramites">
                        <thead>
                            <tr>
                                <th class="text-nowrap">Código</th>
                                <th class="text-nowrap">Tipo</th>
                                <th class="text-nowrap">Título</th>
                                <th class="text-nowrap">Fecha</th>
                                <th class="text-nowrap">Estado</th>
                                <th class="text-nowrap">Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="tabla-tramites-body"></tbody>
                    </table>
                </div>
                <div class="d-flex justify-content-between align-items-center mt-3" id="paginacion-tramites">
                    <div class="small text-muted" id="info-paginacion"></div>
                    <div class="btn-group" role="group" aria-label="Paginación">
                        <button class="btn btn-outline-secondary" id="btn-prev">Anterior</button>
                        <span class="btn btn-outline-secondary disabled" id="pagina-actual">1 / 1</span>
                        <button class="btn btn-outline-secondary" id="btn-next">Siguiente</button>
                    </div>
                </div>
            `;
        }
        
        mainContent.innerHTML = `
            <div class="container-fluid py-4">
                <div class="row">
                    <div class="col-12">
                        <nav aria-label="breadcrumb">
                            <ol class="breadcrumb">
                                <li class="breadcrumb-item"><a href="#" id="volver-portal">Portal Ciudadano</a></li>
                                <li class="breadcrumb-item active">Mis Trámites</li>
                            </ol>
                        </nav>
                        <div class="d-flex justify-content-between align-items-center mb-4">
                            <h2 class="mb-0">Mis Trámites</h2>
                            <div class="d-flex gap-2">
                                <button class="btn btn-outline-secondary" id="btn-volver-portal">
                                    <i class="bi bi-arrow-left"></i> Volver al Portal
                                </button>
                                <button class="btn btn-success" id="btn-nuevo-tramite-desde-lista">
                                    <i class="bi bi-plus-circle"></i> Nuevo Trámite
                                </button>
                            </div>
                        </div>
                        ${contenidoTramites}
                    </div>
                </div>
            </div>
        `;
        
        // Configurar eventos
        const volverPortal = document.getElementById('volver-portal');
        const btnVolverPortal = document.getElementById('btn-volver-portal');
        const btnNuevoTramiteDesdeList = document.getElementById('btn-nuevo-tramite-desde-lista');
        const botonesVerDetalle = document.querySelectorAll('.ver-detalle-tramite');
        const tbody = document.getElementById('tabla-tramites-body');
        const btnPrev = document.getElementById('btn-prev');
        const btnNext = document.getElementById('btn-next');
        const paginaActualEl = document.getElementById('pagina-actual');
        const infoPaginacion = document.getElementById('info-paginacion');
        let paginaActual = 1;
        const tamPagina = 8;
        const totalPaginas = Math.max(1, Math.ceil(listaFiltrada.length / tamPagina));

        function renderPagina() {
            const start = (paginaActual - 1) * tamPagina;
            const end = Math.min(start + tamPagina, listaFiltrada.length);
            const slice = listaFiltrada.slice(start, end);
            if (tbody) {
                tbody.innerHTML = slice.map(tramite => `
                    <tr>
                        <td>${tramite.codigo}</td>
                        <td class="text-uppercase">${obtenerNombreTipoTramite(tramite.tipo)}</td>
                        <td>${tramite.titulo}</td>
                        <td>${formatearFecha(tramite.fecha_solicitud)}</td>
                        <td><span class="badge ${obtenerColorEstadoTramite(pagosCompletadosPorTramite.has(tramite.id) || tramite.pago_completado ? 'pagado' : tramite.estado)}" data-estado="${pagosCompletadosPorTramite.has(tramite.id) || tramite.pago_completado ? 'pagado' : tramite.estado}">${obtenerNombreEstadoTramite(pagosCompletadosPorTramite.has(tramite.id) || tramite.pago_completado ? 'pagado' : tramite.estado)}</span></td>
                        <td>
                            <div class="d-flex gap-2">
                                <button class="btn btn-sm btn-primary ver-detalle-tramite" data-id="${tramite.id}"><i class="bi bi-eye"></i> Ver</button>
                                ${String(tramite.estado).toLowerCase() === 'pendiente' && !pagosCompletadosPorTramite.has(tramite.id) ? `<button class="btn btn-sm btn-outline-danger quitar-tramite" data-id="${tramite.id}"><i class="bi bi-x-circle"></i> Quitar</button>` : ''}
                            </div>
                        </td>
                    </tr>
                `).join('');
            }
            if (paginaActualEl) paginaActualEl.textContent = `${paginaActual} / ${totalPaginas}`;
            if (infoPaginacion) infoPaginacion.textContent = `Mostrando ${start + 1}–${end} de ${listaFiltrada.length}`;
            const nuevosBotones = document.querySelectorAll('.ver-detalle-tramite');
            if (nuevosBotones && nuevosBotones.length > 0) {
                nuevosBotones.forEach(b => {
                    b.onclick = (e) => {
                        e.preventDefault();
                        const id = parseInt(e.currentTarget.getAttribute('data-id'));
                        mostrarDetalleTramiteModal(id);
                    };
                });
            }
            const quitarBtns = document.querySelectorAll('.quitar-tramite');
            if (quitarBtns && quitarBtns.length > 0) {
                quitarBtns.forEach(b => {
                    b.onclick = async (e) => {
                        e.preventDefault();
                        const id = parseInt(e.currentTarget.getAttribute('data-id'));
                        try {
                            mostrarCargando(true);
                            await fetchAPI(`/tramites/${id}/ciudadano`, { method: 'DELETE' });
                            const idx = listaFiltrada.findIndex(t => t.id === id);
                            if (idx >= 0) {
                                listaFiltrada.splice(idx, 1);
                                const total = Math.max(1, Math.ceil(listaFiltrada.length / tamPagina));
                                if (paginaActual > total) paginaActual = total;
                            }
                            renderPagina();
                            mostrarNotificacion('Trámite eliminado.', 'success');
                        } catch (err) {
                            const msg = (err && ((err.body && (err.body.message || err.body.error)) || err.message || err.status)) ? `No se pudo eliminar: ${(err.body && (err.body.message || err.body.error)) || err.message || err.status}` : 'No se pudo eliminar el trámite';
                            mostrarNotificacion(msg, 'danger');
                        } finally {
                            mostrarCargando(false);
                        }
                    };
                });
            }
            if (btnPrev) btnPrev.disabled = paginaActual <= 1;
            if (btnNext) btnNext.disabled = paginaActual >= totalPaginas;
        }

        if (btnPrev) {
            btnPrev.onclick = (e) => { e.preventDefault(); if (paginaActual > 1) { paginaActual--; renderPagina(); } };
        }
        if (btnNext) {
            btnNext.onclick = (e) => { e.preventDefault(); if (paginaActual < totalPaginas) { paginaActual++; renderPagina(); } };
        }
        if (tbody) renderPagina();
        
        if (volverPortal) {
            volverPortal.addEventListener('click', (e) => {
                e.preventDefault();
                cargarPortalCiudadano(usuario);
            });
        }
        if (btnVolverPortal) {
            btnVolverPortal.addEventListener('click', (e) => {
                e.preventDefault();
                cargarPortalCiudadano(usuario);
            });
        }
        
        if (btnNuevoTramiteDesdeList) {
            btnNuevoTramiteDesdeList.addEventListener('click', (e) => {
                e.preventDefault();
                cargarFormularioNuevoTramite(usuario);
            });
        }
        
        if (botonesVerDetalle && botonesVerDetalle.length > 0) {
            botonesVerDetalle.forEach(boton => {
                boton.addEventListener('click', (e) => {
                    e.preventDefault();
                    const tramiteId = e.currentTarget.getAttribute('data-id');
                    // Abrir modal con diseño y detalle del trámite
                    mostrarDetalleTramiteModal(parseInt(tramiteId));
                });
            });
        }
        
    }

    // Refresco automático de la tabla "Mis Trámites" al crear un nuevo trámite
    if (window.__onTramiteCreadoMisTramites) {
        window.removeEventListener('tramite:creado', window.__onTramiteCreadoMisTramites);
    }
    window.__onTramiteCreadoMisTramites = () => cargarMisTramites(usuario);
    window.addEventListener('tramite:creado', window.__onTramiteCreadoMisTramites);
}

function cargarFormularioNuevoTramite(usuario) {
    // Asegurar perfil de usuario si no se pasa como argumento
    if (!usuario || !usuario.id) {
        try {
            const localUser = (typeof obtenerUsuario === 'function') ? obtenerUsuario() : null;
            if (localUser && localUser.id) {
                usuario = localUser;
            }
        } catch (_) {}
    }
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        // Crear el contenido HTML
        mainContent.innerHTML = `
            <div class="container py-4">
                <div class="row">
                    <div class="col-12">
                        <nav aria-label="breadcrumb">
                            <ol class="breadcrumb">
                                <li class="breadcrumb-item"><a href="#" id="volver-portal">Portal Ciudadano</a></li>
                                <li class="breadcrumb-item active">Nuevo Trámite</li>
                            </ol>
                        </nav>
                        <div class="d-flex justify-content-between align-items-center mb-4">
                            <h2 class="mb-0">Iniciar Nuevo Trámite</h2>
                            <div class="d-flex gap-2">
                                <button class="btn btn-outline-secondary" id="btn-volver-portal">
                                    <i class="bi bi-arrow-left"></i> Volver al Portal
                                </button>
                            </div>
                        </div>
                        <div class="card shadow-sm">
                            <div class="card-body">
                                <div id="form-container">
                                    <div class="mb-3">
                                        <label for="municipalidad-tramite" class="form-label">Municipalidad</label>
                                        <small class="text-muted">Paso 1: seleccione la municipalidad</small>
                                        <select class="form-select" id="municipalidad-tramite">
                                            <option value="">Seleccione una municipalidad</option>
                                        </select>
                                    </div>
                                    <div class="mb-3">
                                        <label for="departamento-tramite" class="form-label">Departamento</label>
                                        <small class="text-muted">Paso 2: seleccione el departamento</small>
                                        <select class="form-select" id="departamento-tramite" disabled>
                                            <option value="">Seleccione un departamento</option>
                                        </select>
                                    </div>
                                    <div class="mb-3">
                                        <label for="tipo-tramite" class="form-label">Tipo de Trámite</label>
                                        <small class="text-muted">Paso 3: seleccione el trámite</small>
                                        <select class="form-select" id="tipo-tramite" disabled>
                                            <option value="">Seleccione un trámite</option>
                                        </select>
                                    </div>
                                    <div class="mb-3">
                                        <label for="titulo-tramite" class="form-label">Título</label>
                                        <input type="text" class="form-control" id="titulo-tramite">
                                    </div>
                                    <div class="mb-3">
                                        <label for="descripcion-tramite" class="form-label">Descripción</label>
                                        <textarea class="form-control" id="descripcion-tramite" rows="4"></textarea>
                                    </div>
                                    <div class="mb-3">
                                        <label for="documentos-tramite" class="form-label">Documentos Adjuntos</label>
                                        <input type="file" class="form-control" id="documentos-tramite" multiple>
                                    </div>
                                    <div class="d-grid gap-2 d-md-flex justify-content-md-end">
                                        <button type="button" class="btn btn-secondary" id="btn-cancelar-tramite">Cancelar</button>
                                        <button type="button" class="btn btn-primary" id="btn-enviar-tramite">Enviar Solicitud</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Configurar eventos después de que el DOM esté listo
        setTimeout(() => {
            // Botón para volver al portal
            document.getElementById('volver-portal').onclick = function() {
                cargarPortalCiudadano(usuario);
                return false;
            };
            const btnVolverPortal = document.getElementById('btn-volver-portal');
            if (btnVolverPortal) {
                btnVolverPortal.onclick = function(e) {
                    e.preventDefault();
                    cargarPortalCiudadano(usuario);
                };
            }
            
            // Botón para cancelar el trámite
            document.getElementById('btn-cancelar-tramite').onclick = function() {
                cargarPortalCiudadano(usuario);
                return false;
            };
            
            // Botón para enviar el trámite
            document.getElementById('btn-enviar-tramite').onclick = function() {
                enviarNuevoTramite(usuario);
                return false;
            };

            // Cargar departamentos dinámicamente desde la API
            (async () => {
                try {
                    const selectDepartamento = document.getElementById('departamento-tramite');
                    const resp = await fetchAPI('/departamentos?limit=100');
                    const departamentos = Array.isArray(resp)
                        ? resp
                        : (resp?.departamentos || resp?.data || []);

                    // Reiniciar opciones dejando sólo el placeholder
                    selectDepartamento.innerHTML = '<option value="">Seleccione un departamento</option>';

                    departamentos.forEach(dep => {
                        const opt = document.createElement('option');
                        opt.value = dep.id;
                        opt.textContent = dep.nombre || dep.nombre_departamento || '';
                        selectDepartamento.appendChild(opt);
                    });

                    if (!departamentos.length) {
                        console.warn('No hay departamentos disponibles. Verifique en el admin.');
                    }
                } catch (error) {
                    console.error('Error al cargar departamentos:', error);
                }
            })();

            // Cargar municipalidades dinámicamente desde la API
            (async () => {
                try {
                    const selectMunicipalidad = document.getElementById('municipalidad-tramite');
                    const respM = await fetchAPI('/municipalidades?limit=100');
                    const municipalidades = Array.isArray(respM)
                        ? respM
                        : (respM?.departamentos || respM?.data || []);

                    selectMunicipalidad.innerHTML = '<option value="">Seleccione una municipalidad</option>';
                    municipalidades.forEach(m => {
                        const opt = document.createElement('option');
                        opt.value = m.id;
                        opt.textContent = m.nombre;
                        selectMunicipalidad.appendChild(opt);
                    });

                    if (!municipalidades.length) {
                        console.warn('No hay municipalidades disponibles.');
                    }
                } catch (error) {
                    console.error('Error al cargar municipalidades:', error);
                }
            })();

            const TRAMITES_POR_DEPTO = {
                educacion: [
                    { nombre: 'Solicitudes de becas municipales', tipo: 'solicitud' },
                    { nombre: 'Solicitud de traslado de establecimiento', tipo: 'solicitud' },
                    { nombre: 'Reclamos y revisiones de casos de convivencia escolar', tipo: 'reclamo' }
                ],
                salud: [
                    { nombre: 'Solicitud de cambio de consultorio', tipo: 'solicitud' },
                    { nombre: 'Solicitud de Inscripción de consultorio', tipo: 'solicitud' },
                    { nombre: 'Solicitud de ayuda técnica', tipo: 'solicitud' },
                    { nombre: 'Reclamos por centro de salud', tipo: 'reclamo' }
                ],
                obras: [
                    { nombre: 'certificado de construcción de obras', tipo: 'certificado' },
                    { nombre: 'Regularización de viviendas', tipo: 'permiso' },
                    { nombre: 'Denuncias por obras ilegales', tipo: 'reclamo' }
                ],
                seguridad: [
                    { nombre: 'Solicitud de rondas preventivas', tipo: 'solicitud' },
                    { nombre: 'Instalación de cámaras o alarmas comunitarias', tipo: 'solicitud' },
                    { nombre: 'Charlas de seguridad', tipo: 'solicitud' }
                ],
                transito: [
                    { nombre: 'Rectificación de datos o errores en licencias', tipo: 'licencia' },
                    { nombre: 'Permiso de circulación', tipo: 'permiso' }
                ]
            };

            function normalizar(s) { return String(s || '').toLowerCase(); }
            function claveDepto(nombre) {
                const n = normalizar(nombre);
                if (n.includes('educac')) return 'educacion';
                if (n.includes('salud')) return 'salud';
                if (n.includes('obra')) return 'obras';
                if (n.includes('seguridad')) return 'seguridad';
                if (n.includes('tránsito') || n.includes('transito') || n.includes('transporte')) return 'transito';
                return null;
            }
            const PRECIOS = {
                'Solicitudes de becas municipales': 0,
                'Solicitud de traslado de establecimiento': 0,
                'Reclamos y revisiones de casos de convivencia escolar': 0,
                'Solicitud de cambio de consultorio': 0,
                'Solicitud de Inscripción de consultorio': 0,
                'Solicitud de ayuda técnica': 1000,
                'Reclamos por centro de salud': 0,
                'certificado de construcción de obras': 500000,
                'Regularización de viviendas': 200000,
                'Denuncias por obras ilegales': 0,
                'Solicitud de rondas preventivas': 0,
                'Instalación de cámaras o alarmas comunitarias': 20000,
                'Charlas de seguridad': 0,
                'Rectificación de datos o errores en licencias': 3000,
                'Permiso de circulación': 25000
            };
            function formatoPrecio(v) {
                if (!v || v === 0) return 'GRATUITO';
                return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(v);
            }
            function poblarTipoTramitePorDepartamento() {
                const selectTipo = document.getElementById('tipo-tramite');
                const selectDepartamento = document.getElementById('departamento-tramite');
                const selectedOpt = selectDepartamento.options[selectDepartamento.selectedIndex];
                const nombreDepto = selectedOpt ? (selectedOpt.textContent || '') : '';
                const clave = claveDepto(nombreDepto);
                selectTipo.innerHTML = '<option value="">Seleccione un trámite</option>';
                if (!clave || !TRAMITES_POR_DEPTO[clave]) return;
                TRAMITES_POR_DEPTO[clave].forEach(t => {
                    const opt = document.createElement('option');
                    opt.value = t.nombre;
                    const precio = PRECIOS[t.nombre] ?? 0;
                    opt.textContent = `${t.nombre} — ${formatoPrecio(precio)}`;
                    opt.dataset.tipo = t.tipo;
                    opt.dataset.precio = String(precio);
                    selectTipo.appendChild(opt);
                });
            }
            function aplicarTituloPorTipo() {
                const selectTipo = document.getElementById('tipo-tramite');
                const tituloInput = document.getElementById('titulo-tramite');
                const selOpt = selectTipo.options[selectTipo.selectedIndex];
                if (selOpt && !tituloInput.value) tituloInput.value = selOpt.value;
            }
            const muniSelect = document.getElementById('municipalidad-tramite');
            const depSelect = document.getElementById('departamento-tramite');
            const tipoSelect = document.getElementById('tipo-tramite');

            depSelect.disabled = true;
            tipoSelect.disabled = true;

            if (muniSelect) {
                muniSelect.addEventListener('change', () => {
                    const hasMuni = !!muniSelect.value;
                    depSelect.disabled = !hasMuni;
                    if (!hasMuni) {
                        depSelect.value = '';
                        tipoSelect.disabled = true;
                        tipoSelect.innerHTML = '<option value="">Seleccione un trámite</option>';
                    }
                });
            }

            depSelect.addEventListener('change', () => {
                poblarTipoTramitePorDepartamento();
                tipoSelect.disabled = !depSelect.value;
            });
            tipoSelect.addEventListener('change', aplicarTituloPorTipo);
        }, 100);
    }
}

// Función separada para enviar el nuevo trámite
async function enviarNuevoTramite(usuario) {
    // Mostrar indicador de carga
    mostrarCargando(true);
    
    // Obtener valores del formulario
    const tipoSelectEl = document.getElementById('tipo-tramite');
    const tipoNombre = tipoSelectEl.value;
    const titulo = document.getElementById('titulo-tramite').value;
    const descripcion = document.getElementById('descripcion-tramite').value;
    const departamentoId = document.getElementById('departamento-tramite').value;
    const municipalidadId = document.getElementById('municipalidad-tramite').value;
    
    // Validar que todos los campos requeridos estén completos
    if (!tipoNombre || !titulo || !descripcion || !departamentoId || !municipalidadId) {
        mostrarCargando(false);
        mostrarNotificacion('Por favor, complete todos los campos requeridos.', 'warning');
        return;
    }
    
    try {
        // Crear objeto de trámite
        const optSel = tipoSelectEl.options[tipoSelectEl.selectedIndex];
        const precioSel = parseFloat((optSel && optSel.dataset && optSel.dataset.precio) ? optSel.dataset.precio : '0');
        const nuevoTramite = {
            id: Date.now().toString(), // Usar timestamp como ID único
            codigo: generarCodigoTramite(tipoNombre),
            titulo: titulo,
            descripcion: descripcion,
            tipo: tipoNombre,
            estado: 'pendiente',
            fecha_inicio: new Date().toISOString(), // Cambiar de fecha_solicitud a fecha_inicio
            fecha_solicitud: new Date().toISOString(), // Mantener para compatibilidad con localStorage
            departamento_id: parseInt(departamentoId, 10),
            municipalidad_id: parseInt(municipalidadId, 10),
            ciudadano_id: usuario.id,
            funcionario_id: null,
            requiere_pago: precioSel > 0,
            monto: precioSel,
            pago_completado: false,
            prioridad: 'media' // Agregar prioridad por defecto
        };
        
        // Intentar guardar el trámite (primero en la API, luego en localStorage como respaldo)
        let guardadoExitoso = false;
        
        try {
            // Intentar guardar en la API y obtener el creado real
            const creadoReal = await guardarTramite(nuevoTramite);
            guardadoExitoso = !!creadoReal;
        } catch (apiError) {
            console.warn('Error al guardar en la API, intentando guardar solo en localStorage:', apiError);
            
            try {
                // Si falla la API, guardar solo en localStorage
                const tramites = obtenerTramites();
                tramites.push(nuevoTramite);
                localStorage.setItem('tramites', JSON.stringify(tramites));
                guardadoExitoso = true;
                
                // Programar un reintento en segundo plano
                setTimeout(() => {
                    try {
                        fetchAPI('/tramites', {
                            method: 'POST',
                            body: nuevoTramite
                        }).then(response => {
                            console.log('Reintento exitoso de guardar en la API:', response);
                        }).catch(error => {
                            console.warn('Reintento fallido de guardar en la API:', error);
                        });
                    } catch (e) {
                        console.warn('Error en reintento programado:', e);
                    }
                }, 5000); // Reintento después de 5 segundos
            } catch (localError) {
                console.error('Error al guardar en localStorage:', localError);
                throw new Error('No se pudo guardar el trámite en ningún almacenamiento');
            }
        }
        
        if (guardadoExitoso) {
            // Mostrar mensaje de éxito
            mostrarNotificacion('Trámite enviado correctamente', 'success');
            
            // Ocultar indicador de carga
            mostrarCargando(false);
            
            // Notificar y refrescar vistas que escuchan el evento
            window.dispatchEvent(new CustomEvent('tramite:creado', { detail: nuevoTramite }));

            // Redirigir automáticamente a Mis Pagos
            cargarMisPagos(usuario);
        } else {
            throw new Error('No se pudo guardar el trámite');
        }
    } catch (error) {
        console.error('Error al guardar el trámite:', error);
        mostrarCargando(false);
        mostrarNotificacion('Ocurrió un error al guardar el trámite. Por favor, intente nuevamente.', 'danger');
    }
}

// Función para generar un código de trámite
function generarCodigoTramite(tipo) {
    const nombre = String(tipo || '').toLowerCase();
    const tiposCert = ['certificado de construcción de obras'];
    const tiposPerm = ['permiso de circulación.', 'permiso de circulación', 'regularización de viviendas'];
    const tiposLic = ['rectificación de datos o errores en licencias.', 'rectificación de datos o errores en licencias'];
    const tiposRecl = ['denuncias por obras ilegales', 'reclamos por centro de salud', 'reclamos y revisiones de casos de convivencia escolar'];
    const tiposSol = [
      'solicitudes de becas municipales',
      'solicitud de traslado de establecimiento',
      'solicitud de cambio de consultorio',
      'solicitud de inscripción de consultorio',
      'solicitud de ayuda técnica',
      'solicitud de rondas preventivas',
      'instalación de cámaras o alarmas comunitarias',
      'charlas de seguridad'
    ];
    let prefijo = 'TRM';
    if (tiposCert.includes(nombre)) prefijo = 'CERT';
    else if (tiposPerm.includes(nombre)) prefijo = 'PERM';
    else if (tiposLic.includes(nombre)) prefijo = 'LIC';
    else if (tiposRecl.includes(nombre)) prefijo = 'REC';
    else if (tiposSol.includes(nombre)) prefijo = 'SOL';
    const fecha = new Date();
    const año = fecha.getFullYear().toString().substr(-2);
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const numero = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    return `${prefijo}-${año}${mes}-${numero}`;
}

// Funciones auxiliares para formatear datos
function formatearFecha(fechaISO) {
    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function obtenerNombreTipoTramite(tipo) {
    const tipos = {
        'certificado': 'Certificado',
        'permiso': 'Permiso',
        'licencia': 'Licencia',
        'reclamo': 'Reclamo',
        'solicitud': 'Solicitud'
    };
    
    return tipos[tipo] || tipo;
}

function obtenerNombreEstadoTramite(estado) {
    const estados = {
        'pendiente': 'Pendiente',
        'en_proceso': 'En Proceso',
        'en_revision': 'En Revisión',
        'aprobado': 'Aprobado',
        'rechazado': 'Rechazado',
        'finalizado': 'Finalizado'
    };
    
    return estados[estado] || (estado === 'pagado' ? 'Pagado' : estado);
}

function obtenerColorEstadoTramite(estado) {
    const colores = {
        'pendiente': 'bg-warning text-dark',
        'en_proceso': 'bg-info text-dark',
        'en_revision': 'bg-primary',
        'aprobado': 'bg-success',
        'rechazado': 'bg-danger',
        'finalizado': 'bg-secondary'
    };
    
    return colores[estado] || (estado === 'pagado' ? 'bg-success' : 'bg-secondary');
}

function renderCiudadanoNavbar(usuario) {
    return `
    <nav class="navbar navbar-expand-lg navbar-light bg-light border-bottom mb-3">
      <div class="container-fluid">
        <a class="navbar-brand" href="#" id="cit-brand">Corex</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#cit-nav" aria-controls="cit-nav" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="cit-nav">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">
            <li class="nav-item"><a class="nav-link" href="#" id="cit-nav-tramites">Mis Trámites</a></li>
            <li class="nav-item"><a class="nav-link" href="#" id="cit-nav-nuevo">Iniciar Trámite</a></li>
            <li class="nav-item"><a class="nav-link" href="#" id="cit-nav-pagos">Mis Pagos</a></li>
          </ul>
          <div class="d-flex">
            <button class="btn btn-outline-danger" id="cit-logout">Cerrar sesión</button>
          </div>
        </div>
      </div>
    </nav>`;
}

function bindCiudadanoNavbar(usuario) {
    const brand = document.getElementById('cit-brand');
    const nTram = document.getElementById('cit-nav-tramites');
    const nNuevo = document.getElementById('cit-nav-nuevo');
    const nPagos = document.getElementById('cit-nav-pagos');
    const btnLogout = document.getElementById('cit-logout');
    if (brand) brand.onclick = (e) => { e.preventDefault(); cargarPortalCiudadano(usuario); };
    if (nTram) nTram.onclick = (e) => { e.preventDefault(); cargarMisTramites(usuario); };
    if (nNuevo) nNuevo.onclick = (e) => { e.preventDefault(); cargarFormularioNuevoTramite(usuario); };
    if (nPagos) nPagos.onclick = (e) => { e.preventDefault(); cargarMisPagos(usuario); };
    if (btnLogout) btnLogout.onclick = (e) => { e.preventDefault(); cerrarSesion(); };
}

async function cargarMisPagos(usuario) {
    try {
        mostrarCargando(true);
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;

        // Asegurar perfil de usuario
        if (!usuario || !usuario.id) {
            try {
                const perfil = await fetchAPI('/usuarios/perfil');
                if (perfil && perfil.id) usuario = perfil;
            } catch (e) {
                console.warn('No se pudo obtener el perfil del usuario', e);
            }
        }
        const ciudadanoId = usuario?.id;

        // Helper: obtener configuración de pago por nombre de trámite
        const obtenerConfiguracionPagoPorNombreLocal = async (nombre) => {
            try {
                const norm = (nombre || '').toLowerCase();
                let clave = 'otro';
                if (norm.includes('licencia')) clave = 'licencia';
                else if (norm.includes('permiso')) clave = 'permiso';
                else if (norm.includes('certificado') || norm.includes('construcción') || norm.includes('construccion')) clave = 'certificado';
                else if (norm.includes('solicitud')) clave = 'solicitud';

                const precios = {
                    'solicitudes de becas municipales': 0,
                    'solicitud de traslado de establecimiento': 0,
                    'reclamos y revisiones de casos de convivencia escolar': 0,
                    'solicitud de cambio de consultorio': 0,
                    'solicitud de inscripción de consultorio': 0,
                    'solicitud de ayuda técnica': 1000,
                    'reclamos por centro de salud': 0,
                    'certificado de construcción de obras': 500000,
                    'regularización de viviendas': 200000,
                    'denuncias por obras ilegales': 0,
                    'solicitud de rondas preventivas': 0,
                    'instalación de cámaras o alarmas comunitarias': 20000,
                    'charlas de seguridad': 0,
                    'rectificación de datos o errores en licencias': 3000,
                    'permiso de circulación': 25000
                };
                const precioLocal = precios[norm] ?? null;
                if (precioLocal !== null && precioLocal > 0) {
                    return { requiere: true, tipo: 'fijo', montoFijo: precioLocal };
                }

                const resp = await fetchAPI(`/tramites/configuracion-pago?tramite_nombre=${encodeURIComponent(clave)}&estado=activo&order=DESC`);
                const data = Array.isArray(resp?.configuraciones)
                    ? resp.configuraciones
                    : (Array.isArray(resp?.data) ? resp.data : (Array.isArray(resp) ? resp : []));
                if (!data.length) {
                    const precio = precioLocal;
                    if (precio !== null) return { requiere: precio > 0, tipo: precio > 0 ? 'fijo' : 'gratis', montoFijo: precio };
                    if (norm.includes('solicitud') && norm.includes('ayuda') && (norm.includes('técnica') || norm.includes('tecnica'))) return { requiere: true, tipo: 'fijo', montoFijo: 1000 };
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
        };

        // Helper: construir módulo de pago por trámite y config
        const construirModuloPagoHtml = (t, config, estadoPago) => {
            // Determinar requerimiento de pago con fallback a configuración
            const requiere = !!t.requiere_pago || !!(config && config.requiere === true);
            let montoTramite = parseFloat(t.monto || 0);
            if (montoTramite <= 0 && config && config.tipo === 'fijo' && parseFloat(config.montoFijo || 0) > 0) {
                montoTramite = parseFloat(config.montoFijo || 0);
            }

            if (estadoPago === 'completado') {
                return `<div class="alert alert-success mb-0"><i class="bi bi-check-circle-fill"></i> Pago completado</div>`;
            }

            if (!requiere || montoTramite <= 0) {
                return `<div class="alert alert-secondary mb-0"><i class="bi bi-info-circle me-2"></i>Este trámite es gratuito <span class="badge bg-info ms-2">Gratis</span>.</div>`;
            }

            if (montoTramite > 0) {
                return `
                    <div class="border rounded p-3">
                        <div class="alert alert-info mb-3">Monto a pagar: <strong>${formatearMoneda(montoTramite)}</strong></div>

                        <div class="mt-3 form-check">
                            <input class="form-check-input seleccionar-tramite" type="checkbox" id="seleccionar-${t.id}" data-id="${t.id}" data-codigo="${t.codigo || ''}" data-monto="${montoTramite}" ${estadoPago === 'completado' || montoTramite <= 0 ? 'disabled' : ''}>
                            <label class="form-check-label" for="seleccionar-${t.id}">Seleccionar este trámite</label>
                        </div>
                    </div>
                `;
            }

            // Si requiere pago pero el monto aún no está establecido, informar y deshabilitar
            return `
                <div class="border rounded p-3">
                    <div class="alert alert-warning mb-3">
                        Este trámite requiere pago, pero el monto aún no ha sido definido por la municipalidad.
                    </div>
                    <button type="button" class="btn btn-secondary" disabled>
                        <i class="bi bi-lock"></i> Pago no disponible
                    </button>
                </div>
            `;
        };

        // Obtener trámites del ciudadano
        const tramites = await obtenerTramitesUsuarioAPI(ciudadanoId);

        // Obtener pagos existentes para marcar estado
        const pagosPorTramite = new Map();
        try {
            const respPagos = await fetchAPI(`/pagos?ciudadanoId=${ciudadanoId}`);
            const pagos = Array.isArray(respPagos) ? respPagos : (respPagos.pagos || []);
            pagos.forEach(p => {
                const tid = p.tramite_id ?? p.tramiteId;
                if (tid) pagosPorTramite.set(tid, p);
            });
        } catch (e) {
            console.warn('No se pudieron obtener pagos del ciudadano', e);
        }

        // Render layout base
        mainContent.innerHTML = `
            <div class="container py-4">
                <div class="row">
                    <div class="col-12">
                        <nav aria-label="breadcrumb">
                            <ol class="breadcrumb">
                                <li class="breadcrumb-item"><a href="#" id="volver-portal">Portal Ciudadano</a></li>
                                <li class="breadcrumb-item active">Mis Pagos</li>
                            </ol>
                        </nav>
                        <div class="d-flex justify-content-between align-items-center mb-4">
                            <h2 class="mb-0">Mis Pagos</h2>
                            <div class="d-flex gap-2">
                                <button id="btn-volver-portal" class="btn btn-outline-secondary">
                                    <i class="bi bi-arrow-left"></i> Volver al Portal
                                </button>
                                <button id="btn-ver-pagos-realizados" class="btn btn-outline-success">
                                    <i class="bi bi-check2-circle"></i> Pagos realizados
                                </button>
                            </div>
                        </div>
                        <div class="d-flex gap-2 mb-3">
                            <div class="btn-group" role="group" aria-label="Filtrar trámites">
                                <button id="btn-filtro-pago" class="btn btn-outline-primary active">
                                    <i class="bi bi-cash-coin"></i> Trámites de pago
                                </button>
                                <button id="btn-filtro-gratis" class="btn btn-outline-info">
                                    <i class="bi bi-gift"></i> Trámites gratis
                                </button>
                            </div>
                        </div>
                        <div id="contenedor-pagos"></div>
                    </div>
                </div>
            </div>
        `;

        const contenedor = document.getElementById('contenedor-pagos');
        if (!tramites || tramites.length === 0) {
            contenedor.innerHTML = `<div class="alert alert-info"><i class="bi bi-info-circle-fill me-2"></i>No tienes trámites registrados.</div>`;
        } else {
            const configPorTramite = new Map();
            const pagoPendientes = [];
            const pagoCompletados = [];
            const gratisTramites = [];

            await Promise.all(tramites.map(async (t) => {
                const tipoNombre = (t && typeof t.tipo === 'object' && t.tipo?.nombre) ? t.tipo.nombre : String(t.tipo || '');
                const config = await obtenerConfiguracionPagoPorNombreLocal(tipoNombre);
                configPorTramite.set(t.id, config);
                const pagoExistente = pagosPorTramite.get(t.id);
                const estadoPago = pagoExistente?.estado || 'sin_pago';

                const requiere = !!t.requiere_pago || !!(config && config.requiere === true);
                let montoTramite = parseFloat(t.monto || 0);
                if (montoTramite <= 0 && config && config.tipo === 'fijo' && parseFloat(config.montoFijo || 0) > 0) {
                    montoTramite = parseFloat(config.montoFijo || 0);
                }
                const esGratis = (!requiere) || !(montoTramite > 0);

                const estadoBadge = estadoPago === 'completado'
                    ? '<span class="badge bg-success">Pago completado</span>'
                    : (estadoPago === 'pendiente' ? '<span class="badge bg-warning text-dark">Pendiente</span>' : (estadoPago === 'rechazado' ? '<span class="badge bg-danger">Rechazado</span>' : '<span class="badge bg-secondary">Sin pago</span>'));
                const gratisBadge = esGratis ? '<span class="badge bg-info ms-2">Gratis</span>' : '';
                const cancelarHtml = (estadoPago === 'pendiente' && pagoExistente?.id)
                    ? `<div class="mt-2"><button class="btn btn-sm btn-outline-danger cancelar-pago" data-id="${pagoExistente.id}"><i class="bi bi-x-circle"></i> Cancelar pago</button></div>`
                    : '';

                const cardHtml = `
                    <div class="card shadow-sm mb-3" id="card-tramite-${t.id}">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <div>
                                    <h5 class="mb-1">${obtenerNombreTipoTramite(t.tipo)} - ${t.titulo || 'Trámite'}</h5>
                                    <div class="text-muted small">Código: ${t.codigo} • Estado: ${obtenerNombreEstadoTramite(t.estado)} • ${estadoBadge} ${gratisBadge}</div>
                                </div>
                            </div>
                            ${construirModuloPagoHtml(t, config, estadoPago)}
                            ${cancelarHtml}
                        </div>
                    </div>
                `;

                if (esGratis) {
                    gratisTramites.push(cardHtml);
                } else if (estadoPago === 'completado') {
                    pagoCompletados.push(cardHtml);
                } else {
                    pagoPendientes.push(cardHtml);
                }
            }));

            let filtroActual = 'pago';

            function renderContenido() {
                const toolbar = pagoPendientes.length ? `
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <div class="d-flex gap-2">
                            <button id="seleccionar-todos" class="btn btn-sm btn-outline-primary">Seleccionar todos</button>
                            <button id="deseleccionar-todos" class="btn btn-sm btn-outline-secondary">Deseleccionar</button>
                        </div>
                        <div class="d-flex align-items-center gap-3">
                            <span id="resumen-seleccion" class="text-muted">Seleccionados: 0 • Total: ${formatearMoneda(0)}</span>
                            <button id="btn-simular-seleccion" class="btn btn-warning"><i class="bi bi-play-circle"></i> Simular pago</button>
                            <button id="btn-pagar-seleccion" class="btn btn-success"><i class="bi bi-credit-card"></i> Pagar seleccionados</button>
                        </div>
                    </div>
                ` : '';

                if (filtroActual === 'pago') {
                    const tienePago = pagoPendientes.length;
                    contenedor.innerHTML = tienePago ? `
                        <div class="mb-4">
                            <h4 class="mb-2">Pendientes de pago</h4>
                            ${pagoPendientes.length ? toolbar + pagoPendientes.join('') : '<div class="alert alert-info"><i class="bi bi-info-circle-fill me-2"></i>No tienes pagos pendientes.</div>'}
                        </div>
                    ` : '<div class="alert alert-info"><i class="bi bi-info-circle-fill me-2"></i>No tienes trámites de pago.</div>';
                } else {
                    contenedor.innerHTML = `
                        <div class="mb-4">
                            <h4 class="mb-2">Trámites gratuitos</h4>
                            ${gratisTramites.length ? gratisTramites.join('') : '<div class="alert alert-secondary"><i class="bi bi-gift me-2"></i>No hay trámites gratuitos.</div>'}
                        </div>
                    `;
                }

                const btnPago = document.getElementById('btn-filtro-pago');
                const btnGratis = document.getElementById('btn-filtro-gratis');
                if (btnPago && btnGratis) {
                    if (filtroActual === 'pago') {
                        btnPago.classList.add('active');
                        btnGratis.classList.remove('active');
                    } else {
                        btnGratis.classList.add('active');
                        btnPago.classList.remove('active');
                    }
                }
            }

            renderContenido();

            // Selección y resumen (solo sobre pendientes)
            let checkboxes = Array.from(document.querySelectorAll('.seleccionar-tramite'));
            let resumen = document.getElementById('resumen-seleccion');

            function actualizarResumen() {
                let total = 0;
                let count = 0;
                checkboxes.forEach(chk => {
                    if (chk.checked && !chk.disabled) {
                        count++;
                        total += parseFloat(chk.dataset.monto || 0);
                    }
                });
                if (resumen) resumen.textContent = `Seleccionados: ${count} • Total: ${formatearMoneda(total)}`;
            }

            function bindSeleccionEventos() {
                checkboxes.forEach(chk => {
                    chk.addEventListener('change', () => {
                        actualizarResumen();
                    });
                });
            }
            bindSeleccionEventos();
            const cancelarBtns = Array.from(document.querySelectorAll('.cancelar-pago'));
            if (cancelarBtns.length) {
                cancelarBtns.forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        e.preventDefault();
                        const idPago = parseInt(e.currentTarget.dataset.id);
                        try {
                            mostrarCargando(true);
                            await fetchAPI(`/pagos/${idPago}/ciudadano`, { method: 'DELETE' });
                            mostrarNotificacion('Pago cancelado.', 'success');
                            await cargarMisPagos(usuario);
                        } catch (err) {
                            const msg = (err && ((err.body && (err.body.message || err.body.error)) || err.message || err.status)) ? `No se pudo cancelar: ${(err.body && (err.body.message || err.body.error)) || err.message || err.status}` : 'No se pudo cancelar el pago';
                            mostrarNotificacion(msg, 'danger');
                        } finally {
                            mostrarCargando(false);
                        }
                    });
                });
            }

            let btnSelTodos = document.getElementById('seleccionar-todos');
            let btnDesTodos = document.getElementById('deseleccionar-todos');
            let btnPagarSel = document.getElementById('btn-pagar-seleccion');
            let btnSimularSel = document.getElementById('btn-simular-seleccion');

            if (btnSelTodos) {
                btnSelTodos.addEventListener('click', () => {
                    checkboxes.forEach(chk => { if (!chk.disabled) chk.checked = true; });
                    actualizarResumen();
                });
            }

            if (btnDesTodos) {
                btnDesTodos.addEventListener('click', () => {
                    checkboxes.forEach(chk => { chk.checked = false; });
                    actualizarResumen();
                });
            }

            if (btnPagarSel) {
                btnPagarSel.addEventListener('click', async () => {
                    try {
                        const seleccionados = checkboxes
                            .filter(chk => chk.checked && !chk.disabled)
                            .map(chk => ({ id: parseInt(chk.dataset.id), codigo: chk.dataset.codigo || null, monto: parseFloat(chk.dataset.monto || 0) }));

                        if (seleccionados.length === 0) {
                            mostrarNotificacion('Seleccione al menos un trámite para pagar', 'warning');
                            return;
                        }

                        // Construir items para Mercado Pago
                        const items = seleccionados.map(sel => {
                            const t = Array.isArray(tramites) ? tramites.find(tr => tr.id === sel.id) : null;
                            const titulo = t ? (t.titulo || 'Trámite') : 'Trámite';
                            const tipoNombre = t ? obtenerNombreTipoTramite(t.tipo) : 'Trámite';
                            const codigo = t?.codigo || sel.id;
                            return {
                                id: sel.id,
                                title: `${tipoNombre} - ${titulo} (${codigo})`,
                                quantity: 1,
                                unit_price: sel.monto,
                                currency_id: 'CLP'
                            };
                        });

                        mostrarCargando(true);
                        const pref = await fetchAPI('/mercado-pago/preferencias', {
                            method: 'POST',
                            body: { items }
                        });

                        if (pref && pref.init_point) {
                            window.location.href = pref.init_point;
                        } else {
                            mostrarNotificacion('No se pudo obtener la URL de pago de Mercado Pago', 'danger');
                        }
                    } catch (error) {
                        console.error('Error al iniciar pago en Mercado Pago:', error);
                        mostrarNotificacion(`Error al iniciar pago: ${error.message}`, 'danger');
                    } finally {
                        mostrarCargando(false);
                    }
                });
            }

            if (btnSimularSel) {
                btnSimularSel.addEventListener('click', async () => {
                    try {
                        const seleccionados = checkboxes
                            .filter(chk => chk.checked && !chk.disabled)
                            .map(chk => ({ id: parseInt(chk.dataset.id), monto: parseFloat(chk.dataset.monto || 0) }));

                        if (seleccionados.length === 0) {
                            mostrarNotificacion('Seleccione al menos un trámite para simular pago', 'warning');
                            return;
                        }

                        mostrarCargando(true);
                        const resultados = [];

                for (const sel of seleccionados) {
                            const tramite = Array.isArray(tramites) ? tramites.find(tr => tr.id === sel.id) : null;
                            if (!(parseFloat(sel.monto || 0) > 0)) {
                                resultados.push({ ok: false, id: sel.id, error: 'Monto inválido para simulación' });
                                continue;
                            }

                            let tidReal = sel.id;
                            if (!tramite || typeof tramite.id !== 'number') {
                                try {
                                    const codigo = sel.codigo || (tramite && tramite.codigo) || String(sel.id);
                                    const respBus = await fetchAPI(`/tramites?search=${encodeURIComponent(codigo)}&ciudadanoId=${ciudadanoId}`);
                                    const listaBus = Array.isArray(respBus?.tramites) ? respBus.tramites : (Array.isArray(respBus) ? respBus : []);
                                    const match = listaBus.find(x => x.codigo === codigo) || listaBus[0];
                                    if (match && match.id) tidReal = match.id;
                                } catch (_) {}
                            }

                            // Consultar el trámite en backend para obtener el monto oficial y requerimiento de pago
                            let montoParaPago = parseFloat(sel.monto || 0);
                            try {
                                const det = await fetchAPI(`/tramites/${tidReal}`);
                                const montoBackend = parseFloat(det?.monto || 0);
                                const requiereBackend = !!det?.requiere_pago;
                                if (requiereBackend && montoBackend > 0) {
                                    montoParaPago = montoBackend;
                                }
                            } catch (_) {
                                // Si no se pudo consultar, se mantiene el monto de selección
                            }
                            if (!(montoParaPago > 0)) {
                                resultados.push({ ok: false, id: sel.id, error: 'El trámite no tiene monto válido en el sistema' });
                                continue;
                            }

                            let pago = pagosPorTramite.get(tidReal);
                            if (!pago) {
                                try {
                                    const creado = await fetchAPI('/pagos', {
                                        method: 'POST',
                                        body: {
                                            monto: montoParaPago,
                                            metodo_pago: 'otro',
                                            referencia_externa: `SIM-${Date.now()}-${sel.id}`,
                                            notas: 'Pago simulado desde portal ciudadano',
                                            tramite_id: tidReal,
                                            ciudadano_id: ciudadanoId
                                        }
                                    });
                                    pago = (creado && (creado.pago || creado)) || null;
                                    if (pago) pagosPorTramite.set(tidReal, pago);
                                } catch (e) {
                                    resultados.push({ ok: false, id: sel.id, error: e.message, status: e.status, body: e.body });
                                    continue;
                                }
                            }

                            try {
                                await fetchAPI(`/pagos/${pago.id}/procesar`, {
                                    method: 'PUT',
                                    body: {
                                        metodoPago: 'otro',
                                        referencia: `SIM-${Date.now()}-${sel.id}`,
                                        observaciones: 'Pago simulado desde portal ciudadano',
                                        fechaPago: new Date().toISOString()
                                    }
                                });
                                resultados.push({ ok: true, id: sel.id });
                            } catch (e2) {
                                resultados.push({ ok: false, id: sel.id, error: e2.message, status: e2.status, body: e2.body });
                            }
                        }

                        const ok = resultados.filter(r => r.ok).length;
                        const fail = resultados.length - ok;
                        mostrarNotificacion(`Pagos simulados: ${ok}. Fallidos: ${fail}.`, ok ? 'success' : 'danger');
                        try {
                            const debugContainerId = 'debug-simulacion-pagos';
                            let dbg = document.getElementById(debugContainerId);
                            const detalle = resultados.map(r => {
                                const t = Array.isArray(tramites) ? tramites.find(tr => tr.id === r.id) : null;
                                const codigo = t?.codigo || r.id;
                                const titulo = t?.titulo || 'Trámite';
                                const tipo = t ? obtenerNombreTipoTramite(t.tipo) : 'Trámite';
                                const estado = r.ok ? 'OK' : 'FALLÓ';
                                const causa = (r && (r.error || (r.body && (r.body.message || r.body.error)) || '')) || '';
                                const detalleBody = r && r.body ? JSON.stringify(r.body) : '';
                                return `<tr>
                                    <td>${codigo}</td>
                                    <td>${tipo} - ${titulo}</td>
                                    <td>${estado}</td>
                                    <td class="text-muted small">${causa}${detalleBody ? `<br><code class="small">${detalleBody}</code>` : ''}</td>
                                </tr>`;
                            }).join('');
                            const htmlDbg = `
                                <div class="card border-danger mb-3">
                                    <div class="card-header d-flex justify-content-between align-items-center">
                                        <span><i class="bi bi-bug-fill me-2"></i>Detalle de simulación de pagos</span>
                                        <button class="btn btn-sm btn-outline-secondary" id="cerrar-debug-simulacion">Ocultar</button>
                                    </div>
                                    <div class="card-body">
                                        <div class="table-responsive">
                                            <table class="table table-sm">
                                                <thead>
                                                    <tr>
                                                        <th>Código</th>
                                                        <th>Trámite</th>
                                                        <th>Resultado</th>
                                                        <th>Mensaje</th>
                                                    </tr>
                                                </thead>
                                                <tbody>${detalle || '<tr><td colspan="4" class="text-muted">Sin detalles</td></tr>'}</tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            `;
                            if (!dbg) {
                                dbg = document.createElement('div');
                                dbg.id = debugContainerId;
                                const contenedor = document.getElementById('contenedor-pagos');
                                if (contenedor) contenedor.prepend(dbg);
                            }
                            if (dbg) dbg.innerHTML = htmlDbg;
                            const cerrarBtn = document.getElementById('cerrar-debug-simulacion');
                            if (cerrarBtn) cerrarBtn.addEventListener('click', () => {
                                const el = document.getElementById(debugContainerId);
                                if (el) el.remove();
                            });
                            console.group('[SIMULACION PAGOS]');
                            resultados.forEach(r => console.log('Resultado', r));
                            console.groupEnd();
                        } catch (e) { console.warn('No se pudo renderizar el debug de simulación', e); }
                        await cargarMisPagos(usuario);
                    } catch (error) {
                        console.error('Error al simular pagos seleccionados:', error);
                        mostrarNotificacion(`Error al simular pago: ${error.message}`, 'danger');
                    } finally {
                        mostrarCargando(false);
                    }
                });
            }

            const btnFiltroPago = document.getElementById('btn-filtro-pago');
            const btnFiltroGratis = document.getElementById('btn-filtro-gratis');
            if (btnFiltroPago) {
                btnFiltroPago.addEventListener('click', (e) => {
                    e.preventDefault();
                    filtroActual = 'pago';
                    renderContenido();
                    checkboxes = Array.from(document.querySelectorAll('.seleccionar-tramite'));
                    resumen = document.getElementById('resumen-seleccion');
                    btnSelTodos = document.getElementById('seleccionar-todos');
                    btnDesTodos = document.getElementById('deseleccionar-todos');
                    btnPagarSel = document.getElementById('btn-pagar-seleccion');
                    btnSimularSel = document.getElementById('btn-simular-seleccion');
                    actualizarResumen();
                    bindSeleccionEventos();
                });
            }
            if (btnFiltroGratis) {
                btnFiltroGratis.addEventListener('click', (e) => {
                    e.preventDefault();
                    filtroActual = 'gratis';
                    renderContenido();
                    checkboxes = Array.from(document.querySelectorAll('.seleccionar-tramite'));
                    resumen = document.getElementById('resumen-seleccion');
                    btnSelTodos = document.getElementById('seleccionar-todos');
                    btnDesTodos = document.getElementById('deseleccionar-todos');
                    btnPagarSel = document.getElementById('btn-pagar-seleccion');
                    btnSimularSel = document.getElementById('btn-simular-seleccion');
                });
            }
        }

        // Volver al portal
        const volverPortal = document.getElementById('volver-portal');
        if (volverPortal) {
            volverPortal.addEventListener('click', (e) => {
                e.preventDefault();
                cargarPortalCiudadano(usuario);
            });
        }
        const btnVolverPortal = document.getElementById('btn-volver-portal');
        if (btnVolverPortal) {
            btnVolverPortal.addEventListener('click', (e) => {
                e.preventDefault();
                cargarPortalCiudadano(usuario);
            });
        }

        // Ir a vista de pagos realizados
        const btnVerRealizados = document.getElementById('btn-ver-pagos-realizados');
        if (btnVerRealizados) {
            btnVerRealizados.addEventListener('click', (e) => {
                e.preventDefault();
                cargarPagosRealizados(usuario);
            });
        }
    } catch (error) {
        console.error('Error al cargar Mis Pagos:', error);
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="container py-4">
                    <div class="row">
                        <div class="col-12">
                            <nav aria-label="breadcrumb">
                                <ol class="breadcrumb">
                                    <li class="breadcrumb-item"><a href="#" id="volver-portal">Portal Ciudadano</a></li>
                                    <li class="breadcrumb-item active">Mis Pagos</li>
                                </ol>
                            </nav>
                            <h2 class="mb-4">Mis Pagos</h2>
                            <div class="alert alert-danger">Error al cargar pagos: ${error.message}</div>
                        </div>
                    </div>
                </div>
            `;
        }
    } finally {
        mostrarCargando(false);
    }
}

// Nueva vista: Pagos realizados y trámites gratuitos
async function cargarPagosRealizados(usuario) {
    try {
        mostrarCargando(true);
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;

        // Asegurar perfil de usuario
        if (!usuario || !usuario.id) {
            try {
                const perfil = await fetchAPI('/usuarios/perfil');
                if (perfil && perfil.id) usuario = perfil;
            } catch (e) {
                console.warn('No se pudo obtener el perfil del usuario', e);
            }
        }
        const ciudadanoId = usuario?.id;

        // Helper local: configuración de pago
        const obtenerConfiguracionPagoPorNombreLocal = async (nombre) => {
            try {
                const norm = (nombre || '').toLowerCase();
                let clave = 'otro';
                if (norm.includes('licencia')) clave = 'licencia';
                else if (norm.includes('permiso')) clave = 'permiso';
                else if (norm.includes('certificado') || norm.includes('construcción') || norm.includes('construccion')) clave = 'certificado';
                else if (norm.includes('solicitud')) clave = 'solicitud';

                const precios = {
                    'solicitudes de becas municipales': 0,
                    'solicitud de traslado de establecimiento': 0,
                    'reclamos y revisiones de casos de convivencia escolar': 0,
                    'solicitud de cambio de consultorio': 0,
                    'solicitud de inscripción de consultorio': 0,
                    'solicitud de ayuda técnica': 1000,
                    'reclamos por centro de salud': 0,
                    'certificado de construcción de obras': 500000,
                    'regularización de viviendas': 200000,
                    'denuncias por obras ilegales': 0,
                    'solicitud de rondas preventivas': 0,
                    'instalación de cámaras o alarmas comunitarias': 20000,
                    'charlas de seguridad': 0,
                    'rectificación de datos o errores en licencias': 3000,
                    'permiso de circulación': 25000
                };
                const precioLocal = precios[norm] ?? null;
                if (precioLocal !== null && precioLocal > 0) {
                    return { requiere: true, tipo: 'fijo', montoFijo: precioLocal };
                }

                const resp = await fetchAPI(`/tramites/configuracion-pago?tramite_nombre=${encodeURIComponent(clave)}&estado=activo&order=DESC`);
                const data = Array.isArray(resp?.configuraciones)
                    ? resp.configuraciones
                    : (Array.isArray(resp?.data) ? resp.data : (Array.isArray(resp) ? resp : []));
                if (!data.length) {
                    const precio = precioLocal;
                    if (precio !== null) return { requiere: precio > 0, tipo: precio > 0 ? 'fijo' : 'gratis', montoFijo: precio };
                    if (norm.includes('solicitud') && norm.includes('ayuda') && (norm.includes('técnica') || norm.includes('tecnica'))) return { requiere: true, tipo: 'fijo', montoFijo: 1000 };
                    return { requiere: false, tipo: 'gratis' };
                }

                const fijo = data.find(c => c.modalidad === 'fijo' && c.estado === 'activo');
                if (fijo) return { requiere: true, tipo: 'fijo', montoFijo: parseFloat(fijo.monto_fijo || 0), anio: fijo.anio };

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
        };

        // Obtener trámites y pagos
        const tramites = await obtenerTramitesUsuarioAPI(ciudadanoId);

        const pagosPorTramite = new Map();
        try {
            const respPagos = await fetchAPI(`/pagos?ciudadanoId=${ciudadanoId}`);
            const pagos = Array.isArray(respPagos) ? respPagos : (respPagos.pagos || []);
            pagos.forEach(p => {
                const tid = p.tramite_id ?? p.tramiteId;
                if (tid) pagosPorTramite.set(tid, p);
            });
        } catch (e) {
            console.warn('No se pudieron obtener pagos del ciudadano', e);
        }

        // Render layout base
        mainContent.innerHTML = `
            <div class="container py-4">
                <div class="row">
                    <div class="col-12">
                        <nav aria-label="breadcrumb">
                            <ol class="breadcrumb">
                                <li class="breadcrumb-item"><a href="#" id="volver-mis-pagos">Mis Pagos</a></li>
                                <li class="breadcrumb-item active">Pagos realizados</li>
                            </ol>
                        </nav>
                        <div class="d-flex justify-content-between align-items-center mb-4">
                            <h2 class="mb-0">Pagos realizados</h2>
                            <button id="btn-volver-mis-pagos" class="btn btn-outline-secondary">
                                <i class="bi bi-arrow-left"></i> Volver a Mis Pagos
                            </button>
                        </div>
                        <div id="contenedor-realizados"></div>
                    </div>
                </div>
            </div>
        `;

        const contenedor = document.getElementById('contenedor-realizados');
        if (!tramites || tramites.length === 0) {
            contenedor.innerHTML = `<div class="alert alert-secondary"><i class="bi bi-check2-circle me-2"></i>No hay pagos realizados ni trámites gratuitos.</div>`;
        } else {
            const tarjetas = [];
            await Promise.all(tramites.map(async (t) => {
                const tipoNombre = (t && typeof t.tipo === 'object' && t.tipo?.nombre) ? t.tipo.nombre : String(t.tipo || '');
                const config = await obtenerConfiguracionPagoPorNombreLocal(tipoNombre);
                const pagoExistente = pagosPorTramite.get(t.id);
                const estadoPago = pagoExistente?.estado || 'sin_pago';
                const requiere = !!t.requiere_pago || !!(config && config.requiere === true);
                let montoTramite = parseFloat(t.monto || 0);
                if (montoTramite <= 0 && config && config.tipo === 'fijo' && parseFloat(config.montoFijo || 0) > 0) {
                    montoTramite = parseFloat(config.montoFijo || 0);
                }
                const esGratis = !requiere;

                if (estadoPago === 'completado' || esGratis) {
                    const estadoBadge = estadoPago === 'completado'
                        ? '<span class="badge bg-success">Pago completado</span>'
                        : '<span class="badge bg-info">Gratis</span>';

                    const moduloHtml = estadoPago === 'completado'
                        ? `<div class="d-flex flex-column gap-2">
                               <div class="alert alert-success mb-0"><i class="bi bi-check-circle-fill"></i> Pago completado</div>
                               <div>
                                 <button class="btn btn-secondary btn-sm" onclick="descargarComprobantePago(${pagoExistente.id})">
                                   <i class="bi bi-download"></i> Descargar boleta
                                 </button>
                               </div>
                           </div>`
                        : `<div class="d-flex flex-column gap-2">
                               <div class="alert alert-secondary mb-0"><i class="bi bi-info-circle me-2"></i>Este trámite es gratuito <span class="badge bg-info ms-2">Gratis</span>.</div>
                               <div>
                                 <button class="btn btn-secondary btn-sm" onclick="descargarConstanciaTramite(${t.id})">
                                   <i class="bi bi-download"></i> Descargar boleta
                                 </button>
                               </div>
                           </div>`;

                    tarjetas.push(`
                        <div class="card shadow-sm mb-3" id="card-tramite-${t.id}">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-start mb-2">
                                    <div>
                                        <h5 class="mb-1">${obtenerNombreTipoTramite(t.tipo)} - ${t.titulo || 'Trámite'}</h5>
                                        <div class="text-muted small">Código: ${t.codigo} • Estado: ${obtenerNombreEstadoTramite(t.estado)} • ${estadoBadge}</div>
                                    </div>
                                </div>
                                ${moduloHtml}
                            </div>
                        </div>
                    `);
                }
            }));
            contenedor.innerHTML = tarjetas.length
                ? tarjetas.join('')
                : `<div class="alert alert-secondary"><i class="bi bi-check2-circle me-2"></i>No hay pagos realizados ni trámites gratuitos para mostrar.</div>`;
        }

        // Navegación
        const btnVolverMisPagos = document.getElementById('btn-volver-mis-pagos');
        if (btnVolverMisPagos) {
            btnVolverMisPagos.addEventListener('click', (e) => {
                e.preventDefault();
                cargarMisPagos(usuario);
            });
        }
        const volverMisPagosCrumb = document.getElementById('volver-mis-pagos');
        if (volverMisPagosCrumb) {
            volverMisPagosCrumb.addEventListener('click', (e) => {
                e.preventDefault();
                cargarMisPagos(usuario);
            });
        }
    } catch (error) {
        console.error('Error al cargar Pagos realizados:', error);
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="container py-4">
                    <div class="row">
                        <div class="col-12">
                            <nav aria-label="breadcrumb">
                                <ol class="breadcrumb">
                                    <li class="breadcrumb-item"><a href="#" id="volver-mis-pagos">Mis Pagos</a></li>
                                    <li class="breadcrumb-item active">Pagos realizados</li>
                                </ol>
                            </nav>
                            <h2 class="mb-4">Pagos realizados</h2>
                            <div class="alert alert-danger">Error al cargar: ${error.message}</div>
                        </div>
                    </div>
                </div>
            `;
        }
    } finally {
        mostrarCargando(false);
    }
}

/**
 * Maneja el envío del formulario de registro
 * @param {Event} event - Evento del formulario
 */
async function manejarRegistro(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);

    // Obtener region/comuna crudos
    const regionRaw = formData.get('region_id');
    const comunaRaw = formData.get('comuna_id');
    
    // Obtener datos del formulario
    const datosRegistro = {
        primer_nombre: formData.get('primer_nombre'),
        segundo_nombre: formData.get('segundo_nombre'),
        apellido_paterno: formData.get('apellido_paterno'),
        apellido_materno: formData.get('apellido_materno'),
        rut: formData.get('rut'),
        telefono: formData.get('telefono'),
        email: formData.get('email'),
        direccion: formData.get('direccion'),
        region_id: regionRaw ? Number(regionRaw) : null,
        comuna_id: comunaRaw ? Number(comunaRaw) : null,
        password: (formData.get('password') || '').trim(),
        confirm_password: (formData.get('confirm_password') || '').trim()
    };
    
    // Validación de campos requeridos con feedback por campo (ahora con region/comuna)
    const camposRequeridos = ['primer_nombre','apellido_paterno','apellido_materno','rut','telefono','email','direccion','region_id','comuna_id','password','confirm_password'];
    let hayInvalidos = false;
    camposRequeridos.forEach(name => {
        const input = form.querySelector(`[name="${name}"]`);
        if (input) {
            limpiarCampoInvalido(input);
            const valor = (formData.get(name) || '').toString().trim();
            if (!valor) {
                marcarCampoInvalido(input, 'Este campo es obligatorio');
                hayInvalidos = true;
            }
        }
    });
    if (hayInvalidos) {
        mostrarError('Completa los campos obligatorios marcados en rojo');
        return;
    }
    
    // Validación de complejidad de contraseña
    if (!validarPasswordFuerte(datosRegistro.password)) {
        mostrarError('La contraseña debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas, números y un carácter especial.');
        return;
    }

    // Validar que las contraseñas coincidan
    if (datosRegistro.password !== datosRegistro.confirm_password) {
        mostrarError('Las contraseñas no coinciden');
        return;
    }
    
    // Normalizar y validar RUT
    datosRegistro.rut = normalizarRUT(datosRegistro.rut || '');
    if (!validarRUT(datosRegistro.rut)) {
        const inputRut = form.querySelector('[name="rut"]');
        if (inputRut) marcarCampoInvalido(inputRut, 'El RUT ingresado no es válido');
        mostrarError('El RUT ingresado no es válido');
        return;
    }

    // Asegurar que region y comuna estén seleccionadas
    if (!datosRegistro.region_id) {
        const sel = form.querySelector('[name="region_id"]');
        if (sel) marcarCampoInvalido(sel, 'Selecciona una región');
        mostrarError('Selecciona región y comuna');
        return;
    }
    if (!datosRegistro.comuna_id) {
        const sel = form.querySelector('[name="comuna_id"]');
        if (sel) marcarCampoInvalido(sel, 'Selecciona una comuna');
        mostrarError('Selecciona región y comuna');
        return;
    }
    
    try {
        // Mostrar indicador de carga
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Registrando...';
        
        // Realizar petición de registro
        const response = await fetchAPI('/ciudadanos/register', {
            method: 'POST',
            body: datosRegistro
        });
        
        if (response.success) {
            mostrarExito('¡Registro exitoso! Ya puedes iniciar sesión con tu cuenta.');
            form.reset();
            // Mostrar formulario de login después de 2 segundos
            setTimeout(() => {
                mostrarFormularioLogin();
            }, 2000);
        } else {
            mostrarError(response.message || 'Error en el registro');
        }
        
        // Restaurar botón
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        
    } catch (error) {
        console.error('Error en registro:', error);
        mostrarError('Error al procesar el registro. Intenta nuevamente.');
        
        // Restaurar botón en caso de error
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Registrarse';
        }
    }
}

/**
 * Muestra el formulario de registro y oculta el de login
 */
function mostrarFormularioRegistro() {
    const loginContainer = document.getElementById('login-container');
    const registerContainer = document.getElementById('register-container');
    
    if (loginContainer && registerContainer) {
        loginContainer.classList.add('d-none');
        registerContainer.classList.remove('d-none');
    }

    // Cargar regiones y comunas para el formulario de registro
    cargarRegionesRegistro().catch(err => {
        console.warn('No se pudieron cargar regiones para el registro:', err);
    });
}

/**
 * Carga regiones en el select de registro y configura el cambio para cargar comunas
 */
async function cargarRegionesRegistro() {
    const regionSelect = document.querySelector('[name="region_id"]');
    const comunaSelect = document.querySelector('[name="comuna_id"]');
    if (!regionSelect) return;

    regionSelect.innerHTML = '<option value="">Cargando regiones...</option>';
    try {
        const regionesResp = await fetchAPI('/geografia/regiones');
        const regiones = regionesResp.regiones || regionesResp || [];

        regionSelect.innerHTML = '<option value="">Seleccione una región</option>' +
            regiones.map(r => `<option value="${r.id}">${r.nombre}</option>`).join('');

        // Reemplazar handler para evitar múltiples listeners
        regionSelect.onchange = async (e) => {
            const regionId = e.target.value;
            await cargarComunasRegistro(regionId);
        };

        // Cargar comunas para la región seleccionada si aplica
        const selectedRegion = regionSelect.value || '';
        await cargarComunasRegistro(selectedRegion);
    } catch (error) {
        console.error('Error cargando regiones para registro:', error);
        mostrarNotificacion('No se pudieron cargar regiones', 'warning');
        regionSelect.innerHTML = '<option value="">No disponibles</option>';
        if (comunaSelect) comunaSelect.innerHTML = '<option value="">No disponibles</option>';
    }
}

/**
 * Carga comunas en el select de registro según la región
 */
async function cargarComunasRegistro(regionId) {
    const comunaSelect = document.querySelector('[name="comuna_id"]');
    if (!comunaSelect) return;
    if (!regionId) {
        comunaSelect.innerHTML = '<option value="">Seleccione una comuna</option>';
        return;
    }

    comunaSelect.innerHTML = '<option value="">Cargando comunas...</option>';
    try {
        const comunasResp = await fetchAPI(`/geografia/regiones/${regionId}/comunas`);
        const comunas = comunasResp.comunas || comunasResp || [];
        comunaSelect.innerHTML = '<option value="">Seleccione una comuna</option>' +
            comunas.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
    } catch (error) {
        console.error('Error cargando comunas para registro:', error);
        mostrarNotificacion('No se pudieron cargar comunas', 'warning');
        comunaSelect.innerHTML = '<option value="">No disponibles</option>';
    }
}

/**
 * Valida un RUT chileno
 * @param {string} rut - RUT a validar
 * @returns {boolean} - True si es válido
 */
function validarRUT(rut) {
    if (!rut || typeof rut !== 'string') return false;
    // Normalizar a formato sin puntos y con guión
    const normalizado = normalizarRUT(rut);
    // Exigir exactamente 8 dígitos + guión + DV (0-9 o K)
    if (!/^\d{8}-[\dK]$/.test(normalizado)) return false;
    const [numero, dv] = normalizado.split('-');
    return calcularDV(numero) === dv;
}

// Calcula el dígito verificador con algoritmo módulo 11
function calcularDV(numeroStr) {
    let suma = 0;
    let multiplicador = 2;
    for (let i = numeroStr.length - 1; i >= 0; i--) {
        suma += parseInt(numeroStr[i], 10) * multiplicador;
        multiplicador = multiplicador === 7 ? 2 : (multiplicador + 1);
    }
    const resto = suma % 11;
    const dvCalculado = resto === 0 ? '0' : resto === 1 ? 'K' : (11 - resto).toString();
    return dvCalculado;
}

/**
 * Valida que una contraseña cumpla requisitos mínimos de seguridad
 * - Al menos 8 caracteres
 * - Incluye mayúsculas, minúsculas, números y un carácter especial
 */
function validarPasswordFuerte(password) {
    // Reglas: al menos una minúscula, una mayúscula, un número y un carácter especial de este conjunto: @ $ ! % * ? & #
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#]).{8,}$/;
    return regex.test(password || '');
}

// Helpers de feedback por campo
function marcarCampoInvalido(input, mensaje) {
    input.classList.add('is-invalid');
    // No duplicar feedback
    let fb = input.parentElement.querySelector('.invalid-feedback');
    if (!fb) {
        fb = document.createElement('div');
        fb.className = 'invalid-feedback';
        input.parentElement.appendChild(fb);
    }
    fb.textContent = mensaje || 'Campo inválido';
}

function limpiarCampoInvalido(input) {
    input.classList.remove('is-invalid');
    const fb = input.parentElement.querySelector('.invalid-feedback');
    if (fb) fb.remove();
}

/**
 * Formatea un RUT agregando puntos y guión
 * @param {string} rut - RUT sin formato
 * @returns {string} - RUT formateado
 */
function formatearRUT(rut) {
    // Mantener formato sin puntos como se indica en el placeholder
    return normalizarRUT(rut || '');
}

// Normaliza un RUT: sin puntos, guión antes del DV, DV en mayúscula
function normalizarRUT(rut) {
    const limpio = (rut || '')
        .replace(/\./g, '')
        .replace(/[^0-9kK]/g, '')
        .toUpperCase();
    if (limpio.length < 2) return limpio;
    const numero = limpio.slice(0, -1);
    const dv = limpio.slice(-1);
    return `${numero}-${dv}`;
}

/**
 * Muestra un mensaje de error
 * @param {string} mensaje - Mensaje a mostrar
 */
function mostrarError(mensaje) {
    // Remover alertas existentes
    const alertasExistentes = document.querySelectorAll('.alert');
    alertasExistentes.forEach(alerta => alerta.remove());
    
    // Crear nueva alerta
    const alerta = document.createElement('div');
    alerta.className = 'alert alert-danger alert-dismissible fade show';
    alerta.innerHTML = `
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Insertar antes del formulario activo
    const formularioActivo = document.querySelector('#login-container:not(.d-none), #register-container:not(.d-none)');
    if (formularioActivo) {
        formularioActivo.insertBefore(alerta, formularioActivo.firstChild);
    }
}

/**
 * Muestra un mensaje de éxito
 * @param {string} mensaje - Mensaje a mostrar
 */
function mostrarExito(mensaje) {
    // Remover alertas existentes
    const alertasExistentes = document.querySelectorAll('.alert');
    alertasExistentes.forEach(alerta => alerta.remove());
    
    // Crear nueva alerta
    const alerta = document.createElement('div');
    alerta.className = 'alert alert-success alert-dismissible fade show';
    alerta.innerHTML = `
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Insertar antes del formulario activo
    const formularioActivo = document.querySelector('#login-container:not(.d-none), #register-container:not(.d-none)');
    if (formularioActivo) {
        formularioActivo.insertBefore(alerta, formularioActivo.firstChild);
    }
}

// Modal para detalle de trámite
function crearModalDetalleTramite() {
    if (document.getElementById('modal-detalle-tramite')) return;
    const modalHtml = `
<div class="modal fade" id="modal-detalle-tramite" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-lg modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header bg-primary text-white">
        <h5 class="modal-title"><i class="bi bi-eye"></i> Detalle del Trámite</h5>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Cerrar"></button>
      </div>
      <div class="modal-body">
        <div id="detalle-tramite-loader" class="d-flex align-items-center justify-content-center py-5">
          <div class="spinner-border text-primary" role="status"></div>
          <span class="ms-2">Cargando detalle...</span>
        </div>
        <div id="detalle-tramite-contenido" class="d-none"></div>
        <div id="detalle-tramite-error" class="alert alert-danger d-none"></div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cerrar</button>
        <button type="button" class="btn btn-primary" id="btn-ver-completo">
          <i class="bi bi-box-arrow-up-right"></i> Ver completo
        </button>
      </div>
    </div>
  </div>
</div>`;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

async function mostrarDetalleTramiteModal(tramiteId) {
    try {
        crearModalDetalleTramite();

        // Asegurar que el overlay global de carga no bloquee el modal
        try { if (typeof mostrarCargando === 'function') mostrarCargando(false); } catch (_) {}

        const modalEl = document.getElementById('modal-detalle-tramite');
        const modal = new bootstrap.Modal(modalEl);
        const loader = document.getElementById('detalle-tramite-loader');
        const contenido = document.getElementById('detalle-tramite-contenido');
        const errorBox = document.getElementById('detalle-tramite-error');

        errorBox.classList.add('d-none');
        contenido.classList.add('d-none');
        loader.classList.remove('d-none');
        modal.show();

        let tramite;
        let esLocalFallback = false;
        try {
            tramite = await fetchAPI(`/tramites/${tramiteId}`, { suppressErrorLog: true });
        } catch (e) {
            try {
                const locales = obtenerTramites();
                tramite = locales.find(t => String(t.id) === String(tramiteId));
                esLocalFallback = !!tramite;
            } catch (_) {
                tramite = null;
            }
        }

        if (!tramite) {
            throw new Error('Trámite no disponible');
        }

        const badgeEstado = `<span class="badge estado-${tramite.estado}">${tramite.estado}</span>`;
        const fechaSol = formatearFecha(tramite.fecha_solicitud);
        const fechaAct = formatearFecha(tramite.fecha_actualizacion || tramite.fecha_solicitud);
        let nombreDepartamento = tramite.Departamento?.nombre || tramite.departamento?.nombre || null;
        if (!nombreDepartamento && tramite.departamento_id) {
            try {
                const dep = await fetchAPI(`/departamentos/${tramite.departamento_id}`, { suppressErrorLog: true });
                nombreDepartamento = dep?.nombre || dep?.nombre_departamento || null;
            } catch (_) {}
        }

        contenido.innerHTML = `
      <div class="row g-3">
        <div class="col-md-8">
          <h5 class="mb-1">${tramite.titulo || 'Trámite sin título'}</h5>
          <div class="text-muted">Código: ${tramite.codigo || '-'}</div>
        </div>
        <div class="col-md-4 text-md-end">
          ${badgeEstado}
        </div>
        <div class="col-12">
          <hr>
        </div>
        <div class="col-md-6">
          <div class="small text-muted">Tipo</div>
          <div class="fw-semibold">${tramite.tipo || '-'}</div>
        </div>
        <div class="col-md-6">
          <div class="small text-muted">Departamento</div>
          <div class="fw-semibold">${nombreDepartamento || '-'}</div>
        </div>
        <div class="col-md-6">
          <div class="small text-muted">Fecha de solicitud</div>
          <div class="fw-semibold">${fechaSol || '-'}</div>
        </div>
        <div class="col-md-6">
          <div class="small text-muted">Última actualización</div>
          <div class="fw-semibold">${fechaAct || '-'}</div>
        </div>
        ${tramite.descripcion ? `
          <div class="col-12">
            <div class="small text-muted">Descripción</div>
            <div>${tramite.descripcion}</div>
          </div>` : ''}
        <div class="col-12">
          <div class="small text-muted">Observaciones</div>
          <div>${tramite.observaciones || 'Sin observaciones'}</div>
        </div>
      </div>
    `;

        loader.classList.add('d-none');
        contenido.classList.remove('d-none');

        const btnVerCompleto = document.getElementById('btn-ver-completo');
        if (btnVerCompleto) {
            btnVerCompleto.onclick = () => {
                try {
                    if (!esLocalFallback && typeof verDetalleTramiteCiudadano === 'function') {
                        verDetalleTramiteCiudadano(tramiteId);
                    } else if (!esLocalFallback && typeof verDetalleTramite === 'function') {
                        verDetalleTramite(tramiteId);
                    } else if (typeof cargarMisTramites === 'function') {
                        const usuario = obtenerUsuario();
                        cargarMisTramites(usuario);
                    }
                } finally {
                    const instance = bootstrap.Modal.getInstance(modalEl);
                    if (instance) instance.hide();
                }
            };
        }
    } catch (err) {
        const loader = document.getElementById('detalle-tramite-loader');
        const contenido = document.getElementById('detalle-tramite-contenido');
        const errorBox = document.getElementById('detalle-tramite-error');

        if (loader) loader.classList.add('d-none');
        if (contenido) contenido.classList.add('d-none');
        if (errorBox) {
            errorBox.textContent = 'No se pudo cargar el detalle del trámite.';
            errorBox.classList.remove('d-none');
        }
    }
}
function limpiarFondoLogin() {
    try {
        if (window.__loginBgInterval) { clearInterval(window.__loginBgInterval); window.__loginBgInterval = null; }
        const bg1 = document.getElementById('login-bg');
        const bg2 = document.getElementById('login-bg2');
        if (bg1) { bg1.classList.remove('active'); bg1.style.backgroundImage = ''; }
        if (bg2) { bg2.classList.remove('active'); bg2.style.backgroundImage = ''; }
        document.body.style.backgroundImage = '';
        document.body.style.backgroundRepeat = '';
        document.body.style.backgroundPosition = '';
        document.body.style.backgroundSize = '';
    } catch (_) {}
}

function confirmarCerrarSesion() {
    try {
        const modalEl = document.getElementById('logoutModal');
        if (!modalEl) { cerrarSesion(); return; }
        const txt = document.getElementById('logoutModalText');
        const user = obtenerUsuario();
        if (txt && user) {
            const nombre = `${user.nombre || ''} ${user.apellido || ''}`.trim();
            const correo = user.email || '';
            txt.innerHTML = `¿Deseas cerrar sesión de <strong>${nombre || 'usuario'}</strong> <span class="text-muted">${correo}</span>?`;
        }
        const modal = typeof bootstrap !== 'undefined' ? new bootstrap.Modal(modalEl) : null;
        try {
            modalEl.addEventListener('hidden.bs.modal', () => {
                try {
                    document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
                    document.body.classList.remove('modal-open');
                    document.body.style.overflow = '';
                } catch (_) {}
                try {
                    const navOverlay = document.getElementById('nav-overlay');
                    const mainNavbar = document.getElementById('main-navbar');
                    if (navOverlay) navOverlay.classList.remove('active');
                    if (mainNavbar) mainNavbar.classList.remove('active');
                } catch (_) {}
                try { mostrarCargando(false); } catch (_) {}
            }, { once: true });
        } catch (_) {}
        if (modal) modal.show();
        const confirmBtn = document.getElementById('confirm-logout');
        if (confirmBtn) {
            confirmBtn.onclick = () => cerrarSesion();
        }
        const cancelBtn = modalEl.querySelector('[data-bs-dismiss="modal"]');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                try {
                    document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
                    document.body.classList.remove('modal-open');
                    document.body.style.overflow = '';
                } catch (_) {}
                try {
                    const navOverlay = document.getElementById('nav-overlay');
                    const mainNavbar = document.getElementById('main-navbar');
                    if (navOverlay) navOverlay.classList.remove('active');
                    if (mainNavbar) mainNavbar.classList.remove('active');
                } catch (_) {}
                try { mostrarCargando(false); } catch (_) {}
            }, { once: true });
        }
    } catch (_) { cerrarSesion(); }
}

// Eliminado: cookies por rol

function getUserCookieName(userId, role) {
    const id = String(userId || '').trim();
    const r = String(role || '').toLowerCase().replace(/\s+/g, '_');
    if (!id) return `corex_session_${r || 'usuario'}`;
    return `corex_session_user_${id}_${r || 'usuario'}`;
}

function setSessionToken(token, info) {
    try {
        if (typeof sessionStorage !== 'undefined') { sessionStorage.setItem('token', token); }
    } catch (_) {}
    try {
        const role = info && info.role;
        const userId = info && info.userId;
        const userName = getUserCookieName(userId, role);
        setCookie(userName, token, { days: 7, path: '/' });
        try { deleteCookie('corex_session_admin', '/panel-admin'); } catch (_) {}
        try { deleteCookie('corex_session_superadmin', '/panel-superadmin'); } catch (_) {}
        try { deleteCookie('corex_session_ciudadano', '/portal-ciudadano'); } catch (_) {}
    } catch (_) {}
}

function setCookie(name, value, { days = 7, path = '/' } = {}) {
    try {
        const d = new Date();
        d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = `expires=${d.toUTCString()}`;
        document.cookie = `${name}=${encodeURIComponent(value)}; ${expires}; path=${path}`;
    } catch (_) {}
}

function getCookie(name) {
    try {
        const nameEQ = name + '=';
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
        }
        return null;
    } catch (_) { return null; }
}

function deleteCookie(name, path = '/') {
    try {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}`;
    } catch (_) {}
}

function clearCorexCookies() {
    try {
        const paths = ['/', '/panel-admin', '/panel-superadmin', '/portal-ciudadano'];
        const parts = (document.cookie || '').split(';');
        for (let i = 0; i < parts.length; i++) {
            const raw = parts[i];
            if (!raw) continue;
            const name = raw.split('=')[0].trim();
            if (!name) continue;
            const lower = name.toLowerCase();
            if (lower.startsWith('corex_session')) {
                for (let j = 0; j < paths.length; j++) {
                    deleteCookie(name, paths[j]);
                }
            }
        }
    } catch (_) {}
}
