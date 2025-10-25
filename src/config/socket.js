import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import config from './config.js';

// store online users (userId -> socketId)
export const onlineUsers = new Map();

// store active conversations (userId -> conversationId they're currently viewing)
export const activeConversations = new Map();

// initialize socket.io server
export const initializeSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: config.frontendUrl,
      credentials: true,
      methods: ['GET', 'POST'],
    },
  });

  // socket.io middleware for authentication
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    const decoded = jwt.verify(token, config.jwt.accessSecret);

    socket.userId = decoded.userId || decoded.id || decoded._id;

    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
});

  // socket.io connection handler
  io.on('connection', (socket) => {

    // add user to online users
    onlineUsers.set(socket.userId, socket.id);

    // broadcast updated online users list
    io.emit('onlineUsers', Array.from(onlineUsers.keys()));

    // listen for sending messages
    socket.on('sendMessage', async (message) => {
      try {

        // get receiver's socket id
        const receiverSocketId = onlineUsers.get(message.recipient);

        // emit to receiver if online
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('newMessage', message);
        }

        // also emit back to sender for confirmation
        socket.emit('messageSent', message);
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // listen for typing indicator
    socket.on('typing', ({ to, isTyping }) => {
      const receiverSocketId = onlineUsers.get(to);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('userTyping', {
          userId: socket.userId,
          isTyping,
        });
      }
    });

    // listen for user joining/leaving a conversation
    socket.on('joinConversation', ({ conversationId }) => {
      activeConversations.set(socket.userId, conversationId);
    });

    socket.on('leaveConversation', () => {
      activeConversations.delete(socket.userId);
    });

    // listen for message read status
    socket.on('markAsRead', ({ senderId }) => {
      const senderSocketId = onlineUsers.get(senderId);
      if (senderSocketId) {
        io.to(senderSocketId).emit('messagesRead', {
          readBy: socket.userId,
        });
      }
    });

    // listen for message deletion
    socket.on('deleteMessage', ({ messageId, recipientId }) => {
      const receiverSocketId = onlineUsers.get(recipientId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('messageDeleted', { messageId });
      }
    });

    // handle disconnection
    socket.on('disconnect', () => {

      onlineUsers.delete(socket.userId);
      activeConversations.delete(socket.userId);

      // broadcast updated online users list
      io.emit('onlineUsers', Array.from(onlineUsers.keys()));
    });
  });

  console.log('Socket.IO initialized');
  return io;
};

export default initializeSocket;