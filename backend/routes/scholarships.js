const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../data/db');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const { scoreScholarship } = require('../ai-matching/scorer');

const router = express.Router();

// GET /api/scholarships
router.get('/', (req, res) => {
  const { search, category, course, gender, sort } = req.query;
  let list = [...db.scholarships];

  if (search) {
    const q = search.toLowerCase();
    list = list.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.provider.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
    );
  }
  if (category) list = list.filter((s) => s.categories.includes(category));
  if (course)   list = list.filter((s) => s.courses.includes(course));
  if (gender && gender !== 'All') list = list.filter((s) => s.gender === 'All' || s.gender === gender);

  if (sort === 'amount_desc') list.sort((a, b) => b.amount - a.amount);
  else if (sort === 'amount_asc')  list.sort((a, b) => a.amount - b.amount);
  else if (sort === 'deadline')    list.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  else if (sort === 'popular')     list.sort((a, b) => b.applicants - a.applicants);

  res.json(list);
});

// POST /api/scholarships/match
router.post('/match', (req, res) => {
  const { profile } = req.body;
  if (!profile) return res.status(400).json({ message: 'Profile is required' });

  const results = db.scholarships
    .map((s) => {
      const { score, reasons, missing } = scoreScholarship(s, profile);
      return { ...s, matchScore: score, matchReasons: reasons, missingCriteria: missing };
    })
    .filter((s) => s.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore);

  res.json(results);
});

// GET /api/scholarships/match/me
router.get('/match/me', authMiddleware, (req, res) => {
  const user = db.users.find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const p = user.profile || {};
  const profile = {
    percentage: p.marks || 0,
    familyIncome: p.annualIncome || Infinity,
    category: p.category || '',
    gender: p.gender || '',
    course: p.course || '',
    state: p.state || '',
    disability: p.disability || false,
  };

  const results = db.scholarships
    .map((s) => {
      const { score, reasons, missing } = scoreScholarship(s, profile);
      return { ...s, matchScore: score, matchReasons: reasons, missingCriteria: missing };
    })
    .filter((s) => s.missingCriteria.length === 0)
    .sort((a, b) => b.matchScore - a.matchScore);

  res.json(results);
});

// GET /api/scholarships/:id
router.get('/:id', (req, res) => {
  const scholarship = db.scholarships.find((s) => s.id === req.params.id);
  if (!scholarship) return res.status(404).json({ message: 'Scholarship not found' });
  res.json(scholarship);
});

// POST /api/scholarships
router.post('/', authMiddleware, adminOnly, (req, res) => {
  const scholarship = { id: uuidv4(), applicants: 0, createdAt: new Date().toISOString(), ...req.body };
  db.scholarships.push(scholarship);
  res.status(201).json(scholarship);
});

// PUT /api/scholarships/:id
router.put('/:id', authMiddleware, adminOnly, (req, res) => {
  const idx = db.scholarships.findIndex((s) => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Scholarship not found' });
  db.scholarships[idx] = { ...db.scholarships[idx], ...req.body, id: req.params.id };
  res.json(db.scholarships[idx]);
});

// DELETE /api/scholarships/:id
router.delete('/:id', authMiddleware, adminOnly, (req, res) => {
  const idx = db.scholarships.findIndex((s) => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Scholarship not found' });
  db.scholarships.splice(idx, 1);
  res.json({ message: 'Deleted successfully' });
});

module.exports = router;
