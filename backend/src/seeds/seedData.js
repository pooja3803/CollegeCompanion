const bcrypt = require('bcryptjs');
const db = require('../config/database');

async function seed() {
  console.log('Seeding database with IIIT Allahabad data...');

  // Clear existing data in foreign-key-safe order
  db.exec(`
    DELETE FROM submissions;
    DELETE FROM assignments;
    DELETE FROM attendance_records;
    DELETE FROM attendance_sessions;
    DELETE FROM timetable;
    DELETE FROM subjects;
    DELETE FROM notices;
    DELETE FROM events;
    DELETE FROM facilities;
    DELETE FROM students;
    DELETE FROM faculty;
    DELETE FROM users;
  `);

  // ==========================================
  // PREPARED STATEMENTS
  // ==========================================

  const insertUser = db.prepare(`
    INSERT INTO users (
      name,
      email,
      password_hash,
      role,
      avatar_url,
      is_registered
    )
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertStudent = db.prepare(`
    INSERT INTO students (
      user_id,
      roll_number,
      branch,
      branch_code,
      year,
      section
    )
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertFaculty = db.prepare(`
    INSERT INTO faculty (
      user_id,
      faculty_code,
      department,
      designation,
      office_room
    )
    VALUES (?, ?, ?, ?, ?)
  `);

  // ==========================================
  // 1. ADMIN ACCOUNT
  // Admin can directly log in
  // ==========================================

  const adminPasswordHash = bcrypt.hashSync('password123', 10);

  const adminId = insertUser.run(
    'Admin Office',
    'admin@iiita.ac.in',
    adminPasswordHash,
    'admin',
    'https://api.dicebear.com/7.x/bottts/svg?seed=admin',
    1
  ).lastInsertRowid;

  console.log('Admin account created');

  // ==========================================
  // 2. FACULTY ACCOUNTS
  // password_hash = NULL
  // is_registered = 0
  // Faculty must signup first
  // ==========================================

  const facultyUsers = [
    {
      name: 'Dr. Manish Kumar',
      email: 'faculty.manish@iiita.ac.in',
      dept: 'Department of Information Technology',
      desig: 'Associate Professor',
      code: 'FAC-IT-01',
      room: 'CC3-412'
    },
    {
      name: 'Prof. O.P. Vyas',
      email: 'faculty.vyas@iiita.ac.in',
      dept: 'Department of Information Technology',
      desig: 'Professor & Dean',
      code: 'FAC-IT-02',
      room: 'CC3-501'
    },
    {
      name: 'Dr. Rahul Kala',
      email: 'faculty.kala@iiita.ac.in',
      dept: 'Department of Information Technology',
      desig: 'Associate Professor',
      code: 'FAC-IT-03',
      room: 'CC2-204'
    },
    {
      name: 'Dr. Sonali Agarwal',
      email: 'faculty.sonali@iiita.ac.in',
      dept: 'Department of Information Technology',
      desig: 'Associate Professor',
      code: 'FAC-IT-04',
      room: 'CC3-315'
    },
    {
      name: 'Prof. Shirshu Varma',
      email: 'faculty.varma@iiita.ac.in',
      dept: 'Department of Electronics & Communication',
      desig: 'Professor',
      code: 'FAC-EC-01',
      room: 'CC1-118'
    }
  ];

  const facultyMap = {};

  for (const f of facultyUsers) {
    const userId = insertUser.run(
      f.name,
      f.email,
      null,
      'faculty',
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${f.code}`,
      0
    ).lastInsertRowid;

    const facultyId = insertFaculty.run(
      userId,
      f.code,
      f.dept,
      f.desig,
      f.room
    ).lastInsertRowid;

    facultyMap[f.code] = {
      id: facultyId,
      userId,
      name: f.name
    };
  }

  console.log('Faculty accounts created');

  // ==========================================
  // 3. STUDENT ACCOUNTS
  // password_hash = NULL
  // is_registered = 0
  // Students must signup first
  // ==========================================

  const studentData = [
    {
      name: 'Aarav Sharma',
      email: 'student.aarav@iiita.ac.in',
      roll: 'IIT2022001',
      branch: 'Information Technology',
      branchCode: 'IT',
      year: 3,
      section: 'A'
    },
    {
      name: 'Pooja Chaudhari',
      email: 'student.pooja@iiita.ac.in',
      roll: 'IIT2022045',
      branch: 'Information Technology',
      branchCode: 'IT',
      year: 3,
      section: 'A'
    },
    {
      name: 'Rohan Gupta',
      email: 'student.rohan@iiita.ac.in',
      roll: 'IIT2022088',
      branch: 'Information Technology',
      branchCode: 'IT',
      year: 3,
      section: 'A'
    },
    {
      name: 'Ananya Verma',
      email: 'student.ananya@iiita.ac.in',
      roll: 'IIT2022102',
      branch: 'Information Technology',
      branchCode: 'IT',
      year: 3,
      section: 'A'
    },
    {
      name: 'Siddharth Nair',
      email: 'student.sid@iiita.ac.in',
      roll: 'IIT2022120',
      branch: 'Information Technology',
      branchCode: 'IT',
      year: 3,
      section: 'A'
    },

    // IT Section B
    {
      name: 'Neha Patel',
      email: 'student.neha@iiita.ac.in',
      roll: 'IIT2022150',
      branch: 'Information Technology',
      branchCode: 'IT',
      year: 3,
      section: 'B'
    },
    {
      name: 'Vikram Singh',
      email: 'student.vikram@iiita.ac.in',
      roll: 'IIT2022165',
      branch: 'Information Technology',
      branchCode: 'IT',
      year: 3,
      section: 'B'
    },

    // ECE
    {
      name: 'Priya Reddy',
      email: 'student.priya@iiita.ac.in',
      roll: 'IEC2023012',
      branch: 'Electronics & Communication',
      branchCode: 'ECE',
      year: 2,
      section: 'A'
    },
    {
      name: 'Aditya Joshi',
      email: 'student.aditya@iiita.ac.in',
      roll: 'IEC2023034',
      branch: 'Electronics & Communication',
      branchCode: 'ECE',
      year: 2,
      section: 'A'
    }
  ];

  const studentMap = {};

  for (const s of studentData) {
    const userId = insertUser.run(
      s.name,
      s.email,
      null,
      'student',
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.roll}`,
      0
    ).lastInsertRowid;

    const studentId = insertStudent.run(
      userId,
      s.roll,
      s.branch,
      s.branchCode,
      s.year,
      s.section
    ).lastInsertRowid;

    studentMap[s.roll] = {
      id: studentId,
      userId,
      name: s.name,
      branch: s.branch,
      branchCode: s.branchCode,
      year: s.year,
      section: s.section
    };
  }

  console.log('Student accounts created');

  // ==========================================
  // 4. SUBJECTS
  // ==========================================

  const insertSubject = db.prepare(`
    INSERT INTO subjects (
      code,
      name,
      credits,
      department,
      faculty_id,
      branch,
      year,
      section
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const subjects = [
    {
      code: 'DBMS301',
      name: 'Database Management Systems',
      credits: 4,
      dept: 'Information Technology',
      facultyCode: 'FAC-IT-01',
      branch: 'IT',
      year: 3,
      section: 'A'
    },
    {
      code: 'OS302',
      name: 'Operating Systems',
      credits: 4,
      dept: 'Information Technology',
      facultyCode: 'FAC-IT-02',
      branch: 'IT',
      year: 3,
      section: 'A'
    },
    {
      code: 'DAA303',
      name: 'Design & Analysis of Algorithms',
      credits: 4,
      dept: 'Information Technology',
      facultyCode: 'FAC-IT-03',
      branch: 'IT',
      year: 3,
      section: 'A'
    },
    {
      code: 'ML304',
      name: 'Machine Learning & Data Mining',
      credits: 4,
      dept: 'Information Technology',
      facultyCode: 'FAC-IT-04',
      branch: 'IT',
      year: 3,
      section: 'A'
    },
    {
      code: 'DBMS301-B',
      name: 'Database Management Systems',
      credits: 4,
      dept: 'Information Technology',
      facultyCode: 'FAC-IT-01',
      branch: 'IT',
      year: 3,
      section: 'B'
    },
    {
      code: 'OS302-B',
      name: 'Operating Systems',
      credits: 4,
      dept: 'Information Technology',
      facultyCode: 'FAC-IT-02',
      branch: 'IT',
      year: 3,
      section: 'B'
    },
    {
      code: 'DSP201',
      name: 'Digital Signal Processing',
      credits: 4,
      dept: 'Electronics & Communication',
      facultyCode: 'FAC-EC-01',
      branch: 'ECE',
      year: 2,
      section: 'A'
    },
    {
      code: 'DCL202',
      name: 'Digital Communication Lines',
      credits: 3,
      dept: 'Electronics & Communication',
      facultyCode: 'FAC-EC-01',
      branch: 'ECE',
      year: 2,
      section: 'A'
    }
  ];

  const subjectMap = {};

  for (const sub of subjects) {
    const faculty = facultyMap[sub.facultyCode];

    const subjectId = insertSubject.run(
      sub.code,
      sub.name,
      sub.credits,
      sub.dept,
      faculty.id,
      sub.branch,
      sub.year,
      sub.section
    ).lastInsertRowid;

    subjectMap[sub.code] = {
      id: subjectId,
      facultyId: faculty.id,
      facultyName: faculty.name
    };
  }

  // ==========================================
  // 5. TIMETABLE
  // ==========================================

  const insertTimetable = db.prepare(`
    INSERT INTO timetable (
      branch,
      year,
      section,
      subject_id,
      faculty_id,
      day_of_week,
      start_time,
      end_time,
      room
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const timetableEntries = [
    {
      branch: 'IT',
      year: 3,
      section: 'A',
      subCode: 'DBMS301',
      day: 'Monday',
      start: '09:00',
      end: '10:00',
      room: 'LT-1'
    },
    {
      branch: 'IT',
      year: 3,
      section: 'A',
      subCode: 'OS302',
      day: 'Monday',
      start: '10:00',
      end: '11:00',
      room: 'LT-1'
    },
    {
      branch: 'IT',
      year: 3,
      section: 'A',
      subCode: 'DAA303',
      day: 'Monday',
      start: '11:15',
      end: '12:15',
      room: 'LT-2'
    },
    {
      branch: 'IT',
      year: 3,
      section: 'A',
      subCode: 'ML304',
      day: 'Monday',
      start: '14:00',
      end: '16:00',
      room: 'CC3 Lab 2'
    },

    {
      branch: 'IT',
      year: 3,
      section: 'A',
      subCode: 'OS302',
      day: 'Tuesday',
      start: '09:00',
      end: '10:00',
      room: 'LT-1'
    },
    {
      branch: 'IT',
      year: 3,
      section: 'A',
      subCode: 'DBMS301',
      day: 'Tuesday',
      start: '10:00',
      end: '11:00',
      room: 'LT-1'
    },
    {
      branch: 'IT',
      year: 3,
      section: 'A',
      subCode: 'DAA303',
      day: 'Tuesday',
      start: '11:15',
      end: '12:15',
      room: 'LT-2'
    },

    {
      branch: 'IT',
      year: 3,
      section: 'A',
      subCode: 'ML304',
      day: 'Wednesday',
      start: '09:00',
      end: '10:00',
      room: 'LT-3'
    },
    {
      branch: 'IT',
      year: 3,
      section: 'A',
      subCode: 'DBMS301',
      day: 'Wednesday',
      start: '10:00',
      end: '11:00',
      room: 'LT-1'
    },
    {
      branch: 'IT',
      year: 3,
      section: 'A',
      subCode: 'OS302',
      day: 'Wednesday',
      start: '14:00',
      end: '16:00',
      room: 'CC2 Lab 4'
    },

    {
      branch: 'IT',
      year: 3,
      section: 'A',
      subCode: 'DAA303',
      day: 'Thursday',
      start: '09:00',
      end: '10:00',
      room: 'LT-2'
    },
    {
      branch: 'IT',
      year: 3,
      section: 'A',
      subCode: 'ML304',
      day: 'Thursday',
      start: '10:00',
      end: '11:00',
      room: 'LT-3'
    },

    {
      branch: 'IT',
      year: 3,
      section: 'A',
      subCode: 'OS302',
      day: 'Friday',
      start: '09:00',
      end: '10:00',
      room: 'LT-1'
    },
    {
      branch: 'IT',
      year: 3,
      section: 'A',
      subCode: 'DAA303',
      day: 'Friday',
      start: '10:00',
      end: '11:00',
      room: 'LT-2'
    }
  ];

  for (const t of timetableEntries) {
    const subject = subjectMap[t.subCode];

    insertTimetable.run(
      t.branch,
      t.year,
      t.section,
      subject.id,
      subject.facultyId,
      t.day,
      t.start,
      t.end,
      t.room
    );
  }

  // ==========================================
  // 6. ATTENDANCE
  // ==========================================

  const insertSession = db.prepare(`
    INSERT INTO attendance_sessions (
      subject_id,
      faculty_id,
      branch,
      year,
      section,
      date
    )
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertRecord = db.prepare(`
    INSERT INTO attendance_records (
      session_id,
      student_id,
      status,
      date
    )
    VALUES (?, ?, ?, ?)
  `);

  const it3AStudents = Object.values(studentMap).filter(
    (student) =>
      student.branch === 'Information Technology' &&
      student.year === 3 &&
      student.section === 'A'
  );

  const pastDates = [
    '2026-08-03',
    '2026-08-05',
    '2026-08-07',
    '2026-08-10',
    '2026-08-12',
    '2026-08-14',
    '2026-08-17',
    '2026-08-19',
    '2026-08-21',
    '2026-08-24',
    '2026-08-26',
    '2026-08-28'
  ];

  for (const date of pastDates) {
    const subjectCodes = ['DBMS301', 'OS302', 'DAA303', 'ML304'];

    for (const subjectCode of subjectCodes) {
      const subject = subjectMap[subjectCode];

      const sessionId = insertSession.run(
        subject.id,
        subject.facultyId,
        'IT',
        3,
        'A',
        date
      ).lastInsertRowid;

      for (const student of it3AStudents) {
        insertRecord.run(
          sessionId,
          student.id,
          'Present',
          date
        );
      }
    }
  }

  // ==========================================
  // 7. ASSIGNMENTS
  // ==========================================

  const insertAssignment = db.prepare(`
    INSERT INTO assignments (
      subject_id,
      faculty_id,
      branch,
      year,
      section,
      title,
      description,
      due_date,
      max_marks
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertSubmission = db.prepare(`
    INSERT INTO submissions (
      assignment_id,
      student_id,
      submission_content,
      submitted_at,
      marks_obtained,
      feedback,
      status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const assignment1 = insertAssignment.run(
    subjectMap['DBMS301'].id,
    subjectMap['DBMS301'].facultyId,
    'IT',
    3,
    'A',
    'Assignment 1: Complex SQL Queries & 3NF Decomposition',
    'Write SQL queries using joins, subqueries and normalization concepts.',
    '2026-09-15',
    100
  ).lastInsertRowid;

  const assignment2 = insertAssignment.run(
    subjectMap['OS302'].id,
    subjectMap['OS302'].facultyId,
    'IT',
    3,
    'A',
    'Assignment 2: POSIX Threads & Producer Consumer',
    'Implement the producer consumer problem using pthreads and semaphores.',
    '2026-09-20',
    100
  ).lastInsertRowid;

  insertSubmission.run(
    assignment1,
    studentMap['IIT2022001'].id,
    'Completed assignment solution.',
    '2026-09-01 14:30:00',
    92,
    'Good work.',
    'Graded'
  );

  insertSubmission.run(
    assignment1,
    studentMap['IIT2022045'].id,
    'Submitted assignment solution with test cases.',
    '2026-09-01 16:45:00',
    95,
    'Excellent work.',
    'Graded'
  );

  // ==========================================
  // 8. NOTICES
  // ==========================================

  const insertNotice = db.prepare(`
    INSERT INTO notices (
      title,
      content,
      category,
      target_role,
      author_id,
      published_date,
      is_pinned
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertNotice.run(
    'Mid-Semester Examination Schedule - Autumn 2026',
    'The Mid-Semester examinations for Autumn 2026 will commence from September 28, 2026.',
    'Academic',
    'all',
    adminId,
    '2026-08-25',
    1
  );

  insertNotice.run(
    'Minor Project Proposal Submission',
    'All 3rd Year students must submit their project abstracts by September 10, 2026.',
    'Academic',
    'student',
    facultyMap['FAC-IT-01'].userId,
    '2026-08-27',
    0
  );

  // ==========================================
  // 9. EVENTS
  // ==========================================

  const insertEvent = db.prepare(`
    INSERT INTO events (
      title,
      description,
      category,
      date,
      time,
      venue,
      organizer
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertEvent.run(
    'Effervescence 2026',
    'Annual cultural festival of IIIT Allahabad.',
    'Cultural',
    '2026-10-18',
    '05:00 PM',
    'Main Auditorium Grounds',
    'Student Activity Center'
  );

  insertEvent.run(
    'Aparoksha 2026',
    'Annual technical festival of IIIT Allahabad.',
    'Technical',
    '2026-11-06',
    '09:00 AM',
    'CC3 Complex',
    'GeekHaven'
  );

  // ==========================================
  // 10. FACILITIES
  // ==========================================

  const insertFacility = db.prepare(`
    INSERT INTO facilities (
      name,
      category,
      description,
      location,
      timings
    )
    VALUES (?, ?, ?, ?, ?)
  `);

  const facilities = [
    {
      name: 'Computer Center 3',
      category: 'Academic & Labs',
      description: 'Computer labs and research facilities.',
      location: 'Main Academic Quadrangle',
      timings: '24x7'
    },
    {
      name: 'Central Library',
      category: 'Academic & Research',
      description: 'Central academic and research library.',
      location: 'Central Campus',
      timings: '08:00 AM - 12:00 Midnight'
    },
    {
      name: 'Student Activity Center',
      category: 'Student Life',
      description: 'Student clubs and recreational activities.',
      location: 'Near Sports Ground',
      timings: '06:00 AM - 10:00 PM'
    }
  ];

  for (const facility of facilities) {
    insertFacility.run(
      facility.name,
      facility.category,
      facility.description,
      facility.location,
      facility.timings
    );
  }

  console.log('');
  console.log('✅ Database successfully seeded!');
  console.log('');
  console.log('ADMIN LOGIN:');
  console.log('Email: admin@iiita.ac.in');
  console.log('Password: password123');
  console.log('');
  console.log('STUDENTS AND FACULTY:');
  console.log('They must complete signup first.');
  console.log('');
}

if (require.main === module) {
  seed();
}

module.exports = seed;