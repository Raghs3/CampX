// PostgreSQL Database Initialization Script
// Run this once when deploying to create all tables

const { Pool } = require('pg');

async function initializePostgresDB() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🐘 Initializing PostgreSQL database...');

    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id SERIAL PRIMARY KEY,
        full_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        phone TEXT,
        avatar TEXT,
        role TEXT DEFAULT 'student',
        email_verified INTEGER DEFAULT 0,
        verification_token TEXT,
        token_expires BIGINT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Products table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        product_id SERIAL PRIMARY KEY,
        seller_id INTEGER REFERENCES users(user_id),
        title TEXT NOT NULL,
        category TEXT,
        price REAL,
        condition TEXT,
        description TEXT,
        contact_method TEXT,
        status TEXT DEFAULT 'Available',
        quantity INTEGER DEFAULT 1,
        image1 TEXT,
        image2 TEXT,
        image3 TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Messages table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        message_id SERIAL PRIMARY KEY,
        item_id INTEGER REFERENCES products(product_id),
        sender_id INTEGER REFERENCES users(user_id),
        receiver_id INTEGER REFERENCES users(user_id),
        message_text TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Sold items table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sold_items (
        sold_id SERIAL PRIMARY KEY,
        product_id INTEGER,
        seller_id INTEGER REFERENCES users(user_id),
        buyer_id INTEGER REFERENCES users(user_id),
        title TEXT,
        category TEXT,
        price REAL,
        condition TEXT,
        description TEXT,
        contact_method TEXT,
        image1 TEXT,
        image2 TEXT,
        image3 TEXT,
        sold_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Wishlist table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS wishlist (
        wishlist_id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(user_id),
        product_id INTEGER REFERENCES products(product_id),
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, product_id)
      )
    `);

    // Reviews table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        review_id SERIAL PRIMARY KEY,
        seller_id INTEGER REFERENCES users(user_id),
        buyer_id INTEGER REFERENCES users(user_id),
        product_id INTEGER,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        review_text TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Session table (for connect-pg-simple)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS session (
        sid VARCHAR NOT NULL COLLATE "default",
        sess JSON NOT NULL,
        expire TIMESTAMP(6) NOT NULL,
        PRIMARY KEY (sid)
      )
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS IDX_session_expire ON session (expire)
    `);

    console.log('✅ PostgreSQL database initialized successfully!');
    await pool.end();
  } catch (error) {
    console.error('❌ PostgreSQL initialization error:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  initializePostgresDB()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = initializePostgresDB;
