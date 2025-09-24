const { Message, User } = require('../models');
const { Op } = require('sequelize');

// Get chat history between two users
const getChatHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { receiverId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    // Validate receiver exists
    const receiver = await User.findByPk(receiverId);
    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get messages between users
    const messages = await Message.findAndCountAll({
      where: {
        [Op.or]: [
          { senderId: userId, receiverId: receiverId },
          { senderId: receiverId, receiverId: userId }
        ]
      },
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
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    // Mark messages as read
    await Message.update(
      { isRead: true },
      {
        where: {
          senderId: receiverId,
          receiverId: userId,
          isRead: false
        }
      }
    );

    res.json({
      success: true,
      data: {
        messages: messages.rows.reverse(), // Reverse to show oldest first
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(messages.count / limit),
          totalMessages: messages.count,
          hasNextPage: page < Math.ceil(messages.count / limit),
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get list of users (for chat list)
const getUsers = async (req, res) => {
  try {
    const userId = req.user.id;

    const users = await User.findAll({
      where: {
        id: { [Op.ne]: userId } // Exclude current user
      },
      attributes: ['id', 'username', 'isOnline', 'lastSeen'],
      order: [['isOnline', 'DESC'], ['lastSeen', 'DESC']]
    });

    res.json({
      success: true,
      data: { users }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Send message (REST endpoint - for backup/fallback)
const sendMessage = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { receiverId, message } = req.body;

    // Validate input
    if (!receiverId || !message) {
      return res.status(400).json({
        success: false,
        message: 'Receiver ID and message are required'
      });
    }

    // Validate receiver exists
    const receiver = await User.findByPk(receiverId);
    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'Receiver not found'
      });
    }

    // Create message
    const newMessage = await Message.create({
      senderId,
      receiverId,
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

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: { message: messageWithUsers }
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get unread messages count
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const unreadCount = await Message.count({
      where: {
        receiverId: userId,
        isRead: false
      }
    });

    res.json({
      success: true,
      data: { unreadCount }
    });

  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getChatHistory,
  getUsers,
  sendMessage,
  getUnreadCount
};