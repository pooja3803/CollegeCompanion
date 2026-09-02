const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { verifyToken, requireRole } = require('../middleware/auth');

// All faculty routes require faculty role
router.use(verifyToken, requireRole('faculty'));

// Helper for current day of week
function getCurrentDayOfWeek() {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = new Date();
  return days[today.getDay()];
}

// GET /api/faculty/home
router.get('/home', (req, res) => {
  const faculty = req.faculty;
  if (!faculty) {
    return res.status(404).json({ message: 'Faculty profile not found' });
  }

  // 1. Faculty profile details
  const profile = {
    name: req.user.name,
    email: req.user.email,
    facultyCode: faculty.faculty_code,
    department: faculty.department,
    designation: faculty.designation,
    officeRoom: faculty.office_room,
    avatarUrl: req.user.avatar_url
  };

  // 2. Today's teaching schedule
  let currentDay = getCurrentDayOfWeek();
  if (currentDay === 'Sunday' || currentDay === 'Saturday') {
    currentDay = 'Monday'; // Default to Monday for active preview
  }

  const todayClasses = db.prepare(`
    SELECT t.id, t.day_of_week, t.start_time, t.end_time, t.room,
           t.branch, t.year, t.section,
           s.name AS subject_name, s.code AS subject_code
    FROM timetable t
    JOIN subjects s ON t.subject_id = s.id
    WHERE t.faculty_id = ? AND t.day_of_week = ?
    ORDER BY t.start_time ASC
  `).all(faculty.id, currentDay);

  // 3. Assigned subjects/classes
  const assignedSubjects = db.prepare(`
    SELECT s.id, s.code, s.name, s.credits, s.branch, s.year, s.section,
           (SELECT COUNT(*) FROM students st WHERE (st.branch = s.branch OR st.branch_code = s.branch) AND st.year = s.year AND st.section = s.section) AS student_count
    FROM subjects s
    WHERE s.faculty_id = ?
    ORDER BY s.code ASC
  `).all(faculty.id);

  // 4. Assignments count
  const assignmentStats = db.prepare(`
    SELECT COUNT(*) AS total_assignments
    FROM assignments
    WHERE faculty_id = ?
  `).get(faculty.id);

  // 5. Recent Announcements
  const announcements = db.prepare(`
    SELECT n.id, n.title, n.content, n.category, n.published_date, n.is_pinned,
           u.name AS author_name
    FROM notices n
    JOIN users u ON n.author_id = u.id
    WHERE n.target_role IN ('all', 'faculty')
    ORDER BY n.is_pinned DESC, n.published_date DESC
    LIMIT 5
  `).all();

  res.json({
    faculty: profile,
    todaySchedule: {
      day: currentDay,
      classes: todayClasses
    },
    assignedSubjects,
    totalAssignments: assignmentStats.total_assignments || 0,
    announcements
  });
});

// GET /api/faculty/timetable
// ONLY logged-in faculty teaching timetable!
router.get('/timetable', (req, res) => {
  const faculty = req.faculty;
  if (!faculty) {
    return res.status(404).json({ message: 'Faculty profile not found' });
  }

  const entries = db.prepare(`
    SELECT t.id, t.day_of_week, t.start_time, t.end_time, t.room,
           t.branch, t.year, t.section,
           s.name AS subject_name, s.code AS subject_code, s.credits
    FROM timetable t
    JOIN subjects s ON t.subject_id = s.id
    WHERE t.faculty_id = ?
    ORDER BY 
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
  `).all(faculty.id);

  res.json({
    facultyName: req.user.name,
    department: faculty.department,
    designation: faculty.designation,
    timetable: entries
  });
});

// GET /api/faculty/assigned-classes
// List of classes/subjects assigned to this faculty
router.get('/assigned-classes', (req, res) => {
  const faculty = req.faculty;
  const classes = db.prepare(`
    SELECT s.id AS subject_id, s.code AS subject_code, s.name AS subject_name,
           s.branch, s.year, s.section,
           (SELECT COUNT(*) FROM students st WHERE (st.branch = s.branch OR st.branch_code = s.branch) AND st.year = s.year AND st.section = s.section) AS student_count
    FROM subjects s
    WHERE s.faculty_id = ?
    ORDER BY s.code ASC
  `).all(faculty.id);

  res.json(classes);
});

// GET /api/faculty/attendance/students
// Query students for a chosen subject & date
router.get('/attendance/students', (req, res) => {
  const faculty = req.faculty;
  const { subjectId, date } = req.query;

  if (!subjectId || !date) {
    return res.status(400).json({ message: 'subjectId and date are required' });
  }

  // Verify faculty teaches this subject
  const subject = db.prepare('SELECT * FROM subjects WHERE id = ? AND faculty_id = ?').get(subjectId, faculty.id);
  if (!subject) {
    return res.status(403).json({ message: 'You are not assigned to this subject' });
  }

  // Find all students belonging to this branch, year, section
  const students = db.prepare(`
    SELECT s.id AS student_id, s.roll_number, s.branch, s.year, s.section,
           u.name AS student_name, u.email AS student_email, u.avatar_url
    FROM students s
    JOIN users u ON s.user_id = u.id
    WHERE (s.branch = ? OR s.branch_code = ?) AND s.year = ? AND s.section = ?
    ORDER BY s.roll_number ASC
  `).all(subject.branch, subject.branch, subject.year, subject.section);

  // Check if attendance was already recorded for this session/date
  const session = db.prepare(`
    SELECT id FROM attendance_sessions 
    WHERE subject_id = ? AND date = ?
  `).get(subject.id, date);

  let recordsMap = {};
  if (session) {
    const records = db.prepare('SELECT student_id, status FROM attendance_records WHERE session_id = ?').all(session.id);
    records.forEach(r => {
      recordsMap[r.student_id] = r.status;
    });
  }

  const studentList = students.map(st => ({
    studentId: st.student_id,
    rollNumber: st.roll_number,
    studentName: st.student_name,
    studentEmail: st.student_email,
    avatarUrl: st.avatar_url,
    branch: st.branch,
    year: st.year,
    section: st.section,
    status: recordsMap[st.student_id] || 'Present' // Default to Present for ease of marking
  }));

  res.json({
    subject: {
      id: subject.id,
      code: subject.code,
      name: subject.name,
      branch: subject.branch,
      year: subject.year,
      section: subject.section
    },
    date,
    sessionId: session ? session.id : null,
    isAlreadySaved: !!session,
    students: studentList
  });
});

// POST /api/faculty/attendance/save
// Save attendance session and student attendance
router.post('/attendance/save', (req, res) => {
  const faculty = req.faculty;
  const { subjectId, date, attendance } = req.body;

  if (!subjectId || !date || !attendance || !Array.isArray(attendance)) {
    return res.status(400).json({ message: 'subjectId, date, and attendance array are required' });
  }

  // Verify faculty teaches subject
  const subject = db.prepare('SELECT * FROM subjects WHERE id = ? AND faculty_id = ?').get(subjectId, faculty.id);
  if (!subject) {
    return res.status(403).json({ message: 'You are not assigned to this subject' });
  }

  const saveTx = db.transaction(() => {
    // Find or create session
    let session = db.prepare(`
      SELECT id FROM attendance_sessions 
      WHERE subject_id = ? AND date = ?
    `).get(subject.id, date);

    let sessionId;
    if (!session) {
      const result = db.prepare(`
        INSERT INTO attendance_sessions (subject_id, faculty_id, branch, year, section, date)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(subject.id, faculty.id, subject.branch, subject.year, subject.section, date);
      sessionId = result.lastInsertRowid;
    } else {
      sessionId = session.id;
    }

    // Delete existing records for this session to update cleanly
    db.prepare('DELETE FROM attendance_records WHERE session_id = ?').run(sessionId);

    // Insert updated records
    const insertRecord = db.prepare(`
      INSERT INTO attendance_records (session_id, student_id, status, date)
      VALUES (?, ?, ?, ?)
    `);

    for (const item of attendance) {
      insertRecord.run(sessionId, item.studentId, item.status, date);
    }

    return sessionId;
  });

  saveTx();

  res.json({ message: 'Attendance saved successfully', totalMarked: attendance.length });
});

// GET /api/faculty/assignments
router.get('/assignments', (req, res) => {
  const faculty = req.faculty;
  const assignments = db.prepare(`
    SELECT a.id, a.title, a.description, a.due_date, a.max_marks, a.created_at,
           a.branch, a.year, a.section,
           s.name AS subject_name, s.code AS subject_code,
           (SELECT COUNT(*) FROM students st WHERE (st.branch = a.branch OR st.branch_code = a.branch) AND st.year = a.year AND st.section = a.section) AS total_students,
           (SELECT COUNT(*) FROM submissions sub WHERE sub.assignment_id = a.id) AS total_submissions,
           (SELECT COUNT(*) FROM submissions sub WHERE sub.assignment_id = a.id AND sub.status = 'Graded') AS total_graded
    FROM assignments a
    JOIN subjects s ON a.subject_id = s.id
    WHERE a.faculty_id = ?
    ORDER BY a.created_at DESC
  `).all(faculty.id);

  res.json(assignments);
});

// POST /api/faculty/assignments
// Create assignment for a subject taught by faculty
router.post('/assignments', (req, res) => {
  const faculty = req.faculty;
  const { subjectId, title, description, dueDate, maxMarks } = req.body;

  if (!subjectId || !title || !dueDate) {
    return res.status(400).json({ message: 'subjectId, title, and dueDate are required' });
  }

  const subject = db.prepare('SELECT * FROM subjects WHERE id = ? AND faculty_id = ?').get(subjectId, faculty.id);
  if (!subject) {
    return res.status(403).json({ message: 'You are not assigned to this subject' });
  }

  const result = db.prepare(`
    INSERT INTO assignments (subject_id, faculty_id, branch, year, section, title, description, due_date, max_marks)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    subject.id,
    faculty.id,
    subject.branch,
    subject.year,
    subject.section,
    title.trim(),
    description ? description.trim() : '',
    dueDate,
    parseInt(maxMarks, 10) || 100
  );

  res.status(201).json({ message: 'Assignment created successfully', assignmentId: result.lastInsertRowid });
});

// GET /api/faculty/assignments/:id/submissions
// View all students in class and their submissions
router.get('/assignments/:id/submissions', (req, res) => {
  const faculty = req.faculty;
  const assignmentId = parseInt(req.params.id, 10);

  const assignment = db.prepare(`
    SELECT a.*, s.name AS subject_name, s.code AS subject_code
    FROM assignments a
    JOIN subjects s ON a.subject_id = s.id
    WHERE a.id = ? AND a.faculty_id = ?
  `).get(assignmentId, faculty.id);

  if (!assignment) {
    return res.status(404).json({ message: 'Assignment not found' });
  }

  // Get all students enrolled in this branch/year/section
  const students = db.prepare(`
    SELECT st.id AS student_id, st.roll_number, u.name AS student_name, u.email AS student_email,
           sub.id AS submission_id, sub.submission_content, sub.submitted_at,
           sub.marks_obtained, sub.feedback,
           COALESCE(sub.status, 'Not Submitted') AS submission_status
    FROM students st
    JOIN users u ON st.user_id = u.id
    LEFT JOIN submissions sub ON sub.assignment_id = ? AND sub.student_id = st.id
    WHERE (st.branch = ? OR st.branch_code = ?) AND st.year = ? AND st.section = ?
    ORDER BY st.roll_number ASC
  `).all(assignment.id, assignment.branch, assignment.branch, assignment.year, assignment.section);

  res.json({
    assignment,
    students
  });
});

// POST /api/faculty/submissions/:id/grade
// Grade a student submission (or assign grade directly)
router.post('/submissions/grade', (req, res) => {
  const faculty = req.faculty;
  const { assignmentId, studentId, marksObtained, feedback } = req.body;

  if (!assignmentId || !studentId || marksObtained === undefined || marksObtained === null) {
    return res.status(400).json({ message: 'assignmentId, studentId, and marksObtained are required' });
  }

  // Verify faculty owns the assignment
  const assignment = db.prepare('SELECT * FROM assignments WHERE id = ? AND faculty_id = ?').get(assignmentId, faculty.id);
  if (!assignment) {
    return res.status(403).json({ message: 'You cannot grade assignments you did not create' });
  }

  const marks = parseFloat(marksObtained);
  if (isNaN(marks) || marks < 0 || marks > assignment.max_marks) {
    return res.status(400).json({ message: `Marks must be between 0 and ${assignment.max_marks}` });
  }

  // Upsert submission with grade
  const existing = db.prepare('SELECT id FROM submissions WHERE assignment_id = ? AND student_id = ?').get(assignmentId, studentId);
  if (existing) {
    db.prepare(`
      UPDATE submissions
      SET marks_obtained = ?, feedback = ?, status = 'Graded'
      WHERE id = ?
    `).run(marks, feedback || '', existing.id);
  } else {
    db.prepare(`
      INSERT INTO submissions (assignment_id, student_id, submission_content, marks_obtained, feedback, status)
      VALUES (?, ?, 'Direct Grade by Faculty', ?, ?, 'Graded')
    `).run(assignmentId, studentId, marks, feedback || '');
  }

  res.json({ message: 'Grade saved successfully' });
});

module.exports = router;
