'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('payment_methods', [
      {
        id: uuidv4(),
        code: 'CASH',
        name: 'Efectivo',
        type: 'CASH',
        requires_reference: false,
        is_active: true,
        sort_order: 1,
        created_at: new Date()
      },
      {
        id: uuidv4(),
        code: 'DEBIT',
        name: 'Tarjeta Débito',
        type: 'CARD',
        requires_reference: false,
        is_active: true,
        sort_order: 2,
        created_at: new Date()
      },
      {
        id: uuidv4(),
        code: 'CREDIT',
        name: 'Tarjeta Crédito',
        type: 'CARD',
        requires_reference: false,
        is_active: true,
        sort_order: 3,
        created_at: new Date()
      },
      {
        id: uuidv4(),
        code: 'QR',
        name: 'QR / MercadoPago',
        type: 'QR',
        requires_reference: false,
        is_active: true,
        sort_order: 4,
        created_at: new Date()
      },
      {
        id: uuidv4(),
        code: 'TRANSFER',
        name: 'Transferencia',
        type: 'TRANSFER',
        requires_reference: true,
        is_active: true,
        sort_order: 5,
        created_at: new Date()
      }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('payment_methods', null, {});
  }
};
