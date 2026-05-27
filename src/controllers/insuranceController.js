const Insurance = require("../models/Insurance");
const config = require("../config");

const mapPolicyRow = (row) => {
  const premium = Number(row.policy_premium) || 0;
  const remaining = Number(row.remaining_premium) || 0;
  const received = premium - remaining;

  return {
    glcode: row.glcode || "",
    policyNumber: row.policy_number,
    totalPolicy: premium,
    preimumRecevied: received,
    balanceReceivable: remaining,
    policyStartDate: row.policy_start_date,
    policyEndDate: row.policy_expiry_date,
    policyPeriodDays: 365,
    policyInceptionDays: 0,
    policyEarnedDays: 0,
    earningMethod: row.earning_methodology,
    currentYearEarning: received,
    unearnedPremium: remaining,
    remainingPolicyDays: 0,
    remainingPremium: remaining,
  };
};

const InsuranceController = {
  async createPolicy(req, res) {
    try {
      const clientId = req.params.clientId;
      const body = req.body;

      if (!body.policyNumber) {
        return res.status(400).json({
          success: false,
          error: "Policy number is required",
        });
      }

      const existing = await Insurance.findByPolicyNumber(
        clientId,
        body.policyNumber
      );
      if (existing) {
        return res.status(400).json({
          success: false,
          error: "Same policy number exists",
        });
      }

      await Insurance.createPolicy({
        clientId,
        type: body.type,
        policyNumber: body.policyNumber,
        parentCompany: body.parentCompany,
        reinsuranceCompany: body.reinsuranceCompany,
        frontingCompany: body.frontingCompany,
        frontingRisk: body.frontingRisk,
        riskShare: body.riskShare,
        reInsRecovery: body.reInsRecovery,
        frontingCommission: body.frontingCommission,
        brokerageCommission: body.brokerageCommission,
        deductibility: body.deductibility,
        policyStartDate: body.policyStartDate,
        policyExpiryDate: body.policyExpiryDate,
        policyRenewDate: body.policyRenewDate,
        policyPremium: Number(body.policyPremium) || 0,
        earningMethodology: body.earningMethodology,
        contactName: body.contactName,
        contactPhone: body.contactPhone,
        updatedBy: req.user,
      });

      res.status(201).json({
        success: true,
        message: "Insurance policy created successfully",
      });
    } catch (error) {
      config.logger.error("Error creating insurance policy:", error);
      if (error.code === "ER_NO_SUCH_TABLE") {
        return res.status(500).json({
          success: false,
          error: "Insurance table not initialized. Run database migration.",
        });
      }
      res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  },

  async getPoliciesByMonth(req, res) {
    try {
      const clientId = req.params.clientId;
      const month = req.params.month;
      const rows = await Insurance.getPoliciesByClient(clientId, month);
      res.json({
        success: true,
        policyDetails: rows.map(mapPolicyRow),
      });
    } catch (error) {
      config.logger.error("Error fetching insurance policies:", error);
      res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  },

  async getUntaggedPolicies(req, res) {
    try {
      const { clientId, glCode } = req.params;
      const rows = await Insurance.getUntaggedPolicies(clientId, glCode);
      res.json({
        success: true,
        policyDetails: rows.map((row) => ({
          policyNumber: row.policy_number,
          remainingPremium: Number(row.remaining_premium),
        })),
      });
    } catch (error) {
      config.logger.error("Error fetching untagged insurance policies:", error);
      res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  },
};

module.exports = InsuranceController;
