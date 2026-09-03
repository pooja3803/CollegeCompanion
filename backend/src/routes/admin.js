const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { verifyToken, requireRole } = require('../middleware/auth');

// All admin routes strictly require authentication and admin role
router.use(verifyToken, requireRole('admin'));

// GET /api/admin/stats
router.get('/stats', (req, res) => {
  const totalStudents = db.prepare('SELECT COUNT(*) AS count FROM students').get().count;
  const totalFaculty = db.prepare('SELECT COUNT(*) AS count FROM faculty').get().count;
  const totalSubjects = db.prepare('SELECT COUNT(*) AS count FROM subjects').get().count;
  const totalTimetableSlots = db.prepare('SELECT COUNT(*) AS count FROM timetable').get().count;
  const totalNotices = db.prepare('SELECT COUNT(*) AS count FROM notices').get().count;
  const totalEvents = db.prepare('SELECT COUNT(*) AS count FROM events').get().count;
  const totalFacilities = db.prepare('SELECT COUNT(*) AS count FROM facilities').get().count;

  res.json({
    totalStudents,
    totalFaculty,
    totalSubjects,
    totalTimetableSlots,
    totalNotices,
    totalEvents,
    totalFacilities
  });
});

// ==========================================
// 1. STUDENTS MANAGEMENT
// ==========================================

// GET /api/admin/students
router.get('/students', (req, res) => {
  const students = db.prepare(`
    SELECT s.id, s.roll_number, s.branch, s.branch_code, s.year, s.section,
           u.id AS user_id, u.name, u.email, u.avatar_url, u.is_registered, u.created_at
    FROM students s
    JOIN users u ON s.user_id = u.id
    ORDER BY s.year ASC, s.branch_code ASC, s.section ASC, s.roll_number ASC
  `).all();

  res.json(students);
});

// POST /api/admin/students (Add new student - password_hash = NULL, is_registered = 0)
router.post('/students', (req, res) => {
  const { name, email, rollNumber, branch, branchCode, year, section } = req.body;

  if (!name || !email || !rollNumber || !branch || !year || !section) {
    return res.status(400).json({ message: 'All required student fields must be provided' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedRoll = rollNumber.trim().toUpperCase();

  const existing = db.prepare('SELECT id FROM users WHERE LOWER(TRIM(email)) = ?').get(normalizedEmail);
  if (existing) {
    return res.status(400).json({ message: 'User with this email already exists' });
  }

  const existingRoll = db.prepare('SELECT id FROM students WHERE UPPER(TRIM(roll_number)) = ?').get(normalizedRoll);
  if (existingRoll) {
    return res.status(400).json({ message: 'Student with this roll number already exists' });
  }

  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${normalizedRoll}`;

  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password_hash, role, avatar_url, is_registered)
    VALUES (?, ?, NULL, 'student', ?, 0)
  `);

  const insertStudent = db.prepare(`
    INSERT INTO students (user_id, roll_number, branch, branch_code, year, section)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const tx = db.transaction(() => {
    const userResult = insertUser.run(name.trim(), normalizedEmail, avatarUrl);
    const userId = userResult.lastInsertRowid;
    const resolvedBranchCode = branchCode ? branchCode.trim().toUpperCase() : branch.trim().toUpperCase();
    insertStudent.run(
      userId,
      normalizedRoll,
      branch.trim(),
      resolvedBranchCode,
      parseInt(year, 10),
      section.trim().toUpperCase()
    );
    return userId;
  });

  try {
    const newUserId = tx();
    res.status(201).json({ message: 'Student created successfully (pending first-time signup)', userId: newUserId });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create student: ' + err.message });
  }
});

// DELETE /api/admin/students/:id (Deletes user + cascades to student)
router.delete('/students/:id', (req, res) => {
  const studentId = parseInt(req.params.id, 10);
  const student = db.prepare('SELECT user_id, roll_number FROM students WHERE id = ?').get(studentId);

  if (!student) {
    return res.status(404).json({ message: 'Student not found' });
  }

  db.prepare('DELETE FROM users WHERE id = ?').run(student.user_id);
  res.json({ message: `Student ${student.roll_number} deleted successfully` });
});

// ==========================================
// 2. FACULTY MANAGEMENT
// ==========================================

// GET /api/admin/faculty
router.get('/faculty', (req, res) => {
  const facultyList = db.prepare(`
    SELECT f.id, f.faculty_code, f.department, f.designation, f.office_room,
           u.id AS user_id, u.name, u.email, u.avatar_url, u.is_registered, u.created_at
    FROM faculty f
    JOIN users u ON f.user_id = u.id
    ORDER BY u.name ASC
  `).all();

  // Attach taught subjects
  const detailed = facultyList.map(f => {
    const taught = db.prepare('SELECT id, code, name, branch, year, section FROM subjects WHERE faculty_id = ?').all(f.id);
    return {
      ...f,
      taughtSubjects: taught
    };
  });

  res.json(detailed);
});

// POST /api/admin/faculty (Add new faculty - password_hash = NULL, is_registered = 0)
router.post('/faculty', (req, res) => {
  const { name, email, facultyCode, department, designation, officeRoom } = req.body;

  if (!name || !email || !facultyCode || !department) {
    return res.status(400).json({ message: 'Name, email, faculty code, and department are required' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedCode = facultyCode.trim().toUpperCase();

  const existing = db.prepare('SELECT id FROM users WHERE LOWER(TRIM(email)) = ?').get(normalizedEmail);
  if (existing) {
    return res.status(400).json({ message: 'User with this email already exists' });
  }

  const existingCode = db.prepare('SELECT id FROM faculty WHERE UPPER(TRIM(faculty_code)) = ?').get(normalizedCode);
  if (existingCode) {
    return res.status(400).json({ message: 'Faculty code already exists' });
  }

  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${normalizedCode}`;

  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password_hash, role, avatar_url, is_registered)
    VALUES (?, ?, NULL, 'faculty', ?, 0)
  `);

  const insertFaculty = db.prepare(`
    INSERT INTO faculty (user_id, faculty_code, department, designation, office_room)
    VALUES (?, ?, ?, ?, ?)
  `);

  const tx = db.transaction(() => {
    const userResult = insertUser.run(name.trim(), normalizedEmail, avatarUrl);
    const userId = userResult.lastInsertRowid;
    insertFaculty.run(
      userId,
      normalizedCode,
      department.trim(),
      designation ? designation.trim() : 'Assistant Professor',
      officeRoom ? officeRoom.trim() : 'CC3-301'
    );
    return userId;
  });

  try {
    const newUserId = tx();
    res.status(201).json({ message: 'Faculty created successfully (pending first-time signup)', userId: newUserId });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create faculty: ' + err.message });
  }
});

// DELETE /api/admin/faculty/:id
router.delete('/faculty/:id', (req, res) => {
  const facultyId = parseInt(req.params.id, 10);
  const fac = db.prepare('SELECT user_id, faculty_code FROM faculty WHERE id = ?').get(facultyId);

  if (!fac) {
    return res.status(404).json({ message: 'Faculty not found' });
  }

  db.prepare('DELETE FROM users WHERE id = ?').run(fac.user_id);
  res.json({ message: `Faculty ${fac.faculty_code} deleted successfully` });
});

// ==========================================
// 3. SUBJECTS MANAGEMENT
// ==========================================

// GET /api/admin/subjects
router.get('/subjects', (req, res) => {
  const subjects = db.prepare(`
    SELECT s.id, s.code, s.name, s.credits, s.department, s.branch, s.year, s.section,
           f.id AS faculty_id, f.faculty_code,
           u.name AS faculty_name, u.email AS faculty_email
    FROM subjects s
    LEFT JOIN faculty f ON s.faculty_id = f.id
    LEFT JOIN users u ON f.user_id = u.id
    ORDER BY s.branch ASC, s.year ASC, s.section ASC, s.code ASC
  `).all();

  res.json(subjects);
});

// POST /api/admin/subjects
router.post('/subjects', (req, res) => {
  const { code, name, credits, department, facultyId, branch, year, section } = req.body;

  if (!code || !name || !branch || !year || !section) {
    return res.status(400).json({ message: 'Code, name, branch, year, and section are required' });
  }

  try {
    const result = db.prepare(`
      INSERT INTO subjects (code, name, credits, department, faculty_id, branch, year, section)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      code.trim().toUpperCase(),
      name.trim(),
      parseInt(credits, 10) || 4,
      department ? department.trim() : 'Information Technology',
      facultyId ? parseInt(facultyId, 10) : null,
      branch.trim().toUpperCase(),
      parseInt(year, 10),
      section.trim().toUpperCase()
    );

    res.status(201).json({ message: 'Subject added successfully', subjectId: result.lastInsertRowid });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ message: 'Subject with this code already exists for this branch/year/section' });
    }
    return res.status(500).json({ message: 'Failed to add subject: ' + err.message });
  }
});

// DELETE /api/admin/subjects/:id
router.delete('/subjects/:id', (req, res) => {
  const subjectId = parseInt(req.params.id, 10);
  const subject = db.prepare('SELECT id, code, name FROM subjects WHERE id = ?').get(subjectId);

  if (!subject) {
    return res.status(404).json({ message: 'Subject not found' });
  }

  db.prepare('DELETE FROM subjects WHERE id = ?').run(subjectId);
  res.json({ message: `Subject "${subject.code} - ${subject.name}" deleted successfully` });
});

// ==========================================
// 4. TIMETABLE MANAGEMENT
// ==========================================

// GET /api/admin/timetable
router.get('/timetable', (req, res) => {
  const entries = db.prepare(`
    SELECT t.id, t.branch, t.year, t.section, t.day_of_week, t.start_time, t.end_time, t.room,
           s.id AS subject_id, s.code AS subject_code, s.name AS subject_name,
           f.id AS faculty_id, f.faculty_code,
           u.name AS faculty_name
    FROM timetable t
    JOIN subjects s ON t.subject_id = s.id
    JOIN faculty f ON t.faculty_id = f.id
    JOIN users u ON f.user_id = u.id
    ORDER BY 
      t.branch ASC, t.year ASC, t.section ASC,
      CASE t.day_of_week
        WHEN 'Monday' THEN 1
        WHEN 'Tuesday' THEN 2
        WHEN 'Wednesday' THEN 3
        WHEN 'Thursday' THEN 4
        WHEN 'Friday' THEN 5
        WHEN 'Saturday' THEN 6
        WHEN 'Sunday' THEN 7
      END,
      t.start_time ASC
  `).all();

  res.json(entries);
});

// POST /api/admin/timetable
router.post('/timetable', (req, res) => {
  const { branch, year, section, subjectId, facultyId, dayOfWeek, startTime, endTime, room } = req.body;

  if (!branch || !year || !section || !subjectId || !facultyId || !dayOfWeek || !startTime || !endTime || !room) {
    return res.status(400).json({ message: 'All timetable slot fields are required' });
  }

  const result = db.prepare(`
    INSERT INTO timetable (branch, year, section, subject_id, faculty_id, day_of_week, start_time, end_time, room)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    branch.trim().toUpperCase(),
    parseInt(year, 10),
    section.trim().toUpperCase(),
    parseInt(subjectId, 10),
    parseInt(facultyId, 10),
    dayOfWeek,
    startTime,
    endTime,
    room.trim()
  );

  res.status(201).json({ message: 'Timetable entry created successfully', entryId: result.lastInsertRowid });
});

// DELETE /api/admin/timetable/:id
router.delete('/timetable/:id', (req, res) => {
  const entryId = parseInt(req.params.id, 10);
  const entry = db.prepare('SELECT id FROM timetable WHERE id = ?').get(entryId);

  if (!entry) {
    return res.status(404).json({ message: 'Timetable entry not found' });
  }

  db.prepare('DELETE FROM timetable WHERE id = ?').run(entryId);
  res.json({ message: 'Timetable entry deleted successfully' });
});

// ==========================================
// 5. NOTICES MANAGEMENT
// ==========================================

// GET /api/admin/notices
router.get('/notices', (req, res) => {
  const notices = db.prepare(`
    SELECT n.id, n.title, n.content, n.category, n.target_role, n.published_date, n.is_pinned,
           u.name AS author_name
    FROM notices n
    JOIN users u ON n.author_id = u.id
    ORDER BY n.is_pinned DESC, n.published_date DESC
  `).all();

  res.json(notices);
});

// POST /api/admin/notices
router.post('/notices', (req, res) => {
  const { title, content, category, targetRole, isPinned } = req.body;

  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required' });
  }

  const todayStr = new Date().toISOString().split('T')[0];

  const result = db.prepare(`
    INSERT INTO notices (title, content, category, target_role, author_id, published_date, is_pinned)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    title.trim(),
    content.trim(),
    category || 'General',
    targetRole || 'all',
    req.user.id,
    todayStr,
    isPinned ? 1 : 0
  );

  res.status(201).json({ message: 'Notice posted successfully', noticeId: result.lastInsertRowid });
});

// DELETE /api/admin/notices/:id
router.delete('/notices/:id', (req, res) => {
  const noticeId = parseInt(req.params.id, 10);
  const notice = db.prepare('SELECT id FROM notices WHERE id = ?').get(noticeId);

  if (!notice) {
    return res.status(404).json({ message: 'Notice not found' });
  }

  db.prepare('DELETE FROM notices WHERE id = ?').run(noticeId);
  res.json({ message: 'Notice deleted successfully' });
});

// ==========================================
// 6. CAMPUS EVENTS & FESTS MANAGEMENT
// ==========================================

// GET /api/admin/events
router.get('/events', (req, res) => {
  const events = db.prepare('SELECT * FROM events ORDER BY date ASC').all();
  const normalized = events.map(e => ({
    ...e,
    name: e.title,
    eventDate: e.date,
    location: e.venue
  }));
  res.json(normalized);
});

// POST /api/admin/events
router.post('/events', (req, res) => {
  const { title, name, category, description, date, eventDate, time, venue, location, organizer } = req.body;
  const finalTitle = (title || name || '').trim();
  const finalDate = date || eventDate;
  const finalVenue = (venue || location || '').trim();
  const finalDescription = (description || '').trim();

  if (!finalTitle) {
    return res.status(400).json({ message: 'Event title is required' });
  }
  if (!finalDate) {
    return res.status(400).json({ message: 'Event date is required' });
  }
  if (!finalVenue) {
    return res.status(400).json({ message: 'Event venue/location is required' });
  }
  if (!finalDescription) {
    return res.status(400).json({ message: 'Event description is required' });
  }

  try {
    const result = db.prepare(`
      INSERT INTO events (title, description, category, date, time, venue, organizer)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      finalTitle,
      finalDescription,
      category ? category.trim() : 'General',
      finalDate,
      time || '10:00 AM',
      finalVenue,
      organizer ? organizer.trim() : 'IIIT Allahabad'
    );

    res.status(201).json({ message: 'Event added successfully', eventId: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ message: 'Failed to add event: ' + err.message });
  }
});

// PUT /api/admin/events/:id
router.put('/events/:id', (req, res) => {
  const eventId = parseInt(req.params.id, 10);
  const { title, name, category, description, date, eventDate, time, venue, location, organizer } = req.body;

  const event = db.prepare('SELECT id FROM events WHERE id = ?').get(eventId);
  if (!event) {
    return res.status(404).json({ message: 'Event not found' });
  }

  const finalTitle = (title || name || '').trim();
  const finalDate = date || eventDate;
  const finalVenue = (venue || location || '').trim();
  const finalDescription = (description || '').trim();

  if (!finalTitle || !finalDate || !finalVenue || !finalDescription) {
    return res.status(400).json({ message: 'Title, date, venue, and description are required' });
  }

  try {
    db.prepare(`
      UPDATE events
      SET title = ?, category = ?, description = ?, date = ?, time = ?, venue = ?, organizer = ?
      WHERE id = ?
    `).run(
      finalTitle,
      category ? category.trim() : 'General',
      finalDescription,
      finalDate,
      time || '10:00 AM',
      finalVenue,
      organizer ? organizer.trim() : 'IIIT Allahabad',
      eventId
    );

    res.json({ message: 'Event updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update event: ' + err.message });
  }
});

// DELETE /api/admin/events/:id
router.delete('/events/:id', (req, res) => {
  const eventId = parseInt(req.params.id, 10);
  const event = db.prepare('SELECT id FROM events WHERE id = ?').get(eventId);

  if (!event) {
    return res.status(404).json({ message: 'Event not found' });
  }

  db.prepare('DELETE FROM events WHERE id = ?').run(eventId);
  res.json({ message: 'Event deleted successfully' });
});

// ==========================================
// 7. CAMPUS FACILITIES MANAGEMENT
// ==========================================

// GET /api/admin/facilities
router.get('/facilities', (req, res) => {
  const facilities = db.prepare('SELECT * FROM facilities ORDER BY category ASC, name ASC').all();
  const normalized = facilities.map(f => ({
    ...f,
    title: f.name,
    openingHours: f.timings
  }));
  res.json(normalized);
});

// POST /api/admin/facilities
router.post('/facilities', (req, res) => {
  const { name, title, category, description, location, timings, openingHours } = req.body;
  const finalName = (name || title || '').trim();
  const finalLocation = (location || '').trim();
  const finalDescription = (description || '').trim();
  const finalTimings = (timings || openingHours || '09:00 AM - 05:00 PM').trim();

  if (!finalName) {
    return res.status(400).json({ message: 'Facility name is required' });
  }
  if (!finalLocation) {
    return res.status(400).json({ message: 'Facility location is required' });
  }
  if (!finalDescription) {
    return res.status(400).json({ message: 'Facility description is required' });
  }

  try {
    const result = db.prepare(`
      INSERT INTO facilities (name, category, description, location, timings)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      finalName,
      category ? category.trim() : 'General',
      finalDescription,
      finalLocation,
      finalTimings
    );

    res.status(201).json({ message: 'Facility added successfully', facilityId: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ message: 'Failed to add facility: ' + err.message });
  }
});

// PUT /api/admin/facilities/:id
router.put('/facilities/:id', (req, res) => {
  const facilityId = parseInt(req.params.id, 10);
  const { name, title, category, description, location, timings, openingHours } = req.body;

  const facility = db.prepare('SELECT id FROM facilities WHERE id = ?').get(facilityId);
  if (!facility) {
    return res.status(404).json({ message: 'Facility not found' });
  }

  const finalName = (name || title || '').trim();
  const finalLocation = (location || '').trim();
  const finalDescription = (description || '').trim();
  const finalTimings = (timings || openingHours || '09:00 AM - 05:00 PM').trim();

  if (!finalName || !finalLocation || !finalDescription) {
    return res.status(400).json({ message: 'Facility name, location, and description are required' });
  }

  try {
    db.prepare(`
      UPDATE facilities
      SET name = ?, category = ?, description = ?, location = ?, timings = ?
      WHERE id = ?
    `).run(
      finalName,
      category ? category.trim() : 'General',
      finalDescription,
      finalLocation,
      finalTimings,
      facilityId
    );

    res.json({ message: 'Facility updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update facility: ' + err.message });
  }
});

// DELETE /api/admin/facilities/:id
router.delete('/facilities/:id', (req, res) => {
  const facilityId = parseInt(req.params.id, 10);
  const facility = db.prepare('SELECT id FROM facilities WHERE id = ?').get(facilityId);

  if (!facility) {
    return res.status(404).json({ message: 'Facility not found' });
  }

  db.prepare('DELETE FROM facilities WHERE id = ?').run(facilityId);
  res.json({ message: 'Facility deleted successfully' });
});

module.exports = router;
