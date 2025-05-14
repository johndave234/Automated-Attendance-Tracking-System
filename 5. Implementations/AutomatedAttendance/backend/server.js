require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const studentRoutes = require('./routes/studentRoutes');
const instructorRoutes = require('./routes/instructorRoutes');
const courseRoutes = require('./routes/courseRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');

const app = express();

// CORS configuration
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'admin-id', 'admin-password'],
    credentials: true
}));

// Middleware for parsing JSON bodies
app.use(express.json());

// Add request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    console.log('Request Headers:', req.headers);
    console.log('Request Body:', req.body);
    next();
});

// Routes
app.get('/api/test', (req, res) => {
    res.json({ message: 'API is working!' });
});

// Test routes for each main endpoint
app.get('/api/students/test', async (req, res) => {
    try {
        res.json({ message: 'Students endpoint is working!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/instructors/test', async (req, res) => {
    try {
        res.json({ message: 'Instructors endpoint is working!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/courses/test', async (req, res) => {
    try {
        res.json({ message: 'Courses endpoint is working!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API Routes
app.use('/api/students', studentRoutes);
app.use('/api/instructors', instructorRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/attendance', attendanceRoutes);

// Test endpoint
app.get('/test', (req, res) => {
    res.json({ message: 'Server is running' });
});

// Handle 404
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        message: 'Internal server error',
        error: err.message
    });
});

// Server configuration
const PORT = 5001;
const HOST = '0.0.0.0';  // This allows connections from any IP address
const LOCAL_IP = '192.168.254.147'; // Your actual IP address

// Start server and connect to database
const startServer = async () => {
    try {
        console.log('Attempting to connect to MongoDB...');
        // Connect to MongoDB
        const isConnected = await connectDB();
        
        if (!isConnected) {
            console.error('Failed to connect to MongoDB. Exiting...');
            process.exit(1);
        }

        // Start server after successful DB connection
        app.listen(PORT, HOST, () => {
            console.log('Server started successfully!');
            console.log(`Server running on port ${PORT}`);
            console.log('Access URLs:');
            console.log(`- Local: http://localhost:${PORT}`);
            console.log(`- Network: http://${LOCAL_IP}:${PORT}`);
            console.log(`- On Your Phone: Use http://${LOCAL_IP}:${PORT}`);
            console.log('\nAvailable endpoints:');
            console.log('- GET /api/test (to test connection)');
            console.log('- POST /api/students/create');
            console.log('- GET /api/students');
            console.log('- POST /api/instructors/create');
            console.log('- GET /api/courses');
            console.log('- POST /api/attendance/record');
            console.log('- GET /api/attendance/student/:studentId');
        });
    } catch (error) {
        console.error('Server startup failed:', error);
        process.exit(1);
    }
};

startServer(); 