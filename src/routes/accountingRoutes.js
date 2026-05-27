const express = require("express");
const AccountingController = require("../controllers/accountingController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/ledger/:clientId",
  authMiddleware,
  AccountingController.getLedger
);
router.get(
  "/trail-balance/:clientId",
  authMiddleware,
  AccountingController.getTrialBalance
);

module.exports = router;
