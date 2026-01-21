const { v4: uuidv4 } = require('uuid');
const { sequelize } = require('../database/models');
const {
  ChatConversation,
  ChatParticipant,
  ChatMessage,
  User,
  Branch,
  StockTransfer
} = require('../database/models');
const { success, created, paginated } = require('../utils/apiResponse');
const { NotFoundError, BusinessError, UnauthorizedError } = require('../middleware/errorHandler');
const { parsePagination } = require('../utils/helpers');
const { getIO } = require('../socket');

/**
 * Get all conversations for current user
 */
exports.getConversations = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const conversations = await ChatConversation.findAll({
      include: [
        {
          model: ChatParticipant,
          as: 'participants',
          where: { user_id: userId, left_at: null },
          required: true
        },
        {
          model: ChatParticipant,
          as: 'participants',
          include: [{ model: User, as: 'user', attributes: ['id', 'first_name', 'last_name'] }]
        },
        { model: Branch, as: 'branchA', attributes: ['id', 'name', 'code'] },
        { model: Branch, as: 'branchB', attributes: ['id', 'name', 'code'] },
        {
          model: ChatMessage,
          as: 'messages',
          separate: true,
          limit: 1,
          order: [['created_at', 'DESC']],
          attributes: ['id', 'content', 'message_type', 'created_at']
        }
      ],
      order: [['updated_at', 'DESC']]
    });

    return success(res, conversations);
  } catch (error) {
    next(error);
  }
};

/**
 * Get or create conversation between branches
 */
exports.getOrCreateBranchConversation = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { branch_a_id, branch_b_id } = req.body;
    const userId = req.user.id;

    // Find existing conversation
    let conversation = await ChatConversation.findOne({
      where: {
        conversation_type: 'BRANCH',
        [sequelize.Op.or]: [
          { branch_a_id, branch_b_id },
          { branch_a_id: branch_b_id, branch_b_id: branch_a_id }
        ]
      },
      include: [
        { model: Branch, as: 'branchA', attributes: ['id', 'name', 'code'] },
        { model: Branch, as: 'branchB', attributes: ['id', 'name', 'code'] },
        {
          model: ChatParticipant,
          as: 'participants',
          include: [{ model: User, as: 'user', attributes: ['id', 'first_name', 'last_name'] }]
        }
      ]
    });

    if (!conversation) {
      // Create new conversation
      const branchA = await Branch.findByPk(branch_a_id);
      const branchB = await Branch.findByPk(branch_b_id);

      if (!branchA || !branchB) {
        throw new NotFoundError('Branch not found');
      }

      conversation = await ChatConversation.create({
        id: uuidv4(),
        conversation_type: 'BRANCH',
        branch_a_id,
        branch_b_id,
        title: `${branchA.name} <-> ${branchB.name}`
      }, { transaction: t });

      // Add current user as participant
      await ChatParticipant.create({
        id: uuidv4(),
        conversation_id: conversation.id,
        user_id: userId
      }, { transaction: t });

      await t.commit();

      // Reload with associations
      conversation = await ChatConversation.findByPk(conversation.id, {
        include: [
          { model: Branch, as: 'branchA', attributes: ['id', 'name', 'code'] },
          { model: Branch, as: 'branchB', attributes: ['id', 'name', 'code'] },
          {
            model: ChatParticipant,
            as: 'participants',
            include: [{ model: User, as: 'user', attributes: ['id', 'first_name', 'last_name'] }]
          }
        ]
      });
    } else {
      await t.commit();

      // Check if user is participant, if not add them
      const isParticipant = conversation.participants.some(p => p.user_id === userId && !p.left_at);
      if (!isParticipant) {
        await ChatParticipant.create({
          id: uuidv4(),
          conversation_id: conversation.id,
          user_id: userId
        });

        // Reload participants
        conversation = await ChatConversation.findByPk(conversation.id, {
          include: [
            { model: Branch, as: 'branchA', attributes: ['id', 'name', 'code'] },
            { model: Branch, as: 'branchB', attributes: ['id', 'name', 'code'] },
            {
              model: ChatParticipant,
              as: 'participants',
              include: [{ model: User, as: 'user', attributes: ['id', 'first_name', 'last_name'] }]
            }
          ]
        });
      }
    }

    return success(res, conversation);
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

/**
 * Get messages for conversation
 */
exports.getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { page, limit, offset } = parsePagination(req.query);
    const userId = req.user.id;

    // Verify user is participant
    const participant = await ChatParticipant.findOne({
      where: { conversation_id: conversationId, user_id: userId, left_at: null }
    });

    if (!participant) {
      throw new UnauthorizedError('Not a participant of this conversation');
    }

    const { count, rows } = await ChatMessage.findAndCountAll({
      where: {
        conversation_id: conversationId,
        is_deleted: false
      },
      include: [
        { model: User, as: 'sender', attributes: ['id', 'first_name', 'last_name'] },
        {
          model: StockTransfer,
          as: 'transfer',
          attributes: ['id', 'transfer_number', 'status'],
          include: [
            { model: Branch, as: 'source_branch', attributes: ['id', 'name'] },
            { model: Branch, as: 'destination_branch', attributes: ['id', 'name'] }
          ]
        }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    // Update last_read_at
    await participant.update({ last_read_at: new Date() });

    return paginated(res, rows, { page, limit, total_items: count });
  } catch (error) {
    next(error);
  }
};

/**
 * Send message
 */
exports.sendMessage = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { conversationId } = req.params;
    const { content, message_type = 'TEXT', transfer_id } = req.body;
    const userId = req.user.id;

    // Verify user is participant
    const participant = await ChatParticipant.findOne({
      where: { conversation_id: conversationId, user_id: userId, left_at: null }
    });

    if (!participant) {
      throw new UnauthorizedError('Not a participant of this conversation');
    }

    // Create message
    const message = await ChatMessage.create({
      id: uuidv4(),
      conversation_id: conversationId,
      sender_id: userId,
      message_type,
      content,
      transfer_id: transfer_id || null
    }, { transaction: t });

    // Update conversation updated_at
    await ChatConversation.update(
      { updated_at: new Date() },
      { where: { id: conversationId }, transaction: t }
    );

    await t.commit();

    // Reload with associations
    const fullMessage = await ChatMessage.findByPk(message.id, {
      include: [
        { model: User, as: 'sender', attributes: ['id', 'first_name', 'last_name'] },
        {
          model: StockTransfer,
          as: 'transfer',
          attributes: ['id', 'transfer_number', 'status'],
          include: [
            { model: Branch, as: 'source_branch', attributes: ['id', 'name'] },
            { model: Branch, as: 'destination_branch', attributes: ['id', 'name'] }
          ]
        }
      ]
    });

    // Emit WebSocket event
    const io = getIO();
    io.to(`conversation:${conversationId}`).emit('chat:message', fullMessage);

    // Get other participants and send notification
    const conversation = await ChatConversation.findByPk(conversationId, {
      include: [{ model: ChatParticipant, as: 'participants', where: { left_at: null } }]
    });

    conversation.participants.forEach(p => {
      if (p.user_id !== userId) {
        io.to(`user:${p.user_id}`).emit('chat:new_message', {
          conversation_id: conversationId,
          message: fullMessage
        });
      }
    });

    return created(res, fullMessage);
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

/**
 * Delete message
 */
exports.deleteMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await ChatMessage.findByPk(messageId);

    if (!message) {
      throw new NotFoundError('Message not found');
    }

    if (message.sender_id !== userId) {
      throw new UnauthorizedError('Can only delete your own messages');
    }

    await message.update({ is_deleted: true });

    // Emit WebSocket event
    const io = getIO();
    io.to(`conversation:${message.conversation_id}`).emit('chat:message_deleted', {
      message_id: messageId
    });

    return success(res, null, 'Message deleted');
  } catch (error) {
    next(error);
  }
};

/**
 * Mark conversation as read
 */
exports.markAsRead = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const participant = await ChatParticipant.findOne({
      where: { conversation_id: conversationId, user_id: userId, left_at: null }
    });

    if (!participant) {
      throw new NotFoundError('Not a participant');
    }

    await participant.update({ last_read_at: new Date() });

    return success(res, null, 'Marked as read');
  } catch (error) {
    next(error);
  }
};

module.exports = exports;
