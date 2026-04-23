const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  phone: { type: String, default: '' },
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
  profile: {
    marks: { type: Number, default: 0 },
    cgpa: { type: Number, default: 0 },
    annualIncome: { type: Number, default: 0 },
    category: { type: String, default: '' },
    course: { type: String, default: '' },
    gender: { type: String, default: '' },
    state: { type: String, default: '' },
    disability: { type: Boolean, default: false },
    institution: { type: String, default: '' },
    address: { type: String, default: '' }
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
