const express = require("express");
const InsuranceController = require("../controllers/insuranceController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/insurance/:clientId/:glCode",
  authMiddleware,
  InsuranceController.getUntaggedPolicies
);

module.exports = router;
