/**
 * Migration: Add tare_weight column to products table
 * PART 13: KRETZ SCALE INTEGRATION
 *
 * Tare weight is the weight of the packaging (bag) that should be deducted
 * when selling loose/weighable products (e.g., pet food sold by kg).
 *
 * Example:
 * - Scale shows: 2.6 kg (product + bag)
 * - Tare weight: 0.1 kg (bag only)
 * - Customer pays for: 2.5 kg (product only)
 */

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('products', 'tare_weight', {
      type: Sequelize.DECIMAL(8, 3),
      allowNull: true,
      defaultValue: null,
      comment: 'Tare weight in kg (bag/packaging weight to deduct from scale reading)'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('products', 'tare_weight');
  }
};
