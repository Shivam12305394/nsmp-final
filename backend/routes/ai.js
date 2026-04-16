const express = require('express');
const router = express.Router();
const { authMiddleware: authenticate } = require('../middleware/auth');

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-opus-4-5';

async function callClaude(system, messages, max_tokens = 600) {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured in backend .env');
  }

  const body = { model: MODEL, max_tokens, messages };
  if (system) body.system = system;

  const res = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Anthropic API error: ${res.status}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text || '';
}

// POST /api/ai/chat — Chatbot
router.post('/chat', authenticate, async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages?.length) return res.status(400).json({ message: 'messages required' });

    const system = `You are NSMP Scholar Assistant — a helpful AI for the National Scholarship Matching Portal.
Help students find scholarships, understand eligibility, prepare documents, and navigate the platform.
Be concise (2-3 sentences max), friendly, and specific. Use ₹ for rupees.`;

    const reply = await callClaude(system, messages, 512);
    res.json({ reply });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/ai/strategy — AI scholarship strategy for student
router.post('/strategy', authenticate, async (req, res) => {
  try {
    const { profile, topMatches } = req.body;

    const content = `Student profile: ${profile.category} category, ${profile.marks}% marks, ${profile.course} course, income ₹${profile.annualIncome}/yr.
Top 3 matched scholarships: ${topMatches}.
Give a 3-point actionable strategy to maximize scholarship success. Be specific and concise.`;

    const reply = await callClaude(null, [{ role: 'user', content }], 600);
    res.json({ reply });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/ai/fraud — AI fraud analysis for admin
router.post('/fraud', authenticate, async (req, res) => {
  try {
    const { summary } = req.body;

    const content = `Scholarship fraud alerts:\n${summary}\n\nProvide a brief 3-point risk analysis and recommended actions.`;

    const reply = await callClaude(null, [{ role: 'user', content }], 500);
    res.json({ reply });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
