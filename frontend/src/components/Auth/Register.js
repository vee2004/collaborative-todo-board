import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useLoading } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export default function Register() {
  const { register } = useAuth();
  const { setLoading } = useLoading();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(username, email, password);
      navigate('/board');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={useLoading().loading}>
          {useLoading().loading ? <span className="spinner" style={{ marginRight: 8 }}></span> : null}
          {useLoading().loading ? 'Registering...' : 'Register'}
        </button>
        {error && <div className="error">{error}</div>}
      </form>
      <p>Already have an account? <a href="/login">Login</a></p>
    </div>
  );
} 