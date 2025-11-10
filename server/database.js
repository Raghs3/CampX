// Database configuration - supports both SQLite (local) and PostgreSQL (production)
const path = require('path');

// Check if we're using PostgreSQL (production) or SQLite (local)
const usePostgres = process.env.DATABASE_URL ? true : false;

let db;

if (usePostgres) {
  // PostgreSQL for production
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  // Helper function to convert SQLite ? placeholders to PostgreSQL $1, $2, etc.
  const convertPlaceholders = (query) => {
    let index = 0;
    return query.replace(/\?/g, () => `$${++index}`);
  };

  // Wrapper to make PostgreSQL queries work like SQLite
  db = {
    get: async (query, params, callback) => {
      try {
        const pgQuery = convertPlaceholders(query);
        const result = await pool.query(pgQuery, params);
        const row = result ? result.rows[0] : null;
        if (callback && typeof callback === 'function') {
          callback(null, row);
        }
        return row;
      } catch (err) {
        console.error('DB.get error:', err.message, 'Query:', query);
        if (callback && typeof callback === 'function') {
          callback(err);
        } else {
          throw err;
        }
      }
    },
    all: async (query, params, callback) => {
      try {
        const pgQuery = convertPlaceholders(query);
        const result = await pool.query(pgQuery, params);
        const rows = result ? result.rows : [];
        if (callback && typeof callback === 'function') {
          callback(null, rows);
        }
        return rows;
      } catch (err) {
        console.error('DB.all error:', err.message, 'Query:', query);
        if (callback && typeof callback === 'function') {
          callback(err);
        } else {
          throw err;
        }
      }
    },
    run: async (query, params, callback) => {
      try {
        const pgQuery = convertPlaceholders(query);
        const result = await pool.query(pgQuery, params);
        // For INSERT queries with RETURNING, get the first column value as lastID
        const firstRow = result && result.rows ? result.rows[0] : null;
        const lastID = firstRow ? Object.values(firstRow)[0] : undefined;
        const changes = result ? result.rowCount : 0;
        if (callback && typeof callback === 'function') {
          callback.call({ lastID: lastID, changes: changes }, null);
        }
        return { lastID, changes };
      } catch (err) {
        console.error('DB.run error:', err.message, 'Query:', query);
        if (callback && typeof callback === 'function') {
          callback(err);
        } else {
          throw err;
        }
      }
    },
    pool: pool // Direct access to pool if needed
  };

  console.log('🐘 Using PostgreSQL database');
  
} else {
  // SQLite for local development
  const sqlite3 = require('sqlite3').verbose();
  const dbPath = path.join(__dirname, '../campus.db');
  
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('Database connection failed:', err.message);
    else console.log('💾 Using SQLite database (local development)');
  });
}

module.exports = db;
