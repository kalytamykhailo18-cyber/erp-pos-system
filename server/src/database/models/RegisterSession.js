const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const RegisterSession = sequelize.define('RegisterSession', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    register_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'cash_registers',
        key: 'id'
      }
    },
    branch_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'branches',
        key: 'id'
      }
    },
    session_number: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    shift_type: {
      type: DataTypes.ENUM('MORNING', 'AFTERNOON', 'FULL_DAY'),
      allowNull: false
    },
    business_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    // Opening
    opened_by: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    opened_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    opening_cash: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    opening_notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // Opening bill denomination breakdown (Argentina 2024 bills)
    opening_bills_20000: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Quantity of $20000 bills at opening'
    },
    opening_bills_10000: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Quantity of $10000 bills at opening'
    },
    opening_bills_2000: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Quantity of $2000 bills at opening'
    },
    opening_bills_1000: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Quantity of $1000 bills at opening'
    },
    opening_bills_500: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Quantity of $500 bills at opening'
    },
    opening_bills_200: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Quantity of $200 bills at opening'
    },
    opening_bills_100: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Quantity of $100 bills at opening'
    },
    opening_bills_50: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Quantity of $50 bills at opening'
    },
    opening_coins: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      comment: 'Total amount in coins at opening'
    },
    // Closing (Blind Closing)
    closed_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    closed_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // Cashier's declared amounts (blind - they don't see expected)
    declared_cash: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    declared_card: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    declared_qr: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    declared_transfer: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    // Closing bill denomination breakdown (Argentina 2024 bills)
    closing_bills_20000: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Quantity of $20000 bills at closing'
    },
    closing_bills_10000: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Quantity of $10000 bills at closing'
    },
    closing_bills_2000: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Quantity of $2000 bills at closing'
    },
    closing_bills_1000: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Quantity of $1000 bills at closing'
    },
    closing_bills_500: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Quantity of $500 bills at closing'
    },
    closing_bills_200: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Quantity of $200 bills at closing'
    },
    closing_bills_100: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Quantity of $100 bills at closing'
    },
    closing_bills_50: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Quantity of $50 bills at closing'
    },
    closing_coins: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      comment: 'Total amount in coins at closing'
    },
    // System calculated amounts
    expected_cash: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    expected_card: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    expected_qr: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    expected_transfer: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    // Discrepancies
    discrepancy_cash: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    discrepancy_card: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    discrepancy_qr: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    discrepancy_transfer: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    total_discrepancy: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    // Status
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'OPEN',
      validate: {
        isIn: [['OPEN', 'CLOSED', 'REOPENED']]
      }
    },
    closing_notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // Reopen tracking
    reopened_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    reopened_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    reopen_reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // Sync tracking
    local_id: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    synced_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'register_sessions',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['register_id'] },
      { fields: ['branch_id'] },
      { fields: ['business_date'] },
      { fields: ['status'] }
    ]
  });

  RegisterSession.associate = (models) => {
    RegisterSession.belongsTo(models.CashRegister, { foreignKey: 'register_id', as: 'register' });
    RegisterSession.belongsTo(models.Branch, { foreignKey: 'branch_id', as: 'branch' });
    RegisterSession.belongsTo(models.User, { foreignKey: 'opened_by', as: 'opener' });
    RegisterSession.belongsTo(models.User, { foreignKey: 'closed_by', as: 'closer' });
    RegisterSession.belongsTo(models.User, { foreignKey: 'reopened_by', as: 'reopener' });
    RegisterSession.hasMany(models.Sale, { foreignKey: 'session_id', as: 'sales' });
    RegisterSession.hasMany(models.CashWithdrawal, { foreignKey: 'session_id', as: 'withdrawals' });
  };

  return RegisterSession;
};
