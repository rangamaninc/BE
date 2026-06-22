const mysql = require("mysql2/promise");
const config = require("../config");

const Accounting = {
  async getLedgerSubtransactions(clientId, glCode) {
    const connection = await mysql.createConnection(config.database);
    try {
      const [rows] = await connection.execute(
        `SELECT transactionid, glcode, amount, transaction_date, description
         FROM subtransactions
         WHERE clientid = ? AND glcode = ?
         ORDER BY transaction_date ASC, transactionid ASC`,
        [clientId, glCode]
      );
      return rows;
    } finally {
      connection.end();
    }
  },

  async getOpeningBalanceSum(clientId, glCode) {
    const connection = await mysql.createConnection(config.database);
    try {
      const [rows] = await connection.execute(
        `SELECT COALESCE(SUM(
           CASE WHEN balance_type = 'D' THEN opening_amount ELSE -opening_amount END
         ), 0) AS balance
         FROM opening_balances
         WHERE client_id = ? AND gl_code = ?`,
        [String(clientId), glCode]
      );
      return Number(rows[0]?.balance) || 0;
    } finally {
      connection.end();
    }
  },

    async getTrialBalance(clientId) {
    const connection = await mysql.createConnection(config.database);
    try {
      const [rows] = await connection.execute(
        `SELECT g.code AS glcode,
          IFNULL((
            SELECT SUM(CASE WHEN balance_type = 'D' THEN opening_amount ELSE -opening_amount END)
            FROM opening_balances WHERE client_id = ? AND gl_code = g.code
          ), 0) +
          IFNULL((
            SELECT SUM(amount) FROM subtransactions
            WHERE clientid = ? AND glcode = g.code
          ), 0) AS balance
         FROM (
           SELECT DISTINCT coa.gl_code AS code FROM chart_of_accounts coa
           UNION
           SELECT DISTINCT cgm.client_gl_code AS code FROM client_gl_mapping cgm WHERE CAST(cgm.client_id AS CHAR) = CAST(? AS CHAR)
         ) g`,
        [clientId, clientId, clientId]
      );
      return rows;
    } finally {
      connection.end();
    }
  },
};

module.exports = Accounting;
