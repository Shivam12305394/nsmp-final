const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:       { type: String, required: true },
  size:       { type: String, required: true },
  mimeType:   { type: String, required: true },
  filePath:   { type: String, required: true },
  docType:    { type: String, default: 'other' },
  status:     { type: String, enum: ['pending', 'verified'], default: 'pending' },
  uploadedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Document', documentSchema);
