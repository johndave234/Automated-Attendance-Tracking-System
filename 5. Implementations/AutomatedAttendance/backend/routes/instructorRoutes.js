const express = require('express');
const router = express.Router();
const Instructor = require('../models/Instructor');
const UserLog = require('../models/UserLog');
const { adminAuth } = require('../middleware/adminAuth');

// Get all instructors
// GET /instructors
router.get('/', adminAuth, async (req, res) => {
    try {
        const instructors = await Instructor.find().select('-password');
        res.json(instructors);
    } catch {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get single instructor
// GET /instructors/:id
router.get('/:id', adminAuth, async (req, res) => {
    try {
        const instructor = await Instructor.findById(req.params.id).select('-password');
        if (!instructor) {
            return res.status(404).json({ message: 'Instructor not found' });
        }
        res.json(instructor);
    } catch {
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete instructor
// DELETE /instructors/:id
router.delete('/:id', adminAuth, async (req, res) => {
    try {
        const instructor = await Instructor.findById(req.params.id);
        if (!instructor) {
            return res.status(404).json({ message: 'Instructor not found' });
        }
        await instructor.deleteOne();
        res.json({ message: 'Instructor deleted successfully' });
    } catch {
        res.status(500).json({ message: 'Server error' });
    }
});

// Instructor Login Route
// POST /instructors/login
router.post('/login', async (req, res) => {
    try {
        const { instructorId, password } = req.body;
        console.log(`Login attempt for instructor ID: ${instructorId}`);
        const startTime = Date.now();

        // Find instructor by ID (with lean() for better performance)
        const instructor = await Instructor.findOne({ idNumber: instructorId }).lean();
        
        // If instructor doesn't exist
        if (!instructor) {
            console.log(`Instructor ID not found: ${instructorId} (${Date.now() - startTime}ms)`);
            return res.status(401).json({ message: 'Invalid instructor ID or password' });
        }

        // Check password using the Instructor model's comparePassword
        // Retrieve a non-lean document for methods
        const instructorWithMethods = await Instructor.findById(instructor._id);
        const isMatch = await instructorWithMethods.comparePassword(password);
        
        if (!isMatch) {
            console.log(`Invalid password for instructor: ${instructorId} (${Date.now() - startTime}ms)`);
            return res.status(401).json({ message: 'Invalid instructor ID or password' });
        }

        // Create success response first
        const responseData = {
            success: true,
            instructor: {
                id: instructor._id,
                idNumber: instructor.idNumber,
                fullName: instructor.fullName
            }
        };

        // Create login log asynchronously (don't wait for it)
        UserLog.create({
            userId: instructor._id,
            userType: 'Instructor',
            fullName: instructor.fullName,
            idNumber: instructor.idNumber,
            action: 'login'
        }).catch(err => console.error('Error creating login log:', err));

        // Log performance
        console.log(`Instructor login successful: ${instructorId} (${Date.now() - startTime}ms)`);
        
        // Return instructor data (excluding password)
        res.json(responseData);

    } catch (error) {
        console.error('Instructor login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Instructor Logout Route
// POST /instructors/logout
router.post('/logout', async (req, res) => {
    try {
        const { instructorId } = req.body;

        // Find instructor by ID
        const instructor = await Instructor.findOne({ idNumber: instructorId });
        
        if (!instructor) {
            return res.status(404).json({ message: 'Instructor not found' });
        }

        // Create logout log
        await UserLog.create({
            userId: instructor._id,
            userType: 'Instructor',
            fullName: instructor.fullName,
            idNumber: instructor.idNumber,
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

// Route for admin to create an instructor account
// POST /instructors/create
router.post('/create', adminAuth, async (req, res) => {
    try {
        const { idNumber, fullName, password } = req.body;

        // Check if instructor ID already exists
        const existingInstructor = await Instructor.findOne({ idNumber });
        if (existingInstructor) {
            return res.status(400).json({ message: 'Instructor ID already exists' });
        }

        // Create new instructor
        const instructor = await Instructor.create({
            idNumber,
            fullName,
            password
        });

        res.status(201).json({
            message: 'Instructor account created successfully',
            instructor: {
                idNumber: instructor.idNumber,
                fullName: instructor.fullName
            }
        });

    } catch {
        res.status(500).json({ message: 'Server error' });
    }
});

// Update instructor
// PUT /instructors/:id
router.put('/:id', adminAuth, async (req, res) => {
    try {
        const instructor = await Instructor.findById(req.params.id);
        if (!instructor) {
            return res.status(404).json({ message: 'Instructor not found' });
        }

        const { idNumber, fullName } = req.body;

        // Check if new idNumber is already taken by another instructor
        if (idNumber !== instructor.idNumber) {
            const existingInstructor = await Instructor.findOne({ idNumber });
            if (existingInstructor) {
                return res.status(400).json({ message: 'ID Number is already taken' });
            }
        }

        instructor.idNumber = idNumber;
        instructor.fullName = fullName;

        await instructor.save();
        
        res.json({
            message: 'Instructor updated successfully',
            instructor: {
                _id: instructor._id,
                idNumber: instructor.idNumber,
                fullName: instructor.fullName
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 