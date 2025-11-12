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
    if (!categories || categories.length === 0) return 'nature';

    // Tạo một bản đồ ưu tiên, từ cụ thể đến chung chung
    const categoryPriorityMap = {
      'natural.beach': 'beach',
      'natural.mountain_range': 'mountain',
      'tourism.sights.castle': 'historical',
      'tourism.sights.ruins': 'historical',
      'tourism.sights': 'historical',
      'religion': 'cultural',
      'entertainment.culture': 'cultural',
      'sport': 'adventure',
      'activity': 'adventure',
      'administrative.city_level': 'city',
      'building.tourism': 'city',
      'natural': 'nature',
      'tourism': 'adventure'
    };
    
    // Duyệt qua danh sách ưu tiên
    for (const key in categoryPriorityMap) {
      if (categories.includes(key)) {
        return categoryPriorityMap[key]; // Trả về danh mục đầu tiên tìm thấy
      }
    }

    return 'nature'; // Mặc định cuối cùng
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
    budgetRange: (() => {
    const budgetOptions = [
      { min: 500000, max: 1000000 },
      { min: 1000000, max: 5000000 },
      { min: 5000000, max: 10000000 },
      { min: 10000000, max: 20000000 },
      { min: 20000000, max: 50000000 }
    ];
    return budgetOptions[Math.floor(Math.random() * budgetOptions.length)];
})(),
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
// server/services/geoapifyService.js

// ... (hàm transformGeoapifyFeature không đổi)

const searchAndCacheDestinations = async ({ query, category, budget }) => {
  // ... (phần kiểm tra cache trong DB không đổi)
  const dbQuery = { isActive: true };
  if (query) { dbQuery.$text = { $search: query }; }
  if (category) { dbQuery.category = category; }
 if (budget && budget.includes('-')) {
    const [minStr, maxStr] = budget.split('-');
    const min = parseInt(minStr, 10);
    const max = maxStr ? parseInt(maxStr, 10) : Infinity;

    // Sử dụng đúng tên biến 'min' và 'max'
    if (!isNaN(min) && max !== Infinity) {
      dbQuery['budgetRange.min'] = { $lt: max };
      dbQuery['budgetRange.max'] = { $gt: min };
    } else if (!isNaN(min) && max === Infinity) {
      dbQuery['budgetRange.min'] = { $gte: min };
    }

  }
  const existingDestinations = await Destination.find(dbQuery).limit(20);
  if (budget) {
    console.log('💰 Budget filter applied. Returning DB results only.');
    return existingDestinations;
  }
  if (existingDestinations.length > 0) {
    console.log('✅ Found destinations in local DB cache.');
    return existingDestinations;
  }
  // ...

  console.log('🔍 No cache found. Calling Geoapify API...');
  const apiKey = process.env.GEOAPIFY_API_KEY;
  if (!apiKey) throw new Error('GEOAPIFY_API_KEY is not defined.');

  // ====================== PHIÊN BẢN HOÀN CHỈNH CUỐI CÙNG ======================
  
  const baseUrl = 'https://api.geoapify.com/v2/places';
  
  const params = new URLSearchParams({
    apiKey: apiKey,
    limit: '20',
    // Luôn dùng bias để ưu tiên kết quả ở Việt Nam
    bias: 'proximity:105.854444,21.027778', // Tọa độ Hà Nội
  });

  // Xử lý tham số 'category' từ frontend
  if (category) {
    const categoryMap = {
      'beach': 'natural.beach',
      'mountain': 'natural.mountain_range',
      'historical': 'tourism.sights.castle,tourism.sights.ruins',
      'cultural': 'tourism.sights.place_of_worship,tourism.sights.theatre',
      'city': 'administrative.city_level,building.tourism',
      'nature': 'natural',
      'adventure': 'sport'
    };
    if (categoryMap[category]) {
      params.append('categories', categoryMap[category]);
    }
  } else {
    // Nếu không có category, đặt một giá trị mặc định
    params.append('categories', 'tourism.attraction');
  }

  // Xử lý tham số 'query' (tìm kiếm văn bản)
  if (query) {
    params.append('text', query);
  }

  const requestUrl = `${baseUrl}?${params.toString()}`;
  
  console.log('>>> Final Request URL:', requestUrl);

  const response = await axios.get(requestUrl);

  // ========================================================================

  // ... (phần xử lý response và lưu vào DB không đổi)
  if (!response.data.features || response.data.features.length === 0) {
    return [];
  }
  
  const destinationsToCreate = response.data.features.map(transformGeoapifyFeature);
  try {
    const newDestinations = await Destination.insertMany(destinationsToCreate, { ordered: false });
    console.log(`💾 Cached ${newDestinations.length} new destinations to DB.`);
    return newDestinations;
  } catch (error) {
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
