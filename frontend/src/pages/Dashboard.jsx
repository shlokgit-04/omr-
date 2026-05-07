import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getExams } from '../utils/api';
import ExamCard from '../components/ExamCard';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchExams = async () => {
    setLoading(true);
    try {
      const { data } = await getExams();
      setExams(data);
    } catch {
      toast.error('Failed to load exams. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchExams(); }, []);

  const totalStudents = exams.reduce((s, e) => s + (e.studentsCount || 0), 0);

  return (
    <div className="page">
      {/* Header */}
      <div className="flex-between mb-24">
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>📋 Dashboard</h1>
          <p>Manage your exams and student results</p>
        </div>
        <button className="btn btn-primary btn-lg" onClick={() => navigate('/create')}>
          + Create New Exam
        </button>
      </div>

      {/* Stats */}
      <div className="grid-3 mb-24">
        <div className="stat-chip">
          <span className="stat-icon">📚</span>
          <div>
            <div className="stat-val font-outfit">{exams.length}</div>
            <div className="stat-label">Total Exams</div>
          </div>
        </div>
        <div className="stat-chip">
          <span className="stat-icon">👥</span>
          <div>
            <div className="stat-val font-outfit">{totalStudents}</div>
            <div className="stat-label">Students Checked</div>
          </div>
        </div>
        <div className="stat-chip">
          <span className="stat-icon">✅</span>
          <div>
            <div className="stat-val font-outfit">{exams.reduce((s, e) => s + e.totalQuestions, 0)}</div>
            <div className="stat-label">Total Questions</div>
          </div>
        </div>
      </div>

      {/* Exam List */}
      {loading ? (
        <div className="loading-page">
          <div className="spinner" />
          <span>Loading exams...</span>
        </div>
      ) : exams.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>No Exams Yet</h3>
            <p>Create your first exam to get started</p>
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/create')}>
              + Create First Exam
            </button>
          </div>
        </div>
      ) : (
        <>
          <h2 style={{ fontSize: '1rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
            Your Exams ({exams.length})
          </h2>
          <div className="grid-2">
            {exams.map((exam) => (
              <ExamCard key={exam._id} exam={exam} onDeleted={(id) => setExams(p => p.filter(e => e._id !== id))} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
