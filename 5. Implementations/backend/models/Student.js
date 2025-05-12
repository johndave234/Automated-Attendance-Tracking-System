const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const studentSchema = new mongoose.Schema({
    idNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

// Hash password before saving
studentSchema.pre('save', async function(next) {
    const start = Date.now();
    if (!this.isModified('password')) {
        return next();
    }
    try {
        // Reduce salt rounds to 6 for better performance while maintaining security
        const salt = await bcrypt.genSalt(6);
        this.password = await bcrypt.hash(this.password, salt);
        console.log(`Password hashing completed in ${Date.now() - start}ms`);
        next();
    } catch (error) {
        console.error('Error hashing password:', error);
        next(error);
    }
});

// Method to compare password
studentSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        console.error('Error comparing password:', error);
        throw error;
    }
};

module.exports = mongoose.model('Student', studentSchema); 