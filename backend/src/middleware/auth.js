const jwt = require('jsonwebtoken');
const db = require('../config/database');

const JWT_SECRET =
  process.env.JWT_SECRET || 'iiita_companion_super_secret_key_2026';

function verifyToken(req, res, next) {
  let token = null;

  const authHeader =
    req.headers.authorization ||
    req.headers.Authorization ||
    req.headers['x-access-token'];

  if (authHeader) {
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else {
      token = authHeader.trim();
    }
  }

  if (!token && req.query?.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({
      message: 'Unauthorized: No token provided'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = db
      .prepare(`
        SELECT
          id,
          name,
          email,
          role,
          avatar_url,
          is_registered
        FROM users
        WHERE id = ?
      `)
      .get(decoded.id);

    if (!user) {
      return res.status(401).json({
        message: 'User no longer exists'
      });
    }

    req.user = user;

    if (user.role === 'student') {
      req.student = db
        .prepare(`
          SELECT *
          FROM students
          WHERE user_id = ?
        `)
        .get(user.id);
    }

    if (user.role === 'faculty') {
      req.faculty = db
        .prepare(`
          SELECT *
          FROM faculty
          WHERE user_id = ?
        `)
        .get(user.id);
    }

    next();

  } catch (error) {
    console.error('Token verification error:', error.message);

    return res.status(401).json({
      message: 'Invalid or expired token'
    });
  }
}

function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: 'Authentication required'
      });
    }

    const roles = Array.isArray(allowedRoles)
      ? allowedRoles
      : [allowedRoles];

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Requires role: ${roles.join(' or ')}`
      });
    }

    next();
  };
}

module.exports = {
  verifyToken,
  requireRole,
  JWT_SECRET
};