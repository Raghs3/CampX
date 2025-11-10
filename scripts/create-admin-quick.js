// Quick admin creation script
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const db = new sqlite3.Database('./campus.db');

// CHANGE THESE CREDENTIALS!
const ADMIN_EMAIL = 'admin@vit.edu';
const ADMIN_PASSWORD = 'admin123';
const ADMIN_NAME = 'Admin User';

async function createAdmin() {
  console.log('🛡️  Creating admin user...\n');

  try {
    const password_hash = await bcrypt.hash(ADMIN_PASSWORD, 10);

    db.run(
      `INSERT INTO users (full_name, email, password_hash, role, email_verified) 
       VALUES (?, ?, ?, 'admin', 1)`,
      [ADMIN_NAME, ADMIN_EMAIL, password_hash],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE')) {
            console.log('❌ Admin already exists with email:', ADMIN_EMAIL);
            console.log('   To create a new admin, use a different email or delete existing user\n');
          } else {
            console.log('❌ Error:', err.message);
          }
        } else {
          console.log('✅ Admin user created!\n');
          console.log('📧 Email:', ADMIN_EMAIL);
          console.log('🔑 Password:', ADMIN_PASSWORD);
          console.log('\n⚠️  CHANGE PASSWORD AFTER FIRST LOGIN!');
          console.log('🔗 Admin panel: http://localhost:5000/admin.html\n');
        }
        db.close();
      }
    );
  } catch (error) {
    console.error('❌ Error:', error.message);
    db.close();
  }
}

createAdmin();
