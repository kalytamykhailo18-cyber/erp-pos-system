'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('products', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      sku: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      barcode: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      name: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      short_name: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      category_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'categories',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      unit_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'units_of_measure',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      cost_price: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0
      },
      selling_price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      margin_percent: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true
      },
      tax_rate: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 21.00
      },
      is_tax_included: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      track_stock: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      minimum_stock: {
        type: Sequelize.DECIMAL(12, 3),
        defaultValue: 0
      },
      is_weighable: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      shrinkage_percent: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 0
      },
      // Nutritional information (CRITICAL for pet food business)
      protein_percent: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        comment: 'Protein percentage for pet food products (e.g., 24.5 for 24.5% protein)'
      },
      scale_plu: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      export_to_scale: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      // Three-level taxonomy
      species_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'species',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Level 1: Species (Dog, Cat, Bird, etc.)'
      },
      variety_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'varieties',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Level 2: Variety (Adult, Puppy, Senior, etc.)'
      },
      product_type_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'product_types',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Level 3: Product Type (Food, Snacks, Accessories, etc.)'
      },
      weight_size: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'Package size display (e.g., "20 kg", "3 kg", "500g")'
      },
      is_factory_direct: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'TRUE if factory-direct brand (for recommendation system)'
      },
      tare_weight: {
        type: Sequelize.DECIMAL(8, 3),
        allowNull: true,
        defaultValue: null,
        comment: 'Tare weight in kg (bag/packaging weight to deduct from scale reading)'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      is_featured: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      image_url: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      thumbnail_url: {
        type: Sequelize.STRING(500),
        allowNull: true
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

    await queryInterface.addIndex('products', ['sku']);
    await queryInterface.addIndex('products', ['barcode']);
    await queryInterface.addIndex('products', ['category_id']);
    await queryInterface.addIndex('products', ['is_active']);
    await queryInterface.addIndex('products', ['species_id']);
    await queryInterface.addIndex('products', ['variety_id']);
    await queryInterface.addIndex('products', ['product_type_id']);
    await queryInterface.addIndex('products', ['is_factory_direct']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('products');
  }
};
