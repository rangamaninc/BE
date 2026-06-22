require('dotenv').config();

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

function getDatabaseName() {
  const databaseName = process.env.DB_DATABASE || process.env.DB_NAME;
  if (!databaseName) {
    throw new Error('Missing database name. Set DB_DATABASE (or DB_NAME) in .env');
  }
  return databaseName;
}

function getConnectionOptions(database) {
  return {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ...(database ? { database } : {}),
  };
}

async function ensureDatabaseExists(databaseName) {
  const connection = await mysql.createConnection(getConnectionOptions());
  const safeName = databaseName.replace(/`/g, '``');
  await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${safeName}\``);
  await connection.end();
}

async function isMigrationExecuted(connection, file) {
  try {
    const [rows] = await connection.execute(
      'SELECT migration_name FROM migrations WHERE migration_name = ?',
      [file]
    );
    return rows.length > 0;
  } catch (error) {
    if (error.code === 'ER_NO_SUCH_TABLE') {
      return false;
    }
    throw error;
  }
}

async function runMigrations() {
  const databaseName = getDatabaseName();
  await ensureDatabaseExists(databaseName);

  const connection = await mysql.createConnection(
    getConnectionOptions(databaseName)
  );

  try {
    //const migrationsDir = __dirname;
    const migrationsDir = path.join(__dirname, 'migrationscripts');
    const files = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      console.log(`No SQL migration files found in: ${migrationsDir}`);
      return;
    }

    for (const file of files) {
      const alreadyExecuted = await isMigrationExecuted(connection, file);
      if (alreadyExecuted) {
        console.log(`Skipped (already executed): ${file}`);
        continue;
      }

      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      await connection.query(sql);

      await connection.execute(
        'INSERT INTO migrations (migration_name) VALUES (?)',
        [file]
      );

      console.log(`Executed: ${file}`);
    }

    console.log('Migrations completed successfully.');
  } finally {
    await connection.end();
  }
}

module.exports = runMigrations;

if (require.main === module) {
  runMigrations().catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
}
