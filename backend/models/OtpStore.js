const mongoose = require('mongoose');

const otpStoreSchema = new mongoose.Schema({
  email:           { type: String, required: true, unique: true, lowercase: true, trim: true },
  otp:             { type: String, required: true },
  name:            { type: String }, // Optional for non-registration flows
  password:        { type: String }, // Optional for non-registration flows
  phone:           { type: String, default: '' },
  expiresAt:       { type: Date, required: true },
  lastRequestedAt: { type: Date, default: Date.now },
});

// Auto-delete expired documents
otpStoreSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('OtpStore', otpStoreSchema);
