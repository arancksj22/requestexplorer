# Postman Clone Backend API

A modular Node.js backend API for the Postman Clone application with MySQL database integration.

## 🏗️ Project Structure

```
Backend/
├── config/
│   └── database.config.js      # Database configuration
├── services/
│   ├── database.service.js     # Database operations (SQL queries)
│   ├── auth.service.js         # Authentication logic (JWT, bcrypt)
│   └── history.service.js      # History business logic
├── routes/
│   ├── auth.routes.js          # Auth endpoints
│   ├── history.routes.js       # History endpoints
│   └── requests.routes.js      # Saved requests endpoints
├── middleware/
│   └── auth.middleware.js      # JWT verification middleware
├── server.js                   # Main Express app
├── package.json
├── .env                        # Environment variables
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- npm or yarn

### Installation

1. **Install dependencies:**
   ```bash
   cd Backend
   npm install
   ```

2. **Configure environment variables:**
   
   Edit the `.env` file with your MySQL credentials:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password_here
   DB_NAME=postman_clone
   PORT=3000
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   ```

3. **Start the server:**
   ```bash
   npm start
   ```
   
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

The server will automatically:
- Create the database if it doesn't exist
- Create all required tables
- Start listening on http://localhost:3000

## 📊 Database Schema

The backend automatically creates the following tables:

### Users Table
```sql
- id (INT, PRIMARY KEY)
- email (VARCHAR, UNIQUE)
- password_hash (VARCHAR)
- name (VARCHAR)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Request History Table
```sql
- id (INT, PRIMARY KEY)
- user_id (INT, FOREIGN KEY)
- url (VARCHAR)
- method (VARCHAR)
- status_code (INT)
- duration_ms (INT)
- request_timestamp (BIGINT)
- created_at (TIMESTAMP)
```

### Saved Requests Table
```sql
- id (INT, PRIMARY KEY)
- user_id (INT, FOREIGN KEY)
- name (VARCHAR)
- url (VARCHAR)
- method (VARCHAR)
- headers (JSON)
- body (JSON)
- folder (VARCHAR)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### User Sessions Table
```sql
- id (INT, PRIMARY KEY)
- user_id (INT, FOREIGN KEY)
- token_hash (VARCHAR)
- expires_at (TIMESTAMP)
- created_at (TIMESTAMP)
```

## 🔌 API Endpoints

### Authentication

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <token>
```

#### Change Password
```http
POST /api/auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "oldPassword": "password123",
  "newPassword": "newpassword123"
}
```

### History

#### Save Request to History
```http
POST /api/history
Authorization: Bearer <token>
Content-Type: application/json

{
  "url": "https://api.example.com/users",
  "method": "GET",
  "status": 200,
  "durationMs": 150,
  "timestamp": 1698432000000
}
```

#### Get Request History
```http
GET /api/history?limit=100&offset=0
Authorization: Bearer <token>
```

#### Get Filtered History
```http
GET /api/history/filter?startDate=1698432000000&method=GET&minStatus=200&maxStatus=299
Authorization: Bearer <token>
```

#### Get History Analytics
```http
GET /api/history/analytics?startDate=1698432000000
Authorization: Bearer <token>
```

#### Clear History
```http
DELETE /api/history
Authorization: Bearer <token>
```

#### Delete Specific History Entry
```http
DELETE /api/history/:id
Authorization: Bearer <token>
```

### Saved Requests

#### Save a Request
```http
POST /api/requests
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Get Users",
  "url": "https://api.example.com/users",
  "method": "GET",
  "headers": { "Content-Type": "application/json" },
  "body": null,
  "folder": "User APIs"
}
```

#### Get All Saved Requests
```http
GET /api/requests
Authorization: Bearer <token>
```

#### Get Saved Requests by Folder
```http
GET /api/requests?folder=User%20APIs
Authorization: Bearer <token>
```

#### Get Single Saved Request
```http
GET /api/requests/:id
Authorization: Bearer <token>
```

#### Update Saved Request
```http
PUT /api/requests/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "url": "https://api.example.com/v2/users"
}
```

#### Delete Saved Request
```http
DELETE /api/requests/:id
Authorization: Bearer <token>
```

#### Get User Folders
```http
GET /api/requests/folders/list
Authorization: Bearer <token>
```

### Health Check

```http
GET /api/health
```

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication:

1. Register or login to receive a JWT token
2. Include the token in subsequent requests:
   ```
   Authorization: Bearer <your_token_here>
   ```
3. Tokens expire after 7 days
4. Sessions are stored in the database and cleaned automatically

## 🛠️ Development

### File Structure Explanation

- **config/** - Configuration files (database connection settings)
- **services/** - Business logic and database operations
  - `database.service.js` - All SQL queries
  - `auth.service.js` - JWT, bcrypt, authentication logic
  - `history.service.js` - History-specific business logic
- **routes/** - API endpoint definitions
- **middleware/** - Express middleware (JWT verification)
- **server.js** - Main Express application setup

### Adding New Features

1. Add database queries to `services/database.service.js`
2. Create business logic in a new service file (e.g., `services/feature.service.js`)
3. Create routes in `routes/feature.routes.js`
4. Register routes in `server.js`

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| DB_HOST | MySQL host | localhost |
| DB_USER | MySQL username | root |
| DB_PASSWORD | MySQL password | (empty) |
| DB_NAME | Database name | postman_clone |
| PORT | Server port | 3000 |
| JWT_SECRET | JWT signing secret | (change in production) |

## 🐛 Troubleshooting

### Database Connection Issues
- Ensure MySQL is running
- Check credentials in `.env`
- Verify MySQL user has necessary permissions

### Port Already in Use
- Change PORT in `.env` file
- Kill process using the port

### JWT Token Issues
- Ensure JWT_SECRET is set in `.env`
- Check token expiration (7 days by default)

## 📄 License

ISC

## 👨‍💻 Author

Postman Clone Backend Team
