/**
 * Configuración global para el Sistema ERP Municipal
 */

const CONFIG = {
    // URL base de la API
    API_URL: '/api',
    
    // Tiempo de expiración del token en milisegundos (8 horas)
    TOKEN_EXPIRATION: 8 * 60 * 60 * 1000,
    
    // Nombre del token en localStorage
    TOKEN_NAME: 'erp_municipal_token',
    
    // Nombre del usuario en localStorage
    USER_DATA: 'erp_municipal_user',
    
    // Roles de usuario
    ROLES: {
        ADMIN: 'admin',
        FUNCIONARIO: 'funcionario',
        CIUDADANO: 'ciudadano'
    },
    
    // Estados de trámites
    ESTADOS_TRAMITE: {
        PENDIENTE: 'pendiente',
        EN_PROCESO: 'en_proceso',
        APROBADO: 'aprobado',
        RECHAZADO: 'rechazado',
        COMPLETADO: 'completado'
    },
    
    // Estados de pagos
    ESTADOS_PAGO: {
        PENDIENTE: 'pendiente',
        COMPLETADO: 'completado',
        RECHAZADO: 'rechazado'
    },
    
    // Métodos de pago
    METODOS_PAGO: [
        'efectivo',
        'tarjeta_credito',
        'tarjeta_debito',
        'transferencia'
    ],
    
    // Estados de proyectos
    ESTADOS_PROYECTO: {
        PLANIFICACION: 'planificacion',
        EN_EJECUCION: 'en_ejecucion',
        PAUSADO: 'pausado',
        COMPLETADO: 'completado',
        CANCELADO: 'cancelado'
    },
    
    // Estados de proveedores
    ESTADOS_PROVEEDOR: {
        ACTIVO: 'activo',
        INACTIVO: 'inactivo'
    }
};

/**
 * Función para mostrar mensajes de notificación
 * @param {string} mensaje - Mensaje a mostrar
 * @param {string} tipo - Tipo de mensaje (success, danger, warning, info)
 */
function mostrarNotificacion(mensaje, tipo = 'info') {
    // Crear el elemento de notificación
    const notificacion = document.createElement('div');
    notificacion.className = `alert alert-${tipo} alert-dismissible fade show notification`;
    notificacion.role = 'alert';
    notificacion.innerHTML = `
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>
    `;
    
    // Agregar estilos para posicionar la notificación
    notificacion.style.position = 'fixed';
    notificacion.style.top = '20px';
    notificacion.style.right = '20px';
    notificacion.style.zIndex = '9999';
    notificacion.style.minWidth = '300px';
    
    // Agregar la notificación al cuerpo del documento
    document.body.appendChild(notificacion);
    
    // Eliminar la notificación después de 5 segundos
    setTimeout(() => {
        notificacion.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notificacion);
        }, 300);
    }, 5000);
}

/**
 * Función para mostrar el spinner de carga
 * @param {boolean} mostrar - Indica si se debe mostrar u ocultar el spinner
 */
function mostrarCargando(mostrar = true) {
    const spinner = document.getElementById('loading');
    if (mostrar) {
        spinner.classList.remove('d-none');
    } else {
        spinner.classList.add('d-none');
    }
}

/**
 * Función para formatear fechas
 * @param {string} fecha - Fecha en formato ISO
 * @returns {string} - Fecha formateada
 */
function formatearFecha(fecha) {
    if (!fecha) return '';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

/**
 * Función para formatear moneda
 * @param {number} monto - Monto a formatear
 * @returns {string} - Monto formateado como moneda
 */
function formatearMoneda(monto) {
    return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0
    }).format(monto);
}
