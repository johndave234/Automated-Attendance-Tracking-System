const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const UserLog = require('../models/UserLog');
const { adminAuth } = require('../middleware/adminAuth');

// Test endpoint without auth
router.get('/test', async (req, res) => {
    res.json({ message: 'Test endpoint working' });
});

// Search students route (must be before /:id route)
router.get('/search', async (req, res) => {
    try {
        const searchQuery = req.query.search || '';
        const students = await Student.find({
            $or: [
                { fullName: { $regex: searchQuery, $options: 'i' } },
                { idNumber: { $regex: searchQuery, $options: 'i' } }
            ]
        }).select('fullName idNumber');
        res.json(students);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all students
router.get('/', adminAuth, async (req, res) => {
    try {
        console.log('GET /api/students - Fetching all students');
        console.log('Admin credentials:', {
            id: req.headers['admin-id'],
            password: '***'
        });
        
        const students = await Student.find().select('-password');
        console.log(`Found ${students.length} students`);
        res.json(students);
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get single student
router.get('/:id', adminAuth, async (req, res) => {
    try {
        const student = await Student.findById(req.params.id).select('-password');
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        res.json(student);
    } catch {
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete student
router.delete('/:id', adminAuth, async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        await student.deleteOne();
        res.json({ message: 'Student deleted successfully' });
    } catch {
        res.status(500).json({ message: 'Server error' });
    }
});

// Student Login Route
router.post('/login', async (req, res) => {
    try {
        const { studentId, password } = req.body;
        console.log(`Login attempt for student ID: ${studentId}`);
        const startTime = Date.now();

        // Find student by ID (with lean() for better performance)
        const student = await Student.findOne({ idNumber: studentId }).lean();
        
        // If student doesn't exist
        if (!student) {
            console.log(`Student ID not found: ${studentId} (${Date.now() - startTime}ms)`);
            return res.status(401).json({ message: 'Invalid student ID or password' });
        }

        // Check password using the Student model's comparePassword
        // Retrieve a non-lean document for methods
        const studentWithMethods = await Student.findById(student._id);
        const isMatch = await studentWithMethods.comparePassword(password);
        
        if (!isMatch) {
            console.log(`Invalid password for student: ${studentId} (${Date.now() - startTime}ms)`);
            return res.status(401).json({ message: 'Invalid student ID or password' });
        }

        // Create success response first
        const responseData = {
            success: true,
            student: {
                id: student._id,
                idNumber: student.idNumber,
                fullName: student.fullName
            }
        };

        // Create login log asynchronously (don't wait for it)
        UserLog.create({
            userId: student._id,
            userType: 'Student',
            fullName: student.fullName,
            idNumber: student.idNumber,
            action: 'login'
        }).catch(err => console.error('Error creating login log:', err));

        // Log performance
        console.log(`Student login successful: ${studentId} (${Date.now() - startTime}ms)`);
        
        // Return student data (excluding password)
        res.json(responseData);

    } catch (error) {
        console.error('Student login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Student Logout Route
router.post('/logout', async (req, res) => {
    try {
        const { studentId } = req.body;

        // Find student by ID
        const student = await Student.findOne({ idNumber: studentId });
        
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Create logout log
        await UserLog.create({
            userId: student._id,
            userType: 'Student',
            fullName: student.fullName,
            idNumber: student.idNumber,
            action: 'logout'
        });

        res.json({
            success: true,
            message: 'Logged out successfully'
        });

    } catch {
        res.status(500).json({ message: 'Server error' });
    }
});

// Route for admin to create a student account
router.post('/create', adminAuth, async (req, res) => {
    const start = Date.now();
    console.log('Starting student creation process...');
    
    try {
        const { idNumber, fullName, password } = req.body;

        // Log the received data
        console.log('Received student data:', {
            idNumber: idNumber ? 'provided' : 'missing',
            fullName: fullName ? 'provided' : 'missing',
            password: password ? 'provided' : 'missing'
        });

        // Validate required fields
        if (!idNumber || !fullName || !password) {
            const missingFields = [];
            if (!idNumber) missingFields.push('idNumber');
            if (!fullName) missingFields.push('fullName');
            if (!password) missingFields.push('password');
            
            console.log('Validation failed - missing fields:', missingFields);
            return res.status(400).json({ 
                message: 'All fields are required',
                missingFields 
            });
        }

        // Check if student ID already exists
        console.log(`[${Date.now() - start}ms] Checking for existing student with ID:`, idNumber);
        const existingStudent = await Student.findOne({ idNumber }).lean();
        
        if (existingStudent) {
            console.log(`[${Date.now() - start}ms] Student ID already exists:`, idNumber);
            return res.status(400).json({ 
                message: 'Student ID already exists',
                idNumber 
            });
        }

        // Create new student
        console.log(`[${Date.now() - start}ms] Creating new student...`);
        const studentData = {
            idNumber: idNumber.trim(),
            fullName: fullName.trim(),
            password
        };

        const student = await Student.create(studentData);

        const totalTime = Date.now() - start;
        console.log(`Student creation completed in ${totalTime}ms:`, {
            id: student._id,
            idNumber: student.idNumber,
            fullName: student.fullName,
            timeElapsed: totalTime
        });

        res.status(201).json({
            success: true,
            message: 'Student account created successfully',
            student: {
                idNumber: student.idNumber,
                fullName: student.fullName
            },
            timeElapsed: totalTime
        });

    } catch (error) {
        const totalTime = Date.now() - start;
        console.error('Error creating student:', {
            error: error.message,
            stack: error.stack,
            timeElapsed: totalTime
        });
        
        // Send appropriate error response
        if (error.code === 11000) {
            // Duplicate key error
            return res.status(400).json({
                message: 'Student ID already exists (duplicate key)',
                error: error.message
            });
        }
        
        res.status(500).json({ 
            success: false,
            message: 'Server error while creating student', 
            error: error.message,
            timeElapsed: totalTime
        });
    }
});

// Update student
router.put('/:id', adminAuth, async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        const { idNumber, fullName } = req.body;

        // Check if new idNumber is already taken by another student
        if (idNumber !== student.idNumber) {
            const existingStudent = await Student.findOne({ idNumber });
            if (existingStudent) {
                return res.status(400).json({ message: 'ID Number is already taken' });
            }
        }

        student.idNumber = idNumber;
        student.fullName = fullName;

        await student.save();
        
        res.json({
            message: 'Student updated successfully',
            student: {
                _id: student._id,
                idNumber: student.idNumber,
                fullName: student.fullName
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 