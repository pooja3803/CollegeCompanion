const jwt = require('jsonwebtoken');
const db = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'iiita_companion_super_secret_key_2026';

function verifyToken(req, res, next) {
  let token = null;

  // 1. Check Authorization header
  const authHeader = req.headers.authorization || req.headers.Authorization || req.headers['x-access-token'];
  if (authHeader) {
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else {
      token = authHeader.trim();
    }
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Fetch user details from database
    const user = db.prepare('SELECT id, name, email, role, avatar_url FROM users WHERE id = ?').get(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }

    req.user = user;

    // Attach student or faculty profile if exists
    if (user.role === 'student') {
      const studentProfile = db.prepare('SELECT * FROM students WHERE user_id = ?').get(user.id);
      req.student = studentProfile;
    } else if (user.role === 'faculty') {
      const facultyProfile = db.prepare('SELECT * FROM faculty WHERE user_id = ?').get(user.id);
      req.faculty = facultyProfile;
    }

    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Access denied. Requires role: ${roles.join(' or ')}` });
    }

    next();
  };
}

module.exports = {
  verifyToken,
  requireRole,
  JWT_SECRET
};
