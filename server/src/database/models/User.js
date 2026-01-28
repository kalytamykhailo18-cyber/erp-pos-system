const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    employee_code: {
      type: DataTypes.STRING(20),
      unique: true,
      allowNull: true
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    first_name: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    last_name: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    role_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'roles',
        key: 'id'
      }
    },
    primary_branch_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'branches',
        key: 'id'
      }
    },
    // Authentication
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    pin_code: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Hashed PIN code for quick login (bcrypt)'
    },
    last_login_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    failed_login_attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    locked_until: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // Preferences
    language: {
      type: DataTypes.STRING(10),
      defaultValue: 'es'
    },
    // Avatar
    avatar_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'Cloudinary URL for user avatar image'
    },
    // Per-user permission overrides (null = use role default, true/false = override)
    can_void_sale: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: null,
      comment: 'Override role permission - null uses role default'
    },
    can_give_discount: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: null
    },
    can_view_all_branches: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: null
    },
    can_close_register: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: null
    },
    can_reopen_closing: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: null
    },
    can_adjust_stock: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: null
    },
    can_import_prices: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: null
    },
    can_manage_users: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: null
    },
    can_view_reports: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: null
    },
    can_view_financials: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: null
    },
    can_manage_suppliers: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: null
    },
    can_manage_products: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: null
    },
    can_issue_invoice_a: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: null
    },
    can_manage_expenses: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: null
    },
    can_approve_expenses: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: null
    },
    max_discount_percent: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      defaultValue: null,
      comment: 'Override role max discount - null uses role default'
    }
  }, {
    tableName: 'users',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password_hash) {
          user.password_hash = await bcrypt.hash(user.password_hash, 12);
        }
        if (user.pin_code) {
          user.pin_code = await bcrypt.hash(user.pin_code, 12);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password_hash')) {
          user.password_hash = await bcrypt.hash(user.password_hash, 12);
        }
        if (user.changed('pin_code')) {
          user.pin_code = await bcrypt.hash(user.pin_code, 12);
        }
      }
    }
  });

  // Instance methods
  User.prototype.validatePassword = async function(password) {
    return bcrypt.compare(password, this.password_hash);
  };

  User.prototype.validatePin = async function(pin) {
    if (!this.pin_code) {
      return false;
    }
    return bcrypt.compare(pin, this.pin_code);
  };

  User.prototype.toJSON = function() {
    const values = { ...this.get() };
    delete values.password_hash;
    delete values.pin_code;
    return values;
  };

  User.associate = (models) => {
    User.belongsTo(models.Role, { foreignKey: 'role_id', as: 'role' });
    User.belongsTo(models.Branch, { foreignKey: 'primary_branch_id', as: 'primary_branch' });
    User.hasMany(models.UserSession, { foreignKey: 'user_id', as: 'sessions' });
    User.hasMany(models.Sale, { foreignKey: 'created_by', as: 'sales' });
    User.hasMany(models.RegisterSession, { foreignKey: 'opened_by', as: 'opened_sessions' });
    User.hasMany(models.RegisterSession, { foreignKey: 'closed_by', as: 'closed_sessions' });
    User.hasMany(models.StockMovement, { foreignKey: 'performed_by', as: 'stock_movements' });
    User.belongsToMany(models.Branch, {
      through: models.UserBranch,
      foreignKey: 'user_id',
      as: 'branches'
    });
  };

  return User;
};
