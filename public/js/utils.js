/**
 * Utilidades generales para el Sistema ERP Municipal
 */

/**
 * Función para realizar peticiones a la API
 * @param {string} endpoint - Endpoint de la API
 * @param {Object} options - Opciones de la petición
 * @returns {Promise} - Promesa con la respuesta
 */
async function fetchAPI(endpoint, options = {}) {
    try {
        // Configuración por defecto
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        // Obtener el token del localStorage si existe
        const token = localStorage.getItem('token');
        if (token) {
            defaultOptions.headers['x-access-token'] = token;
        }
        
        // Combinar opciones correctamente, preservando headers
        const fetchOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...(options.headers || {})
            },
            credentials: 'include'
        };
        
        // Si hay body y es un objeto, convertirlo a JSON
        if (fetchOptions.body && typeof fetchOptions.body === 'object') {
            fetchOptions.body = JSON.stringify(fetchOptions.body);
        }
        
        // Realizar la petición
        const url = `${CONFIG.API_URL}${endpoint}`;
        const response = await fetch(url, fetchOptions);
        
        // Si la respuesta es un blob, manejar errores y devolver el blob si está OK
        if (options.responseType === 'blob') {
            // Evitar descargar páginas HTML/JSON como si fueran PDFs: lanzar error si status no OK
            if (!response.ok) {
                let text;
                try {
                    text = await response.text();
                } catch (_) {
                    text = `HTTP ${response.status} ${response.statusText}`;
                }
                const err = new Error(text || `HTTP ${response.status} ${response.statusText}`);
                err.status = response.status;
                err.endpoint = endpoint;
                if (!options.suppressErrorLog) {
                    console.error('API error (blob):', {
                        endpoint,
                        status: response.status,
                        statusText: response.statusText,
                        body: text
                    });
                }
                throw err;
            }
            return await response.blob();
        }
        
        // Intentar parsear la respuesta como JSON siempre que sea posible
        let data;
        try {
            data = await response.json();
        } catch (parseErr) {
            // Si no se puede parsear como JSON (p.ej. respuesta vacía), usar texto
            try {
                const text = await response.text();
                data = { message: text };
            } catch (_) {
                data = undefined;
            }
        }

        const suppressErrorLog = options && options.suppressErrorLog === true;

        if (!response.ok) {
            const errMessage = (data && (data.message || data.error || data.msg)) || `HTTP ${response.status} ${response.statusText}`;
            const err = new Error(errMessage);
            // Adjuntar metadatos útiles para depuración
            err.status = response.status;
            err.endpoint = endpoint;
            err.body = data;
            if (!suppressErrorLog) {
                console.error('API error:', {
                    endpoint,
                    status: response.status,
                    statusText: response.statusText,
                    body: data
                });
            }
            throw err;
        }

        return data;
    } catch (error) {
        const suppressErrorLog = options && options.suppressErrorLog === true;
        if (!suppressErrorLog) {
            console.error('Error en fetchAPI:', {
                endpoint,
                errorMessage: error.message,
                status: error.status,
                body: error.body
            });
        }
        throw error;
    }
}

/**
 * Función para mostrar una notificación
 * @param {string} mensaje - Mensaje a mostrar
 * @param {string} tipo - Tipo de notificación (success, danger, warning, info)
 */
function mostrarNotificacion(mensaje, tipo = 'info') {
    // Crear contenedor de notificaciones si no existe
    let container = document.getElementById('notificaciones-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notificaciones-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 400px;
        `;
        document.body.appendChild(container);
    }
    
    // Crear elemento de notificación
    const alert = document.createElement('div');
    alert.className = `alert alert-${tipo} fade-in`;
    alert.style.cssText = `
        margin-bottom: 10px;
        box-shadow: var(--shadow-lg);
        border: none;
        border-radius: var(--border-radius);
        position: relative;
        padding-right: 50px;
    `;
    
    // Definir iconos según el tipo
    let iconClass;
    switch (tipo) {
        case 'success':
            iconClass = 'bi-check-circle-fill';
            break;
        case 'danger':
            iconClass = 'bi-exclamation-triangle-fill';
            break;
        case 'warning':
            iconClass = 'bi-exclamation-circle-fill';
            break;
        default: // info
            iconClass = 'bi-info-circle-fill';
    }
    
    // Contenido de la notificación
    alert.innerHTML = `
        <div class="d-flex align-center gap-2">
            <i class="bi ${iconClass}"></i>
            <span>${mensaje}</span>
            <button type="button" class="btn btn-sm" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; font-size: 18px; opacity: 0.7;" onclick="this.parentElement.parentElement.remove()">
                <i class="bi bi-x"></i>
            </button>
        </div>
    `;
    
    // Agregar al contenedor
    container.appendChild(alert);
    
    // Configurar cierre automático
    setTimeout(() => {
        if (alert.parentNode) {
            alert.style.opacity = '0';
            alert.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (alert.parentNode) {
                    alert.remove();
                }
            }, 300);
        }
    }, CONFIG.NOTIFICACION_TIMEOUT || 5000);
}

/**
 * Función para mostrar/ocultar el indicador de carga
 * @param {boolean} mostrar - Indica si se debe mostrar u ocultar
 */
function mostrarCargando(mostrar = true) {
    const loading = document.getElementById('loading');
    if (loading) {
        if (mostrar) {
            loading.classList.remove('d-none');
        } else {
            loading.classList.add('d-none');
        }
    }
}

/**
 * Función para formatear fechas
 * @param {string|Date} fecha - Fecha a formatear
 * @returns {string} - Fecha formateada
 */
function formatearFecha(fecha) {
    if (!fecha) return '';
    
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    
    return new Date(fecha).toLocaleDateString('es-ES', options);
}

/**
 * Función para formatear moneda
 * @param {number} valor - Valor a formatear
 * @returns {string} - Valor formateado como moneda
 */
function formatearMoneda(valor) {
    if (valor === null || valor === undefined) return '';
    
    return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0
    }).format(valor);
}

/**
 * Función para validar un correo electrónico
 * @param {string} email - Correo electrónico a validar
 * @returns {boolean} - Indica si el correo es válido
 */
function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * Función para validar un archivo
 * @param {File} archivo - Archivo a validar
 * @returns {Object} - Objeto con el resultado de la validación
 */
function validarArchivo(archivo) {
    // Validar tamaño
    if (archivo.size > CONFIG.MAX_FILE_SIZE) {
        return {
            valido: false,
            mensaje: `El archivo excede el tamaño máximo permitido (${CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB)`
        };
    }
    
    // Validar formato
    const extension = archivo.name.split('.').pop().toLowerCase();
    if (!CONFIG.FORMATOS_ARCHIVO.includes(extension)) {
        return {
            valido: false,
            mensaje: `Formato de archivo no permitido. Formatos aceptados: ${CONFIG.FORMATOS_ARCHIVO.join(', ')}`
        };
    }
    
    return {
        valido: true,
        mensaje: 'Archivo válido'
    };
}

/**
 * Función para generar un ID único
 * @returns {string} - ID único
 */
function generarId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function formatRut(rut) {
    if (!rut) return '';
    const clean = String(rut).replace(/[^0-9kK]/g, '').toLowerCase();
    if (!clean) return '';
    const dv = clean.slice(-1);
    let cuerpo = clean.slice(0, -1);
    let rev = cuerpo.split('').reverse();
    let withDots = '';
    for (let i = 0; i < rev.length; i++) {
        withDots += rev[i];
        if ((i + 1) % 3 === 0 && i + 1 < rev.length) withDots += '.';
    }
    cuerpo = withDots.split('').reverse().join('');
    return `${cuerpo}-${dv}`;
}

function formatRutLive(value) {
    const clean = String(value || '').replace(/[^0-9kK]/g, '').toLowerCase();
    if (!clean) return '';
    if (clean.length <= 8) {
        const rev = clean.split('').reverse();
        let withDots = '';
        for (let i = 0; i < rev.length; i++) {
            withDots += rev[i];
            if ((i + 1) % 3 === 0 && i + 1 < rev.length) withDots += '.';
        }
        return withDots.split('').reverse().join('');
    }
    return formatRut(clean);
}

function normalizeRut(value) {
    const clean = String(value || '').replace(/[^0-9kK]/g, '').toLowerCase();
    return clean || null;
}

function formatPhoneLive(value) {
    const digits = String(value || '').replace(/[^0-9]/g, '');
    if (!digits) return '';
    // Si comienza con 56 y tiene 11 dígitos, mostrar +56 9XXXXXXX
    if (digits.startsWith('56') && digits.length === 11) {
        return `+${digits.slice(0,2)} ${digits.slice(2,3)}${digits.slice(3)}`;
    }
    // Si tiene 9 dígitos (móvil chileno), prefijar +56
    if (digits.length === 9) {
        return `+56 ${digits[0]}${digits.slice(1)}`;
    }
    // Otro caso: mostrar tal cual
    return digits;
}

/**
 * Función para crear un elemento de paginación
 * @param {number} totalItems - Total de elementos
 * @param {number} currentPage - Página actual
 * @param {number} itemsPerPage - Elementos por página
 * @param {Function} onPageChange - Función a ejecutar al cambiar de página
 * @returns {HTMLElement} - Elemento de paginación
 */
function crearPaginacion(totalItems, currentPage = 1, itemsPerPage = CONFIG.PAGINACION.ITEMS_POR_PAGINA, onPageChange) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    // Crear contenedor
    const paginacion = document.createElement('nav');
    paginacion.setAttribute('aria-label', 'Paginación');
    
    // Si no hay páginas, devolver un elemento vacío
    if (totalPages <= 1) {
        return paginacion;
    }
    
    // Crear lista de páginas
    const ul = document.createElement('ul');
    ul.className = 'pagination justify-content-center';
    
    // Botón anterior
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    
    const prevLink = document.createElement('a');
    prevLink.className = 'page-link';
    prevLink.href = '#';
    prevLink.setAttribute('aria-label', 'Anterior');
    prevLink.innerHTML = '<span aria-hidden="true">&laquo;</span>';
    
    prevLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentPage > 1) {
            onPageChange(currentPage - 1);
        }
    });
    
    prevLi.appendChild(prevLink);
    ul.appendChild(prevLi);
    
    // Páginas
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Ajustar si estamos cerca del final
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === currentPage ? 'active' : ''}`;
        
        const link = document.createElement('a');
        link.className = 'page-link';
        link.href = '#';
        link.textContent = i;
        
        link.addEventListener('click', (e) => {
            e.preventDefault();
            onPageChange(i);
        });
        
        li.appendChild(link);
        ul.appendChild(li);
    }
    
    // Botón siguiente
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    
    const nextLink = document.createElement('a');
    nextLink.className = 'page-link';
    nextLink.href = '#';
    nextLink.setAttribute('aria-label', 'Siguiente');
    nextLink.innerHTML = '<span aria-hidden="true">&raquo;</span>';
    
    nextLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentPage < totalPages) {
            onPageChange(currentPage + 1);
        }
    });
    
    nextLi.appendChild(nextLink);
    ul.appendChild(nextLi);
    
    paginacion.appendChild(ul);
    return paginacion;
}

/**
 * Función para exportar datos a CSV
 * @param {Array} data - Datos a exportar
 * @param {string} filename - Nombre del archivo
 */
function exportarCSV(data, filename) {
    if (!data || !data.length) {
        mostrarNotificacion('No hay datos para exportar', 'warning');
        return;
    }
    
    // Obtener encabezados
    const headers = Object.keys(data[0]);
    
    // Crear contenido CSV
    let csvContent = headers.join(',') + '\n';
    
    // Agregar filas
    data.forEach(item => {
        const row = headers.map(header => {
            // Escapar comas y comillas
            let cell = item[header] !== null && item[header] !== undefined ? item[header].toString() : '';
            if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
                cell = '"' + cell.replace(/"/g, '""') + '"';
            }
            return cell;
        }).join(',');
        csvContent += row + '\n';
    });
    
    // Crear blob y descargar
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename || 'export.csv');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Función para crear un gráfico de barras
 * @param {string} canvasId - ID del elemento canvas
 * @param {Array} labels - Etiquetas para el eje X
 * @param {Array} data - Datos para el gráfico
 * @param {string} label - Etiqueta para la serie de datos
 * @param {string} color - Color para las barras
 */
function crearGraficoBarras(canvasId, labels, data, label, color = 'rgba(78, 115, 223, 0.8)') {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: data,
                backgroundColor: color,
                borderColor: color,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

/**
 * Función para crear un gráfico de líneas
 * @param {string} canvasId - ID del elemento canvas
 * @param {Array} labels - Etiquetas para el eje X
 * @param {Array} data - Datos para el gráfico
 * @param {string} label - Etiqueta para la serie de datos
 * @param {string} color - Color para la línea
 */
function crearGraficoLineas(canvasId, labels, data, label, color = 'rgba(78, 115, 223, 1)') {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: data,
                backgroundColor: 'rgba(78, 115, 223, 0.05)',
                borderColor: color,
                borderWidth: 2,
                pointRadius: 3,
                pointBackgroundColor: color,
                pointBorderColor: color,
                pointHoverRadius: 5,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

/**
 * Función para crear un gráfico de pastel
 * @param {string} canvasId - ID del elemento canvas
 * @param {Array} labels - Etiquetas para las secciones
 * @param {Array} data - Datos para el gráfico
 * @param {Array} colors - Colores para las secciones
 */
function crearGraficoPastel(canvasId, labels, data, colors = [
    '#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b', '#858796'
]) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                hoverBackgroundColor: colors.map(color => color + 'dd'),
                hoverBorderColor: 'rgba(234, 236, 244, 1)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}
