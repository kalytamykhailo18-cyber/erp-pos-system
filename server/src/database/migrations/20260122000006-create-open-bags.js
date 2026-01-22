'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      CREATE TYPE open_bag_status AS ENUM ('OPEN', 'EMPTY');
    `);

    await queryInterface.createTable('open_bags', {
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
        comment: 'Branch where this bag is located'
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
        comment: 'Product in this bag'
      },
      original_weight: {
        type: Sequelize.DECIMAL(12, 3),
        allowNull: false,
        comment: 'Original weight when bag was opened (e.g., 20.000 kg)'
      },
      remaining_weight: {
        type: Sequelize.DECIMAL(12, 3),
        allowNull: false,
        comment: 'Current remaining weight (decreases with each loose sale)'
      },
      low_stock_threshold: {
        type: Sequelize.DECIMAL(12, 3),
        allowNull: true,
        comment: 'Alert when remaining weight falls below this threshold (configurable per product)'
      },
      status: {
        type: 'open_bag_status',
        allowNull: false,
        defaultValue: 'OPEN',
        comment: 'OPEN: bag has remaining weight, EMPTY: bag is finished'
      },
      opened_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: 'When the sealed bag was opened for loose sales'
      },
      opened_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'User who opened the bag'
      },
      closed_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When the bag was marked as empty'
      },
      closed_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'User who closed the bag'
      },
      notes: {
        type: Sequelize.TEXT,
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

    await queryInterface.addIndex('open_bags', ['branch_id']);
    await queryInterface.addIndex('open_bags', ['product_id']);
    await queryInterface.addIndex('open_bags', ['status']);
    await queryInterface.addIndex('open_bags', ['branch_id', 'product_id', 'status'], {
      name: 'idx_open_bags_branch_product_status'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('open_bags');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS open_bag_status;');
  }
};
