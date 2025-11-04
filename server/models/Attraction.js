const mongoose = require('mongoose');

const attractionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  destination: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Destination',
    required: true
  },
  category: {
    type: String,
    enum: ['historical', 'cultural', 'natural', 'entertainment', 'shopping', 'dining', 'religious', 'museum', 'park', 'beach'],
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
    },
    address: String
  },
  images: [String],
  videos: [String],
  openingHours: {
    monday: { open: String, close: String, closed: Boolean },
    tuesday: { open: String, close: String, closed: Boolean },
    wednesday: { open: String, close: String, closed: Boolean },
    thursday: { open: String, close: String, closed: Boolean },
    friday: { open: String, close: String, closed: Boolean },
    saturday: { open: String, close: String, closed: Boolean },
    sunday: { open: String, close: String, closed: Boolean }
  },
  admission: {
    adult: Number,
    child: Number,
    student: Number,
    senior: Number,
    currency: { type: String, default: 'VND' },
    free: Boolean
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'moderate', 'challenging'],
    default: 'easy'
  },
  accessibility: {
    wheelchair: Boolean,
    elevator: Boolean,
    parking: Boolean,
    publicTransport: Boolean
  },
  amenities: [String],
  contact: {
    phone: String,
    email: String,
    website: String
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
    visitDate: Date,
    createdAt: { type: Date, default: Date.now }
  }],
  tags: [String],
  popularity: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  features: {
    familyFriendly: Boolean,
    romantic: Boolean,
    instagramWorthy: Boolean,
    educational: Boolean,
    adventure: Boolean
  }
}, {
  timestamps: true
});

// Indexes
attractionSchema.index({ location: '2dsphere' });
attractionSchema.index({ destination: 1, category: 1 });
attractionSchema.index({ name: 'text', description: 'text', tags: 'text' });
attractionSchema.index({ rating: -1 });
attractionSchema.index({ popularity: -1 });
attractionSchema.index({ isActive: 1 });

// Update average rating when reviews change
attractionSchema.pre('save', function(next) {
  if (this.reviews && this.reviews.length > 0) {
    const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
    this.rating.average = totalRating / this.reviews.length;
    this.rating.count = this.reviews.length;
  }
  next();
});

module.exports = mongoose.model('Attraction', attractionSchema);
