require('dotenv').config();

const mysql = require('mysql2/promise');

const seedRoles = require('./roles-data');
const seedUsers = require('./users-data');
const seedClients = require('./client-data');
const seedUserRoles = require('./user-role-mapping');
const seedUserClients = require('./user-clients-mapping');

async function runSeed() {
  const databaseName = process.env.DB_DATABASE || process.env.DB_NAME;
  if (!databaseName) {
    throw new Error('Missing database name. Set DB_DATABASE (or DB_NAME) in .env');
  }

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: databaseName,
  });

  try {
    await seedRoles(connection);
    await seedUsers(connection);
    await seedClients(connection);
    await seedUserRoles(connection);
    await seedUserClients(connection);
    console.log('All seed data completed successfully.');
  } finally {
    await connection.end();
  }
}

module.exports = runSeed;

if (require.main === module) {
  runSeed().catch((error) => {
    console.error('Seed process failed:', error);
    process.exit(1);
  });
}
