'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('customers', 'doorbell_apt', {
      type: Sequelize.STRING(100),
      allowNull: true,
      comment: 'Doorbell number or apartment number for delivery'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('customers', 'doorbell_apt');
  }
};
