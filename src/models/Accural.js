// src/models/Cashbook.js
const mysql = require("mysql2/promise");
const config = require("../config");
const { prepaidGlCodes } = require("../config/constants");

const Accural = {

  async addAccural(accural) {
    const connection = await mysql.createConnection(config.database);
    try {
     return await connection.execute(
        'INSERT INTO accurals (clientid, glcode, amount, from_date, to_date, updated_by, expense_methodology) VALUES(?, ?, ?, STR_TO_DATE( ? , "%m/%d/%Y" ), STR_TO_DATE( ? , "%m/%d/%Y" ), ?, ?);',
        [
            accural.clientId,
            accural.glCode,
            accural.amount,
            accural.fromDate,
            accural.toDate,
            accural.userId,
            accural.monetisation,
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

module.exports = Accural;
