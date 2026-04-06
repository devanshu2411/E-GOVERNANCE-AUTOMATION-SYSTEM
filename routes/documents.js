const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const Document = require('../models/Document');
const ServiceRequest = require('../models/ServiceRequest');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// ─── POST /api/documents/upload ──────────────────────────────
router.post('/upload', protect, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const { documentType, requestId } = req.body;

    const doc = await Document.create({
      uploadedBy:      req.user._id,
      originalName:    req.file.originalname,
      fileName:        req.file.filename,
      fileType:        req.file.mimetype,
      fileSize:        req.file.size,
      filePath:        req.file.path,
      documentType:    documentType || 'Other',
      serviceRequest:  requestId || null
    });

    // Link document to service request if provided
    if (requestId) {
      await ServiceRequest.findByIdAndUpdate(requestId, {
        $addToSet: { documents: doc._id }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully.',
      data: {
        _id:          doc._id,
        originalName: doc.originalName,
        documentType: doc.documentType,
        fileSize:     doc.fileSize,
        fileType:     doc.fileType,
        url:          `/uploads/${doc.fileName}`,
        uploadedAt:   doc.createdAt
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/documents ─── list documents for current user ──
router.get('/', protect, async (req, res) => {
  try {
    const filter = req.user.role === 'citizen'
      ? { uploadedBy: req.user._id }
      : {};

    if (req.query.requestId) filter.serviceRequest = req.query.requestId;

    const docs = await Document.find(filter)
      .populate('uploadedBy', 'name email')
      .populate('serviceRequest', 'requestId serviceType')
      .sort({ createdAt: -1 });

    const formatted = docs.map(d => ({
      _id:            d._id,
      originalName:   d.originalName,
      documentType:   d.documentType,
      fileSize:       d.fileSize,
      fileType:       d.fileType,
      isVerified:     d.isVerified,
      url:            `/uploads/${d.fileName}`,
      uploadedBy:     d.uploadedBy,
      serviceRequest: d.serviceRequest,
      uploadedAt:     d.createdAt
    }));

    res.json({ success: true, total: docs.length, data: formatted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/documents/:id ───────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found.' });

    if (req.user.role === 'citizen' && doc.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, data: { ...doc.toObject(), url: `/uploads/${doc.fileName}` } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PUT /api/documents/:id/verify ─── admin verifies doc ────
router.put('/:id/verify', protect, authorize('admin', 'officer'), async (req, res) => {
  try {
    const doc = await Document.findByIdAndUpdate(
      req.params.id,
      { isVerified: true, verifiedBy: req.user._id, verifiedAt: new Date() },
      { new: true }
    );
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found.' });
    res.json({ success: true, message: 'Document verified.', data: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── DELETE /api/documents/:id ─── owner or admin ─────────────
router.delete('/:id', protect, async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found.' });

    if (req.user.role === 'citizen' && doc.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    // Delete file from disk
    if (fs.existsSync(doc.filePath)) fs.unlinkSync(doc.filePath);

    await doc.deleteOne();
    res.json({ success: true, message: 'Document deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
