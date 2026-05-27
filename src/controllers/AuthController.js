// src/controllers/AuthController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const config = require('../config');
const User = require('../models/User');
const { log } = require('winston');
const mysqlDatetime = require('../utils/common');

const AuthController = {
  async loginUser(req, res) {
    try {
      const { id, password } = req.body;

      // Connect to the database
      const connection = await mysql.createConnection(config.database);
      config.logger.info('Database Connected');
      // Check if the user exists
      
      const [rows] = await connection.execute('SELECT * FROM users WHERE id = ?', [id]);
      const user = rows[0];
      config.logger.info('User Info:',user);
      if (!user) {
        config.logger.info('User Info:',!user);
        return res.status(401).json({ success:false,error: 'Invalid credentials' });
      }

      // Check the 
      
      const passwordMatch = await User.comparePassword(password, user.password);

    //   const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({success: false, error: 'Invalid credentials' });
      }

      // Update last activity
      const currentTime = mysqlDatetime
      await connection.execute('UPDATE users SET lastactivity = ? WHERE id = ?', [currentTime, user.id]);

      const [clients] = await connection.execute('select a.id,a.name from clients a where a.id in (select clientid from clientMapping where userid=?)', [user.id]);
      
      var mappedUsersdata;

      if (user.role?.toLowerCase() === "manager"){
         [mappedUsersdata] = await connection.execute('select distinct userid as mappedUsers from userMapping where managerid=?',[id])
      }
      else{
         [mappedUsersdata] = await connection.execute('select distinct managerid as mappedUsers from userMapping where userid=?',[id])
      }

      const mappedUsers = mappedUsersdata.map(jsonObj => jsonObj.mappedUsers);
      // Create and send the JWT
      const token = jwt.sign({ user }, config.jwtSecret, { expiresIn: '1y' });
      const role = user.role
      const success=true

      res.json({ success,role, token, clients, mappedUsers });
    } catch (error) {
      const success=false
      config.logger.error('Error during login:', error);
      res.status(500).json({ success,error: 'Internal Server Error' });
    } 
    // finally {
    //   // Close the database connection
    //   if (connection) {
    //     connection.end();
    //   }
    // }
  },
};

module.exports = AuthController;
