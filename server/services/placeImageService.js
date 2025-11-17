// fileName: placeImageService.js
// Service lấy ảnh cho địa điểm - HOÀN TOÀN MIỄN PHÍ
const axios = require('axios');
require('dotenv').config();

// Base URLs
const WIKIMEDIA_API_URL = 'https://commons.wikimedia.org/w/api.php';
const WIKIPEDIA_API_URL = 'https://vi.wikipedia.org/w/api.php';
const UNSPLASH_API_URL = 'https://api.unsplash.com';
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || null; // Có thể để trống

/**
 * Lấy ảnh từ Wikimedia Commons (Wikipedia) - MIỄN PHÍ, KHÔNG CẦN API KEY
 * @param {string} placeName - Tên địa điểm
 * @param {string} cityName - Tên thành phố (optional)
 * @returns {Promise<string|null>} URL ảnh hoặc null
 */
const getImageFromWikimedia = async (placeName, cityName = '') => {
  try {
    // Tìm kiếm Wikipedia article về địa điểm
    const searchQuery = cityName ? `${placeName} ${cityName}` : placeName;
    
    // Bước 1: Tìm Wikipedia article
    const searchResponse = await axios.get(WIKIPEDIA_API_URL, {
      params: {
        action: 'query',
        format: 'json',
        list: 'search',
        srsearch: searchQuery,
        srlimit: 1,
        origin: '*',
      },
    });

    const searchResults = searchResponse.data?.query?.search || [];
    if (searchResults.length === 0) {
      console.log(`⚠️ No Wikipedia article found for: ${searchQuery}`);
      return null;
    }

    const pageTitle = searchResults[0].title;
    console.log(`📖 Found Wikipedia article: ${pageTitle}`);

    // Bước 2: Lấy thông tin page với images
    const pageResponse = await axios.get(WIKIPEDIA_API_URL, {
      params: {
        action: 'query',
        format: 'json',
        titles: pageTitle,
        prop: 'pageimages',
        pithumbsize: 800,
        origin: '*',
      },
    });

    const pages = pageResponse.data?.query?.pages || {};
    const pageId = Object.keys(pages)[0];
    const page = pages[pageId];

    // Lấy thumbnail từ Wikipedia
    if (page.thumbnail) {
      const imageUrl = page.thumbnail.source;
      console.log(`✅ Found image from Wikipedia: ${imageUrl}`);
      return imageUrl;
    }

    // Bước 3: Nếu không có thumbnail, tìm ảnh từ Wikimedia Commons
    const imagesResponse = await axios.get(WIKIPEDIA_API_URL, {
      params: {
        action: 'query',
        format: 'json',
        titles: pageTitle,
        prop: 'images',
        imlimit: 5,
        origin: '*',
      },
    });

    const imagePages = imagesResponse.data?.query?.pages || {};
    const imageTitles = Object.values(imagePages)
      .flatMap(page => page.images || [])
      .map(img => img.title)
      .filter(title => title.includes('File:') && /\.(jpg|jpeg|png|webp)$/i.test(title))
      .slice(0, 3);

    if (imageTitles.length === 0) {
      return null;
    }

    // Lấy URL ảnh từ Wikimedia Commons
    for (const imageTitle of imageTitles) {
      try {
        const imageInfoResponse = await axios.get(WIKIMEDIA_API_URL, {
          params: {
            action: 'query',
            format: 'json',
            titles: imageTitle,
            prop: 'imageinfo',
            iiprop: 'url',
            iiurlwidth: 800,
            origin: '*',
          },
        });

        const imagePages = imageInfoResponse.data?.query?.pages || {};
        const imagePage = Object.values(imagePages)[0];
        
        if (imagePage?.imageinfo?.[0]?.thumburl || imagePage?.imageinfo?.[0]?.url) {
          const imageUrl = imagePage.imageinfo[0].thumburl || imagePage.imageinfo[0].url;
          console.log(`✅ Found image from Wikimedia Commons: ${imageUrl}`);
          return imageUrl;
        }
      } catch (err) {
        console.warn(`⚠️ Error fetching image ${imageTitle}:`, err.message);
        continue;
      }
    }

    return null;
  } catch (error) {
    console.error('❌ Wikimedia API Error:', error.message);
    return null;
  }
};

/**
 * Lấy ảnh từ Unsplash - MIỄN PHÍ (có thể dùng public API hoặc đăng ký free)
 * @param {string} placeName - Tên địa điểm
 * @param {string} type - Loại địa điểm: 'hotel', 'restaurant', 'attraction'
 * @returns {Promise<string|null>} URL ảnh hoặc null
 */
const getImageFromUnsplash = async (placeName, type = 'hotel') => {
  try {
    // Unsplash có public API không cần key nhưng giới hạn
    // Hoặc có thể đăng ký free tại https://unsplash.com/developers
    
    const searchQuery = `${placeName} ${type}`;
    
    // Nếu có access key, dùng official API
    if (UNSPLASH_ACCESS_KEY) {
      const response = await axios.get(`${UNSPLASH_API_URL}/search/photos`, {
        params: {
          query: searchQuery,
          per_page: 1,
          orientation: 'landscape',
        },
        headers: {
          'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        },
      });

      const results = response.data?.results || [];
      if (results.length > 0) {
        const imageUrl = results[0].urls?.regular || results[0].urls?.small;
        console.log(`✅ Found image from Unsplash: ${imageUrl}`);
        return imageUrl;
      }
    }

    // Fallback: Dùng Unsplash Source (public, không cần key nhưng giới hạn)
    // Hoặc có thể dùng placeholder service
    return null;
  } catch (error) {
    console.error('❌ Unsplash API Error:', error.message);
    return null;
  }
};

/**
 * Lấy ảnh từ Pexels - MIỄN PHÍ (cần đăng ký free API key)
 * @param {string} placeName - Tên địa điểm
 * @param {string} type - Loại địa điểm
 * @returns {Promise<string|null>} URL ảnh hoặc null
 */
const getImageFromPexels = async (placeName, type = 'hotel') => {
  try {
    // Pexels cần API key nhưng free
    // Đăng ký tại: https://www.pexels.com/api/
    const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
    
    if (!PEXELS_API_KEY) {
      return null;
    }

    const searchQuery = `${placeName} ${type}`;
    const response = await axios.get('https://api.pexels.com/v1/search', {
      params: {
        query: searchQuery,
        per_page: 1,
        orientation: 'landscape',
      },
      headers: {
        'Authorization': PEXELS_API_KEY,
      },
    });

    const photos = response.data?.photos || [];
    if (photos.length > 0) {
      const imageUrl = photos[0].src?.large || photos[0].src?.medium;
      console.log(`✅ Found image from Pexels: ${imageUrl}`);
      return imageUrl;
    }

    return null;
  } catch (error) {
    console.error('❌ Pexels API Error:', error.message);
    return null;
  }
};

/**
 * Lấy ảnh từ địa điểm - Tự động thử nhiều nguồn
 * @param {Object} place - Đối tượng địa điểm
 * @param {string} place.name - Tên địa điểm
 * @param {string} place.vicinity - Địa chỉ
 * @param {string} type - Loại địa điểm: 'hotels', 'restaurants', 'attractions'
 * @returns {Promise<string|null>} URL ảnh hoặc null
 */
const getPlaceImage = async (place, type = 'hotels') => {
  if (!place || !place.name) {
    return null;
  }

  const placeName = place.name;
  const vicinity = place.vicinity || '';
  
  // Extract city name from vicinity
  const cityMatch = vicinity.match(/([^,]+),?\s*([^,]+)?$/);
  const cityName = cityMatch ? cityMatch[1] : '';

  const typeMap = {
    hotels: 'hotel',
    restaurants: 'restaurant',
    attractions: 'attraction',
  };
  const searchType = typeMap[type] || 'place';

  console.log(`🖼️ Fetching image for: ${placeName} (${searchType})`);

  // Thử các nguồn theo thứ tự ưu tiên
  let imageUrl = null;

  // 1. Thử Wikimedia Commons (Wikipedia) - MIỄN PHÍ, KHÔNG CẦN KEY
  imageUrl = await getImageFromWikimedia(placeName, cityName);
  if (imageUrl) {
    return imageUrl;
  }

  // 2. Thử Pexels (nếu có API key)
  imageUrl = await getImageFromPexels(placeName, searchType);
  if (imageUrl) {
    return imageUrl;
  }

  // 3. Thử Unsplash (nếu có API key)
  imageUrl = await getImageFromUnsplash(placeName, searchType);
  if (imageUrl) {
    return imageUrl;
  }

  // 4. Fallback: Dùng placeholder hoặc ảnh mặc định
  console.log(`⚠️ No image found for: ${placeName}`);
  return null;
};

/**
 * Lấy nhiều ảnh cho một địa điểm
 * @param {Object} place - Đối tượng địa điểm
 * @param {string} type - Loại địa điểm
 * @param {number} limit - Số lượng ảnh tối đa
 * @returns {Promise<Array<string>>} Mảng URL ảnh
 */
const getPlaceImages = async (place, type = 'hotels', limit = 3) => {
  const images = [];
  
  // Lấy ảnh chính
  const mainImage = await getPlaceImage(place, type);
  if (mainImage) {
    images.push(mainImage);
  }

  // Có thể mở rộng để lấy thêm ảnh từ các nguồn khác
  // Hiện tại chỉ trả về ảnh chính

  return images.slice(0, limit);
};

module.exports = {
  getPlaceImage,
  getPlaceImages,
  getImageFromWikimedia,
  getImageFromUnsplash,
  getImageFromPexels,
};

