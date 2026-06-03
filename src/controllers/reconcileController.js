const Reconcile = require("../models/Reconcile");
const Prepaid = require("../models/Prepaid");
const config = require("../config");

const ReconcileController = {
  async getPendingSubTransactions(req, res) {
    try {
      const clientId = req.params.clientId;
      const pendingSubTransactions =
        await Reconcile.getPendingSubTransactions(clientId);

      res.json({ success: true, pendingSubTransactions });
    } catch (error) {
      config.logger.error("Error fetching reconcile records:", error);
      res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  },

  async getInvestments(req, res) {
    try {
      res.json({ success: true, investmentDetails: [] });
    } catch (error) {
      config.logger.error("Error fetching reconcile investments:", error);
      res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  },

  async getUntaggedAccruals(req, res) {
    try {
      const { clientId, glCode } = req.params;
      const accrualDetails = await Reconcile.getUntaggedAccruals(
        clientId,
        glCode
      );

      res.json({ success: true, accrualDetails });
    } catch (error) {
      config.logger.error("Error fetching untagged accruals:", error);
      res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  },

  async updateTransaction(req, res) {
    try {
      const clientId = req.params.clientId;
      const userId = req.user;
      const {
        subtransactionType,
        policies,
        fromdate,
        todate,
        monetisation,
        reconcileData,
        invoiceNumber,
      } = req.body;

      if (subtransactionType === "PREPAID") {
        await Prepaid.updatePrepaidSubTransactionDetails({
          clientId,
          transactionId: req.body.transactionId,
          glCode: req.body.glCode,
          fromdate,
          todate,
          userId,
          monetisation,
        });
      } else if (subtransactionType === "INSURANCE" && policies?.length) {
        await Reconcile.updateInsuranceReconcile(clientId, policies, userId);
      } else if (subtransactionType === "ACCURAL") {
        const invoice =
          reconcileData?.invoiceNumber || invoiceNumber || null;
        if (invoice) {
          await Reconcile.updateAccrualReconcile(
            clientId,
            req.body.glCode,
            invoice,
            userId
          );
        }
      }

      res.json({
        success: true,
        message: "Transaction reconciled successfully",
      });
    } catch (error) {
      config.logger.error("Error updating reconcile transaction:", error);
      if (error.code === "ER_BAD_FIELD_ERROR") {
        return res.status(400).json({
          success: false,
          error:
            "Prepaid reconcile columns are missing on subtransactions. Run the database migration.",
        });
      }
      res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  },
};

module.exports = ReconcileController;
