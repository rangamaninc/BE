const express = require("express");
const InsuranceController = require("../controllers/insuranceController");
const ReconcileController = require("../controllers/reconcileController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/investment/:clientId",
  authMiddleware,
  ReconcileController.getInvestments
);
router.get(
  "/accural/:clientId/:glCode",
  authMiddleware,
  ReconcileController.getUntaggedAccruals
);
router.get(
  "/insurance/:clientId/:glCode",
  authMiddleware,
  InsuranceController.getUntaggedPolicies
);
router.post(
  "/:clientId/update-transaction",
  authMiddleware,
  ReconcileController.updateTransaction
);
router.get(
  "/:clientId",
  authMiddleware,
  ReconcileController.getPendingSubTransactions
);

module.exports = router;
