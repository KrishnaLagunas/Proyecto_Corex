/**
 * Módulo de Dashboard: obtiene datos en tiempo real y renderiza tarjetas
 */

async function cargarDashboard() {
  const mainContent = document.getElementById('main-content');
  if (!mainContent) return;

  mostrarCargando(true);
  try {
    // Consultar resumen general
    const resp = await fetchAPI('/dashboard/resumen', { method: 'GET' });
    const data = resp && (resp.data || resp);

    // Desestructurar con valores por defecto
    const {
      totalUsuarios = 0,
      totalTramites = 0,
      totalPagos = 0,
      totalPagosCount = 0,
      proyectosActivos = 0,
      tramitesPorEstado = [],
      pagosPorMes = [],
      totalDepartamentos = 0,
      pagosRecientes = undefined
    } = data || {};

    const pendientes = (tramitesPorEstado.find(e => e.estado === 'pendiente')?.cantidad) || 0;
    const pagosUltimoMes = (function () {
      if (!Array.isArray(pagosPorMes) || pagosPorMes.length === 0) return 0;
      const ultimo = pagosPorMes[pagosPorMes.length - 1];
      return parseFloat(ultimo.total) || 0;
    })();

    // Detectar rol actual
    const currentUser = (typeof obtenerUsuario === 'function') ? obtenerUsuario() : null;
    const currentRole = currentUser?.role || null;
    const esFuncionario = currentRole === 'funcionario';

    // Construir UI con IDs para actualización en tiempo real
    mainContent.classList.remove('d-none');

    // Título y mensaje según rol
    const headerTitle = esFuncionario ? 'Dashboard de Funcionario' : 'Dashboard Administrativo';
    const headerInfo = esFuncionario
      ? 'Puedes gestionar trámites y pagos asignados a tu departamento.'
      : 'Métricas en tiempo real del sistema.';

    // Tarjetas según rol
    const cardsHTML = esFuncionario
      ? `
          <div class="col-md-6 col-lg-3 mb-4">
            <div class="card shadow-sm">
              <div class="card-body">
                <h5 class="card-title">Trámites</h5>
                <p class="card-text">Total: <span id="dashboard-total-tramites">${totalTramites}</span></p>
                <p class="card-text text-muted">Pendientes: <span id="dashboard-tramites-pendientes">${pendientes}</span></p>
                <a href="#" class="btn btn-primary" data-page="tramites">Ver detalles</a>
              </div>
            </div>
          </div>
          <div class="col-md-6 col-lg-3 mb-4">
            <div class="card shadow-sm">
              <div class="card-body">
                <h5 class="card-title">Pagos</h5>
                <p class="card-text">Total: <span id="dashboard-total-pagos">${totalPagosCount}</span></p>
                <p class="card-text">${pagosRecientes !== undefined ? `Recientes: <span id="dashboard-pagos-recientes">${pagosRecientes}</span>` : `Último mes: <span id="dashboard-pagos-ultimo-mes">${formatearMoneda(pagosUltimoMes)}</span>`}</p>
                <a href="#" class="btn btn-primary" data-page="pagos">Ver detalles</a>
              </div>
            </div>
          </div>
        `
      : `
          <div class="col-md-6 col-lg-3 mb-4">
            <div class="card shadow-sm">
              <div class="card-body">
                <h5 class="card-title">Usuarios</h5>
                <p class="card-text">Total: <span id="dashboard-total-usuarios">${totalUsuarios}</span></p>
                <a href="#" class="btn btn-primary" data-page="usuarios">Ver detalles</a>
              </div>
            </div>
          </div>
          <div class="col-md-6 col-lg-3 mb-4">
            <div class="card shadow-sm">
              <div class="card-body">
                <h5 class="card-title">Departamentos</h5>
                <p class="card-text">Total: <span id="dashboard-total-departamentos">${totalDepartamentos}</span></p>
                <a href="#" class="btn btn-primary" data-page="departamentos">Ver detalles</a>
              </div>
            </div>
          </div>
          <div class="col-md-6 col-lg-3 mb-4">
            <div class="card shadow-sm">
              <div class="card-body">
                <h5 class="card-title">Trámites</h5>
                <p class="card-text">Total: <span id="dashboard-total-tramites">${totalTramites}</span></p>
                <p class="card-text text-muted">Pendientes: <span id="dashboard-tramites-pendientes">${pendientes}</span></p>
                <a href="#" class="btn btn-primary" data-page="tramites">Ver detalles</a>
              </div>
            </div>
          </div>
          <div class="col-md-6 col-lg-3 mb-4">
            <div class="card shadow-sm">
              <div class="card-body">
                <h5 class="card-title">Pagos</h5>
                <p class="card-text">Total: <span id="dashboard-total-pagos">${totalPagosCount}</span></p>
                <p class="card-text">${pagosRecientes !== undefined ? `Recientes: <span id="dashboard-pagos-recientes">${pagosRecientes}</span>` : `Último mes: <span id="dashboard-pagos-ultimo-mes">${formatearMoneda(pagosUltimoMes)}</span>`}</p>
                <a href="#" class="btn btn-primary" data-page="pagos">Ver detalles</a>
              </div>
            </div>
          </div>
        `;

    mainContent.innerHTML = `
      <div class="container-fluid py-4">
        <div class="row">
          <div class="col-12">
            <h2 class="mb-4">${headerTitle}</h2>
            <div class="alert alert-info">
              <i class="bi bi-info-circle-fill me-2"></i>
              ${headerInfo}
            </div>
          </div>
        </div>
        <div class="row">
          ${cardsHTML}
        </div>
      </div>
    `;

    // Enlaces de navegación
    mainContent.querySelectorAll('[data-page]').forEach(el => {
      el.addEventListener('click', e => {
        e.preventDefault();
        const page = el.getAttribute('data-page');
        if (typeof cargarContenidoPagina === 'function') {
          cargarContenidoPagina(page);
        }
      });
    });

    // Refresco periódico de métricas (cada 5s)
    if (window.dashboardIntervalId) {
      clearInterval(window.dashboardIntervalId);
    }
    const actualizarMetricas = async () => {
      try {
        const resp2 = await fetchAPI('/dashboard/resumen', { method: 'GET' });
        const d = resp2 && (resp2.data || resp2) || {};

        const elUsuarios = document.getElementById('dashboard-total-usuarios');
        const elDeptos = document.getElementById('dashboard-total-departamentos');
        const elTramitesTotal = document.getElementById('dashboard-total-tramites');
        const elPendientes = document.getElementById('dashboard-tramites-pendientes');
        const elPagosUltimoMes = document.getElementById('dashboard-pagos-ultimo-mes');
        const elPagosRecientes = document.getElementById('dashboard-pagos-recientes');
        const elPagosTotal = document.getElementById('dashboard-total-pagos');

        if (elUsuarios) elUsuarios.textContent = d.totalUsuarios || 0;
        if (elDeptos) elDeptos.textContent = d.totalDepartamentos || 0;
        if (elTramitesTotal) elTramitesTotal.textContent = d.totalTramites || 0;
        const pendientes2 = (d.tramitesPorEstado || []).find(e => e.estado === 'pendiente')?.cantidad || 0;
        if (elPendientes) elPendientes.textContent = pendientes2;

        if (elPagosTotal) elPagosTotal.textContent = d.totalPagosCount || 0;

        if (Array.isArray(d.pagosPorMes) && d.pagosPorMes.length) {
          const ultimo = d.pagosPorMes[d.pagosPorMes.length - 1];
          const monto = parseFloat(ultimo.total) || 0;
          if (elPagosUltimoMes) elPagosUltimoMes.textContent = formatearMoneda(monto);
        }
        if (typeof d.pagosRecientes !== 'undefined' && elPagosRecientes) {
          elPagosRecientes.textContent = d.pagosRecientes;
        }
      } catch (err) {
        // Silenciar errores intermitentes de refresco
        console.warn('Actualización dashboard fallida', err?.message || err);
      }
    };

    await actualizarMetricas();
    window.dashboardIntervalId = setInterval(actualizarMetricas, 5000);
    window.actualizarDashboardMetrics = actualizarMetricas;
  } catch (error) {
    console.error('Error cargando dashboard:', error);
    mostrarNotificacion('Error al cargar el dashboard', 'danger');
  } finally {
    mostrarCargando(false);
  }
}

// Exponer globalmente
window.cargarDashboard = cargarDashboard;