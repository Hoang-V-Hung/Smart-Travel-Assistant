/**
 * Geocode Service - Lấy tọa độ (lat, lng) từ tên địa điểm
 * Sử dụng Nominatim (OpenStreetMap) - MIỄN PHÍ
 */

const axios = require('axios');

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

/**
 * Hardcoded coordinates for popular Vietnam destinations (để nhanh hơn)
 */
const POPULAR_DESTINATIONS = {
  'Đà Nẵng': { lat: 16.0544, lng: 108.2022 },
  'Phú Quốc': { lat: 10.2231, lng: 103.9676 },
  'Hà Nội': { lat: 21.0285, lng: 105.8542 },
  'TP. Hồ Chí Minh': { lat: 10.8231, lng: 106.6297 },
  'TP.HCM': { lat: 10.8231, lng: 106.6297 },
  'Sài Gòn': { lat: 10.8231, lng: 106.6297 },
  'Nha Trang': { lat: 12.2388, lng: 109.1967 },
  'Đà Lạt': { lat: 11.9404, lng: 108.4583 },
  'Huế': { lat: 16.4637, lng: 107.5909 },
  'Hội An': { lat: 15.8801, lng: 108.3380 },
  'Vũng Tàu': { lat: 10.3460, lng: 107.0843 },
  'Cần Thơ': { lat: 10.0452, lng: 105.7469 },
  'Quy Nhơn': { lat: 13.7563, lng: 109.2298 },
  'Phan Thiết': { lat: 10.9276, lng: 108.1023 },
  'Sa Pa': { lat: 22.3364, lng: 103.8438 },
  'Hạ Long': { lat: 20.9537, lng: 107.0786 }
};

/**
 * Get coordinates for a destination
 * @param {string} destination - Tên địa điểm
 * @returns {Promise<{lat: number, lng: number}>}
 */
const getCoordinates = async (destination) => {
  console.log('🌍 [Geocode] Getting coordinates for:', destination);

  // Check hardcoded list first
  if (POPULAR_DESTINATIONS[destination]) {
    console.log('✅ [Geocode] Found in cache:', POPULAR_DESTINATIONS[destination]);
    return POPULAR_DESTINATIONS[destination];
  }

  // Otherwise, call Nominatim API
  try {
    const url = `${NOMINATIM_BASE_URL}/search`;
    const params = {
      q: `${destination}, Vietnam`,
      format: 'json',
      limit: 1,
      'accept-language': 'vi'
    };

    const headers = {
      'User-Agent': 'SmartTravelAssistant/1.0'
    };

    const response = await axios.get(url, { params, headers });
    
    if (response.data && response.data.length > 0) {
      const result = {
        lat: parseFloat(response.data[0].lat),
        lng: parseFloat(response.data[0].lon)
      };
      console.log('✅ [Geocode] Found via API:', result);
      return result;
    }

    // Fallback: return default coordinates (Hanoi)
    console.warn('⚠️  [Geocode] Not found, using default (Hanoi)');
    return { lat: 21.0285, lng: 105.8542 };
    
  } catch (error) {
    console.error('❌ [Geocode] Error:', error.message);
    // Fallback to Hanoi
    return { lat: 21.0285, lng: 105.8542 };
  }
};

/**
 * Get city name from coordinates (reverse geocoding)
 */
const getCityName = async (lat, lng) => {
  try {
    const url = `${NOMINATIM_BASE_URL}/reverse`;
    const params = {
      lat,
      lon: lng,
      format: 'json',
      'accept-language': 'vi'
    };

    const headers = {
      'User-Agent': 'SmartTravelAssistant/1.0'
    };

    const response = await axios.get(url, { params, headers });
    
    if (response.data && response.data.address) {
      const address = response.data.address;
      return address.city || address.town || address.village || address.county || 'Unknown';
    }
    
    return 'Unknown';
  } catch (error) {
    console.error('❌ [Reverse Geocode] Error:', error.message);
    return 'Unknown';
  }
};

module.exports = {
  getCoordinates,
  getCityName,
  POPULAR_DESTINATIONS
};

