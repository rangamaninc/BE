require('dotenv').config();

const runMigrations = require('./migrations/migrate');
const runSeed = require('./migrations/seeddata/seed');

async function bootstrap() {
  console.log('Running database migrations...');
  await runMigrations();

  console.log('Running database seed...');
  await runSeed();

  console.log('Starting server...');
  require('./app');
}

bootstrap().catch((error) => {
  console.error('Startup failed:', error);
  process.exit(1);
});
