const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Exam = require('../models/Exam');

const COOKIE_NAME = 'omr_session';
const TOKEN_TTL = '7d';

function cookieOptions() {
  // Secure cookies only when running behind HTTPS (Replit/Render deployments).
  const isHttps = process.env.TRUST_PROXY === '1' || process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: isHttps,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/'
  };
}

function issueToken(res, userId) {
  const token = jwt.sign({ sub: userId }, process.env.JWT_SECRET || 'omr-checker-dev-secret-change-me', {
    expiresIn: TOKEN_TTL
  });
  res.cookie(COOKIE_NAME, token, cookieOptions());
  return token;
}

function clearToken(res) {
  const { maxAge, ...rest } = cookieOptions();
  res.clearCookie(COOKIE_NAME, rest);
}

// Attaches req.user when a valid session cookie exists; never rejects.
async function optionalAuth(req, _res, next) {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    if (token) {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'omr-checker-dev-secret-change-me');
      req.user = await User.findById(payload.sub).select('-passwordHash').lean();
    }
  } catch (_e) {
    req.user = null;
  }
  next();
}

// Rejects unauthenticated requests with 401.
function requireAuth(req, res, next) {
  if (req.user) return next();
  return res.status(401).json({ error: 'Please sign in to continue' });
}

// For exam-scoped resources: confirms the signed-in user owns the exam.
async function requireExamOwner(examId, req, res) {
  const exam = await Exam.findById(examId).lean();
  if (!exam) {
    res.status(404).json({ error: 'Exam not found' });
    return null;
  }
  if (String(exam.userId || '') !== String(req.user._id)) {
    res.status(403).json({ error: 'You do not have access to this exam' });
    return null;
  }
  return exam;
}

module.exports = { COOKIE_NAME, issueToken, clearToken, optionalAuth, requireAuth, requireExamOwner, cookieOptions };
