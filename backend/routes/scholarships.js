const express      = require('express');
const Scholarship  = require('../models/Scholarship');
const User         = require('../models/User');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const { scoreScholarship } = require('../ai-matching/scorer');

const router = express.Router();

// GET /api/scholarships
router.get('/', async (req, res) => {
  try {
    const { search, category, course, gender, sort } = req.query;
    const query = {};
    if (search) {
      const q = new RegExp(search, 'i');
      query.$or = [{ name: q }, { provider: q }, { description: q }];
    }
    if (category) query.categories = category;
    if (course)   query.courses    = course;
    if (gender && gender !== 'All') query.$or = [{ gender: 'All' }, { gender: gender }];

    let list = await Scholarship.find(query).lean();

    if (sort === 'amount_desc') list.sort((a, b) => b.amount - a.amount);
    else if (sort === 'amount_asc')  list.sort((a, b) => a.amount - b.amount);
    else if (sort === 'deadline')    list.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    else if (sort === 'popular')     list.sort((a, b) => b.applicants - a.applicants);

    res.json(list.map(s => ({ ...s, id: s._id })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/scholarships/match/me  ← must be before /:id
router.get('/match/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    const p = user.profile || {};
    const profile = {
      percentage:   p.marks || 0,
      familyIncome: p.annualIncome || Infinity,
      category:     p.category || '',
      gender:       p.gender || '',
      course:       p.course || '',
      state:        p.state || '',
      disability:   p.disability || false,
    };

    const all = await Scholarship.find().lean();
    const results = all
      .map(s => { const { score, reasons, missing } = scoreScholarship(s, profile); return { ...s, id: s._id, matchScore: score, matchReasons: reasons, missingCriteria: missing }; })
      .filter(s => s.missingCriteria.length === 0)
      .sort((a, b) => b.matchScore - a.matchScore);

    res.json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/scholarships/:id
router.get('/:id', async (req, res) => {
  try {
    const s = await Scholarship.findById(req.params.id).lean();
    if (!s) return res.status(404).json({ message: 'Scholarship not found' });
    res.json({ ...s, id: s._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/scholarships (admin)
router.post('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const s = await Scholarship.create(req.body);
    res.status(201).json({ ...s.toObject(), id: s._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/scholarships/:id (admin)
router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const s = await Scholarship.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!s) return res.status(404).json({ message: 'Scholarship not found' });
    res.json({ ...s.toObject(), id: s._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/scholarships/:id (admin)
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const s = await Scholarship.findByIdAndDelete(req.params.id);
    if (!s) return res.status(404).json({ message: 'Scholarship not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
