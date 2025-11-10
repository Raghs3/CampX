// Script to migrate data from SQLite to PostgreSQL

const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL not found in server/.env');
  console.log('Please add your Render PostgreSQL URL to server/.env:');
  console.log('DATABASE_URL=your_postgres_url_here');
  process.exit(1);
}

const sqliteDb = new sqlite3.Database('./campus.db');
const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  console.log('🔄 Starting migration from SQLite to PostgreSQL...\n');

  try {
    // Get all products from SQLite
    const products = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM products', (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    console.log(`📦 Found ${products.length} products in SQLite`);

    if (products.length === 0) {
      console.log('⚠️  No products to migrate');
      await cleanup();
      return;
    }

    // Insert products into PostgreSQL
    let successCount = 0;
    let skipCount = 0;

    for (const product of products) {
      try {
        // Check if product already exists (by title and seller_id)
        const existing = await pgPool.query(
          'SELECT product_id FROM products WHERE title = $1 AND seller_id = $2',
          [product.title, product.seller_id]
        );

        if (existing.rows.length > 0) {
          console.log(`⏭️  Skipping duplicate: "${product.title}"`);
          skipCount++;
          continue;
        }

        // Insert product
        await pgPool.query(
          `INSERT INTO products (
            title, description, price, category, 
            condition, seller_id, image1, image2, image3, 
            created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            product.title,
            product.description,
            product.price,
            product.category,
            product.condition,
            product.seller_id,
            product.image1,
            product.image2,
            product.image3,
            product.created_at || new Date().toISOString()
          ]
        );

        console.log(`✅ Migrated: "${product.title}" - ₹${product.price}`);
        successCount++;
      } catch (err) {
        console.error(`❌ Failed to migrate "${product.title}":`, err.message);
      }
    }

    console.log(`\n✅ Migration complete!`);
    console.log(`   ${successCount} products migrated`);
    console.log(`   ${skipCount} products skipped (duplicates)`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await cleanup();
  }
}

async function cleanup() {
  sqliteDb.close();
  await pgPool.end();
  console.log('\n🔒 Database connections closed');
}

// Run migration
migrate().catch(console.error);
