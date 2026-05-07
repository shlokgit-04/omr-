import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getStudent } from '../utils/api';
import ResultGrid from '../components/ResultGrid';
import toast from 'react-hot-toast';

export default function ResultView() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStudent(studentId)
      .then(({ data: d }) => setData(d))
      .catch(() => toast.error('Failed to load result'))
      .finally(() => setLoading(false));
  }, [studentId]);

  if (loading) return <div className="page"><div className="loading-page"><div className="spinner" /></div></div>;
  if (!data) return <div className="page"><p>Result not found.</p></div>;

  const { rollNumber, score, percentage, answers, examId } = data;
  const exam = examId; // populated
  const total = exam?.totalQuestions ?? answers.length;
  const answerKey = exam?.answerKey ?? [];
  const examName = exam?.name ?? 'Unknown Exam';

  const pctColor = percentage >= 75 ? 'var(--green-light)' : percentage >= 50 ? 'var(--yellow)' : 'var(--red-light)';
  const grade = percentage >= 90 ? 'A+' : percentage >= 80 ? 'A' : percentage >= 70 ? 'B' : percentage >= 60 ? 'C' : percentage >= 50 ? 'D' : 'F';

  const correctCount = answers.filter((a, i) => a.toUpperCase() === (answerKey[i] || '').toUpperCase()).length;
  const wrongCount = answers.filter((a, i) => a && a.toUpperCase() !== (answerKey[i] || '').toUpperCase()).length;
  const skippedCount = answers.filter(a => !a).length;

  return (
    <div className="page">
      <div className="flex gap-8 mb-20">
        <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/exam/${exam?._id}`)}>← Back to Exam</button>
        <button className="btn btn-primary btn-sm" onClick={() => navigate(`/exam/${exam?._id}/check`)}>+ Next Student</button>
      </div>

      {/* Result Header Card */}
      <div className="card mb-24 animate-in">
        <div className="result-header">
          <div className="flex-center gap-16 mb-16" style={{ flexWrap: 'wrap' }}>
            <div className="text-center">
              <div className="score-display">{score}/{total}</div>
              <div className="score-label">Score</div>
            </div>
            <div style={{ width: 2, height: 60, background: 'var(--glass-border)' }} />
            <div className="text-center">
              <div style={{ fontFamily: 'Outfit,sans-serif', fontSize: '3.5rem', fontWeight: 800, color: pctColor, lineHeight: 1 }}>{percentage}%</div>
              <div className="score-label">Percentage</div>
            </div>
            <div style={{ width: 2, height: 60, background: 'var(--glass-border)' }} />
            <div className="text-center">
              <div style={{ fontFamily: 'Outfit,sans-serif', fontSize: '3.5rem', fontWeight: 800, color: pctColor, lineHeight: 1 }}>{grade}</div>
              <div className="score-label">Grade</div>
            </div>
          </div>

          <div className="flex-center gap-8" style={{ flexWrap: 'wrap', justifyContent: 'center', marginBottom: 12 }}>
            <span className="badge badge-purple">🎓 Roll No: {rollNumber}</span>
            <span className="badge badge-cyan">📝 {examName}</span>
          </div>
        </div>

        {/* Stat breakdown */}
        <div className="grid-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))' }}>
          <div className="stat-chip" style={{ background: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.25)' }}>
            <span className="stat-icon">✅</span>
            <div><div className="stat-val font-outfit" style={{ color: 'var(--green-light)' }}>{correctCount}</div><div className="stat-label">Correct</div></div>
          </div>
          <div className="stat-chip" style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)' }}>
            <span className="stat-icon">❌</span>
            <div><div className="stat-val font-outfit" style={{ color: 'var(--red-light)' }}>{wrongCount}</div><div className="stat-label">Wrong</div></div>
          </div>
          <div className="stat-chip">
            <span className="stat-icon">—</span>
            <div><div className="stat-val font-outfit" style={{ color: 'var(--text-muted)' }}>{skippedCount}</div><div className="stat-label">Skipped</div></div>
          </div>
        </div>
      </div>

      {/* Color-coded OMR grid */}
      <div className="card animate-in">
        <h3 style={{ marginBottom: 8 }}>📊 Detailed Answer Sheet</h3>
        <p className="text-muted text-sm mb-20">
          <span style={{ color: 'var(--green-light)' }}>●</span> Green = Correct &nbsp;
          <span style={{ color: 'var(--red-light)' }}>●</span> Red = Wrong &nbsp;
          <span style={{ color: 'var(--accent-light)' }}>●</span> Outline = Correct answer (when wrong)
        </p>
        {answerKey.length > 0 ? (
          <ResultGrid studentAnswers={answers} answerKey={answerKey} />
        ) : (
          <p className="text-muted">Answer key not available for this result.</p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-12 mt-24" style={{ flexWrap: 'wrap' }}>
        <button className="btn btn-primary btn-lg" onClick={() => navigate(`/exam/${exam?._id}/check`)}>
          👤 Next Student
        </button>
        <button className="btn btn-secondary btn-lg" onClick={() => navigate(`/exam/${exam?._id}`)}>
          📋 Complete Exam
        </button>
        <button className="btn btn-secondary" onClick={() => navigate('/')}>
          🏠 Dashboard
        </button>
      </div>
    </div>
  );
}
