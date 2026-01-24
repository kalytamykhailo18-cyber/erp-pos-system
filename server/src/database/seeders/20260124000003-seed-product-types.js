'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('product_types', [
      {
        id: 'ccc11111-1111-1111-1111-111111111111',
        name: 'Alimento Seco',
        description: 'Alimento balanceado seco (croquetas)',
        sort_order: 1,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'ccc22222-2222-2222-2222-222222222222',
        name: 'Alimento Húmedo',
        description: 'Alimento húmedo en lata o sobre',
        sort_order: 2,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'ccc33333-3333-3333-3333-333333333333',
        name: 'Snack/Golosina',
        description: 'Premios y golosinas',
        sort_order: 3,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'ccc44444-4444-4444-4444-444444444444',
        name: 'Accesorio',
        description: 'Accesorios y juguetes',
        sort_order: 4,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'ccc55555-5555-5555-5555-555555555555',
        name: 'Higiene',
        description: 'Productos de higiene y limpieza',
        sort_order: 5,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'ccc66666-6666-6666-6666-666666666666',
        name: 'Salud',
        description: 'Suplementos y productos de salud',
        sort_order: 6,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'ccc77777-7777-7777-7777-777777777777',
        name: 'Arena/Piedras',
        description: 'Arena sanitaria para gatos',
        sort_order: 7,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('product_types', null, {});
  }
};
