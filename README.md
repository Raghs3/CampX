
# CampX - AI Powered Campus Marketplace

CampX is a modern, student-focused marketplace where you can buy and sell essentials right on your campus.
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
