const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SystemSettings = sequelize.define('SystemSettings', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    company_name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      defaultValue: 'Mi Empresa'
    },
    tax_id: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: 'CUIT/CUIL of the company'
    },
    address: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'ARS',
      comment: 'Currency code (ARS, USD, etc.)'
    },
    timezone: {
      type: DataTypes.STRING(50),
      defaultValue: 'America/Argentina/Buenos_Aires'
    },
    date_format: {
      type: DataTypes.STRING(20),
      defaultValue: 'DD/MM/YYYY'
    },
    enable_invoicing: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Enable electronic invoicing (FactuHoy)'
    },
    factuhoy_api_key: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'FactuHoy API key for electronic invoicing'
    }
  }, {
    tableName: 'system_settings',
    timestamps: true,
    underscored: true
  });

  return SystemSettings;
};
