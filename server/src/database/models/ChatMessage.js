const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ChatMessage = sequelize.define('ChatMessage', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    conversation_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'chat_conversations',
        key: 'id'
      }
    },
    sender_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    message_type: {
      type: DataTypes.STRING(20),
      defaultValue: 'TEXT',
      validate: {
        isIn: [['TEXT', 'IMAGE', 'TRANSFER_REQUEST']]
      }
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    transfer_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'stock_transfers',
        key: 'id'
      }
    },
    is_deleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'chat_messages',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  ChatMessage.associate = (models) => {
    ChatMessage.belongsTo(models.ChatConversation, { foreignKey: 'conversation_id', as: 'conversation' });
    ChatMessage.belongsTo(models.User, { foreignKey: 'sender_id', as: 'sender' });
    ChatMessage.belongsTo(models.StockTransfer, { foreignKey: 'transfer_id', as: 'transfer' });
  };

  return ChatMessage;
};
