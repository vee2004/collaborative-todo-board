const express = require('express');
const router = express.Router();
const ActionLog = require('../models/ActionLog');

// GET /api/logs
router.get('/', async (req, res) => {
  try {
    const logs = await ActionLog.find()
      .sort({ timestamp: -1 })
      .limit(20)
      .populate('userId', 'username')
      .populate('taskId', 'title');
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch logs', error: err.message });
  }
});

module.exports = router; 