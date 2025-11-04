# Hướng Dẫn Tích Hợp API - Smart Travel Assistant

Tài liệu hướng dẫn tích hợp 3 API chính vào dự án Smart Travel Assistant.

## 📋 Tổng quan

Dự án sử dụng 3 API chính:
1. **OpenAI/GPT API** - Lên lịch trình & Sinh nội dung du lịch
2. **Google Maps API** - Tìm địa điểm, chỉ đường, bản đồ
3. **Skyscanner API** - Tìm kiếm chuyến bay
4. **TripAdvisor API** - Điểm tham quan, nhà hàng, khách sạn, đánh giá

## 🚀 Bước 1: Thiết lập Environment Variables

### 1.1. Tạo file `.env`

Copy file `env.example` thành `.env`:

```bash
cp env.example .env
```

### 1.2. Điền các API Keys

Mở file `.env` và điền các API keys thật:

```env
# OpenAI API (GPT)
OPENAI_API_KEY=sk-your-actual-openai-api-key-here
OPENAI_MODEL=gpt-3.5-turbo

# Google Maps API
GOOGLE_MAPS_API_KEY=your-actual-google-maps-api-key-here

# Skyscanner API (qua RapidAPI)
SKYSCANNER_RAPIDAPI_KEY=your-actual-rapidapi-key-here
SKYSCANNER_RAPIDAPI_HOST=skyscanner-flight-search.p.rapidapi.com

# TripAdvisor API (qua RapidAPI)
TRIPADVISOR_RAPIDAPI_KEY=your-actual-rapidapi-key-here
TRIPADVISOR_RAPIDAPI_HOST=tripadvisor1.p.rapidapi.com
```

## 🔑 Bước 2: Lấy API Keys

### 2.1. OpenAI API (GPT)

1. Truy cập: https://platform.openai.com/api-keys
2. Đăng nhập hoặc tạo tài khoản
3. Tạo API key mới
4. Copy API key vào `.env`
5. **Lưu ý:** Cần thanh toán để sử dụng (pay-as-you-go)

**Chi phí tham khảo:**
- GPT-3.5-turbo: $0.0015/1K tokens input, $0.002/1K tokens output
- GPT-4: $0.03/1K tokens input, $0.06/1K tokens output

### 2.2. Google Maps API

1. Truy cập: https://console.cloud.google.com/
2. Tạo project mới hoặc chọn project có sẵn
3. Enable các API sau:
   - Maps JavaScript API
   - Places API
   - Geocoding API
   - Directions API
   - Distance Matrix API
4. Tạo API key: APIs & Services > Credentials > Create Credentials > API Key
5. Copy API key vào `.env`
6. **Bảo mật:** Restrict API key để chỉ sử dụng cho các API đã enable

**Free Tier:**
- $200 credit/tháng (~28,000 requests)
- Sau đó: $0.005-0.05 per request (tùy API)

### 2.3. Skyscanner API (qua RapidAPI)

1. Truy cập: https://rapidapi.com/
2. Đăng ký tài khoản RapidAPI
3. Tìm "Skyscanner Flight Search" API
4. Subscribe Basic plan (free tier: 500 requests/tháng)
5. Copy API key vào `.env`

**Hoặc sử dụng Skyscanner Partners API:**
1. Truy cập: https://developers.skyscanner.net/
2. Đăng ký tài khoản Partners
3. Tạo API key
4. Copy vào `.env` (thay vì RapidAPI keys)

### 2.4. TripAdvisor API (qua RapidAPI)

1. Truy cập: https://rapidapi.com/
2. Tìm "TripAdvisor API" (Tripadvisor1)
3. Subscribe Basic plan (free tier: 100 requests/tháng)
4. Copy API key vào `.env`

**Hoặc sử dụng TripAdvisor API trực tiếp:**
1. Truy cập: https://developer.tripadvisor.com/
2. Đăng ký tài khoản
3. Tạo API key
4. Copy vào `.env`

## 📝 Bước 3: Sử dụng Services

### 3.1. OpenAI Service

**File:** `server/services/openai.js`

```javascript
const openaiService = require('./services/openai');

// Tạo lịch trình du lịch
const plan = await openaiService.generateTripPlan({
  destination: 'Hà Nội',
  duration: 3,
  budget: 5000000,
  interests: ['văn hóa', 'ẩm thực'],
  travelStyle: 'relaxed',
  groupSize: 2,
  startDate: '2024-03-01'
});

// Sinh nội dung du lịch
const content = await openaiService.generateContent({
  type: 'article',
  topic: 'Điểm tham quan Hà Nội',
  destination: 'Hà Nội',
  length: 'medium',
  style: 'informative'
});

// Chat với AI
const response = await openaiService.chat('Gợi ý điểm đến cho chuyến du lịch 3 ngày');

// Gợi ý điểm đến
const recommendations = await openaiService.recommendDestinations({
  preferences: ['văn hóa', 'ẩm thực'],
  budget: 5000000,
  duration: 3,
  season: 'spring'
});
```

### 3.2. Google Maps Service

**File:** `server/services/googleMaps.js`

```javascript
const googleMapsService = require('./services/googleMaps');

// Geocoding - Chuyển đổi địa chỉ thành tọa độ
const location = await googleMapsService.geocode('Hà Nội, Việt Nam');

// Tìm kiếm địa điểm
const places = await googleMapsService.searchPlaces('Chùa Một Cột', {
  location: { lat: 21.0285, lng: 105.8542 },
  radius: 5000
});

// Tìm nhà hàng
const restaurants = await googleMapsService.findRestaurants(
  { lat: 21.0285, lng: 105.8542 },
  { radius: 5000, keyword: 'phở', minPrice: 0, maxPrice: 2 }
);

// Tìm khách sạn
const hotels = await googleMapsService.findHotels(
  { lat: 21.0285, lng: 105.8542 },
  { radius: 5000, minRating: 4 }
);

// Lấy chỉ đường
const directions = await googleMapsService.getDirections(
  { lat: 21.0285, lng: 105.8542 },
  { lat: 20.5937, lng: 105.8542 },
  { mode: 'driving' }
);
```

### 3.3. Skyscanner Service

**File:** `server/services/skyscanner.js`

```javascript
const skyscannerService = require('./services/skyscanner');

// Tìm kiếm chuyến bay
const flights = await skyscannerService.searchFlights({
  origin: 'HAN', // Mã sân bay Hà Nội
  destination: 'SGN', // Mã sân bay TP.HCM
  departureDate: '2024-03-15',
  returnDate: '2024-03-20', // Optional
  adults: 1,
  children: 0,
  cabinClass: 'economy',
  currency: 'VND'
});

// So sánh giá vé
const comparison = await skyscannerService.comparePrices({
  origin: 'HAN',
  destination: 'SGN',
  departureDate: '2024-03-15',
  adults: 1
});

// Lấy thông tin sân bay
const airports = await skyscannerService.getAirports('Hanoi');
```

### 3.4. TripAdvisor Service

**File:** `server/services/tripadvisor.js`

```javascript
const tripadvisorService = require('./services/tripadvisor');

// Tìm điểm tham quan
const attractions = await tripadvisorService.searchAttractions({
  query: 'Chùa Một Cột',
  location: 'Hanoi',
  limit: 10
});

// Tìm nhà hàng
const restaurants = await tripadvisorService.searchRestaurants({
  query: 'phở',
  location: 'Hanoi',
  cuisine: ['Vietnamese'],
  minRating: 4
});

// Tìm khách sạn
const hotels = await tripadvisorService.searchHotels({
  location: 'Hanoi',
  checkIn: '2024-03-15',
  checkOut: '2024-03-20',
  adults: 2,
  children: 0
});

// Lấy đánh giá
const reviews = await tripadvisorService.getReviews('123456', {
  limit: 10,
  sort: 'relevance'
});
```

## 🔧 Bước 4: Tích hợp vào Routes

### Ví dụ: Cập nhật route AI

**File:** `server/routes/ai.js`

```javascript
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const openaiService = require('../services/openai');

// Tạo lịch trình du lịch
router.post('/plan-trip', auth, async (req, res) => {
  try {
    const plan = await openaiService.generateTripPlan(req.body);
    res.json({ 
      success: true, 
      plan: plan.plan,
      usage: plan.usage 
    });
  } catch (error) {
    console.error('Error generating trip plan:', error);
    res.status(500).json({ 
      message: error.message || 'Lỗi khi tạo lịch trình' 
    });
  }
});

// Chat với AI
router.post('/chat', auth, async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;
    const response = await openaiService.chat(message, conversationHistory);
    res.json({ 
      success: true, 
      response: response.response,
      usage: response.usage 
    });
  } catch (error) {
    console.error('Error in AI chat:', error);
    res.status(500).json({ 
      message: error.message || 'Lỗi khi chat với AI' 
    });
  }
});

module.exports = router;
```

### Ví dụ: Tạo route mới cho Google Maps

**File:** `server/routes/maps.js` (mới)

```javascript
const express = require('express');
const router = express.Router();
const googleMapsService = require('../services/googleMaps');

// Tìm kiếm địa điểm
router.get('/search', async (req, res) => {
  try {
    const { query, lat, lng, radius = 5000 } = req.query;
    const places = await googleMapsService.searchPlaces(query, {
      location: lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null,
      radius: parseInt(radius)
    });
    res.json({ success: true, places: places.places });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Tìm nhà hàng
router.get('/restaurants', async (req, res) => {
  try {
    const { lat, lng, radius = 5000, keyword } = req.query;
    const restaurants = await googleMapsService.findRestaurants(
      { lat: parseFloat(lat), lng: parseFloat(lng) },
      { radius: parseInt(radius), keyword }
    );
    res.json({ success: true, restaurants: restaurants.restaurants });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
```

Sau đó thêm vào `server/index.js`:

```javascript
app.use('/api/maps', require('./routes/maps'));
```

## 🧪 Bước 5: Testing

### 5.1. Test API Keys

Tạo file test: `server/test-api.js`

```javascript
require('dotenv').config();
const openaiService = require('./services/openai');
const googleMapsService = require('./services/googleMaps');
const skyscannerService = require('./services/skyscanner');
const tripadvisorService = require('./services/tripadvisor');

async function testAPIs() {
  console.log('Testing API Keys...\n');

  // Test OpenAI
  try {
    const response = await openaiService.chat('Hello, test');
    console.log('✅ OpenAI API: OK');
  } catch (error) {
    console.log('❌ OpenAI API:', error.message);
  }

  // Test Google Maps
  try {
    const location = await googleMapsService.geocode('Hanoi');
    console.log('✅ Google Maps API: OK');
  } catch (error) {
    console.log('❌ Google Maps API:', error.message);
  }

  // Test Skyscanner
  try {
    const airports = await skyscannerService.getAirports('Hanoi');
    console.log('✅ Skyscanner API: OK');
  } catch (error) {
    console.log('❌ Skyscanner API:', error.message);
  }

  // Test TripAdvisor
  try {
    const attractions = await tripadvisorService.searchAttractions({
      query: 'Hanoi',
      location: 'Hanoi',
      limit: 1
    });
    console.log('✅ TripAdvisor API: OK');
  } catch (error) {
    console.log('❌ TripAdvisor API:', error.message);
  }
}

testAPIs();
```

Chạy test:

```bash
node server/test-api.js
```

## ⚠️ Lưu ý quan trọng

### 1. Rate Limiting
- Mỗi API có giới hạn free tier khác nhau
- Implement caching để giảm số requests
- Theo dõi usage trên dashboard

### 2. Error Handling
- Luôn bọc API calls trong try-catch
- Xử lý errors một cách graceful
- Log errors để debug

### 3. Security
- **KHÔNG commit file `.env` vào Git**
- File `.env` đã được thêm vào `.gitignore`
- Sử dụng environment variables cho production

### 4. Cost Management
- Theo dõi usage trên dashboard của mỗi API
- Set up alerts khi gần hết free tier
- Optimize requests để giảm chi phí

## 📚 Tài liệu tham khảo

- **OpenAI API:** https://platform.openai.com/docs
- **Google Maps API:** https://developers.google.com/maps/documentation
- **Skyscanner API:** https://developers.skyscanner.net/
- **TripAdvisor API:** https://developer.tripadvisor.com/

## 🆘 Hỗ trợ

Nếu gặp vấn đề:
1. Kiểm tra API keys trong `.env`
2. Kiểm tra logs của server
3. Xem documentation của từng API
4. Kiểm tra rate limits và quotas

