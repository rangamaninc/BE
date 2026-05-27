const winston = require("winston");
const dotenv = require("dotenv");

dotenv.config();

const config = {
  // Your configuration settings go here
  // For example, database configuration, API keys, etc.
  database: {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_DATABASE || "your_database",
    port: process.env.DB_PORT || 3306,
  },
  jwtSecret: process.env.JWT_SECRET || "your_jwt_secret",
};

// Configure Winston logger
const logger = winston.createLogger({
  level: "info",
  format: winston.format.simple(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "app.log" }),
  ],
});

config.logger = logger;

module.exports = config;
