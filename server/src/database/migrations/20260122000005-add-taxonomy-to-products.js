'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add three-level taxonomy fields to products
    await queryInterface.addColumn('products', 'species_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'species',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'Level 1: Species (Dog, Cat, Bird, etc.)'
    });

    await queryInterface.addColumn('products', 'variety_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'varieties',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'Level 2: Variety (Adult, Puppy, Senior, etc.)'
    });

    await queryInterface.addColumn('products', 'product_type_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'product_types',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'Level 3: Product Type (Food, Snacks, Accessories, etc.)'
    });

    // Add weight/size field for display (e.g., "20 kg", "3 kg")
    await queryInterface.addColumn('products', 'weight_size', {
      type: Sequelize.STRING(50),
      allowNull: true,
      comment: 'Package size display (e.g., "20 kg", "3 kg", "500g")'
    });

    // Add factory-direct brand flag for recommendations
    await queryInterface.addColumn('products', 'is_factory_direct', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      comment: 'TRUE if factory-direct brand (for recommendation system)'
    });

    // Add indexes for taxonomy fields
    await queryInterface.addIndex('products', ['species_id']);
    await queryInterface.addIndex('products', ['variety_id']);
    await queryInterface.addIndex('products', ['product_type_id']);
    await queryInterface.addIndex('products', ['is_factory_direct']);
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('products', 'species_id');
    await queryInterface.removeColumn('products', 'variety_id');
    await queryInterface.removeColumn('products', 'product_type_id');
    await queryInterface.removeColumn('products', 'weight_size');
    await queryInterface.removeColumn('products', 'is_factory_direct');
  }
};
