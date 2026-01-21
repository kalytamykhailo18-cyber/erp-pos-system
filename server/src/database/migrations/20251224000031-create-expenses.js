'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('expenses', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      expense_number: {
        type: Sequelize.STRING(30),
        allowNull: false,
        unique: true,
        comment: 'Unique expense identifier (e.g., "EXP-2024-00001")'
      },
      // Classification
      category_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'expense_categories',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        comment: 'Link to expense category'
      },
      branch_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'branches',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        comment: 'Branch for expense (null = company-wide expense)'
      },
      // Details
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Description of the expense'
      },
      amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        comment: 'Expense amount'
      },
      payment_method: {
        type: Sequelize.STRING(20),
        allowNull: false,
        comment: 'Payment method used'
      },
      // Vendor
      vendor_name: {
        type: Sequelize.STRING(200),
        allowNull: true,
        comment: 'Name of vendor/supplier'
      },
      vendor_tax_id: {
        type: Sequelize.STRING(20),
        allowNull: true,
        comment: 'Vendor tax ID (CUIT/CUIL)'
      },
      invoice_number: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'Vendor invoice number'
      },
      // Dates
      expense_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: 'Date when expense occurred'
      },
      due_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: 'Payment due date'
      },
      paid_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: 'Date when expense was paid'
      },
      // Status
      status: {
        type: Sequelize.STRING(20),
        defaultValue: 'PENDING',
        allowNull: false,
        comment: 'Current expense status'
      },
      // Recurring
      is_recurring: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Whether this is a recurring expense'
      },
      recurrence_pattern: {
        type: Sequelize.STRING(20),
        allowNull: true,
        comment: 'Recurrence frequency'
      },
      recurrence_day: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Day of month for recurrence (1-31)'
      },
      parent_expense_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'expenses',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Link to parent recurring expense template'
      },
      // Attachments
      receipt_url: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'URL to receipt image/file'
      },
      attachment_urls: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: [],
        comment: 'Array of additional attachment URLs'
      },
      // Approval workflow
      submitted_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        comment: 'User who submitted the expense'
      },
      approved_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        comment: 'User who approved the expense'
      },
      approved_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When expense was approved'
      },
      rejection_reason: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Reason for rejection'
      },
      // Accounting
      account_code: {
        type: Sequelize.STRING(20),
        allowNull: true,
        comment: 'Account code for accounting software integration'
      },
      is_tax_deductible: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        comment: 'Whether expense is tax deductible'
      },
      tax_year: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Tax year for this expense'
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Additional notes'
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

    // Create indexes for performance
    await queryInterface.addIndex('expenses', ['expense_date']);
    await queryInterface.addIndex('expenses', ['category_id']);
    await queryInterface.addIndex('expenses', ['branch_id']);
    await queryInterface.addIndex('expenses', ['status']);
    await queryInterface.addIndex('expenses', ['is_recurring']);
    await queryInterface.addIndex('expenses', ['submitted_by']);
    await queryInterface.addIndex('expenses', ['expense_number']);
    await queryInterface.addIndex('expenses', ['paid_date']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('expenses');
  }
};
