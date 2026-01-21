const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserBranch = sequelize.define('UserBranch', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    branch_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'branches',
        key: 'id'
      }
    },
    is_primary: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'user_branches',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,  // No updated_at column in this table
    underscored: true
  });

  return UserBranch;
};
