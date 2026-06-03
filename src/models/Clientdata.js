// src/models/Cashbook.js
const mysql = require("mysql2/promise");
const config = require("../config");

const Clientdata = {
  async getGLCodesbyClient(clientId, masterOnly = false) {
    const connection = await mysql.createConnection(config.database);

    const query = masterOnly
      ? `(select distinct c.code, c.name from clientGlCodeMaster c inner join glCodeMaster g on g.code = c.code where c.clientid = ?)
         union
         (select distinct a.code, a.name from glCodeMaster a where not exists (select 1 from clientGlCodeMaster b where b.clientid = ? and b.code = a.code))`
      : `(select distinct code, name from clientGlCodeMaster where clientid = ?)
         union
         (select distinct a.code, a.name from glCodeMaster a where not exists (select 1 from clientGlCodeMaster b where b.clientid = ? and b.code = a.code))`;

    try {
      const [result] = await connection.execute(query, [clientId, clientId]);
    //   const createdTransactionId = result.insertId;

      return { result };
    } finally {
      connection.end();
    }
  },
};

module.exports = Clientdata;
