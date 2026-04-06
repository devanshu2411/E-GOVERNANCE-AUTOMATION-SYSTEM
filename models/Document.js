const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  serviceRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceRequest'
  },
  originalName: { type: String, required: true },
  fileName:     { type: String, required: true },  // stored filename on disk
  fileType:     { type: String },                  // MIME type
  fileSize:     { type: Number },                  // bytes
  filePath:     { type: String, required: true },
  documentType: {
    type: String,
    enum: [
      'Aadhaar Card',
      'PAN Card',
      'Proof of Address',
      'Birth Proof',
      'Property Documents',
      'Application Form',
      'Other'
    ],
    default: 'Other'
  },
  isVerified: { type: Boolean, default: false },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Document', documentSchema);
