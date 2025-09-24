const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middlewares/authMiddleware');

// All chat routes require authentication
router.use(authMiddleware);

router.get('/users', chatController.getUsers);
router.get('/history/:receiverId', chatController.getChatHistory);
router.post('/send', chatController.sendMessage);
router.get('/unread-count', chatController.getUnreadCount);

module.exports = router;