
// routes/items.js - Enhanced Items Routes with AI Features
const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const Item = require('../models/Item');
const User = require('../models/User');
const { auth, optionalAuth } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Cloudinary storage for multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'campx-items',
    allowed_formats: ['jpeg', 'jpg', 'png', 'webp'],
    transformation: [
      { width: 800, height: 600, crop: 'limit', quality: 'auto' }
    ]
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 5 // Max 5 files
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Rate limiting for item creation
const createItemLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Max 10 items per hour per user
  message: { error: 'Too many items created. Please try again later.' }
});

// GET all items with advanced filtering and search
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      condition,
      minPrice,
      maxPrice,
      campus,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status = 'Available'
    } = req.query;

    // Build filter object
    const filter = { status };

    if (category && category !== 'all') {
      filter.category = category;
    }

    if (condition) {
      filter.condition = { $in: condition.split(',') };
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (campus) {
      filter.campus = { $regex: campus, $options: 'i' };
    }

    if (search) {
      filter.$text = { $search: search };
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const items = await Item.find(filter)
      .populate('seller', 'name avatar initials rating verified campus')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .lean();

    // Get total count for pagination
    const totalItems = await Item.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / limit);

    // Add user-specific data if authenticated
    if (req.userId) {
      const user = await User.findById(req.userId).select('savedItems');
      items.forEach(item => {
        item.isSaved = user.savedItems.includes(item._id);
        item.isOwner = item.seller._id.toString() === req.userId;
      });
    }

    res.json({
      items,
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalItems,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      filters: {
        category,
        condition,
        priceRange: { min: minPrice, max: maxPrice },
        campus,
        search
      }
    });

  } catch (error) {
    console.error('Get items error:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// GET single item by ID
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id)
      .populate('seller', 'name avatar initials rating verified campus phone email preferences createdAt')
      .populate('reviews.user', 'name avatar initials');

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Increment view count (but not for owner)
    if (!req.userId || item.seller._id.toString() !== req.userId) {
      await Item.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
      item.views += 1;
    }

    // Add user-specific data if authenticated
    if (req.userId) {
      const user = await User.findById(req.userId).select('savedItems');
      item.isSaved = user.savedItems.includes(item._id);
      item.isOwner = item.seller._id.toString() === req.userId;
    }

    // Get similar items
    const similarItems = await Item.find({
      _id: { $ne: item._id },
      category: item.category,
      status: 'Available',
      campus: item.campus
    })
    .populate('seller', 'name avatar initials rating verified')
    .limit(4)
    .select('title price images condition seller campus')
    .lean();

    res.json({
      item: item.toObject(),
      similarItems
    });

  } catch (error) {
    console.error('Get item error:', error);
    res.status(500).json({ error: 'Failed to fetch item' });
  }
});

// POST create new item
router.post('/', auth, createItemLimiter, upload.array('images', 5), async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      subcategory,
      price,
      originalPrice,
      condition,
      location,
      campus,
      tags,
      negotiable,
      urgent
    } = req.body;

    // Validate required fields
    if (!title || !price || !category || !location || !campus) {
      return res.status(400).json({ 
        error: 'Missing required fields: title, price, category, location, campus' 
      });
    }

    // Process uploaded images
    const images = req.files ? req.files.map(file => ({
      url: file.path,
      public_id: file.filename,
      alt_text: `${title} - Image`
    })) : [];

    // Parse tags if provided as string
    let parsedTags = [];
    if (tags) {
      try {
        parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      } catch {
        parsedTags = tags.split(',').map(tag => tag.trim());
      }
    }

    // Create new item
    const item = new Item({
      title: title.trim(),
      description: description?.trim(),
      category,
      subcategory: subcategory?.trim(),
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : null,
      condition,
      location: location.trim(),
      campus: campus.trim(),
      images,
      seller: req.userId,
      tags: parsedTags,
      negotiable: negotiable === 'true' || negotiable === true,
      urgent: urgent === 'true' || urgent === true
    });

    await item.save();

    // Populate seller info for response
    await item.populate('seller', 'name avatar initials rating verified campus');

    res.status(201).json({
      message: 'Item created successfully',
      item: item.toObject()
    });

  } catch (error) {
    console.error('Create item error:', error);
    res.status(500).json({ 
      error: 'Failed to create item', 
      details: error.message 
    });
  }
});

// PUT update item
router.put('/:id', auth, upload.array('newImages', 5), async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Check if user owns the item
    if (item.seller.toString() !== req.userId) {
      return res.status(403).json({ error: 'You can only update your own items' });
    }

    // Prepare update data
    const allowedUpdates = [
      'title', 'description', 'category', 'subcategory', 'price', 
      'originalPrice', 'condition', 'location', 'tags', 'negotiable', 
      'urgent', 'status'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key) && req.body[key] !== undefined) {
        if (key === 'tags' && typeof req.body[key] === 'string') {
          try {
            updates[key] = JSON.parse(req.body[key]);
          } catch {
            updates[key] = req.body[key].split(',').map(tag => tag.trim());
          }
        } else if (key === 'negotiable' || key === 'urgent') {
          updates[key] = req.body[key] === 'true' || req.body[key] === true;
        } else {
          updates[key] = req.body[key];
        }
      }
    });

    // Handle new images
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => ({
        url: file.path,
        public_id: file.filename,
        alt_text: `${updates.title || item.title} - Image`
      }));
      
      updates.images = [...item.images, ...newImages];
    }

    // Handle image removal
    if (req.body.removeImages) {
      const removeIds = JSON.parse(req.body.removeImages);
      const remainingImages = item.images.filter(img => !removeIds.includes(img.public_id));
      updates.images = remainingImages;

      // Delete removed images from Cloudinary
      for (const imageId of removeIds) {
        try {
          await cloudinary.uploader.destroy(imageId);
        } catch (error) {
          console.error('Failed to delete image from Cloudinary:', error);
        }
      }
    }

    // Update item
    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('seller', 'name avatar initials rating verified campus');

    res.json({
      message: 'Item updated successfully',
      item: updatedItem.toObject()
    });

  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({ 
      error: 'Failed to update item', 
      details: error.message 
    });
  }
});

// DELETE item
router.delete('/:id', auth, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Check if user owns the item
    if (item.seller.toString() !== req.userId) {
      return res.status(403).json({ error: 'You can only delete your own items' });
    }

    // Delete images from Cloudinary
    for (const image of item.images) {
      try {
        await cloudinary.uploader.destroy(image.public_id);
      } catch (error) {
        console.error('Failed to delete image from Cloudinary:', error);
      }
    }

    // Remove item from all users' saved lists
    await User.updateMany(
      { savedItems: item._id },
      { $pull: { savedItems: item._id } }
    );

    // Delete the item
    await Item.findByIdAndDelete(req.params.id);

    res.json({ message: 'Item deleted successfully' });

  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// POST save/unsave item
router.post('/:id/save', auth, async (req, res) => {
  try {
    const itemId = req.params.id;
    const userId = req.userId;

    const [item, user] = await Promise.all([
      Item.findById(itemId),
      User.findById(userId)
    ]);

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const isSaved = user.savedItems.includes(itemId);

    if (isSaved) {
      // Unsave item
      user.savedItems.pull(itemId);
      await Promise.all([
        user.save(),
        Item.findByIdAndUpdate(itemId, { $inc: { saves: -1 } })
      ]);
      
      res.json({ message: 'Item removed from saved items', saved: false });
    } else {
      // Save item
      user.savedItems.push(itemId);
      await Promise.all([
        user.save(),
        Item.findByIdAndUpdate(itemId, { $inc: { saves: 1 } })
      ]);
      
      res.json({ message: 'Item saved successfully', saved: true });
    }

  } catch (error) {
    console.error('Save item error:', error);
    res.status(500).json({ error: 'Failed to save/unsave item' });
  }
});

// GET user's items
router.get('/user/my-items', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    const filter = { seller: req.userId };
    if (status) {
      filter.status = status;
    }

    const skip = (page - 1) * limit;
    const items = await Item.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const totalItems = await Item.countDocuments(filter);

    res.json({
      items,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalItems / limit),
        totalItems
      }
    });

  } catch (error) {
    console.error('Get my items error:', error);
    res.status(500).json({ error: 'Failed to fetch your items' });
  }
});

// GET user's saved items
router.get('/user/saved', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const user = await User.findById(req.userId)
      .populate({
        path: 'savedItems',
        populate: {
          path: 'seller',
          select: 'name avatar initials rating verified campus'
        },
        options: {
          sort: { createdAt: -1 },
          skip: (page - 1) * limit,
          limit: Number(limit)
        }
      });

    res.json({
      items: user.savedItems || [],
      pagination: {
        currentPage: Number(page),
        totalItems: user.savedItems?.length || 0
      }
    });

  } catch (error) {
    console.error('Get saved items error:', error);
    res.status(500).json({ error: 'Failed to fetch saved items' });
  }
});

module.exports = router;
