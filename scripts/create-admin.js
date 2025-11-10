// Create an admin user
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createAdmin() {
  console.log('🛡️  CampX Admin User Creator\n');

  const fullName = await question('Enter admin full name: ');
  const email = await question('Enter admin email (@vit.edu): ');
  const password = await question('Enter admin password (min 6 chars): ');

  // Validate
  if (!fullName || !email || !password) {
    console.log('❌ All fields are required');
    rl.close();
    return;
  }

  if (!email.toLowerCase().endsWith('@vit.edu')) {
    console.log('❌ Email must end with @vit.edu');
    rl.close();
    return;
  }

  if (password.length < 6) {
    console.log('❌ Password must be at least 6 characters');
    rl.close();
    return;
  }

  try {
    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Connect to database
    const db = new sqlite3.Database('./campus.db');

    // Check if user exists
    db.get('SELECT email FROM users WHERE email = ?', [email], (err, row) => {
      if (row) {
        console.log('❌ User with this email already exists');
        db.close();
        rl.close();
        return;
      }

      // Insert admin user
      db.run(
        `INSERT INTO users (full_name, email, password_hash, role, email_verified) 
         VALUES (?, ?, ?, 'admin', 1)`,
        [fullName, email, password_hash],
        function(err) {
          if (err) {
            console.error('❌ Error creating admin:', err.message);
          } else {
            console.log('\n✅ Admin user created successfully!');
            console.log(`   User ID: ${this.lastID}`);
            console.log(`   Name: ${fullName}`);
            console.log(`   Email: ${email}`);
            console.log(`   Role: admin`);
            console.log('\n🔗 Access admin panel at: http://localhost:5000/admin.html');
          }
          
          db.close();
          rl.close();
        }
      );
    });
  } catch (error) {
    console.error('❌ Error:', error);
    rl.close();
  }
}

createAdmin();
