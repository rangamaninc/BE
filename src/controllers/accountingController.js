const Accounting = require("../models/Accounting");
const config = require("../config");

const balanceType = (amount) => (amount >= 0 ? "debit" : "credit");

const AccountingController = {
  async getLedger(req, res) {
    try {
      const clientId = req.params.clientId;
      const glCode = req.query.glcode;

      if (!clientId || !glCode) {
        return res.status(400).json({
          success: false,
          error: "Client ID and glcode are required",
        });
      }

      const rows = await Accounting.getLedgerSubtransactions(clientId, glCode);
      const openingBalance = await Accounting.getOpeningBalanceSum(
        clientId,
        glCode
      );

      const subtransactions = rows.map((row) => {
        const amount = Number(row.amount);
        return {
          transactionid: row.transactionid,
          glcode: row.glcode,
          amount,
          transaction_date: row.transaction_date,
          description: row.description || "",
          type: amount >= 0 ? "credit" : "debit",
        };
      });

      const subTotal = subtransactions.reduce((sum, t) => sum + t.amount, 0);
      const totalBalance = openingBalance + subTotal;

      res.json({
        success: true,
        data: {
          subtransactions,
          balance_details: {
            balance: Math.abs(totalBalance),
            type: balanceType(totalBalance),
          },
        },
      });
    } catch (error) {
      config.logger.error("Error fetching ledger:", error);
      res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  },

  async getTrialBalance(req, res) {
    try {
      const clientId = req.params.clientId;
      if (!clientId) {
        return res.status(400).json({
          success: false,
          error: "Client ID is required",
        });
      }

      const rows = await Accounting.getTrialBalance(clientId);
      const data = rows.map((row) => {
        const balance = Number(row.balance) || 0;
        return {
          glcode: row.glcode,
          balance: Math.abs(balance),
          type: balanceType(balance),
        };
      });

      res.json({ success: true, data });
    } catch (error) {
      config.logger.error("Error fetching trial balance:", error);
      res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  },
};

module.exports = AccountingController;
