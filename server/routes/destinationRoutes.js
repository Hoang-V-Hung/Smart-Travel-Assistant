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
    const { q, category } = req.query;

    const destinations = await geoapifyService.searchAndCacheDestinations({
      query: q,
      category,
    });
    
    // Frontend của bạn mong đợi một object có key là 'destinations'
    res.status(200).json({ destinations });

  } catch (error) {
    console.error('❌ Error in destination search route:', error.message);
    res.status(500).json({ message: 'Lỗi máy chủ khi tìm kiếm điểm đến.' });
  }
});

module.exports = router;