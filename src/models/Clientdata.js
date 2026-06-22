// src/models/Cashbook.js
const mysql = require("mysql2/promise");
const config = require("../config");

const Clientdata = {
  async getGLCodesbyClient(clientId, masterOnly = false) {
    const connection = await mysql.createConnection(config.database);

    const query = masterOnly
      ? `(select distinct coa.gl_code AS code, coa.gl_name AS name from chart_of_accounts coa)
         union
         (select distinct cgm.client_gl_code AS code, cgm.client_gl_name AS name from client_gl_mapping cgm where CAST(cgm.client_id AS CHAR) = CAST(? AS CHAR))`
      : `(select distinct coa.gl_code AS code, coa.gl_name AS name from chart_of_accounts coa)
         union
         (select distinct cgm.client_gl_code AS code, cgm.client_gl_name AS name from client_gl_mapping cgm where CAST(cgm.client_id AS CHAR) = CAST(? AS CHAR))`;

    try {
      const [result] = await connection.execute(query, [clientId, clientId]);
      return { result };
    } finally {
      connection.end();
    }
  },
};

module.exports = Clientdata;