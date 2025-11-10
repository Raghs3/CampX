# Email Verification Setup Guide

## ✅ Email Verification is Now Active!

Your CampX Marketplace now requires email verification for new users.

## 🔧 How to Configure Email Service

### Step 1: Choose Your Email Provider

You can use:
- **Gmail** (Recommended for development)
- **Outlook**
- **SendGrid**
- Any SMTP service

### Step 2: Configure Environment Variables

1. **Navigate to the server folder:**
   ```powershell
   cd server
   ```

2. **Create a `.env` file:**
   ```powershell
   copy .env.example .env
   ```

3. **Edit `.env` and add your email credentials:**

#### For Gmail:

```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

**To get Gmail App Password:**
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification** (if not already enabled)
3. Go to **App Passwords**
4. Select **Mail** and **Windows Computer**
5. Click **Generate**
6. Copy the 16-character password (no spaces)
7. Paste it in your `.env` file

#### For Outlook:

```env
EMAIL_SERVICE=outlook
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
```

### Step 3: Restart Your Server

```powershell
node server.js
```

## 📧 How It Works

### New User Signup Flow:
1. User signs up with email and password
2. System sends verification email automatically
3. User clicks verification link in email
4. Email is verified
5. User can now login

### Login Flow:
1. User tries to login
2. System checks if email is verified
3. If not verified, shows option to resend verification email
4. User must verify email before accessing the marketplace

## 🧪 Testing (Without Real Email)

For development/testing without configuring real email:

1. **Sign up a new user**
2. Check server console for the verification link
3. Copy the link and paste it in your browser
4. Or manually verify in database:
   ```sql
   UPDATE users SET email_verified = 1 WHERE email = 'test@example.com';
   ```

## 🎨 Customization

### Change Email Template
Edit `server/server.js` → `sendVerificationEmail()` function

### Change Token Expiry Time
Default: 24 hours
Edit line in `server.js`:
```javascript
const token_expires = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
```

### Change Verification Page Design
Edit `styles/verify-email.html`

## 🔍 Troubleshooting

### Email Not Sending?
1. Check your `.env` file has correct credentials
2. For Gmail: Make sure 2-Step Verification is enabled
3. For Gmail: Use App Password, not regular password
4. Check server console for email errors

### "Email Not Verified" on Login?
1. Check your email inbox (and spam folder)
2. Click the verification link
3. Or use the "Resend" option on login

### Token Expired?
- Request a new verification email from the login page
- Tokens expire after 24 hours

## 🚀 Features Added

✅ Email verification on signup  
✅ Verification email with link  
✅ 24-hour token expiration  
✅ Resend verification email option  
✅ Login blocked until verified  
✅ Beautiful verification page  
✅ All existing features preserved  

## 📝 Database Changes

New columns added to `users` table:
- `email_verified` (0 or 1)
- `verification_token` (unique token)
- `token_expires` (timestamp)

These were added automatically when you ran `python create_db.py`

---

**Need Help?** Check the server console for detailed logs!
