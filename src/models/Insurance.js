const mysql = require("mysql2/promise");
const config = require("../config");

const Insurance = {
  async findByPolicyNumber(clientId, policyNumber) {
    const connection = await mysql.createConnection(config.database);
    try {
      const [rows] = await connection.execute(
        "SELECT id FROM insurancePolicies WHERE clientid = ? AND policy_number = ?",
        [clientId, policyNumber]
      );
      return rows[0] || null;
    } finally {
      connection.end();
    }
  },

  formatDate(value) {
    if (!value) return null;
    return value;
  },

  async createPolicy(policy) {
    const connection = await mysql.createConnection(config.database);
    try {
      const startDate = this.formatDate(policy.policyStartDate);
      const expiryDate = this.formatDate(policy.policyExpiryDate);
      const renewDate = this.formatDate(policy.policyRenewDate);

      const [result] = await connection.execute(
        `INSERT INTO insurancePolicies (
          clientid, type, policy_number, parent_company, reinsurance_company,
          fronting_company, fronting_risk, risk_share, re_ins_recovery,
          fronting_commission, brokerage_commission, deductibility,
          policy_start_date, policy_expiry_date, policy_renew_date,
          policy_premium, remaining_premium, earning_methodology,
          contact_name, contact_phone, updated_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ${startDate ? 'STR_TO_DATE(?, "%m/%d/%Y")' : "NULL"},
          ${expiryDate ? 'STR_TO_DATE(?, "%m/%d/%Y")' : "NULL"},
          ${renewDate ? 'STR_TO_DATE(?, "%m/%d/%Y")' : "NULL"},
          ?, ?, ?, ?, ?, ?)`,
        [
          policy.clientId,
          policy.type,
          policy.policyNumber,
          policy.parentCompany || null,
          policy.reinsuranceCompany || null,
          policy.frontingCompany || null,
          policy.frontingRisk || null,
          policy.riskShare || null,
          policy.reInsRecovery || null,
          policy.frontingCommission || null,
          policy.brokerageCommission || null,
          policy.deductibility || null,
          ...(startDate ? [startDate] : []),
          ...(expiryDate ? [expiryDate] : []),
          ...(renewDate ? [renewDate] : []),
          policy.policyPremium,
          policy.policyPremium,
          policy.earningMethodology || null,
          policy.contactName || null,
          policy.contactPhone || null,
          policy.updatedBy,
        ]
      );
      return result.insertId;
    } finally {
      connection.end();
    }
  },

  async getPoliciesByClient(clientId, monthName) {
    const connection = await mysql.createConnection(config.database);
    try {
      const [rows] = await connection.execute(
        `SELECT * FROM insurancePolicies
         WHERE clientid = ?
         AND (
           ? IS NULL OR ? = ''
           OR MONTHNAME(policy_start_date) = ?
           OR MONTHNAME(policy_expiry_date) = ?
         )`,
        [clientId, monthName, monthName, monthName, monthName]
      );
      return rows;
    } finally {
      connection.end();
    }
  },

  async getUntaggedPolicies(clientId, glCode) {
    const connection = await mysql.createConnection(config.database);
    try {
      const [rows] = await connection.execute(
        `SELECT policy_number, remaining_premium, policy_premium, glcode
         FROM insurancePolicies
         WHERE clientid = ? AND remaining_premium > 0
         AND (glcode IS NULL OR glcode = ?)`,
        [clientId, glCode]
      );
      return rows;
    } finally {
      connection.end();
    }
  },
};

module.exports = Insurance;
