const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AlertConfig = sequelize.define('AlertConfig', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    branch_id: {
      type: DataTypes.UUID,
      allowNull: true, // Null means global configuration
      references: {
        model: 'branches',
        key: 'id'
      }
    },
    alert_type: {
      type: DataTypes.ENUM(
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
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    },
    threshold: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Numeric threshold for triggering alert (context-dependent: amount, percentage, quantity, etc.)'
    },
    threshold_type: {
      type: DataTypes.ENUM('AMOUNT', 'PERCENTAGE', 'QUANTITY', 'DAYS', 'MINUTES'),
      allowNull: true,
      comment: 'Type of threshold measurement'
    },
    notify_owners: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    },
    notify_managers: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    },
    notify_cashiers: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    notification_methods: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: ['WEBSOCKET'],
      comment: 'Array of notification methods: WEBSOCKET, EMAIL, SMS'
    },
    auto_resolve: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether alert should auto-resolve after certain conditions'
    },
    resolution_timeout_minutes: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Auto-resolve after N minutes if not manually resolved'
    },
    config_data: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Additional configuration parameters specific to alert type'
    }
  }, {
    tableName: 'alert_configs',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['branch_id', 'alert_type'],
        name: 'alert_config_branch_type_unique'
      },
      {
        fields: ['alert_type']
      },
      {
        fields: ['is_active']
      }
    ]
  });

  AlertConfig.associate = (models) => {
    AlertConfig.belongsTo(models.Branch, {
      foreignKey: 'branch_id',
      as: 'branch'
    });
  };

  return AlertConfig;
};
