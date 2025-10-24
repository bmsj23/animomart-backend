import express from 'express';
import * as messageController from '../controllers/message.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// all routes are protected
router.use(authenticate);

// route   GET /api/messages/conversations
// desc    get all conversations for user
// access  private
router.get('/conversations', messageController.getConversations);

// route   GET /api/messages/unread-count
// desc    get unread message count
// access  private
router.get('/unread-count', messageController.getUnreadCount);

// route   GET /api/messages/online-users
// desc    get online users
// access  private
router.get('/online-users', messageController.getOnlineUsers);

// route   GET /api/messages/:otherUserId
// desc    get conversation with specific user
// access  private
router.get('/:otherUserId', messageController.getConversation);

// route   POST /api/messages
// desc    send new message
// access  private
router.post('/', messageController.sendMessage);

// route   POST /api/messages/mark-read
// desc    mark messages as read
// access  private
router.post('/mark-read', messageController.markAsRead);

// route   DELETE /api/messages/:messageId
// desc    delete message (sender only)
// access  private
router.delete('/:messageId', messageController.deleteMessage);

export default router;