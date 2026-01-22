'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('alerts', 'metadata', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: null,
      comment: 'Additional structured data for the alert (branch_name, amounts, references, etc.)'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('alerts', 'metadata');
  }
};
