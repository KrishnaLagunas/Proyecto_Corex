/**
 * Módulo de Dashboard: obtiene datos en tiempo real y renderiza tarjetas
 */

window.pagosMesDetalleRes = null;

async function cargarDashboard() {
  const mainContent = document.getElementById('main-content');
  if (!mainContent) return;

  mostrarCargando(true);
  try {
    // Limpiar intervalos y gráficos previos para evitar referencias a canvases removidos
    try {
      if (window.dashboardIntervalId) clearInterval(window.dashboardIntervalId);
      if (window.dashboardTimeIntervalId) clearInterval(window.dashboardTimeIntervalId);
    } catch (_) {}
    if (window.dashboardCharts) {
      try {
        Object.values(window.dashboardCharts).forEach(ch => {
          if (ch && typeof ch.destroy === 'function') {
            try { ch.destroy(); } catch (_) {}
          }
        });
      } catch (_) {}
    }
    window.dashboardCharts = {};

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
    const headerTitle = esFuncionario ? 'Panel de Funcionario' : 'Panel Administrativo';
    const headerInfo = '';

    // Tarjetas según rol
    const cardsHTML = esFuncionario
      ? `
          <div class="col-md-6 col-lg-4 mb-4">
            <a href="#" class="kpi-card" data-page="tramites">
              <div class="kpi-icon"><i class="bi bi-file-earmark-text"></i></div>
              <div class="kpi-info">
                <div class="kpi-title">Trámites</div>
                <div class="kpi-value"><span id="dashboard-total-tramites">${totalTramites}</span></div>
                <div class="kpi-sub">Pendientes <span id="dashboard-tramites-pendientes">${pendientes}</span></div>
              </div>
            </a>
          </div>
          <div class="col-md-6 col-lg-4 mb-4">
            <a href="#" class="kpi-card" data-page="pagos">
              <div class="kpi-icon"><i class="bi bi-cash-coin"></i></div>
              <div class="kpi-info">
                <div class="kpi-title">Pagos</div>
                <div class="kpi-value"><span id="dashboard-total-pagos">${totalPagosCount}</span></div>
                <div class="kpi-sub">${pagosRecientes !== undefined ? `Recientes <span id="dashboard-pagos-recientes">${pagosRecientes}</span>` : `Último mes <span id="dashboard-pagos-ultimo-mes">${formatearMoneda(pagosUltimoMes)}</span>`}</div>
              </div>
            </a>
          </div>
        `
      : `
          <div class="col-sm-6 col-lg-3 mb-4">
            <a href="#" class="kpi-card" data-page="usuarios">
              <div class="kpi-icon"><i class="bi bi-people"></i></div>
              <div class="kpi-info">
                <div class="kpi-title">Usuarios</div>
                <div class="kpi-value"><span id="dashboard-total-usuarios">${totalUsuarios}</span></div>
              </div>
            </a>
          </div>
          <div class="col-sm-6 col-lg-3 mb-4">
            <a href="#" class="kpi-card" data-page="departamentos">
              <div class="kpi-icon"><i class="bi bi-building"></i></div>
              <div class="kpi-info">
                <div class="kpi-title">Departamentos</div>
                <div class="kpi-value"><span id="dashboard-total-departamentos">${totalDepartamentos}</span></div>
              </div>
            </a>
          </div>
          <div class="col-sm-6 col-lg-3 mb-4">
            <a href="#" class="kpi-card" data-page="tramites">
              <div class="kpi-icon"><i class="bi bi-file-earmark-text"></i></div>
              <div class="kpi-info">
                <div class="kpi-title">Trámites</div>
                <div class="kpi-value"><span id="dashboard-total-tramites">${totalTramites}</span></div>
                <div class="kpi-sub">Pendientes <span id="dashboard-tramites-pendientes">${pendientes}</span></div>
              </div>
            </a>
          </div>
          <div class="col-sm-6 col-lg-3 mb-4">
            <a href="#" class="kpi-card" data-page="pagos">
              <div class="kpi-icon"><i class="bi bi-cash-coin"></i></div>
              <div class="kpi-info">
                <div class="kpi-title">Pagos</div>
                <div class="kpi-value"><span id="dashboard-total-pagos">${totalPagosCount}</span></div>
                <div class="kpi-sub">${pagosRecientes !== undefined ? `Recientes <span id="dashboard-pagos-recientes">${pagosRecientes}</span>` : `Último mes <span id="dashboard-pagos-ultimo-mes">${formatearMoneda(pagosUltimoMes)}</span>`}</div>
              </div>
            </a>
          </div>
          <div class="col-sm-6 col-lg-3 mb-4">
            <div class="kpi-card">
              <div class="kpi-icon"><i class="bi bi-bar-chart"></i></div>
              <div class="kpi-info">
                <div class="kpi-title">Proyectos activos</div>
                <div class="kpi-value">${proyectosActivos}</div>
              </div>
            </div>
          </div>
        `;

    mainContent.innerHTML = `
      <div class="container-fluid py-3">
        <div class="row mb-3 align-items-center">
          <div class="col-4"></div>
          <div class="col-4 text-center">
            <h2 class="section-title">${headerTitle}</h2>
          </div>
          <div class="col-4 text-end">
            <div class="d-inline-flex align-items-center gap-2 px-3 py-1 rounded border bg-light" id="dashboard-datetime-container">
              <i class="bi bi-calendar3"></i>
              <span id="dashboard-date"></span>
              <span class="vr mx-1"></span>
              <i class="bi bi-clock"></i>
              <span id="dashboard-time"></span>
            </div>
          </div>
        </div>
        <div class="row mt-2">
          <div class="col-lg-6 mb-3">
            <div class="card shadow-sm chart-card">
              <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Pagos por estado</h5>
                <small class="text-muted">Distribución actual</small>
              </div>
              <div class="card-body">
                <div class="row text-center donut-row g-2">
                  <div class="col-4">
                    <div class="chart-container chart-mini">
                      <canvas id="chart-pagos-completado"></canvas>
                    </div>
                    <div class="mt-1"><small>Completado: <span id="count-pagos-completado">0</span></small></div>
                  </div>
                  <div class="col-4">
                    <div class="chart-container chart-mini">
                      <canvas id="chart-pagos-pendiente"></canvas>
                    </div>
                    <div class="mt-1"><small>Pendiente: <span id="count-pagos-pendiente">0</span></small></div>
                  </div>
                  <div class="col-4">
                    <div class="chart-container chart-mini">
                      <canvas id="chart-pagos-rechazado"></canvas>
                    </div>
                    <div class="mt-1"><small>Rechazado: <span id="count-pagos-rechazado">0</span></small></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-lg-6 mb-3">
            <div class="card shadow-sm chart-card">
              <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Trámites por estado</h5>
                <small class="text-muted">Distribución actual</small>
              </div>
              <div class="card-body">
                <div class="row text-center donut-row g-2">
                  <div class="col-4">
                    <div class="chart-container chart-mini">
                      <canvas id="chart-tramites-proceso"></canvas>
                    </div>
                    <div class="mt-1"><small>En proceso: <span id="count-tram-proceso">0</span></small></div>
                  </div>
                  <div class="col-4">
                    <div class="chart-container chart-mini">
                      <canvas id="chart-tramites-pendiente"></canvas>
                    </div>
                    <div class="mt-1"><small>Pendiente: <span id="count-tram-pendiente">0</span></small></div>
                  </div>
                  <div class="col-4">
                    <div class="chart-container chart-mini">
                      <canvas id="chart-tramites-finalizado"></canvas>
                    </div>
                    <div class="mt-1"><small>Finalizado: <span id="count-tram-finalizado">0</span></small></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-lg-6 mb-3">
            <div class="card shadow-sm chart-card">
              <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Usuarios activos vs inactivos</h5>
                <small class="text-muted">Estado actual</small>
              </div>
              <div class="card-body">
                <div class="chart-container">
                  <canvas id="chart-usuarios-estado"></canvas>
                </div>
              </div>
            </div>
          </div>
          <div class="col-lg-6 mb-3">
            <div class="card shadow-sm chart-card">
              <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Departamentos activos vs inactivos</h5>
                <small class="text-muted">Estado actual</small>
              </div>
              <div class="card-body">
                <div class="chart-container">
                  <canvas id="chart-departamentos-estado"></canvas>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Enlaces de navegación
    console.log('[Dashboard] Renderizado DOM de charts');
    console.log('[Dashboard] Canvas usuarios existe?', !!document.getElementById('chart-usuarios-estado'));
    mainContent.querySelectorAll('[data-page]').forEach(el => {
      el.addEventListener('click', e => {
        e.preventDefault();
        const page = el.getAttribute('data-page');
        if (typeof cargarContenidoPagina === 'function') {
          cargarContenidoPagina(page);
        }
      });
    });

    const waitCanvasReady = (canvas) => new Promise(resolve => {
      try {
        const parent = canvas.parentElement;
        const ready = () => {
          const w = parent ? parent.clientWidth : canvas.clientWidth;
          const h = parent ? parent.clientHeight : canvas.clientHeight;
          return w > 0 && h > 0;
        };
        if (ready()) return resolve(parent || canvas);
        const ro = new ResizeObserver(() => {
          if (ready()) { try { ro.disconnect(); } catch (_) {} resolve(parent || canvas); }
        });
        ro.observe(parent || canvas);
        setTimeout(() => { try { ro.disconnect(); } catch (_) {} resolve(parent || canvas); }, 1000);
      } catch (_) { resolve(canvas.parentElement || canvas); }
    });

    // Refresco periódico de métricas (cada 5s)
    if (window.dashboardIntervalId) {
      clearInterval(window.dashboardIntervalId);
    }
    const dateEl = document.getElementById('dashboard-date');
    const timeEl = document.getElementById('dashboard-time');
    const legacyEl = document.getElementById('dashboard-datetime');
    const updateTime = () => {
      try {
        if (dateEl) dateEl.textContent = new Date().toLocaleDateString('es-CL', { dateStyle: 'full', timeZone: 'America/Santiago' });
        if (timeEl) timeEl.textContent = new Date().toLocaleTimeString('es-CL', { timeStyle: 'short', timeZone: 'America/Santiago' });
        if (!dateEl && !timeEl && legacyEl) legacyEl.textContent = new Date().toLocaleString('es-CL', { dateStyle: 'full', timeStyle: 'medium', timeZone: 'America/Santiago' });
      } catch (_) {
        if (dateEl) dateEl.textContent = new Date().toLocaleDateString();
        if (timeEl) timeEl.textContent = new Date().toLocaleTimeString();
        if (!dateEl && !timeEl && legacyEl) legacyEl.textContent = new Date().toLocaleString();
      }
    };
    updateTime();
    if (window.dashboardTimeIntervalId) {
      clearInterval(window.dashboardTimeIntervalId);
    }
    window.dashboardTimeIntervalId = setInterval(updateTime, 1000);
    // Inicializar gráficos
    window.dashboardCharts = window.dashboardCharts || {};
    try {
      const pagosLabelsInit = Array.isArray(pagosPorMes) ? pagosPorMes.map(p => p.mes || p.label || '') : [];
      const pagosDataInit = Array.isArray(pagosPorMes) ? pagosPorMes.map(p => parseFloat(p.total) || 0) : [];
      const estadosLabelsInit = Array.isArray(tramitesPorEstado) ? tramitesPorEstado.map(e => e.estado) : [];
      const estadosDataInit = Array.isArray(tramitesPorEstado) ? tramitesPorEstado.map(e => e.cantidad || 0) : [];

      const pagosCanvas = document.getElementById('chart-pagos-mes');
      if (pagosCanvas && pagosCanvas.getContext) {
        const ctx1 = pagosCanvas.getContext('2d');
        window.dashboardCharts.pagosMes = new Chart(ctx1, {
          type: 'bar',
          data: { labels: ['—'], datasets: [{ label: 'Monto (CLP)', data: [0], backgroundColor: 'rgba(33, 150, 243, 0.6)', borderColor: 'rgba(33, 150, 243, 1)', borderWidth: 1 }] },
          options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } }, plugins: { legend: { position: 'top' } } }
        });
      }

      const totalTramites = (Array.isArray(tramitesPorEstado) ? tramitesPorEstado.reduce((acc, e) => acc + (e.cantidad || 0), 0) : 0) || 0;
      const getCount = (estado) => {
        const it = Array.isArray(tramitesPorEstado) ? tramitesPorEstado.find(e => e.estado === estado) : null;
        return parseInt(it?.cantidad || 0) || 0;
      };
      const cProceso = document.getElementById('count-tram-proceso'); if (cProceso) cProceso.textContent = getCount('en_proceso');
      const cPend = document.getElementById('count-tram-pendiente'); if (cPend) cPend.textContent = getCount('pendiente');
      const cFin = document.getElementById('count-tram-finalizado'); if (cFin) cFin.textContent = getCount('finalizado');
      const labelForDonut = (id) => {
        switch (id) {
          case 'chart-pagos-completado': return 'Completado';
          case 'chart-pagos-pendiente': return 'Pendiente';
          case 'chart-pagos-rechazado': return 'Rechazado';
          case 'chart-tramites-proceso': return 'En proceso';
          case 'chart-tramites-pendiente': return 'Pendiente';
          case 'chart-tramites-finalizado': return 'Finalizado';
          default: return 'Valor';
        }
      };
      const donutOptions = (id) => ({
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        animation: { duration: 0 },
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        }
      });
      const chartInitDonut = (id, val, color) => {
        const el = document.getElementById(id);
        if (!el || !el.getContext) return;
        const ctx = el.getContext('2d');
        window.dashboardCharts[id] = new Chart(ctx, {
          type: 'doughnut',
          data: { labels: ['Valor', 'Resto'], datasets: [{ data: [val, Math.max(totalTramites - val, 0)], backgroundColor: [color, '#E0E0E0'] }] },
          options: donutOptions(id)
        });
      };
      chartInitDonut('chart-tramites-proceso', getCount('en_proceso'), '#1E3A8A');
      chartInitDonut('chart-tramites-pendiente', getCount('pendiente'), '#FF9800');
      chartInitDonut('chart-tramites-finalizado', getCount('finalizado'), '#2E7D32');

      const chartInitPagosDonut = (id, val, color) => {
        const el = document.getElementById(id);
        if (!el || !el.getContext) return;
        const ctx = el.getContext('2d');
        window.dashboardCharts[id] = new Chart(ctx, {
          type: 'doughnut',
          data: { labels: ['Valor', 'Resto'], datasets: [{ data: [val, Math.max(totalPagosCount - val, 0)], backgroundColor: [color, '#E0E0E0'] }] },
          options: donutOptions(id)
        });
      };
      chartInitPagosDonut('chart-pagos-completado', 0, '#2E7D32');
      chartInitPagosDonut('chart-pagos-pendiente', 0, '#FF9800');
      chartInitPagosDonut('chart-pagos-rechazado', 0, '#e74c3c');

    } catch (_) { /* opcional */ }

    // Inicializar gráfico de Usuarios fuera del try para evitar silencios
    const usuariosInitCanvas = document.getElementById('chart-usuarios-estado');
    if (usuariosInitCanvas && usuariosInitCanvas.getContext && !window.dashboardCharts.usuariosEstado) {
      await waitCanvasReady(usuariosInitCanvas);
      try {
        const p = usuariosInitCanvas.parentElement;
        const pw = (p && p.clientWidth) ? p.clientWidth : 600;
        const ph = (p && p.clientHeight) ? p.clientHeight : 200;
        usuariosInitCanvas.width = pw;
        usuariosInitCanvas.height = ph;
      } catch (_) {}
      const ctxU = usuariosInitCanvas.getContext('2d');
      const rect = usuariosInitCanvas.getBoundingClientRect();
      console.log('[Dashboard] Creando gráfico usuarios (init), size', { w: rect.width, h: rect.height });
      window.dashboardCharts.usuariosEstado = new Chart(ctxU, {
        type: 'bar',
        data: { labels: ['Activos', 'Inactivos'], datasets: [{ data: [0, 0], backgroundColor: ['#2196F3', '#E53935'] }] },
        options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y', scales: { x: { beginAtZero: true, ticks: { stepSize: 1 }, suggestedMax: 8 } }, plugins: { legend: { display: false }, tooltip: { enabled: false } }, animation: { duration: 0 } }
      });
      window.dashboardCharts.usuariosEstado.update('none');
      if (typeof window.dashboardCharts.usuariosEstado.resize === 'function') window.dashboardCharts.usuariosEstado.resize();
      console.log('[Dashboard] Gráfico usuarios creado (init)', !!window.dashboardCharts.usuariosEstado, 'chartArea', window.dashboardCharts.usuariosEstado?.chartArea);
    }
    const actualizarMetricas = async () => {
      try {
        let d = {};
        try {
          const resp2 = await fetchAPI('/dashboard/resumen', { method: 'GET', headers: { 'Cache-Control': 'no-cache' }, suppressErrorLog: true });
          d = resp2 && (resp2.data || resp2) || {};
        } catch (_) {
          d = {};
        }

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
        if (window.dashboardCharts && window.dashboardCharts.tramitesEstado && Array.isArray(d.tramitesPorEstado)) {
          window.dashboardCharts.tramitesEstado.data.labels = d.tramitesPorEstado.map(e => e.estado);
          window.dashboardCharts.tramitesEstado.data.datasets[0].data = d.tramitesPorEstado.map(e => e.cantidad || 0);
          window.dashboardCharts.tramitesEstado.update();
        }

        // Cargar estadísticas adicionales
        let pagosMesDetalleRes = null;
        const [pagosStats, usuariosStats, departamentosStats, pagosMesDetalleTmp] = await Promise.all([
          fetchAPI('/pagos/stats/general', { suppressErrorLog: true }).catch(err => { console.warn('[Dashboard] pagos stats error', err?.message || err); return null; }),
          fetchAPI('/usuarios/stats/general', { suppressErrorLog: true }).catch(err => { console.warn('[Dashboard] usuarios stats error', err?.message || err); return null; }),
          fetchAPI('/departamentos/stats/general', { suppressErrorLog: true }).catch(err => { console.warn('[Dashboard] departamentos stats error', err?.message || err); return null; }),
          (async () => {
            const now = new Date();
            const y = now.getFullYear();
            const m = String(now.getMonth() + 1).padStart(2, '0');
            const desde = `${y}-${m}-01`;
            const hastaDate = new Date(y, now.getMonth() + 1, 0);
            const hasta = `${y}-${m}-${String(hastaDate.getDate()).padStart(2, '0')}`;
            const q = `/pagos?fechaDesde=${desde}&fechaHasta=${hasta}&limit=50&order=DESC&sort=monto`;
            console.log('[Dashboard] Query pagos mes detalle', q);
            try { return await fetchAPI(q, { suppressErrorLog: true }); } catch (e) { return null; }
          })()
        ]);
        pagosMesDetalleRes = pagosMesDetalleTmp;
        window.pagosMesDetalleRes = pagosMesDetalleRes;
        const pagosCount = Array.isArray(pagosMesDetalleRes?.pagos) ? pagosMesDetalleRes.pagos.length : 0;
        console.log('[Dashboard] Pagos mes detalle count', pagosCount);

        // Usuarios activos vs inactivos (barra horizontal)
        const usuariosCanvas = document.getElementById('chart-usuarios-estado');
        if (usuariosCanvas && usuariosCanvas.getContext) {
          if (window.dashboardCharts.usuariosEstado && window.dashboardCharts.usuariosEstado.canvas !== usuariosCanvas) {
            try { window.dashboardCharts.usuariosEstado.destroy(); } catch (_) {}
            window.dashboardCharts.usuariosEstado = null;
            console.log('[Dashboard] Usuarios chart destruido por cambio de canvas');
          }
          if (!window.dashboardCharts.usuariosEstado) {
            await waitCanvasReady(usuariosCanvas);
            try {
              const p = usuariosCanvas.parentElement;
              const pw = (p && p.clientWidth) ? p.clientWidth : 400;
              const ph = (p && p.clientHeight) ? p.clientHeight : 200;
              usuariosCanvas.width = pw > 0 ? pw : 600;
              usuariosCanvas.height = ph > 0 ? ph : 200;
            } catch (_) {}
            const ctx3 = usuariosCanvas.getContext('2d');
            console.log('[Dashboard] Creando gráfico usuarios (refresh)');
            window.dashboardCharts.usuariosEstado = new Chart(ctx3, {
              type: 'bar',
              data: { labels: ['Activos', 'Inactivos'], datasets: [{ data: [0, 0], backgroundColor: ['#2196F3', '#E53935'] }] },
              options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y', scales: { x: { beginAtZero: true, ticks: { stepSize: 1 }, suggestedMax: 8 } }, plugins: { legend: { display: false }, tooltip: { enabled: false } } }
            });
            console.log('[Dashboard] Gráfico usuarios creado (refresh)', !!window.dashboardCharts.usuariosEstado);
          }
          if (usuariosStats && Array.isArray(usuariosStats.estadoPorUsuario)) {
            console.log('[Dashboard] usuariosStats OK', usuariosStats.estadoPorUsuario);
            const estadoArr = usuariosStats.estadoPorUsuario;
            const activoItem = estadoArr.find(s => (s.estado || s.dataValues?.estado) === 'activo');
            const inactivoItem = estadoArr.find(s => (s.estado || s.dataValues?.estado) === 'inactivo');
            const activos = parseInt((activoItem && (activoItem.total ?? activoItem.dataValues?.total)) || 0) || 0;
            const inactivos = parseInt((inactivoItem && (inactivoItem.total ?? inactivoItem.dataValues?.total)) || 0) || 0;
            const suggested = Math.max(8, Math.max(activos, inactivos));
            console.log('[Dashboard] usuarios activos/inactivos', { activos, inactivos, suggested });
            window.dashboardCharts.usuariosEstado.data.labels = ['Activos', 'Inactivos'];
            window.dashboardCharts.usuariosEstado.data.datasets[0].data = [activos, inactivos];
            if (window.dashboardCharts.usuariosEstado && window.dashboardCharts.usuariosEstado.options && window.dashboardCharts.usuariosEstado.options.scales && window.dashboardCharts.usuariosEstado.options.scales.x) {
              window.dashboardCharts.usuariosEstado.options.scales.x.suggestedMax = suggested;
              window.dashboardCharts.usuariosEstado.options.scales.x.ticks.stepSize = 1;
            }
            window.dashboardCharts.usuariosEstado.update('none');
            if (typeof window.dashboardCharts.usuariosEstado.resize === 'function') window.dashboardCharts.usuariosEstado.resize();
            const area = window.dashboardCharts.usuariosEstado?.chartArea;
            console.log('[Dashboard] Usuarios chartArea after update', area);
          } else {
            console.warn('[Dashboard] usuariosStats vacío o inválido', usuariosStats);
          }
        }

        // Trámites por estado: 3 donuts
        const totalTram = Array.isArray(d.tramitesPorEstado) ? d.tramitesPorEstado.reduce((acc, e) => acc + (e.cantidad || 0), 0) : 0;
        const getC = (est) => {
          const it = Array.isArray(d.tramitesPorEstado) ? d.tramitesPorEstado.find(e => e.estado === est) : null;
          return parseInt(it?.cantidad || 0) || 0;
        };
        const updDonut = (id, val, color, countElId) => {
          const el = document.getElementById(id);
          const cnt = document.getElementById(countElId);
          if (cnt) cnt.textContent = val;
          if (!el || !el.getContext) return;
          const ds = { labels: ['Valor', 'Resto'], datasets: [{ data: [val, Math.max(totalTram - val, 0)], backgroundColor: [color, '#E0E0E0'] }] };
          if (!window.dashboardCharts[id]) {
            window.dashboardCharts[id] = new Chart(el.getContext('2d'), { type: 'doughnut', data: ds, options: donutOptions(id) });
          } else {
            window.dashboardCharts[id].data = ds;
            window.dashboardCharts[id].update('none');
          }
        };
        updDonut('chart-tramites-proceso', getC('en_proceso'), '#1E3A8A', 'count-tram-proceso');
        updDonut('chart-tramites-pendiente', getC('pendiente'), '#FF9800', 'count-tram-pendiente');
        updDonut('chart-tramites-finalizado', getC('finalizado'), '#2E7D32', 'count-tram-finalizado');

        // Departamentos activos vs inactivos
        const departamentosCanvas = document.getElementById('chart-departamentos-estado');
        if (departamentosCanvas && departamentosStats && Array.isArray(departamentosStats.estadoPorDepartamento)) {
          const estadoArrD = departamentosStats.estadoPorDepartamento;
          const activoItemD = estadoArrD.find(s => (s.estado || s.dataValues?.estado) === 'activo');
          const inactivoItemD = estadoArrD.find(s => (s.estado || s.dataValues?.estado) === 'inactivo');
          const activosD = parseInt((activoItemD && (activoItemD.total ?? activoItemD.dataValues?.total)) || 0) || 0;
          const inactivosD = parseInt((inactivoItemD && (inactivoItemD.total ?? inactivoItemD.dataValues?.total)) || 0) || 0;
          const suggestedD = Math.max(8, Math.max(activosD, inactivosD));
          if (!window.dashboardCharts.departamentosEstado) {
            const ctx5 = departamentosCanvas.getContext('2d');
            window.dashboardCharts.departamentosEstado = new Chart(ctx5, {
              type: 'bar',
              data: { labels: ['Activos', 'Inactivos'], datasets: [{ data: [activosD, inactivosD], backgroundColor: ['#4CAF50', '#FF7043'] }] },
              options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y', scales: { x: { beginAtZero: true, ticks: { stepSize: 1 }, suggestedMax: suggestedD } }, plugins: { legend: { display: false }, tooltip: { enabled: false } } }
            });
          } else {
            window.dashboardCharts.departamentosEstado.data.labels = ['Activos', 'Inactivos'];
            window.dashboardCharts.departamentosEstado.data.datasets[0].data = [activosD, inactivosD];
            window.dashboardCharts.departamentosEstado.options.scales.x.suggestedMax = suggestedD;
            window.dashboardCharts.departamentosEstado.options.scales.x.ticks.stepSize = 1;
            window.dashboardCharts.departamentosEstado.update();
          }
        }
        const buildCarouselItem = (p) => {
          const cPagoCiudadano = document.getElementById('carousel-pago-ciudadano');
          const cPagoTramite = document.getElementById('carousel-pago-tramite');
          const cPagoMonto = document.getElementById('carousel-pago-monto');
          const cPagoFecha = document.getElementById('carousel-pago-fecha');
          if (!cPagoCiudadano || !cPagoTramite || !cPagoMonto || !cPagoFecha) return;
          const ciudadano = p?.ciudadano || p?.dataValues?.ciudadano;
          const tramite = p?.Tramite || p?.tramite || p?.dataValues?.Tramite;
          const nombre = ciudadano ? `${ciudadano.nombre || ''} ${ciudadano.apellido || ''}`.trim() : 'Ciudadano';
          cPagoCiudadano.textContent = nombre || '—';
          cPagoTramite.textContent = tramite ? (tramite.titulo || tramite.codigo || 'Trámite') : 'Trámite';
          cPagoMonto.textContent = formatearMoneda(parseFloat(p?.monto || p?.dataValues?.monto) || 0);
          try {
            const f = new Date(p?.fecha_pago || p?.dataValues?.fecha_pago);
            cPagoFecha.textContent = f.toLocaleString('es-CL', { dateStyle: 'medium' });
          } catch (_) { cPagoFecha.textContent = '—'; }
        };
        // Pagos activos vs inactivos (donut)
        let pagosEstadoArr = Array.isArray(pagosStats?.estadoStats) ? pagosStats.estadoStats : [];
        if (!pagosEstadoArr.length) {
          try {
            const respPagosListado = await fetchAPI('/pagos?limit=200&order=DESC', { suppressErrorLog: true });
            const arrListado = Array.isArray(respPagosListado) ? respPagosListado : (respPagosListado?.pagos || []);
            const mapa = new Map();
            arrListado.forEach(p => {
              const est = (p.estado || p.dataValues?.estado || '').toLowerCase();
              if (!est) return;
              const cur = mapa.get(est) || 0;
              mapa.set(est, cur + 1);
            });
            pagosEstadoArr = Array.from(mapa.entries()).map(([estado, total]) => ({ estado, total }));
            console.log('[Dashboard] fallback estado pagos desde listado', pagosEstadoArr);
          } catch (e) {
            console.warn('[Dashboard] No se pudo obtener listado de pagos para fallback', e?.message || e);
          }
        }
        const getPagoC = (name) => {
          const item = pagosEstadoArr.find(s => (s.estado || s.dataValues?.estado) === name);
          return parseInt((item && (item.total ?? item.dataValues?.total)) || 0) || 0;
        };
        const totalPag = pagosEstadoArr.reduce((sum, s) => sum + (parseInt((s.total ?? s.dataValues?.total) || 0) || 0), 0) || parseInt(d.totalPagosCount || 0) || 0;
        const updPagDonut = (id, val, color, countElId) => {
          const el = document.getElementById(id);
          const cnt = document.getElementById(countElId);
          if (cnt) cnt.textContent = val;
          if (!el || !el.getContext) return;
          const ds = { labels: ['Valor', 'Resto'], datasets: [{ data: totalPag > 0 ? [val, Math.max(totalPag - val, 0)] : [0, 1], backgroundColor: [color, '#E0E0E0'] }] };
          if (!window.dashboardCharts[id]) {
            window.dashboardCharts[id] = new Chart(el.getContext('2d'), { type: 'doughnut', data: ds, options: donutOptions(id) });
          } else {
            window.dashboardCharts[id].data = ds;
            window.dashboardCharts[id].update('none');
          }
        };
        updPagDonut('chart-pagos-completado', getPagoC('completado'), '#2E7D32', 'count-pagos-completado');
        updPagDonut('chart-pagos-pendiente', getPagoC('pendiente'), '#FF9800', 'count-pagos-pendiente');
        updPagDonut('chart-pagos-rechazado', getPagoC('rechazado'), '#e74c3c', 'count-pagos-rechazado');
      } catch (err) {
        console.warn('Actualización dashboard fallida', err?.message || err);
      }
    };

    await actualizarMetricas();
    window.dashboardIntervalId = setInterval(actualizarMetricas, 15000);
    window.actualizarDashboardMetrics = actualizarMetricas;
  } catch (error) {
    console.error('Error cargando dashboard:', error);
    const currentUser = (typeof obtenerUsuario === 'function') ? obtenerUsuario() : null;
    const currentRole = currentUser?.role || null;
    const headerTitle = currentRole === 'funcionario' ? 'Panel de Funcionario' : 'Panel Administrativo';
    mainContent.innerHTML = `
      <div class="container-fluid py-3">
        <div class="row mb-3 align-items-center">
          <div class="col-4"></div>
          <div class="col-4 text-center">
            <h2 class="section-title">${headerTitle}</h2>
          </div>
          <div class="col-4"></div>
        </div>
        <div class="row">
          <div class="col-12">
            <div class="alert alert-warning mt-3">No se pudieron cargar los datos del panel. Intenta nuevamente en unos segundos.</div>
          </div>
        </div>
      </div>
    `;
    mostrarNotificacion('Error al cargar el dashboard', 'danger');
  } finally {
    mostrarCargando(false);
  }
}

// Exponer globalmente
window.cargarDashboard = cargarDashboard;

async function mostrarSupervisionMultiMunicipalidad() {
  try {
    mostrarCargando(true);
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;
    const hoy = new Date();
    const inicio = new Date(hoy);
    inicio.setMonth(inicio.getMonth() - 3);
    const toIsoDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const defaultDesde = toIsoDate(inicio);
    const defaultHasta = toIsoDate(hoy);
    mainContent.innerHTML = `
      <div class="container-fluid py-3">
        <div class="row mb-3 align-items-center">
          <div class="col-4">
            <button class="btn btn-outline-secondary" id="btn-volver-superadmin">
              <i class="bi bi-arrow-left"></i> Volver
            </button>
          </div>
          <div class="col-4 text-center">
            <h2 class="section-title">Supervisión Multi-Municipalidad</h2>
          </div>
          <div class="col-4"></div>
        </div>
        <div class="row mb-3 g-2">
          <div class="col-md-3">
            <label class="form-label">Desde</label>
            <input type="date" class="form-control" id="filtro-desde" value="${defaultDesde}">
          </div>
          <div class="col-md-3">
            <label class="form-label">Hasta</label>
            <input type="date" class="form-control" id="filtro-hasta" value="${defaultHasta}">
          </div>
          <div class="col-md-3">
            <label class="form-label">Buscar</label>
            <input type="text" class="form-control" id="filtro-buscar" placeholder="Municipalidad">
          </div>
          <div class="col-md-3 d-flex align-end">
            <button class="btn btn-primary w-100" id="btn-actualizar-ranking"><i class="bi bi-arrow-repeat"></i> Actualizar</button>
          </div>
        </div>
        <div class="row">
          <div class="col-12">
            <div class="card">
              <div class="card-body">
                <div class="table-responsive">
                  <table class="table table-striped table-hover align-middle">
                    <thead>
                      <tr>
                        <th class="text-center">Ranking</th>
                        <th>Municipalidad</th>
                        <th class="text-center">Trámites</th>
                        <th class="text-center">Pagos</th>
                        <th class="text-center">Proyectos</th>
                        <th class="text-center">Usuarios Activos</th>
                        <th class="text-center">Puntuación</th>
                      </tr>
                    </thead>
                    <tbody id="tabla-ranking"></tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    const cargar = async () => {
      try {
        const desde = document.getElementById('filtro-desde').value;
        const hasta = document.getElementById('filtro-hasta').value;
        const buscar = (document.getElementById('filtro-buscar').value || '').toLowerCase();
        const res = await fetchAPI(`/dashboard/municipalidades/ranking?start=${encodeURIComponent(desde)}&end=${encodeURIComponent(hasta)}`);
        const arr = Array.isArray(res?.ranking) ? res.ranking : [];
        const filtrado = buscar ? arr.filter(i => (i.municipalidad_nombre || '').toLowerCase().includes(buscar)) : arr;
        const tbody = document.getElementById('tabla-ranking');
        if (!tbody) return;
        tbody.innerHTML = filtrado.map((item, index) => `
          <tr>
            <td class="text-center">${index + 1}</td>
            <td>${item.municipalidad_nombre || '—'}</td>
            <td class="text-center">${item.tramites}</td>
            <td class="text-center">${item.pagos}</td>
            <td class="text-center">${item.proyectos}</td>
            <td class="text-center">${item.usuarios_activos}</td>
            <td class="text-center">${Number(item.score || 0).toFixed(2)}</td>
          </tr>
        `).join('');
      } catch (e) {
        mostrarNotificacion('Error al cargar supervisión: ' + (e.message || e), 'danger');
      }
    };
    const btnActualizar = document.getElementById('btn-actualizar-ranking');
    if (btnActualizar) btnActualizar.onclick = cargar;
    const inputBuscar = document.getElementById('filtro-buscar');
    if (inputBuscar) inputBuscar.oninput = cargar;
    const btnVolver = document.getElementById('btn-volver-superadmin');
    if (btnVolver) btnVolver.onclick = () => {
      try {
        const u = typeof obtenerUsuario === 'function' ? obtenerUsuario() : { nombre: '', apellido: '' };
        if (typeof cargarInterfazSuperadmin === 'function') cargarInterfazSuperadmin(u);
      } catch (_) {}
    };
    await cargar();
  } finally {
    mostrarCargando(false);
  }
}

window.mostrarSupervisionMultiMunicipalidad = mostrarSupervisionMultiMunicipalidad;
