const mongoose = require('mongoose');

const destinationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  country: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  category: {
    type: String,
    enum: ['city', 'beach', 'mountain', 'cultural', 'adventure', 'nature', 'historical'],
    required: true
  },
  budgetRange: {
    min: { type: Number, required: true },
    max: { type: Number, required: true }
  },
  recommendedDuration: {
    type: Number, // in days
    required: true
  },
  bestTimeToVisit: [String], // months
  climate: {
    type: String,
    enum: ['tropical', 'temperate', 'continental', 'arctic', 'desert']
  },
  language: [String],
  currency: String,
  timezone: String,
  images: [String],
  videos: [String],
  attractions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Attraction'
  }],
  accommodations: [{
    name: String,
    type: {
      type: String,
      enum: ['hotel', 'hostel', 'resort', 'apartment', 'homestay']
    },
    priceRange: {
      min: Number,
      max: Number
    },
    rating: Number,
    address: String,
    amenities: [String]
  }],
  restaurants: [{
    name: String,
    cuisine: String,
    priceRange: {
      min: Number,
      max: Number
    },
    rating: Number,
    address: String,
    specialties: [String]
  }],
  transportation: {
    airport: {
      name: String,
      code: String,
      distance: Number // km from city center
    },
    publicTransport: [String],
    carRental: Boolean,
    taxi: Boolean
  },
  safety: {
    level: {
      type: String,
      enum: ['very_safe', 'safe', 'moderate', 'caution', 'unsafe']
    },
    notes: [String]
  },
  tags: [String],
  popularity: {
    type: Number,
    default: 0
  },
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  reviews: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: Number,
    comment: String,
    createdAt: { type: Date, default: Date.now }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
destinationSchema.index({ location: '2dsphere' });
destinationSchema.index({ category: 1, popularity: -1 });
destinationSchema.index({ country: 1, city: 1 });
destinationSchema.index({ name: 'text', description: 'text', tags: 'text' });
destinationSchema.index({ rating: -1 });
destinationSchema.index({ isActive: 1 });

// Update average rating when reviews change
destinationSchema.pre('save', function(next) {
  if (this.reviews && this.reviews.length > 0) {
    const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
    this.rating.average = totalRating / this.reviews.length;
    this.rating.count = this.reviews.length;
  }
  next();
});

module.exports = mongoose.model('Destination', destinationSchema);
