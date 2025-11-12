// server/services/geoapifyService.js

const axios = require('axios');
const Destination = require('../models/Destination'); // Đảm bảo đường dẫn đúng

/**
 * Chuyển đổi một feature từ Geoapify sang định dạng Destination model của chúng ta.
 * @param {object} feature - Object 'feature' từ response của Geoapify.
 * @returns {object} - Object sẵn sàng để lưu vào MongoDB.
 */
const transformGeoapifyFeature = (feature) => {
  const props = feature.properties;

  // Lập bản đồ các danh mục từ Geoapify sang enum của bạn
  // Đây là một ví dụ, bạn cần mở rộng nó cho đầy đủ
  const getCategory = (categories) => {
    if (!categories || categories.length === 0) return 'nature'; // Mặc định
    if (categories.includes('natural.beach')) return 'beach';
    if (categories.includes('natural.mountain_range')) return 'mountain';
    if (categories.includes('tourism.sights.castle') || categories.includes('tourism.sights.ruins')) return 'historical';
    if (categories.includes('tourism.sights.city_block')) return 'city';
    return 'nature'; // Mặc định nếu không khớp
  };

  const newDestination = {
    // ---- Dữ liệu lấy trực tiếp từ Geoapify ----
    name: props.name || props.address_line1 || 'Không có tên',
    country: props.country,
    city: props.city,
    location: {
      type: 'Point',
      coordinates: [props.lon, props.lat], // MongoDB yêu cầu [longitude, latitude]
    },
    category: getCategory(props.categories),
    tags: props.categories || [],
    
    // ---- Dữ liệu phải tạo giả (mock) vì Geoapify không cung cấp ----
    description: props.formatted || `Một địa điểm hấp dẫn tại ${props.city}, ${props.country}.`,
    budgetRange: { min: 1500000, max: 6000000 }, // Ví dụ
    recommendedDuration: Math.floor(Math.random() * 5) + 3, // Random 3-7 ngày
    images: [`https://picsum.photos/seed/${props.place_id}/1024/768`], // Ảnh placeholder
    rating: {
      average: (Math.random() * (4.8 - 3.5) + 3.5).toFixed(1), // Random rating 3.5 - 4.8
      count: Math.floor(Math.random() * 300) + 50,
    },
    // ---- Các trường khác sẽ dùng giá trị mặc định trong schema ----
  };

  return newDestination;
};

/**
 * Tìm kiếm điểm đến. Ưu tiên tìm trong DB, nếu không có sẽ gọi Geoapify và cache kết quả.
 * @param {object} options - Tùy chọn tìm kiếm { query, category }.
 * @returns {Promise<Array>} - Một mảng các documents của Destination.
 */
const searchAndCacheDestinations = async ({ query, category }) => {
  const dbQuery = { isActive: true };
  if (query) {
    dbQuery.$text = { $search: query };
  }
  if (category) {
    dbQuery.category = category;
  }

  // 1. Kiểm tra trong DB trước
  const existingDestinations = await Destination.find(dbQuery).limit(20);
  if (existingDestinations.length > 0) {
    console.log('✅ Found destinations in local DB cache.');
    return existingDestinations;
  }

  // 2. Nếu không có, gọi Geoapify
  console.log('🔍 No cache found. Calling Geoapify API...');
  const apiKey = process.env.GEOAPIFY_API_KEY;
  if (!apiKey) throw new Error('GEOAPIFY_API_KEY is not defined.');

  const params = { apiKey, limit: 20 };
  if (query) params.text = query;
  if (category) params.categories = category;
  
  // Mặc định tìm các điểm thu hút khách du lịch nếu không có query
  if (!query && !category) {
    params.categories = 'tourism.attraction';
    params.filter = 'countryCode:vn'; // Chỉ tìm ở Việt Nam
  }

  const response = await axios.get('https://api.geoapify.com/v2/places', { params });

  if (!response.data.features || response.data.features.length === 0) {
    return []; // Không tìm thấy kết quả từ Geoapify
  }

  // 3. Chuyển đổi dữ liệu
  const destinationsToCreate = response.data.features.map(transformGeoapifyFeature);

  // 4. Lưu kết quả mới vào DB (cache)
  try {
    const newDestinations = await Destination.insertMany(destinationsToCreate, { ordered: false });
    console.log(`💾 Cached ${newDestinations.length} new destinations to DB.`);
    return newDestinations;
  } catch (error) {
    // Bỏ qua lỗi trùng lặp key nếu có
    if (error.code === 11000) {
        console.warn('⚠️ Some destinations already existed in DB.');
        return await Destination.find(dbQuery).limit(20);
    }
    throw error;
  }
};

module.exports = {
  searchAndCacheDestinations,
};