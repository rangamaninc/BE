const Client = require("../models/Client");
const config = require("../config");

const ClientController = {
  hasAccess(req) {
    const role = req.userRole?.toLowerCase();
    return role === "admin" || role === "manager";
  },
  isAdmin(req) {
    return req.userRole?.toLowerCase() === "admin";
  },

  async getHierarchy(req, res) {
    try {
      if (!ClientController.hasAccess(req)) {
        return res.status(403).json({ success: false, error: "Access denied" });
      }
      const clients = await Client.getClientHierarchy();
      res.json({ success: true, clients });
    } catch (error) {
      config.logger.error("Error fetching client hierarchy:", error);
      res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  },

  async createClient(req, res) {
    try {
      if (!ClientController.isAdmin(req)) {
        return res.status(403).json({ success: false, error: "Admin access required" });
      }
      const { name, code, type, parentId } = req.body;
      if (!name || !code || !type) {
        return res.status(400).json({ success: false, error: "name, code and type are required" });
      }
      const id = await Client.createClient({ name, code, type, parentId });
      res.status(201).json({ success: true, id });
    } catch (error) {
      config.logger.error("Error creating client:", error);
      res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  },

  async updateClient(req, res) {
    try {
      if (!ClientController.isAdmin(req)) {
        return res.status(403).json({ success: false, error: "Admin access required" });
      }
      const updated = await Client.updateClient(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ success: false, error: "Client not found" });
      }
      res.json({ success: true });
    } catch (error) {
      config.logger.error("Error updating client:", error);
      res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  },

  async deleteClient(req, res) {
    try {
      if (!ClientController.isAdmin(req)) {
        return res.status(403).json({ success: false, error: "Admin access required" });
      }
      const deleted = await Client.deleteClient(req.params.id);
      if (!deleted) {
        return res.status(404).json({ success: false, error: "Client not found" });
      }
      res.json({ success: true });
    } catch (error) {
      config.logger.error("Error deleting client:", error);
      res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  },
};

module.exports = ClientController;
