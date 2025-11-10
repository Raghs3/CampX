// Find admin user in PostgreSQL
require('dotenv').config({ path: require('path').join(__dirname, '../server/.env') });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function findAdmin() {
  try {
    const result = await pool.query("SELECT user_id, email, full_name, role FROM users WHERE email = 'admin@vit.edu'");
    
    if (result.rows.length > 0) {
      console.log('✅ Admin user found in PostgreSQL:');
      console.log(result.rows[0]);
    } else {
      console.log('❌ No admin user found');
      console.log('\nAll users with role admin:');
      const admins = await pool.query("SELECT user_id, email, full_name, role FROM users WHERE role = 'admin'");
      console.log(admins.rows);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

findAdmin();
