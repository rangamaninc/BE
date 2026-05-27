// src/models/Cashbook.js
const mysql = require("mysql2/promise");
const config = require("../config");
const { prepaidGlCodes } = require("../config/constants");

const Prepaid = {
  async getClientWisePrepaidPendingTransactions(clientId) {
    const connection = await mysql.createConnection(config.database);
    const { fromDate, endDate } = this.getFromDateAndEndDate();
    // console.log((prepaidGlCodes))
    const placeholders = prepaidGlCodes.map((value) => `'${value}'`).join(",");
    // console.log(placeholders)
    try {
      const [result] = await connection.execute(
        `SELECT transactionid, glcode, amount FROM subtransactions WHERE clientid = ? and prepaid_start_date is not null and transaction_date between STR_TO_DATE( ? , "%m/%d/%Y" ) and STR_TO_DATE( ? , "%m/%d/%Y" ) and glcode in (${placeholders})`,
        [clientId, fromDate, endDate]
      );

      return result;
    } finally {
      connection.end();
    }
  },

  async updatePrepaidSubTransactionDetails(prepaidSubTransaction) {
    const connection = await mysql.createConnection(config.database);
    try {
     return await connection.execute(
        `UPDATE subtransactions SET prepaid_Start_Date = STR_TO_DATE( ? , "%m/%d/%Y" ),prepaid_end_date = STR_TO_DATE( ? , "%m/%d/%Y" ),updated_by=?,monetisation=?,is_prepaid=1 WHERE transactionid = ? and glcode=? and clientid = ?`,
        [
          prepaidSubTransaction.fromdate,
          prepaidSubTransaction.todate,
          prepaidSubTransaction.userId,
          prepaidSubTransaction.monetisation,
          prepaidSubTransaction.transactionId,
          prepaidSubTransaction.glCode,
          prepaidSubTransaction.clientId,
        ]
      );
    } finally {
      connection.end();
    }
  },

  // New method to get start and end dates
  getFromDateAndEndDate() {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();

    // January 1st of the current year
    const fromDate = new Date(currentYear, 0, 1);
    const formattedFromDate = `${(fromDate.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${fromDate
      .getDate()
      .toString()
      .padStart(2, "0")}/${fromDate.getFullYear()}`;

    // December 31st of the current year
    const endDate = new Date(currentYear, 11, 31);
    const formattedEndDate = `${(endDate.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${endDate
      .getDate()
      .toString()
      .padStart(2, "0")}/${endDate.getFullYear()}`;

    return {
      fromDate: formattedFromDate,
      endDate: formattedEndDate,
    };
  },
};

module.exports = Prepaid;
