const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PurchaseOrder = sequelize.define('PurchaseOrder', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    order_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    supplier_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'suppliers',
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
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'DRAFT',
      validate: {
        isIn: [['DRAFT', 'SUBMITTED', 'APPROVED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED']]
      }
    },
    subtotal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    tax_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    total_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    expected_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    created_by: {
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
    received_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    submitted_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    approved_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    received_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    cancelled_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'purchase_orders',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['supplier_id'] },
      { fields: ['branch_id'] },
      { fields: ['status'] },
      { fields: ['created_at'] }
    ]
  });

  PurchaseOrder.associate = (models) => {
    PurchaseOrder.belongsTo(models.Supplier, { foreignKey: 'supplier_id', as: 'supplier' });
    PurchaseOrder.belongsTo(models.Branch, { foreignKey: 'branch_id', as: 'branch' });
    PurchaseOrder.belongsTo(models.User, { foreignKey: 'created_by', as: 'created_by_user' });
    PurchaseOrder.belongsTo(models.User, { foreignKey: 'approved_by', as: 'approved_by_user' });
    PurchaseOrder.belongsTo(models.User, { foreignKey: 'received_by', as: 'received_by_user' });
    PurchaseOrder.hasMany(models.PurchaseOrderItem, { foreignKey: 'purchase_order_id', as: 'items' });
  };

  return PurchaseOrder;
};
