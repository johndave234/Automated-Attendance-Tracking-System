const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Course = require('../models/Course');
const { adminAuth } = require('../middleware/adminAuth');

// Record attendance (called when QR code is scanned)
router.post('/record', async (req, res) => {
    try {
        const { courseCode, studentId, status = 'Present', yearSection } = req.body;

        // Validate required fields
        if (!courseCode || !studentId) {
            return res.status(400).json({ message: 'Course code and student ID are required' });
        }

        // Check if student exists
        const student = await Student.findOne({ idNumber: studentId });
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Check if course exists
        const course = await Course.findOne({ courseCode });
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Check if student is enrolled in the course
        if (course.students && !course.students.includes(studentId)) {
            return res.status(400).json({ message: 'Student is not enrolled in this course' });
        }

        // Check if attendance already recorded for today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const existingAttendance = await Attendance.findOne({
            courseCode,
            studentId,
            date: {
                $gte: today,
                $lt: tomorrow
            }
        });

        if (existingAttendance) {
            // Update existing attendance record
            existingAttendance.status = status;
            await existingAttendance.save();
            
            return res.status(200).json({
                message: 'Attendance updated successfully',
                attendance: existingAttendance
            });
        }

        // Create new attendance record
        const attendance = new Attendance({
            courseCode,
            studentId,
            status,
            yearSection: yearSection || student.yearSection || course.yearSection || '',
            date: new Date()
        });

        await attendance.save();

        res.status(201).json({
            message: 'Attendance recorded successfully',
            attendance
        });
    } catch (error) {
        console.error('Error recording attendance:', error);
        res.status(500).json({ message: error.message });
    }
});

// Record attendance with manual code
router.post('/manual', async (req, res) => {
    try {
        const { courseId, courseCode, studentId, manualCode, studentName } = req.body;

        // Validate required fields
        if (!courseCode || !studentId || !manualCode) {
            return res.status(400).json({ 
                success: false,
                message: 'Course code, student ID, and manual code are required' 
            });
        }

        // Check if student exists
        const student = await Student.findOne({ idNumber: studentId });
        if (!student) {
            return res.status(404).json({ 
                success: false,
                message: 'Student not found' 
            });
        }

        // Check if course exists - try to find by ID first, then by code
        let course = null;
        
        if (courseId) {
            course = await Course.findById(courseId);
        }
        
        // If not found by ID, try course code
        if (!course) {
            course = await Course.findOne({ courseCode });
        }
        
        if (!course) {
            return res.status(404).json({ 
                success: false,
                message: 'Course not found' 
            });
        }

        // Verify the manual code
        console.log('Comparing codes:', { 
            providedCode: manualCode, 
            courseCode: course.attendanceCode 
        });
        
        if (!course.attendanceCode || course.attendanceCode !== manualCode) {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid attendance code' 
            });
        }

        // Check if student is enrolled in the course
        if (!course.isStudentEnrolled(studentId)) {
            return res.status(400).json({ 
                success: false,
                message: 'Student is not enrolled in this course' 
            });
        }

        // Check if attendance already recorded for today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const existingAttendance = await Attendance.findOne({
            courseCode,
            studentId,
            date: {
                $gte: today,
                $lt: tomorrow
            }
        });

        if (existingAttendance) {
            // Update existing attendance record
            existingAttendance.status = 'Present';
            await existingAttendance.save();
            
            return res.json({
                success: true,
                message: 'Attendance updated successfully',
                attendance: existingAttendance
            });
        }

        // Create new attendance record
        const attendance = new Attendance({
            courseCode,
            studentId,
            status: 'Present',
            yearSection: student.yearSection || course.yearSection || '',
            date: new Date()
        });

        await attendance.save();

        res.json({
            success: true,
            message: 'Attendance recorded successfully',
            attendance
        });
    } catch (error) {
        console.error('Error recording manual attendance:', error);
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
});

// Get attendance records for a course (admin only)
router.get('/course/:courseCode', adminAuth, async (req, res) => {
    try {
        const { courseCode } = req.params;
        const { date, startDate, endDate } = req.query;

        let dateFilter = {};

        if (date) {
            // Filter for a specific date
            const specificDate = new Date(date);
            specificDate.setHours(0, 0, 0, 0);
            
            const nextDay = new Date(specificDate);
            nextDay.setDate(nextDay.getDate() + 1);
            
            dateFilter = {
                date: {
                    $gte: specificDate,
                    $lt: nextDay
                }
            };
        } else if (startDate && endDate) {
            // Filter between date range
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            
            dateFilter = {
                date: {
                    $gte: start,
                    $lte: end
                }
            };
        }

        const attendanceRecords = await Attendance.find({
            courseCode,
            ...dateFilter
        }).sort({ date: -1 });

        // Get all unique students for this course
        const students = await Student.find({
            idNumber: { $in: attendanceRecords.map(record => record.studentId) }
        });

        // Map student names to attendance records
        const formattedRecords = attendanceRecords.map(record => {
            const student = students.find(s => s.idNumber === record.studentId);
            return {
                _id: record._id,
                courseCode: record.courseCode,
                studentId: record.studentId,
                studentName: student ? student.fullName : 'Unknown Student',
                status: record.status,
                yearSection: record.yearSection,
                date: record.date
            };
        });

        res.json(formattedRecords);
    } catch (error) {
        console.error('Error fetching attendance records:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get attendance records for a student
router.get('/student/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;
        const { courseCode, startDate, endDate } = req.query;

        // Validate student exists
        const student = await Student.findOne({ idNumber: studentId });
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Build query filters
        let query = { studentId };
        
        if (courseCode) {
            query.courseCode = courseCode;
        }
        
        if (startDate && endDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            
            query.date = {
                $gte: start,
                $lte: end
            };
        }

        const attendanceRecords = await Attendance.find(query).sort({ date: -1 });

        // Get course codes
        const courseCodes = [...new Set(attendanceRecords.map(record => record.courseCode))];
        
        // Get course details
        const courses = await Course.find({
            courseCode: { $in: courseCodes }
        });

        // Map course names to attendance records
        const formattedRecords = attendanceRecords.map(record => {
            const course = courses.find(c => c.courseCode === record.courseCode);
            return {
                _id: record._id,
                courseCode: record.courseCode,
                courseName: course ? course.courseName : 'Unknown Course',
                status: record.status,
                yearSection: record.yearSection,
                date: record.date
            };
        });

        res.json(formattedRecords);
    } catch (error) {
        console.error('Error fetching student attendance:', error);
        res.status(500).json({ message: error.message });
    }
});

// Update attendance status (admin only)
router.put('/:attendanceId', adminAuth, async (req, res) => {
    try {
        const { attendanceId } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ message: 'Status is required' });
        }

        const attendance = await Attendance.findById(attendanceId);
        if (!attendance) {
            return res.status(404).json({ message: 'Attendance record not found' });
        }

        attendance.status = status;
        await attendance.save();

        res.json({
            message: 'Attendance status updated successfully',
            attendance
        });
    } catch (error) {
        console.error('Error updating attendance:', error);
        res.status(500).json({ message: error.message });
    }
});

// Delete attendance record (admin only)
router.delete('/:attendanceId', adminAuth, async (req, res) => {
    try {
        const { attendanceId } = req.params;

        const attendance = await Attendance.findById(attendanceId);
        if (!attendance) {
            return res.status(404).json({ message: 'Attendance record not found' });
        }

        await attendance.deleteOne();

        res.json({ message: 'Attendance record deleted successfully' });
    } catch (error) {
        console.error('Error deleting attendance:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 