/**
 * Skyscanner Service
 * Service xử lý các yêu cầu với Skyscanner API:
 * - Tìm kiếm chuyến bay
 * - So sánh giá vé máy bay
 * - Lấy thông tin sân bay
 * - Lấy giá vé theo thời gian
 */

const axios = require('axios');

class SkyscannerService {
  constructor() {
    // Skyscanner có thể được truy cập qua RapidAPI hoặc API trực tiếp
    this.apiKey = process.env.SKYSCANNER_API_KEY || process.env.SKYSCANNER_RAPIDAPI_KEY;
    this.rapidApiHost = process.env.SKYSCANNER_RAPIDAPI_HOST || 'skyscanner-flight-search.p.rapidapi.com';
    this.useRapidAPI = !!process.env.SKYSCANNER_RAPIDAPI_KEY;
    
    // Base URL cho RapidAPI
    this.rapidApiBaseURL = `https://${this.rapidApiHost}`;
    
    // Base URL cho Skyscanner API trực tiếp (nếu có)
    this.baseURL = 'https://partners.api.skyscanner.net/apiservices';
  }

  /**
   * Tìm kiếm chuyến bay
   * @param {Object} params - Thông tin tìm kiếm
   * @returns {Promise<Object>} Danh sách chuyến bay
   */
  async searchFlights(params) {
    const {
      origin, // Mã sân bay hoặc tên thành phố (VD: "HAN", "Hanoi", "SGN", "Ho Chi Minh City")
      destination, // Mã sân bay hoặc tên thành phố
      departureDate, // YYYY-MM-DD
      returnDate, // YYYY-MM-DD (optional cho chuyến khứ hồi)
      adults = 1,
      children = 0,
      infants = 0,
      cabinClass = 'economy', // economy, premium_economy, business, first
      currency = 'VND',
      locale = 'vi-VN'
    } = params;

    try {
      if (this.useRapidAPI) {
        // Sử dụng RapidAPI
        const response = await axios.get(
          `${this.rapidApiBaseURL}/v3/search`,
          {
            params: {
              origin: origin,
              destination: destination,
              departureDate: departureDate,
              returnDate: returnDate,
              adults: adults,
              children: children,
              infants: infants,
              cabinClass: cabinClass,
              currency: currency,
              locale: locale
            },
            headers: {
              'X-RapidAPI-Key': this.apiKey,
              'X-RapidAPI-Host': this.rapidApiHost
            }
          }
        );

        return {
          success: true,
          flights: this.formatFlights(response.data),
          searchId: response.data.searchId || null
        };
      } else {
        // Sử dụng Skyscanner API trực tiếp (cần API key từ Skyscanner Partners)
        // Tạo session để tìm kiếm
        const createSessionResponse = await axios.post(
          `${this.baseURL}/pricing/v1.0`,
          {
            cabinClass: cabinClass,
            children: children,
            infants: infants,
            country: 'VN',
            currency: currency,
            locale: locale,
            originPlace: origin,
            destinationPlace: destination,
            outboundDate: departureDate,
            returnDate: returnDate,
            adults: adults
          },
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Accept': 'application/json'
            }
          }
        );

        // Poll session để lấy kết quả
        const sessionKey = createSessionResponse.headers.location.split('/').pop();
        const pollResponse = await axios.get(
          `${this.baseURL}/pricing/uk2/v1.0/${sessionKey}`,
          {
            params: {
              apiKey: this.apiKey,
              pageIndex: 0,
              pageSize: 20
            }
          }
        );

        return {
          success: true,
          flights: this.formatFlightsDirectAPI(pollResponse.data),
          sessionKey: sessionKey
        };
      }
    } catch (error) {
      console.error('Skyscanner API Error:', error.response?.data || error.message);
      throw new Error(`Lỗi khi tìm kiếm chuyến bay: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Format dữ liệu chuyến bay từ RapidAPI
   */
  formatFlights(data) {
    if (!data || !data.itineraries) {
      return [];
    }

    return data.itineraries.map(itinerary => ({
      id: itinerary.id,
      price: {
        amount: itinerary.price?.amount || 0,
        currency: itinerary.price?.currency || 'VND'
      },
      legs: itinerary.legs.map(leg => ({
        id: leg.id,
        origin: {
          displayCode: leg.origin?.displayCode,
          name: leg.origin?.name,
          city: leg.origin?.city,
          time: leg.departure
        },
        destination: {
          displayCode: leg.destination?.displayCode,
          name: leg.destination?.name,
          city: leg.destination?.city,
          time: leg.arrival
        },
        duration: leg.durationInMinutes,
        stops: leg.stopCount,
        segments: leg.segmentIds || [],
        carriers: leg.operatingCarrierIds || []
      })),
      agent: {
        name: itinerary.agent?.name,
        imageUrl: itinerary.agent?.imageUrl
      }
    }));
  }

  /**
   * Format dữ liệu chuyến bay từ Skyscanner API trực tiếp
   */
  formatFlightsDirectAPI(data) {
    if (!data || !data.Itineraries) {
      return [];
    }

    return data.Itineraries.map(itinerary => {
      const outboundLeg = data.Legs.find(leg => leg.Id === itinerary.OutboundLegId);
      const returnLeg = itinerary.InboundLegId 
        ? data.Legs.find(leg => leg.Id === itinerary.InboundLegId)
        : null;

      const pricingOptions = itinerary.PricingOptions || [];
      const cheapestOption = pricingOptions[0] || {};

      return {
        id: itinerary.Id,
        price: {
          amount: cheapestOption.Price || 0,
          currency: 'VND'
        },
        outbound: this.formatLeg(outboundLeg, data),
        return: returnLeg ? this.formatLeg(returnLeg, data) : null,
        agents: pricingOptions.map(option => ({
          name: option.Agents?.[0]?.Name || 'Unknown',
          price: option.Price,
          url: option.DeeplinkUrl
        }))
      };
    });
  }

  /**
   * Format leg từ Skyscanner API trực tiếp
   */
  formatLeg(leg, data) {
    if (!leg) return null;

    const origin = data.Places.find(p => p.Id === leg.OriginStation);
    const destination = data.Places.find(p => p.Id === leg.DestinationStation);
    const carriers = leg.Carriers.map(carrierId => 
      data.Carriers.find(c => c.Id === carrierId)
    ).filter(Boolean);

    return {
      origin: {
        code: origin?.Code,
        name: origin?.Name,
        type: origin?.Type
      },
      destination: {
        code: destination?.Code,
        name: destination?.Name,
        type: destination?.Type
      },
      departure: leg.Departure,
      arrival: leg.Arrival,
      duration: leg.Duration,
      stops: leg.Stops?.length || 0,
      carriers: carriers.map(c => ({
        name: c.Name,
        imageUrl: c.ImageUrl,
        code: c.Code
      }))
    };
  }

  /**
   * So sánh giá vé máy bay
   * @param {Object} params - Thông tin so sánh
   * @returns {Promise<Object>} So sánh giá
   */
  async comparePrices(params) {
    const {
      origin,
      destination,
      departureDate,
      returnDate,
      adults = 1,
      children = 0,
      infants = 0
    } = params;

    try {
      const flights = await this.searchFlights({
        origin,
        destination,
        departureDate,
        returnDate,
        adults,
        children,
        infants
      });

      if (!flights.success || flights.flights.length === 0) {
        return {
          success: false,
          message: 'Không tìm thấy chuyến bay nào'
        };
      }

      // Sắp xếp theo giá
      const sortedFlights = flights.flights.sort((a, b) => {
        const priceA = a.price?.amount || 0;
        const priceB = b.price?.amount || 0;
        return priceA - priceB;
      });

      const cheapest = sortedFlights[0];
      const mostExpensive = sortedFlights[sortedFlights.length - 1];
      const averagePrice = sortedFlights.reduce((sum, f) => sum + (f.price?.amount || 0), 0) / sortedFlights.length;

      return {
        success: true,
        comparison: {
          cheapest: cheapest,
          mostExpensive: mostExpensive,
          averagePrice: Math.round(averagePrice),
          totalFlights: sortedFlights.length,
          priceRange: {
            min: cheapest.price?.amount || 0,
            max: mostExpensive.price?.amount || 0
          }
        },
        allFlights: sortedFlights
      };
    } catch (error) {
      console.error('Skyscanner Compare Prices Error:', error.message);
      throw error;
    }
  }

  /**
   * Lấy thông tin sân bay
   * @param {String} query - Tên sân bay hoặc thành phố
   * @returns {Promise<Object>} Thông tin sân bay
   */
  async getAirports(query) {
    try {
      if (this.useRapidAPI) {
        const response = await axios.get(
          `${this.rapidApiBaseURL}/v3/autosuggest-flights`,
          {
            params: {
              query: query,
              locale: 'vi-VN'
            },
            headers: {
              'X-RapidAPI-Key': this.apiKey,
              'X-RapidAPI-Host': this.rapidApiHost
            }
          }
        );

        return {
          success: true,
          airports: response.data.places?.map(place => ({
            code: place.PlaceId,
            name: place.PlaceName,
            city: place.CityName,
            country: place.CountryName,
            type: place.Type
          })) || []
        };
      } else {
        // Sử dụng Skyscanner API trực tiếp
        const response = await axios.get(
          `${this.baseURL}/autosuggest/v1.0/VN/VND/vi-VN/`,
          {
            params: {
              query: query,
              apiKey: this.apiKey
            }
          }
        );

        return {
          success: true,
          airports: response.data.Places?.map(place => ({
            code: place.PlaceId,
            name: place.PlaceName,
            city: place.CityName,
            country: place.CountryName,
            type: place.Type
          })) || []
        };
      }
    } catch (error) {
      console.error('Skyscanner Get Airports Error:', error.response?.data || error.message);
      throw new Error(`Lỗi khi lấy thông tin sân bay: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Lấy giá vé theo thời gian (để xem xu hướng giá)
   * @param {Object} params - Thông tin tìm kiếm
   * @returns {Promise<Object>} Xu hướng giá
   */
  async getPriceTrends(params) {
    const {
      origin,
      destination,
      startDate, // Ngày bắt đầu tìm kiếm
      endDate, // Ngày kết thúc tìm kiếm
      days = 30 // Số ngày để phân tích
    } = params;

    try {
      const trends = [];
      const dates = [];
      
      // Tạo danh sách ngày để tìm kiếm
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(new Date(d).toISOString().split('T')[0]);
      }

      // Tìm kiếm giá cho mỗi ngày (có thể giới hạn số ngày để tránh rate limit)
      const searchDates = dates.slice(0, Math.min(days, dates.length));
      
      for (const date of searchDates) {
        try {
          const flights = await this.searchFlights({
            origin,
            destination,
            departureDate: date,
            adults: 1
          });

          if (flights.success && flights.flights.length > 0) {
            const prices = flights.flights.map(f => f.price?.amount || 0).filter(p => p > 0);
            if (prices.length > 0) {
              trends.push({
                date: date,
                minPrice: Math.min(...prices),
                maxPrice: Math.max(...prices),
                averagePrice: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
              });
            }
          }
          
          // Delay để tránh rate limit
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Error getting price for ${date}:`, error.message);
        }
      }

      return {
        success: true,
        trends: trends,
        summary: {
          cheapestDate: trends.length > 0 ? trends.reduce((min, t) => t.minPrice < min.minPrice ? t : min, trends[0]) : null,
          mostExpensiveDate: trends.length > 0 ? trends.reduce((max, t) => t.maxPrice > max.maxPrice ? t : max, trends[0]) : null,
          averagePrice: trends.length > 0 ? Math.round(trends.reduce((sum, t) => sum + t.averagePrice, 0) / trends.length) : 0
        }
      };
    } catch (error) {
      console.error('Skyscanner Get Price Trends Error:', error.message);
      throw error;
    }
  }
}

module.exports = new SkyscannerService();

