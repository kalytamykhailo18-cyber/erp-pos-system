'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add margin_percentage column
    await queryInterface.addColumn('price_import_batches', 'margin_percentage', {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: true
    });

    // Add rounding_value column
    await queryInterface.addColumn('price_import_batches', 'rounding_value', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('price_import_batches', 'margin_percentage');
    await queryInterface.removeColumn('price_import_batches', 'rounding_value');
  }
};
