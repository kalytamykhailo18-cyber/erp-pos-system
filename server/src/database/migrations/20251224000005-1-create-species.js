'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('species', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
        comment: 'Species name (e.g., Dog, Cat, Bird, Fish, Rabbit, Hamster, Other)'
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

    await queryInterface.addIndex('species', ['name']);
    await queryInterface.addIndex('species', ['is_active']);
    await queryInterface.addIndex('species', ['sort_order']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('species');
  }
};
