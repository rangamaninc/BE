// src/controllers/AuthController.js
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const config = require('../config');
const User = require('../models/User');
const Client = require('../models/Client');

const AuthController = {
  async loginUser(req, res) {
    let connection;

    try {
      const login = req.body.username || req.body.id;
      const { password } = req.body;

      if (!login || !password) {
        return res.status(400).json({ success: false, error: 'Username and password are required' });
      }

      const user = await User.findByUsernameOrEmail(login);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'No account found with this email address.',
        });
      }

      if (user.is_active === 0) {
        return res.status(401).json({ success: false, error: 'Your account is inactive. Contact an administrator.' });
      }

      const passwordMatch = await User.comparePassword(password, user.password_hash);
      if (!passwordMatch) {
        return res.status(401).json({ success: false, error: 'Incorrect password. Please try again.' });
      }

      if (User.isPasswordExpired(user)) {
        return res.status(401).json({ success: false, error: 'Password has expired. Please reset your password.' });
      }

      await User.recordLastLogin(user.id);

      const clients = await Client.getVisibleClientsForUser(user.id, user.role_name);

      connection = await mysql.createConnection(config.database);

      let mappedUsersdata;
      const roleName = user.role_name?.toLowerCase();

      if (roleName === 'manager') {
        [mappedUsersdata] = await connection.execute(
          `SELECT DISTINCT uc2.user_id AS mappedUsers
           FROM userclients uc1
           INNER JOIN userclients uc2 ON uc1.client_id = uc2.client_id
           WHERE uc1.user_id = ? AND uc2.user_id != ?`,
          [user.id, user.id]
        );
      } else {
        [mappedUsersdata] = await connection.execute(
          `SELECT DISTINCT uc2.user_id AS mappedUsers
           FROM userclients uc1
           INNER JOIN userclients uc2 ON uc1.client_id = uc2.client_id
           WHERE uc1.user_id = ? AND uc2.user_id != ?`,
          [user.id, user.id]
        );
      }

      const mappedUsers = mappedUsersdata.map((row) => row.mappedUsers);
      const tokenUser = User.toTokenUser(user);
      const token = jwt.sign({ user: tokenUser }, config.jwtSecret, { expiresIn: '1y' });

      res.json({
        success: true,
        role: user.role_name,
        token,
        clients,
        mappedUsers,
      });
    } catch (error) {
      config.logger.error('Error during login:', error);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    } finally {
      if (connection) {
        await connection.end();
      }
    }
  },
};

module.exports = AuthController;
