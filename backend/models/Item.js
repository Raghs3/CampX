
// models/Item.js
const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const ItemSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 100
  },
  description: { 
    type: String,
    trim: true,
    maxlength: 1000
  },
  aiGeneratedDescription: {
    type: String,
    trim: true
  },
  category: { 
    type: String, 
    required: true,
    enum: ['Textbooks', 'Electronics', 'Laptops', 'Furniture', 'Clothing', 'Sports', 'Academic', 'Other']
  },
  subcategory: {
    type: String,
    trim: true
  },
  price: { 
    type: Number, 
    required: true,
    min: 0
  },
  originalPrice: {
    type: Number,
    min: 0
  },
  condition: { 
    type: String, 
    default: 'Good',
    enum: ['New', 'Excellent', 'Good', 'Fair', 'Poor']
  },
  location: { 
    type: String,
    required: true,
    trim: true
  },
  campus: {
    type: String,
    required: true,
    trim: true
  },
  images: [{ 
    url: String,
    public_id: String,
    alt_text: String
  }],
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tags: [String],
  status: {
    type: String,
    default: 'Available',
    enum: ['Available', 'Sold', 'Reserved', 'Hidden']
  },
  views: {
    type: Number,
    default: 0
  },
  saves: {
    type: Number,
    default: 0
  },
  savedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  reviews: [ReviewSchema],
  rating: {
    type: Number,
    default: 0
  },
  negotiable: {
    type: Boolean,
    default: true
  },
  urgent: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
  }
}, {
  timestamps: true
});

// Indexes for better query performance
ItemSchema.index({ seller: 1, createdAt: -1 });
ItemSchema.index({ category: 1, status: 1 });
ItemSchema.index({ campus: 1, status: 1 });
ItemSchema.index({ title: 'text', description: 'text', tags: 'text' });

// Virtual for average rating
ItemSchema.virtual('averageRating').get(function() {
  if (this.reviews.length === 0) return 0;
  const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
  return Math.round((sum / this.reviews.length) * 10) / 10;
});

// Middleware to update rating when reviews change
ItemSchema.pre('save', function(next) {
  if (this.reviews.length > 0) {
    const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
    this.rating = Math.round((sum / this.reviews.length) * 10) / 10;
  }
  next();
});

module.exports = mongoose.model('Item', ItemSchema);
