'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create chat_conversations table
    await queryInterface.createTable('chat_conversations', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      conversation_type: {
        type: Sequelize.STRING(20),
        defaultValue: 'DIRECT',
        comment: 'DIRECT, BRANCH, GROUP'
      },
      branch_a_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'branches',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      branch_b_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'branches',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      title: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      }
    });

    // Create chat_participants table
    await queryInterface.createTable('chat_participants', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      conversation_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'chat_conversations',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      joined_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      left_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      last_read_at: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // Create chat_messages table
    await queryInterface.createTable('chat_messages', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      conversation_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'chat_conversations',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      sender_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      message_type: {
        type: Sequelize.STRING(20),
        defaultValue: 'TEXT',
        comment: 'TEXT, IMAGE, TRANSFER_REQUEST'
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      transfer_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'stock_transfers',
          key: 'id'
        },
        onDelete: 'SET NULL'
      },
      is_deleted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false
      }
    });

    // Add unique constraint for chat_participants
    await queryInterface.addConstraint('chat_participants', {
      fields: ['conversation_id', 'user_id'],
      type: 'unique',
      name: 'chat_participants_conversation_user_unique'
    });

    // Add indexes for performance
    await queryInterface.addIndex('chat_conversations', ['branch_a_id', 'branch_b_id'], {
      name: 'chat_conversations_branches_idx'
    });

    await queryInterface.addIndex('chat_participants', ['user_id'], {
      name: 'chat_participants_user_idx'
    });

    await queryInterface.addIndex('chat_participants', ['conversation_id'], {
      name: 'chat_participants_conversation_idx'
    });

    await queryInterface.addIndex('chat_messages', ['conversation_id', 'created_at'], {
      name: 'chat_messages_conversation_created_idx'
    });

    await queryInterface.addIndex('chat_messages', ['sender_id'], {
      name: 'chat_messages_sender_idx'
    });

    await queryInterface.addIndex('chat_messages', ['transfer_id'], {
      name: 'chat_messages_transfer_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop indexes
    await queryInterface.removeIndex('chat_messages', 'chat_messages_transfer_idx');
    await queryInterface.removeIndex('chat_messages', 'chat_messages_sender_idx');
    await queryInterface.removeIndex('chat_messages', 'chat_messages_conversation_created_idx');
    await queryInterface.removeIndex('chat_participants', 'chat_participants_conversation_idx');
    await queryInterface.removeIndex('chat_participants', 'chat_participants_user_idx');
    await queryInterface.removeIndex('chat_conversations', 'chat_conversations_branches_idx');

    // Drop constraint
    await queryInterface.removeConstraint('chat_participants', 'chat_participants_conversation_user_unique');

    // Drop tables in reverse order
    await queryInterface.dropTable('chat_messages');
    await queryInterface.dropTable('chat_participants');
    await queryInterface.dropTable('chat_conversations');
  }
};
