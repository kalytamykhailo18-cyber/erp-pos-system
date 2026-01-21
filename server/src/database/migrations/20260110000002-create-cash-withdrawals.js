'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create withdrawal_type enum
    await queryInterface.sequelize.query(`
      CREATE TYPE withdrawal_type AS ENUM ('SUPPLIER_PAYMENT', 'EMPLOYEE_ADVANCE', 'OPERATIONAL_EXPENSE', 'OTHER');
    `);

    await queryInterface.createTable('cash_withdrawals', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      session_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'register_sessions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      branch_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'branches',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        comment: 'Amount withdrawn from cash register'
      },
      withdrawal_type: {
        type: 'withdrawal_type',
        allowNull: false,
        comment: 'Type of withdrawal/expense'
      },
      recipient_name: {
        type: Sequelize.STRING(200),
        allowNull: false,
        comment: 'Name of person/entity receiving the cash'
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Detailed reason for withdrawal'
      },
      receipt_number: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'Receipt or invoice number if applicable'
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        comment: 'User who recorded the withdrawal'
      },
      local_id: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'Offline-first local identifier'
      },
      synced_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Timestamp when synced from offline to server'
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

    // Add indexes for performance
    await queryInterface.addIndex('cash_withdrawals', ['session_id']);
    await queryInterface.addIndex('cash_withdrawals', ['branch_id']);
    await queryInterface.addIndex('cash_withdrawals', ['created_by']);
    await queryInterface.addIndex('cash_withdrawals', ['created_at']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('cash_withdrawals');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS withdrawal_type;');
  }
};
