// server/routes/destinationRoutes.js

const express = require('express');
const router = express.Router();
const geoapifyService = require('../services/geoapifyService');

/**
 * @route   GET /api/destinations/search
 * @desc    Tìm kiếm điểm đến
 * @access  Public
 */
router.get('/search', async (req, res) => {
  try {
    const { q, category , budget} = req.query;

    const destinations = await geoapifyService.searchAndCacheDestinations({
      query: q,
      category,
      budget,
    });
    
    // Frontend của bạn mong đợi một object có key là 'destinations'
    res.status(200).json({ destinations });

  } catch (error) {
    // Nếu lỗi đến từ axios (tức là từ Geoapify)
    if (error.response) {
      console.error('❌ Error from Geoapify API:', error.response.data);
      res.status(500).json({ 
        message: 'Lỗi từ dịch vụ bên ngoài.',
        details: error.response.data 
      });
    } else {
      // Các lỗi khác (ví dụ: lỗi logic trong code)
      console.error('❌ Error in destination search route:', error.message);
      res.status(500).json({ message: 'Lỗi máy chủ khi tìm kiếm điểm đến.' });
    }
}
});

module.exports = router;