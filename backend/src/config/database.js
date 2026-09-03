const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '../../database.sqlite');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Safe migration function to adapt existing database without data loss
function migrateDatabase() {
  const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get();
  if (tableCheck) {
    const columns = db.prepare("PRAGMA table_info(users)").all();
    const hasIsRegistered = columns.some(col => col.name === 'is_registered');
    const pwdCol = columns.find(col => col.name === 'password_hash');
    const pwdIsNotNull = pwdCol && pwdCol.notnull === 1;

    if (!hasIsRegistered || pwdIsNotNull) {
      console.log('🔄 Migrating users table to support nullable password_hash and is_registered...');
      db.pragma('foreign_keys = OFF');
      db.transaction(() => {
        db.exec(`
          CREATE TABLE users_temp (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT,
            role TEXT CHECK(role IN ('student', 'faculty', 'admin')) NOT NULL,
            avatar_url TEXT,
            is_registered INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );

          INSERT INTO users_temp (id, name, email, password_hash, role, avatar_url, is_registered, created_at)
          SELECT 
            id, 
            name, 
            email, 
            password_hash, 
            role, 
            avatar_url, 
            ${hasIsRegistered ? 'COALESCE(is_registered, 0)' : '0'}, 
            created_at 
          FROM users;

          DROP TABLE users;
          ALTER TABLE users_temp RENAME TO users;
        `);
      })();
      db.pragma('foreign_keys = ON');
      console.log('✅ Users table migration completed successfully.');
    }
  }
}

// Initialize tables
function initializeDatabase() {
  migrateDatabase();

  const schema = `
    -- Users table (All roles: student, faculty, admin)
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      role TEXT CHECK(role IN ('student', 'faculty', 'admin')) NOT NULL,
      avatar_url TEXT,
      is_registered INTEGER DEFAULT 0,
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
}

initializeDatabase();

module.exports = db;
