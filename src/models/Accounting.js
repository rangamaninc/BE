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
           CASE WHEN is_debit = '1' THEN amount ELSE -amount END
         ), 0) AS balance
         FROM openingBalances
         WHERE clientid = ? AND glcode = ?`,
        [clientId, glCode]
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
            SELECT SUM(CASE WHEN is_debit = '1' THEN amount ELSE -amount END)
            FROM openingBalances WHERE clientid = ? AND glcode = g.code
          ), 0) +
          IFNULL((
            SELECT SUM(amount) FROM subtransactions
            WHERE clientid = ? AND glcode = g.code
          ), 0) AS balance
         FROM (
           SELECT DISTINCT code FROM clientGlCodeMaster WHERE clientid = ?
           UNION
           SELECT DISTINCT code FROM glCodeMaster
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
