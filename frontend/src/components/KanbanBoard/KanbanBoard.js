import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import TaskCard from '../TaskCard/TaskCard';
import ActivityLog from '../ActivityLog/ActivityLog';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import Navbar from '../Navbar/Navbar';

const priorities = ['Low', 'Medium', 'High'];
const API_URL = process.env.REACT_APP_API_URL;

export default function KanbanBoard() {
  const { token, user, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'Medium', assignedUser: '' });
  const [newTaskError, setNewTaskError] = useState('');
  const [creating, setCreating] = useState(false);
  const [users, setUsers] = useState([]);
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);
  const socketRef = useRef(null);

  // Fetch users when modal opens
  useEffect(() => {
    if (showNewTask && token) {
      fetch(`${API_URL}/api/tasks/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data.users)) {
            setUsers(data.users);
          }
        });
    }
  }, [showNewTask, token]);

  // Fetch tasks
  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch(`${API_URL}/api/tasks`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.tasks) setTasks(data.tasks);
        else setError(data.message || 'Failed to fetch tasks');
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to fetch tasks');
        setLoading(false);
      });
  }, [token]);

  // Socket.IO setup
  useEffect(() => {
    if (!token || !user) return;
    const socket = io('/', {
      auth: { token },
      transports: ['websocket'],
    });
    socketRef.current = socket;
    socket.emit('join-board', { userId: user.id });

    socket.on('task-created', (task) => {
      setTasks(prev => prev.some(t => t._id === task._id) ? prev : [...prev, task]);
    });
    socket.on('task-updated', (updatedTask) => {
      setTasks(prev => prev.map(t => t._id === updatedTask._id ? updatedTask : t));
    });
    socket.on('task-deleted', (taskId) => {
      setTasks(prev => prev.filter(t => t._id !== taskId));
    });
    // Listen for conflict-detected event
    socket.on('conflict-detected', ({ taskId, userId, current }) => {
      if (userId !== user.id) {
        // Optionally: check if the user is editing this task
        alert('A conflict was detected on a task you are editing. Please refresh or review changes.');
        // You can replace this alert with a custom modal or notification
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [token, user]);

  // Emit events on create/update/delete
  const emitTaskCreate = (task) => {
    socketRef.current?.emit('task-create', task);
  };
  const emitTaskUpdate = (task) => {
    socketRef.current?.emit('task-update', task);
  };
  const emitTaskDelete = (taskId) => {
    socketRef.current?.emit('task-delete', taskId);
  };

  const handleNewTaskChange = e => {
    setNewTask({ ...newTask, [e.target.name]: e.target.value });
  };

  const handleCreateTask = async e => {
    e.preventDefault();
    setNewTaskError('');
    setCreating(true);
    try {
      const body = { ...newTask };
      if (!body.assignedUser) delete body.assignedUser;
      const res = await fetch(`${API_URL}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create task');
      setTasks(prev => [...prev, data.task]);
      emitTaskCreate(data.task);
      setShowNewTask(false);
      setNewTask({ title: '', description: '', priority: 'Medium', assignedUser: '' });
    } catch (err) {
      setNewTaskError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleTaskUpdate = (updated) => {
    setTasks(ts => ts.map(t => t._id === updated._id ? updated : t));
    emitTaskUpdate(updated);
  };

  const handleTaskDelete = (id) => {
    setTasks(ts => ts.filter(t => t._id !== id));
    emitTaskDelete(id);
  };

  // Drag and drop handlers
  const handleDragStart = (taskId) => {
    setDraggedTaskId(taskId);
  };
  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverCol(null);
  };
  const handleDragOver = (colKey, e) => {
    e.preventDefault();
    setDragOverCol(colKey);
  };
  const handleDrop = async (colKey, e) => {
    e.preventDefault();
    setDragOverCol(null);
    if (!draggedTaskId) return;
    const task = tasks.find(t => t._id === draggedTaskId);
    if (!task || task.status === colKey) return;
    // Update status in backend
    try {
      const res = await fetch(`${API_URL}/api/tasks/${task._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: colKey, version: task.version })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to move task');
      setTasks(ts => ts.map(t => t._id === data.task._id ? data.task : t));
      emitTaskUpdate(data.task);
    } catch (err) {
      // Optionally show error
    }
    setDraggedTaskId(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const columns = [
    { key: 'Todo', label: 'Todo' },
    { key: 'In Progress', label: 'In Progress' },
    { key: 'Done', label: 'Done' },
  ];

  if (authLoading || loading) return <div>Loading board...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="kanban-board-wrapper" style={{ display: 'flex', gap: 24 }}>
      <Navbar onNewTask={() => setShowNewTask(true)} user={user} onLogout={handleLogout} />
      <div className="kanban-board" style={{ flex: 2 }}>
        {showNewTask && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>New Task</h3>
              <form onSubmit={handleCreateTask}>
                <input
                  name="title"
                  placeholder="Title"
                  value={newTask.title}
                  onChange={handleNewTaskChange}
                  required
                />
                <textarea
                  name="description"
                  placeholder="Description"
                  value={newTask.description}
                  onChange={handleNewTaskChange}
                />
                <select
                  name="priority"
                  value={newTask.priority}
                  onChange={handleNewTaskChange}
                >
                  {priorities.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <select
                  name="assignedUser"
                  value={newTask.assignedUser}
                  onChange={handleNewTaskChange}
                >
                  <option value="">Unassigned</option>
                  {users.map(u => (
                    <option key={u._id} value={u._id}>{u.username}</option>
                  ))}
                </select>
                <div className="modal-actions">
                  <button type="submit" disabled={creating}>{creating ? 'Creating...' : 'Create'}</button>
                  <button type="button" onClick={() => setShowNewTask(false)}>Cancel</button>
                </div>
                {newTaskError && <div className="error">{newTaskError}</div>}
              </form>
            </div>
          </div>
        )}
        {columns.map(col => (
          <div
            key={col.key}
            className={`kanban-column${dragOverCol === col.key ? ' drag-over' : ''}`}
            onDragOver={e => handleDragOver(col.key, e)}
            onDrop={e => handleDrop(col.key, e)}
          >
            <h3>{col.label}</h3>
            <div className="kanban-tasks">
              {tasks.filter(task => task.status === col.key).map(task => (
                <TaskCard
                  key={task._id}
                  task={task}
                  onTaskUpdate={handleTaskUpdate}
                  onTaskDelete={handleTaskDelete}
                  draggable
                  onDragStart={() => handleDragStart(task._id)}
                  onDragEnd={handleDragEnd}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="kanban-activitylog" style={{ flex: 1, minWidth: 320 }}>
        <ActivityLog socket={socketRef.current} />
      </div>
    </div>
  );
} 