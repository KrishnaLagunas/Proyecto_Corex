const { Proyecto, Departamento, Usuario, Presupuesto } = require('../models');
const { ApiError } = require('../middlewares/errorHandler');
const logger = require('../utils/logger');
const { Op } = require('sequelize');
const sequelize = require('sequelize');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

/**
 * Controlador para el manejo de proyectos municipales
 */
const proyectosController = {
  /**
   * Obtiene todos los proyectos con paginación y filtros
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @param {Function} next - Función next de Express
   */
  getAllProyectos: async (req, res, next) => {
    try {
      const { 
        page = 1, 
        limit = 10, 
        estado, 
        tipo,
        departamento_id,
        año_fiscal,
        search,
        sort = 'createdAt',
        order = 'DESC'
      } = req.query;

      // Construir condiciones de búsqueda
      const where = {};
      
      // Filtro por estado
      if (estado) {
        where.estado = estado;
      }
      
      // Filtro por tipo
      if (tipo) {
        where.tipo = tipo;
      }
      
      // Filtro por departamento
      if (departamento_id) {
        where.departamento_id = departamento_id;
      }
      
      // Filtro por año fiscal
      if (año_fiscal) {
        where.año_fiscal = año_fiscal;
      }
      
      // Búsqueda por texto en nombre, descripción o código
      if (search) {
        where[Op.or] = [
          { nombre: { [Op.like]: `%${search}%` } },
          { descripcion: { [Op.like]: `%${search}%` } },
          { codigo: { [Op.like]: `%${search}%` } }
        ];
      }
      
      // Restricción por rol de usuario
      if (req.user.role === 'funcionario') {
        // Los funcionarios solo ven los proyectos de su departamento o donde son responsables
        const funcionario = await Usuario.findByPk(req.user.id, {
          include: [{ model: Departamento }]
        });
        
        if (funcionario.Departamento) {
          where[Op.or] = [
            { responsable_id: req.user.id },
            { departamento_id: funcionario.Departamento.id }
          ];
        } else {
          where.responsable_id = req.user.id;
        }
      } else if (req.user.role === 'ciudadano') {
        // Los ciudadanos solo pueden ver proyectos públicos y en ciertos estados
        where.publico = true;
        where.estado = { [Op.in]: ['en_ejecucion', 'finalizado'] };
      }
      // Los administradores pueden ver todos los proyectos (no se aplica filtro adicional)
      
      // Calcular offset para paginación
      const offset = (page - 1) * limit;
      
      // Validar campo de ordenamiento
      const validSortFields = ['createdAt', 'nombre', 'fecha_inicio', 'fecha_fin', 'presupuesto_asignado', 'estado'];
      const sortField = validSortFields.includes(sort) ? sort : 'createdAt';
      
      // Validar dirección de ordenamiento
      const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
      
      // Ejecutar consulta
      const { count, rows } = await Proyecto.findAndCountAll({
        where,
        include: [
          { 
            model: Departamento,
            attributes: ['id', 'nombre'] 
          },
          { 
            model: Usuario, 
            as: 'Responsable',
            attributes: ['id', 'nombre', 'apellido', 'email'] 
          },
          {
            model: Presupuesto,
            attributes: ['id', 'codigo', 'nombre', 'año_fiscal']
          }
        ],
        order: [[sortField, sortOrder]],
        limit: parseInt(limit),
        offset: offset
      });
      
      // Calcular total de páginas
      const totalPages = Math.ceil(count / limit);
      
      res.json({
        proyectos: rows,
        pagination: {
          total: count,
          totalPages,
          currentPage: parseInt(page),
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Obtiene un proyecto por su ID
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @param {Function} next - Función next de Express
   */
  getProyectoById: async (req, res, next) => {
    try {
      const { id } = req.params;
      
      const proyecto = await Proyecto.findByPk(id, {
        include: [
          { 
            model: Departamento,
            attributes: ['id', 'nombre'] 
          },
          { 
            model: Usuario, 
            as: 'Responsable',
            attributes: ['id', 'nombre', 'apellido', 'email', 'telefono'] 
          },
          {
            model: Presupuesto,
            attributes: ['id', 'codigo', 'nombre', 'año_fiscal', 'monto_total', 'monto_ejecutado']
          }
        ]
      });
      
      if (!proyecto) {
        throw new ApiError('Proyecto no encontrado', 404);
      }
      
      // Verificar permisos de acceso
      if (req.user.role === 'ciudadano') {
        if (!proyecto.publico || !['en_ejecucion', 'finalizado'].includes(proyecto.estado)) {
          throw new ApiError('No tienes permiso para ver este proyecto', 403);
        }
      } else if (req.user.role === 'funcionario') {
        // Verificar si pertenece al departamento o es responsable
        const funcionario = await Usuario.findByPk(req.user.id, {
          include: [{ model: Departamento }]
        });
        
        const esDepartamento = funcionario.Departamento && 
                              funcionario.Departamento.id === proyecto.departamento_id;
        const esResponsable = proyecto.responsable_id === req.user.id;
        
        if (!esDepartamento && !esResponsable) {
          throw new ApiError('No tienes permiso para ver este proyecto', 403);
        }
      }
      
      res.json(proyecto);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Crea un nuevo proyecto
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @param {Function} next - Función next de Express
   */
  createProyecto: async (req, res, next) => {
    try {
      const { 
        nombre, 
        descripcion, 
        tipo,
        fecha_inicio,
        fecha_fin,
        presupuesto_asignado,
        departamento_id,
        responsable_id,
        presupuesto_id,
        año_fiscal,
        publico
      } = req.body;
      
      // Verificar que el departamento existe
      const departamento = await Departamento.findByPk(departamento_id);
      if (!departamento) {
        throw new ApiError('El departamento seleccionado no existe', 400);
      }
      
      // Verificar que el responsable existe y es funcionario o admin
      const responsable = await Usuario.findOne({
        where: { 
          id: responsable_id, 
          role: { [Op.in]: ['funcionario', 'admin'] }
        }
      });
      
      if (!responsable) {
        throw new ApiError('El responsable seleccionado no existe o no tiene permisos suficientes', 400);
      }
      
      // Verificar que el presupuesto existe y tiene fondos suficientes
      if (presupuesto_id) {
        const presupuesto = await Presupuesto.findByPk(presupuesto_id);
        if (!presupuesto) {
          throw new ApiError('El presupuesto seleccionado no existe', 400);
        }
        
        // Verificar que el presupuesto pertenece al mismo departamento
        if (presupuesto.departamento_id !== departamento_id) {
          throw new ApiError('El presupuesto debe pertenecer al mismo departamento del proyecto', 400);
        }
        
        // Verificar que hay fondos suficientes
        const proyectosExistentes = await Proyecto.findAll({
          where: { presupuesto_id }
        });
        
        const presupuestoUtilizado = proyectosExistentes.reduce(
          (total, proyecto) => total + proyecto.presupuesto_asignado, 0
        );
        
        const presupuestoDisponible = presupuesto.monto_total - presupuestoUtilizado;
        
        if (presupuesto_asignado > presupuestoDisponible) {
          throw new ApiError(
            `Presupuesto insuficiente. Disponible: $${presupuestoDisponible.toLocaleString()}, Solicitado: $${presupuesto_asignado.toLocaleString()}`,
            400
          );
        }
      }
      
      // Crear el proyecto
      const nuevoProyecto = await Proyecto.create({
        nombre,
        descripcion,
        tipo,
        fecha_inicio,
        fecha_fin,
        presupuesto_asignado,
        presupuesto_ejecutado: 0, // Inicialmente no se ha ejecutado nada
        estado: 'planificacion', // Estado inicial
        departamento_id,
        responsable_id,
        presupuesto_id,
        año_fiscal,
        publico: publico !== undefined ? publico : false
        // El código se genera automáticamente en el hook beforeCreate
      });
      
      logger.info(`Nuevo proyecto creado: ${nuevoProyecto.codigo} - ${nombre}`);
      
      // Obtener el proyecto con sus relaciones
      const proyectoCompleto = await Proyecto.findByPk(nuevoProyecto.id, {
        include: [
          { model: Departamento, attributes: ['id', 'nombre'] },
          { model: Usuario, as: 'Responsable', attributes: ['id', 'nombre', 'apellido', 'email'] },
          { model: Presupuesto, attributes: ['id', 'codigo', 'nombre', 'año_fiscal'] }
        ]
      });
      
      res.status(201).json({
        message: 'Proyecto creado exitosamente',
        proyecto: proyectoCompleto
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Actualiza un proyecto existente
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @param {Function} next - Función next de Express
   */
  updateProyecto: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { 
        nombre, 
        descripcion, 
        tipo,
        fecha_inicio,
        fecha_fin,
        presupuesto_asignado,
        presupuesto_ejecutado,
        estado,
        responsable_id,
        publico
      } = req.body;
      
      // Buscar el proyecto
      const proyecto = await Proyecto.findByPk(id, {
        include: [{ model: Presupuesto }]
      });
      
      if (!proyecto) {
        throw new ApiError('Proyecto no encontrado', 404);
      }
      
      // Verificar permisos
      if (req.user.role === 'ciudadano') {
        throw new ApiError('No tienes permiso para modificar proyectos', 403);
      }
      
      if (req.user.role === 'funcionario') {
        // Verificar si es responsable
        if (proyecto.responsable_id !== req.user.id) {
          throw new ApiError('Solo el responsable puede modificar este proyecto', 403);
        }
        
        // Los funcionarios no pueden cambiar ciertos campos
        if (presupuesto_asignado && presupuesto_asignado !== proyecto.presupuesto_asignado) {
          throw new ApiError('No tienes permiso para modificar el presupuesto asignado', 403);
        }
      }
      
      // Actualizar campos
      if (nombre) proyecto.nombre = nombre;
      if (descripcion) proyecto.descripcion = descripcion;
      if (tipo) proyecto.tipo = tipo;
      if (fecha_inicio) proyecto.fecha_inicio = fecha_inicio;
      if (fecha_fin) proyecto.fecha_fin = fecha_fin;
      
      // Solo admin puede modificar presupuesto asignado
      if (presupuesto_asignado !== undefined && req.user.role === 'admin') {
        // Verificar que hay fondos suficientes en el presupuesto
        if (proyecto.presupuesto_id) {
          const presupuesto = proyecto.Presupuesto;
          
          // Calcular presupuesto utilizado por otros proyectos
          const proyectosExistentes = await Proyecto.findAll({
            where: { 
              presupuesto_id: proyecto.presupuesto_id,
              id: { [Op.ne]: id } // Excluir el proyecto actual
            }
          });
          
          const presupuestoUtilizado = proyectosExistentes.reduce(
            (total, p) => total + p.presupuesto_asignado, 0
          );
          
          const presupuestoDisponible = presupuesto.monto_total - presupuestoUtilizado;
          
          if (presupuesto_asignado > (presupuestoDisponible + proyecto.presupuesto_asignado)) {
            throw new ApiError(
              `Presupuesto insuficiente. Disponible: $${(presupuestoDisponible + proyecto.presupuesto_asignado).toLocaleString()}, Solicitado: $${presupuesto_asignado.toLocaleString()}`,
              400
            );
          }
        }
        
        proyecto.presupuesto_asignado = presupuesto_asignado;
      }
      
      // Actualizar presupuesto ejecutado (con validaciones)
      if (presupuesto_ejecutado !== undefined) {
        if (presupuesto_ejecutado > proyecto.presupuesto_asignado) {
          throw new ApiError('El presupuesto ejecutado no puede ser mayor al presupuesto asignado', 400);
        }
        proyecto.presupuesto_ejecutado = presupuesto_ejecutado;
      }
      
      if (estado) {
        // Validar transiciones de estado
        const estadosValidos = {
          'planificacion': ['en_ejecucion', 'cancelado'],
          'en_ejecucion': ['pausado', 'finalizado'],
          'pausado': ['en_ejecucion', 'finalizado', 'cancelado'],
          'finalizado': [],
          'cancelado': []
        };
        
        if (!estadosValidos[proyecto.estado].includes(estado)) {
          throw new ApiError(`No se puede cambiar el estado de ${proyecto.estado} a ${estado}`, 400);
        }
        
        proyecto.estado = estado;
      }
      
      // Actualizar responsable (solo admin)
      if (responsable_id && req.user.role === 'admin') {
        const responsable = await Usuario.findOne({
          where: { 
            id: responsable_id, 
            role: { [Op.in]: ['funcionario', 'admin'] }
          }
        });
        
        if (!responsable) {
          throw new ApiError('El responsable seleccionado no existe o no tiene permisos suficientes', 400);
        }
        
        proyecto.responsable_id = responsable_id;
      }
      
      // Actualizar visibilidad pública
      if (publico !== undefined) {
        proyecto.publico = publico;
      }
      
      // Guardar los cambios
      await proyecto.save();
      
      logger.info(`Proyecto actualizado: ${proyecto.codigo}`);
      
      // Obtener el proyecto actualizado con sus relaciones
      const proyectoActualizado = await Proyecto.findByPk(id, {
        include: [
          { model: Departamento, attributes: ['id', 'nombre'] },
          { model: Usuario, as: 'Responsable', attributes: ['id', 'nombre', 'apellido', 'email'] },
          { model: Presupuesto, attributes: ['id', 'codigo', 'nombre', 'año_fiscal'] }
        ]
      });
      
      res.json({
        message: 'Proyecto actualizado exitosamente',
        proyecto: proyectoActualizado
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Elimina un proyecto (solo administradores)
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @param {Function} next - Función next de Express
   */
  deleteProyecto: async (req, res, next) => {
    try {
      const { id } = req.params;
      
      // Solo los administradores pueden eliminar proyectos
      if (req.user.role !== 'admin') {
        throw new ApiError('No tienes permiso para eliminar proyectos', 403);
      }
      
      const proyecto = await Proyecto.findByPk(id);
      
      if (!proyecto) {
        throw new ApiError('Proyecto no encontrado', 404);
      }
      
      // Solo se pueden eliminar proyectos en estado planificación o cancelado
      if (!['planificacion', 'cancelado'].includes(proyecto.estado)) {
        throw new ApiError(`No se puede eliminar un proyecto en estado ${proyecto.estado}`, 400);
      }
      
      // Guardar información para el log
      const codigoProyecto = proyecto.codigo;
      
      // Eliminar el proyecto
      await proyecto.destroy();
      
      logger.info(`Proyecto eliminado: ${codigoProyecto}`);
      
      res.json({
        message: 'Proyecto eliminado exitosamente'
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Genera un PDF con la información del proyecto
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @param {Function} next - Función next de Express
   */
  generateProyectoPDF: async (req, res, next) => {
    try {
      const { id } = req.params;
      
      const proyecto = await Proyecto.findByPk(id, {
        include: [
          { model: Departamento },
          { model: Usuario, as: 'Responsable' },
          { model: Presupuesto }
        ]
      });
      
      if (!proyecto) {
        throw new ApiError('Proyecto no encontrado', 404);
      }
      
      // Verificar permisos de acceso
      if (req.user.role === 'ciudadano') {
        if (!proyecto.publico || !['en_ejecucion', 'finalizado'].includes(proyecto.estado)) {
          throw new ApiError('No tienes permiso para ver este proyecto', 403);
        }
      } else if (req.user.role === 'funcionario') {
        // Verificar si pertenece al departamento o es responsable
        const funcionario = await Usuario.findByPk(req.user.id, {
          include: [{ model: Departamento }]
        });
        
        const esDepartamento = funcionario.Departamento && 
                              funcionario.Departamento.id === proyecto.departamento_id;
        const esResponsable = proyecto.responsable_id === req.user.id;
        
        if (!esDepartamento && !esResponsable) {
          throw new ApiError('No tienes permiso para ver este proyecto', 403);
        }
      }
      
      // Crear directorio para PDFs si no existe
      const pdfDir = path.join(__dirname, '../../uploads/pdfs');
      if (!fs.existsSync(pdfDir)) {
        fs.mkdirSync(pdfDir, { recursive: true });
      }
      
      // Nombre del archivo PDF
      const fileName = `proyecto_${proyecto.codigo}_${Date.now()}.pdf`;
      const filePath = path.join(pdfDir, fileName);
      
      // Crear el documento PDF
      const doc = new PDFDocument({ margin: 50 });
      
      // Pipe el PDF a un archivo
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);
      
      // Agregar contenido al PDF
      // Encabezado
      doc.fontSize(20).text('PROYECTO MUNICIPAL', { align: 'center' });
      doc.moveDown();
      doc.fontSize(16).text(`Código: ${proyecto.codigo}`, { align: 'center' });
      doc.moveDown(2);
      
      // Información del proyecto
      doc.fontSize(14).text('INFORMACIÓN DEL PROYECTO', { underline: true });
      doc.moveDown();
      doc.fontSize(12).text(`Nombre: ${proyecto.nombre}`);
      doc.moveDown();
      doc.fontSize(12).text(`Descripción: ${proyecto.descripcion}`);
      doc.moveDown();
      doc.fontSize(12).text(`Tipo: ${proyecto.tipo}`);
      doc.moveDown();
      doc.fontSize(12).text(`Año fiscal: ${proyecto.año_fiscal}`);
      doc.moveDown();
      doc.fontSize(12).text(`Fecha de inicio: ${new Date(proyecto.fecha_inicio).toLocaleDateString()}`);
      doc.moveDown();
      doc.fontSize(12).text(`Fecha de fin: ${new Date(proyecto.fecha_fin).toLocaleDateString()}`);
      doc.moveDown();
      doc.fontSize(12).text(`Presupuesto asignado: $${proyecto.presupuesto_asignado.toLocaleString()}`);
      doc.moveDown();
      doc.fontSize(12).text(`Presupuesto ejecutado: $${proyecto.presupuesto_ejecutado.toLocaleString()}`);
      doc.moveDown();
      doc.fontSize(12).text(`Estado: ${proyecto.estado}`);
      doc.moveDown(2);
      
      // Información del departamento
      doc.fontSize(14).text('DEPARTAMENTO RESPONSABLE', { underline: true });
      doc.moveDown();
      doc.fontSize(12).text(`Departamento: ${proyecto.Departamento.nombre}`);
      doc.moveDown();
      doc.fontSize(12).text(`Código: ${proyecto.Departamento.codigo}`);
      doc.moveDown(2);
      
      // Información del responsable
      doc.fontSize(14).text('FUNCIONARIO RESPONSABLE', { underline: true });
      doc.moveDown();
      doc.fontSize(12).text(`Nombre: ${proyecto.Responsable.nombre} ${proyecto.Responsable.apellido}`);
      doc.moveDown();
      doc.fontSize(12).text(`Email: ${proyecto.Responsable.email}`);
      doc.moveDown();
      doc.fontSize(12).text(`Teléfono: ${proyecto.Responsable.telefono || 'No disponible'}`);
      doc.moveDown(2);
      
      // Información del presupuesto asociado
      if (proyecto.Presupuesto) {
        doc.fontSize(14).text('PRESUPUESTO ASOCIADO', { underline: true });
        doc.moveDown();
        doc.fontSize(12).text(`Nombre: ${proyecto.Presupuesto.nombre}`);
        doc.moveDown();
        doc.fontSize(12).text(`Código: ${proyecto.Presupuesto.codigo}`);
        doc.moveDown();
        doc.fontSize(12).text(`Año fiscal: ${proyecto.Presupuesto.año_fiscal}`);
        doc.moveDown();
        doc.fontSize(12).text(`Monto total: $${proyecto.Presupuesto.monto_total.toLocaleString()}`);
        doc.moveDown();
        doc.fontSize(12).text(`Monto ejecutado: $${proyecto.Presupuesto.monto_ejecutado.toLocaleString()}`);
        doc.moveDown(2);
      }
      
      // Pie de página
      doc.fontSize(10).text(`Documento generado el ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text('Este documento es una representación digital del proyecto y no requiere firma manuscrita.', { align: 'center' });
      
      // Finalizar el PDF
      doc.end();
      
      // Esperar a que el archivo se escriba completamente
      stream.on('finish', () => {
        // Registrar la generación del PDF
        logger.info(`PDF de proyecto generado: ${fileName}`);
        
        // Enviar el archivo como respuesta
        res.download(filePath, fileName, (err) => {
          if (err) {
            next(new ApiError('Error al descargar el archivo', 500));
          }
          
          // Eliminar el archivo después de enviarlo
          fs.unlink(filePath, (unlinkErr) => {
            if (unlinkErr) {
              logger.error(`Error al eliminar el archivo temporal: ${unlinkErr.message}`);
            }
          });
        });
      });
      
      stream.on('error', (err) => {
        next(new ApiError(`Error al generar el PDF: ${err.message}`, 500));
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Obtiene estadísticas de proyectos
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @param {Function} next - Función next de Express
   */
  getProyectosStats: async (req, res, next) => {
    try {
      // Solo administradores y funcionarios pueden ver estadísticas
      if (req.user.role === 'ciudadano') {
        throw new ApiError('No tienes permiso para ver estadísticas', 403);
      }
      
      // Estadísticas por estado
      const estadoStats = await Proyecto.findAll({
        attributes: [
          'estado',
          [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
          [sequelize.fn('SUM', sequelize.col('presupuesto_asignado')), 'presupuesto_asignado'],
          [sequelize.fn('SUM', sequelize.col('presupuesto_ejecutado')), 'presupuesto_ejecutado']
        ],
        group: ['estado']
      });
      
      // Estadísticas por tipo
      const tipoStats = await Proyecto.findAll({
        attributes: [
          'tipo',
          [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
          [sequelize.fn('SUM', sequelize.col('presupuesto_asignado')), 'presupuesto_asignado']
        ],
        group: ['tipo']
      });
      
      // Estadísticas por departamento
      const departamentoStats = await Proyecto.findAll({
        attributes: [
          'departamento_id',
          [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
          [sequelize.fn('SUM', sequelize.col('presupuesto_asignado')), 'presupuesto_asignado'],
          [sequelize.fn('SUM', sequelize.col('presupuesto_ejecutado')), 'presupuesto_ejecutado']
        ],
        include: [{
          model: Departamento,
          attributes: ['nombre']
        }],
        group: ['departamento_id', 'Departamento.id', 'Departamento.nombre']
      });
      
      // Estadísticas por año fiscal
      const añoFiscalStats = await Proyecto.findAll({
        attributes: [
          'año_fiscal',
          [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
          [sequelize.fn('SUM', sequelize.col('presupuesto_asignado')), 'presupuesto_asignado'],
          [sequelize.fn('SUM', sequelize.col('presupuesto_ejecutado')), 'presupuesto_ejecutado']
        ],
        group: ['año_fiscal'],
        order: [['año_fiscal', 'DESC']]
      });
      
      // Porcentaje de ejecución global
      const ejecucionGlobal = await Proyecto.findAll({
        attributes: [
          [sequelize.fn('SUM', sequelize.col('presupuesto_asignado')), 'presupuesto_asignado'],
          [sequelize.fn('SUM', sequelize.col('presupuesto_ejecutado')), 'presupuesto_ejecutado']
        ]
      });
      
      const porcentajeEjecucion = ejecucionGlobal[0].dataValues.presupuesto_asignado > 0 ?
        (ejecucionGlobal[0].dataValues.presupuesto_ejecutado / ejecucionGlobal[0].dataValues.presupuesto_asignado) * 100 : 0;
      
      res.json({
        estadoPorProyecto: estadoStats,
        tipoPorProyecto: tipoStats,
        departamentoPorProyecto: departamentoStats,
        añoFiscalPorProyecto: añoFiscalStats,
        ejecucionGlobal: {
          presupuesto_asignado: ejecucionGlobal[0].dataValues.presupuesto_asignado,
          presupuesto_ejecutado: ejecucionGlobal[0].dataValues.presupuesto_ejecutado,
          porcentaje_ejecucion: porcentajeEjecucion
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = proyectosController;