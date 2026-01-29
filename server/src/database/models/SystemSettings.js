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
    },
    scale_ip: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'IP address of Kretz Aura scale'
    },
    scale_port: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 3001,
      comment: 'Port for scale connection'
    },
    scale_enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Enable automatic scale synchronization'
    },
    scale_sync_frequency: {
      type: DataTypes.ENUM('manual', 'hourly', 'daily'),
      allowNull: false,
      defaultValue: 'manual',
      comment: 'Frequency of automatic synchronization'
    },
    scale_last_sync: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Last successful synchronization timestamp'
    },
    scale_connection_protocol: {
      type: DataTypes.ENUM('ftp', 'http', 'tcp'),
      allowNull: false,
      defaultValue: 'ftp',
      comment: 'Protocol to use for scale communication'
    },
    scale_ftp_username: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'FTP username for scale connection'
    },
    scale_ftp_password: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'FTP password for scale connection (encrypted)'
    },
    scale_upload_path: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: '/import',
      comment: 'Path on scale for file upload'
    }
  }, {
    tableName: 'system_settings',
    timestamps: true,
    underscored: true
  });

  return SystemSettings;
};
