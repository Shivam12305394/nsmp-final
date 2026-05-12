const mongoose = require('mongoose');

const fraudAlertSchema = new mongoose.Schema({
  studentName:   { type: String, required: true },
  studentId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  riskLevel:     { type: String, enum: ['high', 'medium', 'low'], required: true },
  issue:         { type: String, required: true },
  detail:        { type: String, required: true },
  status:        { type: String, enum: ['active', 'dismissed', 'blacklisted'], default: 'active' },
  aiExplanation: { type: String, default: '' },
  createdAt:     { type: Date, default: Date.now },
});

module.exports = mongoose.model('FraudAlert', fraudAlertSchema);
