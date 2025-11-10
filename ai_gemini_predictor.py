"""
AI Price Prediction using Google Gemini API
Advanced price prediction with natural language understanding
"""

import os
import json
import sys
import warnings
warnings.filterwarnings('ignore')

# Fix Windows encoding for Unicode
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

# Load .env file if available
try:
    from dotenv import load_dotenv
    import os
    # Try to load from server/.env first, then root
    env_path = os.path.join(os.path.dirname(__file__), 'server', '.env')
    if os.path.exists(env_path):
        load_dotenv(env_path)
        print(f"Loaded .env file from {env_path}")
    else:
        load_dotenv()
        print("Loaded .env file from current directory")
except ImportError:
    print("python-dotenv not installed. Using system environment variables only.")

# Check if google.generativeai is installed
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    print("⚠ google-generativeai not installed. Run: pip install google-generativeai")

class GeminiPricePredictor:
    def __init__(self, api_key=None):
        self.api_key = api_key or os.getenv('GEMINI_API_KEY')
        self.model = None
        
        if GEMINI_AVAILABLE and self.api_key:
            try:
                genai.configure(api_key=self.api_key)
                # Use Gemini 2.5 Flash - stable and available
                self.model = genai.GenerativeModel('models/gemini-2.5-flash')
                print("✅ Gemini AI initialized successfully")
            except Exception as e:
                print(f"❌ Failed to initialize Gemini: {e}")
                self.model = None
        else:
            if not GEMINI_AVAILABLE:
                print("⚠ Gemini library not available")
            else:
                print("⚠ No API key provided. Set GEMINI_API_KEY environment variable")
    
    def predict_price(self, category, condition, title="", description="", user_price=0):
        """
        Use Gemini AI to predict product price based on real market data
        """
        if not self.model:
            # Fallback to rule-based prediction only if Gemini is not available
            return self._fallback_prediction(category, condition, title, description, user_price)
        
        try:
            # Create a comprehensive prompt for Gemini to analyze real market prices
            product_info = f"Category: {category}\nCondition: {condition}"
            if title:
                product_info += f"\nProduct: {title}"
            if description:
                product_info += f"\nDetails: {description}"
            if user_price > 0:
                product_info += f"\nSeller's asking price: ₹{user_price}"
            
            prompt = f"""You are an expert price analyst for Indian marketplaces. Your job is to research and predict fair resale prices based on ACTUAL CURRENT MARKET DATA.

PRODUCT TO ANALYZE:
{product_info}

YOUR RESEARCH PROCESS:
1. IDENTIFY the exact product (brand, model, specifications)
2. RESEARCH current market prices on:
   - OLX India (olx.in)
   - Quikr (quikr.com)
   - Amazon India used/renewed section
   - Flipkart refurbished section
   - Facebook Marketplace
   - Campus/Student marketplaces

3. FIND the original retail price (MRP/launch price)

4. ANALYZE depreciation factors:
   - Age/Year of purchase
   - Current condition (New/Like New/Good/Fair/Poor)
   - Brand reputation and demand
   - Market supply and demand
   - Season/timing factors

5. CALCULATE fair resale price based on:
   - Actual listings for similar products (average of 5-10 listings)
   - Condition-based depreciation from retail price
   - Market trends for this product category

CONDITION MULTIPLIERS (from original retail):
- New/Sealed: 85-95% of current retail
- Like New: 65-80% of current retail  
- Good: 45-65% of current retail
- Fair: 30-45% of current retail
- Poor: 15-30% of current retail

CRITICAL RULES:
❌ DO NOT use generic/placeholder prices
❌ DO NOT make up prices without research
✅ RESEARCH the specific product model and brand
✅ USE actual market data from Indian marketplaces
✅ CONSIDER the exact specifications mentioned
✅ ACCOUNT for condition impact realistically
✅ KEEP reasoning SHORT and CONCISE (2-3 sentences max)

EXAMPLE RESEARCH:
Product: "HP Pavilion 15, Intel Core i5 11th Gen, 8GB RAM, 512GB SSD, Good condition"
Research: 
- Original retail: ₹55,000-60,000 (2022 launch)
- OLX listings: ₹25,000-32,000 for similar specs
- Flipkart refurbished: ₹28,000-35,000
- Age: ~2 years, Good condition
- Fair price: ₹28,000 (average of current listings, considering condition)

Return ONLY valid JSON with SHORT reasoning (2-3 sentences):
{{"predicted": <integer_price>, "lower": <integer_min>, "upper": <integer_max>, "confidence": "high", "reasoning": "<2-3 sentences: Original price, current market listings, final recommendation>"}}

RESPOND NOW WITH PRICING FOR THE PRODUCT ABOVE:"""
            
            # Generate response from Gemini
            response = self.model.generate_content(prompt)
            response_text = response.text.strip()
            
            # Extract JSON from response
            if '```json' in response_text:
                json_start = response_text.find('```json') + 7
                json_end = response_text.find('```', json_start)
                response_text = response_text[json_start:json_end].strip()
            elif '```' in response_text:
                json_start = response_text.find('```') + 3
                json_end = response_text.find('```', json_start)
                response_text = response_text[json_start:json_end].strip()
            
            # Parse JSON
            result = json.loads(response_text)
            
            # Validate and ensure integer prices
            result['predicted'] = int(result.get('predicted', 0))
            result['lower'] = int(result.get('lower', result['predicted'] * 0.8))
            result['upper'] = int(result.get('upper', result['predicted'] * 1.2))
            result['confidence'] = result.get('confidence', 'high')
            result['reasoning'] = result.get('reasoning', 'AI-based market analysis')
            
            # Ensure minimum price
            if result['predicted'] < 10:
                result['predicted'] = 10
                result['lower'] = 10
                result['upper'] = 50
            
            print(f"✅ Gemini prediction: ₹{result['predicted']}")
            print(f"📊 Reasoning: {result['reasoning'][:100]}...")
            return result
            
        except Exception as e:
            print(f"❌ Gemini prediction failed: {e}")
            print(f"Response was: {response_text if 'response_text' in locals() else 'No response'}")
            # Fallback to rule-based
            return self._fallback_prediction(category, condition, title, description, user_price)
    
    def _fallback_prediction(self, category, condition, title="", description="", user_price=0):
        """Minimal fallback when Gemini is unavailable - requires valid API key for best results"""
        print("⚠ WARNING: Gemini AI unavailable. Unable to research market prices.")
        print("📝 Please set up a valid GEMINI_API_KEY for accurate predictions.")
        
        # Condition multipliers for used items
        condition_multipliers = {
            'New': 0.95,
            'Like New': 0.80,
            'Good': 0.60,
            'Fair': 0.40,
            'Poor': 0.25
        }
        
        # If user provided their price, use it as reference
        if user_price > 0:
            multiplier = condition_multipliers.get(condition, 0.60)
            # Assume user entered new/retail price, adjust for condition
            predicted = int(user_price * multiplier)
            
            return {
                'predicted': predicted,
                'lower': int(predicted * 0.85),
                'upper': int(predicted * 1.15),
                'confidence': 'low',
                'reasoning': f'Estimated based on your price input adjusted for {condition} condition. For accurate market research, please set up Gemini API key.'
            }
        
        # No user price and no API - cannot predict accurately
        return {
            'predicted': 0,
            'lower': 0,
            'upper': 0,
            'confidence': 'none',
            'reasoning': f'Unable to predict price without market data. Please: 1) Enter your expected price, or 2) Set up Gemini API key at https://aistudio.google.com/app/apikey for AI-powered market research.'
        }
    
    def get_price_range(self, category, condition, title="", description="", user_price=0):
        """Get price prediction with range"""
        return self.predict_price(category, condition, title, description, user_price)

def main():
    """Main function for command-line usage"""
    if len(sys.argv) < 3:
        print("Usage:")
        print("  python ai_gemini_predictor.py <category> <condition> [title] [description] [userPrice]")
        print("  Example: python ai_gemini_predictor.py Electronics 'Like New' 'iPhone 12' 'Good condition' 25000")
        print("\nSet GEMINI_API_KEY environment variable with your API key")
        return
    
    category = sys.argv[1]
    condition = sys.argv[2]
    title = sys.argv[3] if len(sys.argv) > 3 else ""
    description = sys.argv[4] if len(sys.argv) > 4 else ""
    user_price = float(sys.argv[5]) if len(sys.argv) > 5 else 0
    
    predictor = GeminiPricePredictor()
    result = predictor.get_price_range(category, condition, title, description, user_price)
    
    # Output as JSON for Node.js to parse
    print(json.dumps(result))

if __name__ == "__main__":
    main()
