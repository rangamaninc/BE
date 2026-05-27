const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("../config");

const UserController = {
  async createUser(req, res) {
    try {
      const { id, password, role } = req.body;

      // Check if the username is already taken
      const existingUser = await User.findByUsername(id);
      if (existingUser) {
        config.logger.warn(`Username ${username} is already taken.`);
        return res
          .status(400)
          .json({ success: false, error: "Username is already taken" });
      }

      // Create a new user
      const newUser = {
        id: id,
        password: password,
        role: role,
      };

      // Save the user to the database
      const savedUser = await User.createUser(newUser);

      // Generate and send the JWT
      //  const token = jwt.sign({ user: savedUser }, config.jwtSecret, { expiresIn: '1h' });
      res.json({ success: false, user: savedUser });
    } catch (error) {
      config.logger.error("Error during user creation:", error);
      res.status(500).json({ succes: false, error: "Internal Server Error" });
    }
  },

  // Other user-related controller methods go here
};

module.exports = UserController;
