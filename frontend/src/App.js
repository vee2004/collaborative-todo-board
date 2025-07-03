import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth, LoadingProvider, useLoading } from './hooks/useAuth';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import KanbanBoard from './components/KanbanBoard/KanbanBoard';
import './styles/App.css';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  return user ? children : <Navigate to="/login" />;
}

function GlobalLoadingOverlay() {
  const { loading } = useLoading();
  if (!loading) return null;
  return (
    <div className="global-loading-overlay">
      <div className="spinner"></div>
      <span>Loading...</span>
    </div>
  );
}

export default function App() {
  return (
    <LoadingProvider>
      <AuthProvider>
        <GlobalLoadingOverlay />
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/board"
              element={
                <PrivateRoute>
                  <KanbanBoard />
                </PrivateRoute>
              }
            />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </Router>
      </AuthProvider>
    </LoadingProvider>
  );
}
