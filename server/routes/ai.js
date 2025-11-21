// fileName: routes/ai.js
const express = require('express');
const auth = require('../middleware/auth');
const openaiService = require('../services/openai');
const flightService = require('../services/flightapi');
const responseFormatter = require('../services/responseFormatter');
const conversationManager = require('../services/conversationManager');
const weatherService = require('../services/weatherService');
const geocodeService = require('../services/geocodeService');
const openstreetmapService = require('../services/openstreetmapService');
const router = express.Router();

// =========================================================================
// HELPER FUNCTIONS
// =========================================================================

/**
 * Create smart itinerary based on selected attractions and user preferences
 */
function createSmartItinerary({ 
  destination, 
  startDate, 
  endDate, 
  durationDays, 
  attractions, 
  restaurants, 
  hotels, 
  weather,
  userPreferences = {} 
}) {
  const itinerary = [];
  
  // === 1. XỬ LÝ DỮ LIỆU NGƯỜI DÙNG NHẬP ===
  const userAttractions = userPreferences.attractions 
    ? userPreferences.attractions.split(',').map(s => s.trim()) 
    : [];
    
  const userRestaurants = userPreferences.restaurants 
    ? userPreferences.restaurants.split(',').map(s => s.trim()) 
    : [];
    
  const userHotelName = userPreferences.hotel ? userPreferences.hotel.trim() : null;

  // === 2. MERGE DỮ LIỆU ===
  let finalAttractions = [...attractions];
  if (userAttractions.length > 0) {
      const userAttrObjects = userAttractions.map(name => ({
          name: name,
          address: 'Địa điểm theo yêu cầu',
          estimatedDuration: '2-3h',
          estimatedCost: 100000 
      }));
      finalAttractions = [...userAttrObjects, ...attractions];
  }

  const currentHotel = userHotelName 
    ? { name: userHotelName, address: 'Khách sạn đã chọn' } 
    : (hotels?.name ? hotels : { name: 'Khách sạn trung tâm', address: destination });

  // Tính toán
  const attractionsPerDay = Math.ceil(finalAttractions.length / durationDays);
  
  for (let day = 0; day < durationDays; day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + day);
    const dateStr = currentDate.toISOString().split('T')[0];
    const dayWeather = weather.find(w => w.date === dateStr) || {};
    
    const dayActivities = [];
    
    // --- SÁNG ---
    if (day === 0) {
      dayActivities.push({
        time: '14:00',
        type: 'checkin',
        title: `🏨 Check-in: ${currentHotel.name}`,
        description: currentHotel.address,
        duration: '1h',
        cost: currentHotel.estimatedCost || 0
      });
    } else {
       const morningAttrIdx = (day - 1) * 2; 
       if (morningAttrIdx < finalAttractions.length) {
          const attr = finalAttractions[morningAttrIdx];
          dayActivities.push({
            time: '08:30',
            type: 'attraction',
            title: `🎯 ${attr.name}`,
            description: attr.address || 'Tham quan',
            duration: attr.estimatedDuration || '3h',
            cost: attr.estimatedCost
          });
       }
    }

    // [SỬA] Logic Ăn uống (Trưa/Tối)
    let lunchCost = 150000; // Fallback an toàn
    if (restaurants && restaurants.length > 0) {
        const res = restaurants[day % restaurants.length];
        lunchCost = res.estimatedCost || 150000; // Dùng giá từ tags
    }
    
    // --- TRƯA ---
    let lunchName = 'Nhà hàng địa phương';
    let lunchDesc = 'Gợi ý ngon miệng';
    
    if (userRestaurants.length > 0) {
        lunchName = userRestaurants[day % userRestaurants.length];
        lunchDesc = 'Theo sở thích của bạn';
    } else if (restaurants && restaurants.length > 0) {
        lunchName = restaurants[day % restaurants.length]?.name;
        lunchDesc = restaurants[day % restaurants.length]?.address || 'Ăn trưa';
    }

    dayActivities.push({
      time: '12:00',
      type: 'meal',
      title: `🍽️ Ăn trưa: ${lunchName}`,
      description: lunchDesc,
      duration: '1.5h',
      cost: lunchCost
    });
    
    // --- CHIỀU ---
    const afternoonAttrIdx = (day === 0) ? 0 : ((day - 1) * 2 + 1);
    if (afternoonAttrIdx < finalAttractions.length && day !== durationDays - 1) {
      const attr = finalAttractions[afternoonAttrIdx];
      dayActivities.push({
        time: '14:30',
        type: 'attraction',
        title: `🎯 ${attr.name}`,
        description: attr.address || 'Khám phá',
        duration: attr.estimatedDuration || '2-3h',
        cost: attr.estimatedCost || 0
      });
    }
    
    // --- TỐI ---
    if (day !== durationDays - 1) {
      let dinnerName = 'Nhà hàng đặc sản';
      let dinnerDesc = 'Thưởng thức ẩm thực đêm';
      
      if (userRestaurants.length > 0) {
          dinnerName = userRestaurants[(day + 1) % userRestaurants.length];
          dinnerDesc = 'Theo sở thích của bạn';
      } else if (restaurants && restaurants.length > 0) {
          dinnerName = restaurants[(day + 1) % restaurants.length]?.name;
          dinnerDesc = restaurants[(day + 1) % restaurants.length]?.address || 'Ăn tối';
      }

      dayActivities.push({
        time: '19:00',
        type: 'meal',
        title: `🍽️ Ăn tối: ${dinnerName}`,
        description: dinnerDesc,
        duration: '1.5h',
        cost: 300000
      });
    }
    
    // Last day: Check-out
    if (day === durationDays - 1) {
      dayActivities.push({
        time: '10:00',
        type: 'checkout',
        title: '🏨 Check-out & Ra sân bay',
        description: 'Trả phòng và kết thúc hành trình',
        duration: '2h',
        cost: 0
      });
    }
    
    itinerary.push({
      day: day + 1,
      date: dateStr,
      weather: dayWeather,
      activities: dayActivities
    });
  }
  
  return itinerary;
}
// === HELPER: TÍNH GIÁ DỰA TRÊN DỮ LIỆU API (OSM TAGS) ===
function calculateCostFromTags(tags, type = 'attraction') {
  if (!tags) return 0;

  // 1. Kiểm tra xem có tag miễn phí không
  if (tags.fee === 'no' || tags.access === 'public') return 0;

  // 2. XỬ LÝ KHÁCH SẠN (Dựa vào số sao)
  if (type === 'hotel' || tags.tourism === 'hotel') {
    const stars = parseInt(tags.stars) || 0;
    if (stars >= 5) return 2500000; // 5 sao
    if (stars === 4) return 1500000; // 4 sao
    if (stars === 3) return 800000;  // 3 sao
    if (tags.tourism === 'hostel' || tags.tourism === 'guest_house') return 300000; // Nhà nghỉ/Hostel
    return 600000; // Mặc định khách sạn thường
  }

  // 3. XỬ LÝ NHÀ HÀNG (Dựa vào loại hình)
  if (type === 'restaurant' || tags.amenity === 'restaurant') {
    if (tags.cuisine === 'fine_dining') return 500000;
    if (tags.amenity === 'fast_food' || tags.amenity === 'cafe') return 50000;
    if (tags.amenity === 'food_court') return 40000;
    return 150000; // Nhà hàng trung bình
  }

  // 4. XỬ LÝ ĐỊA ĐIỂM THAM QUAN (Dựa vào loại hình)
  if (type === 'attraction') {
    // Công viên, biển, quảng trường -> Thường miễn phí
    if (tags.leisure === 'park' || tags.natural === 'beach' || tags.place === 'square') {
        return 0;
    }
    // Bảo tàng, khu di tích -> Có vé
    if (tags.tourism === 'museum' || tags.historic === 'memorial') {
        return 40000; 
    }
    // Công viên giải trí -> Vé cao
    if (tags.tourism === 'theme_park' || tags.leisure === 'water_park') {
        return 300000;
    }
    // Nếu có tag fee=yes nhưng không rõ giá -> Mức trung bình
    if (tags.fee === 'yes') return 50000;
  }

  // Mặc định nếu không tìm thấy thông tin gì
  return 0;
}
// =========================================================================
// ROUTES
// =========================================================================

// AI Travel Planning
router.post('/plan-trip', auth, async (req, res) => {
  try {
    const { destination, duration, budget, interests, travelStyle, groupSize, startDate, specialRequirements } = req.body;
    const plan = await openaiService.generateTripPlan({ destination, duration, budget, interests, travelStyle, groupSize, startDate, specialRequirements });
    res.json({ success: true, message: 'Tạo lịch trình thành công', plan: plan.plan, usage: plan.usage, metadata: { destination, duration, budget, generatedAt: new Date().toISOString() } });
  } catch (error) {
    console.error('Error generating trip plan:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi tạo lịch trình', error: error.message });
  }
});

// AI Travel Recommendations
router.post('/recommendations', auth, async (req, res) => {
  try {
    const { preferences, budget, duration, season, previousDestinations, travelStyle } = req.body;
    const recommendations = await openaiService.recommendDestinations({ preferences, budget, duration, season, previousDestinations, travelStyle });
    res.json({ success: true, message: 'Gợi ý điểm đến thành công', recommendations: recommendations.recommendations, usage: recommendations.usage, metadata: { preferences, budget, duration, season, generatedAt: new Date().toISOString() } });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi tạo gợi ý', error: error.message });
  }
});

// Generate content
router.post('/generate-content', auth, async (req, res) => {
    try {
        const { type, topic, destination, length, style, language } = req.body;
        const content = await openaiService.generateContent({ type, topic, destination, length, style, language });
        res.json({ success: true, message: 'Sinh nội dung thành công', content: content.content, usage: content.usage, timestamp: new Date().toISOString() });
      } catch (error) {
        console.error('Error generating content:', error);
        res.status(500).json({ success: false, message: 'Lỗi khi sinh nội dung', error: error.message });
      }
});

// Chat endpoint
router.post('/chat', auth, async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;
    const intent = await openaiService.extractFlightInfo(message);
    let response;
    
    if (intent.isFlightQuery && intent.origin && intent.destination && intent.date) {
      if (intent.returnDate) {
        const roundTripData = await flightService.searchRoundTripFlights(intent.origin, intent.destination, intent.date, intent.returnDate);
        response = await openaiService.chatWithRoundTripContext(message, conversationHistory, roundTripData);
      } else {
        const flightData = await flightService.searchFlights(intent.origin, intent.destination, intent.date);
        response = await openaiService.chatWithFlightContext(message, conversationHistory, flightData);
      }
    } else {
      response = await openaiService.chat(message, conversationHistory);
    }
    
    res.json({ success: true, message: 'Phản hồi AI thành công', response: response.response, usage: response.usage, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Error in AI chat:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi xử lý tin nhắn', error: error.message });
  }
});

// Smart Plan endpoint
router.post('/smart-plan', auth, async (req, res) => {
  try {
    const { message, destination, startDate, duration, budget, interests, travelStyle, userPreferences } = req.body;

    if (message && !destination) {
      const intent = await openaiService.analyzeSmartIntent(message);
      if (intent.needsMoreInfo) {
        return res.json({ success: true, needsMoreInfo: true, followUpQuestion: intent.followUpQuestion, currentIntent: intent });
      }
      const itineraryData = await openaiService.createSmartItinerary({
        destination: intent.destination, startDate: intent.startDate, duration: intent.duration || 3, budget: intent.budget || 5000000, interests: intent.interests || [], travelStyle
      });
      const structuredResponse = responseFormatter.formatItinerary(itineraryData);
      return res.json({ success: true, ...structuredResponse });
    }

    if (destination && startDate && duration) {
      const weather = await weatherService.getForecast(destination); 
      const hotels = await openstreetmapService.searchNearby(0, 0, 'hotels', 1000, 1); 
      const restaurants = await openstreetmapService.searchNearby(0, 0, 'restaurants', 1000, 5);
      const attractions = await openstreetmapService.searchNearby(0, 0, 'attractions', 1000, 5);

      const itinerary = createSmartItinerary({
        destination, startDate, durationDays: parseInt(duration), 
        attractions, restaurants, hotels: hotels[0], weather,
        userPreferences: userPreferences || {}
      });

      return res.json({
        success: true,
        type: 'itinerary_plan',
        summary: `Lịch trình ${duration} ngày tại ${destination}`,
        data: itinerary
      });
    }

    return res.status(400).json({ success: false, message: 'Thiếu thông tin' });
  } catch (error) {
    console.error('Smart Plan Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi tạo lịch trình', error: error.message });
  }
});

// Conversation endpoint
router.post('/conversation', auth, async (req, res) => {
  res.type('application/json');
  try {
    const { action, value } = req.body;
    const userId = req.userId;

    switch (action) {
      case 'start':
        conversationManager.resetConversation(userId);
        const startResponse = conversationManager.generateResponse(userId);
        return res.json(startResponse);

      case 'input':
        const response = conversationManager.generateResponse(userId, value);
        
        // FETCH: DESTINATION SELECTION
        if (response.type === 'conversation' && response.loading === true && 
            conversationManager.getConversation(userId).step === 'destination_selection') {
          const conv = conversationManager.getConversation(userId);
          const data = conv.data;
          try {
            const coords = await geocodeService.getCoordinates(data.destination);
            const allWeather = await weatherService.getForecast(data.destination);
            const weather = allWeather.slice(0, 3);
            const attractions = await openstreetmapService.searchNearby(coords.lat, coords.lng, 'attractions', 5000, 10);
            
            const attractionsWithInfo = attractions.map(attr => ({
              ...attr,
              estimatedDuration: '2-3h',
              estimatedCost: calculateCostFromTags(attr.tags, 'attraction'), 
              rating: parseFloat(attr.tags?.rating) || 4.5
            }));
            
            const hotels = await openstreetmapService.searchNearby(coords.lat, coords.lng, 'hotels', 3000, 3);

            const hotelsWithPrice = hotels.map(hotel => ({
              ...hotel,
              estimatedCost: calculateCostFromTags(hotel.tags, 'hotel')
            }));
            
            conv.data.weather = weather;
            conv.data.attractionsAvailable = attractionsWithInfo;
            conv.data.hotelsSample = hotelsWithPrice;            conv.data.coordinates = coords;
            conversationManager.updateConversation(userId, conv);
            
            return res.json({
              type: 'destination_selection',
              destination: data.destination,
              weather,
              attractions: attractionsWithInfo,
              hotelsSample: hotels,
              selectedAttractions: data.selectedAttractions || [],
              message: `🏖️ **${data.destination.toUpperCase()} - CHỌN ĐIỂM THAM QUAN**`
            });
          } catch (apiError) {
            console.error('API Error', apiError);
            conv.step = 'summary';
            conversationManager.updateConversation(userId, conv);
            return res.json(conversationManager.generateResponse(userId));
          }
        }
        
        // FETCH: GENERATING SUGGESTIONS
        if (response.type === 'conversation' && response.loading === true &&
            conversationManager.getConversation(userId).step === 'generating_suggestions') {
          const conv = conversationManager.getConversation(userId);
          const data = conv.data;
          try {
            const coords = data.coordinates || await geocodeService.getCoordinates(data.destination);
            const selectedAttractionsData = (data.attractionsAvailable || []).filter(attr => (data.selectedAttractions || []).includes(attr.name));
            const restaurants = await openstreetmapService.searchNearby(coords.lat, coords.lng, 'restaurants', 3000, 5);

            const restaurantsWithPrice = restaurants.map(res => ({
              ...res,
              estimatedCost: calculateCostFromTags(res.tags, 'restaurant')
          }));
            const hotels = data.hotelsSample || [];
            
            const itinerary = createSmartItinerary({
              destination: data.destination,
              startDate: data.startDate,
              endDate: data.endDate,
              durationDays: data.durationDays,
              attractions: selectedAttractionsData.length > 0 ? selectedAttractionsData : (data.attractionsAvailable || []),
              restaurants: restaurants,
              hotels: hotels[0],
              weather: data.weather || [],
              userPreferences: conv.data.userPreferences || {} 
            });

            // === [LOGIC MỚI] TÍNH CHI PHÍ DỰA TRÊN ORIGIN ===
            let mainTransportRate = 0;
            const transportMode = data.transportMode || 'personal';
            const origin = data.origin || '';
            const destination = data.destination || '';

            // Kiểm tra đơn giản: Nếu cùng thành phố -> Chi phí di chuyển chính = 0
            const isSameCity = origin.toLowerCase().includes(destination.toLowerCase()) || 
                               destination.toLowerCase().includes(origin.toLowerCase());

            if (isSameCity) {
                mainTransportRate = 0; 
            } else {
                switch (transportMode) {
                    case 'flight': 
                        // Logic giả lập: Hà Nội <-> HCM đắt hơn, Hà Nội <-> Đà Nẵng rẻ hơn
                        // Thực tế nên gọi API vé, ở đây ta dùng ước lượng
                        if ((origin.includes('Hà Nội') && destination.includes('Hồ Chí Minh')) || 
                            (origin.includes('Hồ Chí Minh') && destination.includes('Hà Nội'))) {
                            mainTransportRate = 3000000; // Bay xa
                        } else {
                            mainTransportRate = 2000000; // Bay gần trung bình
                        }
                        break;
                    case 'personal': 
                        // Ước tính xăng xe đường dài
                        mainTransportRate = 500000; 
                        break;
                    default:
                        mainTransportRate = 500000;
                }
            }
            
            // --- TÍNH TOÁN COST ESTIMATE ---
            let estFood = 0;
            let estActivities = 0;
            let estAccommodation = (hotels.length > 0) ? (500000 * data.durationDays) : 0;
            
            itinerary.forEach(day => {
                day.activities.forEach(act => {
                    if (act.type === 'meal') estFood += (act.cost || 0);
                    if (act.type === 'attraction') estActivities += (act.cost || 0);
                });
            });

            switch (transportMode) {
                case 'flight': 
                    mainTransportRate = 2500000; // Vé máy bay khứ hồi (ước tính trung bình)
                    break;
                case 'personal': 
                default:
                    mainTransportRate = 500000; // Xăng xe / Phí cầu đường (ước tính chia đầu người)
                    break;
            }
            
            // Tổng tiền vé chính = Giá vé * Số người
            const totalMainTransport = mainTransportRate * (data.numPeople || 1);
            
            // Tiền di chuyển nội thành (Taxi/Grab tại điểm đến)
            const localTransport = 150000 * data.durationDays; 

            // === PHÂN BỔ VÀO ĐÚNG DANH MỤC ===
            let finalFlightCost = 0;
            let finalTransportCost = 0;

            if (transportMode === 'flight') {
                finalFlightCost = totalMainTransport;      // Tiền vé vào mục "Vé máy bay"
                finalTransportCost = localTransport;       // Mục "Di chuyển" chỉ còn tiền taxi
            } else {
                finalFlightCost = 0;
                finalTransportCost = totalMainTransport + localTransport; // Xe cá nhân gộp hết vào "Di chuyển"
            }

            const costEstimate = {
              flights: finalFlightCost, 
              hotels: estAccommodation,
              food: estFood,
              activities: estActivities,
              transport: finalTransportCost, 
              others: 500000,
              total: finalFlightCost + estAccommodation + estFood + estActivities + finalTransportCost + 500000
            };

            conv.data.selectedAttractionsData = selectedAttractionsData;
            conv.data.hotels = hotels;
            conv.data.restaurants = restaurants;
            conv.data.itinerary = itinerary;
            conv.data.costEstimate = costEstimate; 
            conv.data.origin = origin;
            conv.data.restaurants = restaurantsWithPrice; // Lưu restaurants có giá
            conv.step = 'summary';
            conversationManager.updateConversation(userId, conv);
            
            return res.json(conversationManager.generateResponse(userId));
          } catch (apiError) {
            console.error('API Error', apiError);
            conv.step = 'summary';
            conversationManager.updateConversation(userId, conv);
            return res.json(conversationManager.generateResponse(userId));
          }
        }
        return res.json(response);

      case 'confirm':
        let conv = conversationManager.getConversation(userId);
        
        // === [THÊM MỚI] LOGIC: NHẬN DỮ LIỆU CHỈNH SỬA TỪ FRONTEND ===
        try {
          if (value && typeof value === 'string' && (value.trim().startsWith('{') || value.trim().startsWith('['))) {
              console.log('📝 [CONFIRM] Nhận dữ liệu đầy đủ từ Frontend...');
              const incomingData = JSON.parse(value);
              
              // Cập nhật Itinerary
              if (incomingData.itinerary && Array.isArray(incomingData.itinerary)) {
                  conv.data.itinerary = incomingData.itinerary;
              }
              // Cập nhật Cost Estimate
              if (incomingData.costEstimate) {
                  conv.data.costEstimate = incomingData.costEstimate;
              }
              // === QUAN TRỌNG: CẬP NHẬT DANH SÁCH ĐỊA ĐIỂM (FULL) ===
              if (incomingData.destinations && Array.isArray(incomingData.destinations)) {
                  conv.data.destinations = incomingData.destinations;
              }

              // Cập nhật thông tin cơ bản
              if (incomingData.startDate) conv.data.startDate = incomingData.startDate;
              if (incomingData.endDate) conv.data.endDate = incomingData.endDate;
              if (incomingData.durationDays) conv.data.durationDays = incomingData.durationDays;
              if (incomingData.numPeople) conv.data.numPeople = incomingData.numPeople;
              if (incomingData.budget) conv.data.budget = incomingData.budget;
              
              conversationManager.updateConversation(userId, conv);
          }
      } catch (e) {
          console.log('ℹ️ Confirm text only, using session data.');
      }

      const tripData = conv.data;
      const numDuration = tripData.durationDays || 3;
      
      // Xử lý ngày tháng an toàn
      let safeStartDate = tripData.startDate ? new Date(tripData.startDate) : new Date();
      if (isNaN(safeStartDate.getTime())) safeStartDate = new Date();
      const endDate = new Date(safeStartDate);
      endDate.setDate(endDate.getDate() + numDuration);

      // Lấy dữ liệu nguồn (nếu tripData.destinations chưa có)
      const attractions = tripData.selectedAttractionsData || tripData.attractionsAvailable || [];
      const restaurants = tripData.restaurants || [];
      const hotels = tripData.hotels || tripData.hotelsSample || [];
      const weather = tripData.weather || [];
      
      // Xử lý Travelers
      let travelersArray = tripData.travelers;
      if (!travelersArray || travelersArray.length === 0) {
          const count = tripData.numPeople || 1;
          travelersArray = Array.from({ length: count }, (_, i) => ({
              name: `Du khách ${i + 1}`,
              email: '',
              phone: ''
          }));
      }

      // Xử lý Lịch trình (nếu chưa có thì tạo mới)
      let itineraryDays = tripData.itinerary;
      if (!itineraryDays || itineraryDays.length === 0) {
           // Logic tạo lịch trình fallback (giữ nguyên code cũ của bạn nếu muốn)
           // ...
      }
      
      // === [SỬA] 2. ƯU TIÊN DÙNG DATA TỪ FRONTEND GỬI LÊN ===
      // Helper để format chuỗi nếu cần fallback
      const formatListFallback = (list) => list.map(item => {
           const name = item.name || item;
           const addr = item.location || item.vicinity || '';
           return addr ? `${name}, ${addr}` : name;
      });

      // Nếu Frontend đã gửi destinations (đã được format ở AIBot.tsx), hãy dùng nó.
      // Nếu không, mới tự tạo fallback (nhưng lấy TOÀN BỘ danh sách, không cắt bớt).
      const finalDestinations = tripData.destinations || [{
            name: tripData.destination,
            arrivalDate: safeStartDate.toISOString().split('T')[0],
            departureDate: endDate.toISOString().split('T')[0],
            weather: weather,
            
            // FALLBACK: Lấy hết mảng, không dùng hotels[0] nữa
            hotels: formatListFallback(hotels), 
            restaurants: formatListFallback(restaurants),
            attractions: formatListFallback(attractions),
            
            // Giữ tương thích ngược (nếu Schema cũ còn dùng string)
            hotel: hotels.length > 0 ? hotels[0].name : '', 
      }];

      const finalCostEstimate = tripData.costEstimate || { total: 0 };

      const formattedData = {
        title: `Du lịch ${tripData.destination} ${numDuration} ngày`,
        description: `Chuyến đi tự túc ${numDuration} ngày tại ${tripData.destination}`,
        startDate: safeStartDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        budget: tripData.budget || 5000000,
        costEstimate: finalCostEstimate, 
        
        // === Gán danh sách địa điểm chuẩn ===
        destinations: finalDestinations,
        
        travelers: travelersArray,
        itinerary: itineraryDays,
        metadata: { generatedBy: 'AI', generatedAt: new Date().toISOString() }
      };

      conversationManager.resetConversation(userId);
      return res.json({
        type: 'trip_created',
        message: '🎉 Đã tạo chuyến đi thành công!',
        tripData: formattedData,
        actions: [{ id: 'view', label: '📅 Xem chi tiết', value: 'view' }, { id: 'dashboard', label: '📊 Về Dashboard', value: 'dashboard' }]
      });

      case 'reset':
        conversationManager.resetConversation(userId);
        return res.json({ message: 'Đã reset cuộc hội thoại' });

      default:
        return res.status(400).json({ success: false, message: 'Invalid action' });
    }
  } catch (error) {
    console.error('Conversation Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi xử lý cuộc hội thoại', error: error.message });
  }
});

module.exports = router;