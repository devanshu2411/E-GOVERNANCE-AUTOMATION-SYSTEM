const express = require('express');
const router = express.Router();
const User = require('../models/User');
const ServiceRequest = require('../models/ServiceRequest');
const { protect, authorize } = require('../middleware/auth');

// ─── GET /api/citizens ─── admin lists all citizens ───────────
router.get('/', protect, authorize('admin', 'officer'), async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip  = (page - 1) * limit;

    const filter = { role: 'citizen' };
    if (req.query.search) {
      filter.$or = [
        { name:  { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const [citizens, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter)
    ]);

    res.json({ success: true, total, page, pages: Math.ceil(total / limit), data: citizens });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/citizens/:id ────────────────────────────────────
router.get('/:id', protect, authorize('admin', 'officer'), async (req, res) => {
  try {
    const citizen = await User.findById(req.params.id);
    if (!citizen || citizen.role !== 'citizen') {
      return res.status(404).json({ success: false, message: 'Citizen not found.' });
    }

    // Also fetch their requests
    const requests = await ServiceRequest.find({ citizen: citizen._id })
      .select('requestId serviceType status priority createdAt')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({ success: true, data: { citizen, requests } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PUT /api/citizens/:id/toggle-active ─────────────────────
router.put('/:id/toggle-active', protect, authorize('admin'), async (req, res) => {
  try {
    const citizen = await User.findById(req.params.id);
    if (!citizen) return res.status(404).json({ success: false, message: 'User not found.' });
    citizen.isActive = !citizen.isActive;
    await citizen.save({ validateBeforeSave: false });
    res.json({ success: true, message: `Account ${citizen.isActive ? 'activated' : 'deactivated'}.`, data: citizen });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
