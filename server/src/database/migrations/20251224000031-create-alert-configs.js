'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('alert_configs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      branch_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'branches',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'Null means global configuration'
      },
      alert_type: {
        type: Sequelize.ENUM(
          'VOIDED_SALE',
          'CASH_DISCREPANCY',
          'LOW_PETTY_CASH',
          'LOW_STOCK',
          'LATE_CLOSING',
          'AFTER_HOURS_CLOSING',
          'REOPEN_REGISTER',
          'FAILED_INVOICE',
          'LARGE_DISCOUNT',
          'HIGH_VALUE_SALE',
          'SYNC_ERROR',
          'LOGIN_FAILED',
          'PRICE_CHANGE'
        ),
        allowNull: false
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      threshold: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Numeric threshold for triggering alert (context-dependent)'
      },
      threshold_type: {
        type: Sequelize.ENUM('AMOUNT', 'PERCENTAGE', 'QUANTITY', 'DAYS', 'MINUTES'),
        allowNull: true,
        comment: 'Type of threshold measurement'
      },
      notify_owners: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      notify_managers: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      notify_cashiers: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      notification_methods: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: ['WEBSOCKET'],
        comment: 'Array of notification methods: WEBSOCKET, EMAIL, SMS'
      },
      auto_resolve: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Whether alert should auto-resolve after certain conditions'
      },
      resolution_timeout_minutes: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Auto-resolve after N minutes if not manually resolved'
      },
      config_data: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Additional configuration parameters specific to alert type'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add unique constraint
    await queryInterface.addConstraint('alert_configs', {
      fields: ['branch_id', 'alert_type'],
      type: 'unique',
      name: 'alert_config_branch_type_unique'
    });

    // Add indexes
    await queryInterface.addIndex('alert_configs', ['alert_type']);
    await queryInterface.addIndex('alert_configs', ['is_active']);

    // Insert default global configurations
    await queryInterface.bulkInsert('alert_configs', [
      {
        id: require('uuid').v4(),
        branch_id: null,
        alert_type: 'LOW_STOCK',
        is_active: true,
        threshold: 5,
        threshold_type: 'QUANTITY',
        notify_owners: true,
        notify_managers: true,
        notify_cashiers: false,
        notification_methods: ['WEBSOCKET'],
        auto_resolve: false,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        branch_id: null,
        alert_type: 'CASH_DISCREPANCY',
        is_active: true,
        threshold: 100,
        threshold_type: 'AMOUNT',
        notify_owners: true,
        notify_managers: true,
        notify_cashiers: false,
        notification_methods: ['WEBSOCKET'],
        auto_resolve: false,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        branch_id: null,
        alert_type: 'LARGE_DISCOUNT',
        is_active: true,
        threshold: 15,
        threshold_type: 'PERCENTAGE',
        notify_owners: true,
        notify_managers: true,
        notify_cashiers: false,
        notification_methods: ['WEBSOCKET'],
        auto_resolve: false,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        branch_id: null,
        alert_type: 'HIGH_VALUE_SALE',
        is_active: true,
        threshold: 50000,
        threshold_type: 'AMOUNT',
        notify_owners: true,
        notify_managers: true,
        notify_cashiers: false,
        notification_methods: ['WEBSOCKET'],
        auto_resolve: false,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        branch_id: null,
        alert_type: 'LATE_CLOSING',
        is_active: true,
        threshold: 30,
        threshold_type: 'MINUTES',
        notify_owners: true,
        notify_managers: true,
        notify_cashiers: false,
        notification_methods: ['WEBSOCKET'],
        auto_resolve: false,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        branch_id: null,
        alert_type: 'VOIDED_SALE',
        is_active: true,
        threshold: null,
        threshold_type: null,
        notify_owners: true,
        notify_managers: true,
        notify_cashiers: false,
        notification_methods: ['WEBSOCKET'],
        auto_resolve: false,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        branch_id: null,
        alert_type: 'REOPEN_REGISTER',
        is_active: true,
        threshold: null,
        threshold_type: null,
        notify_owners: true,
        notify_managers: true,
        notify_cashiers: false,
        notification_methods: ['WEBSOCKET'],
        auto_resolve: false,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        branch_id: null,
        alert_type: 'FAILED_INVOICE',
        is_active: true,
        threshold: null,
        threshold_type: null,
        notify_owners: true,
        notify_managers: true,
        notify_cashiers: false,
        notification_methods: ['WEBSOCKET'],
        auto_resolve: false,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        branch_id: null,
        alert_type: 'AFTER_HOURS_CLOSING',
        is_active: true,
        threshold: null,
        threshold_type: null,
        notify_owners: true,
        notify_managers: true,
        notify_cashiers: false,
        notification_methods: ['WEBSOCKET'],
        auto_resolve: false,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        branch_id: null,
        alert_type: 'LOW_PETTY_CASH',
        is_active: true,
        threshold: null,
        threshold_type: null,
        notify_owners: true,
        notify_managers: true,
        notify_cashiers: false,
        notification_methods: ['WEBSOCKET'],
        auto_resolve: false,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: require('uuid').v4(),
        branch_id: null,
        alert_type: 'SYNC_ERROR',
        is_active: true,
        threshold: null,
        threshold_type: null,
        notify_owners: true,
        notify_managers: false,
        notify_cashiers: false,
        notification_methods: ['WEBSOCKET'],
        auto_resolve: false,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('alert_configs');
  }
};
