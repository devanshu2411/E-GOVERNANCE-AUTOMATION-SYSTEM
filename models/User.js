const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false  // never return password in queries by default
  },
  role: {
    type: String,
    enum: ['citizen', 'admin', 'officer'],
    default: 'citizen'
  },
  phone: { type: String, trim: true },
  aadhaar: { type: String, trim: true },  // masked in responses
  address: { type: String },
  isVerified: { type: Boolean, default: false },
  isActive:   { type: Boolean, default: true },
  lastLogin:  { type: Date }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Mask aadhaar in output
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  if (obj.aadhaar) obj.aadhaar = 'XXXX-XXXX-' + obj.aadhaar.slice(-4);
  return obj;
};

module.exports = mongoose.model('User', userSchema);
