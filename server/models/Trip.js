const mongoose = require('mongoose');

const destinationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  arrivalDate: {
    type: Date,
    required: true
  },
  departureDate: {
    type: Date,
    required: true
  },
  accommodation: {
    name: String,
    address: String,
    price: Number,
    bookingUrl: String
  },
  activities: [{
    name: String,
    description: String,
    time: String,
    cost: Number,
    location: String
  }],
  attractions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Attraction'
  }],
  notes: String
});

const tripSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  destinations: [destinationSchema],
  budget: {
    total: Number,
    spent: { type: Number, default: 0 },
    currency: { type: String, default: 'VND' }
  },
  travelers: [{
    name: String,
    email: String,
    phone: String
  }],
  status: {
    type: String,
    enum: ['planning', 'confirmed', 'ongoing', 'completed', 'cancelled'],
    default: 'planning'
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  tags: [String],
  photos: [String],
  reviews: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: Number,
    comment: String,
    createdAt: { type: Date, default: Date.now }
  }],
  averageRating: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
tripSchema.index({ userId: 1, createdAt: -1 });
tripSchema.index({ status: 1 });
tripSchema.index({ startDate: 1, endDate: 1 });
tripSchema.index({ isPublic: 1, averageRating: -1 });

// Virtual for duration
tripSchema.virtual('duration').get(function() {
  return Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24));
});

// Update average rating when reviews change
tripSchema.pre('save', function(next) {
  if (this.reviews && this.reviews.length > 0) {
    const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
    this.averageRating = totalRating / this.reviews.length;
  }
  next();
});

module.exports = mongoose.model('Trip', tripSchema);
