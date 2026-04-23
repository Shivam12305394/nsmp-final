const express      = require('express');
const Application  = require('../models/Application');
const Scholarship  = require('../models/Scholarship');
const Notification = require('../models/Notification');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();

// GET /api/applications/my
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const apps = await Application.find({ studentId: req.user.id })
      .populate('scholarshipId')
      .sort({ appliedAt: -1 })
      .lean();
    // Rename scholarshipId -> scholarship for frontend compatibility
    res.json(apps.map(a => ({ 
      ...a, 
      id: a._id,
      scholarship: a.scholarshipId, 
      scholarshipId: a.scholarshipId?._id 
    })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/applications (admin)
router.get('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { status, search } = req.query;
    const query = {};
    if (status && status !== 'all') query.status = status;

    let apps = await Application.find(query)
      .populate('scholarshipId')
      .populate('studentId', '-password')
      .sort({ appliedAt: -1 })
      .lean();

    if (search) {
      const q = search.toLowerCase();
      apps = apps.filter(a =>
        a.studentId?.name?.toLowerCase().includes(q) ||
        a.studentId?.email?.toLowerCase().includes(q)
      );
    }

    res.json(apps.map(a => ({
      ...a,
      id: a._id,
      scholarship: a.scholarshipId,
      student: a.studentId,
      scholarshipId: a.scholarshipId?._id,
      studentId: a.studentId?._id,
    })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/applications
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { scholarshipId } = req.body;
    console.log(`[APPLICATION DEBUG] Received application request from user ${req.user.id} for scholarship ${scholarshipId}`);
    
    if (!scholarshipId) {
      console.log(`[APPLICATION DEBUG] Missing scholarshipId`);
      return res.status(400).json({ message: 'scholarshipId is required' });
    }

    const scholarship = await Scholarship.findById(scholarshipId);
    if (!scholarship) {
      console.log(`[APPLICATION DEBUG] Scholarship not found: ${scholarshipId}`);
      return res.status(404).json({ message: 'Scholarship not found' });
    }

    const existing = await Application.findOne({ studentId: req.user.id, scholarshipId });
    if (existing) {
      console.log(`[APPLICATION DEBUG] User already applied: ${req.user.id}`);
      return res.status(409).json({ message: 'Already applied to this scholarship' });
    }

    const app = await Application.create({ studentId: req.user.id, scholarshipId });
    console.log(`[APPLICATION DEBUG] Application created: ${app._id}`);

    await Scholarship.findByIdAndUpdate(scholarshipId, { $inc: { applicants: 1 } });
    console.log(`[APPLICATION DEBUG] Updated applicant count for scholarship: ${scholarshipId}`);

    await Notification.create({
      userId: req.user.id,
      title: 'Application Submitted ✅',
      message: `Your application for "${scholarship.name}" has been submitted successfully.`,
      type: 'success',
    });
    console.log(`[APPLICATION DEBUG] Notification created for user: ${req.user.id}`);

    res.status(201).json({ ...app.toObject(), id: app._id, scholarship });
  } catch (err) {
    console.error(`[APPLICATION DEBUG] Error in application process: ${err.message}`);
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/applications/:id/status (admin)
router.patch('/:id/status', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { status, reviewNote } = req.body;
    const validStatuses = ['pending', 'review', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) return res.status(400).json({ message: 'Invalid status' });

    const app = await Application.findByIdAndUpdate(
      req.params.id,
      { status, reviewNote: reviewNote || '', updatedAt: new Date() },
      { new: true }
    ).populate('scholarshipId');
    if (!app) return res.status(404).json({ message: 'Application not found' });

    const msgs = {
      approved: `🎉 Congratulations! Your application for "${app.scholarshipId?.name}" has been APPROVED!`,
      rejected: `Your application for "${app.scholarshipId?.name}" was not selected this time.`,
      review:   `Your application for "${app.scholarshipId?.name}" is now under review.`,
      pending:  `Your application for "${app.scholarshipId?.name}" has been moved back to pending.`,
    };
    await Notification.create({
      userId: app.studentId,
      title: `Application ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: msgs[status],
      type: status === 'approved' ? 'success' : status === 'rejected' ? 'danger' : 'info',
    });

    res.json({ ...app.toObject(), id: app._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
