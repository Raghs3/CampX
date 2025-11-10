# CampX Marketplace - Deployment Guide

Your app is now ready to deploy! Here are the **FREE** hosting options:

---

## 🚀 **Option 1: Render.com (Recommended - Easiest)**

### Steps:

1. **Create a GitHub Account** (if you don't have one)
   - Go to https://github.com and sign up

2. **Push Your Code to GitHub**
   ```bash
   cd C:\Users\Raghs3\Desktop\Coding\Projects\CampXMarketplace
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR-USERNAME/campx-marketplace.git
   git push -u origin main
   ```

3. **Deploy to Render**
   - Go to https://render.com and sign up (use GitHub to sign in)
   - **FIRST: Create PostgreSQL Database**
     - Click "New +" → "PostgreSQL"
     - Name: `campx-database`
     - Database: `campx`
     - Click "Create Database"
     - Copy the "Internal Database URL" (you'll need this)
   
   - **THEN: Create Web Service**
     - Click "New +" → "Web Service"
     - Connect your GitHub repository (`CampX`)
     - Settings:
       - **Name:** campx-marketplace
       - **Build Command:** `npm install`
       - **Start Command:** `node server/server.js`
       - **Environment:** Node
   
4. **Add Environment Variables in Render**
   - Go to "Environment" tab in your Web Service
   - Add these variables:
     ```
     EMAIL_SERVICE=gmail
     EMAIL_USER=your-email@vit.edu
     EMAIL_PASSWORD=your-app-password-here
     BASE_URL=https://campx-marketplace.onrender.com
     HOST=0.0.0.0
     NODE_ENV=production
     DATABASE_URL=<paste-your-internal-database-url-here>
     ```
   - **Important:** Use the "Internal Database URL" from your PostgreSQL database

5. **Deploy!**
   - Click "Create Web Service"
   - Wait 5-10 minutes for deployment
   - Database tables will be created automatically on first run
   - Your app will be live at: `https://campx-marketplace.onrender.com`

**FREE TIER:**
- ✅ Free SSL (HTTPS)
- ✅ PostgreSQL database (persistent, won't lose data!)
- ✅ Custom domain support
- ⚠️ Sleeps after 15 mins of inactivity (wakes up on first request)
- ✅ Database stays even when app sleeps

---

## 🚀 **Option 2: Railway.app**

1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Add environment variables (same as Render)
6. Deploy!

**Your URL:** `https://your-app-name.up.railway.app`

---

## 🚀 **Option 3: Vercel (Frontend) + MongoDB Atlas (Database)**

For production with scalable database:
1. Deploy to Vercel
2. Use MongoDB Atlas for database instead of SQLite
3. More setup required but better for large scale

---

## 🏠 **Option 4: Local Network Access (Temporary Testing)**

If you just want friends on the **same WiFi** to access:

1. **Find your local IP:**
   ```powershell
   ipconfig
   ```
   Look for "IPv4 Address" (e.g., 192.168.1.100)

2. **Start server on all interfaces:**
   - Update `.env`: `HOST=0.0.0.0`
   - Run: `npm run dev`

3. **Share with friends:**
   - Give them: `http://YOUR-IP:5000`
   - Example: `http://192.168.1.100:5000`

⚠️ **Note:** This only works on the same WiFi network!

---

## 📧 **Email Configuration for Production**

For production, update these in Render/Railway environment variables:
- `BASE_URL` = your actual deployed URL
- `EMAIL_SERVICE` = gmail
- `EMAIL_USER` = your email
- `EMAIL_PASSWORD` = your app password

---

## 🎯 **Recommended: Deploy to Render**

**Why?**
- ✅ 100% Free tier
- ✅ Automatic HTTPS
- ✅ Easy GitHub integration
- ✅ Auto-deploys on git push
- ✅ Environment variable management
- ✅ No credit card required

**Deployment time:** 10-15 minutes
**Cost:** FREE

---

## 📝 **Quick Start Commands**

```bash
# Initialize git (if not already)
git init
git add .
git commit -m "Ready for deployment"

# Create GitHub repo and push
# (Create repo on github.com first, then:)
git remote add origin YOUR-GITHUB-URL
git push -u origin main
```

Then deploy to Render following steps above!

---

## 🆘 **Need Help?**

1. Make sure all environment variables are set in Render
2. Check deployment logs in Render dashboard
3. Database will be created automatically on first run
4. Verification emails will work once BASE_URL is set

Your app is **production-ready**! 🎉
