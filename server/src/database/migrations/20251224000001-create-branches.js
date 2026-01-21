'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('branches', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      code: {
        type: Sequelize.STRING(10),
        allowNull: false,
        unique: true
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      address: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      neighborhood: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      city: {
        type: Sequelize.STRING(100),
        defaultValue: 'Buenos Aires'
      },
      postal_code: {
        type: Sequelize.STRING(20),
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
      midday_closing_time: {
        type: Sequelize.TIME,
        defaultValue: '14:00:00'
      },
      evening_closing_time: {
        type: Sequelize.TIME,
        defaultValue: '20:00:00'
      },
      has_shift_change: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      factuhoy_point_of_sale: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      default_invoice_type: {
        type: Sequelize.CHAR(1),
        defaultValue: 'B'
      },
      device_type: {
        type: Sequelize.STRING(20),
        defaultValue: 'PC'
      },
      printer_model: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      printer_type: {
        type: Sequelize.STRING(20),
        defaultValue: 'THERMAL'
      },
      petty_cash_amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 100000.00,
        comment: 'Minimum petty cash fund that must remain at branch (change fund)'
      },
      // POS Configuration
      receipt_footer: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Custom text that appears at the bottom of receipts'
      },
      auto_print_receipt: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        comment: 'Automatically print receipt after sale completion'
      },
      require_customer: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Require customer selection before completing sale'
      },
      enable_discounts: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        comment: 'Allow discounts at this branch'
      },
      max_discount_percent: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 10.00,
        comment: 'Maximum discount percentage allowed at POS'
      },
      // Tax Information
      tax_id: {
        type: Sequelize.STRING(20),
        allowNull: true,
        comment: 'CUIT/CUIL for this branch'
      },
      tax_condition: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'IVA condition: Responsable Inscripto, Monotributista, Exento, Consumidor Final'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      timezone: {
        type: Sequelize.STRING(50),
        defaultValue: 'America/Argentina/Buenos_Aires'
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
  },

  async down(queryInterface) {
    await queryInterface.dropTable('branches');
  }
};
