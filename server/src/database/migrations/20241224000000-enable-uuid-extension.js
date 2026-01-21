'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Enable uuid-ossp extension for uuid_generate_v4() function
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
  },

  async down(queryInterface, Sequelize) {
    // Don't drop the extension on rollback as other tables might be using it
    // await queryInterface.sequelize.query('DROP EXTENSION IF EXISTS "uuid-ossp";');
  }
};
