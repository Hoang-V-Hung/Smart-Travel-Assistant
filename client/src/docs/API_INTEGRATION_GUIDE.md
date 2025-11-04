# Hướng dẫn tích hợp API cho Smart Travel Assistant

## 📋 Tổng quan

Navbar đã được cấu trúc để dễ dàng tích hợp các API mới. Tất cả menu items được quản lý tập trung trong file `config/navigation.ts`.

## 🔧 Cách thêm menu item mới

### 1. Cập nhật file `config/navigation.ts`

```typescript
// Thêm vào activeMenuItems nếu đã sẵn sàng
export const activeMenuItems: MenuItem[] = [
  // ... existing items
  {
    text: "Tên menu mới",
    path: "/new-feature",
    icon: null as any, // Sẽ được map trong component
    auth: true, // hoặc false
    description: "Mô tả tính năng",
    apiIntegration: {
      provider: "Tên Provider",
      status: "ready", // 'ready' | 'in-progress' | 'planned'
      endpoint: "https://api.example.com/",
    },
  },
];

// Hoặc thêm vào futureMenuItems nếu chưa sẵn sàng
export const futureMenuItems: MenuItem[] = [
  // ... existing items
  {
    text: "Tính năng sắp có",
    path: "/upcoming-feature",
    icon: null as any,
    auth: true,
    comingSoon: true,
    description: "Mô tả tính năng sắp có",
    apiIntegration: {
      provider: "Provider Name",
      status: "planned",
      endpoint: "https://api.example.com/",
    },
  },
];
```

### 2. Thêm icon vào `components/Navbar.tsx`

```typescript
const iconMap: { [key: string]: React.ReactElement } = {
  // ... existing icons
  "new-feature": <NewIcon />,
  "upcoming-feature": <UpcomingIcon />,
};
```

### 3. Tạo page component

Tạo file `pages/NewFeature.tsx` với component tương ứng.

### 4. Thêm route vào `App.tsx`

```typescript
<Route path="/new-feature" element={<NewFeature />} />
```

## 🚀 Các API đã được chuẩn bị tích hợp

### 1. Google Maps API

- **Menu**: Bản đồ, Giao thông
- **Status**: Planned
- **Endpoint**: `https://maps.googleapis.com/maps/api/`
- **Tính năng**: Bản đồ, chỉ đường, tìm kiếm địa điểm

### 2. Skyscanner API

- **Menu**: Vé máy bay
- **Status**: Planned
- **Endpoint**: `https://skyscanner-skyscanner-flight-search-v1.p.rapidapi.com/`
- **Tính năng**: Tìm kiếm và so sánh giá vé máy bay

### 3. TripAdvisor API

- **Menu**: Khách sạn, Đánh giá
- **Status**: Planned
- **Endpoint**: `https://api.content.tripadvisor.com/api/v1/`
- **Tính năng**: Đặt khách sạn, xem đánh giá

### 4. OpenWeatherMap API

- **Menu**: Thời tiết
- **Status**: In Progress
- **Endpoint**: `https://api.openweathermap.org/data/2.5/`
- **Tính năng**: Dự báo thời tiết

### 5. OpenAI API

- **Menu**: AI Assistant
- **Status**: Ready
- **Endpoint**: `/api/ai/chat`
- **Tính năng**: Chat với AI

## 📊 Trạng thái API Integration

### Các trạng thái có sẵn:

- **ready**: API đã được tích hợp và sẵn sàng sử dụng
- **in-progress**: Đang trong quá trình tích hợp
- **planned**: Đã lên kế hoạch, chưa bắt đầu
- **error**: Có lỗi trong quá trình tích hợp

### Cách cập nhật trạng thái:

```typescript
import { updateMenuItemStatus } from "../config/navigation";

// Cập nhật trạng thái khi hoàn thành tích hợp
updateMenuItemStatus("/flights", "ready");

// Cập nhật trạng thái khi bắt đầu tích hợp
updateMenuItemStatus("/hotels", "in-progress");
```

## 🎨 UI Components

### APIIntegrationStatus Component

Hiển thị trạng thái tích hợp API với:

- Icon trạng thái
- Label mô tả
- Tooltip chi tiết
- Progress bar (cho trạng thái in-progress)

### Navbar Features

- **Responsive**: Tự động chuyển đổi giữa desktop và mobile
- **Authentication**: Hiển thị menu khác nhau cho user đã đăng nhập
- **Status Indicators**: Hiển thị trạng thái API integration
- **Coming Soon**: Đánh dấu các tính năng sắp có

## 🔄 Workflow tích hợp API

1. **Planning**: Thêm vào `futureMenuItems` với status 'planned'
2. **Development**: Chuyển status thành 'in-progress'
3. **Testing**: Tạo page component và test
4. **Deployment**: Chuyển sang `activeMenuItems` với status 'ready'
5. **Monitoring**: Theo dõi và cập nhật trạng thái

## 📝 Best Practices

1. **Consistent Naming**: Sử dụng naming convention nhất quán cho paths và keys
2. **Icon Mapping**: Luôn cập nhật iconMap khi thêm menu mới
3. **Status Updates**: Cập nhật trạng thái API integration thường xuyên
4. **User Feedback**: Hiển thị trạng thái rõ ràng cho user
5. **Error Handling**: Xử lý lỗi khi API không khả dụng

## 🛠️ Tools và Utilities

### Helper Functions

```typescript
// Lấy menu items theo trạng thái
const readyItems = getMenuItemsByStatus("ready");

// Lấy menu items theo provider
const googleItems = getMenuItemsByProvider("Google Maps");

// Cập nhật trạng thái
updateMenuItemStatus("/path", "ready");
```

### TypeScript Support

Tất cả menu items đều có type safety với interface `MenuItem`.

## 📱 Mobile Optimization

Navbar tự động chuyển sang drawer mode trên mobile với:

- Grouping menu items theo category
- Status indicators
- Touch-friendly interface
- Smooth animations
