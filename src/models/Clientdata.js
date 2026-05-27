// src/models/Cashbook.js
const mysql = require("mysql2/promise");
const config = require("../config");

const Clientdata = {
  async getGLCodesbyClient(clientId) {
    const connection = await mysql.createConnection(config.database);

    try {
      const [result] = await connection.execute(
        '(select distinct code,name from clientGlCodeMaster where clientid=?) union (select distinct code,name from glCodeMaster a where not exists (select 1 from clientGlCodeMaster b where b.clientid=? and b.code=a.code))',
        [
          clientId,clientId
        ]
      );
        console.log(result)
    //   const createdTransactionId = result.insertId;

      return { result };
    } finally {
      connection.end();
    }
  },
};

module.exports = Clientdata;
