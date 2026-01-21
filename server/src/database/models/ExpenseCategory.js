const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ExpenseCategory = sequelize.define('ExpenseCategory', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Category name (e.g., "Rent", "Utilities", "Taxes", "Supplies")'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Optional description of the category'
    },
    color_hex: {
      type: DataTypes.STRING(7),
      allowNull: true,
      defaultValue: '#3B82F6',
      comment: 'Color for UI visualization (e.g., "#FF5733")'
    },
    is_system: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'System categories cannot be deleted by users'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Whether this category is currently available for use'
    }
  }, {
    tableName: 'expense_categories',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['is_active'] },
      { fields: ['name'] }
    ]
  });

  ExpenseCategory.associate = (models) => {
    ExpenseCategory.hasMany(models.Expense, {
      foreignKey: 'category_id',
      as: 'expenses'
    });
  };

  return ExpenseCategory;
};
