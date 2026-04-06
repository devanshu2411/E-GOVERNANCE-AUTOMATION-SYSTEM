const mongoose = require('mongoose');

const workflowStageSchema = new mongoose.Schema({
  stage:     { type: String, required: true },
  status:    { type: String, enum: ['pending', 'active', 'done', 'skipped'], default: 'pending' },
  officer:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  remarks:   { type: String },
  timestamp: { type: Date }
}, { _id: false });

const serviceRequestSchema = new mongoose.Schema({
  requestId: {
    type: String,
    unique: true
  },
  citizen: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  serviceType: {
    type: String,
    enum: [
      'Birth Certificate',
      'Property Tax Payment',
      'Trade License',
      'Water Connection',
      'Building Permission',
      'Grievance Submission',
      'Death Certificate',
      'Marriage Certificate'
    ],
    required: true
  },
  priority: {
    type: String,
    enum: ['normal', 'high', 'urgent'],
    default: 'normal'
  },
  status: {
    type: String,
    enum: ['submitted', 'in_review', 'approved', 'rejected', 'closed'],
    default: 'submitted'
  },
  description: { type: String },
  documents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],
  workflow: {
    type: [workflowStageSchema],
    default: [
      { stage: 'Submitted',    status: 'done' },
      { stage: 'Verification', status: 'active' },
      { stage: 'Approval',     status: 'pending' },
      { stage: 'Dispatch',     status: 'pending' },
      { stage: 'Closed',       status: 'pending' }
    ]
  },
  assignedOfficer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  remarks:         { type: String },
  resolvedAt:      { type: Date }
}, { timestamps: true });

// Auto-generate requestId like REQ-20260001
serviceRequestSchema.pre('save', async function(next) {
  if (!this.requestId) {
    const count = await this.constructor.countDocuments();
    const year = new Date().getFullYear();
    this.requestId = `REQ-${year}${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);
