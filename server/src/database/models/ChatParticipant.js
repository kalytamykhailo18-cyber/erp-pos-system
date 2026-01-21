const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ChatParticipant = sequelize.define('ChatParticipant', {
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
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    joined_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    left_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    last_read_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'chat_participants',
    timestamps: false,
    underscored: true,
    indexes: [
      { unique: true, fields: ['conversation_id', 'user_id'] }
    ]
  });

  ChatParticipant.associate = (models) => {
    ChatParticipant.belongsTo(models.ChatConversation, { foreignKey: 'conversation_id', as: 'conversation' });
    ChatParticipant.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  };

  return ChatParticipant;
};
