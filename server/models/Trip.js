// [FILE: models/Trip.js]
const mongoose = require('mongoose');

// Schema cho địa điểm (giữ nguyên để tương thích)
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
  hotels: {
    type: [String], 
    default: []
  },
  
  // 2. Đổi type thành [String]
  restaurants: {
    type: [String],
    default: []
  },
  
  // 3. Đổi type thành [String]
  attractions: {
    type: [String], 
    default: []
  },
  // Các trường cũ
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
  linkedAttractions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Attraction'
  }],
  notes: String
});

// === SCHEMA MỚI: Chi tiết hoạt động ===
const activityDetailSchema = new mongoose.Schema({
  time: String,
  type: String, // 'meal', 'attraction', 'checkin', 'checkout'
  title: String,
  description: String,
  location: String,
  duration: String,
  cost: Number,
  selected: { type: Boolean, default: true }
});

// === SCHEMA MỚI: Lịch trình theo ngày ===
const itineraryDaySchema = new mongoose.Schema({
  day: Number,
  date: Date,
  weather: Object,
  activities: [activityDetailSchema]
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
  tripDetails: {
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

  origin: { type: String, default: '' }, // Điểm xuất phát
  
  transportMode: {
    type: String,
    enum: ['personal', 'flight'],
    default: 'personal'
  },

  flightDetails: {
    airline: String,       // Hãng bay
    departureTime: Date,   // Ngày đi
    returnTime: Date,      // Ngày về (null nếu là 1 chiều)
    price: Number,         // Giá vé
    currency: { type: String, default: 'VND' }
  },
  
  destinations: [destinationSchema],

  // === TRƯỜNG MỚI: Lưu lịch trình chi tiết ===
  itinerary: [itineraryDaySchema],

  // === CẬP NHẬT: Budget có breakdown chi tiết ===
  budget: {
    total: Number,
    spent: { type: Number, default: 0 },
    currency: { type: String, default: 'VND' },
    // Chi tiết các hạng mục chi phí
    breakdown: {
      flights: { type: Number, default: 0 },       // Vé máy bay
      accommodation: { type: Number, default: 0 }, // Khách sạn
      food: { type: Number, default: 0 },          // Ăn uống
      activities: { type: Number, default: 0 },    // Hoạt động vui chơi
      transport: { type: Number, default: 0 },     // Di chuyển
      others: { type: Number, default: 0 }         // Khác
    }
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

tripSchema.pre('save', function(next) {
  if (this.reviews && this.reviews.length > 0) {
    const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
    this.averageRating = totalRating / this.reviews.length;
  }
  next();
});

module.exports = mongoose.model('Trip', tripSchema);