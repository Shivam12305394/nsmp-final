require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const mongoose = require('mongoose');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── MIDDLEWARE ──
app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:3002'], credentials: true }));
app.use(express.json());

// ── ROUTES ──
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/scholarships', require('./routes/scholarships'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/users',        require('./routes/users'));
app.use('/api/ai',           require('./routes/ai'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }));

app.use((req, res) => res.status(404).json({ message: `Route ${req.method} ${req.path} not found` }));
app.use((err, req, res, _next) => { console.error(err.stack); res.status(500).json({ message: 'Internal Server Error', error: err.message }); });

// ── CONNECT MONGODB THEN START ──
async function start() {
  try {
await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Atlas connected');
    console.log('📧 EMAIL_CONFIG:', !!process.env.EMAIL_USER ? '✅ SET' : '❌ MISSING');
    console.log('📧 BREVO_CONFIG:', !!process.env.BREVO_USER ? '✅ SET' : '❌ MISSING');
    await seedDatabase();
    app.listen(PORT, () => {
      console.log(`\n🎓 NSMP Backend running at http://localhost:${PORT}`);
      console.log(`🔐 Admin: admin@nsmp.gov.in / admin123\n`);
    });
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  }
}

async function seedDatabase() {
  const bcrypt = require('bcryptjs');
  const User         = require('./models/User');
  const Scholarship  = require('./models/Scholarship');
  const data         = require('./data/data.json');

  // Seed admin
  const adminExists = await User.findOne({ email: 'admin@nsmp.gov.in' });
  if (!adminExists) {
    await User.create({
      name: 'Admin User',
      email: 'admin@nsmp.gov.in',
      password: await bcrypt.hash('admin123', 10),
      role: 'admin',
    });
    console.log('👤 Admin seeded');
  }

  // Seed scholarships from data.json (only if DB is empty)
  const schCount = await Scholarship.countDocuments();
  if (schCount === 0 && data.scholarships?.length) {
    const scholarships = data.scholarships.map(s => ({
      source: s.source, name: s.name, provider: s.provider,
      amount: s.amount, deadline: s.deadline, minMarks: s.minMarks || 0,
      maxIncome: s.maxIncome || 9999999, categories: s.categories || [],
      courses: s.courses || [], gender: s.gender || 'All',
      location: s.location || 'All India', disability: s.disability || false,
      description: s.description || '', eligibility: s.eligibility || '',
      benefits: s.benefits || '', applicants: s.applicants || 0,
      featured: s.featured || false,
    }));
    await Scholarship.insertMany(scholarships);
    console.log(`🎓 ${scholarships.length} scholarships seeded`);
  }
}

start();
