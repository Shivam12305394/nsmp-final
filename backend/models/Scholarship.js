const mongoose = require('mongoose');

const scholarshipSchema = new mongoose.Schema({
  source:      { type: String, default: 'Government' },
  name:        { type: String, required: true, trim: true },
  provider:    { type: String, required: true, trim: true },
  amount:      { type: Number, required: true },
  deadline:    { type: String, required: true },
  minMarks:    { type: Number, default: 0 },
  maxIncome:   { type: Number, default: 9999999 },
  categories:  [{ type: String }],
  courses:     [{ type: String }],
  gender:      { type: String, default: 'All' },
  location:    { type: String, default: 'All India' },
  disability:  { type: Boolean, default: false },
  description: { type: String, default: '' },
  eligibility: { type: String, default: '' },
  benefits:    { type: String, default: '' },
  applicants:  { type: Number, default: 0 },
  featured:    { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Scholarship', scholarshipSchema);
