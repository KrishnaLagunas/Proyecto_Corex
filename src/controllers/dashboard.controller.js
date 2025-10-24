const { Tramite, Pago, Usuario, Proyecto, Departamento } = require('../models');
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
      // Obtener conteos totales
      const [totalTramites, totalPagosMonto, totalUsuarios, proyectosActivos, totalDepartamentos] = await Promise.all([
        Tramite.count(),
        Pago.sum('monto') || 0,
        Usuario.count(),
        Proyecto ? Proyecto.count({ where: { estado: 'activo' } }) : 0,
        Departamento ? Departamento.count() : 0
      ]);

      // Nuevo: cantidad total de pagos
      const totalPagosCount = await Pago.count();

      // Obtener estadísticas de trámites por estado
      const tramitesPorEstado = await Tramite.findAll({
        attributes: [
          'estado',
          [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'cantidad']
        ],
        group: ['estado']
      });

      // Obtener estadísticas de pagos por mes (últimos 6 meses)
      const fechaInicio = new Date();
      fechaInicio.setMonth(fechaInicio.getMonth() - 6);

      const pagosPorMes = await Pago.findAll({
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
      });

      // Pagos recientes (últimos 30 días) como conteo
      const fechaRecientes = new Date();
      fechaRecientes.setDate(fechaRecientes.getDate() - 30);
      let pagosRecientes = 0;
      try {
        pagosRecientes = await Pago.count({
          where: {
            fecha_pago: {
              [Op.gte]: fechaRecientes
            }
          }
        });
      } catch (e) { pagosRecientes = 0; }

      const resumen = {
        totalTramites,
        totalPagos: parseFloat(totalPagosMonto) || 0,
        totalPagosCount: parseInt(totalPagosCount) || 0,
        totalUsuarios,
        proyectosActivos,
        totalDepartamentos,
        pagosRecientes,
        tramitesPorEstado: tramitesPorEstado.map(item => ({
          estado: item.estado,
          cantidad: parseInt(item.dataValues.cantidad)
        })),
        pagosPorMes: pagosPorMes.map(item => ({
          mes: item.dataValues.mes,
          total: parseFloat(item.dataValues.total)
        }))
      };

      res.json({
        success: true,
        data: resumen
      });
    } catch (error) {
      console.error('Error al obtener resumen del dashboard:', error);
      next(error);
    }
  },

  /**
   * Obtiene el resumen por departamento
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @param {Function} next - Función next de Express
   */
  getResumenDepartamento: async (req, res, next) => {
    try {
      const { departamento_id } = req.params;
      const usuario = req.user;

      // Si no se especifica departamento, usar el del usuario
      const deptoId = departamento_id || usuario.departamento_id;

      if (!deptoId) {
        return res.status(400).json({
          success: false,
          message: 'No se pudo determinar el departamento'
        });
      }

      // Obtener estadísticas del departamento
      const [tramitesPendientes, tramitesCompletados, tramitesTotales] = await Promise.all([
        Tramite.count({
          where: {
            departamento_id: deptoId,
            estado: 'pendiente'
          }
        }),
        Tramite.count({
          where: {
            departamento_id: deptoId,
            estado: 'completado'
          }
        }),
        Tramite.count({
          where: {
            departamento_id: deptoId
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
      console.error('Error al obtener resumen del departamento:', error);
      next(error);
    }
  }
};

module.exports = dashboardController;