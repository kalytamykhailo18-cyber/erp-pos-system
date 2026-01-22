const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Species = sequelize.define('Species', {
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
    tableName: 'species',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['name'] },
      { fields: ['is_active'] },
      { fields: ['sort_order'] }
    ]
  });

  Species.associate = (models) => {
    Species.hasMany(models.Variety, { foreignKey: 'species_id', as: 'varieties' });
    Species.hasMany(models.Product, { foreignKey: 'species_id', as: 'products' });
  };

  return Species;
};
