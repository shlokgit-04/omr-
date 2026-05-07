import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getExam, submitStudent } from '../utils/api';
import AnswerGrid from '../components/AnswerGrid';
import CameraCapture from '../components/CameraCapture';
import toast from 'react-hot-toast';

export default function CheckStudent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0); // 0=details, 1=answers
  const [rollNumber, setRollNumber] = useState('');
  const [inputMethod, setInputMethod] = useState('manual');
  const [answers, setAnswers] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getExam(id)
      .then(({ data }) => { setExam(data); setAnswers(Array(data.totalQuestions).fill('')); })
      .catch(() => toast.error('Failed to load exam'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAnswerChange = (i, val) => {
    setAnswers(prev => { const c = [...prev]; c[i] = val; return c; });
  };

  const handleDetected = (detected) => {
    setAnswers(prev => prev.map((a, i) => detected[i] || a));
  };

  const handleSubmit = async () => {
    if (!rollNumber.trim()) return toast.error('Roll number is required');
    const empty = answers.filter(a => !a).length;
    if (empty > 0 && !window.confirm(`${empty} question(s) are unanswered. Submit anyway?`)) return;
    setSubmitting(true);
    try {
      const { data } = await submitStudent({ examId: id, rollNumber: rollNumber.trim(), answers });
      toast.success(`Submitted! Score: ${data.score}/${exam.totalQuestions}`);
      navigate(`/result/${data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="page"><div className="loading-page"><div className="spinner" /></div></div>;
  if (!exam) return <div className="page"><p>Exam not found.</p></div>;

  const filledCount = answers.filter(Boolean).length;

  return (
    <div className="page">
      <button className="btn btn-secondary btn-sm mb-20" onClick={() => navigate(`/exam/${id}`)}>← Back to Exam</button>
      <div className="page-header">
        <h1>🎓 Check Student</h1>
        <p>Exam: <strong>{exam.name}</strong> · {exam.totalQuestions} Questions</p>
      </div>

      {step === 0 && (
        <div className="card animate-in" style={{ maxWidth: 540 }}>
          <h2 style={{ marginBottom: 24 }}>👤 Student Details</h2>
          <div className="form-group mb-24">
            <label className="form-label">Roll Number</label>
            <input className="form-input" placeholder="e.g. 2024001" value={rollNumber} onChange={e => setRollNumber(e.target.value)} autoFocus onKeyDown={e => e.key === 'Enter' && rollNumber && setStep(1)} />
          </div>
          <div className="form-group mb-24">
            <label className="form-label">Answer Input Method</label>
            <div className="method-cards" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
              {[
                { id: 'manual', icon: '⌨️', label: 'Manual', desc: 'Click bubbles' },
                { id: 'upload', icon: '🖼️', label: 'Upload', desc: 'Image file' },
                { id: 'camera', icon: '📷', label: 'Camera', desc: 'Live capture' },
              ].map(m => (
                <div key={m.id} className={`method-card ${inputMethod === m.id ? 'selected' : ''}`} onClick={() => setInputMethod(m.id)}>
                  <div className="method-icon" style={{ fontSize: '1.6rem' }}>{m.icon}</div>
                  <h3 style={{ fontSize: '0.85rem' }}>{m.label}</h3>
                  <p>{m.desc}</p>
                </div>
              ))}
            </div>
          </div>
          <button className="btn btn-primary btn-lg btn-full" onClick={() => { if (!rollNumber.trim()) return toast.error('Enter roll number'); setStep(1); }}>
            Next: Enter Answers →
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="animate-in">
          <div className="card mb-20">
            <div className="flex-between mb-16">
              <div>
                <h2 style={{ fontFamily: 'Outfit,sans-serif' }}>Roll No: {rollNumber}</h2>
                <p className="text-muted text-sm">{filledCount}/{exam.totalQuestions} answered</p>
              </div>
              <div className="flex gap-8">
                <button className="btn btn-secondary btn-sm" onClick={() => setStep(0)}>← Back</button>
                <span className={`badge ${filledCount === exam.totalQuestions ? 'badge-green' : 'badge-red'}`}>
                  {filledCount}/{exam.totalQuestions}
                </span>
              </div>
            </div>

            {(inputMethod === 'camera' || inputMethod === 'upload') && (
              <div className="mb-24">
                <CameraCapture mode={inputMethod} totalQuestions={exam.totalQuestions} onDetected={handleDetected} />
                <div className="divider" />
                <p className="text-muted text-sm">✏️ Verify or adjust detected answers below:</p>
              </div>
            )}

            <AnswerGrid answers={answers} total={exam.totalQuestions} onChange={handleAnswerChange} />
          </div>

          <div className="flex gap-12">
            <button className="btn btn-secondary" onClick={() => setAnswers(Array(exam.totalQuestions).fill(''))}>🔄 Clear All</button>
            <button className="btn btn-success btn-lg" onClick={handleSubmit} disabled={submitting}>
              {submitting ? '⏳ Grading...' : '✅ Submit & Grade'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
