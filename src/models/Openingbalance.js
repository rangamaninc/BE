const mysql = require("mysql2/promise");
const config = require("../config");

const OpeningBalance = {


  async createOpeningBalance(openingBalance) {
    const connection = await mysql.createConnection(config.database);
    // console.log(openingBalance)
    try {
      const [result] = await connection.execute(
        'INSERT INTO openingBalances (date, amount, glcode, is_debit, clientid, updated_by) VALUES (STR_TO_DATE( ? , "%m/%d/%Y" ), ?, ?, ?, ?, ?)',
        [
          openingBalance.openingBalanceDate,
          openingBalance.amount,
          openingBalance.glCode,
          openingBalance.isDebit ,
          openingBalance.clientId,
          openingBalance.userid,
        ]
      );

      return {
        id: `${openingBalance.glCode}-${openingBalance.openingBalanceDate}-${openingBalance.clientId}`,
        ...openingBalance,
      };
    } finally {
      connection.end();
    }
  },
  async getOpeningBalancesByClient(clientId) {
    const connection = await mysql.createConnection(config.database);

    try {
      const [rows] = await connection.execute(
        `SELECT ob.glcode AS glCode,
                COALESCE(g.name, c.name) AS glName,
                DATE_FORMAT(ob.date, '%m/%d/%Y') AS openingBalanceDate,
                ob.amount,
                ob.is_debit AS isDebit,
                ob.updated_by AS updatedBy,
                ob.created_on AS createdOn
         FROM openingBalances ob
         LEFT JOIN glCodeMaster g ON g.code = ob.glcode
         LEFT JOIN clientGlCodeMaster c
           ON c.code = ob.glcode
          AND CAST(c.clientid AS CHAR) = CAST(ob.clientid AS CHAR)
         WHERE CAST(ob.clientid AS CHAR) = CAST(? AS CHAR)
         ORDER BY ob.date DESC, ob.glcode ASC`,
        [clientId]
      );

      return rows.map((row, index) => {
        const glCode = row.glCode ?? row.glcode;
        const openingBalanceDate =
          row.openingBalanceDate ??
          (row.date
            ? new Date(row.date).toLocaleDateString("en-US")
            : "");
        const createdOn = row.createdOn ?? row.created_on;

        return {
          id: createdOn
            ? `${glCode}-${openingBalanceDate}-${new Date(createdOn).getTime()}`
            : `${glCode}-${openingBalanceDate}-${index}`,
          glCode,
          glName: row.glName ?? row.glname ?? null,
          openingBalanceDate,
          amount: Number(row.amount),
          isDebit: row.isDebit ?? row.is_debit,
          updatedBy: row.updatedBy ?? row.updated_by,
        };
      });
    } finally {
      connection.end();
    }
  },

  async findOpeningBalanceByMasterCodeAndDate(clientId,glCode, openingBalanceDate) {
    const connection = await mysql.createConnection(config.database);

    try {
      const [rows] = await connection.execute(
        'SELECT * FROM openingBalances WHERE clientid=? and glcode = ? AND date = STR_TO_DATE( ? , "%m/%d/%Y" )',
        [clientId, glCode,openingBalanceDate]
      );

      return rows.length > 0 ? rows[0] : null;
    } finally {
      connection.end();
    }
  },




};

module.exports = OpeningBalance;
