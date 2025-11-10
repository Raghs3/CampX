// Run this to initialize PostgreSQL tables
require('dotenv').config({ path: require('path').join(__dirname, '../server/.env') });
const initializePostgresDB = require('../server/init-postgres');

initializePostgresDB()
  .then(() => {
    console.log('✅ Database initialized successfully!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Failed to initialize database:', err);
    process.exit(1);
  });
