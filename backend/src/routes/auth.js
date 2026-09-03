const express = require('express');
const router = express.Router();

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const db = require('../config/database');

const {
  verifyToken,
  JWT_SECRET
} = require('../middleware/auth');


// ==========================================
// POST /api/auth/signup
// ==========================================

router.post('/signup', (req, res) => {
  try {
    const {
      role,
      email,
      rollNumber,
      facultyCode,
      password
    } = req.body;

    if (!role || !email || !password) {
      return res.status(400).json({
        message: 'Role, email, and password are required'
      });
    }

    const normalizedRole = role.trim().toLowerCase();
    const normalizedEmail = email.trim().toLowerCase();

    if (!['student', 'faculty'].includes(normalizedRole)) {
      return res.status(400).json({
        message: 'Only student and faculty accounts can register'
      });
    }

    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters long'
      });
    }


    // ==========================================
    // STUDENT SIGNUP
    // ==========================================

    if (normalizedRole === 'student') {

      if (!rollNumber) {
        return res.status(400).json({
          message: 'Roll number is required'
        });
      }

      const normalizedRoll =
        rollNumber.trim().toUpperCase();

      const student = db.prepare(`
        SELECT
          u.id AS user_id,
          u.name,
          u.email,
          u.is_registered,
          s.roll_number
        FROM users u
        JOIN students s
          ON s.user_id = u.id
        WHERE LOWER(TRIM(u.email)) = ?
          AND UPPER(TRIM(s.roll_number)) = ?
          AND u.role = 'student'
      `).get(
        normalizedEmail,
        normalizedRoll
      );

      if (!student) {
        return res.status(400).json({
          message:
            'Email and roll number do not match any official student record'
        });
      }

      if (student.is_registered === 1) {
        return res.status(400).json({
          message:
            'This account is already registered. Please log in.'
        });
      }

      const passwordHash =
        bcrypt.hashSync(password, 10);

      db.prepare(`
        UPDATE users
        SET
          password_hash = ?,
          is_registered = 1
        WHERE id = ?
      `).run(
        passwordHash,
        student.user_id
      );

      return res.status(201).json({
        message:
          'Student registration successful. You can now log in.'
      });
    }


    // ==========================================
    // FACULTY SIGNUP
    // ==========================================

    if (normalizedRole === 'faculty') {

      if (!facultyCode) {
        return res.status(400).json({
          message: 'Faculty code is required'
        });
      }

      const normalizedCode =
        facultyCode.trim().toUpperCase();

      const facultyMember = db.prepare(`
        SELECT
          u.id AS user_id,
          u.name,
          u.email,
          u.is_registered,
          f.faculty_code
        FROM users u
        JOIN faculty f
          ON f.user_id = u.id
        WHERE LOWER(TRIM(u.email)) = ?
          AND UPPER(TRIM(f.faculty_code)) = ?
          AND u.role = 'faculty'
      `).get(
        normalizedEmail,
        normalizedCode
      );

      if (!facultyMember) {
        return res.status(400).json({
          message:
            'Email and faculty code do not match any official faculty record'
        });
      }

      if (facultyMember.is_registered === 1) {
        return res.status(400).json({
          message:
            'This account is already registered. Please log in.'
        });
      }

      const passwordHash =
        bcrypt.hashSync(password, 10);

      db.prepare(`
        UPDATE users
        SET
          password_hash = ?,
          is_registered = 1
        WHERE id = ?
      `).run(
        passwordHash,
        facultyMember.user_id
      );

      return res.status(201).json({
        message:
          'Faculty registration successful. You can now log in.'
      });
    }

  } catch (error) {
    console.error('Signup error:', error);

    return res.status(500).json({
      message: 'Registration failed'
    });
  }
});


// ==========================================
// POST /api/auth/login
// ==========================================

router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required'
      });
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    const user = db
      .prepare(`
        SELECT *
        FROM users
        WHERE LOWER(TRIM(email)) = ?
      `)
      .get(normalizedEmail);

    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }


    // Student and Faculty must register first

    if (
      user.role !== 'admin' &&
      (
        user.is_registered !== 1 ||
        !user.password_hash
      )
    ) {
      return res.status(403).json({
        message:
          'Account is not registered yet. Please complete registration first.'
      });
    }


    if (!user.password_hash) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }


    const passwordMatches =
      bcrypt.compareSync(
        password,
        user.password_hash
      );

    if (!passwordMatches) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }


    // Create JWT

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      {
        expiresIn: '7d'
      }
    );


    // Profile

    let profile = null;

    if (user.role === 'student') {
      profile = db
        .prepare(`
          SELECT *
          FROM students
          WHERE user_id = ?
        `)
        .get(user.id);
    }

    if (user.role === 'faculty') {
      profile = db
        .prepare(`
          SELECT *
          FROM faculty
          WHERE user_id = ?
        `)
        .get(user.id);
    }


    return res.json({
      message: 'Login successful',

      token,

      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar_url: user.avatar_url,
        is_registered: user.is_registered,
        profile
      }
    });

  } catch (error) {
    console.error('Login error:', error);

    return res.status(500).json({
      message: 'Login failed'
    });
  }
});


// ==========================================
// GET /api/auth/me
// ==========================================

router.get('/me', verifyToken, (req, res) => {

  let profile = null;

  if (req.user.role === 'student') {
    profile = req.student;
  }

  if (req.user.role === 'faculty') {
    profile = req.faculty;
  }

  res.json({
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      avatar_url: req.user.avatar_url,
      is_registered: req.user.is_registered,
      profile
    }
  });
});

module.exports = router;