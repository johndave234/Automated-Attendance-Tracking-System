const mongoose = require('mongoose');

// Define the schema for student attendance entries within a session
const studentAttendanceSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: true,
    trim: true
  },
  studentName: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    required: true,
    enum: ['Present', 'Absent', 'Late', 'Pending'],
    default: 'Pending'
  },
  timeIn: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    default: ''
  }
}, { _id: true });

// Define the main SessionAttendance schema
const sessionAttendanceSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  courseCode: {
    type: String,
    required: true,
    trim: true
  },
  courseName: {
    type: String,
    required: true,
    trim: true
  },
  session: {
    date: {
      type: Date,
      required: true,
      default: Date.now
    },
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: true
    },
    startTime: {
      type: String,
      required: true
    },
    endTime: {
      type: String,
      required: true
    },
    room: {
      type: String,
      default: ''
    }
  },
  students: [studentAttendanceSchema],
  yearSection: {
    type: String,
    default: ''
  },
  program: {
    type: String,
    default: ''
  },
  createdBy: {
    type: String,
    default: null
  }
}, { timestamps: true });

// Create indexes for faster queries
sessionAttendanceSchema.index({ courseId: 1, 'session.date': 1 });
sessionAttendanceSchema.index({ courseCode: 1, 'session.date': 1 });
sessionAttendanceSchema.index({ 'students.studentId': 1 });

const SessionAttendance = mongoose.model('SessionAttendance', sessionAttendanceSchema);

module.exports = SessionAttendance; 