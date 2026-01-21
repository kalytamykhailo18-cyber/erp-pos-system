'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('neighborhood_mappings', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      neighborhood_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Neighborhood name exactly as customers enter it'
      },
      normalized_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Lowercase normalized version for matching (e.g., "villa del parque")'
      },
      postal_code: {
        type: Sequelize.STRING(20),
        allowNull: true,
        comment: 'Optional postal code mapping'
      },
      postal_code_pattern: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'Postal code pattern for matching (e.g., "1416%" for all codes starting with 1416)'
      },
      shipping_zone_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'shipping_zones',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        comment: 'The shipping zone this neighborhood belongs to'
      },
      city: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Optional city name for additional context'
      },
      province: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Optional province/state name'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        comment: 'Whether this mapping is currently active'
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
    await queryInterface.addIndex('neighborhood_mappings', ['shipping_zone_id'], {
      name: 'idx_neighborhood_mappings_zone_id'
    });
    await queryInterface.addIndex('neighborhood_mappings', ['normalized_name'], {
      name: 'idx_neighborhood_mappings_normalized_name'
    });
    await queryInterface.addIndex('neighborhood_mappings', ['postal_code'], {
      name: 'idx_neighborhood_mappings_postal_code'
    });
    await queryInterface.addIndex('neighborhood_mappings', ['is_active'], {
      name: 'idx_neighborhood_mappings_is_active'
    });

    // Insert initial neighborhood mappings
    // Note: We need to get the zone IDs from the previous migration
    // Using subqueries to get the zone IDs by name
    const zonesQuery = `
      INSERT INTO neighborhood_mappings (id, neighborhood_name, normalized_name, postal_code, shipping_zone_id, city, is_active, created_at, updated_at)
      SELECT
        uuid_generate_v4(),
        data.neighborhood_name,
        data.normalized_name,
        data.postal_code,
        sz.id,
        data.city,
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      FROM (VALUES
        ('La Tablada', 'la tablada', '1766', 'La Tablada / San Justo', 'La Tablada'),
        ('San Justo', 'san justo', '1754', 'La Tablada / San Justo', 'San Justo'),
        ('Ramos Mejía', 'ramos mejia', '1704', 'La Tablada / San Justo', 'Ramos Mejía'),
        ('Villa del Parque', 'villa del parque', '1416', 'Villa del Parque', 'Villa del Parque'),
        ('Agronomía', 'agronomia', '1417', 'Villa del Parque', 'Agronomía'),
        ('Paternal', 'paternal', '1414', 'Villa del Parque', 'Paternal')
      ) AS data(neighborhood_name, normalized_name, postal_code, zone_name, city)
      JOIN shipping_zones sz ON sz.name = data.zone_name
      WHERE sz.is_active = true;
    `;

    await queryInterface.sequelize.query(zonesQuery);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('neighborhood_mappings');
  }
};
