# Realtime Chat Application

A modern real-time chat application built with Vue 3, Node.js, Socket.IO, and MySQL. Features include real-time messaging, user authentication, online status indicators, and typing indicators.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │    Database     │
│   (Vue 3)       │◄──►│   (Node.js)     │◄──►│    (MySQL)      │
│                 │    │                 │    │                 │
│ - Vue 3         │    │ - Express.js    │    │ - Users         │
│ - PrimeVue      │    │ - Socket.IO     │    │ - Messages      │
│ - Pinia         │    │ - Sequelize     │    │                 │
│ - Socket.IO     │    │ - JWT Auth      │    │                 │
│ - Vite          │    │ - bcryptjs      │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## ✨ Features

### Phase 1 - Core Features (Current)
- [x] User Authentication (Register/Login/Logout)
- [x] Real-time messaging between users
- [x] Online/Offline user status
- [x] Typing indicators
- [x] Message read receipts
- [x] Responsive design
- [x] Message history
- [x] User list with online status

### Phase 2 - Enhanced Features (Future)
- [ ] Group chat/rooms
- [ ] File/image sharing
- [ ] Message search
- [ ] Push notifications
- [ ] Message encryption
- [ ] User profiles with avatars
- [ ] Message reactions/emojis
- [ ] Voice messages
- [ ] Video calls

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

### Installation

1. **Setup Database**
   ```sql
   CREATE DATABASE realtime_chat;
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env file with your database credentials
   ```

3. **Setup Frontend**
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   # Edit .env file with your API endpoints
   ```

4. **Start the Application**
   
   Backend (Terminal 1):
   ```bash
   cd backend
   npm run dev
   ```
   
   Frontend (Terminal 2):
   ```bash
   cd frontend
   npm run dev
   ```

5. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout (requires auth)
- `GET /api/auth/profile` - Get user profile (requires auth)

### Chat
- `GET /api/chat/users` - Get all users (requires auth)
- `GET /api/chat/history/:receiverId` - Get chat history (requires auth)
- `POST /api/chat/send` - Send message via REST (requires auth)
- `GET /api/chat/unread-count` - Get unread messages count (requires auth)

## 🛡️ Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting
- CORS configuration
- Input validation and sanitization
- SQL injection prevention via Sequelize ORM
- XSS protection with helmet

---

**Built with ❤️ using Vue 3 + Node.js**
