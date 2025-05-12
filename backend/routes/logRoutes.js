const express = require('express');
const router = express.Router();
const UserLog = require('../models/UserLog');

// Get all logs
router.get('/', async (req, res) => {
  try {
    const logs = await UserLog.find()
      .sort({ timestamp: -1 }) // Sort by timestamp in descending order
      .limit(100); // Limit to last 100 logs for performance
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a log entry
router.delete('/:id', async (req, res) => {
  try {
    const log = await UserLog.findByIdAndDelete(req.params.id);
    if (!log) {
      return res.status(404).json({ message: 'Log not found' });
    }
    res.json({ message: 'Log deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 