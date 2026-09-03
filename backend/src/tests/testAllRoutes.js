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
      resolve({ status: 404, body: { message: `Cannot ${method} ${url}` } });
    });
  });
}

async function runRouteVerification() {
  console.log('🧪 Verifying All Routes (No 404s for any Facilities or Events Endpoint)...');

  // Seed baseline data
  await seed();

  // 1. Admin Login
  const loginRes = await makeRequest('POST', '/api/auth/login', {}, { email: 'admin@iiita.ac.in', password: 'password123' });
  assert.strictEqual(loginRes.status, 200, 'Admin login failed');
  const adminToken = loginRes.body.token;

  // 2. Student Signup & Login (using redesigned first-time signup)
  const studentSignupRes = await makeRequest('POST', '/api/auth/signup', {}, {
    role: 'student',
    email: 'student.aarav@iiita.ac.in',
    rollNumber: 'IIT2022001',
    password: 'studentPassword123'
  });
  assert.strictEqual(studentSignupRes.status, 201, 'Student signup failed');

  const studentLoginRes = await makeRequest('POST', '/api/auth/login', {}, {
    email: 'student.aarav@iiita.ac.in',
    password: 'studentPassword123'
  });
  assert.strictEqual(studentLoginRes.status, 200, 'Student login failed');
  const studentToken = studentLoginRes.body.token;

  // 3. Test /api/admin/facilities
  console.log('\n--- Test: /api/admin/facilities CRUD ---');
  const getAdminFac = await makeRequest('GET', '/api/admin/facilities', { Authorization: `Bearer ${adminToken}` });
  assert.strictEqual(getAdminFac.status, 200, 'GET /api/admin/facilities must return 200');
  console.log(`✅ GET /api/admin/facilities -> 200 OK (${getAdminFac.body.length} records)`);

  const postAdminFac = await makeRequest('POST', '/api/admin/facilities', { Authorization: `Bearer ${adminToken}` }, {
    name: 'Quantum Computing Lab',
    category: 'Academic & Labs',
    location: 'CC3 Room 502',
    description: 'Specialized cryogenic testbed and quantum simulator workstation.',
    timings: '24x7'
  });
  assert.strictEqual(postAdminFac.status, 201, 'POST /api/admin/facilities must return 201');
  const facId = postAdminFac.body.facilityId;
  console.log(`✅ POST /api/admin/facilities -> 201 Created (ID: ${facId})`);

  const putAdminFac = await makeRequest('PUT', `/api/admin/facilities/${facId}`, { Authorization: `Bearer ${adminToken}` }, {
    name: 'Quantum Computing Lab (Q-Lab)',
    category: 'Academic & Research',
    location: 'CC3 Room 502',
    description: 'Updated description.',
    timings: '24x7'
  });
  assert.strictEqual(putAdminFac.status, 200, 'PUT /api/admin/facilities/:id must return 200');
  console.log('✅ PUT /api/admin/facilities/:id -> 200 OK');

  // 4. Test /api/facilities (Direct mount)
  console.log('\n--- Test: /api/facilities CRUD ---');
  const getFac = await makeRequest('GET', '/api/facilities', { Authorization: `Bearer ${adminToken}` });
  assert.strictEqual(getFac.status, 200, 'GET /api/facilities must return 200');
  console.log(`✅ GET /api/facilities -> 200 OK (${getFac.body.length} records)`);

  const postFac = await makeRequest('POST', '/api/facilities', { Authorization: `Bearer ${adminToken}` }, {
    name: 'VLSI Design Annex',
    category: 'Academic & Labs',
    location: 'CC1 Wing C',
    description: 'Cadence and Synopsys tool workstations.',
    timings: '08:00 AM - 10:00 PM'
  });
  assert.strictEqual(postFac.status, 201, 'POST /api/facilities must return 201');
  const fac2Id = postFac.body.facilityId;
  console.log(`✅ POST /api/facilities -> 201 Created (ID: ${fac2Id})`);

  // 5. Test /api/admin/events
  console.log('\n--- Test: /api/admin/events CRUD ---');
  const getAdminEv = await makeRequest('GET', '/api/admin/events', { Authorization: `Bearer ${adminToken}` });
  assert.strictEqual(getAdminEv.status, 200, 'GET /api/admin/events must return 200');
  console.log(`✅ GET /api/admin/events -> 200 OK (${getAdminEv.body.length} records)`);

  const postAdminEv = await makeRequest('POST', '/api/admin/events', { Authorization: `Bearer ${adminToken}` }, {
    title: 'TEDx IIIT Allahabad 2026',
    category: 'Seminar',
    date: '2026-11-05',
    time: '02:00 PM',
    venue: 'Main Auditorium',
    organizer: 'Literary & Debating Society',
    description: 'Independent TED event featuring thought leaders in tech and science.'
  });
  assert.strictEqual(postAdminEv.status, 201, 'POST /api/admin/events must return 201');
  const evId = postAdminEv.body.eventId;
  console.log(`✅ POST /api/admin/events -> 201 Created (ID: ${evId})`);

  const putAdminEv = await makeRequest('PUT', `/api/admin/events/${evId}`, { Authorization: `Bearer ${adminToken}` }, {
    title: 'TEDx IIIT Allahabad 2026 (Global Edition)',
    category: 'Seminar',
    date: '2026-11-05',
    time: '02:00 PM',
    venue: 'Main Auditorium',
    organizer: 'Literary & Debating Society',
    description: 'Updated TEDx description.'
  });
  assert.strictEqual(putAdminEv.status, 200, 'PUT /api/admin/events/:id must return 200');
  console.log('✅ PUT /api/admin/events/:id -> 200 OK');

  // 6. Test /api/events (Direct mount)
  console.log('\n--- Test: /api/events CRUD ---');
  const getEv = await makeRequest('GET', '/api/events', { Authorization: `Bearer ${adminToken}` });
  assert.strictEqual(getEv.status, 200, 'GET /api/events must return 200');
  console.log(`✅ GET /api/events -> 200 OK (${getEv.body.length} records)`);

  const postEv = await makeRequest('POST', '/api/events', { Authorization: `Bearer ${adminToken}` }, {
    title: 'RoboWars 2026',
    category: 'Sports',
    date: '2026-12-01',
    time: '11:00 AM',
    venue: 'SAC Arena',
    organizer: 'Robotics Society',
    description: 'Combat robotics tournament.'
  });
  assert.strictEqual(postEv.status, 201, 'POST /api/events must return 201');
  const ev2Id = postEv.body.eventId;
  console.log(`✅ POST /api/events -> 201 Created (ID: ${ev2Id})`);

  // 7. Test Explorer Endpoints
  console.log('\n--- Test: /api/explorer/campus-info & /api/explorer/events ---');
  const expCamp = await makeRequest('GET', '/api/explorer/campus-info', { Authorization: `Bearer ${studentToken}` });
  assert.strictEqual(expCamp.status, 200);
  assert.ok(expCamp.body.find(f => f.id === facId), 'Added facility must appear in Explorer campus-info');
  console.log(`✅ GET /api/explorer/campus-info -> 200 OK (${expCamp.body.length} records, contains newly added facility)`);

  const expFac = await makeRequest('GET', '/api/explorer/facilities', { Authorization: `Bearer ${studentToken}` });
  assert.strictEqual(expFac.status, 200);
  console.log(`✅ GET /api/explorer/facilities -> 200 OK (${expFac.body.length} records)`);

  const expEv = await makeRequest('GET', '/api/explorer/events', { Authorization: `Bearer ${studentToken}` });
  assert.strictEqual(expEv.status, 200);
  assert.ok(expEv.body.find(e => e.id === evId), 'Added event must appear in Explorer events');
  console.log(`✅ GET /api/explorer/events -> 200 OK (${expEv.body.length} records, contains newly added event)`);

  // 8. Delete test entries
  console.log('\n--- Test: Cleanup / DELETE ---');
  const del1 = await makeRequest('DELETE', `/api/admin/facilities/${facId}`, { Authorization: `Bearer ${adminToken}` });
  assert.strictEqual(del1.status, 200);
  const del2 = await makeRequest('DELETE', `/api/facilities/${fac2Id}`, { Authorization: `Bearer ${adminToken}` });
  assert.strictEqual(del2.status, 200);
  const del3 = await makeRequest('DELETE', `/api/admin/events/${evId}`, { Authorization: `Bearer ${adminToken}` });
  assert.strictEqual(del3.status, 200);
  const del4 = await makeRequest('DELETE', `/api/events/${ev2Id}`, { Authorization: `Bearer ${adminToken}` });
  assert.strictEqual(del4.status, 200);
  console.log('✅ DELETE endpoints verified (both /api/admin/* and /api/* paths working)');

  console.log('\n🎉 ALL ROUTES VERIFIED WITH ZERO 404 ERRORS!');
}

runRouteVerification().catch(err => {
  console.error('❌ Route verification failed:', err);
  process.exit(1);
});
