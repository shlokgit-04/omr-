import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getExam, getStudents, deleteStudent, getExportUrl } from '../utils/api';
import toast from 'react-hot-toast';

export default function ExamDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    setLoading(true);
    try {
      const [eRes, sRes] = await Promise.all([getExam(id), getStudents(id)]);
      setExam(eRes.data);
      setStudents(sRes.data);
    } catch {
      toast.error('Failed to load exam');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, [id]);

  const handleDeleteStudent = async (sid, roll) => {
    if (!window.confirm(`Delete record for Roll No. ${roll}?`)) return;
    try {
      await deleteStudent(sid);
      setStudents(p => p.filter(s => s._id !== sid));
      toast.success('Record deleted');
    } catch { toast.error('Failed to delete'); }
  };

  if (loading) return <div className="page"><div className="loading-page"><div className="spinner" /><span>Loading...</span></div></div>;
  if (!exam) return <div className="page"><p>Exam not found.</p></div>;

  const avg = students.length ? (students.reduce((s, st) => s + st.percentage, 0) / students.length).toFixed(1) : 0;
  const highest = students.length ? Math.max(...students.map(s => s.score)) : 0;

  return (
    <div className="page">
      <div className="flex-between mb-24" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          <button className="btn btn-secondary btn-sm mb-12" onClick={() => navigate('/')}>← Dashboard</button>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.8rem', fontWeight: 700 }}>{exam.name}</h1>
          <p className="text-muted text-sm">{exam.totalQuestions} questions · Created {new Date(exam.createdAt).toLocaleDateString('en-IN')}</p>
        </div>
        <div className="flex gap-8" style={{ flexWrap: 'wrap' }}>
          <a href={getExportUrl(id)} className="btn btn-secondary" download>📥 Export CSV</a>
          <button className="btn btn-primary btn-lg" onClick={() => navigate(`/exam/${id}/check`)}>▶ Start Checking</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-4 mb-24" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))' }}>
        {[
          { icon: '👥', val: students.length, label: 'Students' },
          { icon: '📊', val: `${avg}%`, label: 'Avg Score' },
          { icon: '🏆', val: `${highest}/${exam.totalQuestions}`, label: 'Highest' },
          { icon: '📝', val: exam.totalQuestions, label: 'Questions' },
        ].map((s, i) => (
          <div key={i} className="stat-chip">
            <span className="stat-icon">{s.icon}</span>
            <div><div className="stat-val font-outfit">{s.val}</div><div className="stat-label">{s.label}</div></div>
          </div>
        ))}
      </div>

      {/* Answer Key Preview */}
      <div className="card mb-24">
        <h3 style={{ marginBottom: 12 }}>🔑 Answer Key</h3>
        <div className="flex gap-8" style={{ flexWrap: 'wrap' }}>
          {exam.answerKey.map((a, i) => (
            <span key={i} className="badge badge-purple">Q{i + 1}:{a}</span>
          ))}
        </div>
      </div>

      {/* Student Results */}
      <h2 style={{ fontSize: '1rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
        Student Results ({students.length})
      </h2>

      {students.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">🎓</div>
            <h3>No Students Checked Yet</h3>
            <p>Start checking students for this exam</p>
            <button className="btn btn-primary btn-lg" onClick={() => navigate(`/exam/${id}/check`)}>▶ Start Checking</button>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.03)' }}>
                  {['Roll No.', 'Score', 'Percentage', 'Submitted', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '14px 20px', textAlign: 'left', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map((s, idx) => {
                  const pct = s.percentage;
                  const color = pct >= 75 ? 'var(--green-light)' : pct >= 50 ? 'var(--yellow)' : 'var(--red-light)';
                  return (
                    <tr key={s._id} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '14px 20px', fontWeight: 600 }}>{s.rollNumber}</td>
                      <td style={{ padding: '14px 20px' }}>{s.score} / {exam.totalQuestions}</td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ color, fontWeight: 700, fontFamily: 'Outfit,sans-serif' }}>{pct}%</span>
                      </td>
                      <td style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {new Date(s.submittedAt).toLocaleDateString('en-IN')}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <div className="flex gap-8">
                          <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/result/${s._id}`)}>👁️ View</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeleteStudent(s._id, s.rollNumber)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
