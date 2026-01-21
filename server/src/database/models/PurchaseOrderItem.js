const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PurchaseOrderItem = sequelize.define('PurchaseOrderItem', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    purchase_order_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'purchase_orders',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    product_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id'
      }
    },
    quantity_ordered: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
      defaultValue: 0
    },
    quantity_received: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
      defaultValue: 0
    },
    unit_price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    total_price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'purchase_order_items',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['purchase_order_id'] },
      { fields: ['product_id'] }
    ]
  });

  PurchaseOrderItem.associate = (models) => {
    PurchaseOrderItem.belongsTo(models.PurchaseOrder, { foreignKey: 'purchase_order_id', as: 'purchase_order' });
    PurchaseOrderItem.belongsTo(models.Product, { foreignKey: 'product_id', as: 'product' });
  };

  return PurchaseOrderItem;
};
