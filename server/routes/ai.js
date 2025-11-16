const express = require('express');
const auth = require('../middleware/auth');
const openaiService = require('../services/openai');
const flightService = require('../services/flightapi'); 
const router = express.Router();

// =========================================================================
// CÁC ROUTE CŨ CỦA BẠN (GIỮ NGUYÊN)
// =========================================================================

// AI Travel Planning - Tạo lịch trình du lịch thông minh
router.post('/plan-trip', auth, async (req, res) => {
  try {
    const { 
      destination, 
      duration, 
      budget, 
      interests = [], 
      travelStyle, 
      groupSize,
      startDate,
      specialRequirements = []
    } = req.body;
    
    const plan = await openaiService.generateTripPlan({
      destination,
      duration,
      budget,
      interests,
      travelStyle,
      groupSize,
      startDate,
      specialRequirements
    });
    
    res.json({
      success: true,
      message: 'Tạo lịch trình thành công',
      plan: plan.plan,
      usage: plan.usage,
      metadata: {
        destination,
        duration,
        budget,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error generating trip plan:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi khi tạo lịch trình', 
      error: error.message 
    });
  }
});

// AI Travel Recommendations - Gợi ý điểm đến
router.post('/recommendations', auth, async (req, res) => {
  try {
    const { 
      preferences = [], 
      budget, 
      duration, 
      season,
      previousDestinations = [],
      travelStyle = 'relaxed'
    } = req.body;
    
    const recommendations = await openaiService.recommendDestinations({
      preferences,
      budget,
      duration,
      season,
      previousDestinations,
      travelStyle
    });
    
    res.json({
      success: true,
      message: 'Gợi ý điểm đến thành công',
      recommendations: recommendations.recommendations,
      usage: recommendations.usage,
      metadata: {
        preferences,
        budget,
        duration,
        season,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi khi tạo gợi ý', 
      error: error.message 
    });
  }
});

// Sinh nội dung du lịch (bài viết, mô tả, gợi ý)
router.post('/generate-content', auth, async (req, res) => {
    try {
        const { 
          type,
          topic,
          destination,
          length = 'medium',
          style = 'informative',
          language = 'vi'
        } = req.body;
        
        const content = await openaiService.generateContent({
          type,
          topic,
          destination,
          length,
          style,
          language
        });
        
        res.json({
          success: true,
          message: 'Sinh nội dung thành công',
          content: content.content,
          usage: content.usage,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error generating content:', error);
        res.status(500).json({ 
          success: false,
          message: 'Lỗi khi sinh nội dung', 
          error: error.message 
        });
      }
});

// =========================================================================
// ROUTE /chat ĐÃ ĐƯỢC NÂNG CẤP ĐỂ HỖ TRỢ CẢ KHỨ HỒI
// =========================================================================
router.post('/chat', auth, async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;
    
    // Bước 1: Phân tích ý định người dùng (có thể bao gồm cả ngày về)
    const intent = await openaiService.extractFlightInfo(message);

    let response;
    
    // Bước 2: Xử lý theo ý định
    if (intent.isFlightQuery && intent.origin && intent.destination && intent.date) {
      
      // TRƯỜNG HỢP 1: TÌM KIẾM KHỨ HỒI (nếu có `returnDate`)
      if (intent.returnDate) {
        const roundTripData = await flightService.searchRoundTripFlights(
          intent.origin,
          intent.destination,
          intent.date,
          intent.returnDate
        );
        // Gọi hàm chat được thiết kế riêng cho dữ liệu khứ hồi
        response = await openaiService.chatWithRoundTripContext(
            message, 
            conversationHistory, 
            roundTripData
        );

      // TRƯỜNG HỢP 2: TÌM KIẾM MỘT CHIỀU (nếu không có `returnDate`)
      } else {
        const flightData = await flightService.searchFlights(
          intent.origin,
          intent.destination,
          intent.date
        );
        // Gọi hàm chat cho dữ liệu một chiều như cũ
        response = await openaiService.chatWithFlightContext(
            message, 
            conversationHistory, 
            flightData
        );
      }

    // TRƯỜNG HỢP 3: CHAT THÔNG THƯỜNG (nếu không phải là tìm chuyến bay)
    } else {
      response = await openaiService.chat(message, conversationHistory);
    }
    
    // Bước 3: Trả về kết quả
    res.json({
      success: true,
      message: 'Phản hồi AI thành công',
      response: response.response,
      usage: response.usage,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in AI chat:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi khi xử lý tin nhắn', 
      error: error.message 
    });
  }
});


module.exports = router;