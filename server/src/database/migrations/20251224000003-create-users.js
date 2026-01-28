'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      employee_code: {
        type: Sequelize.STRING(20),
        unique: true,
        allowNull: true
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      password_hash: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      first_name: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      last_name: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      phone: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      role_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'roles',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      primary_branch_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'branches',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      pin_code: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Hashed PIN code for quick login (bcrypt)'
      },
      last_login_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      failed_login_attempts: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      locked_until: {
        type: Sequelize.DATE,
        allowNull: true
      },
      language: {
        type: Sequelize.STRING(10),
        defaultValue: 'es'
      },
      avatar_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
        comment: 'Cloudinary URL for user avatar image'
      },
      // Per-user permission overrides (null = use role default, true/false = override)
      can_void_sale: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: null,
        comment: 'Override role permission - null uses role default'
      },
      can_give_discount: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: null
      },
      can_view_all_branches: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: null
      },
      can_close_register: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: null
      },
      can_reopen_closing: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: null
      },
      can_adjust_stock: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: null
      },
      can_import_prices: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: null
      },
      can_manage_users: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: null
      },
      can_view_reports: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: null
      },
      can_view_financials: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: null
      },
      can_manage_suppliers: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: null
      },
      can_manage_products: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: null
      },
      can_issue_invoice_a: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: null
      },
      can_manage_expenses: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: null
      },
      can_approve_expenses: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: null
      },
      max_discount_percent: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        defaultValue: null,
        comment: 'Override role max discount - null uses role default'
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

    await queryInterface.addIndex('users', ['email']);
    await queryInterface.addIndex('users', ['role_id']);
    await queryInterface.addIndex('users', ['primary_branch_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('users');
  }
};
