const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ProductType = sequelize.define('ProductType', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    sort_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'product_types',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['name'] },
      { fields: ['is_active'] },
      { fields: ['sort_order'] }
    ]
  });

  ProductType.associate = (models) => {
    ProductType.hasMany(models.Product, { foreignKey: 'product_type_id', as: 'products' });
  };

  return ProductType;
};
