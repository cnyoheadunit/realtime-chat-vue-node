# 🔧 Troubleshooting Guide

Panduan lengkap untuk menyelesaikan masalah umum dalam development dan production aplikasi Realtime Chat.

## 📋 Quick Diagnosis

### Cek Status Aplikasi

```bash
# Cek apakah port sudah digunakan
lsof -i :3000  # Backend
lsof -i :5173  # Frontend

# Cek status MySQL
sudo systemctl status mysql

# Cek log aplikasi
tail -f backend/logs/app.log  # Jika ada logging
```

---

## 🚨 Common Issues & Solutions

### 1. Database Connection Issues

#### Problem: `ECONNREFUSED 127.0.0.1:3306`

**Symptoms:**
```
Error: connect ECONNREFUSED 127.0.0.1:3306
    at TCPConnectWrap.afterConnect [as oncomplete]
```

**Solutions:**

**A. Check MySQL Service**
```bash
# Ubuntu/Debian
sudo systemctl status mysql
sudo systemctl start mysql

# macOS (Homebrew)
brew services list
brew services start mysql

# Windows
net start mysql
```

**B. Verify MySQL Configuration**
```bash
# Test MySQL connection
mysql -u root -p

# Check MySQL port
mysql -u root -p -e "SHOW VARIABLES LIKE 'port';"
```

**C. Update Database Configuration**
```javascript
// backend/src/config/db.config.js
module.exports = {
  development: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,  // Pastikan port benar
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || 'your_password',
    database: process.env.DB_NAME || 'realtime_chat'
  }
};
```

**D. Create Database if Not Exists**
```sql
-- Login ke MySQL
mysql -u root -p

-- Create database
CREATE DATABASE IF NOT EXISTS realtime_chat CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user (optional)
CREATE USER 'chat_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON realtime_chat.* TO 'chat_user'@'localhost';
FLUSH PRIVILEGES;
```

#### Problem: `Access denied for user`

**Solutions:**

**A. Reset MySQL Password**
```bash
# Ubuntu/Debian
sudo mysql_secure_installation

# Or reset root password
sudo mysql -u root
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'new_password';
FLUSH PRIVILEGES;
```

**B. Update .env File**
```env
# backend/.env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=your_correct_password
DB_NAME=realtime_chat
```

### 2. Socket.IO Connection Issues

#### Problem: WebSocket Connection Failed

**Symptoms:**
```
WebSocket connection to 'ws://localhost:3000/socket.io/' failed
```

**Solutions:**

**A. Check CORS Configuration**
```javascript
// backend/src/services/socketService.js
const io = require('socket.io')(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']  // Add fallback
});
```

**B. Verify Frontend Socket Configuration**
```javascript
// frontend/src/stores/chat.js
const socket = io('http://localhost:3000', {
  autoConnect: true,
  timeout: 20000,
  forceNew: true,
  transports: ['websocket', 'polling']
});
```

**C. Check Firewall Rules**
```bash
# Ubuntu - Allow ports
sudo ufw allow 3000
sudo ufw allow 5173

# Check firewall status
sudo ufw status
```

#### Problem: Socket Disconnects Frequently

**Solutions:**

**A. Increase Timeout Settings**
```javascript
// Backend
const io = require('socket.io')(server, {
  pingTimeout: 60000,
  pingInterval: 25000
});

// Frontend  
const socket = io('http://localhost:3000', {
  timeout: 60000,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});
```

**B. Handle Network Disconnections**
```javascript
// frontend/src/stores/chat.js
socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
  if (reason === 'io server disconnect') {
    // Server disconnected, need to reconnect manually
    socket.connect();
  }
});

socket.on('reconnect', (attemptNumber) => {
  console.log('Reconnected after', attemptNumber, 'attempts');
  // Reload chat data
  this.loadUsers();
});
```

### 3. JWT Authentication Issues

#### Problem: `JsonWebTokenError: invalid token`

**Solutions:**

**A. Check JWT Secret**
```javascript
// backend/.env
JWT_SECRET=your-super-secure-jwt-secret-key-here

// Verify in middleware
console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
```

**B. Verify Token Format in Frontend**
```javascript
// frontend/src/services/api.js
const token = localStorage.getItem('auth_token');
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// Debug token
console.log('Stored token:', token);
console.log('Token parts:', token?.split('.').length); // Should be 3
```

**C. Handle Token Expiration**
```javascript
// frontend/src/stores/auth.js
// Intercept 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired, logout user
      this.logout();
      router.push('/login');
    }
    return Promise.reject(error);
  }
);
```

#### Problem: Token Not Being Sent

**Solutions:**

**A. Check Axios Configuration**
```javascript
// frontend/src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 10000,
  withCredentials: true
});

// Always attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### 4. CORS Issues

#### Problem: `Access-Control-Allow-Origin` Error

**Solutions:**

**A. Update CORS Configuration**
```javascript
// backend/src/app.js
const cors = require('cors');

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://yourdomain.com'  // Add production domain
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight requests
app.options('*', cors());
```

**B. Verify Frontend API Base URL**
```javascript
// frontend/.env
VITE_API_BASE_URL=http://localhost:3000

// frontend/src/services/api.js
const baseURL = import.meta.env.VITE_API_BASE_URL + '/api';
```

### 5. Build & Deployment Issues

#### Problem: Frontend Build Fails

**Solutions:**

**A. Clear Cache and Reinstall**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

**B. Check Vite Configuration**
```javascript
// frontend/vite.config.js
export default defineConfig({
  plugins: [vue()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1000
  },
  server: {
    host: true,
    port: 5173
  }
});
```

#### Problem: Backend Crash in Production

**Solutions:**

**A. Add Process Manager**
```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start backend/src/app.js --name "chat-backend"
pm2 startup
pm2 save
```

**B. Add Error Handling**
```javascript
// backend/src/app.js
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
});
```

### 6. Performance Issues

#### Problem: Slow Message Loading

**Solutions:**

**A. Add Database Indexes**
```sql
-- Add indexes for better query performance
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
```

**B. Implement Pagination**
```javascript
// backend/src/controllers/chatController.js
const getMessages = async (req, res) => {
  try {
    const { receiverId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const messages = await Message.findAndCountAll({
      where: {
        [Op.or]: [
          { senderId: req.user.id, receiverId },
          { senderId: receiverId, receiverId: req.user.id }
        ]
      },
      include: [/* ... */],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        messages: messages.rows.reverse(),
        totalPages: Math.ceil(messages.count / limit),
        currentPage: parseInt(page)
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
```

**C. Add Frontend Pagination**
```javascript
// frontend/src/stores/chat.js
const loadMoreMessages = async (receiverId, page = 1) => {
  try {
    const response = await api.get(`/chat/messages/${receiverId}?page=${page}`);
    
    if (page === 1) {
      messages.value = response.data.data.messages;
    } else {
      // Prepend older messages
      messages.value = [...response.data.data.messages, ...messages.value];
    }
    
    return response.data.data;
  } catch (error) {
    console.error('Error loading messages:', error);
  }
};
```

#### Problem: High Memory Usage

**Solutions:**

**A. Implement Message Cleanup**
```javascript
// backend/src/services/cleanupService.js
const cleanupOldMessages = async () => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  await Message.destroy({
    where: {
      created_at: {
        [Op.lt]: thirtyDaysAgo
      }
    }
  });
};

// Run cleanup daily
setInterval(cleanupOldMessages, 24 * 60 * 60 * 1000);
```

**B. Limit Socket Connections**
```javascript
// backend/src/services/socketService.js
const activeConnections = new Map();
const MAX_CONNECTIONS_PER_USER = 5;

io.use((socket, next) => {
  const userId = socket.user.id;
  const userConnections = activeConnections.get(userId) || 0;
  
  if (userConnections >= MAX_CONNECTIONS_PER_USER) {
    return next(new Error('Too many connections'));
  }
  
  activeConnections.set(userId, userConnections + 1);
  next();
});
```

### 7. Security Issues

#### Problem: Rate Limiting Not Working

**Solutions:**

**A. Implement Express Rate Limiting**
```javascript
// backend/src/app.js
const rateLimit = require('express-rate-limit');

const messageRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 50, // 50 requests per minute
  message: 'Too many messages sent, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/chat', messageRateLimit);
```

**B. Implement Socket Rate Limiting**
```javascript
// backend/src/services/socketService.js
const socketRateLimit = new Map();

const rateLimitCheck = (userId, action) => {
  const key = `${userId}_${action}`;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 30;

  if (!socketRateLimit.has(key)) {
    socketRateLimit.set(key, []);
  }

  const requests = socketRateLimit.get(key);
  const validRequests = requests.filter(time => now - time < windowMs);
  
  if (validRequests.length >= maxRequests) {
    return false;
  }

  validRequests.push(now);
  socketRateLimit.set(key, validRequests);
  return true;
};

// Use in socket handlers
socket.on('send_message', (data) => {
  if (!rateLimitCheck(socket.user.id, 'message')) {
    socket.emit('rate_limit_exceeded', { message: 'Too many messages' });
    return;
  }
  // Process message...
});
```

---

## 🛠️ Development Tools

### Debug Mode

**Backend Debug:**
```javascript
// backend/.env
NODE_ENV=development
DEBUG=true

// Add debug logging
if (process.env.DEBUG) {
  console.log('Debug mode enabled');
  // Add verbose logging
}
```

**Frontend Debug:**
```javascript
// frontend/.env
VITE_DEBUG=true

// Add debug logging
if (import.meta.env.VITE_DEBUG) {
  console.log('Debug mode enabled');
}
```

### Logging Configuration

```javascript
// backend/src/utils/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

module.exports = logger;
```

### Health Check Endpoints

```javascript
// backend/src/routes/healthRoutes.js
const router = require('express').Router();
const { sequelize } = require('../models');

router.get('/health', async (req, res) => {
  try {
    // Check database connection
    await sequelize.authenticate();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        memory: process.memoryUsage(),
        uptime: process.uptime()
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

module.exports = router;
```

---

## 📞 Getting Help

### Check Logs First

```bash
# Backend logs
tail -f backend/logs/combined.log
tail -f backend/logs/error.log

# PM2 logs (if using PM2)
pm2 logs chat-backend

# MySQL logs
sudo tail -f /var/log/mysql/error.log

# System logs
journalctl -u mysql
```

### Community Resources

- **GitHub Issues:** Report bugs and feature requests
- **Documentation:** Check API.md and INSTALLATION.md
- **Stack Overflow:** Search for similar issues
- **Vue.js Discord:** For Vue-specific problems
- **Socket.IO Discord:** For real-time communication issues

### Creating Bug Reports

Include the following information:

1. **Environment Details:**
   - OS and version
   - Node.js version
   - MySQL version
   - Browser and version

2. **Steps to Reproduce:**
   - Exact steps taken
   - Expected behavior
   - Actual behavior

3. **Error Messages:**
   - Full error stack traces
   - Console logs
   - Network tab errors

4. **Configuration Files:**
   - Sanitized .env files
   - Package.json dependencies
   - Database schema

---

**Remember: Most issues are configuration-related! Double-check your environment variables and database setup first. 🔍**