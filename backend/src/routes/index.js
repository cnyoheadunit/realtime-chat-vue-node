const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./authRoutes');
const chatRoutes = require('./chatRoutes');

// Use routes
router.use('/auth', authRoutes);
router.use('/chat', chatRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running!',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;