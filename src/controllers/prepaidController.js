// src/controllers/cashbookController.js
const Prepaid = require("../models/Prepaid");
const config = require("../config");

const PrepaidController = {
  async getPendingTransactions(req, res) {
    try {
      const clientId = req.params.clientId;

      if (!clientId) {
        return res.status(400).json({ error: "Client ID is required" });
      }

      const pendingPrepaidSubTransactions =
        await Prepaid.getClientWisePrepaidPendingTransactions(clientId);

      res.json({ success: true, pendingPrepaidSubTransactions });
    } catch (error) {
      config.logger.error("Error fetching cashbook balances:", error);
      res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  },

  async updatePrepaidTxnDetails(req, res) {
    try {
        const {transactionId,glCode,fromdate,todate,monetisation} = req.body
        const clientId= req.params.clientId
        const userId = req.user

        const prepaidSubTransaction = {
            transactionId,
            glCode,
            fromdate,
            todate,
            clientId,
            userId,
            monetisation
          };
          console.log(prepaidSubTransaction)
        const updatePrepaidTxn = await Prepaid.updatePrepaidSubTransactionDetails(prepaidSubTransaction)

        res.json({success:true, messgae : "Transaction Updated Successfully"})

    } catch (error) {
        config.logger.error("Error updating transaction:", error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  },
};

module.exports = PrepaidController;
