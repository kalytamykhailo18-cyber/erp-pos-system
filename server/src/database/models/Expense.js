const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Expense = sequelize.define('Expense', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    expense_number: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true,
      comment: 'Unique expense identifier (e.g., "EXP-2024-00001")'
    },

    // Classification
    category_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'expense_categories',
        key: 'id'
      },
      comment: 'Link to expense category'
    },
    branch_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'branches',
        key: 'id'
      },
      comment: 'Branch for expense (null = company-wide expense)'
    },

    // Details
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Description of the expense'
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      comment: 'Expense amount'
    },
    payment_method: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [['CASH', 'BANK_TRANSFER', 'CHECK', 'CREDIT_CARD', 'DEBIT_CARD']]
      },
      comment: 'Payment method used'
    },

    // Vendor
    vendor_name: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: 'Name of vendor/supplier'
    },
    vendor_tax_id: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: 'Vendor tax ID (CUIT/CUIL)'
    },
    invoice_number: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Vendor invoice number'
    },

    // Dates
    expense_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: 'Date when expense occurred'
    },
    due_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: 'Payment due date'
    },
    paid_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: 'Date when expense was paid'
    },

    // Status
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'PENDING',
      validate: {
        isIn: [['PENDING', 'APPROVED', 'PAID', 'REJECTED', 'CANCELLED']]
      },
      comment: 'Current expense status'
    },

    // Recurring
    is_recurring: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether this is a recurring expense'
    },
    recurrence_pattern: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        isIn: [['MONTHLY', 'QUARTERLY', 'YEARLY', null]]
      },
      comment: 'Recurrence frequency'
    },
    recurrence_day: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 31
      },
      comment: 'Day of month for recurrence (1-31)'
    },
    parent_expense_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'expenses',
        key: 'id'
      },
      comment: 'Link to parent recurring expense template'
    },

    // Attachments
    receipt_url: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'URL to receipt image/file'
    },
    attachment_urls: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: 'Array of additional attachment URLs'
    },

    // Approval workflow
    submitted_by: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'User who submitted the expense'
    },
    approved_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'User who approved the expense'
    },
    approved_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When expense was approved'
    },
    rejection_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Reason for rejection'
    },

    // Accounting
    account_code: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: 'Account code for accounting software integration'
    },
    is_tax_deductible: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Whether expense is tax deductible'
    },
    tax_year: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Tax year for this expense'
    },

    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Additional notes'
    }
  }, {
    tableName: 'expenses',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['expense_date'] },
      { fields: ['category_id'] },
      { fields: ['branch_id'] },
      { fields: ['status'] },
      { fields: ['is_recurring'] },
      { fields: ['submitted_by'] },
      { fields: ['expense_number'] },
      { fields: ['paid_date'] }
    ]
  });

  Expense.associate = (models) => {
    Expense.belongsTo(models.ExpenseCategory, {
      foreignKey: 'category_id',
      as: 'category'
    });

    Expense.belongsTo(models.Branch, {
      foreignKey: 'branch_id',
      as: 'branch'
    });

    Expense.belongsTo(models.User, {
      foreignKey: 'submitted_by',
      as: 'submitter'
    });

    Expense.belongsTo(models.User, {
      foreignKey: 'approved_by',
      as: 'approver'
    });

    // Self-referencing for recurring expenses
    Expense.belongsTo(models.Expense, {
      foreignKey: 'parent_expense_id',
      as: 'parent'
    });

    Expense.hasMany(models.Expense, {
      foreignKey: 'parent_expense_id',
      as: 'instances'
    });
  };

  return Expense;
};
