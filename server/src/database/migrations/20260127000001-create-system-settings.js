'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('system_settings', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      company_name: {
        type: Sequelize.STRING(200),
        allowNull: false,
        defaultValue: 'Mi Empresa'
      },
      tax_id: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      address: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      phone: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      currency: {
        type: Sequelize.STRING(3),
        defaultValue: 'ARS'
      },
      timezone: {
        type: Sequelize.STRING(50),
        defaultValue: 'America/Argentina/Buenos_Aires'
      },
      date_format: {
        type: Sequelize.STRING(20),
        defaultValue: 'DD/MM/YYYY'
      },
      enable_invoicing: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      factuhoy_api_key: {
        type: Sequelize.STRING(255),
        allowNull: true
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

    // Insert default settings row
    await queryInterface.bulkInsert('system_settings', [{
      id: '00000000-0000-0000-0000-000000000001',
      company_name: 'Mi Empresa',
      currency: 'ARS',
      timezone: 'America/Argentina/Buenos_Aires',
      date_format: 'DD/MM/YYYY',
      enable_invoicing: true,
      created_at: new Date(),
      updated_at: new Date()
    }]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('system_settings');
  }
};
