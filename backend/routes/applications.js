const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../data/db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();

// GET /api/applications/my — student's own applications
router.get('/my', authMiddleware, (req, res) => {
  const apps = db.applications
    .filter((a) => a.studentId === req.user.id)
    .map((a) => {
      const scholarship = db.scholarships.find((s) => s.id === a.scholarshipId);
      return { ...a, scholarship };
    });
  res.json(apps);
});

// GET /api/applications — admin: all applications
router.get('/', authMiddleware, adminOnly, (req, res) => {
  const { status, search } = req.query;
  let apps = db.applications.map((a) => {
    const scholarship = db.scholarships.find((s) => s.id === a.scholarshipId);
    const student = db.users.find((u) => u.id === a.studentId);
    const { password: _, ...safeStudent } = student || {};
    return { ...a, scholarship, student: safeStudent };
  });

  if (status && status !== 'all') apps = apps.filter((a) => a.status === status);
  if (search) {
    const q = search.toLowerCase();
    apps = apps.filter((a) => a.student?.name?.toLowerCase().includes(q) || a.student?.email?.toLowerCase().includes(q));
  }

  res.json(apps);
});

// POST /api/applications — student applies
router.post('/', authMiddleware, (req, res) => {
  const { scholarshipId } = req.body;
  if (!scholarshipId) return res.status(400).json({ message: 'scholarshipId is required' });

  const scholarship = db.scholarships.find((s) => s.id === scholarshipId);
  if (!scholarship) return res.status(404).json({ message: 'Scholarship not found' });

  const existing = db.applications.find((a) => a.studentId === req.user.id && a.scholarshipId === scholarshipId);
  if (existing) return res.status(409).json({ message: 'Already applied to this scholarship' });

  const app = {
    id: uuidv4(),
    studentId: req.user.id,
    scholarshipId,
    status: 'pending',
    reviewNote: '',
    appliedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.applications.push(app);
  scholarship.applicants += 1;

  // Notification
  db.notifications.push({
    id: uuidv4(),
    userId: req.user.id,
    title: 'Application Submitted ✅',
    message: `Your application for "${scholarship.name}" has been submitted successfully.`,
    type: 'success',
    read: false,
    createdAt: new Date().toISOString(),
  });

  res.status(201).json({ ...app, scholarship });
});

// PATCH /api/applications/:id/status — admin updates status
router.patch('/:id/status', authMiddleware, adminOnly, (req, res) => {
  const { status, reviewNote } = req.body;
  const validStatuses = ['pending', 'review', 'approved', 'rejected'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  const app = db.applications.find((a) => a.id === req.params.id);
  if (!app) return res.status(404).json({ message: 'Application not found' });

  app.status = status;
  if (reviewNote !== undefined) app.reviewNote = reviewNote;
  app.updatedAt = new Date().toISOString();

  // Notify student
  const scholarship = db.scholarships.find((s) => s.id === app.scholarshipId);
  const statusMessages = {
    approved: `🎉 Congratulations! Your application for "${scholarship?.name}" has been APPROVED!`,
    rejected: `Your application for "${scholarship?.name}" was not selected this time.`,
    review: `Your application for "${scholarship?.name}" is now under review.`,
    pending: `Your application for "${scholarship?.name}" has been moved back to pending.`,
  };
  db.notifications.push({
    id: uuidv4(),
    userId: app.studentId,
    title: `Application ${status.charAt(0).toUpperCase() + status.slice(1)}`,
    message: statusMessages[status],
    type: status === 'approved' ? 'success' : status === 'rejected' ? 'danger' : 'info',
    read: false,
    createdAt: new Date().toISOString(),
  });

  res.json(app);
});

module.exports = router;
