'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      CREATE TYPE deduction_type AS ENUM ('FREE_SAMPLE', 'DONATION');
    `);

    await queryInterface.sequelize.query(`
      CREATE TYPE deduction_approval_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
    `);

    await queryInterface.createTable('non_sales_deductions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      branch_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'branches',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        comment: 'Branch where deduction occurred'
      },
      product_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'products',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        comment: 'Product being deducted'
      },
      quantity: {
        type: Sequelize.DECIMAL(12, 3),
        allowNull: false,
        comment: 'Quantity deducted (supports decimals for weighable items)'
      },
      deduction_type: {
        type: 'deduction_type',
        allowNull: false,
        comment: 'FREE_SAMPLE: promotional samples, DONATION: donations to shelters/strays'
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Reason for deduction (optional description)'
      },
      recipient: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Who received the item (e.g., "Local Animal Shelter", "Customer X")'
      },
      requested_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        comment: 'Cashier who requested the deduction'
      },
      approved_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Manager who approved the deduction'
      },
      approval_status: {
        type: 'deduction_approval_status',
        allowNull: false,
        defaultValue: 'PENDING',
        comment: 'PENDING: awaiting approval, APPROVED: manager approved, REJECTED: manager rejected'
      },
      approved_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When manager approved/rejected'
      },
      rejection_reason: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Reason for rejection (if applicable)'
      },
      stock_movement_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'stock_movements',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Reference to the stock movement record (created when approved)'
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

    await queryInterface.addIndex('non_sales_deductions', ['branch_id']);
    await queryInterface.addIndex('non_sales_deductions', ['product_id']);
    await queryInterface.addIndex('non_sales_deductions', ['approval_status']);
    await queryInterface.addIndex('non_sales_deductions', ['requested_by']);
    await queryInterface.addIndex('non_sales_deductions', ['approved_by']);
    await queryInterface.addIndex('non_sales_deductions', ['branch_id', 'approval_status'], {
      name: 'idx_non_sales_branch_status'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('non_sales_deductions');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS deduction_type;');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS deduction_approval_status;');
  }
};
