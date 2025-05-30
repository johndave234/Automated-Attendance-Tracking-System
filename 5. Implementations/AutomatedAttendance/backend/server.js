const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');
const studentRoutes = require('./routes/studentRoutes');
const instructorRoutes = require('./routes/instructorRoutes');
const courseRoutes = require('./routes/courseRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const sessionAttendanceRoutes = require('./routes/sessionAttendanceRoutes');
const os = require('os');

const app = express();

// Get network interfaces
const getNetworkIP = () => {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (!iface.internal && iface.family === 'IPv4') {
                return iface.address;
            }
        }
    }
    return '0.0.0.0';
};

// CORS configuration
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'admin-id', 'admin-password'],
    credentials: true
}));

// Middleware
app.use(express.json());

// Add request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    console.log('Request Headers:', req.headers);
    console.log('Request Body:', req.body);
    next();
});

// Basic route
app.get('/', (req, res) => {
    res.json({ message: 'Automated Attendance System API' });
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

// Routes
app.use('/api/students', studentRoutes);
app.use('/api/instructors', instructorRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/sessions', sessionAttendanceRoutes);
app.use('/api/session-attendance', sessionAttendanceRoutes);

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
const PORT = process.env.PORT || 5001;
const HOST = '0.0.0.0';
const LOCAL_IP = getNetworkIP();

// Start server and connect to database
const startServer = async () => {
    try {
        console.log('Attempting to connect to MongoDB...');
        // Connect to MongoDB
        const isConnected = await connectDB();
        
        if (!isConnected) {
            console.log('Failed to connect to MongoDB. Check your connection string.');
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
        console.log('Server startup failed');
        process.exit(1);
    }
};

startServer(); 