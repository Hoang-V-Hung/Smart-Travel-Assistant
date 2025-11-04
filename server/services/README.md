# API Services Documentation

Tài liệu hướng dẫn sử dụng các service API trong dự án Smart Travel Assistant.

## 📋 Tổng quan

Dự án sử dụng 3 API chính:
1. **OpenAI/GPT API** - Lên lịch trình & Sinh nội dung
2. **Google Maps API** - Tìm địa điểm, chỉ đường, bản đồ
3. **Skyscanner API** - Tìm kiếm chuyến bay
4. **TripAdvisor API** - Điểm tham quan, nhà hàng, khách sạn, đánh giá

## 🔑 Thiết lập API Keys

1. Copy file `env.example` thành `.env`:
   ```bash
   cp env.example .env
   ```

2. Điền các API keys vào file `.env`

### 1. OpenAI API (GPT)

**Lấy API Key:**
- Truy cập: https://platform.openai.com/api-keys
- Tạo API key mới
- Cần thanh toán để sử dụng (pay-as-you-go)

**Sử dụng:**
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
```

### 2. Google Maps API

**Lấy API Key:**
- Truy cập: https://console.cloud.google.com/google/maps-apis/credentials
- Tạo project mới hoặc chọn project có sẵn
- Tạo API key
- Bật các API sau:
  - Maps JavaScript API
  - Places API
  - Geocoding API
  - Directions API
  - Distance Matrix API

**Free Tier:** $200 credit/tháng (~28,000 requests)

**Sử dụng:**
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
  { radius: 5000, keyword: 'phở' }
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

### 3. Skyscanner API

**Lấy API Key (qua RapidAPI):**
- Truy cập: https://rapidapi.com/skyscanner/api/skyscanner-flight-search
- Đăng ký tài khoản RapidAPI
- Subscribe Skyscanner API
- Copy API key

**Hoặc sử dụng Skyscanner Partners API:**
- Truy cập: https://developers.skyscanner.net/
- Đăng ký tài khoản Partners
- Tạo API key

**Free Tier:** 500 requests/tháng (RapidAPI)

**Sử dụng:**
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

### 4. TripAdvisor API

**Lấy API Key (qua RapidAPI):**
- Truy cập: https://rapidapi.com/apidojo/api/tripadvisor1
- Đăng ký tài khoản RapidAPI
- Subscribe TripAdvisor API
- Copy API key

**Hoặc sử dụng TripAdvisor API trực tiếp:**
- Truy cập: https://developer.tripadvisor.com/
- Đăng ký tài khoản
- Tạo API key

**Free Tier:** 100 requests/tháng (RapidAPI)

**Sử dụng:**
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

## 🚀 Sử dụng trong Routes

### Ví dụ: Tích hợp vào route

```javascript
// server/routes/ai.js
const openaiService = require('../services/openai');

router.post('/plan-trip', auth, async (req, res) => {
  try {
    const plan = await openaiService.generateTripPlan(req.body);
    res.json({ success: true, plan: plan.plan });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
```

```javascript
// server/routes/destinations.js
const googleMapsService = require('../services/googleMaps');

router.get('/search', async (req, res) => {
  try {
    const places = await googleMapsService.searchPlaces(req.query.q, {
      location: { lat: req.query.lat, lng: req.query.lng }
    });
    res.json({ success: true, places: places.places });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
```

## ⚠️ Lưu ý quan trọng

1. **Rate Limiting:**
   - Mỗi API có giới hạn free tier khác nhau
   - Theo dõi usage để tránh vượt quá
   - Implement caching để giảm số requests

2. **Error Handling:**
   - Luôn bọc các API calls trong try-catch
   - Xử lý các lỗi API một cách graceful
   - Log errors để debug

3. **Security:**
   - KHÔNG commit file `.env` vào Git
   - Sử dụng environment variables cho production
   - Rotate API keys định kỳ

4. **Cost Management:**
   - Theo dõi usage trên dashboard của mỗi API
   - Set up alerts khi gần hết free tier
   - Optimize requests để giảm chi phí

## 📝 Cấu trúc File

```
server/
├── services/
│   ├── openai.js          # OpenAI/GPT service
│   ├── googleMaps.js      # Google Maps service
│   ├── skyscanner.js      # Skyscanner service
│   ├── tripadvisor.js     # TripAdvisor service
│   └── README.md          # Tài liệu này
├── routes/
│   ├── ai.js              # AI routes (sử dụng OpenAI)
│   ├── destinations.js   # Destination routes (sử dụng Google Maps)
│   └── ...
└── .env                   # API keys (KHÔNG commit)
```

## 🔄 Cập nhật API Keys

Khi thay đổi API keys:
1. Cập nhật file `.env`
2. Restart server
3. Test các API endpoints
4. Kiểm tra logs để đảm bảo không có lỗi

## 📞 Hỗ trợ

Nếu gặp vấn đề:
1. Kiểm tra API keys trong `.env`
2. Kiểm tra logs của server
3. Xem documentation của từng API
4. Kiểm tra rate limits và quotas

