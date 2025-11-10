
// CampX Project Server (Frontend + Backend on same port)

const path = require("path");

// Load environment variables from .env file
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcryptjs");
const bodyParser = require("body-parser");
const cors = require("cors");
const session = require("express-session");
const fs = require("fs");
const multer = require("multer");
const crypto = require("crypto");

// Multer setup for product images
const upload = multer({
  dest: path.join(__dirname, "../uploads/"),
  limits: { fileSize: 5 * 1024 * 1024, files: 3 },
});

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || 'localhost';

app.use(cors({
  origin: process.env.CORS_ORIGIN || true,
  credentials: true
}));

// ====== MIDDLEWARES ======
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// Session Middleware
app.use(session({
  secret: "campx_secret_key",
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // HTTPS → true
}));

// Serve static files from public directory (HTML files)
app.use(express.static(path.join(__dirname, "../public")));
// Serve static files from root (styles, js folders)
app.use(express.static(path.join(__dirname, "../")));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// ====== DATABASE CONNECTION ======
// Automatically uses PostgreSQL in production, SQLite locally
const db = require('./database');

// Initialize PostgreSQL tables if using Postgres
if (process.env.DATABASE_URL) {
  const initializePostgresDB = require('./init-postgres');
  initializePostgresDB().catch(err => console.error('Failed to initialize PostgreSQL:', err));
}


// DATA STRUCTURES

const deletedStack = [];
const editHistoryStack = [];
const messageQueue = [];
const userCache = new Map();

// ====== AUTHENTICATION MIDDLEWARE ======
// Middleware to check if user is logged in
function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }
  next();
}

// Middleware to check if user's email is verified
function requireVerifiedEmail(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }
  
  // Check if user exists and is verified in database
  db.get('SELECT email_verified FROM users WHERE user_id = ?', [req.session.user.user_id], (err, user) => {
    if (err || !user) {
      req.session.destroy();
      return res.status(401).json({ error: 'Invalid session. Please log in again.' });
    }
    
    if (!user.email_verified) {
      req.session.destroy();
      return res.status(403).json({ error: 'Email not verified. Please verify your email first.' });
    }
    
    next();
  });
}

// ====== EMAIL VERIFICATION FUNCTION ======
async function sendVerificationEmail(email, token, fullName) {
  try {
    // Debug: Check environment variables
    console.log('📧 Email Configuration Check:');
    console.log('  EMAIL_SERVICE:', process.env.EMAIL_SERVICE ? '✓' : '✗');
    console.log('  EMAIL_USER:', process.env.EMAIL_USER ? '✓' : '✗');
    console.log('  EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '✓' : '✗');
    
    // Check if email service is configured
    if (!process.env.EMAIL_SERVICE || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn('⚠️ Email service not configured. Verification link:');
      const baseUrl = process.env.BASE_URL || `http://${HOST}:${PORT}`;
      console.warn(`${baseUrl}/verify-email?token=${token}`);
      return false;
    }

    const nodemailer = require('nodemailer');
    
    console.log('📨 Creating email transporter...');
    
    // Create transporter based on service
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE, // 'gmail', 'outlook', etc.
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    // Verification link
    const baseUrl = process.env.BASE_URL || `http://${HOST}:${PORT}`;
    const verificationLink = `${baseUrl}/verify-email?token=${token}`;

    // Email options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'CampX Marketplace - Verify Your Email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #7b2ff7;">Welcome to CampX Marketplace, ${fullName}!</h2>
          <p>Thank you for signing up. Please verify your email address to complete your registration.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" 
               style="background-color: #7b2ff7; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            Or copy and paste this link in your browser:<br>
            <a href="${verificationLink}">${verificationLink}</a>
          </p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            This link will expire in 24 hours. If you didn't create an account, please ignore this email.
          </p>
        </div>
      `
    };

    // Send email
    await transporter.sendMail(mailOptions);
    console.log('✅ Verification email sent to:', email);
    return true;
  } catch (error) {
    console.error('❌ Failed to send verification email:', error.message);
    console.error('   Error details:', error);
    const baseUrl = process.env.BASE_URL || `http://${HOST}:${PORT}`;
    console.warn(`   Verification link: ${baseUrl}/verify-email?token=${token}`);
    return false;
  }
}

// AUTH ROUTES (Signup + Login)

// SIGNUP (no phone, no role required)
app.post("/api/register", async (req, res) => {
  const { full_name, email, phone, password } = req.body;
  console.log(" Signup request received:", req.body);

  if (!full_name || !email || !password)
    return res.status(400).json({ message: "All fields required" });

  const password_hash = bcrypt.hashSync(password, 10);
  
  // Generate verification token
  const verification_token = crypto.randomBytes(32).toString('hex');
  const token_expires = Date.now() + (24 * 60 * 60 * 1000); // 24 hours from now

  const query = `
    INSERT INTO users (full_name, email, password_hash, phone, email_verified, verification_token, token_expires)
    VALUES (?, ?, ?, ?, 0, ?, ?)
    RETURNING user_id
  `;

  db.run(query, [full_name, email, password_hash, phone, verification_token, token_expires], async function (err) {
    if (err) {
      console.error("Signup DB Error:", err.message);
      if (err.message.includes("UNIQUE constraint failed")) {
        return res.status(400).json({ message: "Email already exists!" });
      }
      return res.status(500).json({ message: "Database error: " + err.message });
    }
    
    // Send verification email
    const emailSent = await sendVerificationEmail(email, verification_token, full_name);
    
    if (emailSent) {
      res.json({ 
        message: "Signup successful! Please check your email to verify your account.",
        emailSent: true
      });
    } else {
      res.json({ 
        message: "Signup successful! However, we couldn't send the verification email. Please contact support.",
        emailSent: false
      });
    }
  });
});

//  LOGIN (with bcrypt + session + email verification check)
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  console.log(" Login attempt:", email);

  db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
    if (err) return res.status(500).json({ message: "Database error: " + err.message });
    if (!user) return res.status(400).json({ message: "User not found!" });

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) return res.status(401).json({ message: "Invalid password!" });

    // Check if email is verified
    if (!user.email_verified) {
      return res.status(403).json({ 
        message: "Please verify your email before logging in. Check your inbox for the verification link.",
        emailVerified: false,
        canResend: true
      });
    }

    // Save session
    req.session.user = {
      user_id: user.user_id,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone
    };

    res.json({
      message: "Login successful!",
      user: req.session.user
    });
  });
});

// Get current logged-in user
app.get("/api/current-user", (req, res) => {
  if (req.session.user) res.json({ user: req.session.user });
  else res.status(401).json({ message: "No user logged in" });
});

// Logout (destroy session)
app.post("/api/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ message: "Logged out successfully" });
  });
});

// Email Verification Route
app.get("/verify-email", (req, res) => {
  const { token } = req.query;
  
  if (!token) {
    return res.status(400).send(`
      <html>
        <head><title>Invalid Link</title></head>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h2 style="color: #f44336;">❌ Invalid Verification Link</h2>
          <p>The verification link is missing or invalid.</p>
          <a href="/login.html" style="color: #7b2ff7;">Go to Login</a>
        </body>
      </html>
    `);
  }

  db.get(
    `SELECT * FROM users WHERE verification_token = ?`,
    [token],
    (err, user) => {
      if (err) {
        console.error("Verification error:", err.message);
        return res.status(500).send(`
          <html>
            <head><title>Error</title></head>
            <body style="font-family: Arial; text-align: center; padding: 50px;">
              <h2 style="color: #f44336;">❌ Database Error</h2>
              <p>An error occurred. Please try again later.</p>
            </body>
          </html>
        `);
      }

      if (!user) {
        return res.status(404).send(`
          <html>
            <head><title>Invalid Token</title></head>
            <body style="font-family: Arial; text-align: center; padding: 50px;">
              <h2 style="color: #f44336;">❌ Invalid Token</h2>
              <p>This verification link is invalid or has already been used.</p>
              <a href="/styles/signup.html" style="color: #7b2ff7;">Sign Up Again</a>
            </body>
          </html>
        `);
      }

      // Check if token has expired
      if (Date.now() > user.token_expires) {
        return res.status(400).send(`
          <html>
            <head><title>Token Expired</title></head>
            <body style="font-family: Arial; text-align: center; padding: 50px;">
              <h2 style="color: #ff9800;">⏰ Verification Link Expired</h2>
              <p>This verification link has expired. Please sign up again.</p>
              <a href="/styles/signup.html" style="color: #7b2ff7;">Sign Up Again</a>
            </body>
          </html>
        `);
      }

      // Mark email as verified
      db.run(
        `UPDATE users SET email_verified = 1, verification_token = NULL, token_expires = NULL WHERE user_id = ?`,
        [user.user_id],
        (updateErr) => {
          if (updateErr) {
            console.error("Update verification error:", updateErr.message);
            return res.status(500).send(`
              <html>
                <head><title>Error</title></head>
                <body style="font-family: Arial; text-align: center; padding: 50px;">
                  <h2 style="color: #f44336;">❌ Update Error</h2>
                  <p>Failed to verify email. Please try again.</p>
                </body>
              </html>
            `);
          }

          res.send(`
            <html>
              <head><title>Email Verified</title></head>
              <body style="font-family: Arial; text-align: center; padding: 50px;">
                <h2 style="color: #4caf50;">✅ Email Verified Successfully!</h2>
                <p>Your email has been verified. You can now log in to your account.</p>
                <a href="/login.html" style="display: inline-block; margin-top: 20px; padding: 12px 30px; background-color: #7b2ff7; color: white; text-decoration: none; border-radius: 5px;">
                  Go to Login
                </a>
              </body>
            </html>
          `);
        }
      );
    }
  );
});

// Resend Verification Email
app.post("/api/resend-verification", async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
    if (err) {
      return res.status(500).json({ message: "Database error: " + err.message });
    }
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // If already verified
    if (user.email_verified) {
      return res.status(400).json({ message: "Email is already verified. You can log in now." });
    }
    
    // Generate new verification token
    const verification_token = crypto.randomBytes(32).toString('hex');
    const token_expires = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
    
    // Update user with new token
    db.run(
      `UPDATE users SET verification_token = ?, token_expires = ? WHERE user_id = ?`,
      [verification_token, token_expires, user.user_id],
      async function(updateErr) {
        if (updateErr) {
          return res.status(500).json({ message: "Failed to generate new verification link" });
        }
        
        // Send new verification email
        const emailSent = await sendVerificationEmail(email, verification_token, user.full_name);
        
        if (emailSent) {
          res.json({ 
            message: "Verification email sent! Please check your inbox.",
            emailSent: true
          });
        } else {
          res.json({ 
            message: "We couldn't send the email, but you can use this link to verify manually. Check the server console.",
            emailSent: false
          });
        }
      }
    );
  });
});

// PRODUCTS ROUTES
// Add a new product (requires authentication and verified email)
app.post("/api/products", requireVerifiedEmail, upload.any(), (req, res) => {
  const user = req.session.user;
  if (!user) {
    return res.status(403).json({ error: "Please log in to add a product" });
  }
  const { title, category, price, condition, description, contact_info, quantity } = req.body || {};
  // Server-side validation: ensure required fields are present before DB insert
  if (!title || title.toString().trim().length === 0) {
    console.warn('Add product failed: missing title', { body: req.body, files: req.files });
    return res.status(400).json({ error: 'Product title is required' });
  }
  // Save file paths (relative to /uploads) - with upload.any(), files come as array
  const filesArray = req.files || [];
  const imageMap = {};
  filesArray.forEach(f => {
    if (f.fieldname === 'image1' || f.fieldname === 'image2' || f.fieldname === 'image3') {
      imageMap[f.fieldname] = `/uploads/${path.basename(f.path)}`;
    }
  });
  const images = [imageMap.image1 || null, imageMap.image2 || null, imageMap.image3 || null];
  const stock = parseInt(quantity) || 1;
  db.run(
    `INSERT INTO products (seller_id, title, category, price, condition, description, contact_method, quantity, image1, image2, image3)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     RETURNING product_id`,
    [user.user_id, title, category, price, condition, description, contact_info, stock, images[0], images[1], images[2]],
    function (err) {
      if (err) {
        console.error("Add product failed:", err.message);
        return res.status(500).json({ error: err.message });
      }
      res.json({ product_id: this.lastID, message: "Product added successfully" });
    }
  );
});

// Get products with optional filters: ?category=...&q=...
app.get("/api/products", (req, res) => {
  const { category, q } = req.query || {};
  const clauses = [];
  const params = [];
  if (category && String(category).trim().length) {
    clauses.push('products.category = ?');
    params.push(String(category).trim());
  }
  if (q && String(q).trim().length) {
    const like = `%${String(q).trim()}%`;
    clauses.push('(products.title LIKE ? OR products.description LIKE ? OR products.category LIKE ? )');
    params.push(like, like, like);
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const sql = `SELECT products.*, users.full_name as seller_name
               FROM products
               LEFT JOIN users ON products.seller_id = users.user_id
               ${where}
               ORDER BY products.created_at DESC`;
  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error("Fetch failed:", err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get single product with seller info
app.get('/api/products/:id', (req, res) => {
  const id = req.params.id;
  db.get(
    `SELECT p.*, u.user_id as seller_id, u.full_name as seller_name, u.email as seller_email, u.phone as seller_phone, u.avatar as seller_avatar
     FROM products p
     LEFT JOIN users u ON p.seller_id = u.user_id
     WHERE p.product_id = ?`,
    [id],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: 'Product not found' });
      res.json({ product: row });
    }
  );
});

// Delete product (and push to stack) - requires authentication
app.delete("/api/products/:id", requireVerifiedEmail, (req, res) => {
  const id = req.params.id;
  const user = req.session.user;
  db.get("SELECT * FROM products WHERE product_id = ?", [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Product not found' });

    // Authorization: only seller can delete
    if (!user || user.user_id !== row.seller_id) {
      return res.status(403).json({ error: 'Not authorized to delete this product' });
    }

    deletedStack.push(row);
    db.run("DELETE FROM products WHERE product_id = ?", [id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Product deleted", undoAvailable: deletedStack.length > 0 });
    });
  });
});

// Update product - requires authentication
app.put("/api/products/:id", requireVerifiedEmail, (req, res) => {
  const { id } = req.params;
  const { title, category, price, condition, description, contact_info, status, image1, image2, image3 } = req.body;
  const user = req.session.user;
  db.get("SELECT * FROM products WHERE product_id = ?", [id], (err, oldRow) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!oldRow) return res.status(404).json({ error: "Product not found for editing" });

    // Authorization: only seller can edit
    if (!user || user.user_id !== oldRow.seller_id) {
      return res.status(403).json({ error: 'Not authorized to edit this product' });
    }

    editHistoryStack.push(oldRow);

    db.run(
      `UPDATE products
       SET title = ?, category = ?, price = ?, condition = ?, description = ?, contact_method = ?, status = ?, image1 = ?, image2 = ?, image3 = ?
       WHERE product_id = ?`,
      [title, category, price, condition, description, contact_info, status || oldRow.status, image1 || oldRow.image1, image2 || oldRow.image2, image3 || oldRow.image3, id],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({
          message: "Product updated successfully",
          undoAvailable: editHistoryStack.length > 0,
        });
      }
    );
  });
});

// Book a product (mark as sold) — buyer action - requires authentication
app.post('/api/products/:id/book', requireVerifiedEmail, (req, res) => {
  const { id } = req.params;
  const user = req.session.user;
  try {
    console.log(`[BOOK] Hit /api/products/${id}/book - sessionUser: ${user ? user.user_id : 'none'} - cookie: ${req.headers.cookie || 'no-cookie'}`);
  } catch (e) { console.log('[BOOK] debug log failed', e && e.message); }
  if (!user) return res.status(403).json({ error: 'Please login to book products' });

  db.get('SELECT * FROM products WHERE product_id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Product not found' });

    if (row.status && row.status.toLowerCase() === 'sold') {
      return res.status(400).json({ error: 'Product already sold' });
    }

    if (user.user_id === row.seller_id) {
      return res.status(400).json({ error: 'Sellers cannot book their own product' });
    }

    // Decrease quantity by 1
    const newQuantity = (row.quantity || 1) - 1;
    const newStatus = newQuantity <= 0 ? 'Sold' : row.status;

    // Update product: decrease quantity and mark as sold if quantity reaches 0
    db.run(
      'UPDATE products SET quantity = ?, status = ? WHERE product_id = ?',
      [newQuantity, newStatus, id],
      function (err) {
      if (err) return res.status(500).json({ error: err.message });

      // ALWAYS insert into sold_items for each purchase
      db.run(
        `INSERT INTO sold_items (product_id, seller_id, buyer_id, title, category, price, condition, description, contact_method, image1, image2, image3)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         RETURNING sold_id`,
        [id, row.seller_id, user.user_id, row.title, row.category, row.price, row.condition, row.description, row.contact_method || null, row.image1 || null, row.image2 || null, row.image3 || null],
        function (sErr) {
          if (sErr) {
            console.error('Failed to insert into sold_items:', sErr.message);
            return res.status(500).json({ error: 'Failed to record sale' });
          }

          // Build a friendly message to notify the seller with buyer contact info
          const buyerName = user.full_name || 'Buyer';
          const buyerEmail = user.email || 'no-email';
          const buyerPhone = user.phone || 'no-phone';
          const messageText = `Your item (id: ${id}, title: ${row.title || 'item'}) was booked by ${buyerName}. Contact: ${buyerEmail}, ${buyerPhone}.`;

          // Insert a message into messages table to notify seller
          db.run(
            `INSERT INTO messages (item_id, sender_id, receiver_id, message_text) VALUES (?, ?, ?, ?)
             RETURNING message_id`,
            [id, user.user_id, row.seller_id, messageText],
            function (mErr) {
              if (mErr) {
                console.error('Failed to insert booking notification message:', mErr.message);
                return res.json({ message: 'Product booked successfully', product_id: id, messageSent: false, messageError: mErr.message });
              }

              const createdMessageId = this.lastID;

          // This uses dynamic requires so the app still runs if nodemailer/twilio aren't installed.
          (async () => {
            let emailSent = false;
            let smsSent = false;

            // Send email via SMTP if env vars provided
            try {
              if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && row.seller_email) {
                try {
                  const nodemailer = require('nodemailer');
                  const transporter = nodemailer.createTransport({
                    host: process.env.SMTP_HOST,
                    port: parseInt(process.env.SMTP_PORT || '587', 10),
                    secure: (process.env.SMTP_SECURE === 'true'),
                    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
                  });

                  const mailOptions = {
                    from: process.env.SMTP_FROM || process.env.SMTP_USER,
                    to: row.seller_email,
                    subject: `Your item was booked: ${row.title || 'Item'}`,
                    text: messageText,
                  };

                  await transporter.sendMail(mailOptions);
                  emailSent = true;
                } catch (emailErr) {
                  console.error('Email send failed:', emailErr && emailErr.message ? emailErr.message : emailErr);
                }
              }
            } catch (e) {
              console.warn('nodemailer not available or email config missing, skipping email:', e && e.message);
            }

            // Send SMS via Twilio if configured and seller phone present
            try {
              if (process.env.TWILIO_SID && process.env.TWILIO_TOKEN && process.env.TWILIO_FROM && row.seller_phone) {
                try {
                  const Twilio = require('twilio');
                  const tw = Twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
                  await tw.messages.create({ body: messageText, from: process.env.TWILIO_FROM, to: row.seller_phone });
                  smsSent = true;
                } catch (smsErr) {
                  console.error('SMS send failed:', smsErr && smsErr.message ? smsErr.message : smsErr);
                }
              }
            } catch (e) {
              console.warn('twilio not available or sms config missing, skipping sms:', e && e.message);
            }
            
            // Return success response
            return res.json({
              message: 'Product booked successfully',
              product_id: id,
              messageSent: true,
              message_id: createdMessageId,
              emailSent,
              smsSent,
            });
          })();
        }
      );
        }
      );
    });
  });
});

//  FRONTEND ROUTES 

//  Get public user info (seller) by id
app.get('/api/users/:id', (req, res) => {
  const id = req.params.id;
  db.get(`SELECT user_id, full_name, email, phone, avatar FROM users WHERE user_id = ?`, [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'User not found' });
    res.json({ user: row });
  });
});

//  Send a message to another user (requires login and verification)
app.post('/api/messages', requireVerifiedEmail, (req, res) => {
  const user = req.session.user;
  if (!user) return res.status(403).json({ error: 'Please login to send messages' });

  const { item_id, receiver_id, message_text } = req.body;
  if (!receiver_id || !message_text) return res.status(400).json({ error: 'receiver_id and message_text required' });

  db.run(
    `INSERT INTO messages (item_id, sender_id, receiver_id, message_text) VALUES (?, ?, ?, ?)
     RETURNING message_id`,
    [item_id || null, user.user_id, receiver_id, message_text],
    function (err) {
      if (err) {
        console.error(' Message insert failed:', err.message);
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: ' Message sent', message_id: this.lastID });
    }
  );
});

// Get messages for the current logged-in user (inbox) - requires authentication
app.get('/api/messages', requireVerifiedEmail, (req, res) => {
  const user = req.session.user;
  if (!user) return res.status(403).json({ error: 'Please login to view messages' });

  db.all(
    `SELECT m.*, u.full_name as sender_name, u.email as sender_email, p.title as item_title
     FROM messages m
     LEFT JOIN users u ON m.sender_id = u.user_id
     LEFT JOIN products p ON m.item_id = p.product_id
     WHERE m.receiver_id = ?
     ORDER BY m.message_id DESC`,
    [user.user_id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ messages: rows });
    }
  );
});

// Get single message by id (must be receiver)
app.get('/api/messages/:id', (req, res) => {
  const user = req.session.user;
  if (!user) return res.status(403).json({ error: 'Please login to view messages' });
  const id = req.params.id;

  db.get(
    `SELECT m.*, u.full_name as sender_name, u.email as sender_email, p.title as item_title
     FROM messages m
     LEFT JOIN users u ON m.sender_id = u.user_id
     LEFT JOIN products p ON m.item_id = p.product_id
     WHERE m.message_id = ? AND m.receiver_id = ?`,
    [id, user.user_id],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: 'Message not found' });
      res.json({ message: row });
    }
  );
});

// Get sold items (for current user or all if admin)
app.get('/api/sold', (req, res) => {
  // Return sold items with seller and buyer info
  db.all(
    `SELECT s.*, u.full_name as seller_name, u.email as seller_email, b.full_name as buyer_name, b.email as buyer_email
     FROM sold_items s
     LEFT JOIN users u ON s.seller_id = u.user_id
     LEFT JOIN users b ON s.buyer_id = b.user_id
     ORDER BY s.sold_at DESC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      try { console.log(`[SOLD] /api/sold returned ${rows.length} rows`); } catch (e) {}
      res.json({ items: rows });
    }
  );
});

// ============ WISHLIST ROUTES ============
// Add to wishlist - requires authentication
app.post('/api/wishlist', requireVerifiedEmail, (req, res) => {
  const user = req.session.user;
  if (!user) return res.status(403).json({ error: 'Please login to add to wishlist' });
  const { product_id } = req.body;
  if (!product_id) return res.status(400).json({ error: 'product_id required' });

  db.get('SELECT * FROM wishlist WHERE user_id = ? AND product_id = ?', [user.user_id, product_id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (row) return res.status(400).json({ error: 'Already in wishlist' });

    db.run('INSERT INTO wishlist (user_id, product_id) VALUES (?, ?) RETURNING wishlist_id', [user.user_id, product_id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: ' Added to wishlist', wishlist_id: this.lastID });
    });
  });
});

// Remove from wishlist by product id for current user - requires authentication
app.delete('/api/wishlist/:productId', requireVerifiedEmail, (req, res) => {
  const user = req.session.user;
  if (!user) return res.status(403).json({ error: 'Please login to remove from wishlist' });
  const { productId } = req.params;

  db.run('DELETE FROM wishlist WHERE user_id = ? AND product_id = ?', [user.user_id, productId], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Not found in wishlist' });
    res.json({ message: ' Removed from wishlist' });
  });
});

// Get current user's wishlist with product details - requires authentication
app.get('/api/wishlist', requireVerifiedEmail, (req, res) => {
  const user = req.session.user;
  if (!user) return res.status(403).json({ error: 'Please login to view wishlist' });

  db.all(
    `SELECT w.wishlist_id, p.*, u.full_name as seller_name
     FROM wishlist w
     JOIN products p ON w.product_id = p.product_id
     LEFT JOIN users u ON p.seller_id = u.user_id
     WHERE w.user_id = ?`,
    [user.user_id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ items: rows });
    }
  );
});

// ============ REVIEW ROUTES ============
// Submit a review (buyer reviews seller after purchase) - requires authentication
app.post('/api/reviews', requireVerifiedEmail, (req, res) => {
  const user = req.session.user;
  if (!user) return res.status(403).json({ error: 'Please login to submit a review' });
  
  const { seller_id, product_id, rating, review_text } = req.body;
  
  if (!seller_id || !rating) {
    return res.status(400).json({ error: 'seller_id and rating are required' });
  }
  
  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }
  
  // Verify buyer actually purchased from this seller
  db.get(
    'SELECT * FROM sold_items WHERE buyer_id = ? AND seller_id = ? AND product_id = ?',
    [user.user_id, seller_id, product_id || null],
    (err, soldItem) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!soldItem) {
        return res.status(403).json({ error: 'You can only review sellers you have purchased from' });
      }
      
      // Check if already reviewed
      db.get(
        'SELECT * FROM reviews WHERE buyer_id = ? AND seller_id = ? AND product_id = ?',
        [user.user_id, seller_id, product_id],
        (err, existing) => {
          if (err) return res.status(500).json({ error: err.message });
          if (existing) {
            return res.status(400).json({ error: 'You have already reviewed this transaction' });
          }
          
          // Insert review
          db.run(
            'INSERT INTO reviews (seller_id, buyer_id, product_id, rating, review_text) VALUES (?, ?, ?, ?, ?) RETURNING review_id',
            [seller_id, user.user_id, product_id, rating, review_text || ''],
            function(err) {
              if (err) return res.status(500).json({ error: err.message });
              res.json({ message: '✅ Review submitted successfully', review_id: this.lastID });
            }
          );
        }
      );
    }
  );
});

// Get reviews for a seller
app.get('/api/reviews/:sellerId', (req, res) => {
  const { sellerId } = req.params;
  
  db.all(
    `SELECT r.*, u.full_name as buyer_name, p.title as product_title
     FROM reviews r
     LEFT JOIN users u ON r.buyer_id = u.user_id
     LEFT JOIN products p ON r.product_id = p.product_id
     WHERE r.seller_id = ?
     ORDER BY r.created_at DESC`,
    [sellerId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      
      // Calculate average rating
      const avgRating = rows.length > 0 
        ? (rows.reduce((sum, r) => sum + r.rating, 0) / rows.length).toFixed(1)
        : 0;
      
      res.json({ reviews: rows, average_rating: parseFloat(avgRating), total_reviews: rows.length });
    }
  );
});


// Default route → redirect to login page
app.get("/", (req, res) => {
  res.redirect("/login.html");
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/login.html"));
});

app.get("/signup", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/signup.html"));
});

app.get("/home", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

//  START SERVER 
app.listen(PORT, () => {
  console.log(` CampX running at http://${HOST}:${PORT}`);
  if (process.env.BASE_URL) {
    console.log(` Public URL: ${process.env.BASE_URL}`);
  }
});












