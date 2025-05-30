const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const Student = require('../models/Student');
const { adminAuth } = require('../middleware/adminAuth');

// Get available courses for students (public)
router.get('/available', async (req, res) => {
    try {
        const courses = await Course.find();
        const formattedCourses = courses.map(course => ({
            _id: course._id,
            courseCode: course.courseCode,
            courseName: course.courseName,
            instructor: course.instructor,
            totalStudents: course.students ? course.students.length : 0
        }));
        res.json(formattedCourses);
    } catch (error) {
        console.error('Error fetching available courses:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get all courses (admin only)
router.get('/', adminAuth, async (req, res) => {
    try {
        const courses = await Course.find();
        const formattedCourses = courses.map(course => ({
            _id: course._id,
            courseCode: course.courseCode,
            courseName: course.courseName,
            instructor: course.instructor,
            instructorName: course.instructorName || course.instructor,
            room: course.room || '',
            enrollmentCode: course.enrollmentCode,
            students: course.students || [],
            totalStudents: course.students ? course.students.length : 0
        }));
        res.json(formattedCourses);
    } catch (error) {
        console.error('Error fetching all courses:', error);
        res.status(500).json({ message: error.message });
    }
});

// Create a new course (admin only)
router.post('/', adminAuth, async (req, res) => {
    const course = new Course({
        courseCode: req.body.courseCode,
        courseName: req.body.courseName,
        instructor: req.body.instructor,
        instructorName: req.body.instructorName,
        room: req.body.room,
        program: req.body.program,
        yearSection: req.body.yearSection,
        schedules: req.body.schedules || []
    });

    try {
        const newCourse = await course.save();
        res.status(201).json(newCourse);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Get courses for a specific instructor (public)
router.get('/instructor/:instructorId', async (req, res) => {
    try {
        const instructorId = req.params.instructorId;
        console.log(`Fetching courses for instructor ID: ${instructorId}`);

        // Get the instructor details
        const instructor = await require('../models/Instructor').findOne({ idNumber: instructorId });
        if (!instructor) {
            console.log(`No instructor found with ID: ${instructorId}`);
            return res.json([]);
        }
        console.log(`Found instructor: ${instructor.fullName}`);

        // Find courses where instructor matches either the ID or name
        const courses = await Course.find({
            $or: [
                { instructor: instructorId },
                { instructor: instructor.fullName },
                { instructorName: instructor.fullName }
            ]
        });

        console.log(`Found ${courses.length} courses for instructor ${instructorId}`);
        if (courses.length > 0) {
            console.log('Course details:', courses.map(c => ({ 
                code: c.courseCode, 
                name: c.courseName,
                instructor: c.instructor,
                instructorName: c.instructorName || 'Not set'
            })));
        }

        if (!courses || courses.length === 0) {
            return res.json([]);
        }

        // Map courses and add student count
        const coursesWithCount = courses.map(course => ({
            _id: course._id,
            courseCode: course.courseCode,
            courseName: course.courseName,
            enrollmentCode: course.enrollmentCode,
            instructor: course.instructor,
            instructorName: course.instructorName || course.instructor,
            totalStudents: course.students ? course.students.length : 0
        }));

        res.json(coursesWithCount);
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({ message: 'Error fetching courses' });
    }
});

// Get course details with enrolled students (public)
router.get('/:id', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Find all students by their ID numbers
        const students = await Student.find({ idNumber: { $in: course.students } });
        
        // Format the response
        const formattedCourse = {
            ...course.toObject(),
            students: students.map(student => ({
                idNumber: student.idNumber,
                fullName: student.fullName
            }))
        };

        res.json(formattedCourse);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
});

// Get enrolled students for a course (public)
router.get('/:id/students', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        const students = await Student.find({
            idNumber: { $in: course.students }
        });

        res.json(students);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Enroll a student in a course (public)
router.post('/:courseId/enroll-student', async (req, res) => {
    try {
        const { courseId } = req.params;
        const { studentId } = req.body;

        // Input validation
        if (!studentId) {
            return res.status(400).json({ 
                message: 'Student ID is required' 
            });
        }

        // Find the course
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ 
                message: 'Course not found' 
            });
        }

        // Check if student exists
        const student = await Student.findOne({ idNumber: studentId });
        if (!student) {
            return res.status(404).json({ 
                message: 'Student not found' 
            });
        }

        // Check if student is already enrolled using their ID number
        if (course.students.includes(student.idNumber)) {
            return res.status(400).json({ 
                message: 'Student is already enrolled in this course' 
            });
        }

        // Add student's ID number to course
        course.students = course.students || [];
        course.students.push(student.idNumber);
        await course.save();

        res.json({ 
            message: 'Student enrolled successfully',
            course: course
        });
    } catch (err) {
        console.error('Enrollment error:', err);
        res.status(500).json({ 
            message: 'Error enrolling student',
            error: err.message 
        });
    }
});

// Remove a student from a course (admin only)
router.delete('/:courseId/students/:studentId', adminAuth, async (req, res) => {
    try {
        const { courseId, studentId } = req.params;
        
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Check if student is enrolled using ID number
        if (!course.students.includes(studentId)) {
            return res.status(400).json({ message: 'Student is not enrolled in this course' });
        }

        // Remove student using ID number
        course.students = course.students.filter(id => id !== studentId);
        await course.save();

        res.json({ message: 'Student removed successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update a course (admin only)
router.put('/update/:id', adminAuth, async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        const { courseCode, courseName, instructor, instructorName, room, program, yearSection, schedules } = req.body;

        if (courseCode) course.courseCode = courseCode;
        if (courseName) course.courseName = courseName;
        if (instructor) course.instructor = instructor;
        if (instructorName) course.instructorName = instructorName;
        if (room !== undefined) course.room = room;
        if (program !== undefined) course.program = program;
        if (yearSection !== undefined) course.yearSection = yearSection;
        if (schedules) course.schedules = schedules;

        const updatedCourse = await course.save();
        res.json({
            message: 'Course updated successfully',
            course: {
                _id: updatedCourse._id,
                courseCode: updatedCourse.courseCode,
                courseName: updatedCourse.courseName,
                instructor: updatedCourse.instructor,
                instructorName: updatedCourse.instructorName,
                room: updatedCourse.room,
                program: updatedCourse.program,
                yearSection: updatedCourse.yearSection,
                schedules: updatedCourse.schedules,
                enrollmentCode: updatedCourse.enrollmentCode
            }
        });
    } catch (error) {
        res.status(400).json({ 
            message: error.message,
            details: error.errors ? Object.values(error.errors).map(err => err.message) : undefined
        });
    }
});

// Delete a course (admin only)
router.delete('/delete/:id', adminAuth, async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        await course.deleteOne();
        res.json({ message: 'Course deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all courses (for testing)
router.get('/test/all', adminAuth, async (req, res) => {
    try {
        const courses = await Course.find().populate('students', 'idNumber fullName');
        res.json({
            total: courses.length,
            courses: courses.map(course => ({
                _id: course._id,
                courseCode: course.courseCode,
                courseName: course.courseName,
                instructor: course.instructor,
                enrollmentCode: course.enrollmentCode,
                totalStudents: course.students.length
            }))
        });
    } catch (error) {
        console.error('Error fetching all courses:', error);
        res.status(500).json({ message: 'Error fetching courses' });
    }
});

// Debug route to check all courses
router.get('/debug/all', adminAuth, async (req, res) => {
    try {
        console.log('\n=== Debug: All Courses ===');
        const courses = await Course.find();
        
        console.log('Total courses:', courses.length);
        courses.forEach(course => {
            console.log('\nCourse Details:');
            console.log('- Code:', course.courseCode);
            console.log('- Name:', course.courseName);
            console.log('- Instructor:', course.instructor);
            console.log('- Enrollment Code:', course.enrollmentCode);
        });

        res.json({
            total: courses.length,
            courses: courses.map(course => ({
                _id: course._id,
                courseCode: course.courseCode,
                courseName: course.courseName,
                instructor: course.instructor,
                enrollmentCode: course.enrollmentCode
            }))
        });
    } catch (error) {
        console.error('Debug route error:', error);
        res.status(500).json({ message: 'Error fetching courses' });
    }
});

// Update instructor IDs for existing courses
router.post('/update-instructor-ids', adminAuth, async (req, res) => {
    try {
        const { instructorName, instructorId } = req.body;
        
        // Update all courses where instructor matches the name
        const result = await Course.updateMany(
            { instructor: instructorName },
            { $set: { instructor: instructorId } }
        );

        res.json({
            message: 'Courses updated successfully',
            matchedCount: result.matchedCount,
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        console.error('Error updating instructor IDs:', error);
        res.status(500).json({ message: 'Error updating courses' });
    }
});

// Verify a course enrollment code (public)
router.post('/verify-code', async (req, res) => {
    try {
        const { courseId, enrollmentCode } = req.body;
        
        // Validate input
        if (!courseId || !enrollmentCode) {
            return res.status(400).json({
                success: false,
                message: 'Course ID and enrollment code are required'
            });
        }
        
        // Find the course
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }
        
        // Check if the enrollment code matches
        const isCodeValid = course.enrollmentCode === enrollmentCode;
        
        if (isCodeValid) {
            return res.json({
                success: true,
                message: 'Enrollment code is valid'
            });
        } else {
            return res.status(400).json({
                success: false,
                message: 'Invalid enrollment code'
            });
        }
    } catch (error) {
        console.error('Error verifying enrollment code:', error);
        res.status(500).json({
            success: false,
            message: 'Error verifying enrollment code'
        });
    }
});

// Generate a new attendance code for manual attendance
router.post('/:courseId/generate-attendance-code', async (req, res) => {
    try {
        const { courseId } = req.params;
        
        // Find the course
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ 
                success: false,
                message: 'Course not found' 
            });
        }
        
        // Generate a new 6-digit attendance code
        const newCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Update the course with the new code
        course.attendanceCode = newCode;
        await course.save();
        
        res.json({
            success: true,
            message: 'New attendance code generated',
            attendanceCode: newCode
        });
    } catch (error) {
        console.error('Error generating attendance code:', error);
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
});

// Utility endpoint to fix existing courses by setting instructorName
router.post('/fix-instructor-names', adminAuth, async (req, res) => {
    try {
        console.log('Starting to fix instructor names for courses');
        
        // Get all instructors
        const Instructor = require('../models/Instructor');
        const instructors = await Instructor.find();
        console.log(`Found ${instructors.length} instructors`);
        
        // Create a map of instructor IDs to names
        const instructorMap = {};
        instructors.forEach(instructor => {
            instructorMap[instructor.idNumber] = instructor.fullName;
        });
        
        // Get all courses
        const courses = await Course.find();
        console.log(`Found ${courses.length} courses to check`);
        
        let updatedCount = 0;
        
        // Update each course if needed
        for (const course of courses) {
            // If instructor field is an ID and we have a name for it
            if (course.instructor && instructorMap[course.instructor] && !course.instructorName) {
                course.instructorName = instructorMap[course.instructor];
                await course.save();
                updatedCount++;
                console.log(`Updated course ${course.courseCode}: set instructorName to ${course.instructorName}`);
            }
        }
        
        res.json({
            success: true,
            message: `Fixed instructor names for ${updatedCount} courses`,
            totalCourses: courses.length,
            updatedCourses: updatedCount
        });
    } catch (error) {
        console.error('Error fixing instructor names:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fixing instructor names',
            error: error.message
        });
    }
});

module.exports = router; 