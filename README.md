
# 🎓 CampX - AI-Powered Campus Marketplace

**CampX** is a modern, AI-enhanced peer-to-peer marketplace designed specifically for university students. Buy, sell, and discover items within your campus community with intelligent features powered by cutting-edge AI technology.

![CampX Preview](https://via.placeholder.com/800x400/0f766e/ffffff?text=CampX+Campus+Marketplace)

## ✨ Key Features

### 🤖 AI-Powered Features
- **Smart Image Analysis**: Upload any product photo and AI automatically generates titles, descriptions, and categories
- **Intelligent Pricing**: AI suggests optimal prices based on condition, category, and market trends
- **Enhanced Descriptions**: Transform basic descriptions into compelling, SEO-friendly listings
- **Smart Search**: Natural language search with intelligent query interpretation
- **Chat Assistance**: AI-powered message suggestions for better communication

### 🛍️ Marketplace Features
- **Real-time Chat**: Instant messaging with offer negotiations and status updates
- **Advanced Search & Filters**: Find exactly what you need with smart filtering
- **Save Items**: Bookmark interesting products for later
- **User Profiles**: Detailed seller profiles with ratings and verification status
- **Campus-focused**: Location-based filtering for your university community
- **Secure Authentication**: JWT-based auth with profile management

### 🎨 Modern UI/UX
- **Responsive Design**: Perfect experience on desktop, tablet, and mobile
- **Dark/Light Theme**: Choose your preferred viewing mode
- **Intuitive Interface**: Clean, modern design that's easy to navigate
- **Real-time Notifications**: Stay updated with instant alerts
- **Progressive Web App**: Install on your device for native app experience

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v16 or higher)
- **MongoDB** (local or MongoDB Atlas)
- **Cloudinary Account** (for image hosting)
- **OpenAI API Key** (for AI features)

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/campx.git
cd campx
```

### 2. Backend Setup
```bash
cd backend
npm install
```

### 3. Environment Configuration
Create a `.env` file in the `backend` directory:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/campx
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/campx

# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# JWT Authentication
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
JWT_EXPIRES_IN=7d

# OpenAI API (Required for AI features)
OPENAI_API_KEY=sk-your_openai_api_key_here

# Cloudinary Configuration (Required for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Rate Limiting (Optional)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 4. Start the Application
```bash
# Start backend server
cd backend
npm run dev

# Open frontend (in a new terminal)
# The backend serves the frontend at http://localhost:5000
```

## 🔧 Configuration Guide

### Required API Keys & Setup

#### 1. MongoDB Setup
**Option A: Local MongoDB**
1. Install MongoDB Community Edition
2. Start MongoDB service
3. Use connection string: `mongodb://localhost:27017/campx`

**Option B: MongoDB Atlas (Recommended)**
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get connection string and add to `.env`

#### 2. Cloudinary Setup (Image Hosting)
1. Create account at [Cloudinary](https://cloudinary.com/)
2. Get your cloud name, API key, and API secret from dashboard
3. Add to `.env` file

#### 3. OpenAI API Setup (AI Features)
1. Create account at [OpenAI](https://platform.openai.com/)
2. Generate API key in API settings
3. Add to `.env` file
4. Ensure you have credits/billing set up

### Campus & User Data Placeholders

The application comes with sample data. Replace these with real information:

#### Sample Campuses
- VIT Pune
- IIT Bombay
- Delhi University
- Anna University
- Manipal University

#### Sample Categories
- Textbooks
- Electronics
- Laptops
- Furniture
- Clothing
- Sports
- Academic
- Other

#### Sample User Profiles
Replace sample users in `frontend/app.js` with real user data or set up user registration.

## 📱 API Documentation

### Authentication Endpoints
```
POST /api/auth/register      # User registration
POST /api/auth/login         # User login
GET  /api/auth/me           # Get current user
PUT  /api/auth/profile      # Update profile
```

### Items Endpoints
```
GET    /api/items           # Get all items (with filters)
GET    /api/items/:id       # Get single item
POST   /api/items           # Create new item
PUT    /api/items/:id       # Update item
DELETE /api/items/:id       # Delete item
POST   /api/items/:id/save  # Save/unsave item
```

### AI Endpoints
```
POST /api/ai/analyze-image      # AI image analysis
POST /api/ai/enhance-description # Enhance item description
POST /api/ai/suggest-price      # AI price suggestions
POST /api/ai/smart-search       # Intelligent search
POST /api/ai/suggest-message    # Chat message suggestions
```

### Chat Endpoints
```
GET  /api/chat              # Get user's chats
GET  /api/chat/:id          # Get specific chat
POST /api/chat/create       # Create new chat
POST /api/chat/:id/message  # Send message
```

## 🛠️ Development

### Project Structure
```
campx/
├── backend/
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API routes
│   ├── middleware/      # Auth & validation
│   ├── uploads/         # Local file storage
│   ├── server.js        # Main server file
│   └── package.json
├── frontend/
│   ├── js/              # JavaScript modules
│   ├── styles/          # CSS files
│   ├── index.html       # Main HTML file
│   ├── style.css        # Main stylesheet
│   └── app.js           # Main JavaScript
├── .gitignore
├── README.md
└── requirements.txt     # (Legacy - not needed)
```

### Available Scripts
```bash
# Backend
npm start          # Production server
npm run dev        # Development with nodemon

# Development
npm run test       # Run tests (when implemented)
npm run lint       # Code linting (when configured)
```

### Adding New Features
1. **Backend**: Add routes in `backend/routes/`, models in `backend/models/`
2. **Frontend**: Add components in `frontend/js/`, styles in `frontend/styles/`
3. **AI Features**: Extend `backend/routes/ai.js` with new AI endpoints

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Prevents API abuse
- **Input Validation**: Server-side validation for all inputs
- **CORS Protection**: Configured for specific origins
- **File Upload Security**: Size limits and type validation
- **Password Hashing**: bcrypt for secure password storage

## 🎯 Customization

### Theming
- Edit CSS variables in `frontend/style.css`
- Customize colors, fonts, and spacing
- Add your university branding

### Campus Configuration
- Update campus list in frontend data
- Add location-specific features
- Customize categories for your university

### AI Features
- Modify prompts in `backend/routes/ai.js`
- Add new AI endpoints for custom features
- Integrate additional AI services

## 📊 Performance & Scaling

### Database Optimization
- Indexed fields for fast queries
- Pagination for large datasets
- Aggregation pipelines for analytics

### Image Optimization
- Cloudinary automatic optimization
- Responsive image delivery
- WebP format support

### Caching Strategy
- MongoDB query optimization
- Static asset caching
- API response caching (implement Redis for production)

## 🚧 Production Deployment

### Environment Setup
1. Set `NODE_ENV=production`
2. Use production MongoDB cluster
3. Configure proper CORS settings
4. Set up SSL/HTTPS
5. Use process manager (PM2)

### Recommended Stack
- **Hosting**: Heroku, DigitalOcean, or AWS
- **Database**: MongoDB Atlas
- **Images**: Cloudinary
- **Domain**: Custom domain with SSL
- **Monitoring**: Application monitoring service

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI** for AI capabilities
- **Cloudinary** for image management
- **MongoDB** for database
- **Express.js** for backend framework
- **Socket.IO** for real-time features

## 📞 Support

For support, email [support@campx.com](mailto:support@campx.com) or create an issue on GitHub.

---

**Made with ❤️ for students, by students**

*CampX - Making campus commerce smarter with AI*
This repository contains **both** the backend API (Node/Express/MongoDB) and a lightweight frontend (HTML/CSS/JS).

---

## Features
1. **Core Marketplace** – Create, browse, and search listings.
2. **AI Description** – Send a short prompt or image description to `/api/ai/describe` and OpenAI will return a catchy listing description.
3. **Simple Uploads** – Multipart uploads handled by Multer. Swap in Cloudinary or S3 easily.
4. **Mobile-first UI** – Clean, minimal CSS written from scratch.
5. **One-click Deploy** – Works on Render, Railway, Heroku, or any Node host.

---

## Quick Start (Local Development)
```bash
# 1. Install Node dependencies
cd backend && npm install

# 2. Copy environment variables template and add your secrets
cp .env.example .env
#    → Fill in MONGODB_URI & OPENAI_API_KEY

# 3. Start dev server (backend + static frontend)
npm run dev
# Visit http://localhost:5000
```

**Optional Python AI micro-service**
```bash
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
```

---

## Placeholders to Replace
| File | Placeholder | Explanation |
|------|-------------|-------------|
| `backend/.env.example` | `MONGODB_URI` | Your MongoDB connection string |
| | `OPENAI_API_KEY` | OpenAI key for AI description endpoint |
| Frontend JS | `/api/` | Change if backend served on another URL |
| Frontend logo | `CampX` text / 🎯 icon | Swap for your own branding |
| README badges | *optional* | Add CI/CD badges here |

---

## API – AI Description
`POST /api/ai/describe`
```json
{
  "prompt": "Image of a slightly-used iPhone 13 Pro Max with box"
}
```
Response
```json
{
  "description": "Lightly used iPhone 13 Pro Max in pristine condition – includes original box, cable & screen protector. Perfect for power users on campus!"
}
```
For custom behaviour edit `backend/routes/ai.js`.

---

## Roadmap
- [ ] JWT Auth & Email verification
- [ ] Real-time chat via Socket.io
- [ ] Image captioning model for automatic prompt generation
- [ ] Progressive Web App enhancements

---

### License
MIT © 2025 CampX Team
