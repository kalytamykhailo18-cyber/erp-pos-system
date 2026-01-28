'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('sync_logs', {
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
        onDelete: 'CASCADE'
      },
      register_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'cash_registers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      sync_type: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      entity_type: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      records_processed: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      records_success: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      records_failed: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      sync_data: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      synced_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      error_message: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      duration_ms: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('sync_logs', ['branch_id']);
    await queryInterface.addIndex('sync_logs', ['sync_type']);
    await queryInterface.addIndex('sync_logs', ['created_at']);
    await queryInterface.addIndex('sync_logs', ['branch_id', 'sync_type', 'created_at']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('sync_logs');
  }
};
