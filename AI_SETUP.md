# 🤖 AI Price Prediction Setup Guide

## Quick Setup (3 Steps)

### Step 1: Install Python Package
```powershell
pip install google-generativeai
```

### Step 2: Get Your Free Gemini API Key

1. Go to **Google AI Studio**: https://aistudio.google.com/app/apikey
2. Sign in with your Google account
3. Click **"Get API Key"** or **"Create API key in new project"**
4. Copy the API key (looks like: `AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`)

### Step 3: Add API Key to .env File

Open `server/.env` and add:
```env
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

Replace with your actual API key from Step 2.

## Test the Integration

### Test Locally:
```powershell
# Test from command line
python ai_gemini_predictor.py Electronics "Like New" "iPhone 12" "Good condition" 30000

# Start server
npm run dev

# Test API (in another terminal or Postman)
curl -X POST http://localhost:5000/api/predict-price `
  -H "Content-Type: application/json" `
  -d '{\"category\":\"Electronics\",\"condition\":\"Like New\",\"title\":\"iPhone 12\",\"userPrice\":30000}'
```

## How It Works

### Gemini AI Features:
- ✨ **Real Market Research**: Analyzes actual prices from OLX, Quikr, Amazon, Flipkart
- 🧠 **Smart Analysis**: Understands product titles and descriptions
- 📊 **Market Awareness**: Considers current Indian marketplace trends
- 💡 **Detailed Reasoning**: Provides explanation for price suggestions
- 🎯 **Accurate**: Based on real listings and condition depreciation

### Condition-Based Pricing:
- **New**: 85-95% of retail price
- **Like New**: 65-80% of retail price
- **Good**: 45-65% of retail price
- **Fair**: 30-45% of retail price
- **Poor**: 15-30% of retail price

## API Endpoints

### 1. Predict Price
```http
POST /api/predict-price
Content-Type: application/json

{
  "category": "Electronics",
  "condition": "Like New",
  "title": "iPhone 12 128GB",
  "description": "Barely used, with box",
  "userPrice": 30000
}
```

**Response:**
```json
{
  "success": true,
  "category": "Electronics",
  "condition": "Like New",
  "prediction": {
    "predicted": 28000,
    "lower": 25000,
    "upper": 31000,
    "confidence": "high",
    "reasoning": "Based on OLX listings (₹25k-32k) and Flipkart refurbished (₹28k-35k). Original retail ₹55k-60k. Like New condition suggests 65-80% retention. Fair market price: ₹28,000"
  }
}
```

### 2. Get Categories
```http
GET /api/price-categories
```

**Response:**
```json
{
  "categories": ["Books", "Electronics", "Furniture", "Clothing", "Sports", "Stationery", "Other"],
  "conditions": ["New", "Like New", "Good", "Fair", "Poor"]
}
```

## Usage in Frontend

Add this to your product listing form:

```javascript
// When user fills category, condition, title
async function getPriceSuggestion() {
  const response = await fetch('/api/predict-price', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      category: document.getElementById('category').value,
      condition: document.getElementById('condition').value,
      title: document.getElementById('title').value,
      description: document.getElementById('description').value,
      userPrice: parseFloat(document.getElementById('price').value) || 0
    })
  });
  
  const data = await response.json();
  if (data.success) {
    const { predicted, lower, upper, confidence, reasoning } = data.prediction;
    
    // Display to user
    document.getElementById('aiSuggestion').innerHTML = `
      <div class="ai-suggestion">
        <h4>🤖 AI Price Suggestion</h4>
        <p class="price">₹${predicted.toLocaleString()}</p>
        <p class="confidence">${confidence} confidence</p>
        <p class="range">Fair range: ₹${lower.toLocaleString()} - ₹${upper.toLocaleString()}</p>
        <p class="reason">${reasoning}</p>
      </div>
    `;
  }
}
```

## Deploy to Render

1. Add `GEMINI_API_KEY` to Render Environment Variables:
   - Go to your web service on Render
   - Click "Environment" tab
   - Add: `GEMINI_API_KEY` = `your_api_key_here`
   - Save changes

2. Render will automatically redeploy with AI support

## Pricing & Limits

- **Free Tier**: 1,500 requests per day (60 per minute)
- **Cost**: FREE for development and moderate usage
- **Rate Limit**: Perfect for campus marketplace

## Troubleshooting

### "Module not found: google.generativeai"
```powershell
pip install google-generativeai
```

### "Invalid API key"
- Check your API key at https://aistudio.google.com/app/apikey
- Make sure it's correctly set in `server/.env`
- Restart your server after adding the key

### "Python not found"
- Make sure Python is installed and in PATH
- Try `python --version` or `python3 --version`

### Fallback Mode
If Gemini is unavailable, the system falls back to:
- User's entered price adjusted by condition
- Basic rule-based estimation
- Message to set up Gemini for better results

## Example Predictions

**Electronics - Like New**
- Input: "iPhone 12 128GB, barely used"
- AI Research: OLX (₹25k-32k), Flipkart (₹28k-35k), Original (₹55k-60k)
- Prediction: ₹28,000 (₹25k - ₹31k range)

**Books - Good**
- Input: "Engineering Mathematics textbook"
- AI Research: Campus marketplaces (₹200-400), Original (₹600-800)
- Prediction: ₹300 (₹250 - ₹350 range)

**Furniture - Fair**
- Input: "Study table with chair"
- AI Research: OLX furniture (₹1.5k-2.5k), Condition depreciation
- Prediction: ₹1,800 (₹1.5k - ₹2.2k range)

## Support

For issues or questions:
- Check server logs for detailed error messages
- Verify Python and package installation
- Ensure API key is valid and not expired
- Test with simple category/condition first

---

**Note**: The AI provides suggestions based on market research. Users can adjust prices based on their specific needs.
