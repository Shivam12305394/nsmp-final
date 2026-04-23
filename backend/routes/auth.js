const express  = require('express');
const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
const User      = require('../models/User');
const OtpStore  = require('../models/OtpStore');
const Notification = require('../models/Notification');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');
const { sendOtpEmail, sendWelcomeEmail, sendResetOtpEmail } = require('../utils/emailService');

const router = express.Router();

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// ─────────────────────────────────────────────
// REGISTRATION
// ─────────────────────────────────────────────

// POST /api/auth/send-otp
router.post('/send-otp', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'Name, email and password are required' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ message: 'Please enter a valid email address' });
    if (password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const normalizedEmail = email.toLowerCase().trim();
    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) return res.status(409).json({ message: 'This email is already registered' });

    // Rate limiting: 60 seconds
    const existingOtp = await OtpStore.findOne({ email: normalizedEmail });
    if (existingOtp && existingOtp.lastRequestedAt && (Date.now() - existingOtp.lastRequestedAt.getTime() < 60000)) {
      const waitTime = Math.ceil((60000 - (Date.now() - existingOtp.lastRequestedAt.getTime())) / 1000);
      return res.status(429).json({ message: `Please wait ${waitTime} seconds before requesting a new OTP.` });
    }

    const otp = generateOtp();
    console.log(`[OTP DEBUG] Generated OTP for ${normalizedEmail}: ${otp}`);

    await OtpStore.findOneAndUpdate(
      { email: normalizedEmail },
      { 
        otp, 
        name: name.trim(), 
        password, 
        phone: phone || '', 
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes expiry
        lastRequestedAt: new Date()
      },
      { upsert: true, new: true }
    );

    await sendOtpEmail(normalizedEmail, name.trim(), otp);
    res.status(200).json({ message: `OTP sent to ${normalizedEmail}` });
  } catch (err) {
    console.error('send-otp error:', err.message);
    res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });

    const normalizedEmail = email.toLowerCase().trim();
    console.log(`[OTP DEBUG] Verifying OTP for ${normalizedEmail}: ${otp}`);

    const stored = await OtpStore.findOne({ email: normalizedEmail });
    if (!stored) {
      console.log(`[OTP DEBUG] No OTP found in database for ${normalizedEmail}`);
      return res.status(400).json({ message: 'OTP not found. Please request a new one.' });
    }

    if (Date.now() > stored.expiresAt) {
      console.log(`[OTP DEBUG] OTP expired for ${normalizedEmail}. Expired at: ${stored.expiresAt}`);
      await OtpStore.deleteOne({ email: normalizedEmail });
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    if (stored.otp !== otp.trim()) {
      console.log(`[OTP DEBUG] Incorrect OTP for ${normalizedEmail}. Expected: ${stored.otp}, Received: ${otp}`);
      return res.status(400).json({ message: 'Incorrect OTP. Please check your email.' });
    }

    console.log(`[OTP DEBUG] OTP verified successfully for ${normalizedEmail}`);
    const hashed = await bcrypt.hash(stored.password, 10);
    const user = await User.create({
      name: stored.name, email: normalizedEmail,
      password: hashed, phone: stored.phone, role: 'student',
    });
    await OtpStore.deleteOne({ email: normalizedEmail });

    await Notification.create({
      userId: user._id, title: 'Welcome to NSMP! 🎓',
      message: 'Complete your profile to get AI-powered scholarship recommendations.',
      type: 'info',
    });

    sendWelcomeEmail(user.email, user.name).catch(e => console.warn('Welcome email failed:', e.message));

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    const safeUser = user.toObject(); delete safeUser.password;
    res.status(201).json({ token, user: safeUser });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    const safeUser = user.toObject(); delete safeUser.password;
    res.json({ token, user: safeUser });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─────────────────────────────────────────────
// PROFILE
// ─────────────────────────────────────────────

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/auth/profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, phone, profile } = req.body;
    const update = {};
    if (name) update.name = name.trim();
    if (phone !== undefined) update.phone = phone;
    if (profile) {
      Object.keys(profile).forEach(k => { update[`profile.${k}`] = profile[k]; });
    }
    const user = await User.findByIdAndUpdate(req.user.id, { $set: update }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─────────────────────────────────────────────
// FORGOT PASSWORD — OTP stored in MongoDB User document
// ─────────────────────────────────────────────

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    // Always return success to prevent email enumeration
    if (!user) {
      console.log(`[FORGOT PASSWORD DEBUG] User not found for ${normalizedEmail}`);
      return res.status(200).json({ message: 'If this email is registered, an OTP has been sent.' });
    }

    // Rate-limit: 60 seconds
    if (user.lastResetOtpRequestedAt && (Date.now() - user.lastResetOtpRequestedAt.getTime() < 60000)) {
      const waitTime = Math.ceil((60000 - (Date.now() - user.lastResetOtpRequestedAt.getTime())) / 1000);
      return res.status(429).json({ message: `Please wait ${waitTime} seconds before requesting another OTP.` });
    }

    const otp = generateOtp();
    console.log(`[FORGOT PASSWORD DEBUG] Generated OTP for ${normalizedEmail}: ${otp}`);

    // Store OTP in MongoDB with 5-minute expiry
    await User.findByIdAndUpdate(user._id, {
      resetOtp: otp,
      resetOtpExpiry: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      resetOtpVerified: false,
      lastResetOtpRequestedAt: new Date()
    });

    await sendResetOtpEmail(user.email, user.name, otp);
    res.status(200).json({ message: `OTP sent to ${email}` });
  } catch (err) {
    console.error('forgot-password error:', err.message);
    res.status(500).json({ message: 'Failed to send reset email. Please try again.' });
  }
});

// POST /api/auth/verify-reset-otp
router.post('/verify-reset-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });

    const normalizedEmail = email.toLowerCase().trim();
    console.log(`[FORGOT PASSWORD DEBUG] Verifying OTP for ${normalizedEmail}: ${otp}`);

    const user = await User.findOne({ email: normalizedEmail });
    if (!user || !user.resetOtp) {
      console.log(`[FORGOT PASSWORD DEBUG] No OTP found for ${normalizedEmail}`);
      return res.status(400).json({ message: 'OTP not found. Please request a new one.' });
    }

    if (Date.now() > new Date(user.resetOtpExpiry).getTime()) {
      console.log(`[FORGOT PASSWORD DEBUG] OTP expired for ${normalizedEmail}. Expired at: ${user.resetOtpExpiry}`);
      await User.findByIdAndUpdate(user._id, { resetOtp: null, resetOtpExpiry: null, resetOtpVerified: false });
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    if (user.resetOtp !== otp.trim()) {
      console.log(`[FORGOT PASSWORD DEBUG] Incorrect OTP for ${normalizedEmail}. Expected: ${user.resetOtp}, Received: ${otp}`);
      return res.status(400).json({ message: 'Incorrect OTP. Please try again.' });
    }

    console.log(`[FORGOT PASSWORD DEBUG] OTP verified successfully for ${normalizedEmail}`);
    // Mark verified in DB, extend expiry by 10 minutes to allow password reset
    await User.findByIdAndUpdate(user._id, {
      resetOtpVerified: true,
      resetOtpExpiry: new Date(Date.now() + 10 * 60 * 1000),
    });

    res.json({ message: 'OTP verified successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) return res.status(400).json({ message: 'Email, OTP and new password are required' });
    if (newPassword.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const normalizedEmail = email.toLowerCase().trim();
    console.log(`[FORGOT PASSWORD DEBUG] Resetting password for ${normalizedEmail} with OTP: ${otp}`);

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      console.log(`[FORGOT PASSWORD DEBUG] User not found during reset: ${normalizedEmail}`);
      return res.status(404).json({ message: 'User not found.' });
    }

    if (!user.resetOtpVerified) {
      console.log(`[FORGOT PASSWORD DEBUG] OTP not verified for ${normalizedEmail}`);
      return res.status(400).json({ message: 'OTP not verified. Please complete verification first.' });
    }

    if (Date.now() > new Date(user.resetOtpExpiry).getTime()) {
      console.log(`[FORGOT PASSWORD DEBUG] Reset session expired for ${normalizedEmail}. Expired at: ${user.resetOtpExpiry}`);
      return res.status(400).json({ message: 'Session expired. Please start over.' });
    }

    if (user.resetOtp !== otp.trim()) {
      console.log(`[FORGOT PASSWORD DEBUG] Invalid OTP for ${normalizedEmail}. Expected: ${user.resetOtp}, Received: ${otp}`);
      return res.status(400).json({ message: 'Invalid OTP.' });
    }

    console.log(`[FORGOT PASSWORD DEBUG] Password reset successful for ${normalizedEmail}`);
    // Update password and clear OTP fields
    const hashed = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(user._id, {
      password: hashed,
      resetOtp: null, 
      resetOtpExpiry: null, 
      resetOtpVerified: false,
    });

    await Notification.create({
      userId: user._id, title: 'Password Changed 🔐',
      message: 'Your NSMP account password was successfully reset.',
      type: 'info',
    });

    res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
