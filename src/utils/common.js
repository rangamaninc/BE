const config = require('../config');

const jsTimestamp = Date.now();
const mysqlDatetime = new Date(jsTimestamp).toISOString().slice(0, 19).replace('T', ' ');


module.exports = mysqlDatetime;