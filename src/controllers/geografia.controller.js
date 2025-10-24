const { Sequelize } = require('sequelize');
const { sequelize } = require('../config/database');
const { ApiError } = require('../middlewares/errorHandler');

const geografiaController = {
  getRegiones: async (req, res, next) => {
    try {
      const [rows] = await sequelize.query('SELECT id, codigo, nombre FROM regiones ORDER BY nombre ASC');
      res.json({ regiones: rows });
    } catch (error) {
      next(error);
    }
  },
  getComunasByRegion: async (req, res, next) => {
    try {
      const { regionId } = req.params;
      if (!regionId) throw new ApiError('regionId es requerido', 400);
      const [rows] = await sequelize.query(
        'SELECT id, codigo, nombre FROM comunas WHERE region_id = :regionId ORDER BY nombre ASC',
        { replacements: { regionId } }
      );
      res.json({ comunas: rows });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = geografiaController;