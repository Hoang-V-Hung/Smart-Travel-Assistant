const express = require('express');
const auth = require('../middleware/auth');
const Trip = require('../models/Trip');

const router = express.Router();

// Tạo kế hoạch du lịch (Create Trip)
router.post('/', auth, async (req, res) => {
  try {
    const {
      title,
      description,
      startDate,
      endDate,
      destinations = [],
      budget = {},
      travelers = [],
      tags = [],
      isPublic = false
    } = req.body;

    if (!title || !startDate || !endDate) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc: title, startDate, endDate' });
    }

    const trip = new Trip({
      title,
      description,
      userId: req.userId,
      startDate,
      endDate,
      destinations,
      budget,
      travelers,
      tags,
      isPublic
    });

    const saved = await trip.save();
    res.status(201).json({ message: 'Tạo kế hoạch thành công', trip: saved });
  } catch (error) {
    console.error('Create Trip Error:', error);
    res.status(500).json({ message: 'Lỗi server khi tạo kế hoạch', error: error.message });
  }
});

// Danh sách kế hoạch của người dùng (List Trips)
router.get('/', auth, async (req, res) => {
  try {
    const trips = await Trip.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json({ trips });
  } catch (error) {
    console.error('List Trips Error:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách', error: error.message });
  }
});

// Chi tiết kế hoạch (Get Trip by id)
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

// Cập nhật kế hoạch (Update Trip)
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

// Xóa kế hoạch (Delete Trip)
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

module.exports = router;


