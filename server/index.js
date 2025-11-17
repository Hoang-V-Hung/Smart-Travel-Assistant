const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const connectDB = require('./config/database');
const destinationRoutes = require('./routes/destinationRoutes');
// Load environment variables from .env file
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// Connect to MongoDB (optional - server will still run without MongoDB)
if (process.env.MONGODB_URI) {
  connectDB();
} else {
  console.warn('⚠️  MONGODB_URI not found in .env file. MongoDB connection skipped.');
  console.warn('⚠️  Some features may not work without database connection.');
}

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.CLIENT_URL ,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau 15 phút.'
});
app.use('/api/', limiter);

// Routes - Chỉ giữ các routes liên quan đến 3 tính năng chính
app.use('/api/auth', require('./routes/auth')); // Authentication (cần thiết)
app.use('/api/ai', require('./routes/ai')); // OpenAI/GPT API (Tính năng 1)
app.use('/api/trips', require('./routes/trips')); // Quản lý kế hoạch du lịch
// geoapify
app.use('/api/destinations', destinationRoutes);// Quản lý kế hoạch du lịch

app.use('/api/places', require('./routes/openstreetmapRoutes')); // Travel Advisor API (hiện tại)
app.use('/api/osm', require('./routes/openstreetmapRoutes')); // OpenStreetMap API - HOÀN TOÀN MIỄN PHÍ, KHÔNG CẦN API KEY

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Smart Travel Assistant API đang hoạt động',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Có lỗi xảy ra trên server',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'API endpoint không tồn tại' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy trên port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`📱 Client URL: ${process.env.CLIENT_URL}`);
});