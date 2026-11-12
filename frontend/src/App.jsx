import React from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Dashboard from './pages/Dashboard';
import CreateExam from './pages/CreateExam';
import ExamDetail from './pages/ExamDetail';
import CheckStudent from './pages/CheckStudent';
import ResultView from './pages/ResultView';
import Login from './pages/Login';
import Register from './pages/Register';
import { AuthProvider, useAuth } from './utils/auth';

function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <span className="logo-icon">📋</span>
        OMR Checker
      </Link>
      <div className="navbar-links">
        {user ? (
          <>
            <Link to="/" className="btn btn-secondary btn-sm">Dashboard</Link>
            <Link to="/create" className="btn btn-primary btn-sm">+ New Exam</Link>
            <div className="nav-user">
              <span className="nav-user-name" title={user.email}>{user.name}</span>
              <button className="btn btn-ghost btn-sm" onClick={logout}>Sign out</button>
            </div>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-secondary btn-sm">Sign in</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Create account</Link>
          </>
        )}
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-links">
        <Link to="/">OMR Checker</Link>
        <span aria-hidden="true">·</span>
        <a href="/privacy.html">Privacy policy</a>
        <span aria-hidden="true">·</span>
        <a href="/about.html">About</a>
      </div>
      <div className="footer-credit">
        Made by <a href="https://shlok.is-a.dev" target="_blank" rel="noopener noreferrer">Shlok V.</a>
      </div>
    </footer>
  );
}

function Loading() {
  return (
    <div className="page">
      <div className="loading-page"><div className="spinner" /></div>
    </div>
  );
}

// Route guard: teacher-facing pages need a signed-in account.
// Student-facing pages (submit + result) stay public.
function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-layout">
          <Navbar />
          <main style={{ flex: 1 }}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/" element={<RequireAuth><Dashboard /></RequireAuth>} />
              <Route path="/create" element={<RequireAuth><CreateExam /></RequireAuth>} />
              <Route path="/exam/:id" element={<RequireAuth><ExamDetail /></RequireAuth>} />
              <Route path="/exam/:id/check" element={<CheckStudent />} />
              <Route path="/result/:studentId" element={<ResultView />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#1a1b2e',
                color: '#f1f5f9',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
              },
              success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
            }}
          />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
