# 🌍 AI Smart Travel Assistant

Ứng dụng hỗ trợ lập kế hoạch du lịch với trợ lý AI, quản lý hành trình và giao diện web hiện đại.

## ✨ Tính năng hiện có

- 🔐 **Authentication**: Đăng ký, đăng nhập và xác thực bằng JWT.
- 🧳 **Trip Management**: Tạo, xem, cập nhật và xoá kế hoạch du lịch cho từng người dùng.
- 🤖 **AI Assistant**: Tương tác với OpenAI để lập kế hoạch, gợi ý và trò chuyện du lịch.
- 💎 **Modern UI**: Ứng dụng React + Material UI với trải nghiệm responsive.

Các tính năng như Google Maps, Skyscanner, TripAdvisor hay dữ liệu thời tiết hiện **chưa được tích hợp**. Chúng nằm trong kế hoạch phát triển tiếp theo.

## 🛠️ Công nghệ sử dụng

### Backend

- Node.js + Express
- MongoDB + Mongoose
- JWT cho xác thực
- OpenAI API cho trợ lý AI

### Frontend

- React 18 + TypeScript
- Material UI (MUI)
- React Router
- Axios

## 🚀 Bắt đầu

### Yêu cầu

- Node.js >= 18
- npm (hoặc yarn)
- MongoDB đang chạy (local hoặc Atlas)
- OpenAI API key

### Cài đặt

```bash
git clone <repository-url>
cd client

cd server

```

### Cấu hình môi trường

Server đọc biến môi trường từ `server/.env`. Tạo file này với nội dung tối thiểu:

```env
PORT=5001
CLIENT_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/smart-travel
JWT_SECRET=your-jwt-secret
OPENAI_API_KEY=sk-...
# OPENAI_MODEL có thể để trống. Dịch vụ mặc định dùng gpt-4o-mini.
```


### Chạy ứng dụng

```bash

# Hoặc chạy riêng
npm start
npm run dev
```

Ứng dụng mặc định chạy tại:

- Frontend: http://localhost:3000
- Backend API: http://localhost:5001

## 📁 Cấu trúc thư mục

```
ai-smart-travel-assistant/
├── client/                 # Ứng dụng React
│   └── src/
│       ├── components/
│       ├── pages/
│       └── App.tsx
├── server/                 # API Express
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   └── services/
├── package.json            # Script điều phối
└── README.md
```

## 📚 API hiện có

### Authentication (`/api/auth`)
- `POST /register`
- `POST /login`
- `GET /me`

### Trips (`/api/trips`, yêu cầu JWT)
- `GET /` – danh sách kế hoạch của user
- `POST /` – tạo kế hoạch
- `GET /:id` – chi tiết kế hoạch
- `PUT /:id` – cập nhật kế hoạch
- `DELETE /:id` – xoá kế hoạch

### AI (`/api/ai`, yêu cầu JWT)
- `POST /plan-trip`
- `POST /recommendations`
- `POST /chat`
- `POST /generate-content`

> Tất cả endpoint AI yêu cầu `OPENAI_API_KEY` hợp lệ và sử dụng mô hình gpt-4o-mini.

## 🗺️ Lộ trình phát triển (Roadmap)

- Tích hợp dữ liệu địa điểm thực (Google Maps / TripAdvisor)
- Đồng bộ thông tin chuyến bay (Skyscanner)
- Bổ sung dữ liệu thời tiết
- Chia sẻ kế hoạch cho nhiều người dùng
- Thông báo và nhắc lịch chuyến đi

## 🤝 Đóng góp

1. Fork repository
2. Tạo nhánh (`git checkout -b feature/my-feature`)
3. Commit (`git commit -m "Add my feature"`)
4. Push (`git push origin feature/my-feature`)
5. Tạo Pull Request

## 📄 License


---

**Ghi chú**: Một số trang frontend đã chuẩn bị sẵn UI cho dữ liệu bản đồ, chuyến bay, đánh giá... nhưng backend chưa cung cấp API tương ứng. Hãy cập nhật README này khi những tính năng mới được triển khai.
