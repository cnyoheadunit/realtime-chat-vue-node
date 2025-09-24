# 🚀 Deployment Guide

Panduan lengkap untuk deploy aplikasi Realtime Chat ke production environment.

## 📋 Overview

Aplikasi ini terdiri dari 3 komponen utama yang perlu di-deploy:
1. **Frontend (Vue 3)** - Static files
2. **Backend (Node.js)** - API server dan Socket.IO
3. **Database (MySQL)** - Data storage

---

## 🏗️ Architecture Options

### Option 1: Single VPS/Server
```
┌─────────────────────────────────────┐
│           VPS/Server                │
│  ┌─────────────┐  ┌─────────────┐   │
│  │   Nginx     │  │   MySQL     │   │
│  │ (Frontend)  │  │ (Database)  │   │
│  └─────────────┘  └─────────────┘   │
│  ┌─────────────────────────────────┐ │
│  │      Node.js Backend            │ │
│  │    (API + Socket.IO)            │ │
│  └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Option 2: Separated Services
```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│    CDN      │  │     VPS     │  │  Database   │
│  (Frontend) │  │  (Backend)  │  │   (MySQL)   │
│             │  │             │  │             │
│  Vercel     │  │  DigitalOcn │  │  AWS RDS    │
│  Netlify    │  │  Heroku     │  │  PlanetScale│
│  GitHub Pgs │  │  Railway    │  │  Supabase   │
└─────────────┘  └─────────────┘  └─────────────┘
```

---

## 🌐 Frontend Deployment

### Deploy ke Vercel (Recommended)

1. **Prepare build:**
```bash
cd frontend
npm run build
```

2. **Install Vercel CLI:**
```bash
npm i -g vercel
```

3. **Deploy:**
```bash
vercel --prod
```

4. **Environment variables di Vercel:**
```env
VITE_API_URL=https://your-backend-domain.com/api
VITE_SOCKET_URL=https://your-backend-domain.com
VITE_APP_NAME=Realtime Chat
VITE_APP_VERSION=1.0.0
```

### Deploy ke Netlify

1. **Build project:**
```bash
cd frontend
npm run build
```

2. **Drag & drop `dist` folder ke Netlify dashboard**

3. **Environment variables:**
   - Go to Site settings → Environment variables
   - Add variables seperti di atas

### Deploy ke GitHub Pages

1. **Install gh-pages:**
```bash
npm install --save-dev gh-pages
```

2. **Add to package.json:**
```json
{
  "scripts": {
    "deploy": "gh-pages -d dist"
  },
  "homepage": "https://username.github.io/realtime-chat-vue-node"
}
```

3. **Deploy:**
```bash
npm run build
npm run deploy
```

---

## 🖥️ Backend Deployment

### Deploy ke Railway (Easy)

1. **Connect GitHub repository ke Railway**
2. **Add environment variables:**
```env
DB_HOST=your-database-host
DB_PORT=3306
DB_NAME=realtime_chat
DB_USER=your-db-user
DB_PASSWORD=your-db-password
JWT_SECRET=your-super-secure-jwt-secret-64-characters-minimum
JWT_EXPIRES_IN=24h
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com
```

3. **Railway akan otomatis build dan deploy**

### Deploy ke Heroku

1. **Install Heroku CLI**
2. **Login dan create app:**
```bash
heroku login
heroku create your-app-name
```

3. **Add environment variables:**
```bash
heroku config:set DB_HOST=your-db-host
heroku config:set DB_PASSWORD=your-db-password
heroku config:set JWT_SECRET=your-jwt-secret
# ... set semua env variables
```

4. **Deploy:**
```bash
git push heroku main
```

### Deploy ke DigitalOcean VPS

1. **Setup VPS dan install dependencies:**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MySQL
sudo apt install mysql-server -y

# Install PM2 for process management
sudo npm install pm2 -g

# Install Nginx
sudo apt install nginx -y
```

2. **Clone repository:**
```bash
git clone https://github.com/username/realtime-chat-vue-node.git
cd realtime-chat-vue-node/backend
npm install --production
```

3. **Setup environment:**
```bash
cp .env.example .env
nano .env
# Configure dengan production values
```

4. **Start dengan PM2:**
```bash
pm2 start src/app.js --name "chat-backend"
pm2 startup
pm2 save
```

5. **Configure Nginx:**
```nginx
# /etc/nginx/sites-available/chat-app
server {
    listen 80;
    server_name your-domain.com;

    # Frontend static files
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Socket.IO
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

6. **Enable site:**
```bash
sudo ln -s /etc/nginx/sites-available/chat-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🗄️ Database Deployment

### Option 1: PlanetScale (Recommended for MySQL)

1. **Create account di PlanetScale**
2. **Create database**
3. **Get connection string**
4. **Update environment variables:**
```env
DB_HOST=your-planetscale-host
DB_USER=your-planetscale-user
DB_PASSWORD=your-planetscale-password
DB_NAME=your-database-name
```

### Option 2: AWS RDS

1. **Create RDS MySQL instance**
2. **Configure security groups**
3. **Update connection string**

### Option 3: Self-hosted MySQL

1. **Setup MySQL di VPS:**
```bash
sudo apt install mysql-server -y
sudo mysql_secure_installation
```

2. **Create database dan user:**
```sql
CREATE DATABASE realtime_chat;
CREATE USER 'chat_user'@'%' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON realtime_chat.* TO 'chat_user'@'%';
FLUSH PRIVILEGES;
```

3. **Configure firewall:**
```bash
sudo ufw allow 3306/tcp
```

---

## 🔒 SSL/HTTPS Setup

### Using Let's Encrypt (Free)

1. **Install Certbot:**
```bash
sudo apt install certbot python3-certbot-nginx -y
```

2. **Get SSL certificate:**
```bash
sudo certbot --nginx -d your-domain.com
```

3. **Auto-renewal:**
```bash
sudo crontab -e
# Add line:
0 12 * * * /usr/bin/certbot renew --quiet
```

### Update Nginx config untuk HTTPS:
```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # ... rest of config
}

server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

---

## 🐳 Docker Deployment

### Docker Compose Setup

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: realtime_chat
      MYSQL_USER: chat_user
      MYSQL_PASSWORD: chatpassword
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql

  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - DB_HOST=mysql
      - DB_USER=chat_user
      - DB_PASSWORD=chatpassword
      - DB_NAME=realtime_chat
      - JWT_SECRET=your-jwt-secret
      - NODE_ENV=production
    depends_on:
      - mysql

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  mysql_data:
```

**Backend Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

**Frontend Dockerfile:**
```dockerfile
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

**Deploy:**
```bash
docker-compose up -d
```

---

## 📊 Monitoring & Logging

### PM2 Monitoring

```bash
# Monitor processes
pm2 monit

# View logs
pm2 logs

# Restart app
pm2 restart chat-backend
```

### Nginx Logs

```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log
```

### Application Logs

Add logging ke backend:
```javascript
// Add to backend/src/app.js
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

---

## 🔧 Production Optimizations

### Backend Optimizations

1. **Enable compression:**
```javascript
const compression = require('compression');
app.use(compression());
```

2. **Set proper headers:**
```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "wss:"]
    }
  }
}));
```

3. **Database optimization:**
```javascript
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  dialect: 'mysql',
  pool: {
    max: 20,
    min: 5,
    acquire: 60000,
    idle: 10000
  },
  logging: false
});
```

### Frontend Optimizations

1. **Build optimizations di vite.config.js:**
```javascript
export default defineConfig({
  build: {
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router', 'pinia'],
          primevue: ['primevue']
        }
      }
    }
  }
});
```

---

## 🚨 Security Checklist

- [ ] **Environment variables** properly set
- [ ] **JWT secret** is strong (64+ characters)
- [ ] **Database** has restricted access
- [ ] **HTTPS** enabled with valid SSL certificate
- [ ] **CORS** configured for specific domains
- [ ] **Rate limiting** enabled
- [ ] **Input validation** implemented
- [ ] **SQL injection** protection via ORM
- [ ] **XSS protection** headers set
- [ ] **Firewall** configured properly

---

## 🔄 CI/CD Pipeline

### GitHub Actions Example

**.github/workflows/deploy.yml:**
```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: |
        cd backend && npm install
        cd ../frontend && npm install
    
    - name: Run tests
      run: |
        cd backend && npm test
        cd ../frontend && npm test
    
    - name: Build frontend
      run: cd frontend && npm run build
    
    - name: Deploy to server
      uses: appleboy/ssh-action@v0.1.4
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          cd /path/to/app
          git pull origin main
          cd backend && npm install --production
          pm2 restart chat-backend
```

---

## 📈 Performance Monitoring

### Tools Recommended

1. **Backend:** New Relic, DataDog, atau Sentry
2. **Frontend:** Google Analytics, Vercel Analytics
3. **Infrastructure:** Uptimerobot, Pingdom
4. **Database:** MySQL Performance Schema

### Key Metrics to Monitor

- Response time < 200ms
- Socket.IO connection success rate > 99%
- Database query time < 100ms
- Memory usage < 80%
- CPU usage < 70%

---

**Deployment berhasil! 🎉 Aplikasi Anda siap melayani users di production!**