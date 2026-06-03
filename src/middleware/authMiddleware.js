// src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const config = require('../config');

const authMiddleware = (req, res, next) => {
  console.log("Inside Auth Middleware")
  const token = req.header('Authorization');

  if (!token) {
    config.logger.error('Unauthorized access - Missing token');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = decoded.user;
    // console.log(user)
    req.user = user.id;
    req.userRole = user.role_name || user.role;
    // Check for session inactivity (30 minutes)
    const currentTime = Date.now();
    if (currentTime - user.lastActivity > 30 * 60 * 1000) {
      config.logger.error('Unauthorized access - Session expired due to inactivity');
      return res.status(401).json({ error: 'Session expired due to inactivity' });
    }

    // Update last activity and reissue token
    user.lastActivity = currentTime;
    const newToken = jwt.sign({ user }, config.jwtSecret, { expiresIn: '30m' });

    // Attach the new token to the response header
    res.setHeader('Authorization', newToken);

    next();
  } catch (err) {
    config.logger.error('Unauthorized access - Invalid token');
    res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = authMiddleware;
