const adminAuth = (req, res, next) => {
    const adminId = req.headers['admin-id'];
    const adminPassword = req.headers['admin-password'];

    if (!adminId || !adminPassword) {
        console.log('Missing admin credentials');
        return res.status(401).json({ message: 'Admin credentials required' });
    }

    // Using hardcoded admin credentials
    const ADMIN_ID = 'admin123';
    const ADMIN_PASSWORD = 'pass123';

    if (adminId === ADMIN_ID && adminPassword === ADMIN_PASSWORD) {
        next();
    } else {
        console.log('Invalid admin credentials provided:', { adminId, adminPassword });
        res.status(401).json({ message: 'Invalid admin credentials' });
    }
};

module.exports = { adminAuth }; 