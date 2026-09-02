const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { verifyToken, requireRole } = require('../middleware/auth');

// All student routes require student role
router.use(verifyToken, requireRole('student'));

// Helper to get current day of week in English
function getCurrentDayOfWeek() {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = new Date();
  return days[today.getDay()];
}

// GET /api/student/home
router.get('/home', (req, res) => {
  const student = req.student;
  if (!student) {
    return res.status(404).json({ message: 'Student profile not found' });
  }

  // 1. Student basic info
  const info = {
    name: req.user.name,
    email: req.user.email,
    rollNumber: student.roll_number,
    branch: student.branch,
    branchCode: student.branch_code,
    year: student.year,
    section: student.section,
    avatarUrl: req.user.avatar_url
  };

  // 2. Today's schedule
  // If today is weekend (Sunday/Saturday), default to Monday to demonstrate active schedule or return today's
  let currentDay = getCurrentDayOfWeek();
  if (currentDay === 'Sunday' || currentDay === 'Saturday') {
    // If weekend, show Monday's schedule for preview with a note
    currentDay = 'Monday';
  }

  const todaySchedule = db.prepare(`
    SELECT t.id, t.day_of_week, t.start_time, t.end_time, t.room,
           s.name AS subject_name, s.code AS subject_code,
           u.name AS faculty_name
    FROM timetable t
    JOIN subjects s ON t.subject_id = s.id
    JOIN faculty f ON t.faculty_id = f.id
    JOIN users u ON f.user_id = u.id
    WHERE (t.branch = ? OR t.branch = ?) AND t.year = ? AND t.section = ? AND t.day_of_week = ?
    ORDER BY t.start_time ASC
  `).all(student.branch, student.branch_code, student.year, student.section, currentDay);

  // 3. Attendance Summary from DB
  const attendanceStats = db.prepare(`
    SELECT 
      COUNT(*) AS total_records,
      SUM(CASE WHEN ar.status = 'Present' THEN 1 ELSE 0 END) AS attended_records
    FROM attendance_records ar
    JOIN attendance_sessions ses ON ar.session_id = ses.id
    WHERE ar.student_id = ?
  `).get(student.id);

  const totalConducted = attendanceStats.total_records || 0;
  const totalAttended = attendanceStats.attended_records || 0;
  const overallPercentage = totalConducted > 0 ? Math.round((totalAttended / totalConducted) * 100) : 100;

  // 4. Pending assignments
  const pendingAssignments = db.prepare(`
    SELECT a.id, a.title, a.due_date, a.max_marks,
           s.name AS subject_name, s.code AS subject_code,
           sub.status AS submission_status
    FROM assignments a
    JOIN subjects s ON a.subject_id = s.id
    LEFT JOIN submissions sub ON a.id = sub.assignment_id AND sub.student_id = ?
    WHERE (a.branch = ? OR a.branch = ?) AND a.year = ? AND a.section = ?
      AND (sub.status IS NULL OR sub.status = 'Pending')
    ORDER BY a.due_date ASC
    LIMIT 5
  `).all(student.id, student.branch, student.branch_code, student.year, student.section);

  // 5. Relevant Announcements
  const announcements = db.prepare(`
    SELECT n.id, n.title, n.content, n.category, n.published_date, n.is_pinned,
           u.name AS author_name
    FROM notices n
    JOIN users u ON n.author_id = u.id
    WHERE n.target_role IN ('all', 'student')
    ORDER BY n.is_pinned DESC, n.published_date DESC
    LIMIT 5
  `).all();

  res.json({
    student: info,
    todaySchedule: {
      day: currentDay,
      classes: todaySchedule
    },
    attendanceSummary: {
      totalAttended,
      totalConducted,
      percentage: overallPercentage
    },
    pendingAssignments,
    announcements
  });
});

// GET /api/student/timetable
router.get('/timetable', (req, res) => {
  const student = req.student;
  if (!student) {
    return res.status(404).json({ message: 'Student profile not found' });
  }

  const entries = db.prepare(`
    SELECT t.id, t.day_of_week, t.start_time, t.end_time, t.room,
           s.name AS subject_name, s.code AS subject_code, s.credits,
           u.name AS faculty_name, f.faculty_code
    FROM timetable t
    JOIN subjects s ON t.subject_id = s.id
    JOIN faculty f ON t.faculty_id = f.id
    JOIN users u ON f.user_id = u.id
    WHERE (t.branch = ? OR t.branch = ?) AND t.year = ? AND t.section = ?
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
  `).all(student.branch, student.branch_code, student.year, student.section);

  res.json({
    branch: student.branch,
    branchCode: student.branch_code,
    year: student.year,
    section: student.section,
    timetable: entries
  });
});

// GET /api/student/attendance
router.get('/attendance', (req, res) => {
  const student = req.student;
  if (!student) {
    return res.status(404).json({ message: 'Student profile not found' });
  }

  // Overall attendance calculation
  const overall = db.prepare(`
    SELECT 
      COUNT(*) AS total_conducted,
      SUM(CASE WHEN ar.status = 'Present' THEN 1 ELSE 0 END) AS total_attended
    FROM attendance_records ar
    WHERE ar.student_id = ?
  `).get(student.id);

  const totalConducted = overall.total_conducted || 0;
  const totalAttended = overall.total_attended || 0;
  const overallPercentage = totalConducted > 0 ? Math.round((totalAttended / totalConducted) * 100) : 100;

  // Subject-wise attendance from actual DB sessions and records
  // We list all subjects belonging to this student's branch/year/section
  const subjects = db.prepare(`
    SELECT s.id, s.code, s.name, s.credits, u.name AS faculty_name
    FROM subjects s
    LEFT JOIN faculty f ON s.faculty_id = f.id
    LEFT JOIN users u ON f.user_id = u.id
    WHERE (s.branch = ? OR s.branch = ?) AND s.year = ? AND s.section = ?
    ORDER BY s.code ASC
  `).all(student.branch, student.branch_code, student.year, student.section);

  const subjectAttendance = subjects.map(sub => {
    const stat = db.prepare(`
      SELECT 
        COUNT(ar.id) AS conducted,
        SUM(CASE WHEN ar.status = 'Present' THEN 1 ELSE 0 END) AS attended
      FROM attendance_sessions ses
      JOIN attendance_records ar ON ses.id = ar.session_id
      WHERE ses.subject_id = ? AND ar.student_id = ?
    `).get(sub.id, student.id);

    const conducted = stat.conducted || 0;
    const attended = stat.attended || 0;
    const percentage = conducted > 0 ? Math.round((attended / conducted) * 100) : 100;

    // Detailed class-by-class log
    const history = db.prepare(`
      SELECT ses.date, ar.status
      FROM attendance_sessions ses
      JOIN attendance_records ar ON ses.id = ar.session_id
      WHERE ses.subject_id = ? AND ar.student_id = ?
      ORDER BY ses.date DESC
    `).all(sub.id, student.id);

    return {
      subjectId: sub.id,
      subjectCode: sub.code,
      subjectName: sub.name,
      facultyName: sub.faculty_name,
      credits: sub.credits,
      classesConducted: conducted,
      classesAttended: attended,
      percentage,
      history
    };
  });

  res.json({
    overall: {
      classesConducted: totalConducted,
      classesAttended: totalAttended,
      percentage: overallPercentage
    },
    subjectWise: subjectAttendance
  });
});

// GET /api/student/assignments
router.get('/assignments', (req, res) => {
  const student = req.student;
  if (!student) {
    return res.status(404).json({ message: 'Student profile not found' });
  }

  const assignments = db.prepare(`
    SELECT a.id, a.title, a.description, a.due_date, a.max_marks, a.created_at,
           s.name AS subject_name, s.code AS subject_code,
           u.name AS faculty_name,
           sub.id AS submission_id, sub.submission_content, sub.submitted_at,
           sub.marks_obtained, sub.feedback,
           COALESCE(sub.status, 'Not Submitted') AS submission_status
    FROM assignments a
    JOIN subjects s ON a.subject_id = s.id
    JOIN faculty f ON a.faculty_id = f.id
    JOIN users u ON f.user_id = u.id
    LEFT JOIN submissions sub ON a.id = sub.assignment_id AND sub.student_id = ?
    WHERE (a.branch = ? OR a.branch = ?) AND a.year = ? AND a.section = ?
    ORDER BY a.due_date ASC
  `).all(student.id, student.branch, student.branch_code, student.year, student.section);

  res.json(assignments);
});

// POST /api/student/assignments/:id/submit
router.post('/assignments/:id/submit', (req, res) => {
  const student = req.student;
  const assignmentId = parseInt(req.params.id, 10);
  const { submissionContent } = req.body;

  if (!submissionContent || !submissionContent.trim()) {
    return res.status(400).json({ message: 'Submission content or link is required' });
  }

  // Verify assignment exists and is for this student's class
  const assignment = db.prepare(`
    SELECT * FROM assignments 
    WHERE id = ? AND (branch = ? OR branch = ?) AND year = ? AND section = ?
  `).get(assignmentId, student.branch, student.branch_code, student.year, student.section);

  if (!assignment) {
    return res.status(404).json({ message: 'Assignment not found for your class' });
  }

  // Upsert submission
  const existing = db.prepare('SELECT id FROM submissions WHERE assignment_id = ? AND student_id = ?').get(assignmentId, student.id);
  if (existing) {
    db.prepare(`
      UPDATE submissions
      SET submission_content = ?, submitted_at = CURRENT_TIMESTAMP, status = 'Submitted'
      WHERE id = ?
    `).run(submissionContent.trim(), existing.id);
  } else {
    db.prepare(`
      INSERT INTO submissions (assignment_id, student_id, submission_content, status)
      VALUES (?, ?, ?, 'Submitted')
    `).run(assignmentId, student.id, submissionContent.trim());
  }

  res.json({ message: 'Assignment submitted successfully!' });
});

module.exports = router;
