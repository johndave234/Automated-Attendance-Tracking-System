const adminAuth = (req, res, next) => {
    const adminId = req.headers['admin-id'];
    const adminPassword = req.headers['admin-password'];

    if (!adminId || !adminPassword) {
        return res.status(401).json({ message: 'Admin credentials required' });
    }

    if (adminId === process.env.ADMIN_ID && adminPassword === process.env.ADMIN_PASSWORD) {
        next();
    } else {
        res.status(401).json({ message: 'Invalid admin credentials' });
    }
};

module.exports = { adminAuth }; 