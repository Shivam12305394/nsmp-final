const express    = require('express');
const axios      = require('axios');
const router     = express.Router();
const { authMiddleware: authenticate } = require('../middleware/auth');
const Scholarship = require('../models/Scholarship');

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL          = 'openai/gpt-3.5-turbo';

async function callOpenRouter(messages, max_tokens = 600) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key || key === 'your_openrouter_api_key_here') {
    throw new Error('OPENROUTER_API_KEY not configured in backend .env');
  }
  console.log(`[OpenRouter] model=${MODEL} messages=${messages.length}`);
  const res = await axios.post(
    OPENROUTER_URL,
    { model: MODEL, messages, max_tokens },
    { headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' } }
  );
  const reply = res.data.choices?.[0]?.message?.content || '';
  console.log('[OpenRouter] reply length=', reply.length);
  return reply;
}

// ── Intent detection ──────────────────────────────────────────────────────────
function detectIntent(text) {
  const t = text.toLowerCase();

  if (/\b(today|current|what.*date|date.*today|aaj|today'?s date)\b/.test(t) && /\bdate\b/.test(t))
    return 'DATE';

  if (/\b(how many|total|count|kitne|number of)\b.*\bscholarship/.test(t) ||
      /\bscholarship.*\b(available|count|total|how many)\b/.test(t) ||
      /\bhow much scholarship\b/.test(t))
    return 'COUNT';

  if (/\b(list|show|all|available|kaunse|which)\b.*\bscholarship/.test(t) ||
      /\bscholarship.*\b(list|names|available|show|all)\b/.test(t))
    return 'LIST';

  if (/\b(deadline|last date|due date|expir|closing)\b/.test(t))
    return 'DEADLINES';

  if (/\b(amount|money|rupee|₹|rs\.?|prize|reward|kitna milega)\b/.test(t) &&
      /\bscholarship\b/.test(t))
    return 'AMOUNTS';

  if (/\b(sc|st|obc|ews|general|category|caste|reserved)\b/.test(t))
    return 'CATEGORY';

  if (/\b(document|certificate|marksheet|aadhaar|income proof|required|upload)\b/.test(t))
    return 'DOCUMENTS';

  if (/\b(eligib|qualify|criteria|requirement|who can|minimum marks|income limit)\b/.test(t))
    return 'ELIGIBILITY';

  return 'AI';
}

// ── DB-backed handlers ────────────────────────────────────────────────────────
async function handleIntent(intent, userText) {
  const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  switch (intent) {
    case 'DATE':
      return `📅 Today's date is **${today}**.`;

    case 'COUNT': {
      const count = await Scholarship.countDocuments();
      return `📚 There are currently **${count} scholarships** available on the NSMP portal.`;
    }

    case 'LIST': {
      const list = await Scholarship.find({}, 'name provider amount').sort({ amount: -1 }).limit(10);
      const lines = list.map((s, i) => `${i + 1}. **${s.name}** — ₹${s.amount.toLocaleString('en-IN')}/yr (${s.provider})`).join('\n');
      const total = await Scholarship.countDocuments();
      return `🎓 Here are the top scholarships on NSMP (${total} total):\n\n${lines}`;
    }

    case 'DEADLINES': {
      const list = await Scholarship.find({}, 'name deadline').sort({ deadline: 1 }).limit(8);
      const lines = list.map((s) => `• **${s.name}** — Deadline: ${new Date(s.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`).join('\n');
      return `⏰ Upcoming scholarship deadlines:\n\n${lines}`;
    }

    case 'AMOUNTS': {
      const list = await Scholarship.find({}, 'name amount').sort({ amount: -1 }).limit(8);
      const lines = list.map((s) => `• **${s.name}** — ₹${s.amount.toLocaleString('en-IN')}/yr`).join('\n');
      return `💰 Scholarships by amount (highest first):\n\n${lines}`;
    }

    case 'CATEGORY': {
      const cats = ['SC', 'ST', 'OBC', 'EWS', 'General'];
      const counts = await Promise.all(
        cats.map(async (c) => {
          const n = await Scholarship.countDocuments({ categories: c });
          return `• **${c}**: ${n} scholarship${n !== 1 ? 's' : ''}`;
        })
      );
      return `🏷️ Scholarships by category:\n\n${counts.join('\n')}\n\nUse the Browse page to filter by your category.`;
    }

    case 'DOCUMENTS':
      return `📄 Common documents required for NSMP scholarships:\n\n1. Class 12 Marksheet\n2. Income Certificate\n3. Category Certificate (SC/ST/OBC/EWS)\n4. Aadhaar Card\n5. Bank Passbook (first page)\n6. Passport-size Photo\n7. College Admission Letter\n8. Domicile Certificate\n\nUpload them in the **Documents** section of your dashboard.`;

    case 'ELIGIBILITY': {
      const stats = await Scholarship.aggregate([
        { $group: { _id: null, minMarks: { $min: '$minMarks' }, maxMarks: { $max: '$minMarks' }, minIncome: { $min: '$maxIncome' }, maxIncome: { $max: '$maxIncome' } } },
      ]);
      const s = stats[0] || {};
      return `✅ General eligibility across NSMP scholarships:\n\n• **Minimum Marks**: ${s.minMarks ?? 0}% – ${s.maxMarks ?? 90}% (varies per scholarship)\n• **Income Limit**: up to ₹${((s.maxIncome ?? 800000) / 100000).toFixed(1)} Lakh/yr\n• **Categories**: SC, ST, OBC, EWS, General\n• **Courses**: Engineering, Medical, Science, Commerce, Arts & more\n\nComplete your profile to get AI-matched scholarships.`;
    }

    default:
      return null; // fall through to OpenRouter
  }
}

// ── POST /api/ai/chat ─────────────────────────────────────────────────────────
router.post('/chat', authenticate, async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages?.length) return res.status(400).json({ message: 'messages required' });

    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
    const intent = detectIntent(lastUserMsg);
    console.log(`[chat] intent=${intent} query="${lastUserMsg.slice(0, 60)}"`);

    // Try DB-backed answer first
    const dbReply = await handleIntent(intent, lastUserMsg);
    if (dbReply) return res.json({ reply: dbReply });

    // Enrich AI context with live DB summary
    const count = await Scholarship.countDocuments();
    const topScholarships = await Scholarship.find({}, 'name amount categories minMarks maxIncome deadline')
      .sort({ amount: -1 }).limit(5);

    const dbContext = `Live NSMP portal data (today: ${new Date().toLocaleDateString('en-IN')}):
- Total scholarships in database: ${count}
- Top scholarships: ${topScholarships.map((s) => `${s.name} (₹${s.amount.toLocaleString('en-IN')}/yr, min ${s.minMarks}% marks, income ≤₹${(s.maxIncome / 100000).toFixed(1)}L, categories: ${s.categories.join('/')})`).join('; ')}`;

    const system = {
      role: 'system',
      content: `You are an AI assistant for the NSMP (National Scholarship Matching Portal). Help students with scholarships, eligibility, documents, application process, and recommendations. Be concise (2-4 sentences), friendly, and specific. Use ₹ for rupees.\n\n${dbContext}`,
    };

    const reply = await callOpenRouter([system, ...messages], 512);
    res.json({ reply });
  } catch (err) {
    console.error('[/api/ai/chat] error:', err.response?.data || err.message);
    res.status(500).json({ message: err.response?.data?.error?.message || err.message });
  }
});

// ── POST /api/ai/strategy ─────────────────────────────────────────────────────
router.post('/strategy', authenticate, async (req, res) => {
  try {
    const { profile, topMatches } = req.body;
    const messages = [
      { role: 'system', content: 'You are an expert scholarship advisor for Indian students.' },
      { role: 'user', content: `Student profile: ${profile.category} category, ${profile.marks}% marks, ${profile.course} course, income ₹${profile.annualIncome}/yr.\nTop 3 matched scholarships: ${topMatches}.\nGive a 3-point actionable strategy to maximize scholarship success. Be specific and concise.` },
    ];
    const reply = await callOpenRouter(messages, 600);
    res.json({ reply });
  } catch (err) {
    console.error('[/api/ai/strategy] error:', err.response?.data || err.message);
    res.status(500).json({ message: err.response?.data?.error?.message || err.message });
  }
});

// ── POST /api/ai/fraud ────────────────────────────────────────────────────────
router.post('/fraud', authenticate, async (req, res) => {
  try {
    const { summary } = req.body;
    const messages = [
      { role: 'system', content: 'You are a fraud detection analyst for a scholarship portal.' },
      { role: 'user', content: `Scholarship fraud alerts:\n${summary}\n\nProvide a brief 3-point risk analysis and recommended actions.` },
    ];
    const reply = await callOpenRouter(messages, 500);
    res.json({ reply });
  } catch (err) {
    console.error('[/api/ai/fraud] error:', err.response?.data || err.message);
    res.status(500).json({ message: err.response?.data?.error?.message || err.message });
  }
});

module.exports = router;
