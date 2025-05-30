const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            retryWrites: true,
            w: 'majority',
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        
        if (conn.connection.readyState === 1) {
            console.log('MongoDB Connected');
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('MongoDB connection failed:', error.message);
        return false;
    }
};

module.exports = connectDB; 