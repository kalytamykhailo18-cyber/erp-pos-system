const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const NeighborhoodMapping = sequelize.define('NeighborhoodMapping', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    neighborhood_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Neighborhood name exactly as customers enter it'
    },
    normalized_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Lowercase normalized version for matching (e.g., "villa del parque")'
    },
    postal_code: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: 'Optional postal code mapping'
    },
    postal_code_pattern: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Postal code pattern for matching (e.g., "1416%" for all codes starting with 1416)'
    },
    shipping_zone_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'shipping_zones',
        key: 'id'
      },
      comment: 'The shipping zone this neighborhood belongs to'
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Optional city name for additional context'
    },
    province: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Optional province/state name'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Whether this mapping is currently active'
    }
  }, {
    tableName: 'neighborhood_mappings',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['shipping_zone_id'] },
      { fields: ['normalized_name'] },
      { fields: ['postal_code'] },
      { fields: ['is_active'] }
    ]
  });

  NeighborhoodMapping.associate = (models) => {
    NeighborhoodMapping.belongsTo(models.ShippingZone, {
      foreignKey: 'shipping_zone_id',
      as: 'shipping_zone'
    });
  };

  return NeighborhoodMapping;
};
