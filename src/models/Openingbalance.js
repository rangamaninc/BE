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

      const createdOpeningBalanceId = result.insertId;

      return { id: createdOpeningBalanceId, ...openingBalance };
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
