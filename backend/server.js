require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const scholarshipRoutes = require('./routes/scholarships');
const applicationRoutes = require('./routes/applications');
const userRoutes = require('./routes/users');
const aiRoutes = require('./routes/ai');

const app = express();
const PORT = process.env.PORT || 5000;

// ── MIDDLEWARE ──
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
}));
app.use(express.json());

// ── ROUTES ──
app.use('/api/auth', authRoutes);
app.use('/api/scholarships', scholarshipRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ai', aiRoutes);

// ── HEALTH CHECK ──
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'NSMP Backend is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// ── 404 HANDLER ──
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.path} not found` });
});

// ── ERROR HANDLER ──
app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

app.listen(PORT, () => {
  console.log(`\n🎓 NSMP Backend running at http://localhost:${PORT}`);
  console.log(`📊 API Docs: http://localhost:${PORT}/api/health`);
  console.log(`\n🔐 Admin credentials: admin@nsmp.gov.in / admin123\n`);
});
