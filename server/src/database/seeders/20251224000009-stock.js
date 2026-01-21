'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface) {
    // Get all products
    const [products] = await queryInterface.sequelize.query(
      `SELECT id, sku FROM products;`
    );

    // Get all branches
    const [branches] = await queryInterface.sequelize.query(
      `SELECT id, code FROM branches;`
    );

    const stockRecords = [];

    // Create stock for each product in each branch
    products.forEach(product => {
      branches.forEach((branch, branchIndex) => {
        // Vary stock levels per branch
        let quantity = 0;
        let minStock = 0;
        let maxStock = 0;

        if (branchIndex === 0) {
          quantity = 500; // Branch 1 has most stock
          minStock = 50;
          maxStock = 1000;
        } else if (branchIndex === 1) {
          quantity = 400;
          minStock = 40;
          maxStock = 800;
        } else if (branchIndex === 2) {
          quantity = 350;
          minStock = 35;
          maxStock = 700;
        } else {
          quantity = 300; // Branch 4 has least stock
          minStock = 30;
          maxStock = 600;
        }

        stockRecords.push({
          id: uuidv4(),
          product_id: product.id,
          branch_id: branch.id,
          quantity: quantity,
          reserved_quantity: 0,
          min_stock: minStock,
          max_stock: maxStock,
          updated_at: new Date()
        });
      });
    });

    await queryInterface.bulkInsert('branch_stock', stockRecords);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('branch_stock', null, {});
  }
};
