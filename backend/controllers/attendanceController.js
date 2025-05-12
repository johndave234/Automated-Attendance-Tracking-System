const Attendance = require('../models/Attendance');
const Course = require('../models/Course');
const Student = require('../models/Student');
const Instructor = require('../models/Instructor');

// Record attendance from QR code scan
exports.recordAttendance = async (req, res) => {
  try {
    const { studentId, courseId, instructorId, timestamp, qrCodeData } = req.body;

    // Validate required fields
    if (!studentId || !courseId || !instructorId || !timestamp || !qrCodeData) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Check if student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if instructor exists
    const instructor = await Instructor.findById(instructorId);
    if (!instructor) {
      return res.status(404).json({
        success: false,
        message: 'Instructor not found'
      });
    }

    // Check if student is enrolled in the course
    if (!course.enrolledStudents.includes(studentId)) {
      return res.status(403).json({
        success: false,
        message: 'Student is not enrolled in this course'
      });
    }

    // Check if attendance already exists for this student, course, and timestamp
    const existingAttendance = await Attendance.findOne({
      studentId,
      courseId,
      timestamp: new Date(timestamp)
    });

    if (existingAttendance) {
      return res.status(409).json({
        success: false,
        message: 'Attendance already recorded for this session'
      });
    }

    // Create new attendance record
    const attendance = new Attendance({
      studentId,
      courseId,
      instructorId,
      timestamp: new Date(timestamp),
      qrCodeData
    });

    await attendance.save();

    res.status(201).json({
      success: true,
      message: 'Attendance recorded successfully',
      data: attendance
    });
  } catch (error) {
    console.error('Error recording attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record attendance',
      error: error.message
    });
  }
};

// Get attendance records for a student
exports.getStudentAttendance = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { courseId, startDate, endDate } = req.query;

    const query = { studentId };

    if (courseId) {
      query.courseId = courseId;
    }

    if (startDate && endDate) {
      query.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const attendance = await Attendance.find(query)
      .populate('courseId', 'name code')
      .populate('instructorId', 'name')
      .sort({ timestamp: -1 });

    res.json({
      success: true,
      data: attendance
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance records',
      error: error.message
    });
  }
}; 