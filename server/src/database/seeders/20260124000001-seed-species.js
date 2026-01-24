'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('species', [
      {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Perro',
        description: 'Productos para perros',
        sort_order: 1,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        name: 'Gato',
        description: 'Productos para gatos',
        sort_order: 2,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '33333333-3333-3333-3333-333333333333',
        name: 'Pájaro',
        description: 'Productos para aves',
        sort_order: 3,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '44444444-4444-4444-4444-444444444444',
        name: 'Pez',
        description: 'Productos para peces',
        sort_order: 4,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '55555555-5555-5555-5555-555555555555',
        name: 'Roedor',
        description: 'Productos para roedores (hamsters, conejos, etc.)',
        sort_order: 5,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('species', null, {});
  }
};
