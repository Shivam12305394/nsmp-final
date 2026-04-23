const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  studentId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  scholarshipId:{ type: mongoose.Schema.Types.ObjectId, ref: 'Scholarship', required: true },
  status:       { type: String, enum: ['pending','review','approved','rejected'], default: 'pending' },
  reviewNote:   { type: String, default: '' },
  appliedAt:    { type: Date, default: Date.now },
  updatedAt:    { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Application', applicationSchema);
