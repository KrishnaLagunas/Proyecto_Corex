const { Departamento, Usuario, Proyecto, Rol, Municipalidad } = require('../models');
const { ApiError } = require('../middlewares/errorHandler');
const logger = require('../utils/logger');
const { Op } = require('sequelize');
const sequelize = require('sequelize');

/**
 * Controlador para el manejo de departamentos municipales
 */
const esMunicipalidades = (req) => {
  const b = (req.baseUrl || '') + (req.originalUrl || '') + (req.path || '');
  return b.toLowerCase().includes('municipalidades');
};


const departamentosController = {
  /**
   * Obtiene todos los departamentos con paginación y filtros
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @param {Function} next - Función next de Express
   */
  getAllDepartamentos: async (req, res, next) => {
    try {
      try { logger.info(`[Departamentos] getAllDepartamentos HIT: url=${req.originalUrl}, user=${req.user?.id}, role=${req.user?.rol_nombre}`); } catch (_) {}
      const { 
        page = 1, 
        limit = 10, 
        search,
        estado,
        sort = 'nombre',
        order = 'ASC'
      } = req.query;

      // Construir condiciones de búsqueda
      const where = {};
      
      if (search) {
        where[Op.or] = [
          { nombre: { [Op.like]: `%${search}%` } }
        ];
      }

      if (estado) {
        where.estado = estado;
      }
      
      // LOG TEMPORAL PARA DEPURACIÓN
      console.log('--- DEPARTAMENTOS QUERY ---');
      console.log('Query params:', req.query);
      console.log('Where condition:', JSON.stringify(where, null, 2));
      
      // Calcular offset para paginación
      const offset = (page - 1) * limit;
      
      // Validar campo de ordenamiento
      const validSortFields = ['nombre'];
      const sortField = validSortFields.includes(sort) ? sort : 'nombre';
      
      // Validar dirección de ordenamiento
      const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
      
      // Ejecutar consulta
      const esMun = esMunicipalidades(req);
      const consulta = esMun ? Municipalidad : Departamento;

      // Para administradores: mostrar departamentos globales sin filtrar por municipalidad
      // Todas las municipalidades comparten los mismos departamentos
      // (no se aplica where.municipalidad_id)
      let count = 0; let rows = [];
      try {
        const result = await consulta.findAndCountAll({
          where,
          order: [[sortField, sortOrder]],
          limit: parseInt(limit),
          offset: offset
        });
        count = result.count;
        rows = result.rows;
      } catch (err) {
        const code = (err?.original?.code) || (err?.parent?.code) || '';
        const msg = err?.message || '';
        if (!esMun && (/ER_NO_SUCH_TABLE/i.test(code) || /doesn'?t exist/i.test(msg) || /Unknown column .*municipalidad_id/i.test(msg))) {
          try { logger.warn('[Departamentos] Tabla departamentos no existe; devolviendo lista vacía'); } catch (err) { console.error('Error silenciado:', err.message); }
          count = 0; rows = [];
        } else {
          throw err;
        }
      }
      const rowsPlain = rows.map(r => {
        const j = typeof r.toJSON === 'function' ? r.toJSON() : r;
        const email = j.email ?? j.email_contacto ?? null;
        const telefono = j.telefono ?? j.telefono_contacto ?? null;
        return { ...j, email, telefono };
      });
      try { logger.info(`[Departamentos] ${esMun ? 'Municipalidades' : 'Departamentos'} obtenidos: ${JSON.stringify(rowsPlain)}`); } catch (err) { console.error('Error silenciado:', err.message); }
      
      // Calcular total de páginas
      const totalPages = Math.ceil(count / limit);
      
      const responseBody = {
        departamentos: rowsPlain,
        pagination: {
          total: count,
          totalPages,
          currentPage: parseInt(page),
          limit: parseInt(limit)
        }
      };
      
      try { logger.info(`[Departamentos] Respuesta enviada: ${JSON.stringify(responseBody).slice(0, 200)}...`); } catch (_) {}
      
      try { res.set('Cache-Control', 'no-store'); } catch (err) { console.error('Error silenciado:', err.message); }
      res.json(responseBody);

    } catch (error) {
      next(error);
    }
  },

  /**
   * Obtiene un departamento por su ID
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @param {Function} next - Función next de Express
   */
  getDepartamentoById: async (req, res, next) => {
    try {
      const { id } = req.params;
      const esMun = esMunicipalidades(req);
      const modelo = esMun ? Municipalidad : Departamento;
      const departamentoRaw = await modelo.findByPk(id);
      const departamento = departamentoRaw && typeof departamentoRaw.toJSON === 'function'
        ? (() => {
            const j = departamentoRaw.toJSON();
            const email = j.email ?? j.email_contacto ?? null;
            const telefono = j.telefono ?? j.telefono_contacto ?? null;
            return { ...j, email, telefono };
          })()
        : departamentoRaw;
      
      if (!departamento) {
        throw new ApiError('Departamento no encontrado', 404);
      }
      
      // Control de acceso: admin
      // Visualización global de departamentos; no restringir por municipalidad
      try { res.set('Cache-Control', 'no-store'); } catch (err) { console.error('Error silenciado:', err.message); }
      res.json(departamento);
      try { logger.info(`[Departamentos] Detalle ${esMunicipalidades(req) ? 'municipalidad' : 'departamento'} ${id}: ${JSON.stringify(departamento)}`); } catch (err) { console.error('Error silenciado:', err.message); }
    } catch (error) {
      next(error);
    }
  },

  /**
   * Crea un nuevo departamento
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @param {Function} next - Función next de Express
   */
  createDepartamento: async (req, res, next) => {
    try {
      if (!['administrador','superadministrador'].includes(req.user.rol_nombre)) {
        throw new ApiError('No tienes permiso para crear departamentos', 403);
      }
      if (esMunicipalidades(req)) {
        const raw = req.body || {};
        try { logger.info(`[Municipalidades][CREATE][RAW] ${JSON.stringify(raw)}`); console.log('[DEBUG][MUNI][RAW]', raw); } catch (err) { console.error('Error silenciado:', err.message); }
        const nombre = typeof raw.nombre === 'string' ? raw.nombre.trim() : raw.nombre;
        const direccion = typeof raw.direccion === 'string' ? raw.direccion.trim() : raw.direccion;
        const region = typeof raw.region === 'string' ? raw.region.trim() : raw.region;
        const comuna = typeof raw.comuna === 'string' ? raw.comuna.trim() : raw.comuna;
        const telefono = typeof raw.telefono === 'string' ? raw.telefono.trim() : raw.telefono;
        let telNorm = telefono ? String(telefono).replace(/[^0-9+]/g, '') : null;
        if (telNorm && !telNorm.startsWith('+')) {
          if (telNorm.startsWith('56') && telNorm.length === 11) {
            telNorm = `+${telNorm}`;
          } else if (telNorm.length === 9) {
            telNorm = `+56${telNorm}`;
          }
        }
        const email = typeof raw.email === 'string' ? raw.email.trim() : raw.email;
        const rutInput = typeof raw.rut === 'string' ? raw.rut.trim() : raw.rut;
        let rutNorm = rutInput ? String(rutInput).replace(/[^0-9kK]/g, '').toLowerCase() : null;
        if (!rutNorm && typeof raw.rut === 'string' && raw.rut.length) {
          rutNorm = raw.rut.replace(/[\.\-\s]/g, '').replace(/[^0-9kK]/g, '').toLowerCase();
        }
        try { logger.info(`[Municipalidades][CREATE][NORMALIZED] rutInput=${rutInput} -> rutNorm=${rutNorm} ; telInput=${telefono} -> telNorm=${telNorm}`); console.log('[DEBUG][MUNI][NORMALIZED]', { rutInput, rutNorm, telInput: telefono, telNorm, email, nombre, direccion, region, comuna, estado }); } catch (err) { console.error('Error silenciado:', err.message); }
        const estado = typeof raw.estado === 'string' ? raw.estado.trim().toLowerCase() : raw.estado;
        const existeNombre = await Municipalidad.findOne({ where: { nombre } });
        if (existeNombre) {
          throw new ApiError('Ya existe una municipalidad con el nombre proporcionado', 400);
        }
        if (rutNorm) {
          const existeRut = await Municipalidad.findOne({ where: { rut: rutNorm } });
          if (existeRut) {
            throw new ApiError('Ya existe una municipalidad con el RUT proporcionado', 400);
          }
        }
        if (!rutNorm) {
          throw new ApiError('El RUT es obligatorio', 400);
        }
        if (!telNorm) {
          throw new ApiError('El teléfono es obligatorio', 400);
        }
        if (!email) {
          throw new ApiError('El correo electrónico es obligatorio', 400);
        }
        try {
          try { logger.info(`[Municipalidades][CREATE][PAYLOAD] ${JSON.stringify({ nombre, rut: rutNorm || null, telefono: telNorm || telefono || null, email: email || null, direccion, region, comuna, estado })}`); console.log('[DEBUG][MUNI][PAYLOAD]', { nombre, rut: rutNorm || null, telefono: telNorm || telefono || null, email: email || null, direccion, region, comuna, estado }); } catch (err) { console.error('Error silenciado:', err.message); }
          const nuevo = await Municipalidad.create({ 
            nombre,
            direccion: direccion || null,
            region: region || null,
            comuna: comuna || null,
            telefono: telNorm,
            email,
            rut: rutNorm,
            estado: estado || 'activo'
          });
          if ((!nuevo.rut && rutNorm) || (!nuevo.telefono && (telNorm || telefono))) {
            await nuevo.update({
              rut: nuevo.rut || rutNorm,
              telefono: nuevo.telefono || telNorm || telefono || null
            });
          }
          try { logger.info(`[Municipalidades][CREATE] ${nuevo.id} rut=${nuevo.rut || ''} tel=${nuevo.telefono || ''}`); } catch (err) { console.error('Error silenciado:', err.message); }
          logger.info(`Nueva municipalidad creada: ${nombre}`);
          const completo = await Municipalidad.findByPk(nuevo.id);
          return res.status(201).json({
            message: 'Municipalidad creada exitosamente',
            departamento: completo
          });
        } catch (err) {
          const msg = (err && err.errors && err.errors[0] && err.errors[0].message) 
            || (err && err.parent && err.parent.sqlMessage)
            || err.message
            || 'Error al crear municipalidad';
          logger.error(`Error al crear municipalidad: ${msg}`);
          let out = msg;
          if (/Duplicate/i.test(msg) || /must be unique/i.test(msg)) {
            out = 'Ya existe una municipalidad con el RUT proporcionado';
          }
          throw new ApiError(out, 400);
        }
      } else {
        const { nombre, municipalidad_id, estado } = req.body;
        const hasMuniAttr = !!(Departamento && Departamento.rawAttributes && Departamento.rawAttributes.municipalidad_id);
        if (hasMuniAttr) {
          const muniId = req.user.rol_nombre === 'superadministrador' ? municipalidad_id : req.user.municipalidad_id;
          if (!muniId) {
            throw new ApiError('El administrador no tiene municipalidad asignada', 403);
          }
          const existente = await Departamento.findOne({ where: { nombre, municipalidad_id: muniId } });
          if (existente) {
            throw new ApiError('Ya existe un departamento con el nombre proporcionado', 400);
          }
          const nuevo = await Departamento.create({ nombre, municipalidad_id: muniId, estado: (estado || 'activo') });
          logger.info(`Nuevo departamento creado: ${nombre} (muni ${muniId})`);
          const completo = await Departamento.findByPk(nuevo.id);
          return res.status(201).json({ message: 'Departamento creado exitosamente', departamento: completo });
        } else {
          // Tabla de departamentos global (sin municipalidad_id): crear registro compartido
          const existente = await Departamento.findOne({ where: { nombre } });
          if (existente) {
            throw new ApiError('Ya existe un departamento con el nombre proporcionado', 400);
          }
          const nuevo = await Departamento.create({ nombre, estado: (estado || 'activo') });
          logger.info(`Nuevo departamento global creado: ${nombre}`);
          const completo = await Departamento.findByPk(nuevo.id);
          return res.status(201).json({ message: 'Departamento creado exitosamente', departamento: completo });
        }
      }
    } catch (error) {
      next(error);
    }
  },

  /**
   * Actualiza un departamento existente
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @param {Function} next - Función next de Express
   */
  updateDepartamento: async (req, res, next) => {
    try {
      if (!['administrador','superadministrador'].includes(req.user.rol_nombre)) {
        throw new ApiError('No tienes permiso para actualizar departamentos', 403);
      }
      
      const { id } = req.params;
      const esMun = esMunicipalidades(req);
      const departamento = esMun ? await Municipalidad.findByPk(id) : await Departamento.findByPk(id);
      
      if (!departamento) {
        throw new ApiError('Departamento no encontrado', 404);
      }
      if (req.user.rol_nombre === 'administrador' && !esMun) {
        const hasMuniAttr = !!(Departamento && Departamento.rawAttributes && Departamento.rawAttributes.municipalidad_id);
        if (hasMuniAttr) {
          if (!req.user.municipalidad_id || departamento.municipalidad_id !== req.user.municipalidad_id) {
            throw new ApiError('No tienes permiso para modificar departamentos de otra municipalidad', 403);
          }
        }
      }
      
      if (esMun) {
        const { nombre, direccion, region, comuna, telefono, email, rut, estado } = req.body;
        if (nombre && nombre !== departamento.nombre) {
          const existeNombre = await Municipalidad.findOne({ where: { nombre, id: { [Op.ne]: id } } });
          if (existeNombre) {
            throw new ApiError('Ya existe una municipalidad con el nombre proporcionado', 400);
          }
        }
        if (nombre) departamento.nombre = nombre;
        if (direccion !== undefined) departamento.direccion = direccion;
        if (region !== undefined) departamento.region = region;
        if (comuna !== undefined) departamento.comuna = comuna;
        if (telefono !== undefined) {
          const telVal = typeof telefono === 'string' ? telefono.trim() : telefono;
          if (telVal) {
            departamento.telefono = telVal;
          }
        }
        if (email !== undefined) {
          const emailVal = typeof email === 'string' ? email.trim() : email;
          if (emailVal) {
            departamento.email = emailVal;
          }
        }
        if (rut !== undefined) {
          const rutVal = typeof rut === 'string' ? rut.trim() : rut;
          const rutNorm = rutVal ? String(rutVal).replace(/[^0-9kK]/g, '').toLowerCase() : null;
          if (rutNorm) departamento.rut = rutNorm;
        }
        if (estado !== undefined) departamento.estado = estado;
      } else {
        const { nombre, estado } = req.body;
        if (nombre && nombre !== departamento.nombre) {
          const existenteNombre = await Departamento.findOne({
            where: { nombre, id: { [Op.ne]: id } }
          });
          if (existenteNombre) {
            throw new ApiError('Ya existe un departamento con el nombre proporcionado', 400);
          }
        }
        if (nombre) departamento.nombre = nombre;
        if (estado !== undefined) departamento.estado = estado;
      }
      
      // Guardar los cambios
      await departamento.save();
      try { logger.info(`[Departamentos] Actualizado ${esMun ? 'municipalidad' : 'departamento'} ${id}: tel=${departamento.telefono || departamento.telefono_contacto || ''}, email=${departamento.email || departamento.email_contacto || ''}`); } catch (err) { console.error('Error silenciado:', err.message); }
      
      logger.info(`Departamento actualizado: ${departamento.nombre}`);
      
      // Obtener el departamento actualizado con sus relaciones
      const departamentoActualizado = esMun ? await Municipalidad.findByPk(id) : await Departamento.findByPk(id);
      try { const j = typeof departamentoActualizado.toJSON === 'function' ? departamentoActualizado.toJSON() : departamentoActualizado; logger.info(`[Departamentos] Post-save ${esMun ? 'municipalidad' : 'departamento'} ${id}: ${JSON.stringify({ telefono: j.telefono ?? j.telefono_contacto ?? null, email: j.email ?? j.email_contacto ?? null })}`); } catch (err) { console.error('Error silenciado:', err.message); }
      
      res.json({
        message: 'Departamento actualizado exitosamente',
        departamento: departamentoActualizado
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Elimina un departamento (solo administradores)
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @param {Function} next - Función next de Express
   */
  deleteDepartamento: async (req, res, next) => {
    try {
      if (!['administrador','superadministrador'].includes(req.user.rol_nombre)) {
        throw new ApiError('No tienes permiso para eliminar departamentos', 403);
      }
      
      const { id } = req.params;
      const esMun = esMunicipalidades(req);
      const departamento = esMun ? await Municipalidad.findByPk(id) : await Departamento.findByPk(id);
      
      if (!departamento) {
        throw new ApiError('Departamento no encontrado', 404);
      }
      if (req.user.rol_nombre === 'administrador' && !esMun) {
        const hasMuniAttr = !!(Departamento && Departamento.rawAttributes && Departamento.rawAttributes.municipalidad_id);
        if (hasMuniAttr) {
          if (!req.user.municipalidad_id || departamento.municipalidad_id !== req.user.municipalidad_id) {
            throw new ApiError('No tienes permiso para eliminar departamentos de otra municipalidad', 403);
          }
        }
      }
      
      if (esMun) {
        // Verificaciones solo aplican a municipalidades
        let proyectosAsociados = 0;
        try {
          proyectosAsociados = await Proyecto.count({ where: { municipalidad_id: id } });
        } catch (err) {
          const code = (err?.original?.code) || (err?.parent?.code) || '';
          const msg = err?.message || '';
          if (/ER_NO_SUCH_TABLE/i.test(code) || /doesn'?t exist/i.test(msg)) {
            try { logger.warn('[Eliminar Municipalidad] Tabla proyectos no existe; se omite verificación de proyectos.'); } catch (err) { console.error('Error silenciado:', err.message); }
            proyectosAsociados = 0;
          } else {
            throw err;
          }
        }
        if (proyectosAsociados > 0) {
          throw new ApiError(
            `No se puede eliminar la municipalidad porque tiene ${proyectosAsociados} proyecto(s) asociado(s)`,
            400
          );
        }
        const funcionariosAsociados = await Usuario.count({ where: { municipalidad_id: id }, include: [{ model: Rol, where: { nombre: ['secretaria de educación','secretaria de salud','secretaria de seguridad'] } }] });
        if (funcionariosAsociados > 0) {
          throw new ApiError(
            `No se puede eliminar la municipalidad porque tiene ${funcionariosAsociados} funcionario(s) asociado(s)`,
            400
          );
        }
      }
      
      // Eliminar la municipalidad/departamento
      await departamento.destroy();
      try { logger.info(`[Eliminar Municipalidad] Eliminada ${departamento.nombre} (id: ${departamento.id})`); } catch (err) { console.error('Error silenciado:', err.message); }
      
      logger.info(`Departamento eliminado: ${departamento.nombre}`);
      
      res.json({
        message: 'Departamento eliminado exitosamente'
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Asigna funcionarios a un departamento
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @param {Function} next - Función next de Express
   */
  asignarFuncionarios: async (req, res, next) => {
    try {
      if (!['administrador','superadministrador'].includes(req.user.rol_nombre)) {
        throw new ApiError('No tienes permiso para asignar funcionarios', 403);
      }
      
      const { id } = req.params;
      const { funcionario_ids } = req.body;
      
      const departamento = await Departamento.findByPk(id);
      
      if (!departamento) {
        throw new ApiError('Departamento no encontrado', 404);
      }
      if (req.user.rol_nombre === 'administrador') {
        const hasMuniAttr = !!(Departamento && Departamento.rawAttributes && Departamento.rawAttributes.municipalidad_id);
        if (hasMuniAttr) {
          if (!req.user.municipalidad_id || departamento.municipalidad_id !== req.user.municipalidad_id) {
            throw new ApiError('No tienes permiso para asignar funcionarios de otra municipalidad', 403);
          }
        }
      }
      
      // Verificar que todos los funcionarios existen y tienen el rol adecuado
      const funcionarios = await Usuario.findAll({
        where: { id: { [Op.in]: funcionario_ids } },
        include: [{ model: Rol, where: { nombre: 'secretaria de educación' } }]
      });
      
      if (funcionarios.length !== funcionario_ids.length) {
        throw new ApiError('Uno o más funcionarios no existen o no tienen el rol adecuado', 400);
      }
      
      // Asignar funcionarios al departamento
      await departamento.setFuncionarios(funcionarios);
      
      logger.info(`Funcionarios asignados al departamento: ${departamento.nombre} (id: ${departamento.id})`);
      
      // Obtener el departamento actualizado con sus funcionarios
      const departamentoActualizado = await Departamento.findByPk(id, {
        include: [
          {
            model: Usuario,
            as: 'Funcionarios',
            attributes: ['id', 'nombre', 'apellido', 'email'],
            through: { attributes: [] }
          }
        ]
      });
      
      res.json({
        message: 'Funcionarios asignados exitosamente',
        departamento: departamentoActualizado
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Obtiene estadísticas de departamentos
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @param {Function} next - Función next de Express
   */
  getDepartamentosStats: async (req, res, next) => {
    try {
      // Administradores y funcionarios pueden ver estadísticas
      if (!['administrador','superadministrador','funcionario'].includes(req.user.rol_nombre)) {
        throw new ApiError('No tienes permiso para ver estadísticas', 403);
      }

      const muniId = req.user?.municipalidad_id || null;
      const isAdmin = req.user.rol_nombre === 'administrador';
      const isFuncionario = req.user.rol_nombre === 'funcionario';

      // Si es admin/funcionario y no tiene municipalidad asignada, devolver ceros
      if ((isAdmin || isFuncionario) && !muniId) {
        return res.json({
          proyectosPorDepartamento: [],
          funcionariosPorDepartamento: [],
          estadoPorDepartamento: [
            { estado: 'activo', dataValues: { total: 0 } },
            { estado: 'inactivo', dataValues: { total: 0 } }
          ]
        });
      }

      const where = (isAdmin || isFuncionario) ? { municipalidad_id: muniId } : {};

      // Conteo por estado
      let estadoPorDepartamento = [];
      try {
        estadoPorDepartamento = await Departamento.findAll({
          attributes: [
            'estado',
            [sequelize.fn('COUNT', sequelize.col('id_departamento')), 'total']
          ],
          where,
          group: ['estado']
        });
      } catch (_) {
        estadoPorDepartamento = [];
      }

      res.json({
        proyectosPorDepartamento: [],
        funcionariosPorDepartamento: [],
        estadoPorDepartamento
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = departamentosController;
