const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Variety = sequelize.define('Variety', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    species_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'species',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
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
    tableName: 'varieties',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['species_id'] },
      { fields: ['is_active'] },
      { fields: ['sort_order'] },
      {
        unique: true,
        fields: ['species_id', 'name'],
        name: 'varieties_species_name_unique'
      }
    ]
  });

  Variety.associate = (models) => {
    Variety.belongsTo(models.Species, { foreignKey: 'species_id', as: 'species' });
    Variety.hasMany(models.Product, { foreignKey: 'variety_id', as: 'products' });
  };

  return Variety;
};
