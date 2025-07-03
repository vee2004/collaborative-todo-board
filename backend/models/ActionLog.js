const mongoose = require('mongoose');

const actionLogSchema = new mongoose.Schema({
  action: { type: String, enum: ['created', 'updated', 'deleted', 'moved', 'assigned', 'reassigned'], required: true },
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  details: { type: Object },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('ActionLog', actionLogSchema); 