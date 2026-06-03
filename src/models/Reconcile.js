const mysql = require("mysql2/promise");
const config = require("../config");
const { prepaidGlCodes } = require("../config/constants");

const Reconcile = {
  resolveSubtransactionType(glcode) {
    if (prepaidGlCodes.includes(glcode)) {
      return "PREPAID";
    }
    return "INSURANCE";
  },

  async getPendingSubTransactions(clientId) {
    const connection = await mysql.createConnection(config.database);

    try {
      const [rows] = await connection.execute(
        `SELECT s.transactionid,
                s.glcode,
                s.amount,
                DATE_FORMAT(s.transaction_date, '%m/%d/%Y') AS transactionDate,
                COALESCE(t.description, 'Transaction') AS transactionDescription
         FROM subtransactions s
         LEFT JOIN transactions t
           ON t.id = s.transactionid
          AND CAST(t.clientid AS CHAR) = CAST(s.clientid AS CHAR)
         WHERE CAST(s.clientid AS CHAR) = CAST(? AS CHAR)
         ORDER BY s.transaction_date DESC`,
        [clientId]
      );

      return rows.map((row) => {
        const subtransactionType = Reconcile.resolveSubtransactionType(row.glcode);
        return {
          transactionid: Number(row.transactionid),
          glcode: row.glcode,
          amount: Number(row.amount),
          transactionDate: row.transactionDate,
          transactionType: subtransactionType,
          subtransactionType,
        };
      });
    } finally {
      connection.end();
    }
  },

  async getUntaggedAccruals(clientId, glCode) {
    const connection = await mysql.createConnection(config.database);

    try {
      const [rows] = await connection.execute(
        `SELECT id,
                expense_methodology AS invoiceNumber,
                amount,
                DATE_FORMAT(from_date, '%m/%d/%Y') AS fromDate,
                DATE_FORMAT(to_date, '%m/%d/%Y') AS toDate
         FROM accruals
         WHERE CAST(clientid AS CHAR) = CAST(? AS CHAR)
           AND glcode = ?`,
        [clientId, glCode]
      );

      return rows.map((row) => ({
        id: Number(row.id),
        invoiceNumber: row.invoiceNumber || String(row.id),
        amount: Number(row.amount),
        fromDate: row.fromDate,
        toDate: row.toDate,
      }));
    } finally {
      connection.end();
    }
  },

  async updateInsuranceReconcile(clientId, policies, userId) {
    const connection = await mysql.createConnection(config.database);

    try {
      for (const policy of policies) {
        await connection.execute(
          `UPDATE insurancePolicies
           SET remaining_premium = GREATEST(remaining_premium - ?, 0),
               updated_by = ?
           WHERE CAST(clientid AS CHAR) = CAST(? AS CHAR)
             AND policy_number = ?`,
          [policy.remainingPremium, userId, clientId, policy.policyId]
        );
      }
    } finally {
      connection.end();
    }
  },

  async updateAccrualReconcile(clientId, glCode, invoiceNumber, userId) {
    const connection = await mysql.createConnection(config.database);

    try {
      await connection.execute(
        `UPDATE accruals
         SET expense_methodology = ?, updated_by = ?
         WHERE CAST(clientid AS CHAR) = CAST(? AS CHAR)
           AND glcode = ?
           AND (expense_methodology = ? OR CAST(id AS CHAR) = ?)`,
        [invoiceNumber, userId, clientId, glCode, invoiceNumber, invoiceNumber]
      );
    } finally {
      connection.end();
    }
  },
};

module.exports = Reconcile;
