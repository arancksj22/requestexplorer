const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const database = require('./database.service');

class AuthService {
  constructor() {
    this.JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    this.JWT_EXPIRY = '7d';
    this.SALT_ROUNDS = 10;
  }

  // Hash password
  async hashPassword(password) {
    return await bcrypt.hash(password, this.SALT_ROUNDS);
  }

  // Verify password
  async verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  // Generate JWT token
  generateToken(userId, email) {
    return jwt.sign(
      { userId, email },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRY }
    );
  }

  // Verify JWT token
  verifyToken(token) {
    try {
      return jwt.verify(token, this.JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  // Hash token for storage
  hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  // Register new user
  async register(email, password, name) {
    // Validation
    if (!email || !password) {
      throw new Error('Email and password are required');
    }
    
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    // Check if user exists
    const existingUser = await database.findUserByEmail(email);
    if (existingUser) {
      throw new Error('Email already exists');
    }

    // Hash password
    const passwordHash = await this.hashPassword(password);

    // Create user
    const result = await database.createUser(email, passwordHash, name);

    return {
      success: true,
      message: 'User registered successfully',
      userId: result.userId
    };
  }

  // Login user
  async login(email, password) {
    // Validation
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    // Find user
    const user = await database.findUserByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const validPassword = await this.verifyPassword(password, user.password_hash);
    if (!validPassword) {
      throw new Error('Invalid credentials');
    }

    // Generate token
    const token = this.generateToken(user.id, user.email);

    // Store session
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await database.createSession(user.id, tokenHash, expiresAt);

    return {
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    };
  }

  // Logout user
  async logout(token) {
    const tokenHash = this.hashToken(token);
    await database.deleteSession(tokenHash);
    
    return {
      success: true,
      message: 'Logged out successfully'
    };
  }

  // Get current user from token
  async getCurrentUser(token) {
    const decoded = this.verifyToken(token);
    const user = await database.findUserById(decoded.userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  // Validate session
  async validateSession(token) {
    const tokenHash = this.hashToken(token);
    const session = await database.findSession(tokenHash);
    
    if (!session) {
      throw new Error('Session expired or invalid');
    }

    return session;
  }

  // Change password
  async changePassword(userId, oldPassword, newPassword) {
    const user = await database.findUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get user with password hash
    const userWithPassword = await database.findUserByEmail(user.email);

    // Verify old password
    const validPassword = await this.verifyPassword(oldPassword, userWithPassword.password_hash);
    if (!validPassword) {
      throw new Error('Invalid current password');
    }

    if (newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters');
    }

    // Hash new password
    const newPasswordHash = await this.hashPassword(newPassword);

    // Update password
    await database.updateUser(userId, { password_hash: newPasswordHash });

    // Invalidate all sessions
    await database.deleteUserSessions(userId);

    return {
      success: true,
      message: 'Password changed successfully. Please login again.'
    };
  }
}

const authService = new AuthService();
module.exports = authService;
