/**
 * TripAdvisor Service
 * Service xử lý các yêu cầu với TripAdvisor API:
 * - Tìm kiếm điểm tham quan
 * - Lấy đánh giá và nhận xét
 * - Tìm nhà hàng
 * - Tìm khách sạn
 * - Lấy thông tin chi tiết địa điểm
 */

const axios = require('axios');

class TripAdvisorService {
  constructor() {
    // TripAdvisor có thể được truy cập qua RapidAPI hoặc API trực tiếp
    this.apiKey = process.env.TRIPADVISOR_API_KEY || process.env.TRIPADVISOR_RAPIDAPI_KEY;
    this.rapidApiHost = process.env.TRIPADVISOR_RAPIDAPI_HOST || 'tripadvisor1.p.rapidapi.com';
    this.useRapidAPI = !!process.env.TRIPADVISOR_RAPIDAPI_KEY;
    
    // Base URL cho RapidAPI
    this.rapidApiBaseURL = `https://${this.rapidApiHost}`;
    
    // Base URL cho TripAdvisor API trực tiếp (nếu có)
    this.baseURL = 'https://api.tripadvisor.com/api';
  }

  /**
   * Tìm kiếm điểm tham quan
   * @param {Object} params - Thông tin tìm kiếm
   * @returns {Promise<Object>} Danh sách điểm tham quan
   */
  async searchAttractions(params) {
    const {
      query, // Tên địa điểm hoặc từ khóa
      location, // Tên thành phố hoặc địa điểm (VD: "Hanoi", "Ho Chi Minh City")
      lat, // Vĩ độ (tùy chọn)
      lng, // Kinh độ (tùy chọn)
      radius = 5000, // Bán kính tìm kiếm (mét)
      limit = 10
    } = params;

    try {
      if (this.useRapidAPI) {
        const response = await axios.get(
          `${this.rapidApiBaseURL}/attractions/search`,
          {
            params: {
              query: query,
              location: location,
              lat: lat,
              lng: lng,
              radius: radius,
              limit: limit,
              language: 'vi'
            },
            headers: {
              'X-RapidAPI-Key': this.apiKey,
              'X-RapidAPI-Host': this.rapidApiHost
            }
          }
        );

        return {
          success: true,
          attractions: this.formatAttractions(response.data.data || response.data)
        };
      } else {
        // Sử dụng TripAdvisor API trực tiếp
        const response = await axios.get(
          `${this.baseURL}/v1/attraction/search`,
          {
            params: {
              query: query,
              location: location,
              lat: lat,
              lng: lng,
              radius: radius,
              limit: limit,
              key: this.apiKey,
              language: 'vi'
            }
          }
        );

        return {
          success: true,
          attractions: this.formatAttractions(response.data.data || response.data)
        };
      }
    } catch (error) {
      console.error('TripAdvisor Search Attractions Error:', error.response?.data || error.message);
      throw new Error(`Lỗi khi tìm kiếm điểm tham quan: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Format dữ liệu điểm tham quan
   */
  formatAttractions(data) {
    if (!data || !Array.isArray(data)) {
      return [];
    }

    return data.map(attraction => ({
      id: attraction.location_id || attraction.id,
      name: attraction.name,
      address: attraction.address || attraction.address_obj?.address_string,
      location: {
        lat: attraction.latitude || attraction.lat,
        lng: attraction.longitude || attraction.lng
      },
      rating: attraction.rating || attraction.rating_value,
      reviewCount: attraction.num_reviews || attraction.review_count,
      priceLevel: attraction.price_level,
      category: attraction.category?.name || attraction.category,
      imageUrl: attraction.photo?.images?.large?.url || attraction.image_url,
      description: attraction.description || attraction.description_short,
      website: attraction.website || attraction.url,
      phone: attraction.phone,
      hours: attraction.hours || attraction.opening_hours,
      amenities: attraction.amenities || []
    }));
  }

  /**
   * Lấy chi tiết điểm tham quan
   * @param {String} locationId - ID địa điểm
   * @returns {Promise<Object>} Chi tiết địa điểm
   */
  async getAttractionDetails(locationId) {
    try {
      if (this.useRapidAPI) {
        const response = await axios.get(
          `${this.rapidApiBaseURL}/attractions/get-details`,
          {
            params: {
              locationId: locationId,
              language: 'vi'
            },
            headers: {
              'X-RapidAPI-Key': this.apiKey,
              'X-RapidAPI-Host': this.rapidApiHost
            }
          }
        );

        return {
          success: true,
          attraction: this.formatAttractionDetails(response.data)
        };
      } else {
        const response = await axios.get(
          `${this.baseURL}/v1/attraction/${locationId}/details`,
          {
            params: {
              key: this.apiKey,
              language: 'vi'
            }
          }
        );

        return {
          success: true,
          attraction: this.formatAttractionDetails(response.data)
        };
      }
    } catch (error) {
      console.error('TripAdvisor Get Attraction Details Error:', error.response?.data || error.message);
      throw new Error(`Lỗi khi lấy chi tiết điểm tham quan: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Format chi tiết điểm tham quan
   */
  formatAttractionDetails(data) {
    const attraction = data.data || data;
    
    return {
      id: attraction.location_id || attraction.id,
      name: attraction.name,
      address: attraction.address || attraction.address_obj?.address_string,
      location: {
        lat: attraction.latitude || attraction.lat,
        lng: attraction.longitude || attraction.lng
      },
      rating: attraction.rating || attraction.rating_value,
      reviewCount: attraction.num_reviews || attraction.review_count,
      priceLevel: attraction.price_level,
      category: attraction.category?.name || attraction.category,
      description: attraction.description || attraction.description_short,
      website: attraction.website || attraction.url,
      phone: attraction.phone,
      email: attraction.email,
      hours: attraction.hours || attraction.opening_hours,
      amenities: attraction.amenities || [],
      photos: (attraction.photos || attraction.photo?.images || []).map(photo => ({
        url: photo.large?.url || photo.url,
        caption: photo.caption
      })),
      reviews: attraction.reviews?.map(review => ({
        id: review.id,
        title: review.title,
        text: review.text,
        rating: review.rating,
        author: review.author?.username || review.author,
        date: review.date,
        helpful: review.helpful || 0
      })) || []
    };
  }

  /**
   * Tìm nhà hàng
   * @param {Object} params - Thông tin tìm kiếm
   * @returns {Promise<Object>} Danh sách nhà hàng
   */
  async searchRestaurants(params) {
    const {
      query,
      location,
      lat,
      lng,
      radius = 5000,
      limit = 10,
      cuisine = [], // Loại ẩm thực
      priceLevel = [], // Mức giá
      minRating = 0
    } = params;

    try {
      if (this.useRapidAPI) {
        const response = await axios.get(
          `${this.rapidApiBaseURL}/restaurants/search`,
          {
            params: {
              query: query,
              location: location,
              lat: lat,
              lng: lng,
              radius: radius,
              limit: limit,
              cuisine: cuisine.join(','),
              priceLevel: priceLevel.join(','),
              minRating: minRating,
              language: 'vi'
            },
            headers: {
              'X-RapidAPI-Key': this.apiKey,
              'X-RapidAPI-Host': this.rapidApiHost
            }
          }
        );

        return {
          success: true,
          restaurants: this.formatRestaurants(response.data.data || response.data)
        };
      } else {
        const response = await axios.get(
          `${this.baseURL}/v1/restaurant/search`,
          {
            params: {
              query: query,
              location: location,
              lat: lat,
              lng: lng,
              radius: radius,
              limit: limit,
              cuisine: cuisine.join(','),
              priceLevel: priceLevel.join(','),
              minRating: minRating,
              key: this.apiKey,
              language: 'vi'
            }
          }
        );

        return {
          success: true,
          restaurants: this.formatRestaurants(response.data.data || response.data)
        };
      }
    } catch (error) {
      console.error('TripAdvisor Search Restaurants Error:', error.response?.data || error.message);
      throw new Error(`Lỗi khi tìm kiếm nhà hàng: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Format dữ liệu nhà hàng
   */
  formatRestaurants(data) {
    if (!data || !Array.isArray(data)) {
      return [];
    }

    return data.map(restaurant => ({
      id: restaurant.location_id || restaurant.id,
      name: restaurant.name,
      address: restaurant.address || restaurant.address_obj?.address_string,
      location: {
        lat: restaurant.latitude || restaurant.lat,
        lng: restaurant.longitude || restaurant.lng
      },
      rating: restaurant.rating || restaurant.rating_value,
      reviewCount: restaurant.num_reviews || restaurant.review_count,
      priceLevel: restaurant.price_level,
      cuisine: restaurant.cuisine || restaurant.cuisine_types?.map(c => c.name) || [],
      imageUrl: restaurant.photo?.images?.large?.url || restaurant.image_url,
      description: restaurant.description || restaurant.description_short,
      website: restaurant.website || restaurant.url,
      phone: restaurant.phone,
      hours: restaurant.hours || restaurant.opening_hours,
      dietaryRestrictions: restaurant.dietary_restrictions || []
    }));
  }

  /**
   * Tìm khách sạn
   * @param {Object} params - Thông tin tìm kiếm
   * @returns {Promise<Object>} Danh sách khách sạn
   */
  async searchHotels(params) {
    const {
      query,
      location,
      lat,
      lng,
      radius = 5000,
      limit = 10,
      checkIn, // YYYY-MM-DD
      checkOut, // YYYY-MM-DD
      rooms = 1,
      adults = 2,
      children = 0,
      minRating = 0,
      priceRange = {} // {min, max}
    } = params;

    try {
      if (this.useRapidAPI) {
        const response = await axios.get(
          `${this.rapidApiBaseURL}/hotels/search`,
          {
            params: {
              query: query,
              location: location,
              lat: lat,
              lng: lng,
              radius: radius,
              limit: limit,
              checkIn: checkIn,
              checkOut: checkOut,
              rooms: rooms,
              adults: adults,
              children: children,
              minRating: minRating,
              minPrice: priceRange.min,
              maxPrice: priceRange.max,
              language: 'vi'
            },
            headers: {
              'X-RapidAPI-Key': this.apiKey,
              'X-RapidAPI-Host': this.rapidApiHost
            }
          }
        );

        return {
          success: true,
          hotels: this.formatHotels(response.data.data || response.data)
        };
      } else {
        const response = await axios.get(
          `${this.baseURL}/v1/hotel/search`,
          {
            params: {
              query: query,
              location: location,
              lat: lat,
              lng: lng,
              radius: radius,
              limit: limit,
              checkIn: checkIn,
              checkOut: checkOut,
              rooms: rooms,
              adults: adults,
              children: children,
              minRating: minRating,
              minPrice: priceRange.min,
              maxPrice: priceRange.max,
              key: this.apiKey,
              language: 'vi'
            }
          }
        );

        return {
          success: true,
          hotels: this.formatHotels(response.data.data || response.data)
        };
      }
    } catch (error) {
      console.error('TripAdvisor Search Hotels Error:', error.response?.data || error.message);
      throw new Error(`Lỗi khi tìm kiếm khách sạn: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Format dữ liệu khách sạn
   */
  formatHotels(data) {
    if (!data || !Array.isArray(data)) {
      return [];
    }

    return data.map(hotel => ({
      id: hotel.location_id || hotel.id,
      name: hotel.name,
      address: hotel.address || hotel.address_obj?.address_string,
      location: {
        lat: hotel.latitude || hotel.lat,
        lng: hotel.longitude || hotel.lng
      },
      rating: hotel.rating || hotel.rating_value,
      reviewCount: hotel.num_reviews || hotel.review_count,
      priceLevel: hotel.price_level,
      price: hotel.price || hotel.rate_from,
      currency: hotel.currency || 'VND',
      imageUrl: hotel.photo?.images?.large?.url || hotel.image_url,
      description: hotel.description || hotel.description_short,
      website: hotel.website || hotel.url,
      phone: hotel.phone,
      amenities: hotel.amenities || hotel.amenities_list || [],
      checkIn: hotel.check_in,
      checkOut: hotel.check_out,
      rooms: hotel.rooms || []
    }));
  }

  /**
   * Lấy đánh giá và nhận xét
   * @param {String} locationId - ID địa điểm
   * @param {Object} options - Tùy chọn
   * @returns {Promise<Object>} Danh sách đánh giá
   */
  async getReviews(locationId, options = {}) {
    const {
      limit = 10,
      sort = 'relevance', // relevance, date, rating
      filter = 'all' // all, positive, negative
    } = options;

    try {
      if (this.useRapidAPI) {
        const response = await axios.get(
          `${this.rapidApiBaseURL}/reviews/list`,
          {
            params: {
              locationId: locationId,
              limit: limit,
              sort: sort,
              filter: filter,
              language: 'vi'
            },
            headers: {
              'X-RapidAPI-Key': this.apiKey,
              'X-RapidAPI-Host': this.rapidApiHost
            }
          }
        );

        return {
          success: true,
          reviews: this.formatReviews(response.data.data || response.data)
        };
      } else {
        const response = await axios.get(
          `${this.baseURL}/v1/location/${locationId}/reviews`,
          {
            params: {
              key: this.apiKey,
              limit: limit,
              sort: sort,
              filter: filter,
              language: 'vi'
            }
          }
        );

        return {
          success: true,
          reviews: this.formatReviews(response.data.data || response.data)
        };
      }
    } catch (error) {
      console.error('TripAdvisor Get Reviews Error:', error.response?.data || error.message);
      throw new Error(`Lỗi khi lấy đánh giá: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Format dữ liệu đánh giá
   */
  formatReviews(data) {
    if (!data || !Array.isArray(data)) {
      return [];
    }

    return data.map(review => ({
      id: review.id,
      title: review.title,
      text: review.text,
      rating: review.rating,
      date: review.date,
      author: {
        username: review.author?.username || review.author,
        name: review.author?.name,
        location: review.author?.location,
        avatar: review.author?.avatar
      },
      helpful: review.helpful || 0,
      publishedDate: review.published_date,
      photos: review.photos || []
    }));
  }

  /**
   * Lấy thông tin thành phố/địa điểm
   * @param {String} locationId - ID địa điểm
   * @returns {Promise<Object>} Thông tin địa điểm
   */
  async getLocationInfo(locationId) {
    try {
      if (this.useRapidAPI) {
        const response = await axios.get(
          `${this.rapidApiBaseURL}/location/get-details`,
          {
            params: {
              locationId: locationId,
              language: 'vi'
            },
            headers: {
              'X-RapidAPI-Key': this.apiKey,
              'X-RapidAPI-Host': this.rapidApiHost
            }
          }
        );

        return {
          success: true,
          location: response.data
        };
      } else {
        const response = await axios.get(
          `${this.baseURL}/v1/location/${locationId}`,
          {
            params: {
              key: this.apiKey,
              language: 'vi'
            }
          }
        );

        return {
          success: true,
          location: response.data
        };
      }
    } catch (error) {
      console.error('TripAdvisor Get Location Info Error:', error.response?.data || error.message);
      throw new Error(`Lỗi khi lấy thông tin địa điểm: ${error.response?.data?.message || error.message}`);
    }
  }
}

module.exports = new TripAdvisorService();

