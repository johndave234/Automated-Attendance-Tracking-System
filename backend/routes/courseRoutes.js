const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const Student = require('../models/Student');
const { adminAuth } = require('../middleware/adminAuth');

// Get all courses (admin only)
router.get('/', adminAuth, async (req, res) => {
    try {
        const courses = await Course.find();
        const formattedCourses = courses.map(course => ({
            _id: course._id,
            courseCode: course.courseCode,
            courseName: course.courseName,
            instructor: course.instructor,
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
        instructor: req.body.instructor
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

        // Get the instructor details
        const instructor = await require('../models/Instructor').findOne({ idNumber: instructorId });
        if (!instructor) {
            return res.json([]);
        }

        // Find courses where instructor matches either the ID or name
        const courses = await Course.find({
            $or: [
                { instructor: instructorId },
                { instructor: instructor.fullName }
            ]
        });

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
            '_id': { $in: course.students }
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

        // Check if student is already enrolled
        if (course.isStudentEnrolled(student._id.toString())) {
            return res.status(400).json({ 
                message: 'Student is already enrolled in this course' 
            });
        }

        // Add student to course
        course.students = course.students || [];
        course.students.push(student._id.toString());
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

        if (!course.isStudentEnrolled(studentId)) {
            return res.status(400).json({ message: 'Student is not enrolled in this course' });
        }

        course.students = course.students.filter(id => id.toString() !== studentId);
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

        const { courseCode, courseName, instructor } = req.body;

        if (courseCode) course.courseCode = courseCode;
        if (courseName) course.courseName = courseName;
        if (instructor) course.instructor = instructor;

        const updatedCourse = await course.save();
        res.json({
            message: 'Course updated successfully',
            course: {
                _id: updatedCourse._id,
                courseCode: updatedCourse.courseCode,
                courseName: updatedCourse.courseName,
                instructor: updatedCourse.instructor,
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

module.exports = router; 