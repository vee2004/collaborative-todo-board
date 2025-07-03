import React, { useState } from 'react';

const statuses = ['Todo', 'In Progress', 'Done'];
const priorities = ['Low', 'Medium', 'High'];

export default function ConflictResolver({ localTask, serverTask, onResolve, onCancel }) {
  const [mergedTask, setMergedTask] = useState({ ...localTask });

  const handleFieldChange = (field, value) => {
    setMergedTask(prev => ({ ...prev, [field]: value }));
  };

  // Helper to check if a field is different
  const isChanged = field => localTask[field] !== serverTask[field];

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Conflict Detected</h3>
        <p style={{ color: '#e11d48', fontWeight: 'bold' }}>
          <span style={{ fontSize: 16 }}>This task was updated by someone else while you were editing.</span><br/>
          <span style={{ fontSize: 14 }}>Review the differences below and choose how to resolve the conflict. You can merge changes, keep your version, or use the server's version.</span>
        </p>
        <div className="conflict-diff">
          <table>
            <thead>
              <tr>
                <th>Field</th>
                <th>Your Version</th>
                <th>Server Version</th>
                <th>Merge</th>
              </tr>
            </thead>
            <tbody>
              {['title', 'description', 'status', 'priority'].map(field => (
                <tr key={field} style={isChanged(field) ? { background: '#fffbe6' } : {}}>
                  <td>{field.charAt(0).toUpperCase() + field.slice(1)}</td>
                  <td>{localTask[field]}</td>
                  <td>{serverTask[field]}</td>
                  <td>
                    {field === 'status' ? (
                      <select value={mergedTask[field]} onChange={e => handleFieldChange(field, e.target.value)}>
                        {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    ) : field === 'priority' ? (
                      <select value={mergedTask[field]} onChange={e => handleFieldChange(field, e.target.value)}>
                        {priorities.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={mergedTask[field]}
                        onChange={e => handleFieldChange(field, e.target.value)}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="modal-actions">
          <button type="button" onClick={() => {
            const task = { ...mergedTask };
            if (task.assignedUser && typeof task.assignedUser === 'object') task.assignedUser = task.assignedUser._id;
            onResolve(task);
          }} style={{ background: '#3b82f6', color: '#fff' }}>Merge (custom)</button>
          <button type="button" onClick={() => {
            const task = { ...localTask };
            if (task.assignedUser && typeof task.assignedUser === 'object') task.assignedUser = task.assignedUser._id;
            onResolve(task);
          }}>Keep My Changes</button>
          <button type="button" onClick={() => {
            const task = { ...serverTask };
            if (task.assignedUser && typeof task.assignedUser === 'object') task.assignedUser = task.assignedUser._id;
            onResolve(task);
          }}>Use Server Version</button>
          <button type="button" onClick={onCancel} style={{ color: '#e11d48' }}>Cancel</button>
        </div>
      </div>
    </div>
  );
} 