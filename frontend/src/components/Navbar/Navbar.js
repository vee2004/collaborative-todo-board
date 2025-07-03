import React from 'react';

export default function Navbar({ onNewTask, user, onLogout }) {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-left">
          <span className="app-title" style={{ fontWeight: 600, fontSize: '1.2em', marginRight: 24 }}>My Kanban</span>
          <button onClick={onNewTask} style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 20px', fontSize: '1rem', cursor: 'pointer' }}>+ New Task</button>
        </div>
        <div style={{ flex: 1 }} />
        <div className="navbar-right">
          <span>Hi, {user?.username}</span>
          <button onClick={onLogout} style={{ background: '#e11d48', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer' }}>Logout</button>
        </div>
      </div>
    </nav>
  );
} 