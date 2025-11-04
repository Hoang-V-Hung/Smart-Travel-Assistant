/**
 * Google Maps Service
 * Service xử lý các yêu cầu với Google Maps API:
 * - Geocoding (chuyển đổi địa chỉ <-> tọa độ)
 * - Places API (tìm địa điểm, nhà hàng, khách sạn)
 * - Directions API (chỉ đường)
 * - Distance Matrix API (tính khoảng cách)
 */

const axios = require('axios');

class GoogleMapsService {
  constructor() {
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY;
    this.baseURL = 'https://maps.googleapis.com/maps/api';
  }

  /**
   * Geocoding - Chuyển đổi địa chỉ thành tọa độ
   * @param {String} address - Địa chỉ cần tìm
   * @returns {Promise<Object>} Thông tin địa chỉ và tọa độ
   */
  async geocode(address) {
    try {
      const response = await axios.get(
        `${this.baseURL}/geocode/json`,
        {
          params: {
            address: address,
            key: this.apiKey,
            language: 'vi'
          }
        }
      );

      if (response.data.status === 'OK' && response.data.results.length > 0) {
        const result = response.data.results[0];
        return {
          success: true,
          address: result.formatted_address,
          location: {
            lat: result.geometry.location.lat,
            lng: result.geometry.location.lng
          },
          placeId: result.place_id,
          components: result.address_components,
          fullResult: result
        };
      } else {
        throw new Error(`Geocoding failed: ${response.data.status}`);
      }
    } catch (error) {
      console.error('Google Maps Geocoding Error:', error.response?.data || error.message);
      throw new Error(`Lỗi khi geocoding: ${error.response?.data?.error_message || error.message}`);
    }
  }

  /**
   * Reverse Geocoding - Chuyển đổi tọa độ thành địa chỉ
   * @param {Number} lat - Vĩ độ
   * @param {Number} lng - Kinh độ
   * @returns {Promise<Object>} Thông tin địa chỉ
   */
  async reverseGeocode(lat, lng) {
    try {
      const response = await axios.get(
        `${this.baseURL}/geocode/json`,
        {
          params: {
            latlng: `${lat},${lng}`,
            key: this.apiKey,
            language: 'vi'
          }
        }
      );

      if (response.data.status === 'OK' && response.data.results.length > 0) {
        const result = response.data.results[0];
        return {
          success: true,
          address: result.formatted_address,
          placeId: result.place_id,
          components: result.address_components,
          fullResult: result
        };
      } else {
        throw new Error(`Reverse Geocoding failed: ${response.data.status}`);
      }
    } catch (error) {
      console.error('Google Maps Reverse Geocoding Error:', error.response?.data || error.message);
      throw new Error(`Lỗi khi reverse geocoding: ${error.response?.data?.error_message || error.message}`);
    }
  }

  /**
   * Tìm kiếm địa điểm (Places API - Text Search)
   * @param {String} query - Từ khóa tìm kiếm
   * @param {Object} options - Các tùy chọn
   * @returns {Promise<Object>} Danh sách địa điểm
   */
  async searchPlaces(query, options = {}) {
    const {
      location, // {lat, lng}
      radius = 5000, // bán kính tìm kiếm (mét)
      type, // restaurant, hotel, tourist_attraction, etc.
      language = 'vi'
    } = options;

    try {
      const params = {
        query: query,
        key: this.apiKey,
        language: language
      };

      if (location) {
        params.location = `${location.lat},${location.lng}`;
        params.radius = radius;
      }

      if (type) {
        params.type = type;
      }

      const response = await axios.get(
        `${this.baseURL}/place/textsearch/json`,
        { params }
      );

      if (response.data.status === 'OK') {
        const places = response.data.results.map(place => ({
          name: place.name,
          address: place.formatted_address,
          location: {
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng
          },
          placeId: place.place_id,
          rating: place.rating,
          userRatingsTotal: place.user_ratings_total,
          types: place.types,
          photos: place.photos?.map(photo => ({
            reference: photo.photo_reference,
            url: `${this.baseURL}/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${this.apiKey}`
          })) || []
        }));

        return {
          success: true,
          places: places,
          nextPageToken: response.data.next_page_token
        };
      } else {
        throw new Error(`Place search failed: ${response.data.status}`);
      }
    } catch (error) {
      console.error('Google Maps Place Search Error:', error.response?.data || error.message);
      throw new Error(`Lỗi khi tìm kiếm địa điểm: ${error.response?.data?.error_message || error.message}`);
    }
  }

  /**
   * Tìm nhà hàng gần đây
   * @param {Object} location - Tọa độ {lat, lng}
   * @param {Object} options - Các tùy chọn
   * @returns {Promise<Object>} Danh sách nhà hàng
   */
  async findRestaurants(location, options = {}) {
    const {
      radius = 5000,
      keyword,
      minPrice = 0,
      maxPrice = 4,
      openNow = false
    } = options;

    try {
      const params = {
        location: `${location.lat},${location.lng}`,
        radius: radius,
        type: 'restaurant',
        key: this.apiKey,
        language: 'vi'
      };

      if (keyword) {
        params.keyword = keyword;
      }

      if (openNow) {
        params.opennow = true;
      }

      const response = await axios.get(
        `${this.baseURL}/place/nearbysearch/json`,
        { params }
      );

      if (response.data.status === 'OK') {
        let restaurants = response.data.results.map(place => ({
          name: place.name,
          address: place.vicinity || place.formatted_address,
          location: {
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng
          },
          placeId: place.place_id,
          rating: place.rating,
          userRatingsTotal: place.user_ratings_total,
          priceLevel: place.price_level,
          photos: place.photos?.map(photo => ({
            reference: photo.photo_reference,
            url: `${this.baseURL}/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${this.apiKey}`
          })) || []
        }));

        // Lọc theo giá
        if (minPrice > 0 || maxPrice < 4) {
          restaurants = restaurants.filter(r => {
            const price = r.priceLevel || 2;
            return price >= minPrice && price <= maxPrice;
          });
        }

        return {
          success: true,
          restaurants: restaurants,
          nextPageToken: response.data.next_page_token
        };
      } else {
        throw new Error(`Restaurant search failed: ${response.data.status}`);
      }
    } catch (error) {
      console.error('Google Maps Restaurant Search Error:', error.response?.data || error.message);
      throw new Error(`Lỗi khi tìm nhà hàng: ${error.response?.data?.error_message || error.message}`);
    }
  }

  /**
   * Tìm khách sạn gần đây
   * @param {Object} location - Tọa độ {lat, lng}
   * @param {Object} options - Các tùy chọn
   * @returns {Promise<Object>} Danh sách khách sạn
   */
  async findHotels(location, options = {}) {
    const {
      radius = 5000,
      minRating = 0,
      maxPrice = 4
    } = options;

    try {
      const response = await axios.get(
        `${this.baseURL}/place/nearbysearch/json`,
        {
          params: {
            location: `${location.lat},${location.lng}`,
            radius: radius,
            type: 'lodging',
            key: this.apiKey,
            language: 'vi'
          }
        }
      );

      if (response.data.status === 'OK') {
        let hotels = response.data.results.map(place => ({
          name: place.name,
          address: place.vicinity || place.formatted_address,
          location: {
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng
          },
          placeId: place.place_id,
          rating: place.rating,
          userRatingsTotal: place.user_ratings_total,
          priceLevel: place.price_level,
          photos: place.photos?.map(photo => ({
            reference: photo.photo_reference,
            url: `${this.baseURL}/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${this.apiKey}`
          })) || []
        }));

        // Lọc theo rating
        if (minRating > 0) {
          hotels = hotels.filter(h => h.rating >= minRating);
        }

        // Lọc theo giá
        if (maxPrice < 4) {
          hotels = hotels.filter(h => {
            const price = h.priceLevel || 2;
            return price <= maxPrice;
          });
        }

        return {
          success: true,
          hotels: hotels,
          nextPageToken: response.data.next_page_token
        };
      } else {
        throw new Error(`Hotel search failed: ${response.data.status}`);
      }
    } catch (error) {
      console.error('Google Maps Hotel Search Error:', error.response?.data || error.message);
      throw new Error(`Lỗi khi tìm khách sạn: ${error.response?.data?.error_message || error.message}`);
    }
  }

  /**
   * Lấy chỉ đường (Directions API)
   * @param {Object} origin - Điểm xuất phát {lat, lng} hoặc địa chỉ
   * @param {Object} destination - Điểm đến {lat, lng} hoặc địa chỉ
   * @param {Object} options - Các tùy chọn
   * @returns {Promise<Object>} Thông tin chỉ đường
   */
  async getDirections(origin, destination, options = {}) {
    const {
      mode = 'driving', // driving, walking, bicycling, transit
      waypoints = [],
      avoid = [],
      language = 'vi'
    } = options;

    try {
      const params = {
        origin: typeof origin === 'string' ? origin : `${origin.lat},${origin.lng}`,
        destination: typeof destination === 'string' ? destination : `${destination.lat},${destination.lng}`,
        mode: mode,
        key: this.apiKey,
        language: language
      };

      if (waypoints.length > 0) {
        params.waypoints = waypoints.map(wp => 
          typeof wp === 'string' ? wp : `${wp.lat},${wp.lng}`
        ).join('|');
      }

      if (avoid.length > 0) {
        params.avoid = avoid.join('|');
      }

      const response = await axios.get(
        `${this.baseURL}/directions/json`,
        { params }
      );

      if (response.data.status === 'OK' && response.data.routes.length > 0) {
        const route = response.data.routes[0];
        const leg = route.legs[0];

        return {
          success: true,
          distance: {
            text: leg.distance.text,
            value: leg.distance.value // mét
          },
          duration: {
            text: leg.duration.text,
            value: leg.duration.value // giây
          },
          startAddress: leg.start_address,
          endAddress: leg.end_address,
          steps: leg.steps.map(step => ({
            instruction: step.html_instructions,
            distance: step.distance.text,
            duration: step.duration.text,
            polyline: step.polyline.points
          })),
          polyline: route.overview_polyline.points,
          overviewPolyline: route.overview_polyline.points
        };
      } else {
        throw new Error(`Directions failed: ${response.data.status}`);
      }
    } catch (error) {
      console.error('Google Maps Directions Error:', error.response?.data || error.message);
      throw new Error(`Lỗi khi lấy chỉ đường: ${error.response?.data?.error_message || error.message}`);
    }
  }

  /**
   * Tính khoảng cách và thời gian (Distance Matrix API)
   * @param {Array} origins - Mảng các điểm xuất phát
   * @param {Array} destinations - Mảng các điểm đến
   * @param {Object} options - Các tùy chọn
   * @returns {Promise<Object>} Ma trận khoảng cách
   */
  async getDistanceMatrix(origins, destinations, options = {}) {
    const {
      mode = 'driving',
      language = 'vi'
    } = options;

    try {
      const params = {
        origins: origins.map(origin => 
          typeof origin === 'string' ? origin : `${origin.lat},${origin.lng}`
        ).join('|'),
        destinations: destinations.map(dest => 
          typeof dest === 'string' ? dest : `${dest.lat},${dest.lng}`
        ).join('|'),
        mode: mode,
        key: this.apiKey,
        language: language
      };

      const response = await axios.get(
        `${this.baseURL}/distancematrix/json`,
        { params }
      );

      if (response.data.status === 'OK') {
        return {
          success: true,
          rows: response.data.rows.map(row => ({
            elements: row.elements.map(element => ({
              status: element.status,
              distance: element.distance ? {
                text: element.distance.text,
                value: element.distance.value
              } : null,
              duration: element.duration ? {
                text: element.duration.text,
                value: element.duration.value
              } : null
            }))
          }))
        };
      } else {
        throw new Error(`Distance Matrix failed: ${response.data.status}`);
      }
    } catch (error) {
      console.error('Google Maps Distance Matrix Error:', error.response?.data || error.message);
      throw new Error(`Lỗi khi tính khoảng cách: ${error.response?.data?.error_message || error.message}`);
    }
  }

  /**
   * Lấy chi tiết địa điểm (Place Details API)
   * @param {String} placeId - Place ID
   * @param {Object} options - Các tùy chọn
   * @returns {Promise<Object>} Chi tiết địa điểm
   */
  async getPlaceDetails(placeId, options = {}) {
    const {
      fields = ['name', 'formatted_address', 'geometry', 'rating', 'user_ratings_total', 'photos', 'reviews', 'opening_hours', 'website', 'phone_number', 'price_level'],
      language = 'vi'
    } = options;

    try {
      const response = await axios.get(
        `${this.baseURL}/place/details/json`,
        {
          params: {
            place_id: placeId,
            fields: fields.join(','),
            key: this.apiKey,
            language: language
          }
        }
      );

      if (response.data.status === 'OK') {
        const place = response.data.result;
        return {
          success: true,
          place: {
            name: place.name,
            address: place.formatted_address,
            location: place.geometry ? {
              lat: place.geometry.location.lat,
              lng: place.geometry.location.lng
            } : null,
            rating: place.rating,
            userRatingsTotal: place.user_ratings_total,
            reviews: place.reviews || [],
            photos: place.photos?.map(photo => ({
              reference: photo.photo_reference,
              url: `${this.baseURL}/place/photo?maxwidth=800&photoreference=${photo.photo_reference}&key=${this.apiKey}`
            })) || [],
            openingHours: place.opening_hours,
            website: place.website,
            phoneNumber: place.international_phone_number || place.formatted_phone_number,
            priceLevel: place.price_level
          }
        };
      } else {
        throw new Error(`Place Details failed: ${response.data.status}`);
      }
    } catch (error) {
      console.error('Google Maps Place Details Error:', error.response?.data || error.message);
      throw new Error(`Lỗi khi lấy chi tiết địa điểm: ${error.response?.data?.error_message || error.message}`);
    }
  }
}

module.exports = new GoogleMapsService();

