# 📥 Installation Guide

Panduan lengkap untuk menginstall dan menjalankan aplikasi Realtime Chat dari awal hingga selesai.

## 📋 Prerequisites

Pastikan sistem Anda memiliki software berikut:

### Required Software
- **Node.js** (v16.0.0 atau lebih tinggi) - [Download](https://nodejs.org/)
- **MySQL** (v8.0 atau lebih tinggi) - [Download](https://dev.mysql.com/downloads/)
- **Git** - [Download](https://git-scm.com/)

### Optional Tools
- **MySQL Workbench** - GUI untuk management database
- **Postman** - Testing API endpoints
- **VS Code** - Recommended code editor

---

## 🚀 Step-by-Step Installation

### Step 1: Clone Repository

```bash
# Clone the repository
git clone https://github.com/cnyoheadunit/realtime-chat-vue-node.git

# Navigate to project directory
cd realtime-chat-vue-node
```

### Step 2: Setup MySQL Database

#### Option A: Using MySQL Command Line

1. **Start MySQL service:**
```bash
# Windows
net start mysql

# macOS (using Homebrew)
brew services start mysql

# Linux (Ubuntu/Debian)
sudo service mysql start

# or using systemctl
sudo systemctl start mysql
```

2. **Login to MySQL:**
```bash
mysql -u root -p
```

3. **Create database and user:**
```sql
-- Create database
CREATE DATABASE realtime_chat;

-- Create user (optional, atau gunakan root)
CREATE USER 'chat_user'@'localhost' IDENTIFIED BY 'secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON realtime_chat.* TO 'chat_user'@'localhost';
FLUSH PRIVILEGES;

-- Exit MySQL
EXIT;
```

#### Option B: Using MySQL Workbench

1. Open MySQL Workbench
2. Connect to your MySQL server
3. Execute the following SQL:
```sql
CREATE DATABASE realtime_chat;
```

### Step 3: Backend Setup

1. **Navigate to backend directory:**
```bash
cd backend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Create environment file:**
```bash
# Copy example environment file
cp .env.example .env

# Windows
copy .env.example .env
```

4. **Configure environment variables:**
```bash
# Edit .env file
nano .env

# atau menggunakan editor lain
code .env
```

**Contoh konfigurasi `.env`:**
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=realtime_chat
DB_USER=root
# Ganti dengan password MySQL Anda
DB_PASSWORD=your_mysql_password

# JWT Configuration
# Generate secret key yang kuat untuk production
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration
FRONTEND_URL=http://localhost:5173
```

> ⚠️ **Security Note:** Untuk production, gunakan JWT secret yang lebih kuat dan aman!

5. **Test database connection:**
```bash
# Start backend server (akan otomatis create tables)
npm run dev
```

Jika berhasil, Anda akan melihat:
```
✅ Database connection established successfully.
✅ Database synced successfully
🚀 Server is running on port 3000
📡 Socket.IO is ready for connections
```

### Step 4: Frontend Setup

1. **Buka terminal baru dan navigate ke frontend:**
```bash
# Dari root directory
cd frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Create environment file:**
```bash
cp .env.example .env
```

4. **Configure frontend environment:**
```bash
# Edit .env file
nano .env
```

**Contoh konfigurasi frontend `.env`:**
```env
# API Configuration
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000

# App Configuration
VITE_APP_NAME=Realtime Chat
VITE_APP_VERSION=1.0.0
```

5. **Start frontend development server:**
```bash
npm run dev
```

---

## 🖥️ Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Access the Application

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000
- **API Health Check:** http://localhost:3000/api/health

---

## 🧪 Testing the Installation

### 1. Test Backend API

```bash
# Test health endpoint
curl http://localhost:3000/api/health

# Expected response:
{
  "success": true,
  "message": "Server is running!",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 2. Test User Registration

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```

### 3. Test Frontend Access

1. Buka browser dan akses http://localhost:5173
2. Anda akan diarahkan ke halaman login
3. Klik "Sign up here" untuk registrasi
4. Daftarkan 2 user berbeda untuk testing chat

### 4. Test Real-time Chat

1. **Buka 2 browser/tab berbeda**
2. **Login dengan user berbeda di masing-masing tab**
3. **Mulai chatting untuk test real-time functionality**

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Database Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

**Solution:**
- Pastikan MySQL service berjalan
- Check credentials di `.env` file
- Verifikasi database `realtime_chat` sudah dibuat

#### 2. Permission Denied Error
```
Error: Access denied for user 'root'@'localhost'
```

**Solution:**
```bash
# Reset MySQL root password (jika perlu)
sudo mysql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'new_password';
FLUSH PRIVILEGES;
EXIT;
```

#### 3. Port Already in Use
```
Error: listen EADDRINUSE :::3000
```

**Solution:**
```bash
# Find process using port 3000
lsof -ti:3000

# Kill the process
kill -9 <PID>

# atau gunakan port lain di .env
PORT=3001
```

#### 4. Frontend Build Error
```
Error: Cannot resolve dependency
```

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Database Issues

#### Reset Database
Jika ingin reset database dari awal:

```sql
DROP DATABASE realtime_chat;
CREATE DATABASE realtime_chat;
```

Kemudian restart backend server untuk auto-create tables.

#### Check Database Tables
Verifikasi tables telah dibuat dengan benar:

```sql
USE realtime_chat;
SHOW TABLES;
DESCRIBE users;
DESCRIBE messages;
```

---

## 🚀 Production Setup

### Environment Configuration

**Backend `.env` untuk production:**
```env
# Database (gunakan dedicated MySQL server)
DB_HOST=your-production-db-host
DB_PORT=3306
DB_NAME=realtime_chat_prod
DB_USER=chat_user
DB_PASSWORD=secure-production-password

# JWT (gunakan secret yang sangat kuat)
JWT_SECRET=your-super-secure-production-jwt-secret-min-64-characters
JWT_EXPIRES_IN=24h

# Server
PORT=3000
NODE_ENV=production

# CORS (sesuaikan dengan domain production)
FRONTEND_URL=https://your-domain.com
```

**Frontend `.env` untuk production:**
```env
VITE_API_URL=https://api.your-domain.com/api
VITE_SOCKET_URL=https://api.your-domain.com
VITE_APP_NAME=Realtime Chat
VITE_APP_VERSION=1.0.0
```

### Build for Production

**Backend:**
```bash
cd backend
npm install --production
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
# Output akan ada di folder 'dist'
```

---

## 📦 Package Scripts

### Backend Scripts
```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm test           # Run tests (if available)
```

### Frontend Scripts
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run ESLint
```

---

## 🆘 Getting Help

Jika mengalami masalah:

1. **Check logs** - Lihat error messages di terminal
2. **Verify configuration** - Double-check semua environment variables
3. **Database connection** - Test koneksi MySQL secara manual
4. **Port conflicts** - Pastikan port 3000 dan 5173 tidak digunakan
5. **Dependencies** - Pastikan semua npm packages terinstall dengan benar

### Support Channels
- 📧 **Email:** [your-email@example.com]
- 💬 **GitHub Issues:** [Create Issue](https://github.com/cnyoheadunit/realtime-chat-vue-node/issues)
- 📖 **Documentation:** [Project Wiki](https://github.com/cnyoheadunit/realtime-chat-vue-node/wiki)

---

**Selamat! 🎉 Aplikasi Realtime Chat Anda sudah siap digunakan!**