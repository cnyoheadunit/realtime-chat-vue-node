# 🧪 Testing Guide

Panduan lengkap untuk testing aplikasi Realtime Chat mulai dari manual testing hingga automated testing.

## 📋 Overview

Aplikasi ini memiliki beberapa layer testing:
1. **Manual Testing** - User acceptance testing
2. **Unit Testing** - Individual component testing  
3. **Integration Testing** - API and Socket.IO testing
4. **End-to-End Testing** - Full workflow testing

---

## 🖱️ Manual Testing

### Prerequisites

1. **Pastikan aplikasi berjalan:**
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend  
cd frontend && npm run dev
```

2. **Akses aplikasi di:**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3000

### Test Scenarios

#### 1. Authentication Testing

**Test Case: User Registration**
1. Buka http://localhost:5173
2. Klik "Sign up here"
3. Input username: `testuser1`
4. Input password: `password123`
5. Klik "Create Account"

**Expected Result:**
- ✅ User berhasil didaftarkan
- ✅ Redirect ke halaman chat
- ✅ Toast notification "Registration Successful"

**Test Case: User Login**
1. Logout dari user sebelumnya
2. Klik "Sign in here"  
3. Input credentials yang benar
4. Klik "Sign In"

**Expected Result:**
- ✅ Login berhasil
- ✅ Redirect ke halaman chat
- ✅ Toast notification "Login Successful"

**Test Case: Invalid Login**
1. Input username yang salah
2. Input password yang salah
3. Klik "Sign In"

**Expected Result:**
- ❌ Error message "Invalid credentials"
- ❌ Tidak redirect

#### 2. Real-time Chat Testing

**Test Case: Two-User Chat**
1. **Setup:**
   - Buka 2 browser berbeda (Chrome & Firefox)
   - Register 2 user berbeda: `user1` dan `user2`

2. **Test Messaging:**
   - Browser 1: Login sebagai `user1`
   - Browser 2: Login sebagai `user2`
   - Browser 1: Klik pada `user2` di sidebar
   - Browser 1: Ketik "Hello from user1" dan send
   - Browser 2: Klik pada `user1` di sidebar

**Expected Result:**
- ✅ Message muncul di kedua browser secara real-time
- ✅ Message tersimpan di database
- ✅ Timestamp ditampilkan dengan benar

#### 3. Online Status Testing

**Test Case: Online/Offline Indicators**
1. Login `user1` di browser 1
2. Login `user2` di browser 2
3. Logout `user2`
4. Refresh browser 1

**Expected Result:**
- ✅ `user2` muncul online saat login
- ✅ `user2` muncul offline saat logout
- ✅ Green badge untuk online, gray untuk offline

#### 4. Typing Indicators

**Test Case: Typing Status**
1. Login 2 users di browser berbeda
2. User 1 mulai mengetik (jangan send)
3. Observe di browser user 2

**Expected Result:**
- ✅ "typing..." indicator muncul
- ✅ Indicator hilang setelah 3 detik tidak ada aktivitas
- ✅ Indicator hilang setelah message dikirim

#### 5. Message Read Receipts

**Test Case: Read Status**
1. User 1 kirim message ke User 2
2. User 2 buka chat dengan User 1
3. Observe di browser User 1

**Expected Result:**
- ✅ Double check mark (✓✓) muncul setelah dibaca
- ✅ Single check saat belum dibaca

#### 6. Responsive Design Testing

**Test Case: Mobile View**
1. Buka developer tools
2. Set device ke mobile (iPhone/Android)
3. Test semua functionality

**Expected Result:**
- ✅ Layout responsive
- ✅ Sidebar collapsible di mobile
- ✅ Touch interactions bekerja
- ✅ Input keyboard tidak overlap content

### Error Scenarios Testing

#### Database Connection Error
1. Stop MySQL service
2. Restart backend
3. Try to access API

**Expected Result:**
- ❌ Backend shows database connection error
- ❌ Frontend shows connection error message

#### Network Disconnection
1. Disconnect internet saat chatting
2. Try to send message
3. Reconnect internet

**Expected Result:**
- ❌ Socket disconnection detected
- ✅ Auto-reconnect when internet back
- ✅ Message queue handled properly

---

## 🔧 Unit Testing

### Backend Unit Tests

**Setup Jest untuk backend:**
```bash
cd backend
npm install --save-dev jest supertest
```

**package.json update:**
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch"
  }
}
```

**Auth Controller Tests:**
```javascript
// tests/authController.test.js
const request = require('supertest');
const app = require('../src/app');

describe('Auth Controller', () => {
  describe('POST /api/auth/register', () => {
    it('should register user with valid data', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          password: 'password123'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.username).toBe('testuser');
      expect(res.body.data.token).toBeDefined();
    });

    it('should reject duplicate username', async () => {
      // First registration
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'duplicate',
          password: 'password123'
        });

      // Second registration with same username
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'duplicate',
          password: 'password456'
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Username already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create user for login tests
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'loginuser',
          password: 'password123'
        });
    });

    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'loginuser',
          password: 'password123'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
    });

    it('should reject invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'loginuser',
          password: 'wrongpassword'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
```

**Chat Controller Tests:**
```javascript
// tests/chatController.test.js
const request = require('supertest');
const app = require('../src/app');

describe('Chat Controller', () => {
  let authToken;
  let userId;

  beforeEach(async () => {
    // Register and login user
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'chatuser',
        password: 'password123'
      });

    authToken = res.body.data.token;
    userId = res.body.data.user.id;
  });

  describe('GET /api/chat/users', () => {
    it('should return users list', async () => {
      const res = await request(app)
        .get('/api/chat/users')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.users)).toBe(true);
    });

    it('should reject without auth token', async () => {
      const res = await request(app)
        .get('/api/chat/users');

      expect(res.status).toBe(401);
    });
  });
});
```

### Frontend Unit Tests

**Setup Vitest untuk frontend:**
```bash
cd frontend
npm install --save-dev vitest @vue/test-utils jsdom
```

**vite.config.js update:**
```javascript
export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom'
  }
});
```

**Auth Store Tests:**
```javascript
// tests/stores/auth.test.js
import { createPinia, setActivePinia } from 'pinia';
import { useAuthStore } from '@/stores/auth';
import { describe, it, expect, beforeEach } from 'vitest';

describe('Auth Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should initialize with correct default state', () => {
    const store = useAuthStore();

    expect(store.user).toBe(null);
    expect(store.token).toBe(null);
    expect(store.loading).toBe(false);
    expect(store.isAuthenticated).toBe(false);
  });

  it('should set user and token on successful login', async () => {
    const store = useAuthStore();
    
    // Mock successful API response
    const mockResponse = {
      success: true,
      data: {
        user: { id: 1, username: 'testuser' },
        token: 'mock-jwt-token'
      }
    };

    // Mock axios
    vi.mock('axios');
    
    const result = await store.login({
      username: 'testuser',
      password: 'password123'
    });

    expect(result.success).toBe(true);
    expect(store.user).toEqual(mockResponse.data.user);
    expect(store.token).toBe(mockResponse.data.token);
    expect(store.isAuthenticated).toBe(true);
  });
});
```

---

## 🔗 Integration Testing

### Socket.IO Testing

**Setup Socket.IO client untuk testing:**
```javascript
// tests/socket.integration.test.js
const Client = require('socket.io-client');
const server = require('../src/app');

describe('Socket.IO Integration', () => {
  let clientSocket;
  let serverSocket;

  beforeAll((done) => {
    server.listen(() => {
      const port = server.address().port;
      clientSocket = new Client(`http://localhost:${port}`, {
        auth: { token: 'valid-jwt-token' }
      });
      
      server.on('connection', (socket) => {
        serverSocket = socket;
      });
      
      clientSocket.on('connect', done);
    });
  });

  afterAll(() => {
    server.close();
    clientSocket.close();
  });

  test('should receive message', (done) => {
    clientSocket.on('receive_message', (message) => {
      expect(message.senderId).toBe(1);
      expect(message.message).toBe('Hello World');
      done();
    });

    serverSocket.emit('receive_message', {
      senderId: 1,
      receiverId: 2,
      message: 'Hello World'
    });
  });

  test('should handle typing indicator', (done) => {
    clientSocket.on('user_typing', (data) => {
      expect(data.userId).toBe(1);
      expect(data.isTyping).toBe(true);
      done();
    });

    clientSocket.emit('typing', {
      receiverId: 2,
      isTyping: true
    });
  });
});
```

### Database Integration Tests

```javascript
// tests/database.integration.test.js
const { User, Message } = require('../src/models');
const sequelize = require('../src/config/db.config');

describe('Database Integration', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('User Model', () => {
    it('should create user with hashed password', async () => {
      const user = await User.create({
        username: 'testuser',
        password: 'plainpassword'
      });

      expect(user.username).toBe('testuser');
      expect(user.password).not.toBe('plainpassword');
      expect(user.password.length).toBeGreaterThan(20);
    });

    it('should validate password correctly', async () => {
      const user = await User.create({
        username: 'testuser2',
        password: 'mypassword'
      });

      const isValid = await user.validatePassword('mypassword');
      const isInvalid = await user.validatePassword('wrongpassword');

      expect(isValid).toBe(true);
      expect(isInvalid).toBe(false);
    });
  });

  describe('Message Model', () => {
    let sender, receiver;

    beforeEach(async () => {
      sender = await User.create({
        username: 'sender',
        password: 'password'
      });

      receiver = await User.create({
        username: 'receiver',
        password: 'password'
      });
    });

    it('should create message with associations', async () => {
      const message = await Message.create({
        senderId: sender.id,
        receiverId: receiver.id,
        message: 'Test message'
      });

      const messageWithUsers = await Message.findByPk(message.id, {
        include: [
          { model: User, as: 'sender' },
          { model: User, as: 'receiver' }
        ]
      });

      expect(messageWithUsers.sender.username).toBe('sender');
      expect(messageWithUsers.receiver.username).toBe('receiver');
    });
  });
});
```

---

## 🎭 End-to-End Testing

### Setup Playwright

```bash
cd frontend
npm install --save-dev @playwright/test
npx playwright install
```

**E2E Test Example:**
```javascript
// tests/e2e/chat.spec.js
const { test, expect } = require('@playwright/test');

test.describe('Chat Application E2E', () => {
  test('complete chat workflow', async ({ browser }) => {
    // Create 2 browser contexts for 2 users
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    // User 1 registration and login
    await page1.goto('http://localhost:5173');
    await page1.click('text=Sign up here');
    await page1.fill('[placeholder="Choose a username"]', 'user1');
    await page1.fill('[placeholder="Create a strong password"]', 'password123');
    await page1.fill('[placeholder="Confirm your password"]', 'password123');
    await page1.click('text=Create Account');
    
    // Wait for redirect to chat
    await expect(page1).toHaveURL(/.*\/chat/);

    // User 2 registration and login
    await page2.goto('http://localhost:5173');
    await page2.click('text=Sign up here');
    await page2.fill('[placeholder="Choose a username"]', 'user2');
    await page2.fill('[placeholder="Create a strong password"]', 'password123');
    await page2.fill('[placeholder="Confirm your password"]', 'password123');
    await page2.click('text=Create Account');
    
    await expect(page2).toHaveURL(/.*\/chat/);

    // User 1 selects User 2 from sidebar
    await page1.click('text=user2');

    // User 1 sends message
    await page1.fill('[placeholder="Type your message..."]', 'Hello User 2!');
    await page1.press('[placeholder="Type your message..."]', 'Enter');

    // User 2 should see the message
    await page2.click('text=user1');
    await expect(page2.locator('text=Hello User 2!')).toBeVisible();

    // User 2 replies
    await page2.fill('[placeholder="Type your message..."]', 'Hi User 1!');
    await page2.press('[placeholder="Type your message..."]', 'Enter');

    // User 1 should see the reply
    await expect(page1.locator('text=Hi User 1!')).toBeVisible();

    await context1.close();
    await context2.close();
  });

  test('typing indicators work correctly', async ({ browser }) => {
    // Similar setup with 2 users
    // Test typing indicator appears when typing
    // Test typing indicator disappears after delay
  });
});
```

---

## 🚀 Performance Testing

### Load Testing dengan Artillery

**Install Artillery:**
```bash
npm install -g artillery
```

**Create load test config:**
```yaml
# load-test.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
  socketio:
    transports: ['websocket']

scenarios:
  - name: "Socket.IO Load Test"
    engine: socketio
    flow:
      - emit:
          channel: "join_chat"
          data:
            receiverId: 1
      - emit:
          channel: "send_message"  
          data:
            receiverId: 1
            message: "Load test message"
```

**Run load test:**
```bash
artillery run load-test.yml
```

### Database Performance Testing

```javascript
// tests/performance/database.test.js
describe('Database Performance', () => {
  test('message query performance', async () => {
    // Create 1000 test messages
    const messages = [];
    for (let i = 0; i < 1000; i++) {
      messages.push({
        senderId: 1,
        receiverId: 2,
        message: `Test message ${i}`
      });
    }
    
    await Message.bulkCreate(messages);

    // Test query performance
    const startTime = Date.now();
    
    const result = await Message.findAll({
      where: { receiverId: 2 },
      limit: 50,
      order: [['created_at', 'DESC']]
    });

    const endTime = Date.now();
    const queryTime = endTime - startTime;

    expect(queryTime).toBeLessThan(100); // Should be under 100ms
    expect(result.length).toBe(50);
  });
});
```

---

## 📊 Test Coverage

### Backend Coverage

```bash
cd backend
npm install --save-dev nyc
```

**package.json update:**
```json
{
  "scripts": {
    "test:coverage": "nyc jest"
  }
}
```

### Frontend Coverage

```bash
cd frontend
npm run test:coverage
```

**Target Coverage:**
- **Lines:** > 80%
- **Functions:** > 80%
- **Branches:** > 70%
- **Statements:** > 80%

---

## 🔍 Testing Checklist

### Before Each Release

#### Functionality Testing
- [ ] User registration works
- [ ] User login/logout works  
- [ ] Real-time messaging works
- [ ] Typing indicators work
- [ ] Online status updates
- [ ] Message read receipts
- [ ] Responsive design works
- [ ] Error handling works

#### Performance Testing
- [ ] Page load < 3 seconds
- [ ] Message delivery < 1 second
- [ ] Database queries < 100ms
- [ ] Memory usage stable
- [ ] No memory leaks

#### Security Testing
- [ ] SQL injection protected
- [ ] XSS protection works
- [ ] JWT tokens secure
- [ ] Rate limiting works
- [ ] Input validation works

#### Browser Compatibility
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile browsers

#### Deployment Testing
- [ ] Production build works
- [ ] Environment variables set
- [ ] Database migrations work
- [ ] SSL certificates valid
- [ ] Domain routing works

---

**Testing is key to quality! 🎯 Make sure to run all tests before deploying.**