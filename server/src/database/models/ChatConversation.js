const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ChatConversation = sequelize.define('ChatConversation', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    conversation_type: {
      type: DataTypes.STRING(20),
      defaultValue: 'DIRECT',
      validate: {
        isIn: [['DIRECT', 'BRANCH', 'GROUP']]
      }
    },
    branch_a_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'branches',
        key: 'id'
      }
    },
    branch_b_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'branches',
        key: 'id'
      }
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: true
    }
  }, {
    tableName: 'chat_conversations',
    timestamps: true,
    underscored: true
  });

  ChatConversation.associate = (models) => {
    ChatConversation.belongsTo(models.Branch, { foreignKey: 'branch_a_id', as: 'branchA' });
    ChatConversation.belongsTo(models.Branch, { foreignKey: 'branch_b_id', as: 'branchB' });
    ChatConversation.hasMany(models.ChatParticipant, { foreignKey: 'conversation_id', as: 'participants' });
    ChatConversation.hasMany(models.ChatMessage, { foreignKey: 'conversation_id', as: 'messages' });
  };

  return ChatConversation;
};
