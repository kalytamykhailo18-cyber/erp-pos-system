'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add LOW_PETTY_CASH and AFTER_HOURS_CLOSING to the alert_type ENUM
    await queryInterface.sequelize.query(`
      ALTER TYPE alert_type ADD VALUE IF NOT EXISTS 'LOW_PETTY_CASH';
    `);

    await queryInterface.sequelize.query(`
      ALTER TYPE alert_type ADD VALUE IF NOT EXISTS 'AFTER_HOURS_CLOSING';
    `);
  },

  async down(queryInterface, Sequelize) {
    // Cannot easily remove ENUM values in PostgreSQL
    // Would require recreating the ENUM type, which is complex and risky
    // Leaving as no-op for safety
    console.log('Cannot remove ENUM values - migration down is no-op');
  }
};
