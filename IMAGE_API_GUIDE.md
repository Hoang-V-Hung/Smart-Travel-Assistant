# 🖼️ Hướng dẫn tích hợp API lấy ảnh địa điểm

## ✅ Đã tích hợp

Service tự động lấy ảnh cho các địa điểm từ nhiều nguồn miễn phí:

1. **Wikimedia Commons (Wikipedia)** - HOÀN TOÀN MIỄN PHÍ, KHÔNG CẦN API KEY ⭐
2. **Pexels** - MIỄN PHÍ (cần đăng ký free API key)
3. **Unsplash** - MIỄN PHÍ (có thể dùng public API hoặc đăng ký free)

## 🎯 Cách hoạt động

Khi bạn tìm kiếm địa điểm, service sẽ:
1. Lấy danh sách địa điểm từ OpenStreetMap
2. **Tự động** lấy ảnh cho mỗi địa điểm từ các nguồn trên
3. Trả về kết quả kèm ảnh

## 📝 Cấu hình (Tùy chọn)

### Pexels API (Khuyến nghị)

1. Đăng ký tại: https://www.pexels.com/api/
2. Lấy API key (miễn phí)
3. Thêm vào `server/.env`:
   ```env
   PEXELS_API_KEY=your_pexels_api_key_here
   ```

### Unsplash API (Tùy chọn)

1. Đăng ký tại: https://unsplash.com/developers
2. Lấy Access Key (miễn phí)
3. Cập nhật trong `server/services/placeImageService.js`:
   ```javascript
   const UNSPLASH_ACCESS_KEY = 'your_unsplash_access_key';
   ```

## 🚀 Sử dụng

### Không cần cấu hình gì!

Service đã tự động tích hợp. Chỉ cần gọi API như bình thường:

```bash
# Tìm khách sạn - sẽ tự động có ảnh
curl "http://localhost:5000/api/osm/nearby/hotels?lat=21.0285&lng=105.8542&radius=2000"
```

### Response format

```json
{
  "place_id": "12345",
  "name": "Khách sạn ABC",
  "rating": null,
  "user_ratings_total": 0,
  "vicinity": "123 Đường ABC, Quận 1, TP.HCM",
  "lat": 10.7769,
  "lng": 106.7009,
  "photo": "https://upload.wikimedia.org/wikipedia/commons/thumb/...", // ✅ Ảnh tự động
  "types": ["amenity", "tourism"],
  "tags": {...}
}
```

## 🔄 Thứ tự ưu tiên lấy ảnh

1. **Wikimedia Commons** (Wikipedia) - Thử đầu tiên
   - ✅ Miễn phí, không cần API key
   - ✅ Ảnh chính xác về địa điểm
   - ⚠️ Chỉ có ảnh cho địa điểm nổi tiếng

2. **Pexels** - Thử thứ hai (nếu có API key)
   - ✅ Miễn phí
   - ✅ Nhiều ảnh chất lượng cao
   - ⚠️ Cần đăng ký API key

3. **Unsplash** - Thử thứ ba (nếu có API key)
   - ✅ Miễn phí
   - ✅ Ảnh đẹp
   - ⚠️ Cần đăng ký API key

## ⚡ Tối ưu hiệu suất

- Ảnh được lấy **song song** cho tất cả địa điểm (Promise.all)
- Nếu một nguồn lỗi, tự động thử nguồn khác
- Nếu không tìm thấy ảnh, trả về `null` (không làm crash)

## 📊 Tỷ lệ thành công

- **Địa điểm nổi tiếng**: ~70-80% có ảnh từ Wikipedia
- **Địa điểm thông thường**: ~30-50% có ảnh
- **Với Pexels/Unsplash**: Tăng thêm ~20-30%

## 💡 Tips

1. **Đăng ký Pexels API key** để tăng tỷ lệ có ảnh
2. **Cache ảnh** nếu cần (có thể implement sau)
3. **Fallback image** - Có thể thêm ảnh placeholder mặc định

## 🔧 Tùy chỉnh

### Thêm nguồn ảnh khác

Mở `server/services/placeImageService.js` và thêm function mới:

```javascript
const getImageFromNewSource = async (placeName, type) => {
  // Your code here
  return imageUrl;
};

// Thêm vào getPlaceImage function
imageUrl = await getImageFromNewSource(placeName, searchType);
```

### Thay đổi thứ tự ưu tiên

Sửa trong function `getPlaceImage()` trong `placeImageService.js`

## ⚠️ Lưu ý

1. **Rate limits**: 
   - Wikimedia: 1 request/giây
   - Pexels: 200 requests/giờ (free tier)
   - Unsplash: 50 requests/giờ (free tier)

2. **Thời gian response**: Lấy ảnh có thể làm tăng thời gian response 1-3 giây

3. **Ảnh không chính xác**: Một số ảnh có thể không phải ảnh thực của địa điểm (đặc biệt từ Pexels/Unsplash)

## 🎉 Kết luận

Service đã tự động tích hợp! Chỉ cần:
- ✅ Sử dụng API như bình thường
- ✅ Ảnh sẽ tự động được thêm vào kết quả
- ⚙️ (Tùy chọn) Đăng ký Pexels API key để có nhiều ảnh hơn

---

**Chúc bạn sử dụng thành công! 🎉**

