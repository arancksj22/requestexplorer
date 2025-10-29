# Postman Clone - Full Stack Setup Guide

## 🚀 Quick Start

### Prerequisites
- Node.js (v16+)
- MySQL Server
- Angular CLI (`npm install -g @angular/cli`)

### 1. Database Setup

Run this SQL in MySQL Workbench:

```sql
CREATE DATABASE IF NOT EXISTS postman;
USE postman;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS request_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  url VARCHAR(2048) NOT NULL,
  method VARCHAR(10) NOT NULL,
  status_code INT NOT NULL,
  duration_ms INT NOT NULL,
  request_timestamp BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_timestamp (user_id, request_timestamp),
  INDEX idx_method (method),
  INDEX idx_status (status_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS saved_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  url VARCHAR(2048) NOT NULL,
  method VARCHAR(10) NOT NULL,
  headers JSON,
  body JSON,
  folder VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_folder (user_id, folder)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (token_hash),
  INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2. Backend Setup

```bash
cd Backend

# Configure .env file (already created)
# Make sure DB credentials match your MySQL setup

# Install dependencies (if not done)
npm install

# Start backend server
npm run dev
```

Backend will run on: **http://localhost:3000**

### 3. Frontend Setup

```bash
cd Frontend

# Install dependencies
npm install

# Start Angular dev server
ng serve
```

Frontend will run on: **http://localhost:4200**

## 📝 How to Test

1. **Register a new account**
   - Go to http://localhost:4200/register
   - Fill in name, email, password
   - Click "Sign Up"
   - You'll be redirected to dashboard

2. **Login**
   - Go to http://localhost:4200/login
   - Enter registered email and password
   - Click "Sign In"

3. **Test API Requests**
   - Go to dashboard or API tester
   - Make an API request (e.g., GET https://jsonplaceholder.typicode.com/todos/1)
   - Request will be saved to MySQL database

4. **View History**
   - Go to History page
   - See all your saved requests from database
   - Can delete individual entries or clear all

## 🔧 Troubleshooting

### Backend won't start
- Check MySQL is running
- Verify `.env` credentials match your MySQL
- Check port 3000 is not in use

### Frontend errors
- Make sure you ran `npm install` in Frontend folder
- Clear browser cache/localStorage
- Try `ng serve --open`

### Database connection errors
```bash
# Verify MySQL is running
mysql -u root -p

# Check database exists
SHOW DATABASES;

# Verify credentials in Backend/.env
```

### CORS errors
- Backend already has CORS enabled
- Make sure backend is running on port 3000
- Check browser console for specific error

## 🔐 Security Notes

⚠️ **Important**: Change `JWT_SECRET` in `.env` before production!

Generate a secure secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/verify` - Verify token

### History
- `POST /api/history` - Save request
- `GET /api/history` - Get all requests
- `DELETE /api/history` - Clear all
- `DELETE /api/history/:id` - Delete one

### Health Check
- `GET /api/health` - Check server status

## 🎯 Features

✅ User authentication with JWT
✅ Request history tracking in MySQL
✅ Automatic token injection
✅ Fallback to localStorage if offline
✅ Error handling and validation
✅ Secure password hashing
✅ Session management

## 📁 Project Structure

```
postman-angular/
├── Backend/
│   ├── config/         # Database config
│   ├── middleware/     # Auth middleware
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── .env           # Environment variables
│   └── server.js       # Entry point
│
└── Frontend/
    └── src/
        └── app/
            ├── features/     # API tester, history
            ├── pages/        # Login, register, etc.
            ├── services/     # Auth, HTTP services
            └── interceptors/ # HTTP interceptor
```

## 🤝 Contributing

Feel free to submit issues and enhancement requests!
