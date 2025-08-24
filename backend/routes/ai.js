
// routes/ai.js - AI-Powered Features for CampX
const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const multer = require('multer');
const sharp = require('sharp');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Configure multer for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// AI Image Analysis and Description Generation
router.post('/analyze-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }

    // Process image with Sharp for optimization
    const processedImage = await sharp(req.file.buffer)
      .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();

    // Convert to base64 for OpenAI Vision API
    const base64Image = processedImage.toString('base64');

    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this image for a student marketplace listing. Provide:
              1. A catchy product title (max 60 chars)
              2. Detailed description (max 200 words)
              3. Suggested category from: Textbooks, Electronics, Laptops, Furniture, Clothing, Sports, Academic, Other
              4. Estimated condition: New, Excellent, Good, Fair, Poor
              5. Key features/specifications
              6. Suggested tags (max 5)
              
              Format as JSON with keys: title, description, category, condition, features, tags`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 500
    });

    let analysis;
    try {
      analysis = JSON.parse(response.choices[0].message.content);
    } catch (parseError) {
      // Fallback if JSON parsing fails
      const content = response.choices[0].message.content;
      analysis = {
        title: "Product Title",
        description: content.substring(0, 200),
        category: "Other",
        condition: "Good",
        features: [],
        tags: []
      };
    }

    res.json({
      success: true,
      analysis: {
        title: analysis.title || "Product Title",
        description: analysis.description || "",
        category: analysis.category || "Other",
        condition: analysis.condition || "Good",
        features: analysis.features || [],
        tags: analysis.tags || [],
        confidence: 0.85 // Mock confidence score
      }
    });

  } catch (error) {
    console.error('AI Image Analysis Error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze image',
      details: error.message 
    });
  }
});

// Smart Description Enhancement
router.post('/enhance-description', async (req, res) => {
  try {
    const { title, basicDescription, category, condition, price } = req.body;

    if (!title || !basicDescription) {
      return res.status(400).json({ error: 'Title and basic description are required' });
    }

    const prompt = `
    Enhance this student marketplace listing to make it more appealing:
    
    Title: ${title}
    Category: ${category}
    Condition: ${condition}
    Price: ₹${price}
    Basic Description: ${basicDescription}
    
    Create an enhanced description that:
    - Highlights key benefits for students
    - Mentions condition and value proposition
    - Uses engaging but professional language
    - Includes relevant keywords for searchability
    - Stays under 150 words
    - Avoids excessive emojis or AI-generated feel
    
    Make it sound natural and trustworthy.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a copywriting expert specializing in student marketplace listings. Create engaging, trustworthy descriptions that convert browsers to buyers."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 200,
      temperature: 0.7
    });

    const enhancedDescription = response.choices[0].message.content.trim();

    res.json({
      success: true,
      enhancedDescription,
      originalDescription: basicDescription
    });

  } catch (error) {
    console.error('Description Enhancement Error:', error);
    res.status(500).json({ 
      error: 'Failed to enhance description',
      details: error.message 
    });
  }
});

// Smart Pricing Suggestions
router.post('/suggest-price', async (req, res) => {
  try {
    const { title, category, condition, originalPrice, description } = req.body;

    const prompt = `
    As a student marketplace pricing expert, suggest a competitive price for:
    
    Item: ${title}
    Category: ${category}
    Condition: ${condition}
    Original Price: ₹${originalPrice || 'Unknown'}
    Description: ${description}
    
    Consider:
    - Student budget constraints
    - Depreciation based on condition
    - Market demand for this category
    - Fair pricing for both buyer and seller
    
    Provide:
    1. Suggested price
    2. Price range (min-max)
    3. Brief reasoning
    
    Format as JSON: {"suggestedPrice": number, "minPrice": number, "maxPrice": number, "reasoning": "text"}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a pricing expert for student marketplaces in India. Provide realistic, competitive pricing suggestions."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 150,
      temperature: 0.3
    });

    let pricingSuggestion;
    try {
      pricingSuggestion = JSON.parse(response.choices[0].message.content);
    } catch (parseError) {
      pricingSuggestion = {
        suggestedPrice: originalPrice ? Math.floor(originalPrice * 0.7) : 1000,
        minPrice: originalPrice ? Math.floor(originalPrice * 0.5) : 800,
        maxPrice: originalPrice ? Math.floor(originalPrice * 0.8) : 1200,
        reasoning: "Based on typical depreciation for used items"
      };
    }

    res.json({
      success: true,
      pricing: pricingSuggestion
    });

  } catch (error) {
    console.error('Price Suggestion Error:', error);
    res.status(500).json({ 
      error: 'Failed to suggest price',
      details: error.message 
    });
  }
});

// Smart Search and Recommendations
router.post('/smart-search', async (req, res) => {
  try {
    const { query, userProfile } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const prompt = `
    Interpret this student marketplace search query and extract relevant filters:
    
    Query: "${query}"
    User Profile: ${JSON.stringify(userProfile || {})}
    
    Extract:
    - Keywords for title/description search
    - Likely category
    - Price range (if mentioned)
    - Condition preferences
    - Location relevance
    - Sort preferences
    
    Format as JSON: {
      "keywords": ["word1", "word2"],
      "category": "category or null",
      "priceRange": {"min": number, "max": number} or null,
      "condition": ["conditions"] or null,
      "sortBy": "relevance|price|date|popularity",
      "intent": "buying|browsing|specific_item"
    }`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a search query interpreter for a student marketplace. Extract structured search parameters from natural language queries."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 200,
      temperature: 0.2
    });

    let searchParams;
    try {
      searchParams = JSON.parse(response.choices[0].message.content);
    } catch (parseError) {
      searchParams = {
        keywords: query.split(' ').filter(word => word.length > 2),
        category: null,
        priceRange: null,
        condition: null,
        sortBy: "relevance",
        intent: "browsing"
      };
    }

    res.json({
      success: true,
      searchParams,
      originalQuery: query
    });

  } catch (error) {
    console.error('Smart Search Error:', error);
    res.status(500).json({ 
      error: 'Failed to process search query',
      details: error.message 
    });
  }
});

// Chat Message Suggestions
router.post('/suggest-message', async (req, res) => {
  try {
    const { itemTitle, messageType, context } = req.body;

    const prompts = {
      initial: `Suggest 3 friendly, professional opening messages for inquiring about "${itemTitle}" on a student marketplace. Keep them casual but respectful.`,
      negotiation: `Suggest 3 polite price negotiation messages for "${itemTitle}". Context: ${context}`,
      purchase: `Suggest 3 messages expressing serious purchase intent for "${itemTitle}".`,
      meetup: `Suggest 3 messages for arranging a safe meetup to view/buy "${itemTitle}" on campus.`
    };

    const prompt = prompts[messageType] || prompts.initial;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Generate natural, friendly message suggestions for student marketplace communications. Avoid overly formal or robotic language."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 150,
      temperature: 0.8
    });

    const suggestions = response.choices[0].message.content
      .split('\n')
      .filter(line => line.trim())
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .slice(0, 3);

    res.json({
      success: true,
      suggestions,
      messageType
    });

  } catch (error) {
    console.error('Message Suggestion Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate message suggestions',
      details: error.message 
    });
  }
});

module.exports = router;
