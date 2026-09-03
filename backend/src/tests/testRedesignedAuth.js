const assert = require('assert');
const { EventEmitter } = require('events');
const app = require('../server');
const seed = require('../seeds/seedData');

function makeRequest(method, url, headers = {}, body = null) {
  return new Promise((resolve) => {
    const req = new EventEmitter();
    req.method = method;
    req.url = url;
    req.headers = Object.fromEntries(
      Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v])
    );
    req.body = body;
    req.query = {};
    req.params = {};

    const resHeaders = {};
    let statusCode = 200;

    const res = {
      statusCode: 200,
      setHeader(key, val) { resHeaders[key.toLowerCase()] = val; },
      getHeader(key) { return resHeaders[key.toLowerCase()]; },
      status(code) {
        statusCode = code;
        this.statusCode = code;
        return this;
      },
      json(data) {
        statusCode = this.statusCode || 200;
        resolve({ status: statusCode, body: data });
      },
      send(data) {
        statusCode = this.statusCode || 200;
        try {
          resolve({ status: statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: statusCode, body: data });
        }
      },
      end(data) {
        resolve({ status: statusCode, body: null });
      }
    };

    app(req, res, () => {
      resolve({ status: 404, body: { message: `Cannot ${method} ${url}` } });
    });
  });
}

async function runTests() {
  console.log('🧪 Starting Redesigned Authentication & First-Time Signup Test Suite...\n');

  // Reset database to initial seed state
  await seed();

  // 1. Admin direct login verification
  console.log('--- Test 1: Admin Direct Login ---');
  const adminLogin = await makeRequest('POST', '/api/auth/login', {}, {
    email: 'admin@iiita.ac.in',
    password: 'password123'
  });
  assert.strictEqual(adminLogin.status, 200, 'Admin login must succeed');
  assert.strictEqual(adminLogin.body.user.role, 'admin');
  assert.strictEqual(adminLogin.body.user.is_registered, 1);
  assert.strictEqual(adminLogin.body.user.password_hash, undefined, 'password_hash must NOT be exposed');
  const adminToken = adminLogin.body.token;
  console.log('✅ Admin login succeeded with pre-seeded credentials (is_registered = 1)');

  // 2. Reject public Admin signup
  console.log('\n--- Test 2: Public Admin Signup Rejection ---');
  const adminSignup = await makeRequest('POST', '/api/auth/signup', {}, {
    role: 'admin',
    email: 'hacker@iiita.ac.in',
    password: 'secretpassword'
  });
  assert.strictEqual(adminSignup.status, 403, 'Admin signup must be rejected with 403');
  console.log(`✅ Admin public signup rejected with 403: "${adminSignup.body.message}"`);

  // Verify original admin can still log in
  const adminLoginAgain = await makeRequest('POST', '/api/auth/login', {}, {
    email: 'admin@iiita.ac.in',
    password: 'password123'
  });
  assert.strictEqual(adminLoginAgain.status, 200, 'Original admin can still log in');
  console.log('✅ Original admin login remains unaffected');

  // 3. Unregistered Student Login Rejection
  console.log('\n--- Test 3: Unregistered Student Login Blocked ---');
  const studentPreLogin = await makeRequest('POST', '/api/auth/login', {}, {
    email: 'student.aarav@iiita.ac.in',
    password: 'password123'
  });
  assert.strictEqual(studentPreLogin.status, 403, 'Unregistered student login must return 403');
  console.log(`✅ Unregistered student login blocked with 403: "${studentPreLogin.body.message}"`);

  // 4. Student First-Time Signup Validation
  console.log('\n--- Test 4: Student First-Time Signup Validation ---');
  // 4a. Missing roll number
  const noRoll = await makeRequest('POST', '/api/auth/signup', {}, {
    role: 'student',
    email: 'student.aarav@iiita.ac.in',
    password: 'newpassword123'
  });
  assert.strictEqual(noRoll.status, 400);
  console.log('✅ Missing roll number rejected with 400');

  // 4b. Password too short (< 6 chars)
  const shortPass = await makeRequest('POST', '/api/auth/signup', {}, {
    role: 'student',
    email: 'student.aarav@iiita.ac.in',
    rollNumber: 'IIT2022001',
    password: '123'
  });
  assert.strictEqual(shortPass.status, 400);
  console.log('✅ Short password rejected with 400');

  // 4c. Email and roll number mismatch
  const mismatchStudent = await makeRequest('POST', '/api/auth/signup', {}, {
    role: 'student',
    email: 'student.aarav@iiita.ac.in',
    rollNumber: 'IIT2022999', // Non-existent roll
    password: 'securepassword'
  });
  assert.strictEqual(mismatchStudent.status, 400);
  console.log('✅ Mismatched student record rejected with 400');

  // 4d. Valid Student Signup
  const validStudentSignup = await makeRequest('POST', '/api/auth/signup', {}, {
    role: 'student',
    email: 'student.aarav@iiita.ac.in',
    rollNumber: 'IIT2022001',
    password: 'aaravSecurePassword'
  });
  assert.strictEqual(validStudentSignup.status, 201);
  console.log(`✅ Valid student signup succeeded with 201: "${validStudentSignup.body.message}"`);

  // 4e. Duplicate signup attempt
  const dupStudentSignup = await makeRequest('POST', '/api/auth/signup', {}, {
    role: 'student',
    email: 'student.aarav@iiita.ac.in',
    rollNumber: 'IIT2022001',
    password: 'anotherpassword'
  });
  assert.strictEqual(dupStudentSignup.status, 400);
  console.log(`✅ Duplicate student signup rejected: "${dupStudentSignup.body.message}"`);

  // 4f. Login with new password
  const studentLogin = await makeRequest('POST', '/api/auth/login', {}, {
    email: 'student.aarav@iiita.ac.in',
    password: 'aaravSecurePassword'
  });
  assert.strictEqual(studentLogin.status, 200);
  assert.strictEqual(studentLogin.body.user.role, 'student');
  assert.strictEqual(studentLogin.body.user.is_registered, 1);
  assert.strictEqual(studentLogin.body.user.profile.roll_number, 'IIT2022001');
  assert.strictEqual(studentLogin.body.user.password_hash, undefined, 'password_hash must NOT be exposed');
  console.log('✅ Student logged in successfully with user-created password');

  // 5. Unregistered Faculty Login Rejection
  console.log('\n--- Test 5: Unregistered Faculty Login Blocked ---');
  const facultyPreLogin = await makeRequest('POST', '/api/auth/login', {}, {
    email: 'faculty.manish@iiita.ac.in',
    password: 'password123'
  });
  assert.strictEqual(facultyPreLogin.status, 403, 'Unregistered faculty login must return 403');
  console.log(`✅ Unregistered faculty login blocked with 403: "${facultyPreLogin.body.message}"`);

  // 6. Faculty First-Time Signup Validation
  console.log('\n--- Test 6: Faculty First-Time Signup Validation ---');
  // 6a. Missing faculty code
  const noCode = await makeRequest('POST', '/api/auth/signup', {}, {
    role: 'faculty',
    email: 'faculty.manish@iiita.ac.in',
    password: 'newpassword123'
  });
  assert.strictEqual(noCode.status, 400);
  console.log('✅ Missing faculty code rejected with 400');

  // 6b. Mismatched faculty code
  const mismatchFaculty = await makeRequest('POST', '/api/auth/signup', {}, {
    role: 'faculty',
    email: 'faculty.manish@iiita.ac.in',
    facultyCode: 'FAC-UNKNOWN',
    password: 'securepassword'
  });
  assert.strictEqual(mismatchFaculty.status, 400);
  console.log('✅ Mismatched faculty record rejected with 400');

  // 6c. Valid Faculty Signup
  const validFacultySignup = await makeRequest('POST', '/api/auth/signup', {}, {
    role: 'faculty',
    email: 'faculty.manish@iiita.ac.in',
    facultyCode: 'FAC-IT-01',
    password: 'drManishPassword2026'
  });
  assert.strictEqual(validFacultySignup.status, 201);
  console.log(`✅ Valid faculty signup succeeded with 201: "${validFacultySignup.body.message}"`);

  // 6d. Duplicate signup attempt
  const dupFacultySignup = await makeRequest('POST', '/api/auth/signup', {}, {
    role: 'faculty',
    email: 'faculty.manish@iiita.ac.in',
    facultyCode: 'FAC-IT-01',
    password: 'anotherpassword'
  });
  assert.strictEqual(dupFacultySignup.status, 400);
  console.log(`✅ Duplicate faculty signup rejected: "${dupFacultySignup.body.message}"`);

  // 6e. Login with new password
  const facultyLogin = await makeRequest('POST', '/api/auth/login', {}, {
    email: 'faculty.manish@iiita.ac.in',
    password: 'drManishPassword2026'
  });
  assert.strictEqual(facultyLogin.status, 200);
  assert.strictEqual(facultyLogin.body.user.role, 'faculty');
  assert.strictEqual(facultyLogin.body.user.is_registered, 1);
  assert.strictEqual(facultyLogin.body.user.profile.faculty_code, 'FAC-IT-01');
  assert.strictEqual(facultyLogin.body.user.password_hash, undefined, 'password_hash must NOT be exposed');
  console.log('✅ Faculty logged in successfully with user-created password');

  // 7. Admin Creates New Student and Faculty (Pending First-Time Signup)
  console.log('\n--- Test 7: Admin Adds Student & Faculty (password_hash = NULL, is_registered = 0) ---');
  // 7a. Admin creates student
  const addStudentRes = await makeRequest('POST', '/api/admin/students', { Authorization: `Bearer ${adminToken}` }, {
    name: 'Devansh Tandon',
    email: 'student.devansh@iiita.ac.in',
    rollNumber: 'IIT2022210',
    branch: 'Information Technology',
    branchCode: 'IT',
    year: 3,
    section: 'A'
  });
  assert.strictEqual(addStudentRes.status, 201);
  console.log('✅ Admin added new student: Devansh Tandon (IIT2022210)');

  // New student tries to log in before signing up
  const devanshPreLogin = await makeRequest('POST', '/api/auth/login', {}, {
    email: 'student.devansh@iiita.ac.in',
    password: 'password123'
  });
  assert.strictEqual(devanshPreLogin.status, 403);
  console.log('✅ Newly added student login blocked before signup');

  // New student completes first-time signup
  const devanshSignup = await makeRequest('POST', '/api/auth/signup', {}, {
    role: 'student',
    email: 'student.devansh@iiita.ac.in',
    rollNumber: 'IIT2022210',
    password: 'devanshPassword99'
  });
  assert.strictEqual(devanshSignup.status, 201);
  console.log('✅ Newly added student completed first-time signup');

  // New student logs in
  const devanshLogin = await makeRequest('POST', '/api/auth/login', {}, {
    email: 'student.devansh@iiita.ac.in',
    password: 'devanshPassword99'
  });
  assert.strictEqual(devanshLogin.status, 200);
  console.log('✅ Newly added student logged in successfully');

  // 7b. Admin creates faculty
  const addFacultyRes = await makeRequest('POST', '/api/admin/faculty', { Authorization: `Bearer ${adminToken}` }, {
    name: 'Dr. Vrijendra Singh',
    email: 'faculty.vrijendra@iiita.ac.in',
    facultyCode: 'FAC-IT-05',
    department: 'Department of Information Technology',
    designation: 'Professor',
    officeRoom: 'CC3-510'
  });
  assert.strictEqual(addFacultyRes.status, 201);
  console.log('✅ Admin added new faculty: Dr. Vrijendra Singh (FAC-IT-05)');

  // New faculty tries to log in before signing up
  const vrijendraPreLogin = await makeRequest('POST', '/api/auth/login', {}, {
    email: 'faculty.vrijendra@iiita.ac.in',
    password: 'password123'
  });
  assert.strictEqual(vrijendraPreLogin.status, 403);
  console.log('✅ Newly added faculty login blocked before signup');

  // New faculty completes first-time signup
  const vrijendraSignup = await makeRequest('POST', '/api/auth/signup', {}, {
    role: 'faculty',
    email: 'faculty.vrijendra@iiita.ac.in',
    facultyCode: 'FAC-IT-05',
    password: 'profVrijendraPass'
  });
  assert.strictEqual(vrijendraSignup.status, 201);
  console.log('✅ Newly added faculty completed first-time signup');

  // New faculty logs in
  const vrijendraLogin = await makeRequest('POST', '/api/auth/login', {}, {
    email: 'faculty.vrijendra@iiita.ac.in',
    password: 'profVrijendraPass'
  });
  assert.strictEqual(vrijendraLogin.status, 200);
  console.log('✅ Newly added faculty logged in successfully');

  console.log('\n🎉 ALL REDESIGNED AUTHENTICATION TESTS PASSED WITH 100% SUCCESS!');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
