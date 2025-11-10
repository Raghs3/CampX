
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

// Trust proxy - required for Render.com and other reverse proxies
app.set('trust proxy', 1);

app.use(cors({
  origin: process.env.CORS_ORIGIN || true,
  credentials: true
}));

// ====== MIDDLEWARES ======
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// Session Middleware with proper store
let sessionStore;
if (process.env.DATABASE_URL) {
  // Use PostgreSQL session store in production
  const pgSession = require('connect-pg-simple')(session);
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  sessionStore = new pgSession({
    pool: pool,
    tableName: 'session' // Will create this table automatically
  });
} else {
  // Use SQLite session store for local development
  const SQLiteStore = require('connect-sqlite3')(session);
  sessionStore = new SQLiteStore({
    db: 'sessions.db',
    dir: __dirname
  });
}

app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || "campx_secret_key",
  resave: false,
  saveUninitialized: false,
  proxy: true, // Trust the reverse proxy
  cookie: { 
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true, // Prevent XSS attacks
    sameSite: 'lax', // CSRF protection
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
}));

// Serve static files from public directory (HTML files)
app.use(express.static(path.join(__dirname, "../public")));
// Serve static files from root (styles, js folders)
app.use(express.static(path.join(__dirname, "../")));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Debug endpoint to check what files exist
app.get("/api/debug/files", (req, res) => {
  const fs = require('fs');
  const publicPath = path.join(__dirname, "../public");
  try {
    const files = fs.readdirSync(publicPath);
    res.json({ 
      publicPath, 
      files,
      resetPasswordExists: fs.existsSync(path.join(publicPath, "reset-password.html"))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ====== DATABASE CONNECTION ======
// Automatically uses PostgreSQL in production, SQLite locally
const db = require('./database');

// Initialize database and start server
async function startServer() {
  // Initialize PostgreSQL tables if using Postgres
  if (process.env.DATABASE_URL) {
    try {
      const initializePostgresDB = require('./init-postgres');
      await initializePostgresDB();
      console.log('✅ Database initialized');
    } catch (err) {
      console.error('❌ Failed to initialize PostgreSQL:', err);
      process.exit(1);
    }
  }

  // Start the server after database is ready
  app.listen(PORT, () => {
    console.log(` CampX running at http://${HOST}:${PORT}`);
    if (process.env.BASE_URL) {
      console.log(` Public URL: ${process.env.BASE_URL}`);
    }
  });
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

// For backwards compatibility - just use requireAuth (no email verification needed)
const requireVerifiedEmail = requireAuth;

// ====== EMAIL VERIFICATION FUNCTION ======
async function sendVerificationEmail(email, token, fullName) {
  try {
    const baseUrl = process.env.BASE_URL || `http://${HOST}:${PORT}`;
    const verificationLink = `${baseUrl}/verify-email?token=${token}`;
    
    // Check if SendGrid is configured
    if (process.env.SENDGRID_API_KEY) {
      // Use SendGrid directly (recommended for production)
      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      
      const msg = {
        to: email,
        from: process.env.SENDGRID_SENDER_EMAIL || 'noreply@campxmarketplace.com',
        subject: 'Verify Your Email - CampX Marketplace',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
                    <!-- Header -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #7b2ff7 0%, #f107a3 100%); padding: 40px 20px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🎓 CampX Marketplace</h1>
                      </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px 30px;">
                        <h2 style="color: #333; margin-top: 0;">Welcome, ${fullName}!</h2>
                        <p style="color: #666; font-size: 16px; line-height: 1.6;">
                          Thank you for joining CampX Marketplace. To complete your registration and start buying and selling on our platform, please verify your email address.
                        </p>
                        <!-- Button -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                          <tr>
                            <td align="center">
                              <a href="${verificationLink}" 
                                 style="background-color: #7b2ff7; color: #ffffff; padding: 14px 40px; text-decoration: none; border-radius: 6px; display: inline-block; font-size: 16px; font-weight: bold;">
                                Verify Email Address
                              </a>
                            </td>
                          </tr>
                        </table>
                        <p style="color: #999; font-size: 14px; line-height: 1.6;">
                          Or copy and paste this link into your browser:<br>
                          <a href="${verificationLink}" style="color: #7b2ff7; word-break: break-all;">${verificationLink}</a>
                        </p>
                        <p style="color: #999; font-size: 14px; line-height: 1.6;">
                          This link will expire in 1 hour for security purposes.
                        </p>
                      </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f8f8f8; padding: 20px 30px; text-align: center;">
                        <p style="color: #999; font-size: 12px; margin: 0;">
                          If you didn't create this account, please ignore this email.
                        </p>
                        <p style="color: #999; font-size: 12px; margin: 10px 0 0 0;">
                          © 2025 CampX Marketplace. All rights reserved.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `
      };
      
      await sgMail.send(msg);
      console.log(`✅ Verification email sent to ${email} via SendGrid`);
      return true;
      
    } else if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      // Fallback to nodemailer for local development
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Verify Your Email - CampX Marketplace',
        html: `
          <!DOCTYPE html>
          <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
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
              This link will expire in 1 hour. If you didn't create an account, please ignore this email.
            </p>
          </body>
          </html>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log(`✅ Verification email sent to ${email} via nodemailer`);
      return true;
      
    } else {
      // No email service configured
      console.warn('⚠️ Email service not configured. Verification link:');
      console.warn(`${verificationLink}`);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Failed to send verification email:', error.message);
    const baseUrl = process.env.BASE_URL || `http://${HOST}:${PORT}`;
    console.warn(`   Verification link: ${baseUrl}/verify-email?token=${token}`);
    return false;
  }
}

// ====== AI PRICE PREDICTION ======
const { predictPrice } = require('./price_prediction');

// ====== AI IMAGE ANALYSIS ======
const { analyzeImage } = require('./image_analysis');

/**
 * POST /api/predict-price
 * Predict fair price for a product using Gemini AI
 */
app.post("/api/predict-price", async (req, res) => {
  try {
    const { category, condition, title, description, userPrice } = req.body;
    
    if (!category || !condition) {
      return res.status(400).json({ 
        error: 'Category and condition are required' 
      });
    }
    
    console.log(`🔮 Predicting price for: ${category} - ${condition} - ${title || 'No title'}`);
    
    const prediction = await predictPrice(
      category, 
      condition, 
      title || '', 
      description || '', 
      userPrice || 0
    );
    
    res.json({
      success: true,
      category,
      condition,
      prediction
    });
    
  } catch (error) {
    console.error('❌ Price prediction error:', error);
    res.status(500).json({ 
      error: 'Failed to predict price',
      message: error.message 
    });
  }
});

/**
 * GET /api/price-categories
 * Get list of supported categories and conditions
 */
app.get("/api/price-categories", (req, res) => {
  res.json({
    categories: [
      'Books',
      'Electronics',
      'Furniture',
      'Clothing',
      'Sports',
      'Stationery',
      'Other'
    ],
    conditions: [
      'New',
      'Like New',
      'Good',
      'Fair',
      'Poor'
    ]
  });
});

/**
 * POST /api/upload-temp-image
 * Upload a temporary image for AI analysis (before product creation)
 */
app.post("/api/upload-temp-image", upload.single('image1'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }
    
    const imagePath = path.join(__dirname, '..', 'uploads', req.file.filename);
    console.log(`📸 Temp image uploaded: ${imagePath}`);
    
    res.json({ 
      success: true,
      imagePath: imagePath
    });
  } catch (error) {
    console.error('Temp image upload error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});


/**
 * POST /api/analyze-image
 * Analyze uploaded product image(s) using Gemini Vision AI
 * Returns: product details, category, condition, price, legitimacy check
 */
app.post("/api/analyze-image", async (req, res) => {
  try {
    const { imagePath, imagePaths } = req.body;
    
    // Support both single path and multiple paths
    const paths = imagePaths || (imagePath ? [imagePath] : null);
    
    if (!paths || paths.length === 0) {
      return res.status(400).json({ 
        error: 'At least one image path is required' 
      });
    }
    
    console.log(`🔍 Analyzing ${paths.length} image(s)`);
    
    // Call AI image analyzer with all images
    const analysis = await analyzeImage(paths);
    
    // Add shadow ban flag if not legitimate
    if (!analysis.is_legitimate || analysis.legitimacy_score < 70) {
      analysis.shadow_banned = true;
      analysis.admin_review_required = true;
      console.warn(`⚠️ Suspicious image flagged: ${analysis.flag_reason}`);
    } else {
      analysis.shadow_banned = false;
      analysis.admin_review_required = false;
    }
    
    res.json(analysis);
  } catch (error) {
    console.error('❌ Image analysis error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze image',
      message: error.message 
    });
  }
});

// AUTH ROUTES (Signup + Login)

// SIGNUP (no phone, no role required)
app.post("/api/register", async (req, res) => {
  const { full_name, email, phone, password } = req.body;
  console.log(" Signup request received:", req.body);

  if (!full_name || !email || !password)
    return res.status(400).json({ message: "All fields required" });

  // Validate VIT email domain (only in production)
  if (process.env.NODE_ENV === 'production' && !email.toLowerCase().endsWith('@vit.edu')) {
    return res.status(400).json({ 
      message: "Only VIT students can register. Please use your @vit.edu email address." 
    });
  }

  // Check if user already exists BEFORE creating
  db.get('SELECT email FROM users WHERE email = ?', [email], (err, existingUser) => {
    if (err) {
      return res.status(500).json({ message: "Database error: " + err.message });
    }
    
    if (existingUser) {
      return res.status(400).json({ 
        message: "An account with this email already exists. Please login instead.",
        userExists: true
      });
    }

    // Proceed with signup
    const password_hash = bcrypt.hashSync(password, 10);
    
    // Generate verification token
    const verification_token = crypto.randomBytes(32).toString('hex');
    const token_expires = Date.now() + (24 * 60 * 60 * 1000); // 24 hours from now

    // Auto-verify in local development, require verification in production
    const autoVerify = process.env.NODE_ENV === 'production' ? 0 : 1;

    const query = `
      INSERT INTO users (full_name, email, password_hash, phone, email_verified, verification_token, token_expires)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      RETURNING user_id
    `;

    db.run(query, [full_name, email, password_hash, phone, autoVerify, verification_token, token_expires], async function (err) {
      if (err) {
        console.error("Signup DB Error:", err.message);
        // Handle duplicate email error for both SQLite and PostgreSQL
        if (err.message.includes("UNIQUE constraint failed") || 
            err.message.includes("duplicate key value") || 
            err.code === '23505') {
          return res.status(400).json({ message: "Email already exists!" });
        }
        return res.status(500).json({ message: "Database error: " + err.message });
      }
      
      // Signup successful - send verification email
      console.log(`✅ User ${email} registered successfully`);
      
      // Send verification email
      try {
        await sendVerificationEmail(email, verification_token);
        res.json({ 
          message: "Signup successful! Please check your email to verify your account.",
          success: true
        });
      } catch (emailError) {
        console.error("❌ Failed to send verification email:", emailError);
        // Still return success - user can login after verifying later
        res.json({ 
          message: "Signup successful! Verification email sent (check spam folder).",
          success: true
        });
      }
    });
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

    // Check if email is verified (only required in production)
    if (process.env.NODE_ENV === 'production' && !user.email_verified) {
      return res.status(403).json({ 
        message: "Please verify your email before logging in. Check your inbox for the verification link.",
        emailNotVerified: true
      });
    }

    // Save session
    req.session.user = {
      user_id: user.user_id,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      role: user.role || 'student' // Include role for admin access
    };

    res.json({
      message: "Login successful!",
      user: req.session.user
    });
  });
});

// Forgot Password - Request Reset
app.post("/api/forgot-password", (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  // Check if user exists
  db.get('SELECT user_id, full_name FROM users WHERE email = ?', [email], (err, user) => {
    if (err) {
      return res.status(500).json({ message: "Database error: " + err.message });
    }
    
    if (!user) {
      // Don't reveal if email exists (security best practice)
      return res.json({ 
        message: "If an account with that email exists, a password reset link has been sent.",
        success: true
      });
    }

    // Generate reset token
    const reset_token = crypto.randomBytes(32).toString('hex');
    const token_expires = Date.now() + (60 * 60 * 1000); // 1 hour from now

    // Save reset token to database
    db.run(
      'UPDATE users SET verification_token = ?, token_expires = ? WHERE user_id = ?',
      [reset_token, token_expires, user.user_id],
      async (updateErr) => {
        if (updateErr) {
          return res.status(500).json({ message: "Failed to generate reset token" });
        }

        const baseUrl = process.env.BASE_URL || `http://${HOST}:${PORT}`;
        const resetLink = `${baseUrl}/reset-password.html?token=${reset_token}`;
        
        // Send email with SendGrid or nodemailer
        try {
          if (process.env.SENDGRID_API_KEY) {
            // Use SendGrid
            const sgMail = require('@sendgrid/mail');
            sgMail.setApiKey(process.env.SENDGRID_API_KEY);
            
            const msg = {
              to: email,
              from: process.env.SENDGRID_SENDER_EMAIL || 'noreply@campxmarketplace.com',
              subject: 'Reset Your Password - CampX Marketplace',
              html: `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
                    <tr>
                      <td align="center">
                        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
                          <!-- Header -->
                          <tr>
                            <td style="background: linear-gradient(135deg, #7b2ff7 0%, #f107a3 100%); padding: 40px 20px; text-align: center;">
                              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🔐 Password Reset</h1>
                            </td>
                          </tr>
                          <!-- Content -->
                          <tr>
                            <td style="padding: 40px 30px;">
                              <h2 style="color: #333; margin-top: 0;">Hi ${user.full_name},</h2>
                              <p style="color: #666; font-size: 16px; line-height: 1.6;">
                                We received a request to reset your password for your CampX Marketplace account. Click the button below to create a new password.
                              </p>
                              <!-- Button -->
                              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                                <tr>
                                  <td align="center">
                                    <a href="${resetLink}" 
                                       style="background-color: #7b2ff7; color: #ffffff; padding: 14px 40px; text-decoration: none; border-radius: 6px; display: inline-block; font-size: 16px; font-weight: bold;">
                                      Reset Password
                                    </a>
                                  </td>
                                </tr>
                              </table>
                              <p style="color: #999; font-size: 14px; line-height: 1.6;">
                                Or copy and paste this link into your browser:<br>
                                <a href="${resetLink}" style="color: #7b2ff7; word-break: break-all;">${resetLink}</a>
                              </p>
                              <p style="color: #999; font-size: 14px; line-height: 1.6;">
                                <strong>This link will expire in 1 hour.</strong>
                              </p>
                              <p style="color: #999; font-size: 14px; line-height: 1.6;">
                                If you didn't request a password reset, please ignore this email or contact support if you have concerns.
                              </p>
                            </td>
                          </tr>
                          <!-- Footer -->
                          <tr>
                            <td style="background-color: #f8f8f8; padding: 20px 30px; text-align: center;">
                              <p style="color: #999; font-size: 12px; margin: 0;">
                                For security reasons, this link can only be used once.
                              </p>
                              <p style="color: #999; font-size: 12px; margin: 10px 0 0 0;">
                                © 2025 CampX Marketplace. All rights reserved.
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
              `
            };
            
            await sgMail.send(msg);
            console.log(`✅ Password reset email sent to ${email} via SendGrid`);
            
          } else if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
            // Fallback to nodemailer
            const nodemailer = require('nodemailer');
            const transporter = nodemailer.createTransport({
              service: process.env.EMAIL_SERVICE || 'gmail',
              auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
              }
            });

            await transporter.sendMail({
              from: process.env.EMAIL_USER,
              to: email,
              subject: 'Reset Your Password - CampX Marketplace',
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h2 style="color: #7b2ff7;">Password Reset Request</h2>
                  <p>Hi ${user.full_name},</p>
                  <p>Click the button below to reset your password:</p>
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetLink}" 
                       style="background-color: #7b2ff7; color: white; padding: 12px 30px; 
                              text-decoration: none; border-radius: 5px; display: inline-block;">
                      Reset Password
                    </a>
                  </div>
                  <p style="color: #666; font-size: 14px;">
                    Or copy this link: <a href="${resetLink}">${resetLink}</a>
                  </p>
                  <p style="color: #666; font-size: 12px;">
                    This link expires in 1 hour. If you didn't request this, please ignore this email.
                  </p>
                </div>
              `
            });
            console.log(`✅ Password reset email sent to ${email} via nodemailer`);
            
          } else {
            console.log('🔑 Password reset link for', email);
            console.log('   Link:', resetLink);
          }
          
        } catch (emailError) {
          console.error('❌ Failed to send password reset email:', emailError.message);
          console.log('   Reset link:', resetLink);
        }

        res.json({ 
          message: "If an account with that email exists, a password reset link has been sent.",
          success: true,
          resetLink: process.env.NODE_ENV !== 'production' ? resetLink : undefined
        });
      }
    );
  });
});

// Reset Password - Submit New Password
app.post("/api/reset-password", (req, res) => {
  const { token, newPassword } = req.body;
  
  if (!token || !newPassword) {
    return res.status(400).json({ message: "Token and new password are required" });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  // Find user with valid reset token
  db.get(
    'SELECT user_id, email FROM users WHERE verification_token = ? AND token_expires > ?',
    [token, Date.now()],
    (err, user) => {
      if (err) {
        return res.status(500).json({ message: "Database error: " + err.message });
      }
      
      if (!user) {
        return res.status(400).json({ 
          message: "Invalid or expired reset token. Please request a new password reset.",
          expired: true
        });
      }

      // Hash new password
      const password_hash = bcrypt.hashSync(newPassword, 10);

      // Update password and clear reset token
      db.run(
        'UPDATE users SET password_hash = ?, verification_token = NULL, token_expires = NULL WHERE user_id = ?',
        [password_hash, user.user_id],
        (updateErr) => {
          if (updateErr) {
            return res.status(500).json({ message: "Failed to update password" });
          }

          console.log(`✅ Password reset successful for ${user.email}`);
          res.json({ 
            message: "Password reset successful! You can now login with your new password.",
            success: true
          });
        }
      );
    }
  );
});

// Get current logged-in user
app.get("/api/current-user", (req, res) => {
  if (req.session.user) res.json({ user: req.session.user });
  else res.status(401).json({ message: "No user logged in" });
});

// Update user profile
app.put("/api/profile", requireAuth, async (req, res) => {
  const { full_name, phone, new_password } = req.body;
  const userId = req.session.user.user_id;

  try {
    // Validate input
    if (!full_name || full_name.trim().length === 0) {
      return res.status(400).json({ message: "Full name is required" });
    }

    // If changing password, hash it
    let updates = {
      full_name: full_name.trim(),
      phone: phone || null
    };

    if (new_password) {
      if (new_password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      const password_hash = await bcrypt.hash(new_password, 10);
      updates.password_hash = password_hash;
    }

    // Build SQL query dynamically
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    
    db.run(
      `UPDATE users SET ${setClause} WHERE user_id = ?`,
      [...values, userId],
      function(err) {
        if (err) {
          console.error('Failed to update profile:', err);
          return res.status(500).json({ message: "Failed to update profile" });
        }

        // Update session data
        req.session.user.full_name = updates.full_name;
        req.session.user.phone = updates.phone;

        console.log(`✅ Profile updated for user ${userId}`);
        res.json({ 
          message: new_password ? "Profile and password updated successfully!" : "Profile updated successfully!",
          user: req.session.user
        });
      }
    );
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete own account (user-facing)
app.delete("/api/delete-account", requireAuth, (req, res) => {
  const userId = req.session.user.user_id;
  console.log(`🗑️ User ${userId} requested account deletion`);

  // Same comprehensive deletion as admin delete, but for current user
  // 1. Delete reviews for user's products
  db.run('DELETE FROM reviews WHERE product_id IN (SELECT product_id FROM products WHERE seller_id = ?)', [userId], (reviewsProdErr) => {
    if (reviewsProdErr && !reviewsProdErr.message.includes('no such table')) {
      console.error('Error at step 1:', reviewsProdErr.message);
      return res.status(500).json({ message: "Error deleting product reviews" });
    }
    console.log('✓ Step 1 complete');

    // 2. Delete sold_items for user's products
    db.run('DELETE FROM sold_items WHERE product_id IN (SELECT product_id FROM products WHERE seller_id = ?)', [userId], (soldProdErr) => {
      if (soldProdErr && !soldProdErr.message.includes('no such table')) {
        console.error('Error at step 2:', soldProdErr.message);
        return res.status(500).json({ message: "Error deleting product sales" });
      }
      console.log('✓ Step 2 complete');

      // 3. Delete wishlist entries for user's products
      db.run('DELETE FROM wishlist WHERE product_id IN (SELECT product_id FROM products WHERE seller_id = ?)', [userId], (wishlistErr) => {
        if (wishlistErr && !wishlistErr.message.includes('no such table')) {
          console.error('Error at step 3:', wishlistErr.message);
          return res.status(500).json({ message: "Error deleting wishlist entries" });
        }
        console.log('✓ Step 3 complete');

        // 4. Delete messages for user's products
        db.run('DELETE FROM messages WHERE item_id IN (SELECT product_id FROM products WHERE seller_id = ?)', [userId], (prodMsgErr) => {
          if (prodMsgErr && !prodMsgErr.message.includes('no such table')) {
            console.error('Error at step 4:', prodMsgErr.message);
            return res.status(500).json({ message: "Error deleting product messages" });
          }
          console.log('✓ Step 4 complete');

          // 5. Delete user's products
          db.run('DELETE FROM products WHERE seller_id = ?', [userId], (prodErr) => {
            if (prodErr) {
              console.error('Error at step 5:', prodErr.message);
              return res.status(500).json({ message: "Error deleting products" });
            }
            console.log('✓ Step 5 complete');

            // 6. Delete reviews where user is seller or buyer
            db.run('DELETE FROM reviews WHERE seller_id = ? OR buyer_id = ?', [userId, userId], (reviewsErr) => {
              if (reviewsErr && !reviewsErr.message.includes('no such table')) {
                console.error('Error at step 6:', reviewsErr.message);
                return res.status(500).json({ message: "Error deleting user reviews" });
              }
              console.log('✓ Step 6 complete');

              // 7. Delete sold_items where user is seller or buyer
              db.run('DELETE FROM sold_items WHERE seller_id = ? OR buyer_id = ?', [userId, userId], (soldErr) => {
                if (soldErr && !soldErr.message.includes('no such table')) {
                  console.error('Error at step 7:', soldErr.message);
                  return res.status(500).json({ message: "Error deleting sales records" });
                }
                console.log('✓ Step 7 complete');

                // 8. Delete user's wishlist entries
                db.run('DELETE FROM wishlist WHERE user_id = ?', [userId], (wishErr) => {
                  if (wishErr && !wishErr.message.includes('no such table')) {
                    console.error('Error at step 8:', wishErr.message);
                    return res.status(500).json({ message: "Error deleting wishlist" });
                  }
                  console.log('✓ Step 8 complete');

                  console.log('✓ Step 8 complete');

                  // 9. Delete user's messages
                  db.run('DELETE FROM messages WHERE sender_id = ? OR receiver_id = ?', [userId, userId], (msgErr) => {
                    if (msgErr) {
                      console.error('Error at step 9:', msgErr.message);
                      return res.status(500).json({ message: "Error deleting messages" });
                    }
                    console.log('✓ Step 9 complete');

                    // 10. Delete user's success stories (skip if table doesn't exist)
                    db.run('DELETE FROM success_stories WHERE student_id = ?', [userId], (storiesErr) => {
                      // Ignore "no such table" errors for optional tables
                      if (storiesErr && !storiesErr.message.includes('no such table')) {
                        console.error('Error at step 10:', storiesErr.message);
                        return res.status(500).json({ message: "Error deleting success stories" });
                      }
                      console.log('✓ Step 10 complete');

                      // 11. Finally, delete the user account
                      db.run('DELETE FROM users WHERE user_id = ?', [userId], (userErr) => {
                        if (userErr) {
                          console.error('Error at step 11:', userErr.message);
                          return res.status(500).json({ message: "Error deleting user account" });
                        }
                        console.log('✓ Step 11 complete');

                        // Destroy session after successful deletion
                        req.session.destroy(() => {
                          console.log(`✅ Account deleted successfully for user ${userId}`);
                          res.json({ message: "Your account has been permanently deleted." });
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
});

// Logout (destroy session)
app.post("/api/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ message: "Logged out successfully" });
  });
});

// ====== ADMIN ROUTES ======

// Middleware to check admin role
function requireAdmin(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  if (req.session.user.role !== 'admin') {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

// Get admin statistics
app.get("/api/admin/stats", requireAdmin, (req, res) => {
  db.get('SELECT COUNT(*) as count FROM users', [], (err, users) => {
    if (err) return res.status(500).json({ message: "Error fetching stats" });
    
    db.get('SELECT COUNT(*) as count FROM products', [], (err2, products) => {
      if (err2) return res.status(500).json({ message: "Error fetching stats" });
      
      db.get('SELECT COUNT(*) as count FROM products WHERE status = ?', ['Available'], (err3, available) => {
        if (err3) return res.status(500).json({ message: "Error fetching stats" });
        
        db.get('SELECT COUNT(*) as count FROM products WHERE status = ?', ['Sold'], (err4, sold) => {
          if (err4) return res.status(500).json({ message: "Error fetching stats" });
          
          res.json({
            totalUsers: users.count,
            totalProducts: products.count,
            availableProducts: available.count,
            soldProducts: sold.count
          });
        });
      });
    });
  });
});

// Get all users
app.get("/api/admin/users", requireAdmin, (req, res) => {
  db.all('SELECT user_id, full_name, email, phone, role, created_at FROM users ORDER BY created_at DESC', [], (err, users) => {
    if (err) {
      console.error('Error fetching users:', err);
      return res.status(500).json({ message: "Error fetching users" });
    }
    res.json(users);
  });
});

// Update user role
app.put("/api/admin/users/:userId/role", requireAdmin, (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;

  if (!['student', 'admin'].includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  db.run('UPDATE users SET role = ? WHERE user_id = ?', [role, userId], function(err) {
    if (err) {
      console.error('Error updating role:', err);
      return res.status(500).json({ message: "Error updating role" });
    }
    res.json({ message: "Role updated successfully" });
  });
});

// Delete user (and their products/messages)
app.delete("/api/admin/users/:userId", requireAdmin, (req, res) => {
  const { userId } = req.params;

  // Prevent admin from deleting themselves
  if (parseInt(userId) === req.session.user.user_id) {
    return res.status(400).json({ message: "Cannot delete your own account" });
  }

  // CASCADING DELETE ORDER (to satisfy foreign key constraints):
  // 1. Delete reviews for user's products
  // 2. Delete sold_items for user's products
  // 3. Delete wishlist entries for user's products
  // 4. Delete messages for user's products
  // 5. Delete user's products
  // 6. Delete reviews where user is seller or buyer
  // 7. Delete sold_items where user is seller or buyer
  // 8. Delete user's wishlist entries
  // 9. Delete user's messages
  // 10. Delete user's success stories
  // 11. Finally, delete the user

  // 1. Delete reviews for user's products
  db.run('DELETE FROM reviews WHERE product_id IN (SELECT product_id FROM products WHERE seller_id = ?)', [userId], (reviewsProdErr) => {
    if (reviewsProdErr) console.warn('⚠️ Error deleting reviews for user products:', reviewsProdErr);
    
    // 2. Delete sold_items for user's products
    db.run('DELETE FROM sold_items WHERE product_id IN (SELECT product_id FROM products WHERE seller_id = ?)', [userId], (soldProdErr) => {
      if (soldProdErr) console.warn('⚠️ Error deleting sold_items for user products:', soldProdErr);
      
      // 3. Delete wishlist entries for user's products
      db.run('DELETE FROM wishlist WHERE product_id IN (SELECT product_id FROM products WHERE seller_id = ?)', [userId], (wishlistErr) => {
        if (wishlistErr) console.warn('⚠️ Error deleting wishlist entries:', wishlistErr);
        
        // 4. Delete messages for user's products (item_id is the column name, not product_id)
        db.run('DELETE FROM messages WHERE item_id IN (SELECT product_id FROM products WHERE seller_id = ?)', [userId], (prodMsgErr) => {
          if (prodMsgErr) console.warn('⚠️ Error deleting product messages:', prodMsgErr);
          
          // 5. Delete user's products
          db.run('DELETE FROM products WHERE seller_id = ?', [userId], (err) => {
            if (err) console.error('Error deleting products:', err);
            
            // 6. Delete reviews where user is seller or buyer
            db.run('DELETE FROM reviews WHERE seller_id = ? OR buyer_id = ?', [userId, userId], (reviewsErr) => {
              if (reviewsErr) console.warn('⚠️ Error deleting user reviews:', reviewsErr);
              
              // 7. Delete sold_items where user is seller or buyer
              db.run('DELETE FROM sold_items WHERE seller_id = ? OR buyer_id = ?', [userId, userId], (soldErr) => {
                if (soldErr) console.warn('⚠️ Error deleting user sold_items:', soldErr);
                
                // 8. Delete user's wishlist entries as a buyer
                db.run('DELETE FROM wishlist WHERE user_id = ?', [userId], (wishErr2) => {
                  if (wishErr2) console.warn('⚠️ Error deleting user wishlist:', wishErr2);
                  
                  // 9. Delete user's messages
                  db.run('DELETE FROM messages WHERE sender_id = ? OR receiver_id = ?', [userId, userId], (err2) => {
                    if (err2) console.error('Error deleting messages:', err2);
                    
                    // 10. Delete user's success stories
                    db.run('DELETE FROM success_stories WHERE student_id = ?', [userId], (storiesErr) => {
                      if (storiesErr) console.warn('⚠️ Error deleting success stories:', storiesErr);
                      
                      // 11. Finally, delete the user
                      db.run('DELETE FROM users WHERE user_id = ?', [userId], function(err3) {
                        if (err3) {
                          console.error('Error deleting user:', err3);
                          return res.status(500).json({ message: "Error deleting user" });
                        }
                        res.json({ message: "User deleted successfully" });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
});

// Get all products with seller info
app.get("/api/admin/products", requireAdmin, (req, res) => {
  db.all(`
    SELECT p.*, u.full_name as seller_name 
    FROM products p 
    LEFT JOIN users u ON p.seller_id = u.user_id 
    ORDER BY p.created_at DESC
  `, [], (err, products) => {
    if (err) {
      console.error('Error fetching products:', err);
      return res.status(500).json({ message: "Error fetching products" });
    }
    res.json(products);
  });
});

// Delete product
app.delete("/api/admin/products/:productId", requireAdmin, (req, res) => {
  const { productId } = req.params;

  // CASCADING DELETE ORDER (to satisfy foreign key constraints):
  // 1. Delete reviews for this product
  // 2. Delete sold_items for this product
  // 3. Delete wishlist entries for this product
  // 4. Delete messages for this product
  // 5. Finally, delete the product

  // 1. Delete reviews for this product
  db.run('DELETE FROM reviews WHERE product_id = ?', [productId], function(reviewsErr) {
    if (reviewsErr) {
      console.warn(`⚠️ Failed to delete reviews for product ${productId}:`, reviewsErr.message);
    }
    
    // 2. Delete sold_items for this product
    db.run('DELETE FROM sold_items WHERE product_id = ?', [productId], function(soldErr) {
      if (soldErr) {
        console.warn(`⚠️ Failed to delete sold_items for product ${productId}:`, soldErr.message);
      }
      
      // 3. Delete wishlist entries
      db.run('DELETE FROM wishlist WHERE product_id = ?', [productId], function(wishlistErr) {
        if (wishlistErr) {
          console.warn(`⚠️ Failed to delete wishlist entries for product ${productId}:`, wishlistErr.message);
        }
        
        // 4. Delete messages related to this product (item_id is the column name, not product_id)
        db.run('DELETE FROM messages WHERE item_id = ?', [productId], function(messagesErr) {
          if (messagesErr) {
            console.warn(`⚠️ Failed to delete messages for product ${productId}:`, messagesErr.message);
          }
          
          // 5. Now delete the product
          db.run('DELETE FROM products WHERE product_id = ?', [productId], function(err) {
            if (err) {
              console.error('Error deleting product:', err);
              return res.status(500).json({ message: "Error deleting product" });
            }
            res.json({ message: "Product deleted successfully" });
          });
        });
      });
    });
  });
});

// Get all messages
app.get("/api/admin/messages", requireAdmin, (req, res) => {
  db.all(`
    SELECT 
      m.*,
      s.full_name as sender_name,
      r.full_name as receiver_name,
      p.title as product_title
    FROM messages m
    LEFT JOIN users s ON m.sender_id = s.user_id
    LEFT JOIN users r ON m.receiver_id = r.user_id
    LEFT JOIN products p ON m.product_id = p.product_id
    ORDER BY m.created_at DESC
  `, (err, messages) => {
    if (err) {
      console.error('Error fetching messages:', err);
      return res.status(500).json({ message: "Error fetching messages" });
    }
    res.json(messages);
  });
});

// Delete message
app.delete("/api/admin/messages/:messageId", requireAdmin, (req, res) => {
  const { messageId } = req.params;

  db.run('DELETE FROM messages WHERE message_id = ?', [messageId], function(err) {
    if (err) {
      console.error('Error deleting message:', err);
      return res.status(500).json({ message: "Error deleting message" });
    }
    res.json({ message: "Message deleted successfully" });
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

/**
 * POST /api/upload-temp-images
 * Upload images temporarily for AI analysis (before product creation)
 */
app.post("/api/upload-temp-images", requireAuth, upload.any(), (req, res) => {
  try {
    const filesArray = req.files || [];
    
    if (filesArray.length === 0) {
      return res.status(400).json({ error: 'No images uploaded' });
    }

    // Get absolute paths for all uploaded images
    const imagePaths = filesArray.map(f => {
      return path.join(__dirname, '..', 'uploads', path.basename(f.path));
    });

    console.log(`📤 Uploaded ${imagePaths.length} temp image(s) for AI analysis`);
    
    res.json({ 
      imagePaths,
      count: imagePaths.length 
    });
  } catch (error) {
    console.error('❌ Temp image upload error:', error);
    res.status(500).json({ 
      error: 'Failed to upload images',
      message: error.message 
    });
  }
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
    
    // CASCADING DELETE ORDER (to satisfy foreign key constraints):
    // 1. Delete reviews for this product
    // 2. Delete sold_items for this product
    // 3. Delete wishlist entries for this product
    // 4. Delete messages for this product
    // 5. Finally, delete the product
    
    // 1. Delete reviews for this product
    db.run("DELETE FROM reviews WHERE product_id = ?", [id], function (reviewsErr) {
      if (reviewsErr) {
        console.warn(`⚠️ Failed to delete reviews for product ${id}:`, reviewsErr.message);
      }
      
      // 2. Delete sold_items for this product
      db.run("DELETE FROM sold_items WHERE product_id = ?", [id], function (soldErr) {
        if (soldErr) {
          console.warn(`⚠️ Failed to delete sold_items for product ${id}:`, soldErr.message);
        }
        
        // 3. Delete wishlist entries for this product
        db.run("DELETE FROM wishlist WHERE product_id = ?", [id], function (wishlistErr) {
          if (wishlistErr) {
            console.warn(`⚠️ Failed to delete wishlist entries for product ${id}:`, wishlistErr.message);
          }
          
          // 4. Delete messages related to this product (item_id is the column name, not product_id)
          db.run("DELETE FROM messages WHERE item_id = ?", [id], function (messagesErr) {
            if (messagesErr) {
              console.warn(`⚠️ Failed to delete messages for product ${id}:`, messagesErr.message);
            }
            
            // 5. Now delete the product itself
            db.run("DELETE FROM products WHERE product_id = ?", [id], function (err) {
              if (err) {
                console.error(`❌ DB.run error: ${err.message}\n   Query: DELETE FROM products WHERE product_id = ?`);
                return res.status(500).json({ error: err.message });
              }
              res.json({ message: "Product deleted", undoAvailable: deletedStack.length > 0 });
            });
          });
        });
      });
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

app.get("/forgot-password.html", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/forgot-password.html"));
});

app.get("/reset-password.html", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/reset-password.html"));
});

// Error handling middleware (must be last)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error', 
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message 
  });
});

// Call startServer function to initialize DB and start listening
startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});












