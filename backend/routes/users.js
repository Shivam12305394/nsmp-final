const express      = require('express');
const User         = require('../models/User');
const Application  = require('../models/Application');
const Scholarship  = require('../models/Scholarship');
const Notification = require('../models/Notification');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();

// GET /api/users/notifications
router.get('/notifications', authMiddleware, async (req, res) => {
  try {
    const notifs = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 }).lean();
    res.json(notifs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/users/notifications/read-all  ← before /:id/read
router.patch('/notifications/read-all', authMiddleware, async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user.id }, { read: true });
    res.json({ message: 'All marked as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/users/notifications/:id/read
router.patch('/notifications/:id/read', authMiddleware, async (req, res) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { read: true },
      { new: true }
    );
    if (!notif) return res.status(404).json({ message: 'Notification not found' });
    res.json(notif);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users (admin)
router.get('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { search } = req.query;
    const query = { role: 'student' };
    if (search) {
      const q = new RegExp(search, 'i');
      query.$or = [{ name: q }, { email: q }];
    }
    const students = await User.find(query).select('-password').lean();
    const withCounts = await Promise.all(students.map(async u => ({
      ...u,
      applicationCount: await Application.countDocuments({ studentId: u._id }),
    })));
    res.json(withCounts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/analytics (admin)
router.get('/analytics', authMiddleware, adminOnly, async (req, res) => {
  try {
    const [total, approved, rejected, pending, review] = await Promise.all([
      Application.countDocuments(),
      Application.countDocuments({ status: 'approved' }),
      Application.countDocuments({ status: 'rejected' }),
      Application.countDocuments({ status: 'pending' }),
      Application.countDocuments({ status: 'review' }),
    ]);

    // Monthly data (last 6 months)
    const monthly = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end   = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const count = await Application.countDocuments({ appliedAt: { $gte: start, $lt: end } });
      monthly.push({ month: d.toLocaleString('default', { month: 'short' }), count });
    }

    // Category breakdown
    const students = await User.find({ role: 'student' }).select('profile.category').lean();
    const categories = {};
    students.forEach(u => {
      const cat = u.profile?.category || 'Unknown';
      categories[cat] = (categories[cat] || 0) + 1;
    });

    const totalStudents = await User.countDocuments({ role: 'student' });
    const scholarships  = await Scholarship.find().sort({ applicants: -1 }).limit(5).lean();
    const totalPool     = await Scholarship.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]);

    res.json({
      totalApplications: total, approved, rejected, pending, review,
      approvalRate: total > 0 ? Math.round((approved / total) * 100) : 0,
      totalStudents,
      totalScholarships: await Scholarship.countDocuments(),
      totalPoolAmount: totalPool[0]?.total || 0,
      monthly, categories,
      topScholarships: scholarships.map(s => ({ id: s._id, name: s.name, applicants: s.applicants, amount: s.amount })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
