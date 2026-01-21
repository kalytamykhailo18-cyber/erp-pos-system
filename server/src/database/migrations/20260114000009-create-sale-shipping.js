'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('sale_shipping', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      sale_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: 'sales',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'The sale this shipping information belongs to'
      },
      customer_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'customers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Customer receiving the delivery'
      },
      shipping_zone_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'shipping_zones',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        comment: 'The shipping zone used for calculation'
      },
      // Delivery address (captured at time of sale)
      delivery_address: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Full delivery address'
      },
      delivery_neighborhood: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Neighborhood for shipping calculation'
      },
      delivery_city: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'City name'
      },
      delivery_postal_code: {
        type: Sequelize.STRING(20),
        allowNull: true,
        comment: 'Postal code'
      },
      delivery_notes: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Special delivery instructions from customer'
      },
      // Shipping cost breakdown
      base_rate: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        comment: 'Base shipping rate from zone at time of sale'
      },
      weight_kg: {
        type: Sequelize.DECIMAL(10, 3),
        allowNull: true,
        defaultValue: 0,
        comment: 'Total weight of the order in kilograms'
      },
      weight_surcharge: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        comment: 'Additional cost based on weight'
      },
      is_express: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Whether customer requested express delivery'
      },
      express_surcharge: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        comment: 'Additional cost for express delivery'
      },
      free_shipping_applied: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Whether free shipping threshold was met'
      },
      free_shipping_threshold: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
        comment: 'Free shipping threshold at time of sale (for audit)'
      },
      total_shipping_cost: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        comment: 'Final calculated shipping cost charged to customer'
      },
      // Delivery tracking (future feature)
      delivery_status: {
        type: Sequelize.STRING(20),
        defaultValue: 'PENDING',
        comment: 'Current delivery status',
        validate: {
          isIn: [['PENDING', 'PROCESSING', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'CANCELLED']]
        }
      },
      estimated_delivery_date: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Estimated delivery date/time'
      },
      actual_delivery_date: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Actual delivery date/time (when marked as delivered)'
      },
      delivered_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Employee who delivered the order (future feature)'
      },
      delivery_confirmation_signature: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Base64 encoded signature image (future feature)'
      },
      delivery_confirmation_photo: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'URL to delivery confirmation photo (future feature)'
      },
      tracking_number: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'External tracking number if using third-party delivery (future)'
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
    await queryInterface.addIndex('sale_shipping', ['sale_id'], {
      name: 'idx_sale_shipping_sale_id',
      unique: true
    });
    await queryInterface.addIndex('sale_shipping', ['customer_id'], {
      name: 'idx_sale_shipping_customer_id'
    });
    await queryInterface.addIndex('sale_shipping', ['shipping_zone_id'], {
      name: 'idx_sale_shipping_zone_id'
    });
    await queryInterface.addIndex('sale_shipping', ['delivery_status'], {
      name: 'idx_sale_shipping_delivery_status'
    });
    await queryInterface.addIndex('sale_shipping', ['delivery_neighborhood'], {
      name: 'idx_sale_shipping_neighborhood'
    });
    await queryInterface.addIndex('sale_shipping', ['estimated_delivery_date'], {
      name: 'idx_sale_shipping_estimated_date'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('sale_shipping');
  }
};
