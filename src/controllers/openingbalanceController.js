const OpeningBalance = require("../models/Openingbalance");
const config = require("../config");

function buildOpeningBalancePayload(body, clientId, userid, userDisplayName) {
  const {
    openingBalanceDate,
    amount,
    glCode,
    isDebit,
    financialYear,
    currencyCode,
    remarks,
  } = body;

  return {
    openingBalanceDate,
    amount,
    glCode,
    isDebit: isDebit ? "1" : "0",
    financialYear:
      financialYear || OpeningBalance.deriveFinancialYear(openingBalanceDate),
    currencyCode: currencyCode || "USD",
    remarks,
    clientId,
    userid,
    userDisplayName,
  };
}

const OpeningBalanceController = {
  async getOpeningBalances(req, res) {
    try {
      const clientId = req.params.clientId;
      const openingBalances =
        await OpeningBalance.getOpeningBalancesByClient(clientId);
      res.status(200).json({ success: true, openingBalances });
    } catch (error) {
      config.logger.error("Error fetching opening balances:", error);
      res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  },

  async createOpeningBalance(req, res) {
    try {
      const clientId = req.params.clientId;
      const userid = req.user;
      const userDisplayName = req.userName;
      const openingBalance = buildOpeningBalancePayload(
        req.body,
        clientId,
        userid,
        userDisplayName
      );

      if (!openingBalance.financialYear) {
        return res.status(400).json({
          success: false,
          error:
            "Financial year is required or could not be derived from the date.",
        });
      }

      const existingBalance =
        await OpeningBalance.findOpeningBalanceByClientGlAndYear(
          clientId,
          openingBalance.glCode,
          openingBalance.financialYear
        );

      if (existingBalance) {
        return res.status(400).json({
          success: false,
          error:
            "Opening balance already exists for this GL code and financial year.",
        });
      }

      await OpeningBalance.createOpeningBalance(openingBalance);
      res.status(201).json({
        success: true,
        message: "Opening balance created successfully",
      });
    } catch (error) {
      config.logger.error("Error creating opening balance:", error);
      if (error.code === "ER_NO_REFERENCED_ROW_2") {
        return res.status(400).json({
          success: false,
          error:
            "Invalid GL code. Select a code from the list or add it to GL master.",
        });
      }
      res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  },

  async updateOpeningBalance(req, res) {
    try {
      const clientId = req.params.clientId;
      const openingBalanceId = req.params.id;
      const userid = req.user;
      const userDisplayName = req.userName;
      const openingBalance = buildOpeningBalancePayload(
        req.body,
        clientId,
        userid,
        userDisplayName
      );

      if (!openingBalance.financialYear) {
        return res.status(400).json({
          success: false,
          error:
            "Financial year is required or could not be derived from the date.",
        });
      }

      const existingBalance =
        await OpeningBalance.findOpeningBalanceByClientGlAndYear(
          clientId,
          openingBalance.glCode,
          openingBalance.financialYear,
          openingBalanceId
        );

      if (existingBalance) {
        return res.status(400).json({
          success: false,
          error:
            "Another opening balance already exists for this GL code and financial year.",
        });
      }

      const updated = await OpeningBalance.updateOpeningBalance(
        openingBalanceId,
        clientId,
        openingBalance
      );

      if (!updated) {
        return res.status(404).json({
          success: false,
          error: "Opening balance record not found.",
        });
      }

      res.status(200).json({
        success: true,
        message: "Opening balance updated successfully",
      });
    } catch (error) {
      config.logger.error("Error updating opening balance:", error);
      res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  },

  async deleteOpeningBalance(req, res) {
    try {
      const clientId = req.params.clientId;
      const openingBalanceId = req.params.id;

      const deleted = await OpeningBalance.deleteOpeningBalance(
        openingBalanceId,
        clientId
      );

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: "Opening balance record not found.",
        });
      }

      res.status(200).json({
        success: true,
        message: "Opening balance deleted successfully",
      });
    } catch (error) {
      config.logger.error("Error deleting opening balance:", error);
      res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  },

  async postOpeningBalances(req, res) {
    try {
      const clientId = req.params.clientId;
      const userid = req.user;
      const userDisplayName = req.userName;

      const result = await OpeningBalance.postOpeningBalances(
        clientId,
        userid,
        userDisplayName
      );

      res.status(200).json(result);
    } catch (error) {
      config.logger.error("Error posting opening balances:", error);
      res.status(400).json({
        success: false,
        error: error.message || "Failed to post opening balances.",
      });
    }
  },
};

module.exports = OpeningBalanceController;