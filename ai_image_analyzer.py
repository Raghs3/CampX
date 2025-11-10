"""
AI Image Analysis using Google Gemini Vision API
Analyzes product images to auto-fill details and detect suspicious content
"""

import os
import json
import sys
import warnings
warnings.filterwarnings('ignore')

# Fix Windows encoding
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

# Load .env file
try:
    from dotenv import load_dotenv
    env_path = os.path.join(os.path.dirname(__file__), 'server', '.env')
    if os.path.exists(env_path):
        load_dotenv(env_path)
    else:
        load_dotenv()
except ImportError:
    pass

# Check if Gemini is available
try:
    import google.generativeai as genai
    from PIL import Image
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    print("⚠ google-generativeai or PIL not installed")

class ImageAnalyzer:
    def __init__(self, api_key=None):
        self.api_key = api_key or os.getenv('GEMINI_API_KEY')
        self.model = None
        
        if GEMINI_AVAILABLE and self.api_key:
            try:
                genai.configure(api_key=self.api_key)
                self.model = genai.GenerativeModel('models/gemini-2.5-flash')
                print("✅ Gemini Vision initialized", file=sys.stderr)
            except Exception as e:
                print(f"❌ Failed to initialize Gemini: {e}", file=sys.stderr)
                self.model = None
    
    def analyze_product_image(self, image_paths):
        """
        Analyze product image(s) and return:
        - Item identification (title, description)
        - Category
        - Condition assessment
        - Price suggestion
        - Legitimacy check (is it a real product photo?)
        
        Accepts single image path or list of image paths
        """
        if not self.model:
            return self._fallback_analysis()
        
        # Convert single path to list for uniform processing
        if isinstance(image_paths, str):
            image_paths = [image_paths]
        
        try:
            # Load all images
            images = []
            for img_path in image_paths:
                if os.path.exists(img_path):
                    images.append(Image.open(img_path))
                else:
                    print(f"⚠️ Image not found: {img_path}", file=sys.stderr)
            
            # Craft a comprehensive prompt for multiple images
            image_count = len(images)
            multi_image_hint = f"Look at all {image_count} images together to get a complete view of the product." if image_count > 1 else ""
            prompt_prefix = "these product images" if image_count > 1 else "this product image"
            
            prompt = f"""Analyze {prompt_prefix} for a campus marketplace listing. {multi_image_hint}

Respond with ONLY a flat JSON object (no nested objects) with these exact fields:

{{
  "title": "Short product name (3-6 words)",
  "description": "Brief description (1-2 sentences, under 100 words)",
  "category": "One of: Books, Electronics, Furniture, Clothing, Sports, Stationery, Other",
  "condition": "One of: Like New, Good, Fair, Poor",
  "condition_reason": "Why this condition? (1 sentence)",
  "suggested_price_inr": 0,
  "price_reasoning": "Brief market research (2-3 sentences, check OLX/Amazon/Flipkart)",
  "is_legitimate": true,
  "legitimacy_score": 0,
  "flags": [],
  "flag_reason": "Explanation if flagged (1-2 sentences, empty string if clean)"
}}

**Legitimacy Criteria**:
- ✅ LEGITIMATE: Actual product photos, real items being sold
- ❌ FLAG if: Stock images, memes, screenshots, inappropriate content, AI-generated, not a product, duplicate watermarks, celebrity photos, pornography, weapons, drugs

Respond ONLY with valid JSON. NO nested objects. Be concise."""

            # Call Gemini Vision API with all images
            # Build content list: [prompt, img1, img2, img3, ...]
            content = [prompt] + images
            response = self.model.generate_content(content)
            
            # Parse response
            response_text = response.text.strip()
            
            # Extract JSON from markdown code blocks if present
            if '```json' in response_text:
                response_text = response_text.split('```json')[1].split('```')[0].strip()
            elif '```' in response_text:
                response_text = response_text.split('```')[1].split('```')[0].strip()
            
            result = json.loads(response_text)
            
            print(f"✅ Gemini analysis complete", file=sys.stderr)
            return result
            
        except json.JSONDecodeError as e:
            print(f"❌ JSON parsing error: {e}", file=sys.stderr)
            print(f"Raw response: {response_text[:200]}", file=sys.stderr)
            return self._fallback_analysis()
        except Exception as e:
            print(f"❌ Gemini API error: {e}", file=sys.stderr)
            return self._fallback_analysis()
    
    def _fallback_analysis(self):
        """Fallback when Gemini is unavailable"""
        return {
            "title": "Product",
            "description": "Please add product description manually",
            "category": "Other",
            "condition": "Good",
            "condition_reason": "Manual assessment required",
            "suggested_price_inr": 0,
            "price_reasoning": "AI unavailable - please set price manually",
            "is_legitimate": True,
            "legitimacy_score": 50,
            "flags": ["ai_unavailable"],
            "flag_reason": "AI service unavailable, manual review recommended"
        }

def main():
    if len(sys.argv) < 2:
        print(json.dumps({
            "error": "Missing image path argument",
            "usage": "python ai_image_analyzer.py <image_path1> [image_path2] [image_path3] ..."
        }))
        sys.exit(1)
    
    # Get all image paths from command line arguments
    image_paths = sys.argv[1:]
    
    # Validate all paths exist
    valid_paths = []
    for img_path in image_paths:
        if os.path.exists(img_path):
            valid_paths.append(img_path)
        else:
            print(json.dumps({
                "error": f"Image file not found: {img_path}"
            }))
            sys.exit(1)
    
    # Analyze images
    analyzer = ImageAnalyzer()
    result = analyzer.analyze_product_image(valid_paths)
    
    # Output JSON result
    print(json.dumps(result, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
