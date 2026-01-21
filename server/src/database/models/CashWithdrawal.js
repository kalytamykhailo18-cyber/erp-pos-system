const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CashWithdrawal = sequelize.define('CashWithdrawal', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    session_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'register_sessions',
        key: 'id'
      },
      comment: 'Session during which withdrawal was made'
    },
    branch_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'branches',
        key: 'id'
      },
      comment: 'Branch where withdrawal occurred'
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      comment: 'Amount withdrawn from cash register'
    },
    withdrawal_type: {
      type: DataTypes.ENUM('SUPPLIER_PAYMENT', 'EMPLOYEE_ADVANCE', 'OPERATIONAL_EXPENSE', 'OTHER'),
      allowNull: false,
      comment: 'Type of withdrawal/expense'
    },
    recipient_name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: 'Name of person/entity receiving the cash'
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Detailed reason for withdrawal'
    },
    receipt_number: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Receipt or invoice number if applicable'
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'User who recorded the withdrawal'
    },
    local_id: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Offline-first local identifier'
    },
    synced_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Timestamp when synced from offline to server'
    }
  }, {
    tableName: 'cash_withdrawals',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['session_id'] },
      { fields: ['branch_id'] },
      { fields: ['created_by'] },
      { fields: ['created_at'] }
    ]
  });

  CashWithdrawal.associate = (models) => {
    CashWithdrawal.belongsTo(models.RegisterSession, {
      foreignKey: 'session_id',
      as: 'session'
    });

    CashWithdrawal.belongsTo(models.Branch, {
      foreignKey: 'branch_id',
      as: 'branch'
    });

    CashWithdrawal.belongsTo(models.User, {
      foreignKey: 'created_by',
      as: 'creator'
    });
  };

  return CashWithdrawal;
};
