const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authenticateToken } = require('../middleware/auth');

// Record attendance from QR code scan
router.post('/record', authenticateToken, (req, res, next) => {
  try {
    // Wrap the controller function to catch any errors
    return attendanceController.recordAttendance(req, res, next);
  } catch (error) {
    console.error('Error in attendance route:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error in attendance route',
      error: error.message
    });
  }
});

// Get attendance records for a student
router.get('/student/:studentId', authenticateToken, attendanceController.getStudentAttendance);

module.exports = router; 