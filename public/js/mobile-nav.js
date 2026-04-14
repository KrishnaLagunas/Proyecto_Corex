/**
 * Funcionalidad para navegación móvil responsiva
 */

// Variables globales para el menú móvil
let navOverlay = null;
let navClose = null;
let mainNavbar = null;

/**
 * Inicializar la navegación móvil
 */
function initMobileNav() {
    // Obtener elementos del DOM
    navOverlay = document.getElementById('nav-overlay');
    navClose = document.getElementById('nav-close');
    mainNavbar = document.getElementById('main-navbar');
    const menuToggle = document.getElementById('menu-toggle');
    
    // Agregar event listeners
    if (menuToggle) {
        menuToggle.onclick = openMobileMenu;
    }
    if (navOverlay) {
        navOverlay.onclick = closeMobileMenu;
    }
    
    if (navClose) {
        navClose.onclick = closeMobileMenu;
    }
    
    // Cerrar menú al hacer clic en enlaces (solo en móvil)
    document.addEventListener('click', (e) => {
        const target = e.target;
        // Solo actuar si el menú está abierto y es un clic en un nav-link
        if (isMobileMenuOpen() && (target.classList.contains('nav-link') || target.closest('.nav-link'))) {
            // No prevenimos el evento por defecto para permitir que el clic llegue al handler de navegación
            closeMobileMenu();
        }
    });
    
    // Cerrar menú al cambiar el tamaño de ventana
    window.addEventListener('resize', () => {
        if (window.innerWidth >= 992) {
            closeMobileMenu();
        }
    });
    
    // Cerrar menú con tecla Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mainNavbar && mainNavbar.classList.contains('active')) {
            closeMobileMenu();
        }
    });
}

/**
 * Abrir el menú móvil
 */
function openMobileMenu() {
    if (mainNavbar && navOverlay) {
        mainNavbar.classList.add('active');
        navOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Focus en el botón de cerrar para accesibilidad
        if (navClose) {
            setTimeout(() => navClose.focus(), 100);
        }
    }
}

/**
 * Cerrar el menú móvil
 */
function closeMobileMenu() {
    if (mainNavbar && navOverlay) {
        mainNavbar.classList.remove('active');
        navOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }
}

/**
 * Verificar si el menú móvil está abierto
 */
function isMobileMenuOpen() {
    return mainNavbar && mainNavbar.classList.contains('active');
}

/**
 * Alternar el menú móvil
 */
function toggleMobileMenu() {
    if (isMobileMenuOpen()) {
        closeMobileMenu();
    } else {
        openMobileMenu();
    }
}

/**
 * Actualizar la navegación cuando cambia el contenido
 */
function updateMobileNavigation() {
    // Re-inicializar si los elementos han cambiado
    const newMenuToggle = document.getElementById('menu-toggle');
    const newNavClose = document.getElementById('nav-close');
    
    if (newMenuToggle && newMenuToggle !== menuToggle) {
        initMobileNav();
    }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileNav);
} else {
    initMobileNav();
}

// Exportar funciones para uso global
window.mobileNav = {
    init: initMobileNav,
    open: openMobileMenu,
    close: closeMobileMenu,
    toggle: toggleMobileMenu,
    isOpen: isMobileMenuOpen,
    update: updateMobileNavigation
};