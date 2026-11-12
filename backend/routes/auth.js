const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Exam = require('../models/Exam');
const Student = require('../models/Student');
const { issueToken, clearToken, requireAuth } = require('../middleware/auth');

const router = express.Router();

// --- simple in-memory rate limiting on auth endpoints (per IP) ---
const WINDOW_MS = 15 * 60 * 1000;
const hits = new Map(); // ip -> [{ts, ok}]
function rateLimit(req, res, next) {
  const key = `${req.ip || 'unknown'}`;
  const now = Date.now();
  const list = (hits.get(key) || []).filter((h) => now - h.ts < WINDOW_MS);
  if (list.length >= 30) {
    return res.status(429).json({ error: 'Too many attempts. Try again in a few minutes.' });
  }
  hits.set(key, [...list, { ts: now }]);
  next();
}

// --- failed-login lockout (per ip+email) ---
const fails = new Map();
function recordFail(key) {
  const now = Date.now();
  const list = (fails.get(key) || []).filter((t) => now - t < WINDOW_MS);
  list.push(now);
  fails.set(key, list);
  return list.length;
}
function isLocked(key) {
  const list = (fails.get(key) || []).filter((t) => Date.now() - t < WINDOW_MS);
  return list.length >= 5;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.use(rateLimit);

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || String(name).trim().length < 2) {
      return res.status(400).json({ error: 'Please enter your name' });
    }
    if (!email || !EMAIL_RE.test(String(email).trim().toLowerCase())) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }
    if (!password || String(password).length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists. Try signing in.' });
    }
    const passwordHash = await bcrypt.hash(String(password), 12);
    const user = await User.create({ name: String(name).trim(), email: normalizedEmail, passwordHash });
    issueToken(res, user._id);
    res.status(201).json({ user: { id: user._id, name: user.name, email: user.email, createdAt: user.createdAt } });
  } catch (err) {
    res.status(500).json({ error: 'Could not create the account. Please try again.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const lockKey = `${req.ip || ''}:${normalizedEmail}`;
    if (isLocked(lockKey)) {
      return res.status(429).json({ error: 'Too many failed attempts. Try again in 15 minutes.' });
    }
    const user = await User.findOne({ email: normalizedEmail });
    const ok = user && (await bcrypt.compare(String(password), user.passwordHash));
    if (!ok) {
      const count = recordFail(lockKey);
      return res.status(401).json({
        error: count >= 5 ? 'Too many failed attempts. Try again in 15 minutes.' : 'Incorrect email or password'
      });
    }
    fails.delete(lockKey);
    issueToken(res, user._id);
    res.json({ user: { id: user._id, name: user.name, email: user.email, createdAt: user.createdAt } });
  } catch (err) {
    res.status(500).json({ error: 'Sign-in failed. Please try again.' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  res.json({ user: req.user });
});

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
  clearToken(res);
  res.json({ ok: true });
});

// GET /api/auth/export — data export right
router.get('/export', requireAuth, async (req, res) => {
  try {
    const exams = await Exam.find({ userId: req.user._id }).lean();
    const students = await Student.find({ examId: { $in: exams.map((e) => e._id) } }).lean();
    res.json({
      exportedAt: new Date().toISOString(),
      account: { name: req.user.name, email: req.user.email, createdAt: req.user.createdAt },
      exams,
      studentResults: students
    });
  } catch (err) {
    res.status(500).json({ error: 'Export failed' });
  }
});

// DELETE /api/auth/me — full account deletion (account + exams + results)
router.delete('/me', requireAuth, async (req, res) => {
  try {
    const exams = await Exam.find({ userId: req.user._id }).select('_id').lean();
    await Student.deleteMany({ examId: { $in: exams.map((e) => e._id) } });
    await Exam.deleteMany({ userId: req.user._id });
    await User.deleteOne({ _id: req.user._id });
    clearToken(res);
    res.json({ ok: true, message: 'Account and all associated data deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Deletion failed' });
  }
});

module.exports = router;
