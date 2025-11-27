// fileName: openstreetmapService.js
// Service tích hợp OpenStreetMap API - HOÀN TOÀN MIỄN PHÍ, KHÔNG CẦN API KEY
const axios = require('axios');
const { getPlaceImage } = require('./placeImageService');

// Base URLs
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const OVERPASS_BASE_URL = 'https://overpass-api.de/api/interpreter';

// Map type từ frontend sang OSM tags
const typeMapping = {
  hotels: {
    amenity: ['hotel', 'hostel', 'guest_house', 'motel'],
    tourism: ['hotel', 'hostel', 'guest_house', 'apartment']
  },
  restaurants: {
    amenity: ['restaurant', 'cafe', 'fast_food', 'food_court', 'bar', 'pub', 'bistro'],
    cuisine: ['vietnamese', 'asian', 'chinese', 'japanese', 'korean', 'thai']
  },
  attractions: {
    tourism: ['attraction', 'museum', 'gallery', 'theme_park', 'zoo', 'aquarium', 'viewpoint'],
    historic: ['monument', 'memorial', 'castle', 'ruins'],
    leisure: ['park', 'playground', 'sports_centre', 'stadium']
  }
};

// Normalize OSM result về format giống Travel Advisor
// Lưu ý: photo sẽ được lấy sau bằng getPlaceImage (async)
const normalizePlace = (place, type = 'hotels', photoUrl = null) => {
  if (!place) return null;
  
  // Lấy tọa độ
  let lat = null;
  let lng = null;
  
  if (place.lat && place.lon) {
    lat = Number(place.lat);
    lng = Number(place.lon);
  } else if (place.geometry && place.geometry.coordinates) {
    // Overpass API format: [lng, lat]
    lng = Number(place.geometry.coordinates[0]);
    lat = Number(place.geometry.coordinates[1]);
  } else if (place.center) {
    lat = Number(place.center.lat);
    lng = Number(place.center.lon);
  }

  // Lấy địa chỉ
  const address = place.address || {};
  const addressParts = [];
  if (address.road) addressParts.push(address.road);
  if (address.house_number) addressParts.push(address.house_number);
  if (address.suburb || address.neighbourhood) addressParts.push(address.suburb || address.neighbourhood);
  if (address.city || address.town || address.village) addressParts.push(address.city || address.town || address.village);
  const vicinity = addressParts.length > 0 
    ? addressParts.join(', ') 
    : (place.display_name || '').split(',').slice(0, 3).join(',');

  const name = place.name || place.tags?.name || place.display_name?.split(',')[0] || 'Không rõ tên';

  return {
    place_id: place.place_id || place.id || `${lat}_${lng}`,
    name: name,
    rating: null, // OSM không có rating
    user_ratings_total: 0,
    vicinity: vicinity,
    lat: lat,
    lng: lng,
    photo: photoUrl, // Ảnh sẽ được lấy từ placeImageService
    types: place.tags ? Object.keys(place.tags).filter(k => k.startsWith('amenity') || k.startsWith('tourism') || k.startsWith('leisure')) : [],
    tags: place.tags || {},
  };
};

/**
 * Autocomplete - Tìm kiếm địa điểm bằng text
 * @param {string} query - Từ khóa tìm kiếm
 * @returns {Promise<Array>} Danh sách gợi ý
 */
const autocomplete = async (query) => {
  if (!query || query.length < 2) return [];

  const url = `${NOMINATIM_BASE_URL}/search`;
  
  const params = {
    q: query,
    format: 'json',
    addressdetails: 1,
    limit: 10,
    // countrycodes: 'vn', // Giới hạn tìm kiếm trong Việt Nam (có thể bỏ nếu muốn toàn cầu)
    'accept-language': 'vi',
  };

  // Thêm User-Agent header (yêu cầu của Nominatim)
  const headers = {
    'User-Agent': 'SmartTravelAssistant/1.0 (hunghoang.16102005@gmail.com)', // Thay đổi email của bạn
  };

  console.log('🔍 OSM Nominatim - Autocomplete:', { query });

  try {
    const response = await axios.get(url, { params, headers });
    
    const results = response.data || [];
    
    return results.map(item => ({
      description: item.display_name || item.name || 'Không rõ tên',
      secondary_description: item.address ? 
        `${item.address.city || item.address.town || ''}, ${item.address.country || ''}`.trim() : '',
      place_id: item.place_id?.toString(),
      locationId: `${item.lat},${item.lon}`, // Dùng tọa độ làm locationId
      resultType: item.type || item.class || 'place',
      lat: Number(item.lat),
      lng: Number(item.lon),
    }));
  } catch (error) {
    console.error('❌ OSM Nominatim Autocomplete Error:', error.message);
    throw new Error(`Lỗi khi tìm kiếm địa điểm: ${error.message}`);
  }
};

/**
 * Tìm kiếm địa điểm xung quanh bằng Overpass API (tốt hơn cho nearby search)
 * @param {number} lat - Vĩ độ
 * @param {number} lng - Kinh độ
 * @param {string} type - Loại địa điểm: 'hotels', 'restaurants', 'attractions'
 * @param {number} radius - Bán kính tìm kiếm (mét), mặc định 2000m
 * @returns {Promise<Array>} Danh sách địa điểm
 */
const searchNearby = async (lat, lng, type = 'hotels', radius = 2000, limit = 20) => {
  console.log('🔍 OSM Overpass - Searching nearby:', { lat, lng, type, radius, limit });

  const tags = typeMapping[type] || typeMapping.hotels;
  
  // Xây dựng Overpass QL query
  let query = `[out:json][timeout:25];
(
`;

  // Thêm các tag cho hotels
  if (type === 'hotels') {
    tags.amenity?.forEach(amenity => {
      query += `  node["amenity"="${amenity}"](around:${radius},${lat},${lng});\n`;
      query += `  way["amenity"="${amenity}"](around:${radius},${lat},${lng});\n`;
    });
    tags.tourism?.forEach(tourism => {
      query += `  node["tourism"="${tourism}"](around:${radius},${lat},${lng});\n`;
      query += `  way["tourism"="${tourism}"](around:${radius},${lat},${lng});\n`;
    });
  }
  
  // Thêm các tag cho restaurants
  if (type === 'restaurants') {
    tags.amenity?.forEach(amenity => {
      query += `  node["amenity"="${amenity}"](around:${radius},${lat},${lng});\n`;
      query += `  way["amenity"="${amenity}"](around:${radius},${lat},${lng});\n`;
    });
  }
  
  // Thêm các tag cho attractions
  if (type === 'attractions') {
    tags.tourism?.forEach(tourism => {
      query += `  node["tourism"="${tourism}"](around:${radius},${lat},${lng});\n`;
      query += `  way["tourism"="${tourism}"](around:${radius},${lat},${lng});\n`;
    });
    tags.historic?.forEach(historic => {
      query += `  node["historic"="${historic}"](around:${radius},${lat},${lng});\n`;
      query += `  way["historic"="${historic}"](around:${radius},${lat},${lng});\n`;
    });
    tags.leisure?.forEach(leisure => {
      query += `  node["leisure"="${leisure}"](around:${radius},${lat},${lng});\n`;
      query += `  way["leisure"="${leisure}"](around:${radius},${lat},${lng});\n`;
    });
  }

  query += `);
out center meta ${limit};
`;

  try {
    const response = await axios.post(OVERPASS_BASE_URL, query, {
      headers: {
        'Content-Type': 'text/plain',
        'User-Agent': 'SmartTravelAssistant/1.0',
      },
    });

    const elements = response.data.elements || [];
    console.log(`✅ Found ${elements.length} places from Overpass`);

    // Convert elements thành places và normalize
    // Convert elements thành places và normalize
    const placesPromises = elements.map(async (element) => {
      // FIX: Trích xuất địa chỉ từ tags của Overpass
      const addressFromTags = {
        house_number: element.tags?.['addr:housenumber'],
        road: element.tags?.['addr:street'],
        suburb: element.tags?.['addr:suburb'] || element.tags?.['addr:ward'] || element.tags?.['addr:district'],
        city: element.tags?.['addr:city'] || element.tags?.['addr:province'],
        town: element.tags?.['addr:town'],
        village: element.tags?.['addr:village']
      };

      const place = {
        id: element.id,
        lat: element.lat || element.center?.lat,
        lon: element.lon || element.center?.lon,
        name: element.tags?.name,
        tags: element.tags,
        type: element.type,
        address: addressFromTags, // Đã map dữ liệu vào đây thay vì để rỗng
        display_name: element.tags?.name // Fallback tên nếu cần
      };
      
      // Lấy ảnh cho địa điểm
      const normalizedPlace = normalizePlace(place, type);
      if (normalizedPlace) {
        try {
          const photoUrl = await getPlaceImage(normalizedPlace, type);
          normalizedPlace.photo = photoUrl;
        } catch (error) {
          console.warn(`⚠️ Error fetching image for ${normalizedPlace.name}:`, error.message);
        }
      }
      
      return normalizedPlace;
    });
    
    const places = (await Promise.all(placesPromises)).filter(Boolean);

    // Nếu Overpass không có đủ kết quả, thử dùng Nominatim
    if (places.length < 5) {
      console.log('⚠️ Overpass returned few results, trying Nominatim...');
      const nominatimResults = await searchNearbyNominatim(lat, lng, type, radius);
      // Merge và deduplicate
      const merged = [...places];
      nominatimResults.forEach(np => {
        if (!merged.find(p => p.place_id === np.place_id)) {
          merged.push(np);
        }
      });
      return merged.slice(0, 20); // Giới hạn 20 kết quả
    }

    return places.slice(0, 20);
  } catch (error) {
    console.error('❌ OSM Overpass Error:', error.message);
    // Fallback về Nominatim nếu Overpass lỗi
    console.log('⚠️ Falling back to Nominatim...');
    return await searchNearbyNominatim(lat, lng, type, radius);
  }
};

/**
 * Tìm kiếm địa điểm xung quanh bằng Nominatim (fallback method)
 */
const searchNearbyNominatim = async (lat, lng, type = 'hotels', radius = 2000) => {
  const searchTerms = {
    hotels: 'hotel',
    restaurants: 'restaurant',
    attractions: 'attraction'
  };

  const searchTerm = searchTerms[type] || 'hotel';
  
  const url = `${NOMINATIM_BASE_URL}/search`;
  
  const params = {
    q: searchTerm,
    format: 'json',
    addressdetails: 1,
    limit: 20,
    viewbox: `${lng - 0.01},${lat + 0.01},${lng + 0.01},${lat - 0.01}`, // Approximate bounding box
    bounded: 1,
    'accept-language': 'vi',
  };

  const headers = {
    'User-Agent': 'SmartTravelAssistant/1.0',
  };

  try {
    const response = await axios.get(url, { params, headers });
    const results = response.data || [];
    
    // Filter by distance
    const filtered = results
      .map(item => {
        const itemLat = Number(item.lat);
        const itemLng = Number(item.lon);
        const distance = calculateDistance(lat, lng, itemLat, itemLng);
        return { ...item, distance };
      })
      .filter(item => item.distance <= radius / 1000) // Convert to km
      .sort((a, b) => a.distance - b.distance);

    console.log(`✅ Found ${filtered.length} places from Nominatim`);
    
    // Lấy ảnh cho mỗi địa điểm
    const placesPromises = filtered.map(async (item) => {
      const normalizedPlace = normalizePlace(item, type);
      if (normalizedPlace) {
        try {
          const photoUrl = await getPlaceImage(normalizedPlace, type);
          normalizedPlace.photo = photoUrl;
        } catch (error) {
          console.warn(`⚠️ Error fetching image for ${normalizedPlace.name}:`, error.message);
        }
      }
      return normalizedPlace;
    });
    
    return (await Promise.all(placesPromises)).filter(Boolean);
  } catch (error) {
    console.error('❌ OSM Nominatim Search Error:', error.message);
    throw new Error(`Lỗi khi tìm kiếm địa điểm: ${error.message}`);
  }
};

/**
 * Tính khoảng cách giữa 2 điểm (Haversine formula)
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
};

/**
 * Tìm kiếm địa điểm bằng text query
 */
const searchByText = async (query, type = 'hotels') => {
  const searchTerms = {
    hotels: 'hotel',
    restaurants: 'restaurant',
    attractions: 'attraction'
  };

  const searchTerm = `${searchTerms[type]} ${query}`;
  
  return await autocomplete(searchTerm);
};

/**
 * Lấy chi tiết địa điểm bằng place_id hoặc tọa độ
 */
const getPlaceDetails = async (placeId) => {
  const url = `${NOMINATIM_BASE_URL}/lookup`;
  
  const params = {
    osm_ids: placeId,
    format: 'json',
    addressdetails: 1,
    'accept-language': 'vi',
  };

  const headers = {
    'User-Agent': 'SmartTravelAssistant/1.0',
  };

  try {
    const response = await axios.get(url, { params, headers });
    const results = response.data || [];
    
    if (results.length === 0) {
      throw new Error('Không tìm thấy địa điểm');
    }

    return normalizePlace(results[0]);
  } catch (error) {
    console.error('❌ OSM Place Details Error:', error.message);
    throw new Error(`Lỗi khi lấy chi tiết địa điểm: ${error.message}`);
  }
};

module.exports = {
  autocomplete,
  searchNearby,
  searchByText,
  getPlaceDetails,
  typeMapping,
};

