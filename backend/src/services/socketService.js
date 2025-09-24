const jwt = require('jsonwebtoken');
const { User, Message } = require('../models');

// Store connected users
const connectedUsers = new Map();

const initializeSocket = (io) => {
  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password'] }
      });

      if (!user) {
        return next(new Error('Authentication error: Invalid token'));
      }

      socket.userId = user.id;
      socket.username = user.username;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.userId;
    const username = socket.username;

    console.log(`✅ User ${username} (ID: ${userId}) connected`);

    // Store user connection
    connectedUsers.set(userId, {
      socketId: socket.id,
      username: username,
      userId: userId
    });

    // Update user online status in database
    await User.update(
      { isOnline: true },
      { where: { id: userId } }
    );

    // Join user to their personal room
    socket.join(`user_${userId}`);

    // Emit online users to all clients
    const onlineUsers = Array.from(connectedUsers.values()).map(user => ({
      id: user.userId,
      username: user.username
    }));
    
    io.emit('users_online', onlineUsers);

    // Handle joining private chat room
    socket.on('join_chat', ({ receiverId }) => {
      const chatRoom = [userId, receiverId].sort().join('_');
      socket.join(chatRoom);
      console.log(`👥 User ${username} joined chat room: ${chatRoom}`);
    });

    // Handle leaving private chat room
    socket.on('leave_chat', ({ receiverId }) => {
      const chatRoom = [userId, receiverId].sort().join('_');
      socket.leave(chatRoom);
      console.log(`👋 User ${username} left chat room: ${chatRoom}`);
    });

    // Handle private message
    socket.on('send_message', async (data) => {
      try {
        const { receiverId, message } = data;

        // Validate input
        if (!receiverId || !message || !message.trim()) {
          socket.emit('error', { message: 'Invalid message data' });
          return;
        }

        // Check if receiver exists
        const receiver = await User.findByPk(receiverId);
        if (!receiver) {
          socket.emit('error', { message: 'Receiver not found' });
          return;
        }

        // Save message to database
        const newMessage = await Message.create({
          senderId: userId,
          receiverId: receiverId,
          message: message.trim()
        });

        // Get message with user info
        const messageWithUsers = await Message.findByPk(newMessage.id, {
          include: [
            {
              model: User,
              as: 'sender',
              attributes: ['id', 'username']
            },
            {
              model: User,
              as: 'receiver',
              attributes: ['id', 'username']
            }
          ]
        });

        const messageData = {
          id: messageWithUsers.id,
          senderId: messageWithUsers.senderId,
          receiverId: messageWithUsers.receiverId,
          message: messageWithUsers.message,
          messageType: messageWithUsers.messageType,
          isRead: messageWithUsers.isRead,
          created_at: messageWithUsers.created_at,
          sender: messageWithUsers.sender,
          receiver: messageWithUsers.receiver
        };

        // Send message to chat room (both sender and receiver)
        const chatRoom = [userId, receiverId].sort().join('_');
        io.to(chatRoom).emit('receive_message', messageData);

        // Send notification to receiver if they're online but not in chat room
        const receiverConnection = connectedUsers.get(receiverId);
        if (receiverConnection) {
          io.to(`user_${receiverId}`).emit('new_message_notification', {
            from: username,
            message: message.trim(),
            senderId: userId
          });
        }

        console.log(`💬 Message sent from ${username} to ${receiver.username}`);

      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicator
    socket.on('typing', ({ receiverId, isTyping }) => {
      const chatRoom = [userId, receiverId].sort().join('_');
      socket.to(chatRoom).emit('user_typing', {
        userId: userId,
        username: username,
        isTyping: isTyping
      });
    });

    // Handle message read status
    socket.on('mark_messages_read', async ({ senderId }) => {
      try {
        await Message.update(
          { isRead: true },
          {
            where: {
              senderId: senderId,
              receiverId: userId,
              isRead: false
            }
          }
        );

        // Notify sender that messages were read
        const senderConnection = connectedUsers.get(senderId);
        if (senderConnection) {
          io.to(`user_${senderId}`).emit('messages_read', {
            readBy: userId,
            readByUsername: username
          });
        }

      } catch (error) {
        console.error('Mark messages read error:', error);
      }
    });

    // Handle user disconnection
    socket.on('disconnect', async () => {
      console.log(`❌ User ${username} (ID: ${userId}) disconnected`);

      // Remove user from connected users
      connectedUsers.delete(userId);

      // Update user offline status in database
      await User.update(
        { 
          isOnline: false, 
          lastSeen: new Date() 
        },
        { where: { id: userId } }
      );

      // Emit updated online users list
      const onlineUsers = Array.from(connectedUsers.values()).map(user => ({
        id: user.userId,
        username: user.username
      }));
      
      io.emit('users_online', onlineUsers);
    });

    // Handle manual disconnect
    socket.on('user_logout', async () => {
      // Remove user from connected users
      connectedUsers.delete(userId);

      // Update user offline status
      await User.update(
        { 
          isOnline: false, 
          lastSeen: new Date() 
        },
        { where: { id: userId } }
      );

      // Emit updated online users list
      const onlineUsers = Array.from(connectedUsers.values()).map(user => ({
        id: user.userId,
        username: user.username
      }));
      
      io.emit('users_online', onlineUsers);

      socket.disconnect();
    });
  });
};

const getConnectedUsers = () => {
  return Array.from(connectedUsers.values());
};

module.exports = {
  initializeSocket,
  getConnectedUsers
};