"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Agregar nuevas columnas al esquema de departamentos
    await queryInterface.addColumn("departamentos", "rut", {
      type: Sequelize.STRING(20),
      allowNull: true,
      comment: "RUT del departamento"
    });

    await queryInterface.addColumn("departamentos", "region", {
      type: Sequelize.STRING(100),
      allowNull: true,
      comment: "Región del departamento"
    });

    await queryInterface.addColumn("departamentos", "comuna", {
      type: Sequelize.STRING(100),
      allowNull: true,
      comment: "Comuna del departamento"
    });

    // 'ubicacion' fue eliminada del sistema; no se agrega en esta migración

    // Índice único opcional para RUT si se desea unicidad
    try {
      await queryInterface.addIndex("departamentos", {
        fields: ["rut"],
        unique: false,
        name: "idx_departamentos_rut"
      });
    } catch (err) {
      // Ignorar creación de índice si ya existe
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex("departamentos", "idx_departamentos_rut").catch(() => {});
    await queryInterface.removeColumn("departamentos", "comuna").catch(() => {});
    await queryInterface.removeColumn("departamentos", "region").catch(() => {});
    await queryInterface.removeColumn("departamentos", "rut").catch(() => {});
    // No se gestiona 'ubicacion' aquí; su eliminación se maneja por parche dedicado
  }
};