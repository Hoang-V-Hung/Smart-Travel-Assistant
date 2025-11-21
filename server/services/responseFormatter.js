/**
 * Response Formatter Service
 * Format AI responses thành structured JSON để frontend render thành interactive cards
 */

class ResponseFormatter {
  /**
   * Format lịch trình du lịch thành structured format
   * @param {Object} rawData - Dữ liệu thô từ các API
   * @returns {Object} Structured response
   */
  formatItinerary(rawData) {
    const { 
      destination, 
      startDate, 
      endDate, 
      budget, 
      days = [],
      hotels = [],
      restaurants = [],
      attractions = []
    } = rawData;

    return {
      type: 'itinerary_plan',
      summary: `Lịch trình ${days.length} ngày tại ${destination} với ngân sách ${this.formatCurrency(budget)}`,
      actionable: true,
      metadata: {
        destination,
        startDate,
        endDate,
        totalBudget: budget,
        duration: days.length
      },
      data: {
        title: `Du lịch ${destination} ${days.length} ngày`,
        description: `Lịch trình được tạo tự động bởi AI`,
        startDate,
        endDate,
        budget: {
          total: budget,
          spent: 0,
          currency: 'VND'
        },
        destinations: [
          {
            name: destination,
            arrivalDate: startDate,
            departureDate: endDate
          }
        ],
        itinerary: days.map((day, index) => ({
          day: index + 1,
          date: day.date,
          activities: day.activities.map(activity => ({
            id: `activity_${index}_${activity.time.replace(':', '')}`,
            time: activity.time,
            title: activity.title,
            location: activity.location || destination,
            description: activity.description || '',
            cost: activity.cost || 0,
            duration: activity.duration || 60,
            category: activity.category || 'sightseeing',
            selectable: true,
            selected: true  // Default selected
          })),
          totalCost: day.activities.reduce((sum, a) => sum + (a.cost || 0), 0)
        })),
        suggestedHotels: (hotels || []).map(h => ({
          id: h.id || h.place_id,
          name: h.name,
          location: h.location || h.vicinity,
          priceLevel: h.priceLevel || 2,
          rating: h.rating || 0,
          photo: h.photo,
          lat: h.lat,
          lng: h.lng,
          selectable: true,
          selected: false
        })),
        suggestedRestaurants: (restaurants || []).map(r => ({
          id: r.id || r.place_id,
          name: r.name,
          location: r.location || r.vicinity,
          cuisine: r.cuisine || 'Ẩm thực địa phương',
          priceRange: r.priceRange || '$$',
          rating: r.rating || 0,
          photo: r.photo,
          lat: r.lat,
          lng: r.lng,
          selectable: true,
          selected: false
        }))
      },
      actions: [
        {
          id: 'save_full_trip',
          type: 'create_trip',
          label: 'Lưu toàn bộ lịch trình',
          icon: 'save',
          primary: true
        },
        {
          id: 'customize',
          type: 'edit_itinerary',
          label: 'Chỉnh sửa',
          icon: 'edit',
          primary: false
        }
      ]
    };
  }

  /**
   * Format danh sách điểm đến
   */
  formatDestinations(destinations, query) {
    return {
      type: 'destination_list',
      summary: `Tìm thấy ${destinations.length} điểm đến phù hợp với "${query}"`,
      actionable: true,
      data: {
        destinations: destinations.map(d => ({
          id: d._id,
          name: d.name,
          country: d.country,
          city: d.city,
          description: d.description,
          category: d.category,
          budgetRange: d.budgetRange,
          recommendedDuration: d.recommendedDuration,
          rating: d.rating,
          images: d.images,
          tags: d.tags,
          selectable: true,
          selected: false
        }))
      },
      actions: [
        {
          id: 'plan_trip',
          type: 'create_trip_from_destination',
          label: 'Lập kế hoạch đi đến đây',
          icon: 'flight_takeoff',
          primary: true
        }
      ]
    };
  }

  /**
   * Format danh sách khách sạn
   */
  formatHotels(hotels, location) {
    return {
      type: 'hotel_list',
      summary: `Tìm thấy ${hotels.length} khách sạn tại ${location}`,
      actionable: true,
      data: {
        location,
        hotels: hotels.map(h => ({
          id: h.place_id || h.id,
          name: h.name,
          location: h.vicinity || h.address,
          rating: h.rating || 0,
          userRatingsTotal: h.user_ratings_total || 0,
          priceLevel: h.price_level || 0,
          photo: h.photo,
          lat: h.lat,
          lng: h.lng,
          types: h.types || [],
          selectable: true,
          selected: false
        }))
      },
      actions: [
        {
          id: 'add_to_trip',
          type: 'add_hotels_to_trip',
          label: 'Thêm vào chuyến đi',
          icon: 'add',
          primary: true
        }
      ]
    };
  }

  /**
   * Format danh sách chuyến bay
   */
  formatFlights(flights, origin, destination, type = 'oneway') {
    if (type === 'roundtrip') {
      return {
        type: 'roundtrip_flight_results',
        summary: `Tìm thấy ${flights.length} chuyến bay khứ hồi từ ${origin} đến ${destination}`,
        actionable: true,
        data: {
          origin,
          destination,
          type: 'roundtrip',
          flights: flights.map(f => ({
            id: `flight_${f.departureFlight?.departureTime}_${f.returnFlight?.departureTime}`,
            price: f.price,
            currency: f.currency || 'VND',
            departureFlight: f.departureFlight,
            returnFlight: f.returnFlight,
            selectable: true,
            selected: false
          }))
        },
        actions: [
          {
            id: 'add_flight',
            type: 'add_flight_to_trip',
            label: 'Thêm vào chuyến đi',
            icon: 'flight_takeoff',
            primary: true
          }
        ]
      };
    }

    return {
      type: 'flight_results',
      summary: `Tìm thấy ${flights.length} chuyến bay từ ${origin} đến ${destination}`,
      actionable: true,
      data: {
        origin,
        destination,
        type: 'oneway',
        flights: flights.map(f => ({
          id: `flight_${f.airline}_${f.departureTime}`,
          ...f,
          selectable: true,
          selected: false
        }))
      },
      actions: [
        {
          id: 'add_flight',
          type: 'add_flight_to_trip',
          label: 'Thêm vào chuyến đi',
          icon: 'flight_takeoff',
          primary: true
        }
      ]
    };
  }

  /**
   * Format plain text response (fallback)
   */
  formatTextResponse(text) {
    return {
      type: 'text',
      summary: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      actionable: false,
      data: {
        content: text
      },
      actions: []
    };
  }

  /**
   * Helper: Format currency
   */
  formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }

  /**
   * Helper: Parse date string
   */
  parseDate(dateStr) {
    return new Date(dateStr).toISOString();
  }

  /**
   * Helper: Calculate date range
   */
  calculateDateRange(startDate, days) {
    const dates = [];
    const start = new Date(startDate);
    
    for (let i = 0; i < days; i++) {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + i);
      dates.push(currentDate.toISOString().split('T')[0]);
    }
    
    return dates;
  }
}

module.exports = new ResponseFormatter();

