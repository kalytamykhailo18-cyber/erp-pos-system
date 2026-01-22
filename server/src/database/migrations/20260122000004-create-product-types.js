'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('product_types', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
        comment: 'Product type name (e.g., Food, Snacks, Accessories, Medicated, Hygiene, Toys)'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      sort_order: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'Display order in dropdowns'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('product_types', ['name']);
    await queryInterface.addIndex('product_types', ['is_active']);
    await queryInterface.addIndex('product_types', ['sort_order']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('product_types');
  }
};
