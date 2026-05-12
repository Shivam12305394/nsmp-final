const express     = require('express');
const axios       = require('axios');
const router      = express.Router();
const { authMiddleware, adminOnly } = require('../middleware/auth');
const Application = require('../models/Application');
const User        = require('../models/User');
const FraudAlert  = require('../models/FraudAlert');

// ── Helpers ───────────────────────────────────────────────────────────────────
async function getAiExplanation(issue, detail) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key || key === 'your_openrouter_api_key_here') return '';
  try {
    const res = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'openai/gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a fraud analyst for a scholarship portal. Give a 1-sentence explanation of why this application was flagged.' },
          { role: 'user', content: `Issue: ${issue}. Detail: ${detail}` },
        ],
        max_tokens: 120,
      },
      { headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' } }
    );
    return res.data.choices?.[0]?.message?.content?.trim() || '';
  } catch {
    return '';
  }
}

function flag(studentName, studentId, riskLevel, issue, detail) {
  return { studentName, studentId, riskLevel, issue, detail };
}

// ── POST /api/fraud/run-scan ──────────────────────────────────────────────────
router.post('/run-scan', authMiddleware, adminOnly, async (req, res) => {
  try {
    console.log('[FraudScan] Starting scan...');
    const found = [];

    // Fetch all students and their applications
    const students = await User.find({ role: 'student' }).select('-password').lean();
    const allApps  = await Application.find().lean();

    // ── Rule 1 (HIGH): Same phone number across multiple accounts ─────────────
    const phoneMap = {};
    students.forEach((s) => {
      if (!s.phone) return;
      const p = s.phone.trim();
      if (!phoneMap[p]) phoneMap[p] = [];
      phoneMap[p].push(s);
    });
    for (const [phone, group] of Object.entries(phoneMap)) {
      if (group.length > 1) {
        group.forEach((s) => {
          found.push(flag(s.name, s._id, 'high', 'Duplicate Phone Number',
            `Phone ${phone} is shared across ${group.length} accounts: ${group.map((x) => x.name).join(', ')}.`));
        });
      }
    }

    // ── Rule 2 (HIGH): Same email domain bulk registrations (>3 from same domain) ─
    const domainMap = {};
    students.forEach((s) => {
      const domain = s.email.split('@')[1];
      if (!domainMap[domain]) domainMap[domain] = [];
      domainMap[domain].push(s);
    });
    for (const [domain, group] of Object.entries(domainMap)) {
      if (group.length > 3 && !['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'].includes(domain)) {
        group.forEach((s) => {
          found.push(flag(s.name, s._id, 'high', 'Bulk Registration from Same Domain',
            `${group.length} accounts registered from domain @${domain} — possible coordinated fraud.`));
        });
      }
    }

    // ── Rule 3 (HIGH): Suspicious marks + income combo (high marks, very low income declared) ─
    students.forEach((s) => {
      const { marks, annualIncome } = s.profile || {};
      if (marks >= 95 && annualIncome > 0 && annualIncome < 50000) {
        found.push(flag(s.name, s._id, 'high', 'Suspicious Marks/Income Combination',
          `Declared income ₹${annualIncome.toLocaleString('en-IN')}/yr with ${marks}% marks — statistically inconsistent.`));
      }
    });

    // ── Rule 4 (MEDIUM): Bulk applications — more than 6 in one day ──────────
    const appsByStudent = {};
    allApps.forEach((a) => {
      const key = String(a.studentId);
      if (!appsByStudent[key]) appsByStudent[key] = [];
      appsByStudent[key].push(a);
    });
    for (const [studentId, apps] of Object.entries(appsByStudent)) {
      // Group by date
      const byDate = {};
      apps.forEach((a) => {
        const d = new Date(a.appliedAt).toDateString();
        byDate[d] = (byDate[d] || 0) + 1;
      });
      const maxInDay = Math.max(...Object.values(byDate));
      if (maxInDay >= 5) {
        const student = students.find((s) => String(s._id) === studentId);
        if (student) {
          found.push(flag(student.name, student._id, 'medium', 'Bulk Applications',
            `Applied to ${maxInDay} scholarships in a single day — possible automated submission.`));
        }
      }
    }

    // ── Rule 5 (MEDIUM): Income declared as 0 but profile otherwise complete ──
    students.forEach((s) => {
      const p = s.profile || {};
      const hasProfile = p.marks && p.category && p.course && p.institution;
      if (hasProfile && (!p.annualIncome || p.annualIncome === 0)) {
        found.push(flag(s.name, s._id, 'medium', 'Missing Income Declaration',
          `Profile is fully filled but annual income is declared as ₹0 — possible data manipulation.`));
      }
    });

    // ── Rule 6 (MEDIUM): Applied to same scholarship multiple times ───────────
    const appPairs = {};
    allApps.forEach((a) => {
      const key = `${a.studentId}_${a.scholarshipId}`;
      appPairs[key] = (appPairs[key] || 0) + 1;
    });
    for (const [key, count] of Object.entries(appPairs)) {
      if (count > 1) {
        const [studentId] = key.split('_');
        const student = students.find((s) => String(s._id) === studentId);
        if (student) {
          found.push(flag(student.name, student._id, 'medium', 'Duplicate Application',
            `Applied to the same scholarship ${count} times — duplicate submission detected.`));
        }
      }
    }

    // ── Rule 7 (LOW): Incomplete profile but applied to scholarships ──────────
    students.forEach((s) => {
      const p = s.profile || {};
      const appCount = (appsByStudent[String(s._id)] || []).length;
      const missing = ['marks', 'category', 'course', 'annualIncome'].filter((f) => !p[f]);
      if (appCount > 0 && missing.length >= 3) {
        found.push(flag(s.name, s._id, 'low', 'Incomplete Profile with Applications',
          `Applied to ${appCount} scholarship(s) with ${missing.length} key profile fields missing (${missing.join(', ')}).`));
      }
    });

    // ── Rule 8 (LOW): No applications but profile fully complete (possible bot) ─
    students.forEach((s) => {
      const p = s.profile || {};
      const appCount = (appsByStudent[String(s._id)] || []).length;
      const complete = ['marks', 'category', 'course', 'annualIncome', 'institution', 'state'].every((f) => p[f]);
      const accountAge = (Date.now() - new Date(s.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      if (complete && appCount === 0 && accountAge < 1) {
        found.push(flag(s.name, s._id, 'low', 'Suspicious New Account',
          `Account created less than 24 hours ago with a fully complete profile but zero applications.`));
      }
    });

    if (found.length === 0) {
      return res.json({ message: 'Scan complete. No suspicious activity detected.', count: 0, alerts: [] });
    }

    // Deduplicate: skip if same student + same issue already active
    const existing = await FraudAlert.find({ status: 'active' }).lean();
    const existingKeys = new Set(existing.map((e) => `${e.studentId}_${e.issue}`));

    const toInsert = found.filter((f) => !existingKeys.has(`${f.studentId}_${f.issue}`));

    // Get AI explanations (parallel, best-effort)
    const withAI = await Promise.all(
      toInsert.map(async (f) => ({
        ...f,
        aiExplanation: await getAiExplanation(f.issue, f.detail),
      }))
    );

    const inserted = await FraudAlert.insertMany(withAI);
    console.log(`[FraudScan] Done. ${inserted.length} new alerts created.`);

    res.json({ message: `Scan complete. ${inserted.length} new alert(s) created.`, count: inserted.length, alerts: inserted });
  } catch (err) {
    console.error('[FraudScan] error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/fraud/alerts ─────────────────────────────────────────────────────
router.get('/alerts', authMiddleware, adminOnly, async (req, res) => {
  try {
    const alerts = await FraudAlert.find().sort({ createdAt: -1 }).lean();
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PATCH /api/fraud/dismiss/:id ──────────────────────────────────────────────
router.patch('/dismiss/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const alert = await FraudAlert.findByIdAndUpdate(req.params.id, { status: 'dismissed' }, { new: true });
    if (!alert) return res.status(404).json({ message: 'Alert not found' });
    res.json(alert);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PATCH /api/fraud/blacklist/:id ────────────────────────────────────────────
router.patch('/blacklist/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const alert = await FraudAlert.findByIdAndUpdate(req.params.id, { status: 'blacklisted' }, { new: true });
    if (!alert) return res.status(404).json({ message: 'Alert not found' });

    // Mark student account with a blacklist flag in their profile
    await User.findByIdAndUpdate(alert.studentId, { 'profile.blacklisted': true });

    res.json(alert);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
