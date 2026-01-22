'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('loyalty_config', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      points_per_peso: {
        type: Sequelize.DECIMAL(6, 2),
        allowNull: false,
        defaultValue: 1,
        comment: 'How many points earned per peso spent'
      },
      peso_per_point_redemption: {
        type: Sequelize.DECIMAL(6, 2),
        allowNull: false,
        defaultValue: 0.1,
        comment: 'Value in pesos of each point when redeemed'
      },
      minimum_points_to_redeem: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 100,
        comment: 'Minimum points required to redeem'
      },
      points_expiry_days: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 365,
        comment: 'Days until earned points expire (0 = never)'
      },
      credit_expiry_days: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 180,
        comment: 'Days until given credit expires (0 = never)'
      },
      min_change_for_credit: {
        type: Sequelize.DECIMAL(6, 2),
        allowNull: false,
        defaultValue: 10,
        comment: 'Minimum change amount to offer as credit'
      },
      tier_thresholds: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {
          SILVER: 1000,
          GOLD: 3000,
          PLATINUM: 20000
        },
        comment: 'Lifetime points required for each tier'
      },
      tier_multipliers: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {
          BRONZE: 1,
          SILVER: 1.25,
          GOLD: 1.5,
          PLATINUM: 2
        },
        comment: 'Points multiplier for each tier when earning'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Only one config should be active at a time'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('loyalty_config', ['is_active']);

    // Insert default configuration
    await queryInterface.bulkInsert('loyalty_config', [{
      id: Sequelize.literal('uuid_generate_v4()'),
      points_per_peso: 1,
      peso_per_point_redemption: 0.1,
      minimum_points_to_redeem: 100,
      points_expiry_days: 365,
      credit_expiry_days: 180,
      min_change_for_credit: 10,
      tier_thresholds: JSON.stringify({ SILVER: 1000, GOLD: 3000, PLATINUM: 20000 }),
      tier_multipliers: JSON.stringify({ BRONZE: 1, SILVER: 1.25, GOLD: 1.5, PLATINUM: 2 }),
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('loyalty_config');
  }
};
