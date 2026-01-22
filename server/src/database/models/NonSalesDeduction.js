const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const NonSalesDeduction = sequelize.define('NonSalesDeduction', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    branch_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'branches',
        key: 'id'
      }
    },
    product_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id'
      }
    },
    quantity: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false
    },
    deduction_type: {
      type: DataTypes.ENUM('FREE_SAMPLE', 'DONATION'),
      allowNull: false
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    recipient: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    requested_by: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    approved_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    approval_status: {
      type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'),
      allowNull: false,
      defaultValue: 'PENDING'
    },
    approved_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    rejection_reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    stock_movement_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'stock_movements',
        key: 'id'
      }
    }
  }, {
    tableName: 'non_sales_deductions',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['branch_id'] },
      { fields: ['product_id'] },
      { fields: ['approval_status'] },
      { fields: ['requested_by'] },
      { fields: ['approved_by'] },
      {
        fields: ['branch_id', 'approval_status'],
        name: 'idx_non_sales_branch_status'
      }
    ]
  });

  NonSalesDeduction.associate = (models) => {
    NonSalesDeduction.belongsTo(models.Branch, { foreignKey: 'branch_id', as: 'branch' });
    NonSalesDeduction.belongsTo(models.Product, { foreignKey: 'product_id', as: 'product' });
    NonSalesDeduction.belongsTo(models.User, { foreignKey: 'requested_by', as: 'requester' });
    NonSalesDeduction.belongsTo(models.User, { foreignKey: 'approved_by', as: 'approver' });
    NonSalesDeduction.belongsTo(models.StockMovement, { foreignKey: 'stock_movement_id', as: 'stock_movement' });
  };

  return NonSalesDeduction;
};
