const mongoose = require('mongoose');

const scholarshipSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  amount: Number,
  eligibility: {
    minMarks: Number,
    minIncome: Number,
    category: String,
    course: [String],
    gender: String,
    state: [String],
    disability: Boolean
  },
  deadline: Date,
  link: String,
  image: String,
  ministry: String
});

module.exports = mongoose.model('Scholarship', scholarshipSchema);
