'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add weekday opening time
    await queryInterface.addColumn('branches', 'weekday_opening_time', {
      type: Sequelize.TIME,
      defaultValue: '08:30:00',
      comment: 'Opening time Monday-Saturday'
    });

    // Add weekday closing time
    await queryInterface.addColumn('branches', 'weekday_closing_time', {
      type: Sequelize.TIME,
      defaultValue: '20:00:00',
      comment: 'Closing time Monday-Saturday'
    });

    // Add afternoon opening time (for split shifts like Aldo Bonzi)
    await queryInterface.addColumn('branches', 'afternoon_opening_time', {
      type: Sequelize.TIME,
      allowNull: true,
      comment: 'Afternoon opening time for branches with split shifts (e.g., 16:45 for Aldo Bonzi)'
    });

    // Add Sunday opening time
    await queryInterface.addColumn('branches', 'sunday_opening_time', {
      type: Sequelize.TIME,
      defaultValue: '09:00:00',
      comment: 'Opening time on Sundays'
    });

    // Add Sunday closing time
    await queryInterface.addColumn('branches', 'sunday_closing_time', {
      type: Sequelize.TIME,
      defaultValue: '13:45:00',
      comment: 'Closing time on Sundays'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('branches', 'weekday_opening_time');
    await queryInterface.removeColumn('branches', 'weekday_closing_time');
    await queryInterface.removeColumn('branches', 'afternoon_opening_time');
    await queryInterface.removeColumn('branches', 'sunday_opening_time');
    await queryInterface.removeColumn('branches', 'sunday_closing_time');
  }
};
