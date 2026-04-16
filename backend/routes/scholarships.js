const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../data/db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();

// GET /api/scholarships — public, all scholarships
router.get('/', (req, res) => {
  const { search, category, course, gender, sort } = req.query;
  let list = [...db.scholarships];

  if (search) {
    const q = search.toLowerCase();
    list = list.filter((s) => s.name.toLowerCase().includes(q) || s.provider.toLowerCase().includes(q) || s.description.toLowerCase().includes(q));
  }
  if (category) list = list.filter((s) => s.categories.includes(category));
  if (course) list = list.filter((s) => s.courses.includes(course));
  if (gender && gender !== 'All') list = list.filter((s) => s.gender === 'All' || s.gender === gender);

  if (sort === 'amount_desc') list.sort((a, b) => b.amount - a.amount);
  else if (sort === 'amount_asc') list.sort((a, b) => a.amount - b.amount);
  else if (sort === 'deadline') list.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  else if (sort === 'popular') list.sort((a, b) => b.applicants - a.applicants);

  res.json(list);
});

// GET /api/scholarships/match/me — AI match for logged-in student (MUST be before /:id)
router.get('/match/me', authMiddleware, (req, res) => {
  const user = db.users.find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const profile = user.profile || {};
  const matches = db.scholarships.map((s) => {
    let score = 0;
    const reasons = [];

    // Category (25 pts)
    if (profile.category && s.categories.includes(profile.category)) {
      score += 25;
      reasons.push(`Matches your ${profile.category} category`);
    }
    // Marks (20 pts)
    if (profile.marks && profile.marks >= s.minMarks) {
      score += 20;
      reasons.push(`Your ${profile.marks}% meets the ${s.minMarks}% requirement`);
      if (profile.marks >= s.minMarks + 10) { score += 8; reasons.push('Outstanding academic performance bonus'); }
    }
    // Income (20 pts)
    if (profile.annualIncome && profile.annualIncome <= s.maxIncome) {
      score += 20;
      reasons.push('Income within eligible range');
      if (profile.annualIncome <= s.maxIncome * 0.5) { score += 5; reasons.push('Lower income — higher priority'); }
    }
    // Course (15 pts)
    if (profile.course && s.courses.includes(profile.course)) {
      score += 15;
      reasons.push(`Matches your ${profile.course} course`);
    }
    // Gender (10 pts)
    if (s.gender === 'All' || (profile.gender && s.gender === profile.gender)) {
      score += 10;
      if (s.gender !== 'All') reasons.push('Gender-specific scholarship');
    }
    // Location (5 pts)
    if (s.location === 'All India' || (profile.state && s.location.toLowerCase().includes(profile.state.toLowerCase()))) {
      score += 5;
      if (s.location !== 'All India') reasons.push('Region-specific advantage');
    }
    // Disability (5 pts)
    if (s.disability && profile.disability) {
      score += 5;
      reasons.push('PwD scholarship — special eligibility');
    }

    return { ...s, matchScore: Math.min(score, 100), reasons };
  });

  const sorted = matches.filter((m) => m.matchScore > 0).sort((a, b) => b.matchScore - a.matchScore);
  res.json(sorted);
});

// GET /api/scholarships/:id
router.get('/:id', (req, res) => {
  const scholarship = db.scholarships.find((s) => s.id === req.params.id);
  if (!scholarship) return res.status(404).json({ message: 'Scholarship not found' });
  res.json(scholarship);
});

// POST /api/scholarships — admin only
router.post('/', authMiddleware, adminOnly, (req, res) => {
  const scholarship = { id: uuidv4(), applicants: 0, createdAt: new Date().toISOString(), ...req.body };
  db.scholarships.push(scholarship);
  res.status(201).json(scholarship);
});

// PUT /api/scholarships/:id — admin only
router.put('/:id', authMiddleware, adminOnly, (req, res) => {
  const idx = db.scholarships.findIndex((s) => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Scholarship not found' });
  db.scholarships[idx] = { ...db.scholarships[idx], ...req.body, id: req.params.id };
  res.json(db.scholarships[idx]);
});

// DELETE /api/scholarships/:id — admin only
router.delete('/:id', authMiddleware, adminOnly, (req, res) => {
  const idx = db.scholarships.findIndex((s) => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Scholarship not found' });
  db.scholarships.splice(idx, 1);
  res.json({ message: 'Deleted successfully' });
});

module.exports = router;
