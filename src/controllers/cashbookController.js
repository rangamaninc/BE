// src/controllers/cashbookController.js
const Cashbook = require("../models/Cashbook");
const config = require("../config");
const {prepaidGlCodes} = require("../config/constants")

const CashbookController = {
  async createCashbook(req, res) {
    const clientId = req.params.clientId;
    const cbGLCode = req.params.cashbook;
    let createdCashbookTransaction = null;

    try {
      const { description, amount, transactionDate, subTransactions } =
        req.body;
      const user = req.user;

      const cashbookTransaction = {
        description,
        amount,
        clientId,
        transactionDate,
        cbGLCode,
        user,
      };

      const subTxnList = Array.isArray(subTransactions) ? subTransactions : [];
      const containsPrepaidCodes = subTxnList.some((subTransaction) =>
        prepaidGlCodes.includes(subTransaction.masterCode)
      );

      createdCashbookTransaction = await Cashbook.createTransaction(
        cashbookTransaction
      );

      if (subTxnList.length > 0) {
        await Cashbook.createSubTransactions(
          createdCashbookTransaction.id,
          subTxnList,
          transactionDate,
          user,
          clientId
        );
      }

      res.status(201).json({
        success: true,
        message: "Cashbook Transaction created successfully",
        isPrepaidGLAvailable: containsPrepaidCodes,
      });
    } catch (error) {
      if (createdCashbookTransaction?.id) {
        try {
          await Cashbook.deleteTransaction(
            createdCashbookTransaction.id,
            cbGLCode,
            clientId
          );
          config.logger.info(
            "Created transaction rolled back due to an error"
          );
        } catch (rollbackError) {
          config.logger.error("Error rolling back transaction:", rollbackError);
        }
      }
      config.logger.error("Error creating cashbook:", error);
      res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  },

  async getCashbookBalancesByMonth(req, res) {
    try {
      const clientId = req.params.clientId;
      const cbGLCode = req.params.cashbook;

      if (!clientId || !cbGLCode) {
        return res
          .status(400)
          .json({ error: "Client ID and Cashbook is required" });
      }

      const balances = await Cashbook.getCashbookBalancesByMonth(
        clientId,
        cbGLCode
      );

      res.json({ success: true, balances });
    } catch (error) {
      config.logger.error("Error fetching cashbook balances:", error);
      res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  },



  async getCashbookBalancesByYear(req, res) {
    try {
      console.log("Inside get balances")
      const clientId = req.params.clientId;
      const cbGLCode = req.params.cashbook;

      if (!clientId || !cbGLCode) {
        return res
          .status(400)
          .json({ error: "Client ID and Cashbook is required" });
      }

      const balances = await Cashbook.getCashbookBalancesByYear(
        clientId,
        cbGLCode
      );

      res.json({ success: true, balances });
    } catch (error) {
      config.logger.error("Error fetching cashbook balances:", error);
      res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  },
};

module.exports = CashbookController;
