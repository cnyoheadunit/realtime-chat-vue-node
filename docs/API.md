# 🔌 API Documentation

Dokumentasi lengkap untuk RESTful API dan Socket.IO events dari aplikasi Realtime Chat.

## Base URL
```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

---

## 🔐 Authentication

### Register User
Mendaftarkan user baru ke sistem.

**Endpoint:** `POST /auth/register`

**Request Body:**
```json
{
  "username": "john_doe",
  "password": "securepassword123"
}
```

**Validation Rules:**
- `username`: Required, 3-100 karakter, unik
- `password`: Required, minimal 6 karakter

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "username": "john_doe",
      "created_at": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**
```json
// Username sudah ada (409)
{
  "success": false,
  "message": "Username already exists"
}

// Validation error (400)
{
  "success": false,
  "message": "Username and password are required"
}

// Password terlalu pendek (400)
{
  "success": false,
  "message": "Password must be at least 6 characters long"
}
```

### Login User
Autentikasi user dengan username dan password.

**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "username": "john_doe",
  "password": "securepassword123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "username": "john_doe",
      "isOnline": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

### Get User Profile
Mendapatkan informasi profil user yang sedang login.

**Endpoint:** `GET /auth/profile`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "john_doe",
      "isOnline": true,
      "lastSeen": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### Logout User
Logout user dan update status offline.

**Endpoint:** `POST /auth/logout`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

## 💬 Chat API

### Get Users List
Mendapatkan daftar semua user (kecuali user yang sedang login).

**Endpoint:** `GET /chat/users`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 2,
        "username": "jane_doe",
        "isOnline": true,
        "lastSeen": "2024-01-01T00:00:00.000Z"
      },
      {
        "id": 3,
        "username": "bob_smith",
        "isOnline": false,
        "lastSeen": "2024-01-01T12:30:00.000Z"
      }
    ]
  }
}
```

### Get Chat History
Mendapatkan riwayat chat antara user yang login dengan user lain.

**Endpoint:** `GET /chat/history/:receiverId`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `page` (optional): Halaman data (default: 1)
- `limit` (optional): Jumlah pesan per halaman (default: 50)

**Example:** `GET /chat/history/2?page=1&limit=20`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": 1,
        "senderId": 1,
        "receiverId": 2,
        "message": "Hello Jane!",
        "messageType": "text",
        "isRead": true,
        "created_at": "2024-01-01T10:00:00.000Z",
        "sender": {
          "id": 1,
          "username": "john_doe"
        },
        "receiver": {
          "id": 2,
          "username": "jane_doe"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalMessages": 87,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

### Send Message (REST)
Mengirim pesan melalui REST API (backup untuk Socket.IO).

**Endpoint:** `POST /chat/send`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "receiverId": 2,
  "message": "Hello from REST API!"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "message": {
      "id": 15,
      "senderId": 1,
      "receiverId": 2,
      "message": "Hello from REST API!",
      "messageType": "text",
      "isRead": false,
      "created_at": "2024-01-01T15:30:00.000Z",
      "sender": {
        "id": 1,
        "username": "john_doe"
      },
      "receiver": {
        "id": 2,
        "username": "jane_doe"
      }
    }
  }
}
```

### Get Unread Messages Count
Mendapatkan jumlah pesan yang belum dibaca.

**Endpoint:** `GET /chat/unread-count`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "unreadCount": 5
  }
}
```

---

## ⚡ Socket.IO Events

### Client Authentication
Sebelum menggunakan Socket.IO events, client harus autentikasi dengan JWT token.

**Socket Connection:**
```javascript
const socket = io('http://localhost:3000', {
  auth: {
    token: 'your_jwt_token_here'
  }
});
```

### Client to Server Events

#### join_chat
Bergabung ke room chat privat dengan user tertentu.

**Event:** `join_chat`
**Data:**
```json
{
  "receiverId": 2
}
```

#### leave_chat
Meninggalkan room chat privat.

**Event:** `leave_chat`
**Data:**
```json
{
  "receiverId": 2
}
```

#### send_message
Mengirim pesan real-time.

**Event:** `send_message`
**Data:**
```json
{
  "receiverId": 2,
  "message": "Hello Jane! How are you?"
}
```

#### typing
Mengirim indikator sedang mengetik.

**Event:** `typing`
**Data:**
```json
{
  "receiverId": 2,
  "isTyping": true
}
```

#### mark_messages_read
Menandai pesan sebagai sudah dibaca.

**Event:** `mark_messages_read`
**Data:**
```json
{
  "senderId": 2
}
```

#### user_logout
Manual disconnect dari server.

**Event:** `user_logout`
**Data:** (none)

### Server to Client Events

#### connect
Konfirmasi koneksi berhasil.

**Event:** `connect`
**Data:** (none)

#### disconnect
Notifikasi disconnection.

**Event:** `disconnect`
**Data:** (none)

#### receive_message
Menerima pesan baru.

**Event:** `receive_message`
**Data:**
```json
{
  "id": 15,
  "senderId": 2,
  "receiverId": 1,
  "message": "Hi John! I'm doing great!",
  "messageType": "text",
  "isRead": false,
  "created_at": "2024-01-01T15:35:00.000Z",
  "sender": {
    "id": 2,
    "username": "jane_doe"
  },
  "receiver": {
    "id": 1,
    "username": "john_doe"
  }
}
```

#### users_online
Daftar user yang sedang online.

**Event:** `users_online`
**Data:**
```json
[
  {
    "id": 1,
    "username": "john_doe"
  },
  {
    "id": 2,
    "username": "jane_doe"
  }
]
```

#### user_typing
Notifikasi user sedang mengetik.

**Event:** `user_typing`
**Data:**
```json
{
  "userId": 2,
  "username": "jane_doe",
  "isTyping": true
}
```

#### new_message_notification
Notifikasi pesan baru (untuk user yang tidak sedang di chat room).

**Event:** `new_message_notification`
**Data:**
```json
{
  "from": "jane_doe",
  "message": "Hi John!",
  "senderId": 2
}
```

#### messages_read
Konfirmasi pesan sudah dibaca.

**Event:** `messages_read`
**Data:**
```json
{
  "readBy": 2,
  "readByUsername": "jane_doe"
}
```

#### error
Error dari server.

**Event:** `error`
**Data:**
```json
{
  "message": "Error description"
}
```

---

## 🛡️ Authentication & Security

### JWT Token
- **Algorithm:** HS256
- **Expiry:** 7 days (configurable)
- **Header format:** `Authorization: Bearer <token>`

### Rate Limiting
- **Window:** 15 minutes
- **Max requests:** 100 per IP
- **Response:** 429 Too Many Requests

### CORS Policy
- **Allowed origins:** Frontend URL only
- **Credentials:** Supported
- **Methods:** GET, POST, PUT, DELETE

### Input Validation
- **Username:** 3-100 characters, alphanumeric + underscore
- **Password:** 6-255 characters
- **Message:** 1-1000 characters, not empty

---

## 🧪 Testing Examples

### cURL Examples

**Register:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "password123"}'
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "password123"}'
```

**Get Profile:**
```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Send Message:**
```bash
curl -X POST http://localhost:3000/api/chat/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"receiverId": 2, "message": "Hello World!"}'
```

### JavaScript Examples

**Socket.IO Client:**
```javascript
// Connect
const socket = io('http://localhost:3000', {
  auth: { token: localStorage.getItem('token') }
});

// Join chat
socket.emit('join_chat', { receiverId: 2 });

// Send message
socket.emit('send_message', {
  receiverId: 2,
  message: 'Hello!'
});

// Listen for messages
socket.on('receive_message', (message) => {
  console.log('New message:', message);
});

// Listen for online users
socket.on('users_online', (users) => {
  console.log('Online users:', users);
});
```

---

## 📊 Response Status Codes

| Code | Description |
|------|-------------|
| 200  | OK - Success |
| 201  | Created - Resource created |
| 400  | Bad Request - Invalid input |
| 401  | Unauthorized - Invalid/missing token |
| 404  | Not Found - Resource not found |
| 409  | Conflict - Resource already exists |
| 429  | Too Many Requests - Rate limited |
| 500  | Internal Server Error |

---

## 🔄 Error Handling

All API responses follow consistent format:

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description"
}
```

---

**Happy coding! 🚀**