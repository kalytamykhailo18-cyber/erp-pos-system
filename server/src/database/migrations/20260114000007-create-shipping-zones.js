'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('shipping_zones', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Zone name (e.g., "La Tablada / San Justo", "Villa del Parque")'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Optional description of the zone coverage area'
      },
      base_rate: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        comment: 'Base shipping cost for this zone (e.g., 0 for free, 7500 for $7,500)'
      },
      free_shipping_threshold: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
        comment: 'Minimum purchase amount for free shipping (null = no free shipping available)'
      },
      weight_surcharge_per_kg: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
        defaultValue: 0,
        comment: 'Additional cost per kilogram of weight'
      },
      express_surcharge: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
        defaultValue: 0,
        comment: 'Additional cost for express delivery'
      },
      estimated_delivery_hours: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Estimated delivery time in hours (e.g., 24 for next day, 48 for 2 days)'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        comment: 'Whether this zone is currently available for shipping'
      },
      sort_order: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'Display order in UI (lower numbers first)'
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

    // Create indexes
    await queryInterface.addIndex('shipping_zones', ['is_active'], {
      name: 'idx_shipping_zones_is_active'
    });
    await queryInterface.addIndex('shipping_zones', ['sort_order'], {
      name: 'idx_shipping_zones_sort_order'
    });

    // Insert initial zones based on requirements
    await queryInterface.bulkInsert('shipping_zones', [
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        name: 'La Tablada / San Justo',
        description: 'Free shipping zone - local area',
        base_rate: 0.00,
        free_shipping_threshold: null,
        weight_surcharge_per_kg: 0.00,
        express_surcharge: 0.00,
        estimated_delivery_hours: 24,
        is_active: true,
        sort_order: 1,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        name: 'Villa del Parque',
        description: 'Standard shipping zone',
        base_rate: 7500.00,
        free_shipping_threshold: 50000.00,
        weight_surcharge_per_kg: 100.00,
        express_surcharge: 2000.00,
        estimated_delivery_hours: 48,
        is_active: true,
        sort_order: 2,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        name: 'Other Neighborhoods',
        description: 'Default zone for neighborhoods not specifically defined',
        base_rate: 10000.00,
        free_shipping_threshold: 75000.00,
        weight_surcharge_per_kg: 150.00,
        express_surcharge: 3000.00,
        estimated_delivery_hours: 72,
        is_active: true,
        sort_order: 999,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('shipping_zones');
  }
};
