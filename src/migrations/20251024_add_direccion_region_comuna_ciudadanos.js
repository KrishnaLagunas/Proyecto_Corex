"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Agregar columna direccion
    await queryInterface.addColumn('ciudadanos', 'direccion', {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: 'Dirección postal del ciudadano'
    });

    // Agregar foreign key region_id referenciando a regiones
    await queryInterface.addColumn('ciudadanos', 'region_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'regiones',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'Referencia a la tabla regiones'
    });

    // Agregar foreign key comuna_id referenciando a comunas
    await queryInterface.addColumn('ciudadanos', 'comuna_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'comunas',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'Referencia a la tabla comunas'
    });

    // Índices para búsquedas por región/comuna
    try {
      await queryInterface.addIndex('ciudadanos', { fields: ['region_id'], name: 'idx_ciudadanos_region_id' });
    } catch (err) { /* ignore if exists */ }

    try {
      await queryInterface.addIndex('ciudadanos', { fields: ['comuna_id'], name: 'idx_ciudadanos_comuna_id' });
    } catch (err) { /* ignore if exists */ }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('ciudadanos', 'idx_ciudadanos_comuna_id').catch(() => {});
    await queryInterface.removeIndex('ciudadanos', 'idx_ciudadanos_region_id').catch(() => {});
    await queryInterface.removeColumn('ciudadanos', 'comuna_id').catch(() => {});
    await queryInterface.removeColumn('ciudadanos', 'region_id').catch(() => {});
    await queryInterface.removeColumn('ciudadanos', 'direccion').catch(() => {});
  }
};