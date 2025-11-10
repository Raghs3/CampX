# 🤖 AI Image Analysis & Auto-Fill Feature

## Overview
Automatically analyze product images using Google Gemini Vision API to:
- ✨ **Auto-fill product details** (title, description, category, condition, price)
- 🔍 **Verify image legitimacy** (detect fake, inappropriate, or suspicious content)
- ⚠️ **Shadow ban suspicious items** for admin review
- 💡 **Suggest market-researched prices** based on condition

## Features

### 1. AI Auto-Fill
When users upload a product image, the AI:
- Identifies the product and generates a title
- Creates a detailed description (1-2 sentences)
- Categorizes the item (Books, Electronics, Furniture, etc.)
- Assesses condition (Like New, Good, Fair, Poor)
- Suggests a fair market price (based on OLX, Amazon, Flipkart research)

### 2. Legitimacy Detection
AI checks for:
- ❌ Stock images
- ❌ Memes or screenshots
- ❌ Inappropriate content
- ❌ AI-generated images
- ❌ Non-product photos
- ❌ Celebrity photos, weapons, drugs, etc.

### 3. Shadow Banning
Items with legitimacy score < 70% are:
- Flagged for admin review
- Shadow banned (not visible to other users)
- Seller is notified to review the listing

## Technical Stack

### Python (AI Backend)
- **File**: `ai_image_analyzer.py`
- **Model**: Google Gemini 2.5 Flash (Vision API)
- **Dependencies**: 
  - `google-generativeai==0.8.5`
  - `python-dotenv==1.0.0`
  - `Pillow==10.4.0`

### Node.js (Integration Layer)
- **File**: `server/image_analysis.js`
- **Method**: Spawns Python process with venv
- **Returns**: JSON with product details and legitimacy check

### API Endpoint
```
POST /api/analyze-image
Body: { "imagePath": "/path/to/uploaded/image" }
Response: {
  "title": "Product Name",
  "description": "Brief description",
  "category": "Electronics",
  "condition": "Good",
  "condition_reason": "Why this condition",
  "suggested_price_inr": 500,
  "price_reasoning": "Market research justification",
  "is_legitimate": true,
  "legitimacy_score": 95,
  "flags": [],
  "flag_reason": "",
  "shadow_banned": false,
  "admin_review_required": false
}
```

## User Experience

### Frontend Flow
1. User uploads product image (required)
2. "✨ AI Auto-Fill Product Details" button appears
3. User clicks button → AI analyzes image
4. Form auto-fills with detected information
5. User reviews/edits details and submits

### UI Elements
- **Auto-Fill Button**: Gradient pink button (appears after image upload)
- **Analysis Status**: Real-time feedback with icons
  - 🔄 Analyzing...
  - ✅ Success (green)
  - ⚠️ Flagged (red)
  - ❌ Error (red)

## Testing

### Test AI Analyzer Directly
```bash
# Activate venv (Windows)
.venv\Scripts\python.exe ai_image_analyzer.py "uploads/image_hash"

# Unix/Mac
venv/bin/python ai_image_analyzer.py "uploads/image_hash"
```

### Example Output
```json
{
  "title": "Arduino Compatible Electronic Components",
  "description": "A set of core electronic components for DIY projects...",
  "category": "Electronics",
  "condition": "Good",
  "condition_reason": "Components appear clean and undamaged",
  "suggested_price_inr": 600,
  "price_reasoning": "Based on market research on OLX, Amazon, and Flipkart...",
  "is_legitimate": true,
  "legitimacy_score": 95,
  "flags": [],
  "flag_reason": ""
}
```

## Configuration

### Environment Variables
Required in `server/.env`:
```env
GEMINI_API_KEY=your_api_key_here
```

### Python Virtual Environment
```bash
# Install dependencies
pip install -r requirements.txt

# requirements.txt includes:
# - google-generativeai==0.8.5
# - python-dotenv==1.0.0
# - Pillow==10.4.0
```

## Deployment (Render)

### Build Command
```bash
pip install -r requirements.txt && npm install
```

### Environment Variables
Add to Render dashboard:
- `GEMINI_API_KEY` = `your_api_key`
- `BASE_URL` = `https://campx-marketplace.onrender.com`

### Start Command
```bash
npm start
```

## Security & Privacy

### Shadow Ban System
- Items flagged as suspicious are hidden from public listings
- Admin can review flagged items in admin dashboard
- Sellers receive notification to correct the issue

### Legitimacy Scoring
- **90-100**: High confidence (auto-approved)
- **70-89**: Medium confidence (approved, but logged)
- **<70**: Low confidence (shadow banned, admin review required)

## Future Enhancements
- [ ] Multi-image analysis (analyze all 3 images)
- [ ] Duplicate detection (check if same product already listed)
- [ ] Brand recognition (detect fake branded items)
- [ ] OCR for text in images (extract specifications)
- [ ] Image quality assessment (blur detection, lighting)

## Troubleshooting

### AI not working?
1. Check `GEMINI_API_KEY` is set in `server/.env`
2. Verify venv Python is being used (check server logs)
3. Test directly: `.venv\Scripts\python.exe ai_image_analyzer.py uploads/test_image`

### "AI service unavailable" error?
- Fallback mode activates automatically
- Form remains functional, user fills details manually
- Check internet connection and API key validity

### Image analysis taking too long?
- Gemini API typically responds in 2-5 seconds
- Check server logs for Python process errors
- Verify image file size < 5MB

## Credits
- **AI Model**: Google Gemini 2.5 Flash
- **Vision API**: `google-generativeai` Python SDK
- **Image Processing**: Pillow (PIL)
