'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add NON_SALES_DEDUCTION to stock_movement_type ENUM
    await queryInterface.sequelize.query(`
      ALTER TYPE stock_movement_type ADD VALUE IF NOT EXISTS 'NON_SALES_DEDUCTION';
    `);
  },

  async down(queryInterface) {
    // Cannot easily remove ENUM values in PostgreSQL
    // Would require recreating the ENUM type, which is complex and risky
    // Leaving as no-op for safety
    console.log('Cannot remove ENUM value - migration down is no-op');
  }
};
