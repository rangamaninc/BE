// src/models/User.js
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const config = require('../config');

const saltRounds = 10;

const User = {
  async findById(userId) {
    const connection = await mysql.createConnection(config.database);

    try {
      const [rows] = await connection.execute('SELECT * FROM users WHERE id = ?', [userId]);

      if (rows.length > 0) {
        console.log("Found User :",rows[0])
        return rows[0];
      } else {
        return null;
      }
    } finally {
      connection.end();
    }
  },

  async comparePassword(candidatePassword, hashedPassword) {
    return await bcrypt.compare(candidatePassword, hashedPassword);
  },

  async createUser(user) {
    const connection = await mysql.createConnection(config.database);

    try {
      // Hash the password
      const hashedPassword = await bcrypt.hash(user.password, saltRounds);
      console.log('Hashed Password:', hashedPassword,user);
      // Create a new user
      const [result] = await connection.execute('INSERT INTO users (id, password, role) VALUES (?, ?, ?)', [
        user.id,
        hashedPassword,
        user.role
      ]);

      var id = result.insertId;
      config.logger.info(`User with username ${user.id},${id} and ${user.role} created successfully.`);
      return user;
    } catch (error) {
      config.logger.error('Error during user creation:', error);
      throw error;
    } finally {
      connection.end();
    }
  },

 async findByUsername(id) {
    const connection = await mysql.createConnection(config.database);

    try {
      const [rows] = await connection.execute('SELECT * FROM users WHERE id = ?', [id]);

      if (rows.length > 0) {
        const user = rows[0];
        config.logger.info(`User with username ${user.id} found.`);
        return user;
      } else {
        config.logger.info(`User with username ${id} not found.`);
        return null;
      }
    } finally {
      connection.end();
    }
  },

  async findClientsByUsername(id) {
    const connection = await mysql.createConnection(config.database);

    try {
      const [rows] = await connection.execute('SELECT * FROM users WHERE id = ?', [id]);

      if (rows.length > 0) {
        const user = rows[0];
        config.logger.info(`User with username ${user.id} found.`);
        return user;
      } else {
        config.logger.info(`User with username ${id} not found.`);
        return null;
      }
    } finally {
      connection.end();
    }
  },
};

module.exports = User;
