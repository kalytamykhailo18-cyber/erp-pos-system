'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('denomination_configurations', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      value: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        unique: true,
        comment: 'Denomination value (e.g., 20000, 10000, 2000)'
      },
      label: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'Display label (e.g., "$20,000")'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Whether this denomination is currently in use'
      },
      display_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Sort order for UI display (lower = first)'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()')
      }
    });

    // Create index on is_active for faster queries
    await queryInterface.addIndex('denomination_configurations', ['is_active']);

    // Create index on display_order for sorting
    await queryInterface.addIndex('denomination_configurations', ['display_order']);

    // PART 16: Seed initial Argentine denominations (current as of 2024)
    await queryInterface.bulkInsert('denomination_configurations', [
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        value: 20000,
        label: '$20,000',
        is_active: true,
        display_order: 1,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        value: 10000,
        label: '$10,000',
        is_active: true,
        display_order: 2,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        value: 2000,
        label: '$2,000',
        is_active: true,
        display_order: 3,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        value: 1000,
        label: '$1,000',
        is_active: true,
        display_order: 4,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        value: 500,
        label: '$500',
        is_active: true,
        display_order: 5,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        value: 200,
        label: '$200',
        is_active: true,
        display_order: 6,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        value: 100,
        label: '$100',
        is_active: true,
        display_order: 7,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        value: 50,
        label: '$50',
        is_active: true,
        display_order: 8,
        created_at: new Date(),
        updated_at: new Date()
      },
      // Obsolete denominations (kept for historical records, marked inactive)
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        value: 20,
        label: '$20',
        is_active: false,
        display_order: 9,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        value: 10,
        label: '$10',
        is_active: false,
        display_order: 10,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('denomination_configurations');
  }
};
