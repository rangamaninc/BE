const express = require("express");
const InsuranceController = require("../controllers/insuranceController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/:clientId/policy",
  authMiddleware,
  InsuranceController.createPolicy
);
router.get(
  "/:clientId/policy/:month",
  authMiddleware,
  InsuranceController.getPoliciesByMonth
);

module.exports = router;
