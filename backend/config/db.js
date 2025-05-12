const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Use environment variable for MongoDB URI
        const MONGODB_URI = process.env.MONGODB_URI;
        
        if (!MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined in environment variables');
        }

        const options = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            maxPoolSize: 10,
            minPoolSize: 5,
            socketTimeoutMS: 45000,
            serverSelectionTimeoutMS: 5000,
            heartbeatFrequencyMS: 10000,
            writeConcern: {
                w: 'majority',
                j: true
            },
            // Add retry logic
            retryWrites: true,
            retryReads: true,
            // Add connection timeout
            connectTimeoutMS: 10000,
        };

        const conn = await mongoose.connect(MONGODB_URI, options);
        
        if (conn.connection.readyState === 1) {
            console.log('Successfully connected to MongoDB Database:', conn.connection.db.databaseName);
            console.log('Database Host:', conn.connection.host);
            
            // Enable mongoose debug mode for development
            if (process.env.NODE_ENV === 'development') {
            mongoose.set('debug', true);
            }
            
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('MongoDB connection failed:', error.message);
        if (error.message.includes('IP whitelist')) {
            console.error('\nTo fix this error:');
            console.error('1. Go to MongoDB Atlas dashboard');
            console.error('2. Navigate to Network Access');
            console.error('3. Add your current IP address');
            console.error('4. Or temporarily allow access from anywhere (not recommended for production)');
        }
        return false;
    }
};

// Handle connection events
mongoose.connection.on('connected', () => {
    console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('Mongoose disconnected from MongoDB');
});

// Handle process termination
process.on('SIGINT', async () => {
    try {
        await mongoose.connection.close();
        console.log('Mongoose connection closed through app termination');
        process.exit(0);
    } catch (err) {
        console.error('Error during mongoose connection closure:', err);
        process.exit(1);
    }
});

module.exports = connectDB; 