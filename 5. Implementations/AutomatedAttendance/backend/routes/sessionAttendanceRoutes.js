const express = require('express');
const router = express.Router();
const SessionAttendance = require('../models/SessionAttendance');
const Student = require('../models/Student');
const Course = require('../models/Course');
const { adminAuth } = require('../middleware/adminAuth');
const { instructorAuth } = require('../middleware/instructorAuth');

// Helper function to get current Philippines date and time
const getPhilippinesDateTime = () => {
    // Philippines is UTC+8
    const options = { 
        timeZone: 'Asia/Manila',
        hour12: true
    };
    
    const now = new Date();
    // Format the date in Philippine time
    return now;
};

// Format date for display in Philippine format (MM/DD/YYYY)
const formatPhilippineDate = (date) => {
    const options = { 
        timeZone: 'Asia/Manila',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    };
    
    return new Date(date).toLocaleDateString('en-PH', options);
};

// Format time in Philippine format (hh:mm:ss AM/PM)
const formatPhilippineTime = (date) => {
    const options = { 
        timeZone: 'Asia/Manila',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    };
    
    return new Date(date).toLocaleTimeString('en-PH', options);
};

// Helper function to check if a session has ended based on its end time
const isSessionEnded = (session) => {
    try {
        // Get current date and time
        const now = getPhilippinesDateTime();
        console.log(`Checking if session ${session._id} has ended...`);
        console.log(`Current time: ${now.toLocaleTimeString()}`);
        
        // Get session date from the database
        const sessionDate = new Date(session.session.date);
        
        // If session is from a previous day, it has ended
        const currentDate = new Date();
        if (sessionDate.getDate() < currentDate.getDate() ||
            sessionDate.getMonth() < currentDate.getMonth() ||
            sessionDate.getFullYear() < currentDate.getFullYear()) {
            console.log('Session is from a previous day - has ended');
            return true;
        }
        
        // If session is today, check the end time
        if (sessionDate.getDate() === currentDate.getDate() &&
            sessionDate.getMonth() === currentDate.getMonth() &&
            sessionDate.getFullYear() === currentDate.getFullYear()) {
            
            // Parse the session end time (format: "HH:MM AM/PM")
            const endTimeStr = session.session.endTime;
            console.log(`Session end time: ${endTimeStr}`);
            
            const endTimeParts = endTimeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
            if (!endTimeParts) {
                console.log(`Could not parse end time format: ${endTimeStr}`);
                return false;
            }
            
            let endHour = parseInt(endTimeParts[1], 10);
            const endMinute = parseInt(endTimeParts[2], 10);
            const period = endTimeParts[3].toUpperCase();
            
            // Convert to 24-hour format
            if (period === 'PM' && endHour < 12) {
                endHour += 12;
            } else if (period === 'AM' && endHour === 12) {
                endHour = 0;
            }
            
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            
            console.log(`End time: ${endHour}:${endMinute} (24hr format)`);
            console.log(`Current time: ${currentHour}:${currentMinute} (24hr format)`);
            
            // Check if current time is past the end time
            if (currentHour > endHour || 
                (currentHour === endHour && currentMinute >= endMinute)) {
                console.log('Current time is past end time - session has ended');
                return true;
            } else {
                console.log('Current time is before end time - session is still active');
                return false;
            }
        }
        
        console.log('Session is for a future day - has not ended');
        return false;
    } catch (error) {
        console.error('Error checking if session has ended:', error);
        return false;
    }
};

// Helper function to mark pending students as absent in a session
const markPendingAsAbsent = async (session) => {
    console.log(`Looking for pending students in session ${session._id}...`);
    
    let pendingCount = 0;
    const pendingStudents = [];
    
    session.students.forEach(student => {
        if (student.status === 'Pending') {
            student.status = 'Absent';
            pendingCount++;
            pendingStudents.push(student.studentId);
        }
    });
    
    if (pendingCount > 0) {
        console.log(`Found ${pendingCount} pending students: ${pendingStudents.join(', ')}`);
        await session.save();
        console.log(`Updated ${pendingCount} students from Pending to Absent`);
    } else {
        console.log('No pending students found in this session');
    }
    
    return pendingCount;
};

// Check and update session status - used by all endpoints that retrieve session data
const checkAndUpdateSessionStatus = async (session) => {
    if (!session) return null;
    
    console.log(`\n=== Checking session ${session._id} for ${session.courseCode} ===`);
    console.log(`Session date: ${new Date(session.session.date).toLocaleDateString()}`);
    console.log(`Session time: ${session.session.startTime} - ${session.session.endTime}`);
    
    // Count students by status
    const statusCounts = {
        Present: 0,
        Absent: 0,
        Late: 0,
        Pending: 0
    };
    
    session.students.forEach(student => {
        if (statusCounts[student.status] !== undefined) {
            statusCounts[student.status]++;
        }
    });
    
    console.log(`Current student status: Present=${statusCounts.Present}, Absent=${statusCounts.Absent}, Late=${statusCounts.Late}, Pending=${statusCounts.Pending}`);
    
    // Check if the session has ended
    if (isSessionEnded(session)) {
        console.log('Session has ended - marking pending students as absent');
        // Look for pending students and mark them as absent
        await markPendingAsAbsent(session);
    } else {
        console.log('Session has not ended yet - keeping current status');
    }
    
    console.log(`=== Finished checking session ${session._id} ===\n`);
    return session;
};

// Create a new session attendance record (instructor or admin)
router.post('/create', async (req, res) => {
    try {
        const { courseId, courseCode, date, day } = req.body;

        // Validate required fields
        if (!courseId || !courseCode || !date || !day) {
            return res.status(400).json({ 
                success: false, 
                message: 'Course ID, course code, date, and day are required' 
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

        // Get the appropriate schedule for the day
        const schedule = course.schedules.find(s => s.day === day);
        if (!schedule) {
            return res.status(400).json({ 
                success: false, 
                message: `No schedule found for ${day} in this course` 
            });
        }

        // Check if a session already exists for this course, date, and day
        const existingSession = await SessionAttendance.findOne({
            courseId,
            'session.date': {
                $gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
                $lt: new Date(new Date(date).setHours(23, 59, 59, 999))
            },
            'session.day': day
        });

        if (existingSession) {
            return res.status(400).json({ 
                success: false, 
                message: 'A session already exists for this course on this date and day',
                session: existingSession
            });
        }

        // Get all enrolled students
        const enrolledStudents = course.students || [];
        
        // Get student details for all enrolled students
        const students = await Student.find({ idNumber: { $in: enrolledStudents } });

        // Prepare student attendance entries
        const studentAttendances = students.map(student => ({
            studentId: student.idNumber,
            studentName: student.fullName,
            status: 'Pending', // Change default status to Pending
            timeIn: null,
            notes: ''
        }));

        // Create new session attendance record
        const sessionAttendance = new SessionAttendance({
            courseId: course._id,
            courseCode: course.courseCode,
            courseName: course.courseName,
            session: {
                date: new Date(date),
                day,
                startTime: schedule.startTime,
                endTime: schedule.endTime,
                room: course.room || ''
            },
            students: studentAttendances,
            yearSection: course.yearSection || '',
            program: course.program || '',
            createdBy: req.user ? req.user.id : null
        });

        await sessionAttendance.save();

        res.status(201).json({
            success: true,
            message: 'Session attendance record created successfully',
            session: sessionAttendance
        });
    } catch (error) {
        console.error('Error creating session attendance:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// Record student attendance in a session (when QR code is scanned)
router.post('/record', async (req, res) => {
    try {
        const { sessionId, courseCode, studentId, status, uniqueCode, expiresAt, isManualCode } = req.body;
        
        console.log('Attendance record request:', req.body);
        
        // Determine the appropriate status based on conditions
        let attendanceStatus = 'Present'; // Default status for QR scanning
        
        // If manual code is used, check if QR code has expired
        if (isManualCode) {
            if (expiresAt) {
                const expirationTime = new Date(expiresAt);
                const now = new Date();
                
                // If using manual code after QR has expired, mark as Late
                if (now > expirationTime) {
                    attendanceStatus = 'Late';
                }
            } else {
                // If no expiration time provided with manual code, default to Late
                attendanceStatus = 'Late';
            }
        } else {
            // Regular QR code scan - validate expiration
            if (expiresAt) {
                const expirationTime = new Date(expiresAt);
                const now = new Date();
                
                if (now > expirationTime) {
                    return res.status(400).json({
                        success: false,
                        message: 'QR code has expired. Please use manual code or ask instructor for a new QR code.'
                    });
                }
            }
        }
        
        // Override with provided status if present
        if (status) {
            attendanceStatus = status;
        }
        
        // Check if student ID is provided
        if (!studentId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Student ID is required' 
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

        // Check if either sessionId or courseCode is provided
        if (!sessionId && !courseCode) {
            return res.status(400).json({ 
                success: false, 
                message: 'Either sessionId or courseCode is required' 
            });
        }

        let sessionAttendance;
        let course;

        // Find course first to check if student is enrolled
        if (courseCode) {
            course = await Course.findOne({ courseCode });
            if (!course) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Course not found' 
                });
            }

            // Check if student is enrolled in the course
            if (course.students && !course.students.includes(studentId)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Student is not enrolled in this course' 
                });
            }
        }

        // Find session by ID if provided
        if (sessionId) {
            sessionAttendance = await SessionAttendance.findById(sessionId);
            if (sessionAttendance) {
                // Check if session has ended and update status if needed
                sessionAttendance = await checkAndUpdateSessionStatus(sessionAttendance);
            } else {
                console.log('Session not found by ID, will try to create or find one');
            }
        } 
        
        // If no session found by ID, or no ID provided, look for today's session
        if (!sessionAttendance) {
            // Find the most recent session for today for this course
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            sessionAttendance = await SessionAttendance.findOne({
                courseCode,
                'session.date': {
                    $gte: today,
                    $lt: tomorrow
                }
            }).sort({ 'session.date': -1 });

            if (sessionAttendance) {
                // Check if session has ended and update status if needed
                sessionAttendance = await checkAndUpdateSessionStatus(sessionAttendance);
            }

            console.log('Looking for today\'s session:', sessionAttendance ? 'Found' : 'Not found');
        }

        // If still no session, try to create one
        if (!sessionAttendance && course) {
            try {
                console.log('Creating new session for attendance');
                
                // Get current date and day of week
                const today = getPhilippinesDateTime();
                const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                const currentDay = days[today.getDay()];
                
                // Find a schedule for today
                const schedule = course.schedules.find(s => s.day === currentDay);
                if (!schedule) {
                    return res.status(404).json({ 
                        success: false, 
                        message: `No schedule found for today (${currentDay}) in this course` 
                    });
                }
                
                // Get all enrolled students
                const enrolledStudents = course.students || [];
                
                // Get student details for all enrolled students
                const students = await Student.find({ idNumber: { $in: enrolledStudents } });
                
                // Prepare student attendance entries - all students start as Pending except the scanning student
                const studentAttendances = students.map(s => ({
                    studentId: s.idNumber,
                    studentName: s.fullName,
                    status: s.idNumber === studentId ? 'Present' : 'Pending',
                    timeIn: s.idNumber === studentId ? getPhilippinesDateTime() : null,
                    notes: '' // Removed notes as requested
                }));
                
                // Create new session attendance record
                const newSession = new SessionAttendance({
                    courseId: course._id,
                    courseCode: course.courseCode,
                    courseName: course.courseName,
                    session: {
                        date: getPhilippinesDateTime(),
                        day: currentDay,
                        startTime: schedule.startTime,
                        endTime: schedule.endTime,
                        room: course.room || ''
                    },
                    students: studentAttendances,
                    yearSection: course.yearSection || '',
                    program: course.program || '',
                    createdBy: null
                });
                
                await newSession.save();
                console.log('New session created with ID:', newSession._id);
                
                return res.status(201).json({
                    success: true,
                    message: 'Attendance recorded successfully with new session',
                    student: {
                        id: student.idNumber,
                        name: student.fullName,
                        status: 'Present'
                    },
                    session: {
                        id: newSession._id,
                        courseCode: newSession.courseCode,
                        courseName: newSession.courseName,
                        date: formatPhilippineDate(newSession.session.date),
                        time: formatPhilippineTime(newSession.session.date),
                        day: newSession.session.day
                    }
                });
            } catch (error) {
                console.error('Error creating session:', error);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Failed to create session for attendance' 
                });
            }
        }

        if (!sessionAttendance) {
            return res.status(404).json({ 
                success: false, 
                message: 'No active session found for today and could not create one' 
            });
        }

        // Check if student is in the session
        const studentIndex = sessionAttendance.students.findIndex(s => s.studentId === studentId);
        
        if (studentIndex === -1) {
            // Student not found in session, add them
            sessionAttendance.students.push({
                studentId: student.idNumber,
                studentName: student.fullName,
                status: attendanceStatus,
                timeIn: getPhilippinesDateTime(),
                notes: '' // Removed notes as requested
            });
        } else {
            // Update existing student status
            sessionAttendance.students[studentIndex].status = attendanceStatus;
            sessionAttendance.students[studentIndex].timeIn = getPhilippinesDateTime();
            sessionAttendance.students[studentIndex].notes = ''; // Clear any existing notes
        }

        await sessionAttendance.save();
        console.log('Updated existing session with new attendance');

        res.status(200).json({
            success: true,
            message: 'Attendance recorded successfully',
            student: {
                id: student.idNumber,
                name: student.fullName,
                status: attendanceStatus,
                timeRecorded: formatPhilippineTime(getPhilippinesDateTime())
            },
            session: {
                id: sessionAttendance._id,
                courseCode: sessionAttendance.courseCode,
                courseName: sessionAttendance.courseName,
                date: formatPhilippineDate(sessionAttendance.session.date),
                time: formatPhilippineTime(sessionAttendance.session.date),
                day: sessionAttendance.session.day
            }
        });
    } catch (error) {
        console.error('Error recording attendance:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// Get sessions for a course (admin or instructor)
router.get('/course/:courseId', async (req, res) => {
    try {
        const { courseId } = req.params;
        const { startDate, endDate } = req.query;

        // Build query filters
        let dateFilter = {};
        if (startDate && endDate) {
            dateFilter = {
                'session.date': {
                    $gte: new Date(new Date(startDate).setHours(0, 0, 0, 0)),
                    $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
                }
            };
        }

        const sessions = await SessionAttendance.find({
            courseId,
            ...dateFilter
        }).sort({ 'session.date': -1 });

        if (sessions.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No sessions found for this course',
                sessions: []
            });
        }
        
        // Check and update status for each session
        for (let i = 0; i < sessions.length; i++) {
            sessions[i] = await checkAndUpdateSessionStatus(sessions[i]);
        }

        res.status(200).json({
            success: true,
            sessions
        });
    } catch (error) {
        console.error('Error fetching course sessions:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// Get session details by ID
router.get('/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        
        let session = await SessionAttendance.findById(sessionId);
        
        if (!session) {
            return res.status(404).json({ 
                success: false, 
                message: 'Session not found' 
            });
        }
        
        // Check and update session status if it has ended
        session = await checkAndUpdateSessionStatus(session);

        res.status(200).json({
            success: true,
            session
        });
    } catch (error) {
        console.error('Error fetching session details:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// Get student attendance across all sessions
router.get('/student/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;
        const { courseId, startDate, endDate } = req.query;

        // Validate student exists
        const student = await Student.findOne({ idNumber: studentId });
        if (!student) {
            return res.status(404).json({ 
                success: false, 
                message: 'Student not found' 
            });
        }

        // Build query filters
        let queryFilter = { 'students.studentId': studentId };
        
        if (courseId) {
            queryFilter.courseId = courseId;
        }
        
        if (startDate && endDate) {
            queryFilter['session.date'] = {
                $gte: new Date(new Date(startDate).setHours(0, 0, 0, 0)),
                $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
            };
        }

        const sessions = await SessionAttendance.find(queryFilter).sort({ 'session.date': -1 });
        
        // Check and update status for each session
        for (let i = 0; i < sessions.length; i++) {
            sessions[i] = await checkAndUpdateSessionStatus(sessions[i]);
        }

        // Extract student's attendance from each session
        const attendanceRecords = sessions.map(session => {
            const studentAttendance = session.students.find(s => s.studentId === studentId);
            
            return {
                sessionId: session._id,
                courseId: session.courseId,
                courseCode: session.courseCode,
                courseName: session.courseName,
                date: session.session.date,
                day: session.session.day,
                startTime: session.session.startTime,
                endTime: session.session.endTime,
                room: session.session.room,
                status: studentAttendance ? studentAttendance.status : 'Unknown',
                timeIn: studentAttendance ? studentAttendance.timeIn : null,
                notes: studentAttendance ? studentAttendance.notes : ''
            };
        });

        res.status(200).json({
            success: true,
            student: {
                id: student.idNumber,
                name: student.fullName
            },
            attendance: attendanceRecords
        });
    } catch (error) {
        console.error('Error fetching student attendance:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// Update student status in a session (admin or instructor)
router.put('/:sessionId/student/:studentId', adminAuth, async (req, res) => {
    try {
        const { sessionId, studentId } = req.params;
        const { status, notes } = req.body;

        if (!status) {
            return res.status(400).json({ 
                success: false, 
                message: 'Status is required' 
            });
        }

        const session = await SessionAttendance.findById(sessionId);
        if (!session) {
            return res.status(404).json({ 
                success: false, 
                message: 'Session not found' 
            });
        }

        // Find the student in the session
        const studentIndex = session.students.findIndex(s => s.studentId === studentId);
        if (studentIndex === -1) {
            return res.status(404).json({ 
                success: false, 
                message: 'Student not found in this session' 
            });
        }

        // Update student status
        session.students[studentIndex].status = status;
        
        // Update notes if provided
        if (notes !== undefined) {
            session.students[studentIndex].notes = notes;
        }

        await session.save();

        res.status(200).json({
            success: true,
            message: 'Student attendance updated successfully',
            student: session.students[studentIndex]
        });
    } catch (error) {
        console.error('Error updating student attendance:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// Delete a session (admin only)
router.delete('/:sessionId', adminAuth, async (req, res) => {
    try {
        const { sessionId } = req.params;

        const session = await SessionAttendance.findById(sessionId);
        if (!session) {
            return res.status(404).json({ 
                success: false, 
                message: 'Session not found' 
            });
        }

        await SessionAttendance.findByIdAndDelete(sessionId);

        res.status(200).json({
            success: true,
            message: 'Session deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting session:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// Get attendance statistics for a course
router.get('/stats/course/:courseId', async (req, res) => {
    try {
        const { courseId } = req.params;
        const { startDate, endDate } = req.query;

        // Build date filter
        let dateFilter = {};
        if (startDate && endDate) {
            dateFilter = {
                'session.date': {
                    $gte: new Date(new Date(startDate).setHours(0, 0, 0, 0)),
                    $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
                }
            };
        }

        // Get course details
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ 
                success: false, 
                message: 'Course not found' 
            });
        }

        // Get all sessions for this course
        const sessions = await SessionAttendance.find({
            courseId,
            ...dateFilter
        }).sort({ 'session.date': 1 });
        
        // Check and update status for each session
        for (let i = 0; i < sessions.length; i++) {
            sessions[i] = await checkAndUpdateSessionStatus(sessions[i]);
        }

        // Get all enrolled students
        const enrolledStudentIds = course.students || [];
        const students = await Student.find({ idNumber: { $in: enrolledStudentIds } });

        // Calculate statistics for each student
        const studentStats = students.map(student => {
            let presentCount = 0;
            let absentCount = 0;
            let lateCount = 0;
            let excusedCount = 0;

            // Count attendance for each session
            sessions.forEach(session => {
                const studentAttendance = session.students.find(s => s.studentId === student.idNumber);
                if (studentAttendance) {
                    switch(studentAttendance.status) {
                        case 'Present':
                            presentCount++;
                            break;
                        case 'Absent':
                            absentCount++;
                            break;
                        case 'Late':
                            lateCount++;
                            break;
                        case 'Excused':
                            excusedCount++;
                            break;
                    }
                } else {
                    // If student is not found in session, count as absent
                    absentCount++;
                }
            });

            const totalSessions = sessions.length;
            const attendanceRate = totalSessions > 0 ? 
                ((presentCount + lateCount) / totalSessions) * 100 : 0;

            return {
                studentId: student.idNumber,
                studentName: student.fullName,
                present: presentCount,
                absent: absentCount,
                late: lateCount,
                excused: excusedCount,
                totalSessions,
                attendanceRate: Math.round(attendanceRate * 100) / 100 // Round to 2 decimal places
            };
        });

        // Calculate overall course statistics
        const totalStudents = students.length;
        const totalSessions = sessions.length;
        
        let overallStats = {
            totalStudents,
            totalSessions,
            averageAttendanceRate: 0,
            sessionStats: []
        };

        // Calculate average attendance rate
        if (totalStudents > 0 && totalSessions > 0) {
            const totalAttendanceRate = studentStats.reduce((sum, student) => sum + student.attendanceRate, 0);
            overallStats.averageAttendanceRate = Math.round((totalAttendanceRate / totalStudents) * 100) / 100;
        }

        // Calculate statistics for each session
        overallStats.sessionStats = sessions.map(session => {
            const presentCount = session.students.filter(s => s.status === 'Present').length;
            const absentCount = session.students.filter(s => s.status === 'Absent').length;
            const lateCount = session.students.filter(s => s.status === 'Late').length;
            const excusedCount = session.students.filter(s => s.status === 'Excused').length;
            const attendanceRate = ((presentCount + lateCount) / (presentCount + absentCount + lateCount + excusedCount)) * 100;

            return {
                sessionId: session._id,
                date: session.session.date,
                day: session.session.day,
                present: presentCount,
                absent: absentCount,
                late: lateCount,
                excused: excusedCount,
                attendanceRate: Math.round(attendanceRate * 100) / 100
            };
        });

        res.status(200).json({
            success: true,
            course: {
                id: course._id,
                courseCode: course.courseCode,
                courseName: course.courseName
            },
            overallStats,
            studentStats
        });
    } catch (error) {
        console.error('Error calculating attendance statistics:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// End a session and mark all 'Pending' students as 'Absent'
router.post('/:sessionId/end-session', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { force } = req.body; // Optional parameter to force ending a session
        
        // Find the session
        const session = await SessionAttendance.findById(sessionId);
        if (!session) {
            return res.status(404).json({ 
                success: false, 
                message: 'Session not found' 
            });
        }
        
        // Check if session should be ended (either forced or past end time)
        const hasEnded = force === true || isSessionEnded(session);
        
        if (!hasEnded) {
            return res.status(400).json({
                success: false,
                message: 'Session has not ended yet. Use force=true to end it manually.'
            });
        }
        
        // Update all 'Pending' students to 'Absent'
        const pendingCount = await markPendingAsAbsent(session);
        
        res.status(200).json({
            success: true,
            message: `Session ended. ${pendingCount} pending students marked as absent.`,
            session: {
                id: session._id,
                courseCode: session.courseCode,
                date: formatPhilippineDate(session.session.date),
                pendingMarkedAbsent: pendingCount
            }
        });
    } catch (error) {
        console.error('Error ending session:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// Force check all sessions for ended sessions and mark students
router.post('/force-check-sessions', async (req, res) => {
    try {
        // Get all sessions from the database
        const sessions = await SessionAttendance.find({}).sort({ 'session.date': -1 });
        
        console.log(`Found ${sessions.length} total sessions in the database`);
        
        const results = {
            totalSessions: sessions.length,
            checkedSessions: 0,
            endedSessions: 0,
            studentsMarkedAbsent: 0,
            sessionDetails: []
        };
        
        // Process each session
        for (const session of sessions) {
            results.checkedSessions++;
            
            // Check if session has ended and count pending students
            const hasEnded = isSessionEnded(session);
            
            if (hasEnded) {
                results.endedSessions++;
                const pendingCount = await markPendingAsAbsent(session);
                results.studentsMarkedAbsent += pendingCount;
                
                results.sessionDetails.push({
                    sessionId: session._id,
                    courseCode: session.courseCode,
                    date: formatPhilippineDate(session.session.date),
                    endTime: session.session.endTime,
                    hasEnded: hasEnded,
                    pendingMarkedAbsent: pendingCount
                });
            }
        }
        
        res.status(200).json({
            success: true,
            message: `Checked ${results.checkedSessions} sessions. Found ${results.endedSessions} ended sessions and marked ${results.studentsMarkedAbsent} students as absent.`,
            results
        });
    } catch (error) {
        console.error('Error checking sessions:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

module.exports = router; 