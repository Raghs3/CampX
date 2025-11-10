// Check PostgreSQL database contents
require('dotenv').config({ path: require('path').join(__dirname, '../server/.env') });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkDatabase() {
  console.log('🔍 Checking PostgreSQL database...\n');

  try {
    // Check users
    const users = await pool.query('SELECT COUNT(*) FROM users');
    console.log(`👥 Users: ${users.rows[0].count}`);
    
    const userList = await pool.query('SELECT user_id, email, role FROM users LIMIT 5');
    console.log('Sample users:');
    userList.rows.forEach(u => console.log(`   - ${u.email} (${u.role || 'student'})`));
    console.log('');

    // Check products
    const products = await pool.query('SELECT COUNT(*) FROM products');
    console.log(`📦 Products: ${products.rows[0].count}`);

    // Check messages
    const messages = await pool.query('SELECT COUNT(*) FROM messages');
    console.log(`💬 Messages: ${messages.rows[0].count}`);

    // Check sold_items
    const sold = await pool.query('SELECT COUNT(*) FROM sold_items');
    console.log(`💰 Sold Items: ${sold.rows[0].count}`);

    // Check wishlist
    const wishlist = await pool.query('SELECT COUNT(*) FROM wishlist');
    console.log(`❤️  Wishlist: ${wishlist.rows[0].count}`);

    // Check reviews
    const reviews = await pool.query('SELECT COUNT(*) FROM reviews');
    console.log(`⭐ Reviews: ${reviews.rows[0].count}`);

    console.log('\n✅ Database check complete');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkDatabase();
