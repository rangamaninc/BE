// src/controllers/cashbookController.js
const Clientdata = require("../models/Clientdata");
const config = require("../config");

const ClientdataController = {
  async getGLCodeMaster(req, res) {
    try {
      const clientId = req.params.clientId;

      const { result } = await Clientdata.getGLCodesbyClient(clientId);
      res.status(201).json({
        success: true,
        glcodes: result,
      });
    } catch (error) {
      config.logger.error("Error getting client data gl codes:", error);
      res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  },
};

module.exports = ClientdataController;
