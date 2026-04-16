const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../data/db');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');
const { sendOtpEmail, sendWelcomeEmail } = require('../utils/emailService');

const router = express.Router();

// In-memory OTP store: { email -> { otp, expiresAt, name, password, phone } }
const otpStore = new Map();
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// POST /api/auth/send-otp  — Step 1: send real OTP email
router.post('/send-otp', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'Name, email and password are required' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ message: 'Please enter a valid email address' });
    if (password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    if (db.users.find((u) => u.email === email.toLowerCase().trim()))
      return res.status(409).json({ message: 'This email is already registered' });

    const otp = generateOtp();
    const normalizedEmail = email.toLowerCase().trim();
    otpStore.set(normalizedEmail, {
      otp, name: name.trim(), password, phone: phone || '',
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    try {
      await sendOtpEmail(email.trim(), name.trim(), otp);
      return res.status(200).json({ message: `OTP sent to ${email}` });
    } catch (err) {
      console.error('Send OTP error:', err.message);
      // Email send failed but OTP is stored — return OTP in response for demo
      console.log(`📧 [DEMO] OTP for ${normalizedEmail}: ${otp}`);
      return res.status(200).json({
        message: `Could not send email. Use this OTP to continue: ${otp}`,
        demoOtp: otp,
      });
    }
  } catch (err) {
    console.error('Send OTP error:', err.message);
    res.status(500).json({ message: 'OTP bhejne mein error: ' + err.message });
  }
});

// POST /api/auth/verify-otp  — Step 2: verify OTP and create account
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res.status(400).json({ message: 'Email and OTP are required' });
    const stored = otpStore.get(email.toLowerCase().trim());
    if (!stored)
      return res.status(400).json({ message: 'OTP not found. Please request a new one.' });
    if (Date.now() > stored.expiresAt) {
      otpStore.delete(email.toLowerCase().trim());
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }
    if (stored.otp !== otp.trim())
      return res.status(400).json({ message: 'Incorrect OTP. Please check your email.' });

    const hashed = await bcrypt.hash(stored.password, 10);
    const user = {
      id: uuidv4(),
      name: stored.name,
      email: email.toLowerCase().trim(),
      password: hashed,
      phone: stored.phone,
      role: 'student',
      profile: { marks: 0, cgpa: 0, annualIncome: 0, category: '', course: '', gender: '', state: '', disability: false, institution: '', address: '' },
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);
    db.notifications.push({ id: uuidv4(), userId: user.id, title: 'Welcome to NSMP! 🎓', message: 'Complete your profile to get AI-powered scholarship recommendations.', type: 'info', read: false, createdAt: new Date().toISOString() });
    otpStore.delete(email.toLowerCase().trim());

    // Send welcome email (non-blocking)
    sendWelcomeEmail(user.email, user.name).catch((e) => console.warn('Welcome email failed:', e.message));

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...safeUser } = user;
    res.status(201).json({ token, user: safeUser });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/auth/register  — legacy / direct (no OTP)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password are required' });
    if (db.users.find((u) => u.email === email)) return res.status(409).json({ message: 'Email already registered' });
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
    const hashed = await bcrypt.hash(password, 10);
    const user = { id: uuidv4(), name: name.trim(), email: email.toLowerCase().trim(), password: hashed, phone: phone || '', role: 'student', profile: { marks: 0, cgpa: 0, annualIncome: 0, category: '', course: '', gender: '', state: '', disability: false, institution: '', address: '' }, createdAt: new Date().toISOString() };
    db.users.push(user);
    db.notifications.push({ id: uuidv4(), userId: user.id, title: 'Welcome to NSMP! 🎓', message: 'Complete your profile to get AI-powered scholarship recommendations.', type: 'info', read: false, createdAt: new Date().toISOString() });
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...safeUser } = user;
    res.status(201).json({ token, user: safeUser });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });
    const user = db.users.find((u) => u.email === email.toLowerCase().trim());
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  const user = db.users.find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const { password: _, ...safeUser } = user;
  res.json(safeUser);
});

// PUT /api/auth/profile
router.put('/profile', authMiddleware, (req, res) => {
  const user = db.users.find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const { name, phone, profile } = req.body;
  if (name) user.name = name.trim();
  if (phone !== undefined) user.phone = phone;
  if (profile) user.profile = { ...user.profile, ...profile };
  if (db._save) db._save();
  const { password: _, ...safeUser } = user;
  res.json(safeUser);
});

module.exports = router;
