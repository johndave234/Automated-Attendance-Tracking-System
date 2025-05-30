const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    courseCode: {
        type: String,
        required: true,
        trim: true
    },
    studentId: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        required: true,
        enum: ['Absent', 'Present', 'Late', 'Excused'],
        default: 'Absent'
    },
    yearSection: {
        type: String,
        required: false,
        trim: true
    },
    date: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Create indexes for faster queries
attendanceSchema.index({ courseCode: 1, studentId: 1, date: 1 });

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance; 