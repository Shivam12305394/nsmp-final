const express = require('express');
const db = require('../data/db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();

// ── NOTIFICATIONS ──
// GET /api/users/notifications
router.get('/notifications', authMiddleware, (req, res) => {
  const notifs = db.notifications
    .filter((n) => n.userId === req.user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(notifs);
});

// PATCH /api/users/notifications/:id/read
router.patch('/notifications/:id/read', authMiddleware, (req, res) => {
  const notif = db.notifications.find((n) => n.id === req.params.id && n.userId === req.user.id);
  if (!notif) return res.status(404).json({ message: 'Notification not found' });
  notif.read = true;
  res.json(notif);
});

// PATCH /api/users/notifications/read-all
router.patch('/notifications/read-all', authMiddleware, (req, res) => {
  db.notifications.filter((n) => n.userId === req.user.id).forEach((n) => { n.read = true; });
  res.json({ message: 'All marked as read' });
});

// ── ADMIN USER MANAGEMENT ──
// GET /api/users — admin: all students
router.get('/', authMiddleware, adminOnly, (req, res) => {
  const { search } = req.query;
  let students = db.users.filter((u) => u.role === 'student');
  if (search) {
    const q = search.toLowerCase();
    students = students.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }
  res.json(
    students.map(({ password: _, ...u }) => ({
      ...u,
      applicationCount: db.applications.filter((a) => a.studentId === u.id).length,
    }))
  );
});

// GET /api/users/analytics — admin analytics
router.get('/analytics', authMiddleware, adminOnly, (req, res) => {
  const apps = db.applications;
  const total = apps.length;
  const approved = apps.filter((a) => a.status === 'approved').length;
  const rejected = apps.filter((a) => a.status === 'rejected').length;
  const pending = apps.filter((a) => a.status === 'pending').length;
  const review = apps.filter((a) => a.status === 'review').length;

  // Monthly data (last 6 months)
  const monthly = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const month = d.toLocaleString('default', { month: 'short' });
    const year = d.getFullYear();
    const count = apps.filter((a) => {
      const ad = new Date(a.appliedAt);
      return ad.getMonth() === d.getMonth() && ad.getFullYear() === year;
    }).length;
    monthly.push({ month, count });
  }

  // Category breakdown
  const categories = {};
  db.users.filter((u) => u.role === 'student').forEach((u) => {
    const cat = u.profile?.category || 'Unknown';
    categories[cat] = (categories[cat] || 0) + 1;
  });

  res.json({
    totalApplications: total,
    approved,
    rejected,
    pending,
    review,
    approvalRate: total > 0 ? Math.round((approved / total) * 100) : 0,
    totalStudents: db.users.filter((u) => u.role === 'student').length,
    totalScholarships: db.scholarships.length,
    totalPoolAmount: db.scholarships.reduce((sum, s) => sum + s.amount, 0),
    monthly,
    categories,
    topScholarships: db.scholarships
      .sort((a, b) => b.applicants - a.applicants)
      .slice(0, 5)
      .map((s) => ({ id: s.id, name: s.name, applicants: s.applicants, amount: s.amount })),
  });
});

module.exports = router;
