const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { verifyToken } = require('../middleware/auth');

// Available to all authenticated roles (Student, Faculty, Admin)
router.use(verifyToken);

// GET /api/explorer/announcements
router.get('/announcements', (req, res) => {
  const userRole = req.user.role;
  const notices = db.prepare(`
    SELECT n.id, n.title, n.content, n.category, n.published_date, n.is_pinned,
           u.name AS author_name, u.role AS author_role
    FROM notices n
    JOIN users u ON n.author_id = u.id
    WHERE n.target_role = 'all' OR n.target_role = ?
    ORDER BY n.is_pinned DESC, n.published_date DESC
  `).all(userRole);

  res.json(notices);
});

// GET /api/explorer/events (Single Source of Truth from SQLite events table)
router.get('/events', (req, res) => {
  const events = db.prepare(`
    SELECT * FROM events
    ORDER BY date ASC
  `).all();

  // Format with consistent aliases
  const normalized = events.map(e => ({
    ...e,
    name: e.title,
    eventDate: e.date,
    location: e.venue
  }));

  res.json(normalized);
});

// GET /api/explorer/faculty-directory (Single Source of Truth from SQLite faculty table)
router.get('/faculty-directory', (req, res) => {
  const directory = db.prepare(`
    SELECT f.id, f.faculty_code, f.department, f.designation, f.office_room,
           u.name, u.email, u.avatar_url
    FROM faculty f
    JOIN users u ON f.user_id = u.id
    ORDER BY u.name ASC
  `).all();

  // Attach taught subjects
  const detailedDirectory = directory.map(f => {
    const subjects = db.prepare(`
      SELECT code, name, branch, year, section
      FROM subjects
      WHERE faculty_id = ?
    `).all(f.id);

    return {
      ...f,
      subjects
    };
  });

  res.json(detailedDirectory);
});

// GET /api/explorer/campus-info & GET /api/explorer/facilities (Single Source of Truth from SQLite facilities table)
const handleGetFacilities = (req, res) => {
  const facilities = db.prepare(`
    SELECT * FROM facilities
    ORDER BY category ASC, name ASC
  `).all();

  // Format with consistent aliases
  const normalized = facilities.map(f => ({
    ...f,
    title: f.name,
    openingHours: f.timings
  }));

  res.json(normalized);
};

router.get('/campus-info', handleGetFacilities);
router.get('/facilities', handleGetFacilities);

module.exports = router;
