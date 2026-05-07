import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createExam } from '../utils/api';
import AnswerGrid from '../components/AnswerGrid';
import CameraCapture from '../components/CameraCapture';
import toast from 'react-hot-toast';

const STEPS = ['Exam Info', 'Answer Key', 'Review'];

export default function CreateExam() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [examName, setExamName] = useState('');
  const [totalQ, setTotalQ] = useState('');
  const [keyMethod, setKeyMethod] = useState('manual'); // manual | camera | upload
  const [answers, setAnswers] = useState([]);
  const [saving, setSaving] = useState(false);

  const handleStep1 = (e) => {
    e.preventDefault();
    if (!examName.trim()) return toast.error('Exam name is required');
    const n = parseInt(totalQ);
    if (!n || n < 1 || n > 200) return toast.error('Questions must be between 1–200');
    setAnswers(Array(n).fill(''));
    setStep(1);
  };

  const handleAnswerChange = (i, val) => {
    setAnswers(prev => { const copy = [...prev]; copy[i] = val; return copy; });
  };

  const handleDetected = (detected) => {
    setAnswers(prev => prev.map((a, i) => detected[i] || a));
  };

  const handleReview = () => {
    const empty = answers.filter(a => !a).length;
    if (empty > 0 && !window.confirm(`${empty} question(s) have no answer. Continue?`)) return;
    setStep(2);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await createExam({ name: examName.trim(), totalQuestions: parseInt(totalQ), answerKey: answers });
      toast.success('Exam created successfully!');
      navigate(`/exam/${data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create exam');
    } finally {
      setSaving(false);
    }
  };

  const filledCount = answers.filter(Boolean).length;

  return (
    <div className="page">
      <div className="page-header">
        <h1>✏️ Create New Exam</h1>
        <p>Set up your exam and answer key in a few steps</p>
      </div>

      {/* Step indicator */}
      <div className="step-indicator mb-24" style={{ flexWrap: 'wrap', gap: 8 }}>
        {STEPS.map((label, i) => (
          <React.Fragment key={i}>
            <div className={`step ${i === step ? 'active' : i < step ? 'done' : ''}`}>
              <div className="step-num">{i < step ? '✓' : i + 1}</div>
              <div className="step-label">{label}</div>
            </div>
            {i < STEPS.length - 1 && <div className="step-line" />}
          </React.Fragment>
        ))}
      </div>

      {/* STEP 0: Exam Info */}
      {step === 0 && (
        <div className="card animate-in" style={{ maxWidth: 540 }}>
          <h2 style={{ marginBottom: 24, fontFamily: 'var(--font-outfit)' }}>📚 Exam Details</h2>
          <form onSubmit={handleStep1} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="form-group">
              <label className="form-label">Exam Name</label>
              <input className="form-input" placeholder="e.g. Physics Chapter 5 Test" value={examName} onChange={e => setExamName(e.target.value)} autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Number of Questions</label>
              <input className="form-input" type="number" min="1" max="200" placeholder="e.g. 50" value={totalQ} onChange={e => setTotalQ(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary btn-lg btn-full">Next: Set Answer Key →</button>
          </form>
        </div>
      )}

      {/* STEP 1: Answer Key */}
      {step === 1 && (
        <div className="animate-in">
          <div className="card mb-20">
            <h2 style={{ marginBottom: 8, fontFamily: 'var(--font-outfit)' }}>🔑 Answer Key for "{examName}"</h2>
            <p className="text-muted text-sm mb-24">{filledCount}/{answers.length} answers filled</p>

            <div className="method-cards mb-24">
              {[
                { id: 'manual', icon: '⌨️', label: 'Manual Entry', desc: 'Click bubbles to set each answer' },
                { id: 'upload', icon: '🖼️', label: 'Upload Image', desc: 'Upload a printed answer key sheet' },
                { id: 'camera', icon: '📷', label: 'Camera', desc: 'Capture with your device camera' },
              ].map(m => (
                <div key={m.id} className={`method-card ${keyMethod === m.id ? 'selected' : ''}`} onClick={() => setKeyMethod(m.id)}>
                  <div className="method-icon">{m.icon}</div>
                  <h3>{m.label}</h3>
                  <p>{m.desc}</p>
                </div>
              ))}
            </div>

            {(keyMethod === 'camera' || keyMethod === 'upload') && (
              <div className="mb-24">
                <CameraCapture mode={keyMethod} totalQuestions={answers.length} onDetected={handleDetected} />
                <p className="text-muted text-sm mt-12">⚠️ Image detection is approximate — please verify each answer below after detection.</p>
              </div>
            )}
          </div>

          <div className="card mb-20">
            <h3 style={{ marginBottom: 16 }}>Answer Key Grid</h3>
            <AnswerGrid answers={answers} total={answers.length} onChange={handleAnswerChange} />
          </div>

          <div className="flex gap-12">
            <button className="btn btn-secondary" onClick={() => setStep(0)}>← Back</button>
            <button className="btn btn-primary btn-lg" onClick={handleReview}>Review & Save →</button>
          </div>
        </div>
      )}

      {/* STEP 2: Review */}
      {step === 2 && (
        <div className="animate-in">
          <div className="card mb-20">
            <h2 style={{ marginBottom: 20, fontFamily: 'var(--font-outfit)' }}>👁️ Review Exam</h2>
            <div className="grid-2 mb-20">
              <div className="stat-chip"><span className="stat-icon">📝</span><div><div className="stat-val">{examName}</div><div className="stat-label">Exam Name</div></div></div>
              <div className="stat-chip"><span className="stat-icon">🔢</span><div><div className="stat-val">{answers.length}</div><div className="stat-label">Total Questions</div></div></div>
            </div>
            <div className="flex gap-8 mb-16" style={{ flexWrap: 'wrap' }}>
              {answers.map((a, i) => (
                <span key={i} className={`badge ${a ? 'badge-purple' : 'badge-red'}`}>Q{i + 1}: {a || '?'}</span>
              ))}
            </div>
            {filledCount < answers.length && (
              <div className="badge badge-red" style={{ padding: '8px 14px', borderRadius: 'var(--radius-sm)' }}>
                ⚠️ {answers.length - filledCount} unanswered question(s) — will be stored as empty
              </div>
            )}
          </div>
          <div className="flex gap-12">
            <button className="btn btn-secondary" onClick={() => setStep(1)}>← Edit</button>
            <button className="btn btn-success btn-lg" onClick={handleSave} disabled={saving}>
              {saving ? '⏳ Saving...' : '✅ Save Exam'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
