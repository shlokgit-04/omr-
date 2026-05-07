import React from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteExam } from '../utils/api';
import toast from 'react-hot-toast';

export default function ExamCard({ exam, onDeleted }) {
  const navigate = useNavigate();

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete exam "${exam.name}" and ALL student records? This cannot be undone.`)) return;
    try {
      await deleteExam(exam._id);
      toast.success('Exam deleted');
      onDeleted(exam._id);
    } catch {
      toast.error('Failed to delete exam');
    }
  };

  const created = new Date(exam.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });

  return (
    <div className="card animate-in" style={{ cursor: 'pointer' }} onClick={() => navigate(`/exam/${exam._id}`)}>
      <div className="flex-between mb-16">
        <div className="flex gap-8" style={{ alignItems: 'center' }}>
          <span style={{ fontSize: '1.5rem' }}>📝</span>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontFamily: 'var(--font-outfit)', fontWeight: 700 }}>{exam.name}</h3>
            <span className="text-muted text-sm">{created}</span>
          </div>
        </div>
        <button className="btn btn-danger btn-icon btn-sm" onClick={handleDelete} title="Delete exam">🗑️</button>
      </div>
      <div className="flex gap-8" style={{ flexWrap: 'wrap' }}>
        <span className="badge badge-purple">📊 {exam.totalQuestions} Questions</span>
        <span className="badge badge-cyan">👥 {exam.studentsCount ?? 0} Students</span>
      </div>
      <div className="divider" />
      <div className="flex gap-8">
        <button
          className="btn btn-primary btn-sm"
          onClick={(e) => { e.stopPropagation(); navigate(`/exam/${exam._id}/check`); }}
        >▶ Start Checking</button>
        <button
          className="btn btn-secondary btn-sm"
          onClick={(e) => { e.stopPropagation(); navigate(`/exam/${exam._id}`); }}
        >📋 View Results</button>
      </div>
    </div>
  );
}
