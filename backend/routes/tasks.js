const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Task = require('../models/Task');
const User = require('../models/User');
const ActionLog = require('../models/ActionLog');

// GET /api/users - Get all users (for assignment)
router.get('/users', auth, async (req, res) => {
  try {
    const users = await User.find({}, 'username email');
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users', error: err.message });
  }
});

// GET /api/tasks - Get all tasks
router.get('/', auth, async (req, res) => {
  try {
    const tasks = await Task.find().populate('assignedUser', 'username email').populate('createdBy', 'username email');
    res.json({ tasks });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/tasks - Create new task
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, assignedUser, status, priority } = req.body;
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }
    // Title must be unique and not 'Todo', 'In Progress', 'Done'
    const forbiddenTitles = ['Todo', 'In Progress', 'Done'];
    if (forbiddenTitles.includes(title)) {
      return res.status(400).json({ message: 'Invalid task title' });
    }
    const existing = await Task.findOne({ title });
    if (existing) {
      return res.status(400).json({ message: 'Task title must be unique' });
    }
    const task = new Task({
      title,
      description,
      assignedUser: assignedUser || null,
      status: status || 'Todo',
      priority: priority || 'Medium',
      createdBy: req.user.id,
    });
    await task.save();
    await task.populate('assignedUser', 'username email');
    // Log action
    await ActionLog.create({
      action: 'created',
      taskId: task._id,
      userId: req.user.id,
      details: { after: task },
    });
    // Emit socket event
    const io = req.app.get('io');
    if (io) io.emit('task-created', task);
    res.status(201).json({ task });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/tasks/:id - Update task
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, assignedUser, status, priority, version } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) {
      console.log('[PUT /api/tasks/:id] Task not found:', req.params.id);
      return res.status(404).json({ message: 'Task not found' });
    }
    console.log('[PUT /api/tasks/:id] Incoming version:', version, 'Current DB version:', task.version);
    // Conflict detection
    if (version !== undefined && version !== task.version) {
      console.log('[PUT /api/tasks/:id] Version conflict! Incoming:', version, 'DB:', task.version);
      const io = req.app.get('io');
      if (io) {
        io.emit('conflict-detected', {
          taskId: task._id,
          userId: req.user.id, // who caused the conflict
          current: task
        });
      }
      return res.status(409).json({ message: 'Task version conflict', current: task });
    }
    // Save old state for logging
    const oldTask = { ...task.toObject() };
    // Track if assignedUser is changing
    const wasAssignedUser = task.assignedUser ? task.assignedUser.toString() : null;
    const willBeAssignedUser = assignedUser ? assignedUser.toString() : null;
    // Track if status is changing
    const wasStatus = task.status;
    // Title validation
    if (title) {
      const forbiddenTitles = ['Todo', 'In Progress', 'Done'];
      if (forbiddenTitles.includes(title)) {
        console.log('[PUT /api/tasks/:id] Invalid title:', title);
        return res.status(400).json({ message: 'Invalid task title' });
      }
      const existing = await Task.findOne({ title, _id: { $ne: task._id } });
      if (existing) {
        console.log('[PUT /api/tasks/:id] Duplicate title:', title);
        return res.status(400).json({ message: 'Task title must be unique' });
      }
      task.title = title;
    }
    if (description !== undefined) task.description = description;
    if (assignedUser !== undefined) task.assignedUser = assignedUser;
    if (status !== undefined) task.status = status;
    if (priority !== undefined) task.priority = priority;
    task.version += 1;
    await task.save();
    await task.populate('assignedUser', 'username email');
    // Log action
    await ActionLog.create({
      action: 'updated',
      taskId: task._id,
      userId: req.user.id,
      details: { before: oldTask, after: task },
    });
    // Log reassignment if assignedUser changed
    if (wasAssignedUser && willBeAssignedUser && wasAssignedUser !== willBeAssignedUser) {
      await ActionLog.create({
        action: 'reassigned',
        taskId: task._id,
        userId: req.user.id,
        details: { before: oldTask, after: task },
      });
    }
    // Log moved to In Progress or Done
    if (status && wasStatus !== status && (status === 'In Progress' || status === 'Done')) {
      await ActionLog.create({
        action: 'moved',
        taskId: task._id,
        userId: req.user.id,
        details: { before: oldTask, after: task },
        message: status === 'In Progress'
          ? `Project "${task.title}" is in progress.`
          : `Project "${task.title}" is done.`
      });
    }
    // Emit socket event
    const io = req.app.get('io');
    if (io) io.emit('task-updated', task);
    res.json({ task });
  } catch (err) {
    console.error('[PUT /api/tasks/:id] Server error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/tasks/:id - Delete task
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    // Log action
    await ActionLog.create({
      action: 'deleted',
      taskId: task._id,
      userId: req.user.id,
      details: { before: task },
    });
    // Emit socket event
    const io = req.app.get('io');
    if (io) io.emit('task-deleted', task._id);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/tasks/:id/smart-assign - Smart assign task
router.post('/:id/smart-assign', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    // Restrict re-assign for Done tasks
    if (task.status === 'Done') {
      return res.status(400).json({ message: 'Cannot re-assign a task that is Done.' });
    }
    // Find all users
    const users = await User.find({}, '_id username email');
    if (!users.length) {
      return res.status(400).json({ message: 'No users available for assignment' });
    }
    // Count tasks assigned to each user
    const taskCounts = await Task.aggregate([
      { $match: { assignedUser: { $ne: null } } },
      { $group: { _id: '$assignedUser', count: { $sum: 1 } } }
    ]);
    // Map userId to count
    const userTaskMap = {};
    taskCounts.forEach(tc => { userTaskMap[tc._id.toString()] = tc.count; });
    // Find user with fewest tasks
    let minCount = Infinity;
    let selectedUser = null;
    users.forEach(user => {
      const count = userTaskMap[user._id.toString()] || 0;
      if (count < minCount) {
        minCount = count;
        selectedUser = user;
      }
    });
    if (!selectedUser) {
      return res.status(400).json({ message: 'No eligible user found for assignment' });
    }
    // Track if assignedUser is changing
    const wasAssignedUser = task.assignedUser ? task.assignedUser.toString() : null;
    // Assign task
    task.assignedUser = selectedUser._id;
    task.version += 1;
    await task.save();
    await task.populate('assignedUser', 'username email');
    // Log action
    await ActionLog.create({
      action: 'assigned',
      taskId: task._id,
      userId: req.user.id,
      details: { after: task },
    });
    // Log reassignment if assignedUser changed
    if (wasAssignedUser && wasAssignedUser !== selectedUser._id.toString()) {
      await ActionLog.create({
        action: 'reassigned',
        taskId: task._id,
        userId: req.user.id,
        details: { after: task },
      });
    }
    // Emit socket event
    const io = req.app.get('io');
    if (io) io.emit('task-updated', task);
    res.json({ task });
  } catch (err) {
    res.status(500).json({ message: 'Smart assign failed', error: err.message });
  }
});

module.exports = router; 