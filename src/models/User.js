// src/models/User.js
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const config = require('../config');

const saltRounds = 10;
const PASSWORD_EXPIRY_DAYS = 90;

const User = {
  getPasswordExpiryDate(fromDate = new Date()) {
    const expiry = new Date(fromDate);
    expiry.setDate(expiry.getDate() + PASSWORD_EXPIRY_DAYS);
    return expiry;
  },

  isPasswordExpired(user) {
    if (!user?.password_expiry_date) return false;
    return new Date(user.password_expiry_date) < new Date();
  },
  toTokenUser(row) {
    if (!row) return null;
    return {
      id: row.id,
      username: row.username,
      email: row.email,
      first_name: row.first_name,
      last_name: row.last_name,
      role_name: row.role_name,
      role: row.role_name,
      is_active: row.is_active,
      lastActivity: Date.now(),
    };
  },

  toPublicUser(row) {
    if (!row) return null;
    const { password_hash, password, ...safe } = row;
    return { ...safe, role: row.role_name };
  },

  async findById(userId) {
    const connection = await mysql.createConnection(config.database);

    try {
      const [rows] = await connection.execute('SELECT * FROM users WHERE id = ?', [userId]);

      if (rows.length > 0) {
        return rows[0];
      }
      return null;
    } finally {
      connection.end();
    }
  },

  async comparePassword(candidatePassword, hashedPassword) {
    return bcrypt.compare(candidatePassword, hashedPassword);
  },

  async createUser(user) {
    const connection = await mysql.createConnection(config.database);

    try {
      const hashedPassword = await bcrypt.hash(user.password, saltRounds);

      const now = new Date();
      const passwordExpiryDate = User.getPasswordExpiryDate(now);

      const [result] = await connection.execute(
        `INSERT INTO users
        (
          username,
          email,
          first_name,
          last_name,
          password_hash,
          role_name,
          is_active,
          password_changed_date,
          password_expiry_date,
          created_by,
          created_date
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          user.username,
          user.email,
          user.firstName,
          user.lastName,
          hashedPassword,
          user.roleName,
          user.isActive !== undefined ? user.isActive : 1,
          now,
          passwordExpiryDate,
          user.createdBy || 'SYSTEM',
        ]
      );

      const created = await User.findById(result.insertId);
      config.logger.info(`User ${user.username} created successfully.`);
      return User.toPublicUser(created);
    } catch (error) {
      config.logger.error('Error during user creation:', error);
      throw error;
    } finally {
      connection.end();
    }
  },

  async findByUsername(username) {
    const connection = await mysql.createConnection(config.database);

    try {
      const [rows] = await connection.execute('SELECT * FROM users WHERE username = ?', [username]);

      if (rows.length > 0) {
        config.logger.info(`User with username ${username} found.`);
        return rows[0];
      }
      config.logger.info(`User with username ${username} not found.`);
      return null;
    } finally {
      connection.end();
    }
  },

  async recordLastLogin(userId) {
    const connection = await mysql.createConnection(config.database);

    try {
      await connection.execute(
        'UPDATE users SET last_login_date = NOW() WHERE id = ?',
        [userId]
      );
    } finally {
      connection.end();
    }
  },

  async findByUsernameOrEmail(login) {
    const connection = await mysql.createConnection(config.database);

    try {
      const [rows] = await connection.execute(
        'SELECT * FROM users WHERE username = ? OR email = ? LIMIT 1',
        [login, login]
      );
      return rows[0] || null;
    } finally {
      connection.end();
    }
  },

  async getAllUsers() {
    const connection = await mysql.createConnection(config.database);
    try {
      const [rows] = await connection.execute(
        `SELECT id, username, email, first_name, last_name, role_name, is_active, created_date, last_login_date
         FROM users
         ORDER BY id DESC`
      );
      return rows;
    } finally {
      connection.end();
    }
  },

  async updateUserById(userId, payload) {
    const connection = await mysql.createConnection(config.database);
    try {
      const allowedFields = [
        ["username", payload.username],
        ["email", payload.email],
        ["first_name", payload.firstName],
        ["last_name", payload.lastName],
        ["role_name", payload.roleName],
        ["is_active", payload.isActive],
      ].filter(([, value]) => value !== undefined);

      if (allowedFields.length === 0) {
        return this.findById(userId);
      }

      const setClause = allowedFields.map(([field]) => `${field} = ?`).join(", ");
      const values = allowedFields.map(([, value]) => value);

      await connection.execute(
        `UPDATE users SET ${setClause} WHERE id = ?`,
        [...values, userId]
      );

      return this.findById(userId);
    } finally {
      connection.end();
    }
  },

  async deleteUserById(userId) {
    const connection = await mysql.createConnection(config.database);
    try {
      const [result] = await connection.execute("DELETE FROM users WHERE id = ?", [userId]);
      return result.affectedRows > 0;
    } finally {
      connection.end();
    }
  },
};

module.exports = User;
