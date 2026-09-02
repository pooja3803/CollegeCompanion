const express = require('express');
const cors = require('cors');
require('dotenv').config();
require('./config/database');

const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/student');
const facultyRoutes = require('./routes/faculty');
const adminRoutes = require('./routes/admin');
const explorerRoutes = require('./routes/explorer');
const facilitiesRoutes = require('./routes/facilities');
const eventsRoutes = require('./routes/events');

const app = express();

const PORT = process.env.PORT || 5050;

// Middleware
app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'https://collegecompanion-r28.onrender.com'
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

app.use(express.json());

// AUTH ROUTES

app.use('/api/auth', authRoutes);

// STUDENT ROUTES

app.use('/api/student', studentRoutes);

// FACULTY ROUTES


app.use('/api/faculty', facultyRoutes);

// ADMIN ROUTES
// Students, Faculty, Subjects, Timetable, Notices

app.use('/api/admin', adminRoutes);

// EXPLORER ROUTES
// Student / Faculty / Admin shared explorer data

app.use('/api/explorer', explorerRoutes);

// SINGLE SOURCE OF TRUTH
// CAMPUS EVENTS


app.use('/api/events', eventsRoutes);

// SINGLE SOURCE OF TRUTH
// CAMPUS FACILITIES

app.use('/api/facilities', facilitiesRoutes);

// HEALTH CHECK

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'College Companion Backend is running'
  });
});

// API 404 HANDLER

app.use('/api', (req, res) => {
  res.status(404).json({
    message: `API route not found: ${req.method} ${req.originalUrl}`
  });
});

// GLOBAL ERROR HANDLER

app.use((err, req, res, next) => {
  console.error('Server error:', err);

  res.status(500).json({
    message: 'Internal server error',
    error: err.message
  });
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(
      `🚀 College Companion Backend running at http://localhost:${PORT}`
    );
  });
}

module.exports = app;