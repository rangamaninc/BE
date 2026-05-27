// src/models/Cashbook.js
const mysql = require("mysql2/promise");
const config = require("../config");

const Cashbook = {
  async createTransaction(transaction) {
    const connection = await mysql.createConnection(config.database);

    try {
      const [result] = await connection.execute(
        'INSERT INTO transactions (glcode,description, amount, clientid, transaction_Date, updated_by) VALUES (?, ?, ?, ?, STR_TO_DATE( ? , "%m/%d/%Y" ), ?)',
        [
          transaction.cbGLCode,
          transaction.description,
          transaction.amount,
          transaction.clientId,
          transaction.transactionDate,
          transaction.user,
        ]
      );

      const createdTransactionId = result.insertId;

      return { id: createdTransactionId, ...transaction };
    } finally {
      connection.end();
    }
  },

  async createSubTransactions(
    transactionId,
    subTransactions,
    transactionDate,
    user,
    clientid
  ) {
    const connection = await mysql.createConnection(config.database);

    try {
      console.log(
        transactionId,
        subTransactions,
        transactionDate,
        user,
        clientid
      );

      const subTransactionPromises = subTransactions.map((subTransaction) => {

        return connection.execute(
          'INSERT INTO subtransactions (transactionid, glcode, description, amount, updated_by, clientid, transaction_Date) VALUES (?, ?, ?, ?, ?, ?,  STR_TO_DATE( ? , "%m/%d/%Y" ))',
          [
            transactionId,
            subTransaction.masterCode,
            subTransaction.description,
            subTransaction.amount,
            user,
            clientid,
            transactionDate,
          ]
        );
      });

      await Promise.all(subTransactionPromises);
    } finally {
      // catch(error){
      //   // console.log("inside error")
      //   var result = await connection.execute('delete from transactions where id=?',[transactionId])
      //   // console.log(result)
      //   return error
      // }

      connection.end();
    }
  },

  async getCashbookBalancesByMonth(clientId, cbGLCode) {
    const connection = await mysql.createConnection(config.database);
    const { fromDate, endDate } = this.getFromDateAndEndDate();

    try {
      const [result] = await connection.execute(
        "SELECT monthname(transaction_date) as month, YEAR(transaction_date) as year, SUM(amount) as balance " +
          "FROM transactions " +
          'WHERE clientid = ? and glcode = ? and transaction_date between STR_TO_DATE( ? , "%m/%d/%Y" ) and STR_TO_DATE( ? , "%m/%d/%Y" ) ' +
          "GROUP BY YEAR(transaction_date), monthname(transaction_date) " +
          "ORDER BY YEAR(transaction_date), monthname(transaction_date)",
        [clientId, cbGLCode, fromDate, endDate]
      );

      return result;
    } finally {
      connection.end();
    }
  },

  async getCashbookBalancesByYear(clientID, cbGLcode) {
    const connection = await mysql.createConnection(config.database);

    try {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1; // Get current month (1-12)
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const monthlyBalances = [];

      // Get the initial opening balance
      const [initialBalanceResult] = await connection.execute(
        'SELECT amount FROM openingBalances WHERE clientid = ? and glcode = ? ORDER BY date ASC LIMIT 1',
        [clientID,cbGLcode]
      );
      const initialBalance = initialBalanceResult[0] ? initialBalanceResult[0].amount : 0;

      // Initialize the cumulative balance with the initial opening balance
      let cumulativeBalance = initialBalance;

      // Loop through each month from January to December
      for (let month = 1; month <= 12; month++) {
        // Only calculate balances for active months
        // if (month <= currentMonth) {
          if(true){
          // Get the sum of transactions for the current month
          const [transactionResult] = await connection.execute(
            'SELECT SUM(amount) AS total_transactions FROM transactions WHERE MONTH(transaction_date) = ? AND YEAR(transaction_date) = ? and clientID = ? and glcode = ?',
            [month, currentYear,clientID,cbGLcode]
          );
          const totalTransactions = transactionResult[0].total_transactions || 0;

          // Get the sum of receipts received for the current month
          const [receiptsResult] = await connection.execute(
            'SELECT SUM(case when amount>0 then amount else 0 end) AS total_receipts FROM transactions WHERE  MONTH(transaction_date) = ? AND YEAR(transaction_date) = ? and clientID = ? and glcode = ?',
            [month, currentYear, clientID, cbGLcode]
          );
          const totalReceipts = receiptsResult[0].total_receipts || 0;

          // Get the sum of payments received for the current month
          const [paymentsResult] = await connection.execute(
            'SELECT SUM(case when amount<0 then amount else 0 end)*-1 AS total_payments FROM transactions WHERE MONTH(transaction_date) = ? AND YEAR(transaction_date) = ? and clientID = ? and glcode = ?',
            [month, currentYear, clientID, cbGLcode]
          );
          const totalPayments = paymentsResult[0].total_payments || 0;

          // Calculate the closing balance as of month-end
          const closingBalance = parseFloat(cumulativeBalance) + parseFloat(totalTransactions);

          // Add the monthly balance to the array
          monthlyBalances.push({
            month: months[month - 1],
            year: currentYear,
            openingBalance: cumulativeBalance,
            receiptsReceived: totalReceipts,
            paymentsReceived: totalPayments,
            closingBalance,
          });

          // Update the cumulative balance for the next iteration
          cumulativeBalance = closingBalance;
        } else {
          // For inactive months, add zero balances
          monthlyBalances.push({
            month: months[month - 1],             year: currentYear,
            openingBalance: 0,
            receiptsReceived: 0,
            paymentsReceived: 0,
            closingBalance: 0,
          });
        }
      }

      return monthlyBalances;
    } finally {
      connection.end();
    }
  },

  async deleteTransaction(id, cbGLCode, cliendid) {
    const connection = await mysql.createConnection(config.database);

    try {
      const [result] = await connection.execute(
        "delete from transactions where clientid=? and glcode=? and id=?",
        [cliendid, cbGLCode, id]
      );

      const createdTransactionId = result.insertId;

      return { id: createdTransactionId, ...transaction };
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

module.exports = Cashbook;
