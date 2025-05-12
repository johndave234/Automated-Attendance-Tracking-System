const mongoose = require('mongoose');
const crypto = require('crypto');

// Function to generate a random enrollment code
const generateEnrollmentCode = () => {
    return crypto.randomBytes(4).toString('hex').toUpperCase();
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
    enrollmentCode: {
        type: String,
        unique: true,
        default: generateEnrollmentCode
    },
    students: {
        type: [String],
        default: [],
        ref: 'Student'
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