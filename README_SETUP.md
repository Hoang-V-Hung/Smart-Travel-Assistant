# Hướng Dẫn Cài Đặt và Chạy Dự Án

Dự án được tách riêng thành **Client** và **Server**, có thể chạy độc lập.

## 📋 Cấu Trúc Dự Án

```
THHT/
├── client/          # React Frontend (chạy riêng)
│   ├── package.json
│   └── ...
├── server/          # Node.js Backend (chạy riêng)
│   ├── package.json
│   └── ...
└── package.json     # Root - Scripts helper
```

## 🚀 Cài Đặt Dependencies

### Cài đặt tất cả (Client + Server)
```bash
npm run install-all
```

### Hoặc cài đặt riêng từng phần:

**Cài đặt Server:**
```bash
npm run server:install
# hoặc
cd server
npm install
```

**Cài đặt Client:**
```bash
npm run client:install
# hoặc
cd client
npm install
```

## ▶️ Chạy Dự Án

### Chạy riêng từng phần:

**Chạy Server (Backend):**
```bash
# Từ thư mục root
npm run server:start

# Hoặc từ thư mục server
cd server
npm start
```

Server sẽ chạy tại: `http://localhost:5000`

**Chạy Client (Frontend):**
```bash
# Từ thư mục root
npm run client:start

# Hoặc từ thư mục client
cd client
npm start
```

Client sẽ chạy tại: `http://localhost:3000`

### Chạy cả hai cùng lúc (Development):

```bash
npm run dev
```

Lệnh này sẽ chạy:
- Server với nodemon (auto-reload) tại `http://localhost:5000`
- Client với react-scripts tại `http://localhost:3000`

## 📝 Scripts Có Sẵn

### Root (package.json):
- `npm run dev` - Chạy cả server và client cùng lúc (development)
- `npm run server:start` - Chạy server production
- `npm run server:dev` - Chạy server với nodemon (auto-reload)
- `npm run client:start` - Chạy client
- `npm run client:dev` - Chạy client (giống client:start)
- `npm run install-all` - Cài đặt dependencies cho cả server và client
- `npm run build` - Build client để production

### Server (server/package.json):
- `npm start` - Chạy server production
- `npm run dev` - Chạy server với nodemon (auto-reload)

### Client (client/package.json):
- `npm start` - Chạy React development server
- `npm run build` - Build production
- `npm test` - Chạy tests

## ⚙️ Cấu Hình

### Server (.env):
1. Copy `env.example` thành `.env`:
```bash
cp env.example .env
```

2. Điền các API keys vào file `.env`:
- `OPENAI_API_KEY` - OpenAI/GPT API
- `GOOGLE_MAPS_API_KEY` - Google Maps API
- `SKYSCANNER_RAPIDAPI_KEY` - Skyscanner API
- `TRIPADVISOR_RAPIDAPI_KEY` - TripAdvisor API

### Client:
- API endpoint mặc định: `http://localhost:5000/api`
- Có thể thay đổi trong file config nếu cần

## 🛠️ Troubleshooting

### Server không chạy:
1. Kiểm tra đã cài dependencies:
```bash
cd server
npm install
```

2. Kiểm tra file `.env` đã được tạo chưa

3. Kiểm tra port 5000 có bị chiếm không

### Client không chạy:
1. Kiểm tra đã cài dependencies:
```bash
cd client
npm install
```

2. Kiểm tra port 3000 có bị chiếm không

3. Đảm bảo server đang chạy (nếu client cần kết nối API)

## 📚 Tài Liệu Thêm

- [API Integration Guide](./API_INTEGRATION_GUIDE.md)
- [Server Services README](./server/services/README.md)

