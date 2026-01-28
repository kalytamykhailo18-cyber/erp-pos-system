'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('expense_categories', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Category name (e.g., "Rent", "Utilities", "Taxes", "Supplies")'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      color_hex: {
        type: Sequelize.STRING(7),
        allowNull: true,
        defaultValue: '#3B82F6',
        comment: 'Color for UI visualization'
      },
      is_system: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'System categories cannot be deleted'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
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
    await queryInterface.addIndex('expense_categories', ['is_active']);
    await queryInterface.addIndex('expense_categories', ['name']);

    // Seed initial categories
    await queryInterface.bulkInsert('expense_categories', [
      {
        id: Sequelize.literal('gen_random_uuid()'),
        name: 'Alquiler',
        description: 'Gastos de alquiler de local comercial',
        color_hex: '#EF4444',
        is_system: true,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.literal('gen_random_uuid()'),
        name: 'Servicios',
        description: 'Luz, gas, agua, internet, teléfono',
        color_hex: '#F59E0B',
        is_system: true,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.literal('gen_random_uuid()'),
        name: 'Impuestos',
        description: 'Impuestos municipales, provinciales y nacionales',
        color_hex: '#10B981',
        is_system: true,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.literal('gen_random_uuid()'),
        name: 'Sueldos y Salarios',
        description: 'Salarios de empleados y cargas sociales',
        color_hex: '#3B82F6',
        is_system: true,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.literal('gen_random_uuid()'),
        name: 'Mantenimiento',
        description: 'Reparaciones y mantenimiento del local',
        color_hex: '#8B5CF6',
        is_system: true,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.literal('gen_random_uuid()'),
        name: 'Suministros',
        description: 'Materiales y suministros de oficina',
        color_hex: '#EC4899',
        is_system: true,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.literal('gen_random_uuid()'),
        name: 'Marketing',
        description: 'Publicidad y marketing',
        color_hex: '#14B8A6',
        is_system: true,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.literal('gen_random_uuid()'),
        name: 'Otros',
        description: 'Otros gastos varios',
        color_hex: '#6B7280',
        is_system: false,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('expense_categories');
  }
};
