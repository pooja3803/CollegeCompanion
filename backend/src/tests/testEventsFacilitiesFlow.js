const assert = require('assert');
const { EventEmitter } = require('events');
const app = require('../server');

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

    let resBody = '';
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
        if (data) this.send(data);
        else resolve({ status: statusCode, body: resBody });
      }
    };

    app(req, res, () => {
      resolve({ status: 404, body: { message: 'Not found' } });
    });
  });
}

async function runEndToEndVerification() {
  console.log('🚀 Starting In-Memory API Integration & Auth Flow Test...');

  // 1. Admin Login
  console.log('\n--- Step 1: Admin Authentication ---');
  const adminLoginRes = await makeRequest('POST', '/api/auth/login', { 'Content-Type': 'application/json' }, { email: 'admin@iiita.ac.in', password: 'password123' });
  assert.strictEqual(adminLoginRes.status, 200, 'Admin login status must be 200');
  assert.ok(adminLoginRes.body.token, 'Admin token must be returned');
  const adminToken = adminLoginRes.body.token;
  console.log('✅ Admin login successful, received JWT token.');

  // 2. Admin adds a new Campus Facility with Auth token
  console.log('\n--- Step 2: Admin Adds Campus Facility (with Auth Token) ---');
  const newFacility = {
    name: 'High Performance Computing Cluster (Param-IIITA)',
    category: 'Academic & Labs',
    description: 'NVIDIA H100 GPU cluster for Deep Learning and parallel distributed simulations.',
    location: 'CC3 Supercomputing Annex',
    timings: '24x7 with Access Card'
  };

  const addFacilityRes = await makeRequest('POST', '/api/admin/facilities', {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`
  }, newFacility);

  assert.strictEqual(addFacilityRes.status, 201, 'Facility creation must return 201');
  const createdFacilityId = addFacilityRes.body.facilityId;
  assert.ok(createdFacilityId > 0, 'Facility ID must be returned');
  console.log(`✅ Campus Facility created successfully! (ID: ${createdFacilityId})`);

  // 3. Admin checks stats and facilities
  console.log('\n--- Step 3: Admin Verifies Stats and List from SQLite ---');
  const adminStatsRes = await makeRequest('GET', '/api/admin/stats', { 'Authorization': `Bearer ${adminToken}` });
  assert.strictEqual(adminStatsRes.status, 200);
  console.log(`✅ Admin stats retrieved: totalFacilities = ${adminStatsRes.body.totalFacilities}`);

  const adminFacilitiesRes = await makeRequest('GET', '/api/admin/facilities', { 'Authorization': `Bearer ${adminToken}` });
  assert.strictEqual(adminFacilitiesRes.status, 200);
  const foundInAdminList = adminFacilitiesRes.body.find(f => f.id === createdFacilityId);
  assert.ok(foundInAdminList, 'Facility must be in Admin list');
  console.log(`✅ Admin facility list contains newly added "${foundInAdminList.name}"`);

  // 4. Student logs in and queries Explorer
  console.log('\n--- Step 4: Student Logs In & Queries Single Source of Truth Explorer ---');
  const studentLoginRes = await makeRequest('POST', '/api/auth/login', { 'Content-Type': 'application/json' }, { email: 'student.aarav@iiita.ac.in', password: 'password123' });
  const studentToken = studentLoginRes.body.token;
  assert.ok(studentToken, 'Student token must be returned');

  const studentExplorerRes = await makeRequest('GET', '/api/explorer/campus-info', { 'Authorization': `Bearer ${studentToken}` });
  assert.strictEqual(studentExplorerRes.status, 200);
  const foundInStudent = studentExplorerRes.body.find(f => f.id === createdFacilityId);
  assert.ok(foundInStudent, 'Student Explorer must see the DB-backed facility');
  console.log(`✅ Student Explorer retrieved the exact DB-backed facility: "${foundInStudent.name}"`);

  // 5. Faculty logs in and queries Explorer
  console.log('\n--- Step 5: Faculty Logs In & Queries Single Source of Truth Explorer ---');
  const facultyLoginRes = await makeRequest('POST', '/api/auth/login', { 'Content-Type': 'application/json' }, { email: 'faculty.manish@iiita.ac.in', password: 'password123' });
  const facultyToken = facultyLoginRes.body.token;
  assert.ok(facultyToken, 'Faculty token must be returned');

  const facultyExplorerRes = await makeRequest('GET', '/api/explorer/campus-info', { 'Authorization': `Bearer ${facultyToken}` });
  assert.strictEqual(facultyExplorerRes.status, 200);
  const foundInFaculty = facultyExplorerRes.body.find(f => f.id === createdFacilityId);
  assert.ok(foundInFaculty, 'Faculty Explorer must see the DB-backed facility');
  console.log(`✅ Faculty Explorer retrieved the exact DB-backed facility: "${foundInFaculty.name}"`);

  // 6. Admin adds a Campus Event
  console.log('\n--- Step 6: Admin Adds Campus Event ---');
  const newEvent = {
    title: 'Aparoksha 2026 - National Tech Fest',
    category: 'Technical',
    description: 'Annual technical festival of IIIT Allahabad with flagship coding competitions and hackathons.',
    date: '2026-10-15',
    time: '10:00 AM',
    venue: 'Main Auditorium & CC3',
    organizer: 'Technical Society, IIIT-A'
  };

  const addEventRes = await makeRequest('POST', '/api/admin/events', {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`
  }, newEvent);

  assert.strictEqual(addEventRes.status, 201);
  const createdEventId = addEventRes.body.eventId;
  console.log(`✅ Campus Event created successfully! (ID: ${createdEventId})`);

  // 7. Student and Faculty see Event in Explorer
  console.log('\n--- Step 7: Student and Faculty Verify Event in Explorer ---');
  const studentEventsRes = await makeRequest('GET', '/api/explorer/events', { 'Authorization': `Bearer ${studentToken}` });
  assert.strictEqual(studentEventsRes.status, 200);
  const eventInStudent = studentEventsRes.body.find(e => e.id === createdEventId);
  assert.ok(eventInStudent, 'Student Explorer must see the new event');
  console.log(`✅ Student Explorer sees event: "${eventInStudent.title}"`);

  const facultyEventsRes = await makeRequest('GET', '/api/explorer/events', { 'Authorization': `Bearer ${facultyToken}` });
  assert.strictEqual(facultyEventsRes.status, 200);
  const eventInFaculty = facultyEventsRes.body.find(e => e.id === createdEventId);
  assert.ok(eventInFaculty, 'Faculty Explorer must see the new event');
  console.log(`✅ Faculty Explorer sees event: "${eventInFaculty.title}"`);

  // 8. Admin updates and deletes test items
  console.log('\n--- Step 8: Admin Updates & Deletes Test Items ---');
  const deleteFacRes = await makeRequest('DELETE', `/api/admin/facilities/${createdFacilityId}`, { 'Authorization': `Bearer ${adminToken}` });
  assert.strictEqual(deleteFacRes.status, 200);
  console.log('✅ Admin successfully deleted test facility from SQLite database.');

  const deleteEvRes = await makeRequest('DELETE', `/api/admin/events/${createdEventId}`, { 'Authorization': `Bearer ${adminToken}` });
  assert.strictEqual(deleteEvRes.status, 200);
  console.log('✅ Admin successfully deleted test event from SQLite database.');

  console.log('\n🎉 ALL INTEGRATION & AUTHENTICATION FLOW TESTS PASSED WITH 100% SUCCESS!');
}

runEndToEndVerification().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
