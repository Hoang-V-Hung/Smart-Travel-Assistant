const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },
    avatar: {
        type: String,
        default: null
    },
    preferences: {
        interests: [String],
        travelStyle: {
            type: String,
            enum: ['budget', 'luxury', 'adventure', 'cultural', 'relaxation'],
            default: 'cultural'
        },
        budgetRange: {
            min: { type: Number, default: 0 },
            max: { type: Number, default: 10000000 }
        }
    },
    travelHistory: [{
        destination: String,
        visitedAt: Date,
        rating: Number,
        review: String
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ createdAt: -1 });

module.exports = mongoose.model('User', userSchema);
