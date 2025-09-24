const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  senderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'sender_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  receiverId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'receiver_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 1000]
    }
  },
  messageType: {
    type: DataTypes.ENUM('text', 'image', 'file'),
    defaultValue: 'text',
    field: 'message_type'
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_read'
  }
}, {
  tableName: 'messages',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Message;