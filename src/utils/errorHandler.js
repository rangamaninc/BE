const config = require('../config');

const errorHandler = (err, req, res, next) => {
  config.logger.error('Internal Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
};

module.exports = errorHandler;