const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const { authenticate } = require('../middleware/auth');
const {
  validate,
  uuidParam,
  uuidField,
  stringField,
  enumField,
  paginationQuery
} = require('../middleware/validate');

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/chat/conversations
 * @desc    Get all conversations for current user
 * @access  Private
 */
router.get(
  '/conversations',
  chatController.getConversations
);

/**
 * @route   POST /api/v1/chat/conversations/branch
 * @desc    Get or create conversation between branches
 * @access  Private
 */
router.post(
  '/conversations/branch',
  [
    uuidField('branch_a_id'),
    uuidField('branch_b_id'),
    validate
  ],
  chatController.getOrCreateBranchConversation
);

/**
 * @route   GET /api/v1/chat/conversations/:conversationId/messages
 * @desc    Get messages for conversation
 * @access  Private
 */
router.get(
  '/conversations/:conversationId/messages',
  [
    uuidParam('conversationId'),
    ...paginationQuery,
    validate
  ],
  chatController.getMessages
);

/**
 * @route   POST /api/v1/chat/conversations/:conversationId/messages
 * @desc    Send message
 * @access  Private
 */
router.post(
  '/conversations/:conversationId/messages',
  [
    uuidParam('conversationId'),
    stringField('content', { minLength: 1 }),
    enumField('message_type', ['TEXT', 'IMAGE', 'TRANSFER_REQUEST'], { required: false }),
    uuidField('transfer_id', { required: false }),
    validate
  ],
  chatController.sendMessage
);

/**
 * @route   DELETE /api/v1/chat/messages/:messageId
 * @desc    Delete message
 * @access  Private
 */
router.delete(
  '/messages/:messageId',
  [
    uuidParam('messageId'),
    validate
  ],
  chatController.deleteMessage
);

/**
 * @route   PUT /api/v1/chat/conversations/:conversationId/read
 * @desc    Mark conversation as read
 * @access  Private
 */
router.put(
  '/conversations/:conversationId/read',
  [
    uuidParam('conversationId'),
    validate
  ],
  chatController.markAsRead
);

module.exports = router;
