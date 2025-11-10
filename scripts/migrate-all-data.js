// Complete database migration - Transfer ALL data from SQLite to PostgreSQL
const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL not found in server/.env');
  console.log('Please uncomment DATABASE_URL in server/.env first');
  process.exit(1);
}

const sqliteDb = new sqlite3.Database('./campus.db');
const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function clearPostgres() {
  console.log('🗑️  Clearing PostgreSQL database...\n');
  
  try {
    // Delete in correct order (foreign keys)
    await pgPool.query('DELETE FROM reviews');
    await pgPool.query('DELETE FROM sold_items');
    await pgPool.query('DELETE FROM wishlist');
    await pgPool.query('DELETE FROM messages');
    await pgPool.query('DELETE FROM products');
    await pgPool.query('DELETE FROM users');
    
    // Reset sequences (ignore errors if they don't exist)
    const sequences = [
      'users_user_id_seq',
      'products_product_id_seq', 
      'messages_message_id_seq',
      'sold_items_id_seq',
      'reviews_review_id_seq'
    ];
    
    for (const seq of sequences) {
      try {
        await pgPool.query(`ALTER SEQUENCE ${seq} RESTART WITH 1`);
      } catch (e) {
        // Sequence might not exist, skip
      }
    }
    
    console.log('✅ PostgreSQL database cleared\n');
  } catch (error) {
    console.error('❌ Error clearing database:', error.message);
    throw error;
  }
}

async function migrateTable(tableName, columns, idColumn = null) {
  return new Promise((resolve, reject) => {
    sqliteDb.all(`SELECT * FROM ${tableName}`, async (err, rows) => {
      if (err) {
        console.error(`❌ Error reading ${tableName}:`, err.message);
        return reject(err);
      }

      if (!rows || rows.length === 0) {
        console.log(`⏭️  No data in ${tableName}`);
        return resolve({ count: 0, skipped: 0 });
      }

      console.log(`📦 Migrating ${rows.length} rows from ${tableName}...`);

      let successCount = 0;
      let skipCount = 0;

      for (const row of rows) {
        try {
          // Build placeholders ($1, $2, etc.)
          const values = columns.map(col => row[col]);
          const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
          
          await pgPool.query(
            `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`,
            values
          );
          
          successCount++;
        } catch (error) {
          if (error.message.includes('unique') || error.message.includes('duplicate')) {
            skipCount++;
          } else {
            console.error(`   ❌ Failed row:`, error.message);
          }
        }
      }

      console.log(`   ✅ ${successCount} migrated, ${skipCount} skipped\n`);
      resolve({ count: successCount, skipped: skipCount });
    });
  });
}

async function migrate() {
  console.log('🔄 Starting COMPLETE database migration from SQLite to PostgreSQL...\n');

  try {
    // Step 1: Clear existing data
    await clearPostgres();

    const stats = {};

    // Step 2: Migrate users
    stats.users = await migrateTable('users', [
      'full_name', 'email', 'password_hash', 'phone', 'avatar', 
      'role', 'email_verified', 'verification_token', 'token_expires', 'created_at'
    ]);

    // Step 3: Migrate products
    stats.products = await migrateTable('products', [
      'seller_id', 'title', 'category', 'price', 'condition', 
      'description', 'contact_method', 'status', 'quantity',
      'image1', 'image2', 'image3', 'created_at'
    ]);

    // Step 4: Migrate messages (map columns correctly)
    const messagesData = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM messages', (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
    
    console.log(`📦 Migrating ${messagesData.length} rows from messages...`);
    let msgCount = 0;
    for (const row of messagesData) {
      try {
        await pgPool.query(
          `INSERT INTO messages (sender_id, receiver_id, item_id, message_text, created_at) 
           VALUES ($1, $2, $3, $4, $5)`,
          [row.sender_id, row.receiver_id, row.product_id, row.message, row.timestamp]
        );
        msgCount++;
      } catch (e) {
        console.error(`   ❌ Failed message:`, e.message);
      }
    }
    console.log(`   ✅ ${msgCount} migrated\n`);
    stats.messages = { count: msgCount, skipped: 0 };

    // Step 5: Migrate sold_items (no changes needed)
    stats.sold_items = await migrateTable('sold_items', [
      'product_id', 'seller_id', 'buyer_id', 'price', 'sold_at'
    ]);

    // Step 6: Migrate wishlist
    stats.wishlist = await migrateTable('wishlist', [
      'user_id', 'product_id', 'added_at'
    ]);

    // Step 7: Migrate reviews (map columns correctly)
    const reviewsData = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM reviews', (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
    
    console.log(`📦 Migrating ${reviewsData.length} rows from reviews...`);
    let revCount = 0;
    for (const row of reviewsData) {
      try {
        await pgPool.query(
          `INSERT INTO reviews (seller_id, buyer_id, product_id, rating, review_text, created_at) 
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [row.reviewed_user_id, row.reviewer_id, row.product_id, row.rating, row.comment, row.created_at]
        );
        revCount++;
      } catch (e) {
        console.error(`   ❌ Failed review:`, e.message);
      }
    }
    console.log(`   ✅ ${revCount} migrated\n`);
    stats.reviews = { count: revCount, skipped: 0 };

    // Summary
    console.log('═══════════════════════════════════════');
    console.log('📊 MIGRATION SUMMARY');
    console.log('═══════════════════════════════════════');
    console.log(`👥 Users:       ${stats.users.count} migrated`);
    console.log(`📦 Products:    ${stats.products.count} migrated`);
    console.log(`💬 Messages:    ${stats.messages.count} migrated`);
    console.log(`💰 Sold Items:  ${stats.sold_items.count} migrated`);
    console.log(`❤️  Wishlist:    ${stats.wishlist.count} migrated`);
    console.log(`⭐ Reviews:     ${stats.reviews.count} migrated`);
    console.log('═══════════════════════════════════════');
    console.log('✅ MIGRATION COMPLETE!\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    sqliteDb.close();
    await pgPool.end();
    console.log('🔒 Database connections closed');
  }
}

// Run migration
migrate().catch(console.error);
