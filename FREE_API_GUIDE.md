# 🆓 Hướng dẫn sử dụng OpenStreetMap API - HOÀN TOÀN MIỄN PHÍ

## ✅ Ưu điểm

- ✅ **HOÀN TOÀN MIỄN PHÍ** - Không cần trả phí, không cần credit card
- ✅ **KHÔNG CẦN API KEY** - Sử dụng ngay không cần đăng ký
- ✅ **Dữ liệu toàn cầu** - Có dữ liệu từ khắp nơi trên thế giới
- ✅ **Mã nguồn mở** - Được cộng đồng đóng góp và cập nhật

## ⚠️ Lưu ý

- Có rate limit: 1 request/giây (nên cache kết quả)
- Dữ liệu có thể không đầy đủ như các dịch vụ thương mại
- Không có rating/review như Google Places
- Không có hình ảnh trực tiếp (có thể dùng Wikimedia Commons)

## 🚀 Cách sử dụng

### Không cần cấu hình gì cả!

API đã sẵn sàng sử dụng, không cần thêm API key vào `.env`.

### Endpoints

#### 1. Autocomplete địa điểm
```
GET /api/osm/autocomplete?q=Hà Nội
```

#### 2. Tìm kiếm địa điểm xung quanh (theo tọa độ)
```
GET /api/osm/nearby/hotels?lat=21.0285&lng=105.8542&radius=2000
GET /api/osm/nearby/restaurants?lat=21.0285&lng=105.8542&radius=2000
GET /api/osm/nearby/attractions?lat=21.0285&lng=105.8542&radius=2000
```

**Parameters:**
- `lat`: Vĩ độ (bắt buộc)
- `lng`: Kinh độ (bắt buộc)
- `radius`: Bán kính tìm kiếm (mét), mặc định 2000m

#### 3. Tìm kiếm theo text
```
GET /api/osm/search/hotels?q=khách sạn Hà Nội
```

#### 4. Lấy chi tiết địa điểm
```
GET /api/osm/details/:placeId
```

## 📝 Ví dụ sử dụng

### Trong Frontend (JavaScript/TypeScript)

```typescript
// Autocomplete
const response = await fetch(
  'http://localhost:5000/api/osm/autocomplete?q=Hà Nội'
);
const suggestions = await response.json();

// Tìm khách sạn gần Hà Nội
const lat = 21.0285;
const lng = 105.8542;
const response = await fetch(
  `http://localhost:5000/api/osm/nearby/hotels?lat=${lat}&lng=${lng}&radius=2000`
);
const hotels = await response.json();
console.log('Found hotels:', hotels);
```

### Test bằng cURL

```bash
# Autocomplete
curl "http://localhost:5000/api/osm/autocomplete?q=Hà Nội"

# Tìm khách sạn
curl "http://localhost:5000/api/osm/nearby/hotels?lat=21.0285&lng=105.8542&radius=2000"

# Tìm nhà hàng
curl "http://localhost:5000/api/osm/nearby/restaurants?lat=21.0285&lng=105.8542&radius=2000"
```

## 🔄 So sánh với Travel Advisor API

| Tính năng | Travel Advisor | OpenStreetMap |
|-----------|----------------|---------------|
| Chi phí | Phụ thuộc RapidAPI | **HOÀN TOÀN MIỄN PHÍ** |
| API Key | Cần | **KHÔNG CẦN** |
| Rating/Review | ✅ | ❌ |
| Hình ảnh | ✅ | ❌ (có thể dùng Wikimedia) |
| Dữ liệu Việt Nam | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| Tốc độ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| Rate Limit | Phụ thuộc gói | 1 request/giây |

## 💡 Cách tích hợp vào Frontend

### Cập nhật TravelAdvisorSearch.tsx

Thay đổi API endpoint trong `fetchPlaces`:

```typescript
const fetchPlaces = async (locationId: string, type: string, lat?: number, lng?: number) => {
  setLoadingData(true);
  setError('');
  setPlaces([]);
  
  try {
    let data: Place[] = [];
    
    // Nếu có tọa độ, dùng OpenStreetMap (MIỄN PHÍ)
    if (lat && lng) {
      const response = await fetch(
        `${API_URL}/osm/nearby/${type}?lat=${lat}&lng=${lng}&radius=2000`
      );
      if (response.ok) {
        data = await response.json();
      }
    }
    
    // Nếu không có kết quả hoặc không có tọa độ, dùng Travel Advisor
    if (data.length === 0 && locationId) {
      const response = await fetch(
        `${API_URL}/places/${type}?locationId=${locationId}`
      );
      if (response.ok) {
        data = await response.json();
      }
    }
    
    // Áp dụng filter
    const filteredPlaces = data.filter(place => 
      (place.rating || 0) >= minRating
    );
    
    setPlaces(filteredPlaces);
  } catch (err) {
    console.error('Fetch error:', err);
    setError('Lỗi khi tìm địa điểm. Vui lòng thử lại.');
  } finally {
    setLoadingData(false);
  }
};
```

### Cập nhật Autocomplete

```typescript
// Trong useEffect autocomplete
const response = await fetch(
  `${API_URL}/osm/autocomplete?q=${encodeURIComponent(locationInput)}`
);
const data = await response.json();
setLocationOptions(data || []);
```

## 🎯 Khuyến nghị

1. **Dùng OpenStreetMap làm API chính** - Miễn phí, không cần API key
2. **Dùng Travel Advisor làm fallback** - Khi cần rating/review
3. **Cache kết quả** - Để tránh vượt rate limit (1 req/giây)

## 📚 Tài liệu tham khảo

- OpenStreetMap Nominatim: https://nominatim.org/release-docs/develop/api/Overview/
- Overpass API: https://wiki.openstreetmap.org/wiki/Overpass_API
- OSM Tags: https://wiki.openstreetmap.org/wiki/Tags

## ⚡ Quick Start

1. **Không cần cấu hình gì** - API đã sẵn sàng!
2. **Test ngay**:
   ```bash
   curl "http://localhost:5000/api/osm/autocomplete?q=Hà Nội"
   ```
3. **Tích hợp vào frontend** - Xem ví dụ trên

---

**Chúc bạn sử dụng thành công! 🎉**

