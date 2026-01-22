const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const OpenBag = sequelize.define('OpenBag', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    branch_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'branches',
        key: 'id'
      }
    },
    product_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id'
      }
    },
    original_weight: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false
    },
    remaining_weight: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false
    },
    low_stock_threshold: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('OPEN', 'EMPTY'),
      allowNull: false,
      defaultValue: 'OPEN'
    },
    opened_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    opened_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    closed_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    closed_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'open_bags',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['branch_id'] },
      { fields: ['product_id'] },
      { fields: ['status'] },
      {
        fields: ['branch_id', 'product_id', 'status'],
        name: 'idx_open_bags_branch_product_status'
      }
    ]
  });

  OpenBag.associate = (models) => {
    OpenBag.belongsTo(models.Branch, { foreignKey: 'branch_id', as: 'branch' });
    OpenBag.belongsTo(models.Product, { foreignKey: 'product_id', as: 'product' });
    OpenBag.belongsTo(models.User, { foreignKey: 'opened_by', as: 'opener' });
    OpenBag.belongsTo(models.User, { foreignKey: 'closed_by', as: 'closer' });
  };

  return OpenBag;
};
