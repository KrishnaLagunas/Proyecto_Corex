require('dotenv').config();
const { Op, literal } = require('sequelize');
const { sequelize } = require('../src/config/database');
const { Tramite, Pago, Usuario, Municipalidad, Departamento } = require('../src/models');

(async () => {
  try {
    await sequelize.authenticate();
    const modeTipos = process.argv.includes('--tipos-por-departamento');
    if (modeTipos) {
      const tramitesPago = await Tramite.findAll({
        where: { requiere_pago: true },
        attributes: ['id', 'tipo', 'monto', 'departamento_id'],
        include: [{ model: Departamento, attributes: ['id', 'nombre'] }],
        order: [['departamento_id', 'ASC'], ['tipo', 'ASC']]
      });
      const map = new Map();
      for (const t of tramitesPago) {
        const depId = t.departamento_id || null;
        const depName = t.Departamento ? t.Departamento.nombre : null;
        const key = `${depId || 'null'}|${depName || ''}`;
        if (!map.has(key)) {
          map.set(key, { departamento_id: depId, departamento: depName, tipos: [] });
        }
        const tipos = map.get(key).tipos;
        const exists = tipos.find(x => x.tipo === t.tipo && Number(x.monto) === Number(t.monto || 0));
        if (!exists) {
          tipos.push({ tipo: t.tipo, monto: Number(t.monto || 0) });
        }
      }
      const output = Array.from(map.values());
      console.log(JSON.stringify(output, null, 2));
      process.exit(0);
    } else {
      const tramites = await Tramite.findAll({
        where: {
          [Op.or]: [
            { pago_completado: true },
            literal(`EXISTS (SELECT 1 FROM pagos AS p WHERE p.tramite_id = Tramite.id AND p.estado = 'completado')`)
          ]
        },
        include: [
          { model: Municipalidad, attributes: ['id', 'nombre'] },
          { model: Usuario, as: 'ciudadano', attributes: ['id', 'nombre', 'apellido', 'email', 'rut'] },
          { model: Pago, attributes: ['id', 'codigo', 'monto', 'estado', 'fecha_pago'], where: { estado: 'completado' }, required: false }
        ],
        order: [['fecha_solicitud', 'DESC']]
      });
      const output = tramites.map(t => {
        const pagos = Array.isArray(t.Pagos) ? t.Pagos : [];
        const total = pagos.reduce((acc, p) => acc + Number(p.monto || 0), 0);
        return {
          id: t.id,
          codigo: t.codigo,
          titulo: t.titulo,
          tipo: t.tipo,
          estado_tramite: t.estado,
          pago_completado: !!t.pago_completado,
          ciudadano: t.ciudadano ? `${t.ciudadano.nombre} ${t.ciudadano.apellido}`.trim() : null,
          municipalidad: t.Municipalidad ? t.Municipalidad.nombre : null,
          pagos_completados: pagos.length,
          monto_pagado_total: total
        };
      });
      console.log(JSON.stringify(output, null, 2));
      process.exit(0);
    }
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
