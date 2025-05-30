const mongoose = require('mongoose');
const crypto = require('crypto');

// Function to generate a random enrollment code
const generateEnrollmentCode = () => {
    return crypto.randomBytes(4).toString('hex').toUpperCase();
};

// Function to generate a random attendance code
const generateAttendanceCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit number
};

const courseSchema = new mongoose.Schema({
    courseCode: {
        type: String,
        required: true,
        unique: true
    },
    courseName: {
        type: String,
        required: true
    },
    instructor: {
        type: String,
        required: true
    },
    instructorName: {
        type: String,
        default: ''
    },
    enrollmentCode: {
        type: String,
        unique: true,
        default: generateEnrollmentCode
    },
    attendanceCode: {
        type: String,
        default: generateAttendanceCode
    },
    schedules: {
        type: [{
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
            }
        }],
        default: []
    },
    room: {
        type: String,
        default: ''
    },
    program: {
        type: String,
        default: ''
    },
    yearSection: {
        type: String,
        default: ''
    },
    students: {
        type: [String], // Store student ID numbers as strings
        default: [],
        validate: {
            validator: function(v) {
                // Ensure all values are strings and not empty
                return v.every(id => typeof id === 'string' && id.length > 0);
            },
            message: 'Student IDs must be valid strings'
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Helper method to check if a student is enrolled
courseSchema.methods.isStudentEnrolled = function(studentId) {
    return this.students && Array.isArray(this.students) && this.students.includes(studentId);
};

// Pre-save middleware to ensure unique enrollment code
courseSchema.pre('save', async function(next) {
    if (this.isNew) {
        let isUnique = false;
        let attempts = 0;
        const maxAttempts = 5;

        while (!isUnique && attempts < maxAttempts) {
            const code = generateEnrollmentCode();
            const existingCourse = await this.constructor.findOne({ enrollmentCode: code });
            
            if (!existingCourse) {
                this.enrollmentCode = code;
                isUnique = true;
            }
            attempts++;
        }

        if (!isUnique) {
            next(new Error('Could not generate unique enrollment code'));
            return;
        }
    }

    // Initialize students array if it's undefined
    if (!this.students) {
        this.students = [];
    }
    
    next();
});

module.exports = mongoose.model('Course', courseSchema); 