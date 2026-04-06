const express = require('express');
const router = express.Router();
const ServiceRequest = require('../models/ServiceRequest');
const { protect, authorize } = require('../middleware/auth');

// ─── GET /api/requests ─── citizen sees own, admin sees all ──
router.get('/', protect, async (req, res) => {
  try {
    const filter = req.user.role === 'citizen' ? { citizen: req.user._id } : {};

    // Query params for filtering
    if (req.query.status)      filter.status = req.query.status;
    if (req.query.serviceType) filter.serviceType = req.query.serviceType;
    if (req.query.priority)    filter.priority = req.query.priority;

    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip  = (page - 1) * limit;

    const [requests, total] = await Promise.all([
      ServiceRequest.find(filter)
        .populate('citizen', 'name email phone')
        .populate('documents', 'originalName documentType isVerified')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      ServiceRequest.countDocuments(filter)
    ]);

    res.json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: requests
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/requests/stats ─── dashboard summary ───────────
router.get('/stats', protect, authorize('admin', 'officer'), async (req, res) => {
  try {
    const [total, pending, approved, inReview, rejected] = await Promise.all([
      ServiceRequest.countDocuments(),
      ServiceRequest.countDocuments({ status: 'submitted' }),
      ServiceRequest.countDocuments({ status: 'approved' }),
      ServiceRequest.countDocuments({ status: 'in_review' }),
      ServiceRequest.countDocuments({ status: 'rejected' })
    ]);

    // Requests by service type
    const byService = await ServiceRequest.aggregate([
      { $group: { _id: '$serviceType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({ success: true, data: { total, pending, approved, inReview, rejected, byService } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/requests/:id ────────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const request = await ServiceRequest.findById(req.params.id)
      .populate('citizen', 'name email phone address')
      .populate('documents')
      .populate('assignedOfficer', 'name email');

    if (!request) return res.status(404).json({ success: false, message: 'Request not found.' });

    // Citizens can only view their own
    if (req.user.role === 'citizen' && request.citizen._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, data: request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/requests ── create new request ─────────────────
router.post('/', protect, async (req, res) => {
  try {
    const { serviceType, priority, description } = req.body;

    const request = await ServiceRequest.create({
      citizen: req.user._id,
      serviceType,
      priority: priority || 'normal',
      description
    });

    res.status(201).json({ success: true, message: 'Service request submitted successfully.', data: request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PUT /api/requests/:id/status ─── admin updates status ───
router.put('/:id/status', protect, authorize('admin', 'officer'), async (req, res) => {
  try {
    const { status, remarks } = req.body;
    const validStatuses = ['submitted', 'in_review', 'approved', 'rejected', 'closed'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }

    const request = await ServiceRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found.' });

    request.status = status;
    if (remarks) request.remarks = remarks;
    if (status === 'closed' || status === 'approved') request.resolvedAt = new Date();

    // Advance workflow
    const stageMap = {
      'submitted': 0, 'in_review': 1, 'approved': 2, 'closed': 4
    };
    const stageIdx = stageMap[status];
    if (stageIdx !== undefined) {
      request.workflow.forEach((s, i) => {
        if (i < stageIdx) s.status = 'done';
        else if (i === stageIdx) { s.status = 'active'; s.timestamp = new Date(); }
        else s.status = 'pending';
      });
    }

    await request.save();
    res.json({ success: true, message: `Request status updated to '${status}'.`, data: request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── DELETE /api/requests/:id ─── admin only ──────────────────
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const request = await ServiceRequest.findByIdAndDelete(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found.' });
    res.json({ success: true, message: 'Request deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
