# 🎓 CampX Marketplace

A full-stack campus marketplace application for buying and selling items within your college community.

## ✨ Features

- 🔐 **Secure Authentication** - Email verification required for login
- 📦 **Product Management** - Add, edit, delete products with images
- 💬 **Messaging System** - Contact sellers directly
- ⭐ **Reviews & Ratings** - Rate sellers after purchase
- ❤️ **Wishlist** - Save items for later
- 🔍 **Search & Filter** - Find products by category or search term
- 📊 **Sales Tracking** - View sold items and purchase history
- 📧 **Email Notifications** - Automated verification and booking notifications

## 🚀 Quick Start

### Prerequisites
- Node.js 14+ installed
- Gmail account for email service

### Installation

1. Clone the repository
```bash
git clone https://github.com/YOUR-USERNAME/campx-marketplace.git
cd campx-marketplace
```

2. Install dependencies
```bash
npm install
```

3. Configure email settings
```bash
cd server
cp .env.example .env
# Edit .env and add your Gmail credentials
```

4. Initialize database
```bash
cd ..
node scripts/create_db.py
```

5. Start the server
```bash
npm run dev
```

6. Open your browser
```
http://localhost:5000
```

## 📁 Project Structure

```
CampXMarketplace/
├── public/              # HTML files
│   ├── index.html       # Main marketplace page
│   ├── login.html       # Login page
│   └── signup.html      # Registration page
├── js/                  # Frontend JavaScript
│   ├── app.js          # Main application logic
│   └── auth.js         # Authentication handlers
├── styles/             # CSS files
├── server/             # Backend
│   └── server.js       # Express server
├── scripts/            # Database utilities
├── uploads/            # Product images
└── campus.db          # SQLite database

```

## 🔧 Configuration

### Email Setup (Gmail)

1. Enable 2-Step Verification on your Google Account
2. Go to https://myaccount.google.com/apppasswords
3. Generate an app password for "Mail"
4. Add to `server/.env`:
```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
```

## 🌐 Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

**Quick Deploy to Render:**
1. Push code to GitHub
2. Connect to Render.com
3. Add environment variables
4. Deploy! (Free tier available)

## 🛠️ Tech Stack

**Frontend:**
- HTML5, CSS3, JavaScript (ES6+)
- TailwindCSS for styling

**Backend:**
- Node.js + Express
- SQLite3 database
- Bcrypt for password hashing
- Nodemailer for email verification
- Express-session for authentication

## 📸 Features Details

### Authentication
- Secure password hashing with bcrypt
- Email verification required before login
- Session-based authentication
- Resend verification email option

### Product Management
- Upload up to 3 images per product
- Set price, condition, and quantity
- Categorize products
- Edit/delete your own products

### Messaging
- Direct messaging between buyers and sellers
- Message history
- Reply to messages

### Reviews
- Rate sellers (1-5 stars)
- Leave written reviews
- View average ratings
- Only buyers can review

## 🔒 Security Features

- Password hashing with bcrypt
- Email verification required
- Session-based authentication
- CSRF protection
- SQL injection prevention (parameterized queries)

## 📝 API Endpoints

### Authentication
- `POST /api/register` - Sign up new user
- `POST /api/login` - Login user
- `POST /api/logout` - Logout user
- `GET /api/current-user` - Get logged-in user
- `POST /api/resend-verification` - Resend verification email

### Products
- `GET /api/products` - Get all products (with filters)
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Add new product (auth required)
- `PUT /api/products/:id` - Update product (auth required)
- `DELETE /api/products/:id` - Delete product (auth required)
- `POST /api/products/:id/book` - Book/purchase product (auth required)

### Messaging
- `GET /api/messages` - Get user's messages (auth required)
- `POST /api/messages` - Send message (auth required)

### Wishlist
- `GET /api/wishlist` - Get wishlist (auth required)
- `POST /api/wishlist` - Add to wishlist (auth required)
- `DELETE /api/wishlist/:productId` - Remove from wishlist (auth required)

### Reviews
- `GET /api/reviews/:sellerId` - Get seller reviews
- `POST /api/reviews` - Submit review (auth required)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 👨‍💻 Developer

Created by Raghav Kumar - VIT University

## 📧 Contact

For support or queries, contact via GitHub issues.

---

Made with ❤️ for campus communities
