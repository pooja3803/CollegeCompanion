const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, '../../database.sqlite');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize tables
function initializeDatabase() {
  const schema = `
    -- Users table (All roles: student, faculty, admin)
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT CHECK(role IN ('student', 'faculty', 'admin')) NOT NULL,
      avatar_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Students table
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      roll_number TEXT UNIQUE NOT NULL,
      branch TEXT NOT NULL,
      branch_code TEXT NOT NULL,
      year INTEGER NOT NULL,
      section TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Faculty table
    CREATE TABLE IF NOT EXISTS faculty (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      faculty_code TEXT UNIQUE NOT NULL,
      department TEXT NOT NULL,
      designation TEXT NOT NULL,
      office_room TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Subjects table
    CREATE TABLE IF NOT EXISTS subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      credits INTEGER NOT NULL DEFAULT 4,
      department TEXT NOT NULL,
      faculty_id INTEGER,
      branch TEXT NOT NULL,
      year INTEGER NOT NULL,
      section TEXT NOT NULL,
      FOREIGN KEY (faculty_id) REFERENCES faculty(id) ON DELETE SET NULL,
      UNIQUE(code, branch, year, section)
    );

    -- Timetable table
    CREATE TABLE IF NOT EXISTS timetable (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch TEXT NOT NULL,
      year INTEGER NOT NULL,
      section TEXT NOT NULL,
      subject_id INTEGER NOT NULL,
      faculty_id INTEGER NOT NULL,
      day_of_week TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      room TEXT NOT NULL,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
      FOREIGN KEY (faculty_id) REFERENCES faculty(id) ON DELETE CASCADE
    );

    -- Attendance Sessions
    CREATE TABLE IF NOT EXISTS attendance_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subject_id INTEGER NOT NULL,
      faculty_id INTEGER NOT NULL,
      branch TEXT NOT NULL,
      year INTEGER NOT NULL,
      section TEXT NOT NULL,
      date TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
      FOREIGN KEY (faculty_id) REFERENCES faculty(id) ON DELETE CASCADE,
      UNIQUE(subject_id, branch, year, section, date)
    );

    -- Attendance Records
    CREATE TABLE IF NOT EXISTS attendance_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      status TEXT CHECK(status IN ('Present', 'Absent')) NOT NULL,
      date TEXT NOT NULL,
      FOREIGN KEY (session_id) REFERENCES attendance_sessions(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      UNIQUE(session_id, student_id)
    );

    -- Assignments table
    CREATE TABLE IF NOT EXISTS assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subject_id INTEGER NOT NULL,
      faculty_id INTEGER NOT NULL,
      branch TEXT NOT NULL,
      year INTEGER NOT NULL,
      section TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      due_date TEXT NOT NULL,
      max_marks INTEGER NOT NULL DEFAULT 100,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
      FOREIGN KEY (faculty_id) REFERENCES faculty(id) ON DELETE CASCADE
    );

    -- Submissions table
    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assignment_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      submission_content TEXT NOT NULL,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      marks_obtained REAL,
      feedback TEXT,
      status TEXT CHECK(status IN ('Submitted', 'Graded')) DEFAULT 'Submitted',
      FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      UNIQUE(assignment_id, student_id)
    );

    -- College Notices / Announcements
    CREATE TABLE IF NOT EXISTS notices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'General',
      target_role TEXT CHECK(target_role IN ('all', 'student', 'faculty')) NOT NULL DEFAULT 'all',
      author_id INTEGER NOT NULL,
      published_date TEXT NOT NULL,
      is_pinned INTEGER DEFAULT 0,
      FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Campus Events (for Explorer & Admin Management)
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      venue TEXT NOT NULL,
      organizer TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Campus Facilities (for Explorer & Admin Management)
    CREATE TABLE IF NOT EXISTS facilities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      location TEXT NOT NULL,
      timings TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `;

  db.exec(schema);

  // Auto-seed baseline data if empty so database is always fully populated
  const usersCount = db.prepare('SELECT count(*) as c FROM users').get().c;
  const eventsCount = db.prepare('SELECT count(*) as c FROM events').get().c;
  const facilitiesCount = db.prepare('SELECT count(*) as c FROM facilities').get().c;

  if (usersCount === 0 || eventsCount === 0 || facilitiesCount === 0) {
    try {
      require('../seeds/seedData');
    } catch (e) {
      console.log('Seed initialization check:', e.message);
    }
  }
}

initializeDatabase();

module.exports = db;
