const User = require("../models/User");
const config = require("../config");

const UserController = {
  hasAccess(req) {
    const role = req.userRole?.toLowerCase();
    return role === "admin" || role === "manager";
  },
  isAdmin(req) {
    return req.userRole?.toLowerCase() === "admin";
  },

  async createUser(req, res) {
    try {
      if (!UserController.isAdmin(req)) {
        return res.status(403).json({ success: false, error: "Admin access required" });
      }

      const {
        username,
        email,
        firstName,
        lastName,
        password,
        roleName,
        isActive,
      } = req.body;

      if (!username || !email || !password || !roleName) {
        return res.status(400).json({
          success: false,
          error: "username, email, password, and roleName are required",
        });
      }

      const existingUser = await User.findByUsername(username);
      if (existingUser) {
        config.logger.warn(`Username ${username} is already taken.`);
        return res.status(400).json({
          success: false,
          error: "Username is already taken",
        });
      }

      const savedUser = await User.createUser({
        username,
        email,
        firstName: firstName || "",
        lastName: lastName || "",
        password,
        roleName,
        isActive,
        createdBy: req.user ? String(req.user) : "SYSTEM",
      });

      res.status(201).json({ success: true, user: savedUser });
    } catch (error) {
      config.logger.error("Error during user creation:", error);
      res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  },

  async listUsers(req, res) {
    try {
      if (!UserController.hasAccess(req)) {
        return res.status(403).json({ success: false, error: "Access denied" });
      }
      const users = await User.getAllUsers();
      res.json({ success: true, users });
    } catch (error) {
      config.logger.error("Error fetching users:", error);
      res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  },

  async updateUser(req, res) {
    try {
      if (!UserController.isAdmin(req)) {
        return res.status(403).json({ success: false, error: "Admin access required" });
      }
      const updated = await User.updateUserById(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ success: false, error: "User not found" });
      }
      res.json({ success: true, user: User.toPublicUser(updated) });
    } catch (error) {
      config.logger.error("Error updating user:", error);
      res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  },

  async deleteUser(req, res) {
    try {
      if (!UserController.isAdmin(req)) {
        return res.status(403).json({ success: false, error: "Admin access required" });
      }
      const deleted = await User.deleteUserById(req.params.id);
      if (!deleted) {
        return res.status(404).json({ success: false, error: "User not found" });
      }
      res.json({ success: true });
    } catch (error) {
      config.logger.error("Error deleting user:", error);
      res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  },
};

module.exports = UserController;
