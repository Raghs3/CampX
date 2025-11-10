# 🎓 CampX Marketplace

**A full-stack campus marketplace platform for students to buy, sell, and trade items within their college community.**

[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://campx-marketplace.onrender.com)
[![Node.js](https://img.shields.io/badge/node-%3E%3D%2014.0.0-brightgreen)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

---

## ✨ Features

### 🛍️ Marketplace
- **Product Listings** - Add products with up to 3 images, detailed descriptions, and pricing
- **AI-Powered Auto-Fill** - Upload product images and let Gemini Vision AI automatically fill title, description, category, condition, and suggested price
- **Categories** - Books, Electronics, Furniture, Clothing, Sports, and more
- **Search & Filter** - Advanced search with category filters and keyword matching
- **Product Status** - Available, Reserved, or Sold tracking

### 🤖 AI Features
- **AI Image Analysis** - Gemini 2.5 Flash Vision API analyzes 1-3 product images simultaneously
- **Smart Legitimacy Detection** - Automatically flags suspicious/counterfeit products
- **Price Prediction** - AI-powered price suggestions based on product details
- **Shadow Banning** - Flagged products require admin review before going live

### 🔐 Authentication & Security
- **Email Verification** - Mandatory email verification before listing products
- **Session-based Authentication** - Secure session management with httpOnly cookies
- **Password Security** - Bcrypt hashing with strength validation
- **Role-based Access** - Student and Admin roles with permission controls
- **CSRF Protection** - SameSite cookies and secure headers

### 💬 Communication
- **Messaging System** - Real-time messaging between buyers and sellers
- **Email Notifications** - Automated emails for verification, bookings, and messages
- **Contact Preferences** - Choose email or phone contact methods

### 📊 User Features
- **Wishlist** - Save favorite items for later
- **Purchase History** - Track bought and sold items
- **Reviews & Ratings** - 5-star rating system for sellers
- **Profile Management** - Update avatar, phone number, and preferences
- **Sales Dashboard** - View all your active and sold listings

### 👨‍💼 Admin Panel
- **User Management** - View, edit roles, and delete users
- **Product Moderation** - Review flagged products and manage listings
- **Message Monitoring** - Oversee platform communications
- **Success Stories** - Approve and publish student testimonials

---

## 🛠️ Tech Stack

### Backend
- **Node.js** + **Express.js** - Server framework
- **PostgreSQL** - Production database (Render)
- **SQLite** - Local development database
- **Bcrypt** - Password hashing
- **Express-session** - Session management
- **Nodemailer** - Email service (Gmail SMTP)

### Frontend
- **Vanilla JavaScript** - No framework dependencies
- **HTML5** + **CSS3** - Responsive design
- **Fetch API** - RESTful API communication

### AI & Machine Learning
- **Google Gemini 2.5 Flash** - Vision API for image analysis
- **Python 3.x** - AI script runtime
- **Pillow** - Image processing
- **google-generativeai** - Gemini API client

### DevOps
- **Render** - Cloud hosting platform
- **Git** - Version control
- **GitHub** - Code repository

---

## 🚀 Getting Started

### Prerequisites

```bash
Node.js >= 14.0.0
Python >= 3.8
npm or yarn
PostgreSQL (for production) or SQLite (for development)
Gmail account (for email service)
Google AI Studio API Key (for AI features)
```

### Local Development Setup

1. **Clone the repository**
```bash
git clone https://github.com/Raghs3/CampX.git
cd CampX
```

2. **Install Node.js dependencies**
```bash
npm install
```

3. **Install Python dependencies**
```bash
pip install -r requirements.txt
```

4. **Configure environment variables**
```bash
cd server
cp .env.example .env
```

Edit `server/.env` and add your credentials:
```env
# Email Configuration (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password

# Google Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# Session Secret (generate a random string)
SESSION_SECRET=your-random-secret-key

# Database (optional - for PostgreSQL)
# DATABASE_URL=postgresql://user:password@host:port/database
```

5. **Initialize the database**
```bash
cd ..
python scripts/create_db.py
```

6. **Create an admin account**
```bash
node scripts/create-admin.js
```

7. **Start the development server**
```bash
npm start
```

8. **Open in browser**
```
http://localhost:3000
```

---

## 📦 Production Deployment (Render)

### 1. Database Setup
- Create a PostgreSQL database on Render
- Copy the external database URL

### 2. Environment Variables
Add these to your Render web service:
```
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
GEMINI_API_KEY=your-gemini-key
SESSION_SECRET=your-secret-key
DATABASE_URL=your-postgres-url
NODE_ENV=production
```

### 3. Build Command
```bash
pip install -r requirements.txt && npm install
```

### 4. Start Command
```bash
npm start
```

### 5. Initialize Database
```bash
node server/init-postgres.js
```

### 6. Create Admin (via Render Shell)
```bash
node scripts/create-admin.js
```

---

## 📁 Project Structure

```
CampX/
├── server/
│   ├── server.js              # Main Express server
│   ├── database.js            # Database connection handler
│   ├── price_prediction.js    # AI price prediction module
│   ├── image_analysis.js      # AI image analysis wrapper
│   ├── init-postgres.js       # PostgreSQL initialization
│   └── .env.example           # Environment variables template
├── scripts/
│   ├── create_db.py           # SQLite database schema
│   ├── init-db.js             # Database initialization
│   └── create-admin.js        # Admin account creation
├── public/
│   ├── index.html             # Product listing page
│   ├── login.html             # Login page
│   ├── signup.html            # Registration page
│   ├── profile.html           # User profile
│   ├── admin.html             # Admin dashboard
│   ├── verify-email.html      # Email verification
│   ├── forgot-password.html   # Password reset request
│   └── reset-password.html    # Password reset form
├── js/
│   ├── app.js                 # Main frontend logic + AI auto-fill
│   └── auth.js                # Authentication logic
├── styles/
│   └── style.css              # Global styles
├── uploads/                   # User-uploaded images
├── ai_image_analyzer.py       # Gemini Vision AI analyzer
├── ai_gemini_predictor.py     # AI price prediction
├── requirements.txt           # Python dependencies
├── package.json               # Node.js dependencies
└── README.md                  # This file
```

---

## 🔑 Key API Endpoints

### Authentication
- `POST /api/signup` - Register new user
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `POST /api/verify-email/:token` - Verify email
- `POST /api/forgot-password` - Request password reset
- `POST /api/reset-password/:token` - Reset password

### Products
- `GET /api/products` - Get all products (with filters)
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (requires auth + verified email)
- `PUT /api/products/:id` - Update product (requires ownership)
- `DELETE /api/products/:id` - Delete product (requires ownership)
- `POST /api/products/:id/book` - Book/purchase product

### AI Features
- `POST /api/predict-price` - Get AI price prediction
- `POST /api/analyze-image` - Analyze product images with AI
- `POST /api/upload-temp-images` - Upload images for AI analysis

### Wishlist
- `GET /api/wishlist` - Get user's wishlist
- `POST /api/wishlist` - Add to wishlist
- `DELETE /api/wishlist/:productId` - Remove from wishlist

### Messages
- `GET /api/messages` - Get user's messages
- `POST /api/messages` - Send message

### Reviews
- `POST /api/reviews` - Submit review

### Admin
- `GET /api/admin/users` - Get all users
- `DELETE /api/admin/users/:id` - Delete user
- `PUT /api/admin/users/:id/role` - Update user role
- `GET /api/admin/products` - Get all products
- `DELETE /api/admin/products/:id` - Delete product

---

## 🤖 AI Features Setup

### 1. Get Gemini API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add to `server/.env`:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

### 2. Python Virtual Environment (Optional)
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Test AI Features
```bash
# Test price prediction
python ai_gemini_predictor.py Electronics "Like New" "iPhone 12" "Barely used" 30000

# Test image analysis
python ai_image_analyzer.py "uploads/your-image.jpg"
```

---

## 📧 Email Configuration

### Gmail Setup
1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account → Security → 2-Step Verification → App passwords
   - Select "Mail" and "Other (Custom name)"
   - Copy the 16-character password
3. Add to `server/.env`:
   ```
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-16-char-app-password
   ```

---

## 🔒 Security Features

- ✅ **SQL Injection Prevention** - Parameterized queries throughout
- ✅ **XSS Protection** - Input sanitization and output encoding
- ✅ **CSRF Protection** - SameSite cookies
- ✅ **Password Security** - Bcrypt with 10 salt rounds
- ✅ **Session Security** - httpOnly, secure cookies in production
- ✅ **Email Verification** - Mandatory for product listings
- ✅ **File Upload Validation** - Type and size restrictions
- ✅ **Foreign Key Constraints** - Proper cascading deletes
- ✅ **Role-based Access Control** - Admin/Student permissions

---

## 🐛 Known Issues & Future Improvements

### Known Issues
- Sold items historical data is deleted when products are deleted (FK constraint)
- No rate limiting on API endpoints
- Frontend XSS sanitization could be improved

### Planned Features
- [ ] Real-time chat with WebSockets
- [ ] Product recommendations based on browsing history
- [ ] Multi-language support
- [ ] Mobile app (React Native)
- [ ] Payment gateway integration
- [ ] Product categories with icons
- [ ] Advanced search filters (price range, condition, etc.)
- [ ] User reputation system

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License. See `LICENSE` file for details.

---

## 👨‍💻 Author

**Raghav Sharma**
- GitHub: [@Raghs3](https://github.com/Raghs3)
- Project: [CampX Marketplace](https://github.com/Raghs3/CampX)
- Live Demo: [https://campx-marketplace.onrender.com](https://campx-marketplace.onrender.com)

---

## 🙏 Acknowledgments

- **Google Gemini AI** - For powerful vision and text generation APIs
- **Render** - For seamless deployment and hosting
- **Node.js Community** - For excellent packages and documentation
- **VIT University** - Inspiration for campus marketplace solution

---

## 📞 Support

For issues, questions, or suggestions:
- Open an [Issue](https://github.com/Raghs3/CampX/issues)
- Email: raghav.sharma@example.com

---

**Made with ❤️ for campus communities**
