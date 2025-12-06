const { Tramite, Pago, Usuario, Municipalidad, Departamento } = require('../models');
const { Op } = require('sequelize');

/**
 * Controlador para el dashboard
 */
const dashboardController = {
  /**
   * Obtiene el resumen general del dashboard
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @param {Function} next - Función next de Express
   */
  getResumenGeneral: async (req, res, next) => {
    try {
      const rol = req.user?.rol_nombre;
      const muniId = req.user?.municipalidad_id || null;

      const isSuperAdmin = rol === 'superadministrador';
      const isAdmin = rol === 'administrador';
      const isFuncionario = rol === 'funcionario' || rol === 'secretaria comunitaria' || rol === 'secretaria de obras' || rol === 'secretaria de transito' || rol === 'secretaria partes' || rol === 'tesoreria municipal';

      // Filtros por municipalidad
      const emptyFilter = { municipalidad_id: -1 };
      const filtraPorMuni = (isAdmin || isFuncionario);
      let tramiteWhere = {};
      if (filtraPorMuni) {
        if (!muniId) {
          tramiteWhere = emptyFilter;
        } else if (isAdmin) {
          tramiteWhere = { [require('sequelize').Op.or]: [ { municipalidad_id: muniId }, { municipalidad_id: null } ] };
        } else {
          tramiteWhere = { municipalidad_id: muniId };
        }
      }
      // Proyectos deshabilitados
      const usuarioWhere = filtraPorMuni ? (muniId ? { municipalidad_id: muniId } : emptyFilter) : {};

      const safeEval = async (fn) => { try { return await fn(); } catch (_) { return 0; } };

      // Conteos y sumas
      const totalTramites = await safeEval(() => Tramite.count({ where: tramiteWhere }));
      let totalPagosMonto = 0;
      let totalPagosCount = 0;
      if (filtraPorMuni && muniId) {
        totalPagosMonto = await safeEval(() => Pago.sum('monto', { include: [{ model: Tramite, required: true, where: { municipalidad_id: muniId } }] })) || 0;
        totalPagosCount = await safeEval(() => Pago.count({ include: [{ model: Tramite, required: true, where: { municipalidad_id: muniId } }] })) || 0;
      } else {
        totalPagosMonto = await safeEval(() => Pago.sum('monto')) || 0;
        totalPagosCount = await safeEval(() => Pago.count()) || 0;
      }
      const proyectosActivos = 0;
      const totalUsuarios = await safeEval(() => Usuario.count({ where: usuarioWhere }));
      const totalMunicipalidades = filtraPorMuni ? (muniId ? 1 : 0) : await safeEval(() => Municipalidad.count());
      const totalDepartamentos = filtraPorMuni && muniId
        ? await safeEval(() => Departamento.count({ where: { municipalidad_id: muniId } }))
        : await safeEval(() => Departamento.count());

      // Estadísticas de trámites por estado (filtradas)
      let tramitesPorEstado = [];
      try {
        tramitesPorEstado = await Tramite.findAll({
          attributes: [
            'estado',
            [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'cantidad']
          ],
          where: tramiteWhere,
          group: ['estado']
        });
      } catch (_) { tramitesPorEstado = []; }

      // Obtener estadísticas de pagos por mes (últimos 6 meses)
      const fechaInicio = new Date();
      fechaInicio.setMonth(fechaInicio.getMonth() - 6);

      const pagosPorMesOptions = {
        attributes: [
          [require('sequelize').fn('DATE_FORMAT', require('sequelize').col('fecha_pago'), '%Y-%m'), 'mes'],
          [require('sequelize').fn('SUM', require('sequelize').col('monto')), 'total']
        ],
        where: {
          fecha_pago: {
            [Op.gte]: fechaInicio
          }
        },
        group: [require('sequelize').fn('DATE_FORMAT', require('sequelize').col('fecha_pago'), '%Y-%m')],
        order: [[require('sequelize').fn('DATE_FORMAT', require('sequelize').col('fecha_pago'), '%Y-%m'), 'ASC']]
      };
      if (filtraPorMuni && muniId) {
        pagosPorMesOptions.include = [{ model: Tramite, required: true, where: { municipalidad_id: muniId } }];
      }
      let pagosPorMes = [];
      try { pagosPorMes = await Pago.findAll(pagosPorMesOptions); } catch (_) { pagosPorMes = []; }

      // Pagos recientes (últimos 30 días) como conteo
      const fechaRecientes = new Date();
      fechaRecientes.setDate(fechaRecientes.getDate() - 30);
      let pagosRecientes = 0;
      try {
        const recientesOptions = {
          where: {
            fecha_pago: {
              [Op.gte]: fechaRecientes
            }
          }
        };
        if (filtraPorMuni && muniId) {
          recientesOptions.include = [{ model: Tramite, required: true, where: { municipalidad_id: muniId } }];
        }
        pagosRecientes = await Pago.count(recientesOptions);
      } catch (e) { pagosRecientes = 0; }

      // Métricas de trámites gratis vs de pago
      let tramitesPagoCount = 0;
      let tramitesGratisCount = 0;
      try {
        tramitesPagoCount = await Tramite.count({ where: { ...tramiteWhere, requiere_pago: true } });
      } catch (_) { tramitesPagoCount = 0; }
      try {
        tramitesGratisCount = await Tramite.count({ where: { ...tramiteWhere, [Op.or]: [{ requiere_pago: false }, { monto: { [Op.lte]: 0 } }] } });
      } catch (_) { tramitesGratisCount = 0; }

      const resumen = {
        totalTramites,
        totalPagos: parseFloat(totalPagosMonto) || 0,
        totalPagosCount: parseInt(totalPagosCount) || 0,
        totalUsuarios,
        proyectosActivos,
        totalDepartamentos,
        pagosRecientes,
        tramitesPagoCount: parseInt(tramitesPagoCount) || 0,
        tramitesGratisCount: parseInt(tramitesGratisCount) || 0,
        tramitesPorEstado: tramitesPorEstado.map(item => ({
          estado: item.estado,
          cantidad: parseInt(item.dataValues.cantidad)
        })),
        pagosPorMes: pagosPorMes.map(item => ({
          mes: item.dataValues.mes,
          total: parseFloat(item.dataValues.total)
        }))
      };

      res.json({ success: true, data: resumen });
    } catch (error) {
      const resumen = {
        totalTramites: 0,
        totalPagos: 0,
        totalPagosCount: 0,
        totalUsuarios: 0,
        proyectosActivos: 0,
        totalDepartamentos: 0,
        pagosRecientes: 0,
        tramitesPorEstado: [],
        pagosPorMes: []
      };
      res.json({ success: true, data: resumen });
    }
  },

  /**
   * Obtiene el resumen por municipalidad
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @param {Function} next - Función next de Express
   */
  getResumenDepartamento: async (req, res, next) => {
    try {
      const { municipalidad_id, departamento_id } = req.params;
      const usuario = req.user;

      // Determinar municipalidad: param explícito, compatibilidad con departamento_id, o del usuario
      const muniId = municipalidad_id || departamento_id || usuario.municipalidad_id;

      if (!muniId) {
        return res.status(400).json({
          success: false,
          message: 'No se pudo determinar la municipalidad'
        });
      }

      // Obtener estadísticas de la municipalidad
      const [tramitesPendientes, tramitesCompletados, tramitesTotales] = await Promise.all([
        Tramite.count({
          where: {
            municipalidad_id: muniId,
            estado: 'pendiente'
          }
        }),
        Tramite.count({
          where: {
            municipalidad_id: muniId,
            estado: 'finalizado'
          }
        }),
        Tramite.count({
          where: {
            municipalidad_id: muniId
          }
        })
      ]);

      const resumen = {
        tramitesPendientes,
        tramitesCompletados,
        tramitesTotales,
        tramitesEnProceso: tramitesTotales - tramitesPendientes - tramitesCompletados
      };

      res.json({
        success: true,
        data: resumen
      });
    } catch (error) {
      console.error('Error al obtener resumen de la municipalidad:', error);
      next(error);
    }
  }
  ,
  /**
   * Ranking de uso por municipalidad (últimos 90 días)
   * Acceso: solo superadministrador
   */
  getMunicipalidadesRanking: async (req, res, next) => {
    try {
      const rol = req.user?.rol_nombre;
      if (rol !== 'superadministrador') {
        return res.status(403).json({ success: false, message: 'No tiene permisos para ver el ranking' });
      }
      const { start: qStart, end: qEnd } = req.query || {};
      const now = new Date();
      let start = new Date(now);
      start.setMonth(start.getMonth() - 3);
      let end = new Date(now);
      if (qStart) {
        const s = new Date(qStart);
        if (!isNaN(s.getTime())) start = s;
      }
      if (qEnd) {
        const e = new Date(qEnd);
        if (!isNaN(e.getTime())) end = e;
      }

      // Tramites por municipalidad
      const tramites = await Tramite.findAll({
        attributes: [
          'municipalidad_id',
          [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'tramites']
        ],
        where: { fecha_solicitud: { [Op.between]: [start, end] } },
        group: ['municipalidad_id']
      });

      // Pagos por municipalidad via tramite
      const pagos = await Pago.findAll({
        attributes: [
          [require('sequelize').fn('COUNT', require('sequelize').col('Pago.id')), 'pagos']
        ],
        include: [{ model: Tramite, required: true, attributes: [], where: { municipalidad_id: { [Op.ne]: null } } }],
        where: { fecha_pago: { [Op.between]: [start, end] } },
        group: ['Tramite.municipalidad_id']
      });

      // Proyectos deshabilitados

      // Usuarios activos por municipalidad (último login)
      const usuarios = await Usuario.findAll({
        attributes: [
          'municipalidad_id',
          [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'usuarios_activos']
        ],
        where: { ultimo_login: { [Op.between]: [start, end] } },
        group: ['municipalidad_id']
      });

      // Unir métricas
      const map = new Map();
      const add = (id, key, value) => {
        if (!id) return;
        const o = map.get(id) || { municipalidad_id: id, tramites: 0, pagos: 0, proyectos: 0, usuarios_activos: 0 };
        o[key] = Number(value) || 0;
        map.set(id, o);
      };

      tramites.forEach(t => add(t.municipalidad_id, 'tramites', t.dataValues.tramites));
      pagos.forEach(p => add(p.dataValues.Tramite.municipalidad_id, 'pagos', p.dataValues.pagos));
      // Proyectos deshabilitados
      usuarios.forEach(u => add(u.municipalidad_id, 'usuarios_activos', u.dataValues.usuarios_activos));

      const ids = Array.from(map.keys());
      const muniRows = ids.length ? await Municipalidad.findAll({ where: { id: { [require('sequelize').Op.in]: ids } }, attributes: ['id', 'nombre'] }) : [];
      const muniMap = new Map(muniRows.map(m => [m.id, m.nombre]));

      const ranking = Array.from(map.values()).map(r => ({
        municipalidad_id: r.municipalidad_id,
        municipalidad_nombre: muniMap.get(r.municipalidad_id) || null,
        tramites: r.tramites,
        pagos: r.pagos,
        proyectos: r.proyectos,
        usuarios_activos: r.usuarios_activos,
        score: r.tramites + r.pagos * 2 + Math.min(r.usuarios_activos, 100) * 0.1
      })).sort((a, b) => b.score - a.score);

      res.json({ success: true, ranking });
    } catch (error) {
      console.error('Error en ranking de municipalidades:', error);
      next(error);
    }
  }
};

module.exports = dashboardController;
