import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

export default function ActivityLog({ socket }) {
  const { token } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLogs = () => {
    if (!token) return;
    setLoading(true);
    fetch('/api/logs', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data.logs)) setLogs(data.logs);
        else setError(data.message || 'Failed to fetch logs');
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch logs');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLogs();
  }, [token]);

  useEffect(() => {
    if (!socket) return;
    const updateLogs = () => fetchLogs();
    socket.on('task-created', updateLogs);
    socket.on('task-updated', updateLogs);
    socket.on('task-deleted', updateLogs);
    return () => {
      socket.off('task-created', updateLogs);
      socket.off('task-updated', updateLogs);
      socket.off('task-deleted', updateLogs);
    };
  }, [socket]);

  const actionText = (log) => {
    switch (log.action) {
      case 'created': return `created task "${log.details?.after?.title || ''}"`;
      case 'assigned': return `assigned task "${log.details?.after?.title || ''}"`;
      case 'reassigned': return `reassigned task "${log.details?.after?.title || ''}"`;
      case 'updated': return `updated task "${log.details?.after?.title || ''}"`;
      case 'deleted': return `deleted task "${log.details?.before?.title || ''}"`;
      case 'moved':
        if (log.message) return log.message;
        if (log.details?.after?.status === 'In Progress')
          return `moved task "${log.details?.after?.title || ''}" to In Progress`;
        if (log.details?.after?.status === 'Done')
          return `moved task "${log.details?.after?.title || ''}" to Done`;
        return `moved task "${log.details?.after?.title || ''}" to ${log.details?.after?.status}`;
      default: return log.action;
    }
  };

  if (loading) return <div>Loading activity log...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="activity-log-panel" style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid #ccc', padding: 10 }}>
      <h4>Activity Log</h4>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {logs.map(log => (
          <li key={log._id} style={{ marginBottom: 8 }}>
            <span style={{ fontWeight: 'bold' }}>{log.userId?.username || 'Someone'}</span> {actionText(log)}
            <span style={{ color: '#888', marginLeft: 8, fontSize: 12 }}>{new Date(log.timestamp).toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </div>
  );
} 