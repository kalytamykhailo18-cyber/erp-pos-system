const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const DenominationConfig = sequelize.define('DenominationConfig', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    value: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      unique: true,
      comment: 'Denomination value (e.g., 20000, 10000, 2000)'
    },
    label: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Display label (e.g., "$20,000")'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Whether this denomination is currently in use'
    },
    display_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Sort order for UI display (lower = first)'
    }
  }, {
    tableName: 'denomination_configurations',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['is_active'] },
      { fields: ['display_order'] }
    ]
  });

  // No associations needed - this is a simple configuration table

  return DenominationConfig;
};
