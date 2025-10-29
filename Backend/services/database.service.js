const mysql = require('mysql2/promise');
const dbConfig = require('../config/database.config');

class DatabaseService {
  constructor() {
    this.pool = null;
  }

  async connect() {
    try {
      this.pool = mysql.createPool(dbConfig);
      console.log('Database connection pool created');
      
      const connection = await this.pool.getConnection();
      console.log('Database connected successfully');
      connection.release();
    } catch (error) {
      console.error('Database connection failed:', error.message);
      throw error;
    }
  }

  async createDatabase() {
    try {
      const tempPool = mysql.createPool({
        host: dbConfig.host,
        user: dbConfig.user,
        password: dbConfig.password
      });

      await tempPool.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
      console.log('Database created/verified');
      
      await tempPool.end();
    } catch (error) {
      console.error('Database creation failed:', error.message);
      throw error;
    }
  }

  async createTables() {
    try {
      await this.pool.execute(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          name VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_email (email)
        )
      `);
      console.log('Users table created/verified');

      await this.pool.execute(`
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
        )
      `);
      console.log('Request history table created/verified');

      await this.pool.execute(`
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
        )
      `);
      console.log('Saved requests table created/verified');

      await this.pool.execute(`
        CREATE TABLE IF NOT EXISTS user_sessions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          token_hash VARCHAR(255) NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_token (token_hash),
          INDEX idx_user (user_id)
        )
      `);
      console.log('User sessions table created/verified');

    } catch (error) {
      console.error('Table creation failed:', error.message);
      throw error;
    }
  }

  async createGuestUser() {
    try {
      // Check if guest user exists
      const [users] = await this.pool.execute(
        'SELECT id FROM users WHERE email = ?',
        ['guest@localhost']
      );
      
      if (users.length === 0) {
        // Create guest user with id = 1
        await this.pool.execute(
          'INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)',
          [1, 'guest@localhost', 'no-password', 'Guest User']
        );
        console.log('Guest user created');
      } else {
        console.log('Guest user already exists');
      }
    } catch (error) {
      console.error('Guest user creation failed:', error.message);
    }
  }

  async initialize() {
    await this.createDatabase();
    await this.connect();
    await this.createTables();
    await this.createGuestUser();
    console.log('Database initialization complete');
  }

  // ==================== USER QUERIES ====================

  async createUser(email, passwordHash, name) {
    const [result] = await this.pool.execute(
      'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)',
      [email, passwordHash, name]
    );
    return { userId: result.insertId };
  }

  async findUserByEmail(email) {
    const [users] = await this.pool.execute(
      'SELECT id, email, password_hash, name, created_at FROM users WHERE email = ?',
      [email]
    );
    return users[0] || null;
  }

  async findUserById(userId) {
    const [users] = await this.pool.execute(
      'SELECT id, email, name, created_at FROM users WHERE id = ?',
      [userId]
    );
    return users[0] || null;
  }

  async updateUser(userId, updates) {
    const fields = [];
    const values = [];
    
    if (updates.name) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.password_hash) {
      fields.push('password_hash = ?');
      values.push(updates.password_hash);
    }
    
    if (fields.length === 0) return false;
    
    values.push(userId);
    
    await this.pool.execute(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return true;
  }

  async deleteUser(userId) {
    await this.pool.execute('DELETE FROM users WHERE id = ?', [userId]);
    return true;
  }

  // ==================== SESSION QUERIES ====================

  async createSession(userId, tokenHash, expiresAt) {
    const [result] = await this.pool.execute(
      'INSERT INTO user_sessions (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
      [userId, tokenHash, expiresAt]
    );
    return { sessionId: result.insertId };
  }

  async findSession(tokenHash) {
    const [sessions] = await this.pool.execute(
      'SELECT id, user_id, expires_at FROM user_sessions WHERE token_hash = ? AND expires_at > NOW()',
      [tokenHash]
    );
    return sessions[0] || null;
  }

  async deleteSession(tokenHash) {
    await this.pool.execute('DELETE FROM user_sessions WHERE token_hash = ?', [tokenHash]);
    return true;
  }

  async deleteUserSessions(userId) {
    await this.pool.execute('DELETE FROM user_sessions WHERE user_id = ?', [userId]);
    return true;
  }

  async cleanExpiredSessions() {
    const [result] = await this.pool.execute('DELETE FROM user_sessions WHERE expires_at < NOW()');
    return result.affectedRows;
  }

  // ==================== HISTORY QUERIES ====================

  async saveRequestHistory(userId, url, method, statusCode, durationMs, timestamp) {
    const [result] = await this.pool.execute(
      'INSERT INTO request_history (user_id, url, method, status_code, duration_ms, request_timestamp) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, url, method, statusCode, durationMs, timestamp]
    );
    return { historyId: result.insertId };
  }

  async getRequestHistory(userId, limit = 1000, offset = 0) {
    try {
      // Ensure all parameters are the correct type
      const userIdInt = parseInt(userId);
      const limitInt = parseInt(limit);
      const offsetInt = parseInt(offset);
      
      console.log('🔍 Fetching history for userId:', userIdInt, 'limit:', limitInt, 'offset:', offsetInt);
      
      // Use query() instead of execute() for LIMIT/OFFSET as they don't work with prepared statements
      const [rows] = await this.pool.query(
        `SELECT id, url, method, status_code as status, duration_ms as durationMs, request_timestamp as ts, created_at
        FROM request_history 
        WHERE user_id = ? 
        ORDER BY request_timestamp DESC 
        LIMIT ${limitInt} OFFSET ${offsetInt}`,
        [userIdInt]
      );
      console.log('Found', rows.length, 'history records');
      return rows;
    } catch (error) {
      console.error('Error fetching history:', error);
      throw error;
    }
  }

  async getFilteredHistory(userId, filters = {}) {
    let query = 'SELECT id, url, method, status_code as status, duration_ms as durationMs, request_timestamp as ts FROM request_history WHERE user_id = ?';
    const params = [userId];

    if (filters.startDate) {
      query += ' AND request_timestamp >= ?';
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      query += ' AND request_timestamp <= ?';
      params.push(filters.endDate);
    }
    if (filters.method) {
      query += ' AND method = ?';
      params.push(filters.method);
    }
    if (filters.minStatus) {
      query += ' AND status_code >= ?';
      params.push(filters.minStatus);
    }
    if (filters.maxStatus) {
      query += ' AND status_code <= ?';
      params.push(filters.maxStatus);
    }

    query += ' ORDER BY request_timestamp DESC LIMIT 1000';
    const [rows] = await this.pool.execute(query, params);
    return rows;
  }

  async clearHistory(userId) {
    await this.pool.execute('DELETE FROM request_history WHERE user_id = ?', [userId]);
    return true;
  }

  async deleteHistoryEntry(userId, historyId) {
    const [result] = await this.pool.execute(
      'DELETE FROM request_history WHERE id = ? AND user_id = ?',
      [historyId, userId]
    );
    return result.affectedRows > 0;
  }

  async getHistoryAnalytics(userId, startDate = 0) {
    const [rows] = await this.pool.execute(
      `SELECT 
        COUNT(*) as totalRequests,
        AVG(duration_ms) as avgDuration,
        MIN(duration_ms) as minDuration,
        MAX(duration_ms) as maxDuration,
        SUM(CASE WHEN status_code >= 200 AND status_code < 300 THEN 1 ELSE 0 END) as successCount,
        SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) as errorCount,
        method
      FROM request_history 
      WHERE user_id = ? AND request_timestamp >= ?
      GROUP BY method`,
      [userId, startDate]
    );
    return rows;
  }

  // ==================== SAVED REQUESTS QUERIES ====================

  async saveRequest(userId, name, url, method, headers = null, body = null, folder = null) {
    const [result] = await this.pool.execute(
      'INSERT INTO saved_requests (user_id, name, url, method, headers, body, folder) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, name, url, method, JSON.stringify(headers), JSON.stringify(body), folder]
    );
    return { requestId: result.insertId };
  }

  async getSavedRequests(userId, folder = null) {
    let query = 'SELECT id, name, url, method, headers, body, folder, created_at, updated_at FROM saved_requests WHERE user_id = ?';
    const params = [userId];

    if (folder) {
      query += ' AND folder = ?';
      params.push(folder);
    }

    query += ' ORDER BY folder, name';
    const [rows] = await this.pool.execute(query, params);
    
    return rows.map(row => ({
      ...row,
      headers: row.headers ? JSON.parse(row.headers) : null,
      body: row.body ? JSON.parse(row.body) : null
    }));
  }

  async getSavedRequest(userId, requestId) {
    const [rows] = await this.pool.execute(
      'SELECT id, name, url, method, headers, body, folder, created_at, updated_at FROM saved_requests WHERE id = ? AND user_id = ?',
      [requestId, userId]
    );
    
    if (rows.length === 0) return null;
    
    const row = rows[0];
    return {
      ...row,
      headers: row.headers ? JSON.parse(row.headers) : null,
      body: row.body ? JSON.parse(row.body) : null
    };
  }

  async updateSavedRequest(userId, requestId, updates) {
    const fields = [];
    const values = [];
    
    if (updates.name) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.url) {
      fields.push('url = ?');
      values.push(updates.url);
    }
    if (updates.method) {
      fields.push('method = ?');
      values.push(updates.method);
    }
    if (updates.headers !== undefined) {
      fields.push('headers = ?');
      values.push(JSON.stringify(updates.headers));
    }
    if (updates.body !== undefined) {
      fields.push('body = ?');
      values.push(JSON.stringify(updates.body));
    }
    if (updates.folder !== undefined) {
      fields.push('folder = ?');
      values.push(updates.folder);
    }
    
    if (fields.length === 0) return false;
    
    values.push(requestId, userId);
    await this.pool.execute(
      `UPDATE saved_requests SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
      values
    );
    return true;
  }

  async deleteSavedRequest(userId, requestId) {
    const [result] = await this.pool.execute(
      'DELETE FROM saved_requests WHERE id = ? AND user_id = ?',
      [requestId, userId]
    );
    return result.affectedRows > 0;
  }

  async getUserFolders(userId) {
    const [rows] = await this.pool.execute(
      'SELECT DISTINCT folder FROM saved_requests WHERE user_id = ? AND folder IS NOT NULL ORDER BY folder',
      [userId]
    );
    return rows.map(r => r.folder);
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
      console.log('Database connection closed');
    }
  }
}

const database = new DatabaseService();
module.exports = database;
