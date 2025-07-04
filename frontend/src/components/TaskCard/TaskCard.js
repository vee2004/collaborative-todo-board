import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import ConflictResolver from '../ConflictResolver/ConflictResolver';

const priorities = ['Low', 'Medium', 'High'];
const statuses = ['Todo', 'In Progress', 'Done'];

export default function TaskCard({ task, onTaskUpdate, onTaskDelete, draggable, onDragStart, onDragEnd }) {
  const { token } = useAuth();
  const [showEdit, setShowEdit] = useState(false);
  const [editTask, setEditTask] = useState({ ...task });
  const [editError, setEditError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [conflict, setConflict] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [users, setUsers] = useState([]);

  const API_URL = process.env.REACT_APP_API_URL;

  // Always reset editTask to the current task when opening the modal
  const openEditModal = () => {
    console.log('Opening edit modal for task:', task);
    setEditTask({ ...task });
    setShowEdit(true);
  };

  // Fetch users when modal opens
  useEffect(() => {
    if (showEdit && token) {
      fetch(`${API_URL}/api/tasks/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data.users)) setUsers(data.users);
        });
    }
  }, [showEdit, token]);

  const handleEditChange = e => {
    setEditTask({ ...editTask, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async e => {
    e.preventDefault();
    setEditError('');
    setSaving(true);
    setConflict(null);
    try {
      const body = { ...editTask };
      if (body.assignedUser && typeof body.assignedUser === 'object') {
        body.assignedUser = body.assignedUser._id;
      }
      if (!body.assignedUser) delete body.assignedUser;
      console.log('Submitting edit:', body, 'with version:', task.version);
      const res = await fetch(`${API_URL}/api/tasks/${task._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...body,
          version: task.version
        })
      });
      const data = await res.json();
      if (res.status === 409) {
        console.log('Conflict detected! Server version:', data.current.version, data.current);
        setConflict(data.current);
        setEditError('Version conflict! The task was updated elsewhere.');
      } else if (!res.ok) {
        throw new Error(data.message || 'Failed to update task');
      } else {
        onTaskUpdate && onTaskUpdate(data.task);
        setShowEdit(false);
      }
    } catch (err) {
      setEditError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this task?')) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API_URL}/api/tasks/${task._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete task');
      onTaskDelete && onTaskDelete(task._id);
    } catch (err) {
      setEditError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  // Smart Assign
  const handleSmartAssign = async () => {
    if (task.status === 'Done') {
      setEditError('Cannot re-assign a task that is Done.');
      return;
    }
    if (task.assignedUser && !window.confirm('Are you sure you want to re-assign this task?')) return;
    setAssigning(true);
    setEditError('');
    try {
      const res = await fetch(`${API_URL}/api/tasks/${task._id}/smart-assign`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Smart assign failed');
      onTaskUpdate && onTaskUpdate(data.task);
    } catch (err) {
      setEditError(err.message);
    } finally {
      setAssigning(false);
    }
  };

  // Drag events
  const handleDragStart = (e) => {
    setIsDragging(true);
    if (onDragStart) onDragStart(e);
  };
  const handleDragEnd = (e) => {
    setIsDragging(false);
    if (onDragEnd) onDragEnd(e);
  };

  // Add this handler to resolve the conflict
  const handleResolveConflict = async (resolvedTask) => {
    setEditError('');
    setSaving(true);
    try {
      const body = { ...resolvedTask };
      if (body.assignedUser && typeof body.assignedUser === 'object') {
        body.assignedUser = body.assignedUser._id;
      }
      if (!body.assignedUser) delete body.assignedUser;
      console.log('Resolving conflict with:', body, 'using version:', conflict.version);
      const res = await fetch(`${API_URL}/api/tasks/${task._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...body,
          version: conflict.version // use the latest version
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setEditError(data.message || 'Failed to update task');
      } else {
        onTaskUpdate && onTaskUpdate(data.task);
        setShowEdit(false);
        setConflict(null);
      }
    } catch (err) {
      setEditError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div
        className={`task-card${isDragging ? ' dragging' : ''}`}
        draggable={draggable}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <h4>{task.title}</h4>
        <p>{task.description}</p>
        <div className="task-meta">
          <span>Priority: {task.priority}</span>
          {task.assignedUser && <span>Assigned: {task.assignedUser.username}</span>}
          <span>Status: {task.status}</span>
        </div>
        <div className="task-actions">
          <button onClick={openEditModal}>Edit</button>
          <button onClick={handleDelete} disabled={deleting}>{deleting ? 'Deleting...' : 'Delete'}</button>
          {task.status !== 'Done' && (
            <button
              onClick={handleSmartAssign}
              disabled={assigning}
              style={{ marginLeft: 8 }}
            >
              {assigning ? 'Assigning...' : 'Smart Assign'}
            </button>
          )}
        </div>
      </div>
      {showEdit && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Edit Task</h3>
            <form onSubmit={handleEditSubmit}>
              <input
                name="title"
                placeholder="Title"
                value={editTask.title}
                onChange={handleEditChange}
                required
              />
              <textarea
                name="description"
                placeholder="Description"
                value={editTask.description}
                onChange={handleEditChange}
              />
              <select
                name="priority"
                value={editTask.priority}
                onChange={handleEditChange}
              >
                {priorities.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <select
                name="status"
                value={editTask.status}
                onChange={handleEditChange}
              >
                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select
                name="assignedUser"
                value={editTask.assignedUser || ''}
                onChange={handleEditChange}
                disabled={editTask.status === 'Done'}
              >
                <option value="">Unassigned</option>
                {users.map(u => (
                  <option key={u._id} value={u._id}>{u.username}</option>
                ))}
              </select>
              {editTask.status === 'Done' && (
                <div style={{ color: '#e11d48', fontSize: '0.95em', marginTop: 4 }}>
                  Cannot re-assign a task that is Done.
                </div>
              )}
              <div className="modal-actions">
                <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
                <button type="button" onClick={() => setShowEdit(false)}>Cancel</button>
              </div>
              {editError && <div className="error">{editError}</div>}
            </form>
          </div>
        </div>
      )}
      {showEdit && conflict && (
        <ConflictResolver
          localTask={editTask}
          serverTask={conflict}
          onResolve={(resolvedTask) => { console.log('ConflictResolver onResolve fired', resolvedTask); handleResolveConflict(resolvedTask); }}
          onCancel={() => { console.log('ConflictResolver onCancel fired'); setConflict(null); }}
        />
      )}
    </>
  );
} 