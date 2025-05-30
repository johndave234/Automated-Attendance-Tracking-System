// Configuration file for backend services
const config = require('./config');

// Base URL for API requests within the backend
const API_URL = `http://localhost:${config.port}`;

// API endpoints
const endpoints = {
    students: '/api/students',
    instructors: '/api/instructors',
    courses: '/api/courses',
    attendance: '/api/attendance',
    sessions: '/api/sessions',
    sessionAttendance: '/api/session-attendance'
};

module.exports = {
    API_URL,
    endpoints
}; 