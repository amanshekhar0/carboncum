const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'carbontwin_secret_key_123';

/**
 * POST /api/auth/signup
 */
const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const mongoose = require('mongoose');

    if (mongoose.connection.readyState !== 1) {
      // DB DOWN: Mock signup success
      const MockDB = require('../services/MockDB');
      const userId = 'mock_user_' + Date.now();
      const mockUser = { 
        id: userId, 
        _id: userId,
        name: name || 'Guest User', 
        email: email || 'guest@example.com', 
        ecoScore: 50,
        totalCarbonSaved: 0,
        totalRupeesSaved: 0,
        currentStreak: 0
      };
      
      MockDB.saveUser(mockUser);
      console.warn('[Auth] DB down, using mock signup for name:', name);
      
      return res.status(201).json({
        token: 'mock_token_' + userId,
        user: mockUser,
        isMock: true
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`
    });

    // Generate token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

    // Generate initial synthetic data using Groq
    try {
      const { seedUserActivity } = require('../services/AIService');
      await seedUserActivity(user._id);
    } catch (seedErr) {
      console.warn('[Auth] Initial seed failed, user will start with zero data:', seedErr.message);
    }

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        ecoScore: user.ecoScore
      }
    });
  } catch (err) {
    console.error('[authController] signup error:', err.message);
    res.status(500).json({ error: 'Signup failed: ' + err.message });
  }
};

/**
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const mongoose = require('mongoose');

    if (mongoose.connection.readyState !== 1) {
      // DB DOWN: Mock login success
      console.warn('[Auth] DB down, using mock login');
      return res.json({
        token: 'mock_token_' + Date.now(),
        user: { id: 'mock_user_123', name: 'Aarav Sharma (Guest)', email, ecoScore: 78 },
        isMock: true
      });
    }

    // Find user with password
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        ecoScore: user.ecoScore
      }
    });
  } catch (err) {
    console.error('[authController] login error:', err.message);
    res.status(500).json({ error: 'Login failed: ' + err.message });
  }
};

module.exports = { signup, login };
