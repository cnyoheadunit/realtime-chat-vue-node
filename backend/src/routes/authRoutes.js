const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes
router.use(authMiddleware);
router.post('/logout', authController.logout);
router.get('/profile', authController.getProfile);

module.exports = router;