'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const dogId = '11111111-1111-1111-1111-111111111111';
    const catId = '22222222-2222-2222-2222-222222222222';

    await queryInterface.bulkInsert('varieties', [
      // Dog varieties
      {
        id: 'aaa11111-1111-1111-1111-111111111111',
        species_id: dogId,
        name: 'Cachorro',
        description: 'Perro cachorro (hasta 12 meses)',
        sort_order: 1,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'aaa22222-2222-2222-2222-222222222222',
        species_id: dogId,
        name: 'Adulto',
        description: 'Perro adulto (1-7 años)',
        sort_order: 2,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'aaa33333-3333-3333-3333-333333333333',
        species_id: dogId,
        name: 'Senior',
        description: 'Perro senior (7+ años)',
        sort_order: 3,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'aaa44444-4444-4444-4444-444444444444',
        species_id: dogId,
        name: 'Raza Pequeña',
        description: 'Perro de raza pequeña',
        sort_order: 4,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'aaa55555-5555-5555-5555-555555555555',
        species_id: dogId,
        name: 'Raza Grande',
        description: 'Perro de raza grande',
        sort_order: 5,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },

      // Cat varieties
      {
        id: 'bbb11111-1111-1111-1111-111111111111',
        species_id: catId,
        name: 'Gatito',
        description: 'Gato gatito (hasta 12 meses)',
        sort_order: 1,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'bbb22222-2222-2222-2222-222222222222',
        species_id: catId,
        name: 'Adulto',
        description: 'Gato adulto (1-7 años)',
        sort_order: 2,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'bbb33333-3333-3333-3333-333333333333',
        species_id: catId,
        name: 'Senior',
        description: 'Gato senior (7+ años)',
        sort_order: 3,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'bbb44444-4444-4444-4444-444444444444',
        species_id: catId,
        name: 'Indoor',
        description: 'Gato de interior',
        sort_order: 4,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'bbb55555-5555-5555-5555-555555555555',
        species_id: catId,
        name: 'Outdoor',
        description: 'Gato de exterior',
        sort_order: 5,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('varieties', null, {});
  }
};
