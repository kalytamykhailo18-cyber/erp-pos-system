const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SyncLog = sequelize.define('SyncLog', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    // Branch context
    branch_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'branches',
        key: 'id'
      }
    },
    register_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'cash_registers',
        key: 'id'
      }
    },
    // Sync details
    sync_type: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [['UPLOAD', 'DOWNLOAD']]
      }
    },
    entity_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Type of entity synced: SALE, STOCK_MOVEMENT, MULTI, FULL, etc.'
    },
    // Statistics
    records_processed: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    records_success: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    records_failed: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    // Full sync data (results object)
    sync_data: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Full sync result including processed, duplicates, conflicts'
    },
    // Who triggered the sync
    synced_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    // Error tracking
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // Duration
    duration_ms: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Time taken to complete sync in milliseconds'
    }
  }, {
    tableName: 'sync_logs',
    timestamps: true,
    underscored: true,
    updatedAt: false, // Only created_at needed for logs
    indexes: [
      { fields: ['branch_id'] },
      { fields: ['sync_type'] },
      { fields: ['created_at'] },
      { fields: ['branch_id', 'sync_type', 'created_at'] }
    ]
  });

  SyncLog.associate = (models) => {
    SyncLog.belongsTo(models.Branch, { foreignKey: 'branch_id', as: 'branch' });
    SyncLog.belongsTo(models.CashRegister, { foreignKey: 'register_id', as: 'register' });
    SyncLog.belongsTo(models.User, { foreignKey: 'synced_by', as: 'user' });
  };

  return SyncLog;
};
