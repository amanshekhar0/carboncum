/**
 * authController.js
 *
 * Real auth flow backed by MongoDB. Passwords are hashed with bcrypt and
 * JWT tokens are signed for stateless auth. No mock fallbacks – if the DB is
 * unavailable, requests return a clean 503 so the UI can react truthfully.
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const Suggestion = require('../models/Suggestion');

const JWT_SECRET = process.env.JWT_SECRET || 'carbontwin_secret_key_dev_only';
const JWT_TTL = '7d';

const ensureDb = (res) => {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({ error: 'Database is currently unavailable. Please retry shortly.' });
    return false;
  }
  return true;
};

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  ecoScore: user.ecoScore || 0,
  currentStreak: user.currentStreak || 0,
  totalCarbonSaved: Number((user.totalCarbonSaved || 0).toFixed(3)),
  totalRupeesSaved: Number((user.totalRupeesSaved || 0).toFixed(2)),
  ecoPoints: user.ecoPoints || 0,
  avatarUrl: user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`,
  createdAt: user.createdAt
});

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const signup = async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const name = (req.body.name || '').trim();
    const email = (req.body.email || '').trim().toLowerCase();
    const password = req.body.password || '';

    if (!name) return res.status(400).json({ error: 'Name is required' });
    if (!isValidEmail(email)) return res.status(400).json({ error: 'A valid email is required' });
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      avatarUrl,
      // Explicit zero start – every metric grows from real activity only
      totalCarbonSaved: 0,
      totalRupeesSaved: 0,
      ecoScore: 0,
      currentStreak: 0,
      ecoPoints: 0,
      lastActiveDate: new Date()
    });

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: JWT_TTL });

    res.status(201).json({ token, user: sanitizeUser(user) });
  } catch (err) {
    console.error('[authController] signup error:', err);
    res.status(500).json({ error: 'Signup failed. Please try again.' });
  }
};

const login = async (req, res) => {
  try {
    if (!ensureDb(res)) return;

    const email = (req.body.email || '').trim().toLowerCase();
    const password = req.body.password || '';

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Invalid email or password' });

    user.lastActiveDate = new Date();
    await user.save();

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: JWT_TTL });
    res.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    console.error('[authController] login error:', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
};

const me = async (req, res) => {
  try {
    if (!ensureDb(res)) return;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(sanitizeUser(user));
  } catch (err) {
    console.error('[authController] me error:', err);
    res.status(500).json({ error: 'Failed to load profile' });
  }
};

const updateProfile = async (req, res) => {
  try {
    if (!ensureDb(res)) return;
    const updates = {};
    if (typeof req.body.name === 'string' && req.body.name.trim()) {
      updates.name = req.body.name.trim();
    }
    if (typeof req.body.avatarUrl === 'string') {
      updates.avatarUrl = req.body.avatarUrl.trim();
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const user = await User.findByIdAndUpdate(req.userId, updates, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(sanitizeUser(user));
  } catch (err) {
    console.error('[authController] updateProfile error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

const changePassword = async (req, res) => {
  try {
    if (!ensureDb(res)) return;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.userId).select('+password');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) return res.status(401).json({ error: 'Current password is incorrect' });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ success: true });
  } catch (err) {
    console.error('[authController] changePassword error:', err);
    res.status(500).json({ error: 'Failed to change password' });
  }
};

const deleteAccount = async (req, res) => {
  try {
    if (!ensureDb(res)) return;
    const userId = req.userId;
    await Promise.all([
      ActivityLog.deleteMany({ userId }),
      Suggestion.deleteMany({ userId }),
      User.findByIdAndDelete(userId)
    ]);
    res.json({ success: true });
  } catch (err) {
    console.error('[authController] deleteAccount error:', err);
    res.status(500).json({ error: 'Failed to delete account' });
  }
};

module.exports = { signup, login, me, updateProfile, changePassword, deleteAccount };
