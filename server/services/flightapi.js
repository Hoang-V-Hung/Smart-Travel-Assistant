// server/services/flightapi.js

const axios = require('axios');

/**
 * Tìm kiếm chuyến bay một chiều bằng flightapi.io
 * @param {string} origin - Mã sân bay đi (ví dụ: 'SGN')
 * @param {string} destination - Mã sân bay đến (ví dụ: 'DAD')
 * @param {string} date - Ngày đi (ví dụ: '2025-12-20')
 * @returns {Promise<Array>} - Một mảng các chuyến bay đã được xử lý gọn gàng
 */
const searchFlights = async (origin, destination, date) => {
  const API_KEY = process.env.FLIGHT_API_IO_KEY;

  if (!API_KEY) {
    console.error('FLIGHT_API_IO_KEY is not configured in .env file.');
    return [];
  }

  // Xây dựng URL với Path Parameters theo đúng tài liệu
  const adults = '1';
  const children = '0';
  const infants = '0';
  const cabinClass = 'Economy';
  const currency = 'VND';

  const URL = `https://api.flightapi.io/onewaytrip/${API_KEY}/${origin}/${destination}/${date}/${adults}/${children}/${infants}/${cabinClass}/${currency}`;

  try {
    const response = await axios.get(URL);
    const { data } = response;

    // Kiểm tra các trường dữ liệu cần thiết
    if (!data || !data.itineraries || data.itineraries.length === 0) {
      console.log(`No flights found for ${origin} to ${destination} on ${date}`);
      return [];
    }
    
    // Sử dụng "defensive programming" để tránh lỗi nếu các mảng phụ trợ không tồn tại
    const legs = data.legs || [];
    const carriers = data.carriers || [];
    const legsMap = new Map(legs.map(leg => [leg.id, leg]));
    const carriersMap = new Map(carriers.map(carrier => [carrier.id, carrier]));

    const flightResults = [];
    for (const itinerary of data.itineraries) {
      if (!itinerary.leg_ids || !itinerary.pricing_options) continue;

      const leg = legsMap.get(itinerary.leg_ids[0]);
      if (!leg) continue;

      const pricingOption = itinerary.pricing_options[0];
      if (!pricingOption || !pricingOption.price) continue;
      
      const carrier = carriersMap.get(leg.marketing_carrier_ids[0]);
      
      flightResults.push({
        airline: carrier ? carrier.name : 'Không rõ hãng',
        flightNumber: leg.marketing_flight_number || '',
        departureAirport: origin,
        arrivalAirport: destination,
        departureTime: leg.departure,
        arrivalTime: leg.arrival,
        duration: leg.duration, // Đơn vị là phút
        price: pricingOption.price.amount,
        currency: currency,
      });
    }
    
    // Sắp xếp theo giá và chỉ lấy 5 kết quả tốt nhất
    return flightResults.sort((a, b) => a.price - b.price).slice(0, 5);

  } catch (error) {
    // Chỉ log lỗi khi có sự cố thực sự, không log khi không tìm thấy chuyến bay
    if (error.response) {
      console.error(`Error fetching flights from flightapi.io: Status ${error.response.status}`, error.response.data);
    } else {
      console.error('Error in axios request to flightapi.io:', error.message);
    }
    return []; 
  }
};


const searchRoundTripFlights = async (origin, destination, departureDate, returnDate) => {
  const API_KEY = process.env.FLIGHT_API_IO_KEY;
  
  // URL cho tìm kiếm khứ hồi
  const URL = `https://api.flightapi.io/roundtrip`;

  if (!API_KEY) {
    throw new Error('Flight API key is not configured in .env file.');
  }

  // Cấu trúc URL sẽ khác một chút, cần các tham số theo đúng thứ tự
  const fullURL = `${URL}/${API_KEY}/${origin}/${destination}/${departureDate}/${returnDate}/1/0/0/Economy/VND`;
  
  console.log(`Sending ROUND TRIP request to Flight API: ${fullURL}`);

  try {
    const response = await axios.get(fullURL);
    const { data } = response;
    
    // Logic xử lý dữ liệu khứ hồi sẽ phức tạp hơn, nhưng về cơ bản là giống nhau
    if (!data.itineraries || data.itineraries.length === 0) {
      console.log(`No round trip flights found`);
      return [];
    }
    
    const legsMap = new Map(data.legs.map(leg => [leg.id, leg]));
    const carriersMap = new Map(data.carriers.map(carrier => [carrier.id, carrier]));
    
    const flightResults = [];
    for (const itinerary of data.itineraries) {
      // Một hành trình khứ hồi sẽ có 2 chặng bay (leg_ids)
      if (itinerary.leg_ids.length < 2) continue;

      const departureLeg = legsMap.get(itinerary.leg_ids[0]);
      const returnLeg = legsMap.get(itinerary.leg_ids[1]);
      if (!departureLeg || !returnLeg) continue;

      const pricingOption = itinerary.pricing_options[0];
      if (!pricingOption || !pricingOption.price) continue;
      
      const departureCarrier = carriersMap.get(departureLeg.marketing_carrier_ids[0]);
      const returnCarrier = carriersMap.get(returnLeg.marketing_carrier_ids[0]);
      
      flightResults.push({
        price: pricingOption.price.amount,
        currency: 'VND',
        departureFlight: {
          airline: departureCarrier ? departureCarrier.name : 'Không rõ hãng',
          departureTime: departureLeg.departure,
          arrivalTime: departureLeg.arrival,
          duration: departureLeg.duration,
        },
        returnFlight: {
          airline: returnCarrier ? returnCarrier.name : 'Không rõ hãng',
          departureTime: returnLeg.departure,
          arrivalTime: returnLeg.arrival,
          duration: returnLeg.duration,
        }
      });
    }
    
    return flightResults.sort((a, b) => a.price - b.price).slice(0, 5);

  } catch (error) {
    if (error.response) {
      console.error(`Error fetching round trip flights: Status ${error.response.status}`, error.response.data);
    } else {
      console.error('Error in axios request:', error.message);
    }
    return []; 
  }
};

// Đừng quên export hàm mới
module.exports = { searchFlights, searchRoundTripFlights };