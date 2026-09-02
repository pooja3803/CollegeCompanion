const bcrypt = require('bcryptjs');
const db = require('../config/database');

async function seed() {
  console.log('Seeding database with realistic IIIT Allahabad data...');

  // Clear existing data safely
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

  const passwordHash = bcrypt.hashSync('password123', 10);

  // 1. Create Users (Admin, Faculty, Students)
  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password_hash, role, avatar_url)
    VALUES (?, ?, ?, ?, ?)
  `);

  // Admin
  const adminId = insertUser.run('Admin Office', 'admin@iiita.ac.in', passwordHash, 'admin', 'https://api.dicebear.com/7.x/bottts/svg?seed=admin').lastInsertRowid;

  // Faculty Users
  const facultyUsers = [
    { name: 'Dr. Manish Kumar', email: 'faculty.manish@iiita.ac.in', dept: 'Department of Information Technology', desig: 'Associate Professor', code: 'FAC-IT-01', room: 'CC3-412' },
    { name: 'Prof. O.P. Vyas', email: 'faculty.vyas@iiita.ac.in', dept: 'Department of Information Technology', desig: 'Professor & Dean', code: 'FAC-IT-02', room: 'CC3-501' },
    { name: 'Dr. Rahul Kala', email: 'faculty.kala@iiita.ac.in', dept: 'Department of Information Technology', desig: 'Associate Professor', code: 'FAC-IT-03', room: 'CC2-204' },
    { name: 'Dr. Sonali Agarwal', email: 'faculty.sonali@iiita.ac.in', dept: 'Department of Information Technology', desig: 'Associate Professor', code: 'FAC-IT-04', room: 'CC3-315' },
    { name: 'Prof. Shirshu Varma', email: 'faculty.varma@iiita.ac.in', dept: 'Department of Electronics & Communication', desig: 'Professor', code: 'FAC-EC-01', room: 'CC1-118' }
  ];

  const insertFaculty = db.prepare(`
    INSERT INTO faculty (user_id, faculty_code, department, designation, office_room)
    VALUES (?, ?, ?, ?, ?)
  `);

  const facultyMap = {};
  for (const f of facultyUsers) {
    const uId = insertUser.run(f.name, f.email, passwordHash, 'faculty', `https://api.dicebear.com/7.x/avataaars/svg?seed=${f.code}`).lastInsertRowid;
    const fId = insertFaculty.run(uId, f.code, f.dept, f.desig, f.room).lastInsertRowid;
    facultyMap[f.code] = { id: fId, userId: uId, name: f.name };
  }

  // Student Users
  const studentData = [
    // IT 3rd Year Section A (5 students)
    { name: 'Aarav Sharma', email: 'student.aarav@iiita.ac.in', roll: 'IIT2022001', branch: 'Information Technology', branchCode: 'IT', year: 3, section: 'A' },
    { name: 'Pooja Chaudhari', email: 'student.pooja@iiita.ac.in', roll: 'IIT2022045', branch: 'Information Technology', branchCode: 'IT', year: 3, section: 'A' },
    { name: 'Rohan Gupta', email: 'student.rohan@iiita.ac.in', roll: 'IIT2022088', branch: 'Information Technology', branchCode: 'IT', year: 3, section: 'A' },
    { name: 'Ananya Verma', email: 'student.ananya@iiita.ac.in', roll: 'IIT2022102', branch: 'Information Technology', branchCode: 'IT', year: 3, section: 'A' },
    { name: 'Siddharth Nair', email: 'student.sid@iiita.ac.in', roll: 'IIT2022120', branch: 'Information Technology', branchCode: 'IT', year: 3, section: 'A' },
    
    // IT 3rd Year Section B (2 students)
    { name: 'Neha Patel', email: 'student.neha@iiita.ac.in', roll: 'IIT2022150', branch: 'Information Technology', branchCode: 'IT', year: 3, section: 'B' },
    { name: 'Vikram Singh', email: 'student.vikram@iiita.ac.in', roll: 'IIT2022165', branch: 'Information Technology', branchCode: 'IT', year: 3, section: 'B' },

    // ECE 2nd Year Section A (2 students)
    { name: 'Priya Reddy', email: 'student.priya@iiita.ac.in', roll: 'IEC2023012', branch: 'Electronics & Communication', branchCode: 'ECE', year: 2, section: 'A' },
    { name: 'Aditya Joshi', email: 'student.aditya@iiita.ac.in', roll: 'IEC2023034', branch: 'Electronics & Communication', branchCode: 'ECE', year: 2, section: 'A' }
  ];

  const insertStudent = db.prepare(`
    INSERT INTO students (user_id, roll_number, branch, branch_code, year, section)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const studentMap = {};
  for (const s of studentData) {
    const uId = insertUser.run(s.name, s.email, passwordHash, 'student', `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.roll}`).lastInsertRowid;
    const sId = insertStudent.run(uId, s.roll, s.branch, s.branchCode, s.year, s.section).lastInsertRowid;
    studentMap[s.roll] = { id: sId, userId: uId, name: s.name, year: s.year, section: s.section, branch: s.branch, branchCode: s.branchCode };
  }

  // 2. Subjects
  const insertSubject = db.prepare(`
    INSERT INTO subjects (code, name, credits, department, faculty_id, branch, year, section)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const subjects = [
    // IT 3rd Year Section A
    { code: 'DBMS301', name: 'Database Management Systems', credits: 4, dept: 'Information Technology', facultyCode: 'FAC-IT-01', branch: 'IT', year: 3, section: 'A' },
    { code: 'OS302', name: 'Operating Systems', credits: 4, dept: 'Information Technology', facultyCode: 'FAC-IT-02', branch: 'IT', year: 3, section: 'A' },
    { code: 'DAA303', name: 'Design & Analysis of Algorithms', credits: 4, dept: 'Information Technology', facultyCode: 'FAC-IT-03', branch: 'IT', year: 3, section: 'A' },
    { code: 'ML304', name: 'Machine Learning & Data Mining', credits: 4, dept: 'Information Technology', facultyCode: 'FAC-IT-04', branch: 'IT', year: 3, section: 'A' },
    
    // IT 3rd Year Section B
    { code: 'DBMS301-B', name: 'Database Management Systems', credits: 4, dept: 'Information Technology', facultyCode: 'FAC-IT-01', branch: 'IT', year: 3, section: 'B' },
    { code: 'OS302-B', name: 'Operating Systems', credits: 4, dept: 'Information Technology', facultyCode: 'FAC-IT-02', branch: 'IT', year: 3, section: 'B' },

    // ECE 2nd Year Section A
    { code: 'DE201', name: 'Digital Electronics', credits: 4, dept: 'Electronics & Communication', facultyCode: 'FAC-EC-01', branch: 'ECE', year: 2, section: 'A' },
    { code: 'SS202', name: 'Signals & Systems', credits: 4, dept: 'Electronics & Communication', facultyCode: 'FAC-EC-01', branch: 'ECE', year: 2, section: 'A' }
  ];

  const subjectMap = {};
  for (const sub of subjects) {
    const facId = facultyMap[sub.facultyCode].id;
    const sId = insertSubject.run(sub.code, sub.name, sub.credits, sub.dept, facId, sub.branch, sub.year, sub.section).lastInsertRowid;
    subjectMap[sub.code] = { id: sId, ...sub, facultyId: facId };
  }

  // 3. Timetable
  const insertTimetable = db.prepare(`
    INSERT INTO timetable (branch, year, section, subject_id, faculty_id, day_of_week, start_time, end_time, room)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const timetableEntries = [
    // IT 3rd Year Section A (Monday - Friday)
    { branch: 'IT', year: 3, section: 'A', subCode: 'DBMS301', facCode: 'FAC-IT-01', day: 'Monday', start: '09:00', end: '10:00', room: 'LT-1' },
    { branch: 'IT', year: 3, section: 'A', subCode: 'OS302', facCode: 'FAC-IT-02', day: 'Monday', start: '10:00', end: '11:00', room: 'LT-1' },
    { branch: 'IT', year: 3, section: 'A', subCode: 'DAA303', facCode: 'FAC-IT-03', day: 'Monday', start: '11:15', end: '12:15', room: 'LT-2' },
    { branch: 'IT', year: 3, section: 'A', subCode: 'ML304', facCode: 'FAC-IT-04', day: 'Monday', start: '14:00', end: '16:00', room: 'CC3-Lab 1' },

    { branch: 'IT', year: 3, section: 'A', subCode: 'DAA303', facCode: 'FAC-IT-03', day: 'Tuesday', start: '09:00', end: '10:00', room: 'LT-2' },
    { branch: 'IT', year: 3, section: 'A', subCode: 'DBMS301', facCode: 'FAC-IT-01', day: 'Tuesday', start: '10:00', end: '11:00', room: 'LT-1' },
    { branch: 'IT', year: 3, section: 'A', subCode: 'OS302', facCode: 'FAC-IT-02', day: 'Tuesday', start: '11:15', end: '12:15', room: 'LT-1' },

    { branch: 'IT', year: 3, section: 'A', subCode: 'OS302', facCode: 'FAC-IT-02', day: 'Wednesday', start: '09:00', end: '10:00', room: 'LT-1' },
    { branch: 'IT', year: 3, section: 'A', subCode: 'ML304', facCode: 'FAC-IT-04', day: 'Wednesday', start: '10:00', end: '11:00', room: 'LT-2' },
    { branch: 'IT', year: 3, section: 'A', subCode: 'DBMS301', facCode: 'FAC-IT-01', day: 'Wednesday', start: '14:00', end: '16:00', room: 'CC3-Lab 2' },

    { branch: 'IT', year: 3, section: 'A', subCode: 'DAA303', facCode: 'FAC-IT-03', day: 'Thursday', start: '09:00', end: '10:00', room: 'LT-2' },
    { branch: 'IT', year: 3, section: 'A', subCode: 'ML304', facCode: 'FAC-IT-04', day: 'Thursday', start: '10:00', end: '11:00', room: 'LT-2' },
    { branch: 'IT', year: 3, section: 'A', subCode: 'OS302', facCode: 'FAC-IT-02', day: 'Thursday', start: '14:00', end: '16:00', room: 'CC3-Lab 3' },

    { branch: 'IT', year: 3, section: 'A', subCode: 'DBMS301', facCode: 'FAC-IT-01', day: 'Friday', start: '09:00', end: '10:00', room: 'LT-1' },
    { branch: 'IT', year: 3, section: 'A', subCode: 'ML304', facCode: 'FAC-IT-04', day: 'Friday', start: '11:15', end: '12:15', room: 'LT-2' },

    // IT 3rd Year Section B
    { branch: 'IT', year: 3, section: 'B', subCode: 'DBMS301-B', facCode: 'FAC-IT-01', day: 'Monday', start: '11:15', end: '12:15', room: 'LT-3' },
    { branch: 'IT', year: 3, section: 'B', subCode: 'OS302-B', facCode: 'FAC-IT-02', day: 'Tuesday', start: '14:00', end: '15:00', room: 'LT-3' },
    { branch: 'IT', year: 3, section: 'B', subCode: 'DBMS301-B', facCode: 'FAC-IT-01', day: 'Thursday', start: '11:15', end: '12:15', room: 'LT-3' },

    // ECE 2nd Year Section A
    { branch: 'ECE', year: 2, section: 'A', subCode: 'DE201', facCode: 'FAC-EC-01', day: 'Monday', start: '09:00', end: '10:00', room: 'CC1-201' },
    { branch: 'ECE', year: 2, section: 'A', subCode: 'SS202', facCode: 'FAC-EC-01', day: 'Wednesday', start: '10:00', end: '11:00', room: 'CC1-201' }
  ];

  for (const t of timetableEntries) {
    const sub = subjectMap[t.subCode];
    const fac = facultyMap[t.facCode];
    insertTimetable.run(t.branch, t.year, t.section, sub.id, fac.id, t.day, t.start, t.end, t.room);
  }

  // 4. Attendance Records
  const insertSession = db.prepare(`
    INSERT INTO attendance_sessions (subject_id, faculty_id, branch, year, section, date)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertRecord = db.prepare(`
    INSERT INTO attendance_records (session_id, student_id, status, date)
    VALUES (?, ?, ?, ?)
  `);

  const itSecAStudents = [
    studentMap['IIT2022001'],
    studentMap['IIT2022045'],
    studentMap['IIT2022088'],
    studentMap['IIT2022102'],
    studentMap['IIT2022120']
  ];

  const attendanceDates = [
    '2026-08-10', '2026-08-12', '2026-08-14', '2026-08-17',
    '2026-08-19', '2026-08-21', '2026-08-24', '2026-08-26',
    '2026-08-28', '2026-08-31', '2026-09-01'
  ];

  const itSecASubjects = ['DBMS301', 'OS302', 'DAA303', 'ML304'];

  for (const subCode of itSecASubjects) {
    const sub = subjectMap[subCode];
    const selectedDates = attendanceDates.slice(0, 7);
    for (let i = 0; i < selectedDates.length; i++) {
      const date = selectedDates[i];
      const sessId = insertSession.run(sub.id, sub.facultyId, 'IT', 3, 'A', date).lastInsertRowid;
      
      itSecAStudents.forEach((student, idx) => {
        let isPresent = true;
        if (student.roll === 'IIT2022088' && (i === 1 || i === 4)) isPresent = false;
        if (student.roll === 'IIT2022001' && i === 3) isPresent = false;
        if (student.roll === 'IIT2022045' && i === 5) isPresent = false;
        if (student.roll === 'IIT2022120' && (i === 2 || i === 6)) isPresent = false;

        insertRecord.run(sessId, student.id, isPresent ? 'Present' : 'Absent', date);
      });
    }
  }

  // 5. Assignments & Submissions
  const insertAssignment = db.prepare(`
    INSERT INTO assignments (subject_id, faculty_id, branch, year, section, title, description, due_date, max_marks)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertSubmission = db.prepare(`
    INSERT INTO submissions (assignment_id, student_id, submission_content, marks_obtained, feedback, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  // Assignment 1: DBMS
  const dbmsSub = subjectMap['DBMS301'];
  const a1Id = insertAssignment.run(
    dbmsSub.id, dbmsSub.facultyId, 'IT', 3, 'A',
    'Assignment 1: ER Modeling & BCNF Normalization',
    'Design an extended ER diagram for a Hospital Management System and decompose the relations up to BCNF. Provide formal functional dependency proofs.',
    '2026-09-10', 20
  ).lastInsertRowid;

  insertSubmission.run(
    a1Id, studentMap['IIT2022001'].id,
    'https://github.com/aarav-iiita/dbms-assignment1-hospital-er',
    19.0, 'Excellent decomposition and sound dependency proofs. Good job!', 'Graded'
  );

  insertSubmission.run(
    a1Id, studentMap['IIT2022045'].id,
    'https://github.com/pooja-iiita/dbms-assignment-normalization',
    null, null, 'Submitted'
  );

  // Assignment 2: OS
  const osSub = subjectMap['OS302'];
  const a2Id = insertAssignment.run(
    osSub.id, osSub.facultyId, 'IT', 3, 'A',
    'Assignment 1: Multithreaded Process Synchronization',
    'Implement the classic Dining Philosophers and Reader-Writer problem in C using POSIX pthreads, semaphores, and mutex locks avoiding deadlocks.',
    '2026-09-15', 25
  ).lastInsertRowid;

  insertSubmission.run(
    a2Id, studentMap['IIT2022102'].id,
    'https://github.com/ananya-v/posix-synchro-iiita',
    null, null, 'Submitted'
  );

  // Assignment 3: DAA
  const daaSub = subjectMap['DAA303'];
  insertAssignment.run(
    daaSub.id, daaSub.facultyId, 'IT', 3, 'A',
    'Problem Set 1: Dynamic Programming vs Greedy Choice',
    'Solve the 5 algorithmic problems on DP and Greedy strategies on the submission portal with time & space complexity analysis.',
    '2026-09-20', 30
  );

  // Assignment 4: ML
  const mlSub = subjectMap['ML304'];
  insertAssignment.run(
    mlSub.id, mlSub.facultyId, 'IT', 3, 'A',
    'Mini Project: Supervised Classification Pipeline',
    'Develop an end-to-end classification pipeline comparing SVM, Random Forest, and XGBoost on the benchmark dataset. Submit Jupyter notebook with ROC curves.',
    '2026-09-28', 50
  );

  // 6. College Notices / Announcements
  const insertNotice = db.prepare(`
    INSERT INTO notices (title, content, category, target_role, author_id, published_date, is_pinned)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertNotice.run(
    'Mid-Semester Examination Schedule - Autumn 2026',
    'The Mid-Semester Examinations for Autumn 2026 will commence from September 21, 2026. Students are advised to verify their seating arrangement on the student portal.',
    'Academic', 'all', adminId, '2026-08-30', 1
  );

  insertNotice.run(
    'Hostel Curfew & Biometric Guidelines for Monsoon 2026',
    'All resident students must adhere to the 10:30 PM entry timing at respective hostel gates. Biometric attendance will be recorded at BH-1 to BH-5 and GH-1 to GH-3.',
    'Hostel', 'student', adminId, '2026-08-28', 0
  );

  insertNotice.run(
    'Faculty Council Meeting with Director',
    'A mandatory meeting for all Heads of Departments and Faculty coordinators is scheduled on September 4, 2026 at 4:00 PM in the Senate Hall regarding NAAC & NIRF parameters.',
    'Academic', 'faculty', adminId, '2026-09-01', 1
  );

  insertNotice.run(
    'Aparoksha 2026 Tech Fest - Call for Organizers & Core Committee',
    'Nominations are open for student coordinators across Technical, Sponsorship, and Design wings for Aparoksha 2026. Apply before September 12.',
    'Event', 'all', adminId, '2026-08-25', 0
  );

  // 7. Campus Events (for Explorer & Admin Management)
  const insertEvent = db.prepare(`
    INSERT INTO events (title, description, category, date, time, venue, organizer)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertEvent.run(
    'Effervescence 2026 - Annual Cultural Extravaganza',
    'North India\'s premier cultural festival featuring music nights, drama, celebrity performances, and multi-college dance competitions.',
    'Cultural', '2026-10-15', '06:00 PM', 'Main Auditorium & Football Ground', 'Effervescence Team & SAC'
  );

  insertEvent.run(
    'Aparoksha 2026 - Annual Technical Summit',
    'Flagship tech fest featuring 36-hour hackathons, bot wars, coding challenges, and talks by industry titans from Google, Microsoft & DeepMind.',
    'Technical', '2026-11-05', '09:00 AM', 'CC3 Complex & LT-1', 'Technical Society IIITA'
  );

  insertEvent.run(
    'Asmita 2026 - Annual Inter-College Sports Meet',
    'Inter-college sports tournament with Athletics, Football, Cricket, Badminton, Basketball, and Lawn Tennis.',
    'Sports', '2026-09-22', '07:00 AM', 'Sports Complex & Swimming Arena', 'Sports Council IIITA'
  );

  insertEvent.run(
    'Guest Lecture: Frontiers in Agentic Artificial Intelligence',
    'Distinguished guest lecture on autonomous multi-agent reasoning systems, large language model alignment, and future horizons in software engineering.',
    'Workshop', '2026-09-08', '03:30 PM', 'Senate Hall & Online Stream', 'Department of IT & IEEE Student Branch'
  );

  // 8. Campus Facilities (Stored in Database & Admin Manageable)
  const insertFacility = db.prepare(`
    INSERT INTO facilities (name, category, description, location, timings)
    VALUES (?, ?, ?, ?, ?)
  `);

  const campusFacilities = [
    {
      name: 'Computer Center 3 (CC3)',
      category: 'Academic & Labs',
      location: 'Main Academic Quadrangle',
      timings: '24x7 with Biometric Access',
      description: 'Hub of high-performance computing clusters, cloud server racks, specialized AI/ML research labs, and central network operations center.'
    },
    {
      name: 'Central Library',
      category: 'Academic & Research',
      location: 'Central Spine, Ground & 1st Floor',
      timings: '08:00 AM - 12:00 Midnight (Extended during exams)',
      description: 'Comprehensive repository of over 60,000 engineering and science volumes, IEEE/ACM digital library subscriptions, and quiet discussion rooms.'
    },
    {
      name: 'Student Activity Center (SAC)',
      category: 'Recreation & Student Life',
      location: 'Adjacent to Main Sports Ground',
      timings: '06:00 AM - 10:00 PM',
      description: 'Headquarters for Gymkhana, student societies (GeekHaven, Sarasva, Rangtarangini, Acoustic), music jamming room, and robotics arena.'
    },
    {
      name: 'Multi-Purpose Sports Complex',
      category: 'Sports & Fitness',
      location: 'West Campus Zone',
      timings: '06:00 AM - 09:30 PM',
      description: 'Olympic-size floodlit swimming pool, synthetic lawn tennis courts, wooden badminton courts, basketball courts, and gymnasium.'
    },
    {
      name: 'Institute Health Care Center',
      category: 'Medical & Wellness',
      location: 'Near Boys Hostel 1',
      timings: '24x7 Emergency Services, OPD 09:00 AM - 06:00 PM',
      description: 'Resident medical officers, 24-hour ambulance service, pathology lab, pharmacy, and tie-ups with leading hospitals in Prayagraj.'
    },
    {
      name: 'Hostels & Residential Quarters',
      category: 'Accommodation',
      location: 'North & South Residential Zones',
      timings: 'Hostel Entry: 10:30 PM',
      description: 'Separate hostels (BH-1 to BH-5 for Boys, GH-1 to GH-3 for Girls) with high-speed Wi-Fi, mess facilities, night canteens, and reading halls.'
    }
  ];

  for (const f of campusFacilities) {
    insertFacility.run(f.name, f.category, f.description, f.location, f.timings);
  }

  console.log('✅ Database successfully seeded!');
}

seed();
