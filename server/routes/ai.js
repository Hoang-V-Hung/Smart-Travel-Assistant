const express = require('express');
const auth = require('../middleware/auth');
const openaiService = require('../services/openai');
const router = express.Router();

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

// AI Travel Assistant - Chat với AI
router.post('/chat', auth, async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;
    
    const response = await openaiService.chat(message, conversationHistory);
    
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

// Sinh nội dung du lịch (bài viết, mô tả, gợi ý)
router.post('/generate-content', auth, async (req, res) => {
  try {
    const { 
      type, // 'article', 'description', 'recommendation', 'review'
      topic,
      destination,
      length = 'medium', // 'short', 'medium', 'long'
      style = 'informative', // 'informative', 'casual', 'professional'
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

module.exports = router;
