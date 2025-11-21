/**
 * Cost Estimator Service
 * Ước tính chi phí chuyến đi dựa vào destination, duration, travelers, budget
 */

/**
 * Estimate trip cost
 * @param {Object} params
 * @param {string} params.destination - Điểm đến
 * @param {number} params.duration - Số ngày
 * @param {number} params.numPeople - Số người
 * @param {number} params.budget - Ngân sách user đưa ra
 * @param {Array} params.hotels - Danh sách hotels từ OSM (optional)
 * @param {Array} params.flights - Flight data (optional)
 * @returns {Object} Cost breakdown
 */
const estimateTripCost = ({
  destination,
  duration,
  numPeople,
  budget,
  hotels = [],
  flights = null
}) => {
  console.log('💰 [Cost Estimator] Calculating for:', { destination, duration, numPeople, budget });

  // 1. FLIGHT COST (if available)
  const flightCost = flights ? flights.price : estimateFlightCost(destination, numPeople);

  // 2. HOTEL COST
  const avgHotelPricePerNight = estimateHotelCost(destination, budget, hotels);
  const numNights = duration - 1; // 3 ngày = 2 đêm
  const hotelTotal = avgHotelPricePerNight * numNights;

  // 3. FOOD COST
  const foodPerPersonPerDay = estimateFoodCost(destination, budget);
  const foodTotal = foodPerPersonPerDay * numPeople * duration;

  // 4. ACTIVITIES COST
  const activitiesPerDay = estimateActivitiesCost(destination, budget);
  const activitiesTotal = activitiesPerDay * duration;

  // 5. TRANSPORT COST (local)
  const transportPerDay = 200000; // Taxi, xe ôm, grab
  const transportTotal = transportPerDay * duration;

  // TOTAL
  const total = flightCost + hotelTotal + foodTotal + activitiesTotal + transportTotal;
  const perPerson = Math.round(total / numPeople);

  const result = {
    flights: flightCost,
    hotels: hotelTotal,
    food: foodTotal,
    activities: activitiesTotal,
    transport: transportTotal,
    total,
    perPerson,
    breakdown: {
      hotelPerNight: avgHotelPricePerNight,
      foodPerPersonPerDay: foodPerPersonPerDay,
      activitiesPerDay: activitiesPerDay,
      transportPerDay: transportPerDay
    }
  };

  console.log('✅ [Cost Estimator] Result:', result);
  return result;
};

/**
 * Estimate flight cost (fallback if no flight API data)
 */
const estimateFlightCost = (destination, numPeople) => {
  const flightPrices = {
    'Đà Nẵng': 1500000,
    'Phú Quốc': 2000000,
    'Nha Trang': 1800000,
    'Hà Nội': 1200000,
    'Đà Lạt': 1400000,
    'TP. Hồ Chí Minh': 0, // No flight needed if already there
  };

  const basePrice = flightPrices[destination] || 1500000;
  return basePrice * numPeople * 2; // Round trip
};

/**
 * Estimate hotel cost per night
 */
const estimateHotelCost = (destination, budget, hotels) => {
  // If we have real hotels data, use average
  if (hotels && hotels.length > 0) {
    // OSM doesn't have prices, so estimate based on destination + budget
    return estimateByBudget(destination, budget);
  }
  
  return estimateByBudget(destination, budget);
};

/**
 * Estimate based on budget range
 */
const estimateByBudget = (destination, budget) => {
  const destinationMultiplier = {
    'Phú Quốc': 1.3,
    'Đà Nẵng': 1.0,
    'Nha Trang': 0.9,
    'Hà Nội': 0.8,
    'Đà Lạt': 0.85,
    'TP. Hồ Chí Minh': 1.0
  };

  const multiplier = destinationMultiplier[destination] || 1.0;

  let baseHotelPrice;
  if (budget < 5000000) {
    baseHotelPrice = 500000; // Budget hotel
  } else if (budget < 10000000) {
    baseHotelPrice = 1000000; // Mid-range
  } else if (budget < 20000000) {
    baseHotelPrice = 2000000; // Upscale
  } else {
    baseHotelPrice = 3500000; // Luxury
  }

  return Math.round(baseHotelPrice * multiplier);
};

/**
 * Estimate food cost per person per day
 */
const estimateFoodCost = (destination, budget) => {
  const destinationMultiplier = {
    'Phú Quốc': 1.2,
    'Đà Nẵng': 1.0,
    'Nha Trang': 0.9,
    'Hà Nội': 0.8,
    'Đà Lạt': 0.85,
    'TP. Hồ Chí Minh': 1.0
  };

  const multiplier = destinationMultiplier[destination] || 1.0;

  let baseFoodPrice;
  if (budget < 5000000) {
    baseFoodPrice = 250000; // Street food, local restaurants
  } else if (budget < 10000000) {
    baseFoodPrice = 400000; // Mid-range restaurants
  } else if (budget < 20000000) {
    baseFoodPrice = 600000; // Nice restaurants
  } else {
    baseFoodPrice = 1000000; // Fine dining
  }

  return Math.round(baseFoodPrice * multiplier);
};

/**
 * Estimate activities cost per day
 */
const estimateActivitiesCost = (destination, budget) => {
  const activityCosts = {
    'Đà Nẵng': 500000, // Bà Nà Hills, museums, tours
    'Phú Quốc': 700000, // Water sports, tours, parks
    'Nha Trang': 600000, // Island hopping, vinpearl
    'Hà Nội': 300000, // Museums, temples (mostly free/cheap)
    'Đà Lạt': 400000, // Nature tours, gardens
    'TP. Hồ Chí Minh': 350000, // City tours, museums
  };

  return activityCosts[destination] || 500000;
};

/**
 * Format cost for display
 */
const formatCost = (amount) => {
  return amount.toLocaleString('vi-VN') + 'đ';
};

/**
 * Check if estimated cost fits within budget
 */
const checkBudgetFit = (estimatedTotal, userBudget) => {
  const difference = userBudget - estimatedTotal;
  const percentage = (difference / userBudget) * 100;

  if (difference >= 0) {
    return {
      fits: true,
      message: `✅ Phù hợp với ngân sách (còn ${formatCost(difference)})`,
      percentage: Math.round(percentage)
    };
  } else {
    return {
      fits: false,
      message: `⚠️ Vượt ngân sách ${formatCost(Math.abs(difference))}`,
      percentage: Math.round(Math.abs(percentage))
    };
  }
};

module.exports = {
  estimateTripCost,
  formatCost,
  checkBudgetFit
};

