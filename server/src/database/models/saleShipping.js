const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SaleShipping = sequelize.define('SaleShipping', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    sale_id: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: 'sales',
        key: 'id'
      },
      comment: 'The sale this shipping information belongs to'
    },
    customer_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'customers',
        key: 'id'
      },
      comment: 'Customer receiving the delivery'
    },
    shipping_zone_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'shipping_zones',
        key: 'id'
      },
      comment: 'The shipping zone used for calculation'
    },
    // Delivery address (captured at time of sale)
    delivery_address: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Full delivery address'
    },
    delivery_neighborhood: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Neighborhood for shipping calculation'
    },
    delivery_city: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'City name'
    },
    delivery_postal_code: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: 'Postal code'
    },
    delivery_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Special delivery instructions from customer'
    },
    // Shipping cost breakdown
    base_rate: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      comment: 'Base shipping rate from zone at time of sale'
    },
    weight_kg: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: true,
      defaultValue: 0,
      comment: 'Total weight of the order in kilograms'
    },
    weight_surcharge: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      comment: 'Additional cost based on weight'
    },
    is_express: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether customer requested express delivery'
    },
    express_surcharge: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      comment: 'Additional cost for express delivery'
    },
    free_shipping_applied: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether free shipping threshold was met'
    },
    free_shipping_threshold: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      comment: 'Free shipping threshold at time of sale (for audit)'
    },
    total_shipping_cost: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      comment: 'Final calculated shipping cost charged to customer'
    },
    // Delivery tracking (future feature)
    delivery_status: {
      type: DataTypes.STRING(20),
      defaultValue: 'PENDING',
      comment: 'Current delivery status',
      validate: {
        isIn: [['PENDING', 'PROCESSING', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'CANCELLED']]
      }
    },
    estimated_delivery_date: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Estimated delivery date/time'
    },
    actual_delivery_date: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Actual delivery date/time (when marked as delivered)'
    },
    delivered_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'Employee who delivered the order (future feature)'
    },
    delivery_confirmation_signature: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Base64 encoded signature image (future feature)'
    },
    delivery_confirmation_photo: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'URL to delivery confirmation photo (future feature)'
    },
    tracking_number: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'External tracking number if using third-party delivery (future)'
    }
  }, {
    tableName: 'sale_shipping',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['sale_id'], unique: true },
      { fields: ['customer_id'] },
      { fields: ['shipping_zone_id'] },
      { fields: ['delivery_status'] },
      { fields: ['delivery_neighborhood'] },
      { fields: ['estimated_delivery_date'] }
    ]
  });

  SaleShipping.associate = (models) => {
    SaleShipping.belongsTo(models.Sale, {
      foreignKey: 'sale_id',
      as: 'sale'
    });
    SaleShipping.belongsTo(models.Customer, {
      foreignKey: 'customer_id',
      as: 'customer'
    });
    SaleShipping.belongsTo(models.ShippingZone, {
      foreignKey: 'shipping_zone_id',
      as: 'shipping_zone'
    });
    SaleShipping.belongsTo(models.User, {
      foreignKey: 'delivered_by',
      as: 'delivery_person'
    });
  };

  return SaleShipping;
};
