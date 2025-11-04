# 🌍 AI Smart Travel Assistant

Hệ thống du lịch thông minh với AI, hỗ trợ người dùng lên kế hoạch du lịch, gợi ý hành trình, đặt dịch vụ và hỗ trợ theo ngữ cảnh.

## ✨ Tính năng chính

- 🤖 **AI Travel Assistant**: Trợ lý du lịch thông minh với GPT
- 🗺️ **Lập kế hoạch du lịch**: Tạo lịch trình chi tiết và tối ưu
- 🌍 **Khám phá điểm đến**: Hàng nghìn điểm đến với thông tin chi tiết
- 🏨 **Quản lý chuyến đi**: Theo dõi và quản lý các chuyến du lịch
- 🌤️ **Thông tin thời tiết**: Dự báo thời tiết cho điểm đến
- 💰 **Tính toán ngân sách**: Quản lý chi phí du lịch
- 📱 **Responsive Design**: Giao diện thân thiện trên mọi thiết bị

## 🛠️ Công nghệ sử dụng

### Backend

- **Node.js** với Express.js
- **MongoDB** với Mongoose
- **JWT** cho xác thực
- **OpenAI API** cho AI Assistant
- **OpenWeatherMap API** cho thông tin thời tiết

### Frontend

- **React 18** với TypeScript
- **Material-UI (MUI)** cho giao diện
- **React Router** cho điều hướng
- **Axios** cho API calls

### APIs sẽ tích hợp

- **Google Maps API** - Bản đồ và địa điểm
- **Skyscanner API** - Vé máy bay
- **TripAdvisor API** - Đánh giá và gợi ý
- **AWS Services** - Lambda, S3, RDS

## 🚀 Cài đặt và chạy

### Yêu cầu hệ thống

- Node.js >= 16.0.0
- MongoDB >= 4.4
- npm hoặc yarn

### 1. Clone repository

```bash
git clone <repository-url>
cd ai-smart-travel-assistant
```

### 2. Cài đặt dependencies

```bash
# Cài đặt dependencies cho cả backend và frontend
npm run install-all

# Hoặc cài đặt riêng lẻ
npm install                    # Backend dependencies
cd client && npm install       # Frontend dependencies
```

### 3. Cấu hình môi trường

```bash
# Copy file cấu hình mẫu
cp env.example .env

# Chỉnh sửa file .env với thông tin của bạn
```

### 4. Cấu hình MongoDB

```bash
# Khởi động MongoDB (nếu chưa chạy)
mongod

# Hoặc sử dụng MongoDB Atlas (cloud)
# Cập nhật MONGODB_URI trong file .env
```

### 5. Chạy ứng dụng

#### Development mode (cả backend và frontend)

```bash
npm run dev
```

#### Chạy riêng lẻ

```bash
# Backend (port 5000)
npm run server

# Frontend (port 3000)
npm run client
```

### 6. Truy cập ứng dụng

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Health Check: http://localhost:5000/api/health

## 📁 Cấu trúc dự án

```
ai-smart-travel-assistant/
├── server/                 # Backend
│   ├── config/            # Cấu hình database
│   ├── middleware/        # Middleware (auth, etc.)
│   ├── models/           # MongoDB models
│   ├── routes/           # API routes
│   └── index.js          # Server entry point
├── client/               # Frontend React app
│   ├── public/           # Static files
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   └── App.tsx       # Main app component
│   └── package.json
├── package.json          # Root package.json
├── env.example           # Environment variables template
└── README.md
```

## 🔧 Cấu hình API Keys

Để sử dụng đầy đủ tính năng, bạn cần cấu hình các API keys trong file `.env`:

```env
# OpenAI API (cho AI Assistant)
OPENAI_API_KEY=your-openai-api-key

# OpenWeatherMap API (cho thông tin thời tiết)
OPENWEATHER_API_KEY=your-openweather-api-key

# Google Maps API (sẽ tích hợp)
GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Skyscanner API (sẽ tích hợp)
SKYSCANNER_API_KEY=your-skyscanner-api-key

# TripAdvisor API (sẽ tích hợp)
TRIPADVISOR_API_KEY=your-tripadvisor-api-key

# AWS Configuration (sẽ tích hợp)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=ap-southeast-1
```

## 📚 API Documentation

### Authentication

- `POST /api/auth/register` - Đăng ký tài khoản
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/me` - Lấy thông tin user hiện tại

### Trips

- `GET /api/trips` - Lấy danh sách chuyến du lịch
- `POST /api/trips` - Tạo chuyến du lịch mới
- `GET /api/trips/:id` - Lấy chi tiết chuyến du lịch
- `PUT /api/trips/:id` - Cập nhật chuyến du lịch
- `DELETE /api/trips/:id` - Xóa chuyến du lịch

### Destinations

- `GET /api/destinations/popular` - Điểm đến phổ biến
- `GET /api/destinations/search` - Tìm kiếm điểm đến
- `GET /api/destinations/:id` - Chi tiết điểm đến
- `GET /api/destinations/nearby` - Điểm đến gần đây

### AI Assistant

- `POST /api/ai/plan-trip` - Tạo lịch trình du lịch với AI
- `POST /api/ai/recommendations` - Gợi ý điểm đến
- `POST /api/ai/chat` - Chat với AI Assistant

### Weather

- `GET /api/weather/current` - Thời tiết hiện tại
- `GET /api/weather/forecast` - Dự báo thời tiết 5 ngày
- `GET /api/weather/city/:cityName` - Thời tiết theo thành phố

## 🎯 Roadmap

### Phase 1 (Hiện tại)

- ✅ Backend API cơ bản
- ✅ Frontend React với Material-UI
- ✅ Authentication system
- ✅ Trip management
- ✅ Destination search
- ✅ AI Chat interface

### Phase 2 (Sắp tới)

- 🔄 Tích hợp Google Maps API
- 🔄 Tích hợp Skyscanner API
- 🔄 Tích hợp TripAdvisor API
- 🔄 Real-time weather data
- 🔄 Image upload và storage
- 🔄 Push notifications

### Phase 3 (Tương lai)

- 📅 AWS Lambda functions
- 📅 Advanced AI features
- 📅 Mobile app (React Native)
- 📅 Social features
- 📅 Payment integration
- 📅 Multi-language support

## 🤝 Đóng góp

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📞 Liên hệ

- Project Link: [https://github.com/your-username/ai-smart-travel-assistant](https://github.com/your-username/ai-smart-travel-assistant)
- Email: your-email@example.com

## 🙏 Acknowledgments

- [OpenAI](https://openai.com/) cho AI capabilities
- [Material-UI](https://mui.com/) cho UI components
- [React](https://reactjs.org/) cho frontend framework
- [Express.js](https://expressjs.com/) cho backend framework
- [MongoDB](https://www.mongodb.com/) cho database

---

**Lưu ý**: Đây là phiên bản base để tích hợp các API. Một số tính năng cần API keys để hoạt động đầy đủ.
