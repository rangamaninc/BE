// src/controllers/openingBalanceController.js
const Cashbook = require("../models/Cashbook");
const OpeningBalance = require("../models/Openingbalance")
const config = require("../config");

const OpeningBalanceController = {
  async createOpeningBalance(req, res) {
    try {
      const { openingBalanceDate, amount, glCode, isDebit } = req.body;
      const clientId = req.params.clientId;
      const userid = req.user;

      // Check if an opening balance already exists for the master code and date
      const existingBalance =
        await OpeningBalance.findOpeningBalanceByMasterCodeAndDate(
          clientId,glCode,
          openingBalanceDate
        );
      if (existingBalance) {
        return res
          .status(400)
          .json({
            error:
              "Opening balance already exists for this master code and date",
          });
      }

      // Create the opening balance record
      const openingBalance = {
        openingBalanceDate,
        amount,
        glCode,
        isDebit: isDebit ? "1" : "0",
        clientId,
        userid,
      };
      await OpeningBalance.createOpeningBalance(openingBalance);
      res
        .status(201)
        .json({
          success: true,
          message: "Opening balance created successfully",
        });
    } catch (error) {
      config.logger.error("Error creating opening balance:", error);
      if (error.code === "ER_NO_REFERENCED_ROW_2") {
        return res.status(400).json({
          success: false,
          error: "Invalid GL code. Select a code from the list or add it to GL master.",
        });
      }
      res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  },

};

module.exports = OpeningBalanceController;
