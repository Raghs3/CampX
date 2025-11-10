// Create admin user in production PostgreSQL
require('dotenv').config({ path: require('path').join(__dirname, '../server/.env') });
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL not found in server/.env');
  console.log('Please uncomment DATABASE_URL in server/.env first');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// CHANGE THESE CREDENTIALS!
const ADMIN_EMAIL = 'admin@vit.edu';
const ADMIN_PASSWORD = 'admin123';
const ADMIN_NAME = 'Admin User';

async function createAdminInProduction() {
  console.log('🛡️  Creating admin user in production PostgreSQL...\n');

  try {
    // Hash password
    const password_hash = await bcrypt.hash(ADMIN_PASSWORD, 10);

    // Check if admin exists
    const existing = await pool.query(
      'SELECT email FROM users WHERE email = $1',
      [ADMIN_EMAIL]
    );

    if (existing.rows.length > 0) {
      console.log('❌ Admin user already exists with email:', ADMIN_EMAIL);
      console.log('   To reset, delete from database first\n');
      await pool.end();
      return;
    }

    // Insert admin user
    const result = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role, email_verified) 
       VALUES ($1, $2, $3, 'admin', 1) RETURNING user_id`,
      [ADMIN_NAME, ADMIN_EMAIL, password_hash]
    );

    console.log('✅ Admin user created in production!\n');
    console.log('   User ID:', result.rows[0].user_id);
    console.log('   Name:', ADMIN_NAME);
    console.log('📧 Email:', ADMIN_EMAIL);
    console.log('🔑 Password:', ADMIN_PASSWORD);
    console.log('\n⚠️  CHANGE PASSWORD AFTER FIRST LOGIN!');
    console.log('🔗 Admin panel: https://your-app.onrender.com/admin.html\n');

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
  }
}

createAdminInProduction();
