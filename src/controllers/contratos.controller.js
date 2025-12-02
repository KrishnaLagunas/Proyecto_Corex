const { Contrato, Proveedor, Municipalidad, Usuario, Rol } = require('../models');
const { ApiError } = require('../middlewares/errorHandler');
const logger = require('../utils/logger');
const { Op } = require('sequelize');
const sequelize = require('sequelize');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

/**
 * Controlador para el manejo de contratos municipales
 */
const contratosController = {
  /**
   * Obtiene todos los contratos con paginación y filtros
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @param {Function} next - Función next de Express
   */
  getAllContratos: async (req, res, next) => {
    try {
      const { 
        page = 1, 
        limit = 10, 
        estado, 
        tipo,
        modalidad,
        proveedor_id,
        municipalidad_id,
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
      
      // Filtro por modalidad
      if (modalidad) {
        where.modalidad = modalidad;
      }
      
      // Filtro por proveedor
      if (proveedor_id) {
        where.proveedor_id = proveedor_id;
      }
      
      // Filtro por municipalidad
      if (municipalidad_id) {
        where.municipalidad_id = municipalidad_id;
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
      if (req.user.rol_nombre === 'secretaria comunitaria') {
        // Los funcionarios solo ven los contratos de su municipalidad
        const funcionario = await Usuario.findByPk(req.user.id, {
          include: [{ model: Municipalidad }]
        });
        
        if (funcionario.Municipalidad) {
          where.municipalidad_id = funcionario.Municipalidad.id;
        } else {
          // Si el funcionario no tiene municipalidad asignada, no ve ningún contrato
          return res.json({
            contratos: [],
            pagination: {
              total: 0,
              totalPages: 0,
              currentPage: parseInt(page),
              limit: parseInt(limit)
            }
          });
        }
      } else if (req.user.rol_nombre === 'ciudadano') {
        // Los ciudadanos solo pueden ver contratos públicos y activos
        where.publico = true;
        where.estado = { [Op.in]: ['activo', 'finalizado'] };
      }
      // Los administradores pueden ver todos los contratos (no se aplica filtro adicional)
      
      // Calcular offset para paginación
      const offset = (page - 1) * limit;
      
      // Validar campo de ordenamiento
      const validSortFields = ['createdAt', 'nombre', 'fecha_inicio', 'fecha_fin', 'monto_total', 'estado'];
      const sortField = validSortFields.includes(sort) ? sort : 'createdAt';
      
      // Validar dirección de ordenamiento
      const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
      
      // Ejecutar consulta
      const { count, rows } = await Contrato.findAndCountAll({
        where,
        include: [
          { 
            model: Proveedor,
            attributes: ['id', 'codigo', 'razon_social', 'rut'] 
          },
          { 
            model: Municipalidad,
            attributes: ['id', 'nombre'] 
          },
          { 
            model: Usuario, 
            as: 'Responsable',
            attributes: ['id', 'nombre', 'apellido', 'email'] 
          }
        ],
        order: [[sortField, sortOrder]],
        limit: parseInt(limit),
        offset: offset
      });
      
      // Calcular total de páginas
      const totalPages = Math.ceil(count / limit);
      
      res.json({
        contratos: rows,
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
   * Obtiene un contrato por su ID
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @param {Function} next - Función next de Express
   */
  getContratoById: async (req, res, next) => {
    try {
      const { id } = req.params;
      
      const contrato = await Contrato.findByPk(id, {
        include: [
          { 
            model: Proveedor,
            attributes: ['id', 'codigo', 'razon_social', 'rut', 'email', 'telefono'] 
          },
          { 
            model: Municipalidad,
            attributes: ['id', 'nombre'] 
          },
          { 
            model: Usuario, 
            as: 'Responsable',
            attributes: ['id', 'nombre', 'apellido', 'email', 'telefono'] 
          }
        ]
      });
      
      if (!contrato) {
        throw new ApiError('Contrato no encontrado', 404);
      }
      
      // Verificar permisos de acceso
      if (req.user.rol_nombre === 'ciudadano') {
        if (!contrato.publico || contrato.estado === 'borrador' || contrato.estado === 'cancelado') {
          throw new ApiError('No tienes permiso para ver este contrato', 403);
        }
      } else if (req.user.rol_nombre === 'secretaria comunitaria') {
        // Verificar si pertenece al departamento
        const funcionario = await Usuario.findByPk(req.user.id, {
          include: [{ model: Municipalidad }]
        });
        
        const esDepartamento = funcionario.Municipalidad && 
                              funcionario.Municipalidad.id === contrato.municipalidad_id;
        const esResponsable = contrato.responsable_id === req.user.id;
        
        if (!esDepartamento && !esResponsable) {
          throw new ApiError('No tienes permiso para ver este contrato', 403);
        }
      }
      
      res.json(contrato);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Crea un nuevo contrato
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @param {Function} next - Función next de Express
   */
  createContrato: async (req, res, next) => {
    try {
      const { 
        nombre, 
        descripcion, 
        tipo,
        modalidad,
        fecha_inicio,
        fecha_fin,
        monto_total,
        proveedor_id,
        municipalidad_id,
        responsable_id,
        publico
      } = req.body;
      
      // Verificar que el proveedor existe
      const proveedor = await Proveedor.findByPk(proveedor_id);
      if (!proveedor) {
        throw new ApiError('El proveedor seleccionado no existe', 400);
      }
      
      // Verificar que la municipalidad existe
      const municipalidad = await Municipalidad.findByPk(municipalidad_id);
      if (!municipalidad) {
        throw new ApiError('La municipalidad seleccionada no existe', 400);
      }
      
      // Verificar que el responsable existe y es funcionario o admin
      const responsable = await Usuario.findOne({
        where: { id: responsable_id },
        include: [{ model: Rol, where: { nombre: { [Op.in]: ['secretaria comunitaria', 'administrador', 'superadministrador'] } } }]
      });
      
      if (!responsable) {
        throw new ApiError('El responsable seleccionado no existe o no tiene permisos suficientes', 400);
      }
      
      // Crear el contrato
      const nuevoContrato = await Contrato.create({
        nombre,
        descripcion,
        tipo,
        modalidad,
        fecha_inicio,
        fecha_fin,
        monto_total,
        monto_pagado: 0, // Inicialmente no se ha pagado nada
        estado: 'borrador', // Estado inicial
        proveedor_id,
        municipalidad_id,
        responsable_id,
        publico: publico !== undefined ? publico : false
        // El código se genera automáticamente en el hook beforeCreate
      });
      
      logger.info(`Nuevo contrato creado: ${nuevoContrato.codigo} - ${nombre}`);
      
      // Obtener el contrato con sus relaciones
      const contratoCompleto = await Contrato.findByPk(nuevoContrato.id, {
        include: [
          { model: Proveedor, attributes: ['id', 'codigo', 'razon_social', 'rut'] },
          { model: Municipalidad, attributes: ['id', 'nombre'] },
          { model: Usuario, as: 'Responsable', attributes: ['id', 'nombre', 'apellido', 'email'] }
        ]
      });
      
      res.status(201).json({
        message: 'Contrato creado exitosamente',
        contrato: contratoCompleto
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Actualiza un contrato existente
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @param {Function} next - Función next de Express
   */
  updateContrato: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { 
        nombre, 
        descripcion, 
        tipo,
        modalidad,
        fecha_inicio,
        fecha_fin,
        monto_total,
        monto_pagado,
        estado,
        responsable_id,
        publico
      } = req.body;
      
      // Buscar el contrato
      const contrato = await Contrato.findByPk(id);
      if (!contrato) {
        throw new ApiError('Contrato no encontrado', 404);
      }
      
      // Verificar permisos
      if (req.user.rol_nombre === 'ciudadano') {
        throw new ApiError('No tienes permiso para modificar contratos', 403);
      }

      if (req.user.rol_nombre === 'secretaria comunitaria') {
        // Verificar si pertenece al departamento o es responsable
        const funcionario = await Usuario.findByPk(req.user.id, {
          include: [{ model: Municipalidad }]
        });
        
        const esDepartamento = funcionario.Municipalidad && 
                              funcionario.Municipalidad.id === contrato.municipalidad_id;
        const esResponsable = contrato.responsable_id === req.user.id;
        
        if (!esDepartamento && !esResponsable) {
          throw new ApiError('No tienes permiso para modificar este contrato', 403);
        }
        
        // Los funcionarios no pueden cambiar ciertos campos
        if (monto_total && monto_total !== contrato.monto_total) {
          throw new ApiError('No tienes permiso para modificar el monto total', 403);
        }
      }
      
      // Actualizar campos
      if (nombre) contrato.nombre = nombre;
      if (descripcion) contrato.descripcion = descripcion;
      if (tipo) contrato.tipo = tipo;
      if (modalidad) contrato.modalidad = modalidad;
      if (fecha_inicio) contrato.fecha_inicio = fecha_inicio;
      if (fecha_fin) contrato.fecha_fin = fecha_fin;
      
      // Solo admin puede modificar montos
      if (['administrador','superadministrador'].includes(req.user.rol_nombre)) {
        if (monto_total !== undefined) contrato.monto_total = monto_total;
      }
      
      // Actualizar monto pagado (con validaciones)
      if (monto_pagado !== undefined) {
        if (monto_pagado > contrato.monto_total) {
          throw new ApiError('El monto pagado no puede ser mayor al monto total', 400);
        }
        contrato.monto_pagado = monto_pagado;
      }
      
      if (estado) {
        // Validar transiciones de estado
        const estadosValidos = {
          'borrador': ['activo', 'cancelado'],
          'activo': ['pausado', 'finalizado', 'cancelado'],
          'pausado': ['activo', 'finalizado', 'cancelado'],
          'finalizado': [],
          'cancelado': []
        };
        
        if (!estadosValidos[contrato.estado].includes(estado)) {
          throw new ApiError(`No se puede cambiar el estado de ${contrato.estado} a ${estado}`, 400);
        }
        
        contrato.estado = estado;
      }
      
      // Actualizar responsable (solo admin)
      if (responsable_id && ['administrador','superadministrador'].includes(req.user.rol_nombre)) {
        const responsable = await Usuario.findOne({
          where: { id: responsable_id },
          include: [{ model: Rol, where: { nombre: { [Op.in]: ['secretaria comunitaria', 'administrador', 'superadministrador'] } } }]
        });
        
        if (!responsable) {
          throw new ApiError('El responsable seleccionado no existe o no tiene permisos suficientes', 400);
        }
        
        contrato.responsable_id = responsable_id;
      }
      
      // Actualizar visibilidad pública
      if (publico !== undefined) {
        contrato.publico = publico;
      }
      
      // Guardar los cambios
      await contrato.save();
      
      logger.info(`Contrato actualizado: ${contrato.codigo}`);
      
      // Obtener el contrato actualizado con sus relaciones
      const contratoActualizado = await Contrato.findByPk(id, {
        include: [
          { model: Proveedor, attributes: ['id', 'codigo', 'razon_social', 'rut'] },
          { model: Municipalidad, attributes: ['id', 'nombre'] },
          { model: Usuario, as: 'Responsable', attributes: ['id', 'nombre', 'apellido', 'email'] }
        ]
      });
      
      res.json({
        message: 'Contrato actualizado exitosamente',
        contrato: contratoActualizado
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Elimina un contrato (solo administradores)
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @param {Function} next - Función next de Express
   */
  deleteContrato: async (req, res, next) => {
    try {
      const { id } = req.params;
      
      // Solo los administradores pueden eliminar contratos
      if (!['administrador','superadministrador'].includes(req.user.rol_nombre)) {
        throw new ApiError('No tienes permiso para eliminar contratos', 403);
      }
      
      const contrato = await Contrato.findByPk(id);
      
      if (!contrato) {
        throw new ApiError('Contrato no encontrado', 404);
      }
      
      // Solo se pueden eliminar contratos en estado borrador o cancelado
      if (!['borrador', 'cancelado'].includes(contrato.estado)) {
        throw new ApiError(`No se puede eliminar un contrato en estado ${contrato.estado}`, 400);
      }
      
      // Guardar información para el log
      const codigoContrato = contrato.codigo;
      
      // Eliminar el contrato
      await contrato.destroy();
      
      logger.info(`Contrato eliminado: ${codigoContrato}`);
      
      res.json({
        message: 'Contrato eliminado exitosamente'
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Genera un PDF con la información del contrato
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @param {Function} next - Función next de Express
   */
  generateContratoPDF: async (req, res, next) => {
    try {
      const { id } = req.params;
      
      const contrato = await Contrato.findByPk(id, {
        include: [
          { model: Proveedor },
          { model: Municipalidad },
          { model: Usuario, as: 'Responsable' }
        ]
      });
      
      if (!contrato) {
        throw new ApiError('Contrato no encontrado', 404);
      }
      
      // Verificar permisos de acceso
      if (req.user.rol_nombre === 'ciudadano') {
        if (!contrato.publico || contrato.estado === 'borrador' || contrato.estado === 'cancelado') {
          throw new ApiError('No tienes permiso para ver este contrato', 403);
        }
      } else if (req.user.rol_nombre === 'secretaria comunitaria') {
        // Verificar si pertenece a la municipalidad
        const funcionario = await Usuario.findByPk(req.user.id, {
          include: [{ model: Municipalidad }]
        });
        
        const esMunicipalidad = funcionario.Municipalidad && 
                              funcionario.Municipalidad.id === contrato.municipalidad_id;
        const esResponsable = contrato.responsable_id === req.user.id;
        
        if (!esMunicipalidad && !esResponsable) {
          throw new ApiError('No tienes permiso para ver este contrato', 403);
        }
      }
      
      // Crear directorio para PDFs si no existe
      const pdfDir = path.join(__dirname, '../../uploads/pdfs');
      if (!fs.existsSync(pdfDir)) {
        fs.mkdirSync(pdfDir, { recursive: true });
      }
      
      // Nombre del archivo PDF
      const fileName = `contrato_${contrato.codigo}_${Date.now()}.pdf`;
      const filePath = path.join(pdfDir, fileName);
      
      // Crear el documento PDF
      const doc = new PDFDocument({ margin: 50 });
      
      // Pipe el PDF a un archivo
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);
      
      // Agregar contenido al PDF
      // Encabezado
      doc.fontSize(20).text('CONTRATO MUNICIPAL', { align: 'center' });
      doc.moveDown();
      doc.fontSize(16).text(`Código: ${contrato.codigo}`, { align: 'center' });
      doc.moveDown(2);
      
      // Información del contrato
      doc.fontSize(14).text('INFORMACIÓN DEL CONTRATO', { underline: true });
      doc.moveDown();
      doc.fontSize(12).text(`Nombre: ${contrato.nombre}`);
      doc.moveDown();
      doc.fontSize(12).text(`Descripción: ${contrato.descripcion}`);
      doc.moveDown();
      doc.fontSize(12).text(`Tipo: ${contrato.tipo}`);
      doc.moveDown();
      doc.fontSize(12).text(`Modalidad: ${contrato.modalidad}`);
      doc.moveDown();
      doc.fontSize(12).text(`Fecha de inicio: ${new Date(contrato.fecha_inicio).toLocaleDateString()}`);
      doc.moveDown();
      doc.fontSize(12).text(`Fecha de fin: ${new Date(contrato.fecha_fin).toLocaleDateString()}`);
      doc.moveDown();
      doc.fontSize(12).text(`Monto total: $${contrato.monto_total.toLocaleString()}`);
      doc.moveDown();
      doc.fontSize(12).text(`Monto pagado: $${contrato.monto_pagado.toLocaleString()}`);
      doc.moveDown();
      doc.fontSize(12).text(`Estado: ${contrato.estado}`);
      doc.moveDown(2);
      
      // Información del proveedor
      doc.fontSize(14).text('INFORMACIÓN DEL PROVEEDOR', { underline: true });
      doc.moveDown();
      doc.fontSize(12).text(`Razón social: ${contrato.Proveedor.razon_social}`);
      doc.moveDown();
      doc.fontSize(12).text(`RUT: ${contrato.Proveedor.rut}`);
      doc.moveDown();
      doc.fontSize(12).text(`Email: ${contrato.Proveedor.email}`);
      doc.moveDown();
      doc.fontSize(12).text(`Teléfono: ${contrato.Proveedor.telefono}`);
      doc.moveDown(2);
      
      // Información de la municipalidad
      doc.fontSize(14).text('MUNICIPALIDAD RESPONSABLE', { underline: true });
      doc.moveDown();
      doc.fontSize(12).text(`Municipalidad: ${contrato.Municipalidad.nombre}`);
      doc.moveDown();
      doc.fontSize(12).text(`ID: ${contrato.Municipalidad.id}`);
      doc.moveDown(2);
      
      // Información del responsable
      doc.fontSize(14).text('FUNCIONARIO RESPONSABLE', { underline: true });
      doc.moveDown();
      doc.fontSize(12).text(`Nombre: ${contrato.Responsable.nombre} ${contrato.Responsable.apellido}`);
      doc.moveDown();
      doc.fontSize(12).text(`Email: ${contrato.Responsable.email}`);
      doc.moveDown();
      doc.fontSize(12).text(`Teléfono: ${contrato.Responsable.telefono || 'No disponible'}`);
      doc.moveDown(2);
      
      // Pie de página
      doc.fontSize(10).text(`Documento generado el ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text('Este documento es una representación digital del contrato y no requiere firma manuscrita.', { align: 'center' });
      
      // Finalizar el PDF
      doc.end();
      
      // Esperar a que el archivo se escriba completamente
      stream.on('finish', () => {
        // Registrar la generación del PDF
        logger.info(`PDF de contrato generado: ${fileName}`);
        
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
   * Obtiene estadísticas de contratos
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @param {Function} next - Función next de Express
   */
  getContratosStats: async (req, res, next) => {
    try {
      // Solo administradores y funcionarios pueden ver estadísticas
      if (req.user.rol_nombre === 'ciudadano') {
        throw new ApiError('No tienes permiso para ver estadísticas', 403);
      }
      
      // Estadísticas por estado
      const estadoStats = await Contrato.findAll({
        attributes: [
          'estado',
          [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
          [sequelize.fn('SUM', sequelize.col('monto_total')), 'monto_total'],
          [sequelize.fn('SUM', sequelize.col('monto_pagado')), 'monto_pagado']
        ],
        group: ['estado']
      });
      
      // Estadísticas por tipo
      const tipoStats = await Contrato.findAll({
        attributes: [
          'tipo',
          [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
          [sequelize.fn('SUM', sequelize.col('monto_total')), 'monto_total']
        ],
        group: ['tipo']
      });
      
      // Estadísticas por modalidad
      const modalidadStats = await Contrato.findAll({
        attributes: [
          'modalidad',
          [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
          [sequelize.fn('SUM', sequelize.col('monto_total')), 'monto_total']
        ],
        group: ['modalidad']
      });
      
      // Estadísticas por departamento
      const departamentoStats = await Contrato.findAll({
        attributes: [
          'departamento_id',
          [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
          [sequelize.fn('SUM', sequelize.col('monto_total')), 'monto_total'],
          [sequelize.fn('SUM', sequelize.col('monto_pagado')), 'monto_pagado']
        ],
        include: [{
          model: Departamento,
          attributes: ['nombre']
        }],
        group: ['departamento_id', 'Departamento.id', 'Departamento.nombre']
      });
      
      // Porcentaje de ejecución global
      const ejecucionGlobal = await Contrato.findAll({
        attributes: [
          [sequelize.fn('SUM', sequelize.col('monto_total')), 'monto_total'],
          [sequelize.fn('SUM', sequelize.col('monto_pagado')), 'monto_pagado']
        ]
      });
      
      const porcentajeEjecucion = ejecucionGlobal[0].dataValues.monto_total > 0 ?
        (ejecucionGlobal[0].dataValues.monto_pagado / ejecucionGlobal[0].dataValues.monto_total) * 100 : 0;
      
      res.json({
        estadoPorContrato: estadoStats,
        tipoPorContrato: tipoStats,
        modalidadPorContrato: modalidadStats,
        departamentoPorContrato: departamentoStats,
        ejecucionGlobal: {
          monto_total: ejecucionGlobal[0].dataValues.monto_total,
          monto_pagado: ejecucionGlobal[0].dataValues.monto_pagado,
          porcentaje_ejecucion: porcentajeEjecucion
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = contratosController;
