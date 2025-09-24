# 🔒 Security Guide

Panduan komprehensif untuk implementasi keamanan dalam aplikasi Realtime Chat, mulai dari development hingga production.

## 🎯 Security Overview

Aplikasi ini mengimplementasikan multiple layers of security:

1. **Authentication & Authorization** - JWT-based access control
2. **Input Validation** - Sanitization dan validation  
3. **Rate Limiting** - Protection terhadap abuse
4. **Data Protection** - Encryption dan secure storage
5. **Network Security** - HTTPS, CORS, CSP
6. **Database Security** - SQL injection prevention
7. **Real-time Security** - Socket.IO authentication

---

## 🔐 Authentication Security

### JWT Implementation

**Current Security Features:**

```javascript
// backend/src/controllers/authController.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Password hashing dengan salt rounds
const hashPassword = async (password) => {
  const saltRounds = 12; // Secure salt rounds
  return await bcrypt.hash(password, saltRounds);
};

// JWT token generation dengan expiration
const generateToken = (userId) => {
  return jwt.sign(
    { userId }, 
    process.env.JWT_SECRET,
    { 
      expiresIn: '7d',  // Token expires in 7 days
      issuer: 'realtime-chat-app',
      audience: 'realtime-chat-users'
    }
  );
};
```

### Enhanced JWT Security

**Recommendations for Production:**

```javascript
// backend/src/utils/auth.js
const crypto = require('crypto');

// Generate secure JWT secret (run once)
const generateJWTSecret = () => {
  return crypto.randomBytes(64).toString('hex');
};

// Implement refresh tokens
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '30d' }
  );
};

// Token blacklist untuk logout
const tokenBlacklist = new Set();

const isTokenBlacklisted = (token) => {
  return tokenBlacklist.has(token);
};

// Enhanced token validation
const verifyToken = (token) => {
  if (isTokenBlacklisted(token)) {
    throw new Error('Token is blacklisted');
  }
  
  return jwt.verify(token, process.env.JWT_SECRET);
};
```

### Secure Password Policy

```javascript
// backend/src/utils/passwordValidator.js
const passwordStrength = require('check-password-strength');

const validatePassword = (password) => {
  const options = {
    id: 0,
    value: "Too weak",
    contains: ["lowercase", "uppercase", "symbol", "number"],
    length: 8
  };
  
  const result = passwordStrength(password, options);
  
  if (result.id < 2) { // Require at least medium strength
    throw new Error('Password too weak. Must contain uppercase, lowercase, number, and symbol');
  }
  
  // Additional checks
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }
  
  if (password.length > 128) {
    throw new Error('Password too long');
  }
  
  return true;
};

// Check for common passwords
const commonPasswords = ['password', '123456', 'qwerty', 'admin'];
const isCommonPassword = (password) => {
  return commonPasswords.some(common => 
    password.toLowerCase().includes(common)
  );
};
```

---

## 🛡️ Input Validation & Sanitization

### Backend Validation

```javascript
// backend/src/middlewares/validation.js
const { body, validationResult } = require('express-validator');
const DOMPurify = require('isomorphic-dompurify');

// User registration validation
const validateRegistration = [
  body('username')
    .isLength({ min: 3, max: 20 })
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username must be 3-20 characters, alphanumeric, underscore, or dash only'),
  
  body('password')
    .isLength({ min: 8, max: 128 })
    .custom((password) => {
      return validatePassword(password);
    }),
    
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];

// Message validation
const validateMessage = [
  body('message')
    .isLength({ min: 1, max: 1000 })
    .trim()
    .custom((message) => {
      // Sanitize HTML
      const clean = DOMPurify.sanitize(message, { ALLOWED_TAGS: [] });
      if (clean !== message) {
        throw new Error('HTML content not allowed');
      }
      return true;
    }),
    
  body('receiverId')
    .isInt({ min: 1 })
    .toInt(),
    
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid message data',
        errors: errors.array()
      });
    }
    next();
  }
];
```

### Frontend Validation

```javascript
// frontend/src/utils/validation.js
export const validateUsername = (username) => {
  const errors = [];
  
  if (!username || username.trim().length < 3) {
    errors.push('Username must be at least 3 characters');
  }
  
  if (username.length > 20) {
    errors.push('Username cannot exceed 20 characters');
  }
  
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    errors.push('Username can only contain letters, numbers, underscore, and dash');
  }
  
  return errors;
};

export const validatePassword = (password) => {
  const errors = [];
  
  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/(?=.*[@$!%*?&])/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return errors;
};

// XSS Protection
export const sanitizeMessage = (message) => {
  return message
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};
```

---

## 🚦 Rate Limiting & DDoS Protection

### API Rate Limiting

```javascript
// backend/src/middlewares/rateLimiter.js
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('redis');

// Redis client for distributed rate limiting
const redisClient = Redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
});

// General API rate limit
const generalLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:general:'
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per 15 minutes
  message: {
    success: false,
    message: 'Too many requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Auth rate limit (stricter)
const authLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:auth:'
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per 15 minutes
  message: {
    success: false,
    message: 'Too many login attempts, please try again later'
  },
  skipSuccessfulRequests: true // Don't count successful logins
});

// Message rate limit
const messageLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:message:'
  }),
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 messages per minute
  message: {
    success: false,
    message: 'Too many messages sent, slow down'
  }
});

module.exports = {
  generalLimiter,
  authLimiter,
  messageLimiter
};
```

### Socket.IO Rate Limiting

```javascript
// backend/src/services/socketRateLimit.js
class SocketRateLimit {
  constructor() {
    this.limits = new Map();
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 1000); // Cleanup every minute
  }

  check(userId, action, maxRequests = 30, windowMs = 60 * 1000) {
    const key = `${userId}_${action}`;
    const now = Date.now();

    if (!this.limits.has(key)) {
      this.limits.set(key, []);
    }

    const requests = this.limits.get(key);
    
    // Remove old requests outside window
    const validRequests = requests.filter(time => now - time < windowMs);
    
    if (validRequests.length >= maxRequests) {
      return false;
    }

    validRequests.push(now);
    this.limits.set(key, validRequests);
    return true;
  }

  cleanup() {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes

    for (const [key, requests] of this.limits.entries()) {
      const validRequests = requests.filter(time => now - time < maxAge);
      
      if (validRequests.length === 0) {
        this.limits.delete(key);
      } else {
        this.limits.set(key, validRequests);
      }
    }
  }

  destroy() {
    clearInterval(this.cleanupInterval);
    this.limits.clear();
  }
}

// Usage in socket handlers
const rateLimiter = new SocketRateLimit();

io.use((socket, next) => {
  // Rate limit socket connections
  const clientIP = socket.handshake.address;
  
  if (!rateLimiter.check(`connection_${clientIP}`, 'connect', 5, 60000)) {
    return next(new Error('Too many connections from this IP'));
  }
  
  next();
});

socket.on('send_message', (data) => {
  const userId = socket.user.id;
  
  if (!rateLimiter.check(userId, 'message', 30, 60000)) {
    socket.emit('rate_limit_exceeded', {
      message: 'Too many messages, slow down'
    });
    return;
  }
  
  // Process message...
});
```

---

## 🔒 Database Security

### SQL Injection Prevention

```javascript
// backend/src/models/Message.js
const { DataTypes, Op } = require('sequelize');

// Always use Sequelize built-in methods
const findMessages = async (senderId, receiverId, limit = 50, offset = 0) => {
  // ✅ SECURE - Using Sequelize ORM
  return await Message.findAll({
    where: {
      [Op.or]: [
        {
          [Op.and]: [
            { senderId: senderId },
            { receiverId: receiverId }
          ]
        },
        {
          [Op.and]: [
            { senderId: receiverId },
            { receiverId: senderId }
          ]
        }
      ]
    },
    order: [['created_at', 'DESC']],
    limit: limit,
    offset: offset,
    include: [
      {
        model: User,
        as: 'sender',
        attributes: ['id', 'username', 'online_status']
      },
      {
        model: User,
        as: 'receiver',
        attributes: ['id', 'username', 'online_status']
      }
    ]
  });
};

// ❌ NEVER do raw queries like this:
// const query = `SELECT * FROM messages WHERE sender_id = ${senderId}`;
// sequelize.query(query); // VULNERABLE TO SQL INJECTION!

// ✅ If you must use raw queries, use parameterized queries:
const getRawMessages = async (senderId, receiverId) => {
  return await sequelize.query(
    'SELECT * FROM messages WHERE (sender_id = :senderId AND receiver_id = :receiverId) OR (sender_id = :receiverId AND receiver_id = :senderId) ORDER BY created_at DESC',
    {
      replacements: { senderId, receiverId },
      type: QueryTypes.SELECT
    }
  );
};
```

### Database Access Control

```sql
-- Create dedicated database user with limited privileges
CREATE USER 'chat_app'@'localhost' IDENTIFIED BY 'secure_random_password_here';

-- Grant only necessary privileges
GRANT SELECT, INSERT, UPDATE, DELETE ON realtime_chat.users TO 'chat_app'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON realtime_chat.messages TO 'chat_app'@'localhost';

-- Do NOT grant these dangerous privileges:
-- GRANT ALL PRIVILEGES - Too broad
-- GRANT CREATE, DROP, ALTER - App shouldn't modify schema
-- GRANT FILE, PROCESS, SUPER - Administrative privileges

FLUSH PRIVILEGES;
```

---

## 🌐 Network Security

### HTTPS Implementation

```javascript
// backend/src/app.js (Production)
const express = require('express');
const https = require('https');
const fs = require('fs');
const helmet = require('helmet');

const app = express();

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "wss:", "ws:"]
    }
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  }
}));

// HTTPS configuration for production
if (process.env.NODE_ENV === 'production') {
  const options = {
    key: fs.readFileSync(process.env.SSL_KEY_PATH),
    cert: fs.readFileSync(process.env.SSL_CERT_PATH)
  };

  const server = https.createServer(options, app);
  
  // Force HTTPS redirect
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}
```

### CORS Security

```javascript
// backend/src/middlewares/cors.js
const cors = require('cors');

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:5173', // Development
      'https://yourapp.com',   // Production
      'https://www.yourapp.com'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization'
  ],
  maxAge: 86400 // 24 hours
};

module.exports = cors(corsOptions);
```

---

## 🔐 Socket.IO Security

### Authentication & Authorization

```javascript
// backend/src/services/socketAuth.js
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return next(new Error('Authentication required'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId);
    
    if (!user) {
      return next(new Error('User not found'));
    }

    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication failed'));
  }
};

// Namespace-based authorization
const authorizeNamespace = (requiredRole) => {
  return (socket, next) => {
    if (socket.user.role !== requiredRole) {
      return next(new Error('Insufficient permissions'));
    }
    next();
  };
};

module.exports = {
  authenticateSocket,
  authorizeNamespace
};
```

### Message Validation

```javascript
// backend/src/services/socketValidation.js
const validator = require('validator');

const validateMessageData = (data) => {
  const errors = [];
  
  // Validate receiver ID
  if (!data.receiverId || !Number.isInteger(data.receiverId) || data.receiverId < 1) {
    errors.push('Invalid receiver ID');
  }
  
  // Validate message content
  if (!data.message || typeof data.message !== 'string') {
    errors.push('Message is required');
  }
  
  if (data.message && data.message.length > 1000) {
    errors.push('Message too long');
  }
  
  // Sanitize message
  if (data.message) {
    data.message = validator.escape(data.message.trim());
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    data
  };
};

// Usage in socket handlers
socket.on('send_message', (data) => {
  const validation = validateMessageData(data);
  
  if (!validation.isValid) {
    socket.emit('validation_error', {
      message: 'Invalid message data',
      errors: validation.errors
    });
    return;
  }
  
  // Process validated message...
});
```

---

## 🛡️ Frontend Security

### XSS Prevention

```javascript
// frontend/src/utils/security.js
export const sanitizeHTML = (str) => {
  const temp = document.createElement('div');
  temp.textContent = str;
  return temp.innerHTML;
};

export const sanitizeMessage = (message) => {
  // Remove all HTML tags and escape special characters
  return message
    .replace(/<[^>]*>/g, '')  // Remove HTML tags
    .replace(/&/g, '&amp;')   // Escape ampersand
    .replace(/</g, '&lt;')    // Escape less than
    .replace(/>/g, '&gt;')    // Escape greater than
    .replace(/"/g, '&quot;')  // Escape quotes
    .replace(/'/g, '&#x27;')  // Escape apostrophe
    .replace(/\//g, '&#x2F;'); // Escape forward slash
};

// Safe message rendering
export const renderMessage = (message) => {
  const sanitized = sanitizeMessage(message);
  
  // Optional: Allow basic formatting with whitelist approach
  return sanitized
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')  // Bold
    .replace(/\*(.*?)\*/g, '<em>$1</em>')              // Italic
    .replace(/`(.*?)`/g, '<code>$1</code>');           // Code
};
```

### Content Security Policy

```html
<!-- frontend/index.html -->
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <link rel="icon" type="image/svg+xml" href="/vite.svg" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  
  <!-- Content Security Policy -->
  <meta http-equiv="Content-Security-Policy" content="
    default-src 'self';
    script-src 'self' 'unsafe-eval';
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com;
    img-src 'self' data: https:;
    connect-src 'self' ws: wss:;
    media-src 'none';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
  ">
  
  <!-- Additional security headers -->
  <meta http-equiv="X-Content-Type-Options" content="nosniff">
  <meta http-equiv="X-Frame-Options" content="DENY">
  <meta http-equiv="X-XSS-Protection" content="1; mode=block">
  
  <title>Realtime Chat</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

### Secure Storage

```javascript
// frontend/src/utils/secureStorage.js
class SecureStorage {
  constructor() {
    this.keyPrefix = 'rtc_';
  }

  // Encrypt data before storing (optional, for sensitive data)
  encrypt(data, key) {
    // Simple encryption - in production, use proper crypto library
    return btoa(JSON.stringify(data));
  }

  decrypt(encryptedData, key) {
    try {
      return JSON.parse(atob(encryptedData));
    } catch (error) {
      console.error('Failed to decrypt data:', error);
      return null;
    }
  }

  setItem(key, value, encrypt = false) {
    try {
      const fullKey = this.keyPrefix + key;
      const dataToStore = encrypt ? this.encrypt(value) : JSON.stringify(value);
      localStorage.setItem(fullKey, dataToStore);
    } catch (error) {
      console.error('Failed to store data:', error);
    }
  }

  getItem(key, decrypt = false) {
    try {
      const fullKey = this.keyPrefix + key;
      const data = localStorage.getItem(fullKey);
      
      if (!data) return null;
      
      return decrypt ? this.decrypt(data) : JSON.parse(data);
    } catch (error) {
      console.error('Failed to retrieve data:', error);
      return null;
    }
  }

  removeItem(key) {
    const fullKey = this.keyPrefix + key;
    localStorage.removeItem(fullKey);
  }

  clear() {
    // Only clear our app's data
    Object.keys(localStorage)
      .filter(key => key.startsWith(this.keyPrefix))
      .forEach(key => localStorage.removeItem(key));
  }
}

export const secureStorage = new SecureStorage();

// Usage
// secureStorage.setItem('auth_token', token);
// const token = secureStorage.getItem('auth_token');
```

---

## 🔍 Security Monitoring

### Logging Security Events

```javascript
// backend/src/utils/securityLogger.js
const winston = require('winston');

const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: 'logs/security.log',
      level: 'warn' 
    }),
    new winston.transports.File({ 
      filename: 'logs/security-error.log',
      level: 'error' 
    })
  ]
});

// Log security events
const logSecurityEvent = (eventType, details, req = null) => {
  const logData = {
    eventType,
    timestamp: new Date().toISOString(),
    ...details
  };

  if (req) {
    logData.ip = req.ip || req.connection.remoteAddress;
    logData.userAgent = req.headers['user-agent'];
    logData.userId = req.user?.id;
  }

  securityLogger.warn('Security Event', logData);
};

// Usage examples
logSecurityEvent('FAILED_LOGIN_ATTEMPT', { username, reason: 'Invalid password' }, req);
logSecurityEvent('RATE_LIMIT_EXCEEDED', { endpoint: '/api/auth/login', attempts }, req);
logSecurityEvent('SUSPICIOUS_ACTIVITY', { action: 'Multiple accounts from same IP' }, req);

module.exports = { logSecurityEvent };
```

### Intrusion Detection

```javascript
// backend/src/middlewares/intrusionDetection.js
const suspiciousActivity = new Map();

const detectIntrusion = (req, res, next) => {
  const clientIP = req.ip;
  const now = Date.now();
  const windowMs = 5 * 60 * 1000; // 5 minutes
  
  if (!suspiciousActivity.has(clientIP)) {
    suspiciousActivity.set(clientIP, {
      failedAttempts: 0,
      lastAttempt: now,
      blocked: false
    });
  }
  
  const activity = suspiciousActivity.get(clientIP);
  
  // Check if IP is blocked
  if (activity.blocked && (now - activity.lastAttempt) < windowMs * 6) {
    return res.status(429).json({
      success: false,
      message: 'IP temporarily blocked due to suspicious activity'
    });
  }
  
  // Reset block after time window
  if (activity.blocked && (now - activity.lastAttempt) >= windowMs * 6) {
    activity.blocked = false;
    activity.failedAttempts = 0;
  }
  
  next();
};

// Track failed attempts
const trackFailedAttempt = (req) => {
  const clientIP = req.ip;
  const activity = suspiciousActivity.get(clientIP);
  
  if (activity) {
    activity.failedAttempts++;
    activity.lastAttempt = Date.now();
    
    // Block IP after 10 failed attempts
    if (activity.failedAttempts >= 10) {
      activity.blocked = true;
      logSecurityEvent('IP_BLOCKED', { 
        ip: clientIP, 
        attempts: activity.failedAttempts 
      });
    }
  }
};

module.exports = { detectIntrusion, trackFailedAttempt };
```

---

## 🚨 Security Checklist

### Development Phase

- [ ] **Authentication**
  - [ ] Strong password requirements implemented
  - [ ] JWT tokens have expiration
  - [ ] Refresh token mechanism in place
  - [ ] Password hashing with bcrypt (salt rounds ≥ 10)

- [ ] **Input Validation**  
  - [ ] All user inputs validated on backend
  - [ ] SQL injection prevention with ORM
  - [ ] XSS protection with input sanitization
  - [ ] File upload restrictions (if applicable)

- [ ] **Rate Limiting**
  - [ ] API rate limiting implemented
  - [ ] Socket.IO rate limiting implemented  
  - [ ] Different limits for different endpoints
  - [ ] Rate limiting uses distributed store (Redis)

- [ ] **Network Security**
  - [ ] CORS properly configured
  - [ ] Security headers implemented (Helmet.js)
  - [ ] Content Security Policy configured
  - [ ] HTTPS enforced in production

### Production Deployment

- [ ] **Environment Security**
  - [ ] Environment variables for all secrets
  - [ ] No hardcoded passwords or tokens
  - [ ] Database user has minimal privileges
  - [ ] SSL/TLS certificates valid and auto-renewing

- [ ] **Monitoring & Logging**
  - [ ] Security event logging implemented
  - [ ] Failed login attempt tracking
  - [ ] Suspicious activity detection
  - [ ] Log rotation configured

- [ ] **Database Security**
  - [ ] Database firewall configured
  - [ ] Regular backups automated
  - [ ] Database user permissions minimized
  - [ ] Connection encryption enabled

- [ ] **Application Security**
  - [ ] Dependencies regularly updated
  - [ ] Security vulnerability scanning
  - [ ] Regular penetration testing
  - [ ] Incident response plan documented

### Security Testing

- [ ] **Automated Testing**
  - [ ] OWASP ZAP security scanning
  - [ ] Dependency vulnerability checking
  - [ ] Static code analysis (SonarQube)
  - [ ] Authentication and authorization testing

- [ ] **Manual Testing**
  - [ ] SQL injection testing
  - [ ] XSS payload testing  
  - [ ] CSRF protection testing
  - [ ] Rate limiting verification
  - [ ] Session management testing

---

## 📞 Security Incident Response

### Incident Detection

```javascript
// backend/src/utils/incidentResponse.js
const alerting = require('./alerting'); // Email/Slack notifications

const securityIncidents = {
  MULTIPLE_FAILED_LOGINS: {
    threshold: 5,
    timeWindow: 300000, // 5 minutes
    severity: 'medium'
  },
  
  RATE_LIMIT_EXCEEDED: {
    threshold: 3,
    timeWindow: 300000,
    severity: 'high'
  },
  
  SQL_INJECTION_ATTEMPT: {
    threshold: 1,
    timeWindow: 0,
    severity: 'critical'
  }
};

const handleSecurityIncident = async (type, details) => {
  const incident = securityIncidents[type];
  
  if (!incident) return;
  
  // Log incident
  securityLogger.error('Security Incident Detected', {
    type,
    severity: incident.severity,
    details,
    timestamp: new Date().toISOString()
  });
  
  // Send alerts based on severity
  if (incident.severity === 'critical') {
    await alerting.sendUrgentAlert(`CRITICAL: ${type}`, details);
  } else if (incident.severity === 'high') {
    await alerting.sendHighPriorityAlert(`HIGH: ${type}`, details);
  }
  
  // Automatic mitigation actions
  await triggerMitigation(type, details);
};

const triggerMitigation = async (type, details) => {
  switch (type) {
    case 'RATE_LIMIT_EXCEEDED':
      // Temporarily block IP
      await blockIP(details.ip, 3600000); // 1 hour
      break;
      
    case 'SQL_INJECTION_ATTEMPT':
      // Immediate IP block
      await blockIP(details.ip, 86400000); // 24 hours
      break;
  }
};
```

### Emergency Procedures

1. **Suspected Breach:**
   ```bash
   # Immediately rotate secrets
   openssl rand -hex 32 > new_jwt_secret
   
   # Invalidate all tokens
   redis-cli FLUSHDB
   
   # Block suspicious IPs
   ufw insert 1 deny from SUSPICIOUS_IP
   ```

2. **Database Compromise:**
   ```bash
   # Change database passwords
   mysql -u root -p -e "ALTER USER 'chat_app'@'localhost' IDENTIFIED BY 'new_secure_password';"
   
   # Check for unauthorized changes
   mysql -u root -p -e "SELECT * FROM information_schema.user_privileges;"
   ```

3. **Application Recovery:**
   ```bash
   # Deploy security patches
   git pull origin main
   npm install
   npm run build
   pm2 restart all
   
   # Verify security measures
   npm audit
   npm run test:security
   ```

---

**Security is an ongoing process, not a one-time setup! 🔒 Regularly review and update security measures.**