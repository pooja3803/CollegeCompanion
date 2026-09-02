const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { verifyToken, JWT_SECRET } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim().toLowerCase());
  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const isMatch = bcrypt.compareSync(password, user.password_hash);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  let profileData = null;
  if (user.role === 'student') {
    profileData = db.prepare('SELECT * FROM students WHERE user_id = ?').get(user.id);
  } else if (user.role === 'faculty') {
    profileData = db.prepare('SELECT * FROM faculty WHERE user_id = ?').get(user.id);
  }

  res.json({
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar_url: user.avatar_url,
      profile: profileData
    }
  });
});

// GET /api/auth/me
router.get('/me', verifyToken, (req, res) => {
  let profileData = null;
  if (req.user.role === 'student') {
    profileData = req.student;
  } else if (req.user.role === 'faculty') {
    profileData = req.faculty;
  }

  res.json({
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      avatar_url: req.user.avatar_url,
      profile: profileData
    }
  });
});

module.exports = router;
