import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Dashboard from './pages/Dashboard';
import CreateExam from './pages/CreateExam';
import ExamDetail from './pages/ExamDetail';
import CheckStudent from './pages/CheckStudent';
import ResultView from './pages/ResultView';

function Navbar() {
  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <span className="logo-icon">📋</span>
        OMR Checker
      </Link>
      <div className="navbar-links">
        <Link to="/" className="btn btn-secondary btn-sm">Dashboard</Link>
        <Link to="/create" className="btn btn-primary btn-sm">+ New Exam</Link>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Navbar />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/create" element={<CreateExam />} />
            <Route path="/exam/:id" element={<ExamDetail />} />
            <Route path="/exam/:id/check" element={<CheckStudent />} />
            <Route path="/result/:studentId" element={<ResultView />} />
          </Routes>
        </main>
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
  );
}
