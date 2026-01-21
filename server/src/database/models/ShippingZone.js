const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ShippingZone = sequelize.define('ShippingZone', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Zone name (e.g., "La Tablada / San Justo", "Villa del Parque")'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Optional description of the zone coverage area'
    },
    base_rate: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      comment: 'Base shipping cost for this zone (e.g., 0 for free, 7500 for $7,500)'
    },
    free_shipping_threshold: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      comment: 'Minimum purchase amount for free shipping (null = no free shipping available)'
    },
    weight_surcharge_per_kg: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      defaultValue: 0,
      comment: 'Additional cost per kilogram of weight'
    },
    express_surcharge: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      defaultValue: 0,
      comment: 'Additional cost for express delivery'
    },
    estimated_delivery_hours: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Estimated delivery time in hours (e.g., 24 for next day, 48 for 2 days)'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Whether this zone is currently available for shipping'
    },
    sort_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Display order in UI (lower numbers first)'
    }
  }, {
    tableName: 'shipping_zones',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['is_active'] },
      { fields: ['sort_order'] }
    ]
  });

  ShippingZone.associate = (models) => {
    ShippingZone.hasMany(models.NeighborhoodMapping, {
      foreignKey: 'shipping_zone_id',
      as: 'neighborhood_mappings'
    });
    ShippingZone.hasMany(models.SaleShipping, {
      foreignKey: 'shipping_zone_id',
      as: 'sale_shippings'
    });
  };

  return ShippingZone;
};
