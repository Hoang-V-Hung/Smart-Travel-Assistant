// fileName: openstreetmapRoutes.js
// Routes cho OpenStreetMap API - HOÀN TOÀN MIỄN PHÍ
const express = require('express');
const router = express.Router();
const {
  searchNearby,
  searchByText,
  autocomplete,
  getPlaceDetails,
} = require('../services/openstreetmapService');

// --- Autocomplete ---
router.get('/autocomplete', async (req, res) => {
  try {
    const q = req.query.q;
    if (!q) return res.status(400).json({ msg: 'Thiếu query' });
    const results = await autocomplete(q);
    res.set('Cache-Control', 'no-store');
    res.json(results);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// --- Search places by type using coordinates ---
router.get('/nearby/:type', async (req, res) => {
  try {
    const type = req.params.type; // hotels/restaurants/attractions
    const { lat, lng, radius = 2000 } = req.query;
    
    console.log('🔍 OSM search:', { type, lat, lng, radius });
    
    if (!lat || !lng) {
      return res.status(400).json({ msg: 'Thiếu lat/lng' });
    }

    const results = await searchNearby(parseFloat(lat), parseFloat(lng), type, parseInt(radius));
    
    console.log('✅ Found places:', results.length);
    
    res.set('Cache-Control', 'no-store');
    res.json(results);
  } catch (err) {
    console.error('❌ Search error:', err.message);
    res.status(500).json({ msg: err.message });
  }
});

// --- Search places by text query ---
router.get('/search/:type', async (req, res) => {
  try {
    const type = req.params.type;
    const { q } = req.query;
    
    if (!q) return res.status(400).json({ msg: 'Thiếu query' });

    const results = await searchByText(q, type);
    
    res.set('Cache-Control', 'no-store');
    res.json(results);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// --- Get place details ---
router.get('/details/:placeId', async (req, res) => {
  try {
    const { placeId } = req.params;
    const details = await getPlaceDetails(placeId);
    
    res.set('Cache-Control', 'no-store');
    res.json(details);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;

