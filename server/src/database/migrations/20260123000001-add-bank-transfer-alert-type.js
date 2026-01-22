'use strict';

module.exports = {
  async up(queryInterface) {
    // Add BANK_TRANSFER to alert_type enum
    await queryInterface.sequelize.query(`
      ALTER TYPE alert_type ADD VALUE IF NOT EXISTS 'BANK_TRANSFER';
    `);
  },

  async down(queryInterface) {
    // Cannot remove values from PostgreSQL enum without recreating it
    // This is intentionally left empty as removing enum values is complex
    console.log('Cannot remove BANK_TRANSFER from enum - manual intervention required');
  }
};
