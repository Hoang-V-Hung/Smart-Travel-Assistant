// [FILE: routes/trips.js]
const express = require('express');
const auth = require('../middleware/auth');
const Trip = require('../models/Trip');
const flightService = require('../services/flightapi')

const router = express.Router();

router.get('/search-flights', auth, async (req, res) => {
  try {
    const { origin, destination, date, returnDate } = req.query;

    if (!origin || !destination || !date) {
      return res.status(400).json({ message: 'Thiếu thông tin: origin, destination, date' });
    }

    let flights = [];

    // Nếu có returnDate -> Tìm vé khứ hồi
    if (returnDate) {
      const rawFlights = await flightService.searchRoundTripFlights(origin, destination, date, returnDate);
      flights = rawFlights.map(f => ({
        airline: f.departureFlight.airline,
        departureTime: f.departureFlight.departureTime,
        returnTime: f.returnFlight.departureTime,
        price: f.price,
        type: 'roundtrip'
      }));
    } else {
      // Nếu không -> Tìm vé một chiều
      const rawFlights = await flightService.searchFlights(origin, destination, date);
      flights = rawFlights.map(f => ({
        airline: f.airline,
        departureTime: f.departureTime,
        returnTime: null,
        price: f.price,
        type: 'oneway'
      }));
    }
    
    res.json({ flights });
  } catch (error) {
    console.error('Search Flight Error:', error);
    res.status(500).json({ message: 'Lỗi khi tìm chuyến bay', error: error.message });
  }
});

// Tạo kế hoạch du lịch (Thủ công)
router.post('/', auth, async (req, res) => {
  try {
    const {
      title,
      description,
      tripDetails,
      startDate,
      endDate,
      destinations = [],
      budget = {},
      travelers = [],
      tags = [],
      isPublic = false,
      origin,
      transportMode,
      flightDetails
    } = req.body;

    if (!title || !startDate || !endDate) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc: title, startDate, endDate' });
    }

    const trip = new Trip({
      title,
      description,
      tripDetails,
      userId: req.userId,
      startDate,
      endDate,
      destinations,
      budget,
      travelers,
      tags,
      isPublic,
      origin,           // Lưu điểm xuất phát
      transportMode,    // Lưu loại phương tiện (flight/personal)
      flightDetails     // Lưu chi tiết vé
    });

    const saved = await trip.save();
    res.status(201).json({ message: 'Tạo kế hoạch thành công', trip: saved });
  } catch (error) {
    console.error('Create Trip Error:', error);
    res.status(500).json({ message: 'Lỗi server khi tạo kế hoạch', error: error.message });
  }
});

// Danh sách kế hoạch
router.get('/', auth, async (req, res) => {
  try {
    const trips = await Trip.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json({ trips });
  } catch (error) {
    console.error('List Trips Error:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách', error: error.message });
  }
});

// Chi tiết kế hoạch
router.get('/:id', auth, async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, userId: req.userId });
    if (!trip) {
      return res.status(404).json({ message: 'Không tìm thấy kế hoạch' });
    }
    res.json({ trip });
  } catch (error) {
    console.error('Get Trip Error:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy kế hoạch', error: error.message });
  }
});

// Cập nhật kế hoạch
router.put('/:id', auth, async (req, res) => {
  try {
    const updates = req.body || {};
    const updated = await Trip.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $set: updates },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ message: 'Không tìm thấy kế hoạch để cập nhật' });
    }
    res.json({ message: 'Cập nhật thành công', trip: updated });
  } catch (error) {
    console.error('Update Trip Error:', error);
    res.status(500).json({ message: 'Lỗi server khi cập nhật kế hoạch', error: error.message });
  }
});

// Xóa kế hoạch
router.delete('/:id', auth, async (req, res) => {
  try {
    const deleted = await Trip.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!deleted) {
      return res.status(404).json({ message: 'Không tìm thấy kế hoạch để xóa' });
    }
    res.json({ message: 'Xóa kế hoạch thành công' });
  } catch (error) {
    console.error('Delete Trip Error:', error);
    res.status(500).json({ message: 'Lỗi server khi xóa kế hoạch', error: error.message });
  }
});

// =========================================================================
// SMART TRIP BUILDER - Tạo trip từ AI assistant
// =========================================================================

router.post('/from-ai', auth, async (req, res) => {
  try {
    const { itineraryData } = req.body;
    
    if (!itineraryData) {
      return res.status(400).json({ message: 'Thiếu dữ liệu itinerary' });
    }

    const {
      title,
      description,
      startDate,
      endDate,
      budget,       // Tổng ngân sách hoặc object budget cũ
      costEstimate, // <--- QUAN TRỌNG: Dữ liệu chi tiết chi phí
      destinations,
      itinerary,    // <--- QUAN TRỌNG: Dữ liệu lịch trình chi tiết
      travelers = []
    } = itineraryData;

    if (!title || !startDate || !endDate) {
      return res.status(400).json({ 
        message: 'Thiếu thông tin bắt buộc: title, startDate, endDate' 
      });
    }

    // 1. Xử lý Destinations (Fallback nếu thiếu)
    const processedDestinations = [];
    if (destinations && destinations.length > 0) {
      processedDestinations.push(...destinations);
    } else if (itinerary && itinerary.length > 0) {
      const mainDestination = {
        name: itinerary[0]?.activities[0]?.location || 'Điểm đến',
        arrivalDate: startDate,
        departureDate: endDate,
        activities: []
      };
      processedDestinations.push(mainDestination);
    }

    // 2. Xử lý Budget Breakdown
    // Nếu budget là số thì coi là total, nếu là object thì lấy .total
    const totalBudget = (typeof budget === 'number') ? budget : (budget?.total || 0);
    
    const budgetBreakdown = {
      flights: costEstimate?.flights || 0,
      accommodation: costEstimate?.hotels || 0, // AI thường trả về key 'hotels'
      food: costEstimate?.food || 0,
      activities: costEstimate?.activities || 0,
      transport: costEstimate?.transport || 0,
      others: costEstimate?.others || 0
    };

    // 3. Tạo Trip
    const trip = new Trip({
      userId: req.userId,
      title: title || 'Chuyến đi được tạo bởi AI',
      description: description || 'Lịch trình được tạo tự động bởi AI Assistant',
      startDate,
      endDate,
      destinations: processedDestinations,
      
      // Lưu lịch trình chi tiết
      itinerary: itinerary || [],
      
      // Lưu budget kèm breakdown
      budget: { 
        total: totalBudget, 
        spent: 0, 
        currency: 'VND',
        breakdown: budgetBreakdown 
      },
      
      travelers: travelers.filter(t => t.name && t.name.trim() !== ''),
      status: 'planning',
      tags: ['ai-generated'],
      isPublic: false
    });

    const savedTrip = await trip.save();

    res.status(201).json({
      success: true,
      message: 'Đã lưu lịch trình vào Dashboard!',
      trip: savedTrip
    });

  } catch (error) {
    console.error('Create Trip from AI Error:', error);
    res.status(500).json({ 
      message: 'Lỗi khi lưu chuyến đi từ AI', 
      error: error.message 
    });
  }
});

module.exports = router;