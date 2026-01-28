'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('varieties', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      species_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'species',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        comment: 'Species this variety belongs to (varieties are species-specific)'
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Variety name (e.g., Adult, Puppy, Senior, Urinary, Renal, etc.)'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      sort_order: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'Display order within species'
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

    await queryInterface.addConstraint('varieties', {
      fields: ['species_id', 'name'],
      type: 'unique',
      name: 'varieties_species_name_unique'
    });

    await queryInterface.addIndex('varieties', ['species_id']);
    await queryInterface.addIndex('varieties', ['is_active']);
    await queryInterface.addIndex('varieties', ['sort_order']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('varieties');
  }
};
