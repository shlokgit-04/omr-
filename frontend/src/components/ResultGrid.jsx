import React from 'react';

const OPTIONS = ['A', 'B', 'C', 'D'];

/**
 * Read-only color-coded result grid.
 * @param {string[]} studentAnswers
 * @param {string[]} answerKey
 */
export default function ResultGrid({ studentAnswers, answerKey }) {
  return (
    <div className="omr-grid">
      {answerKey.map((correct, i) => {
        const student = (studentAnswers[i] || '').toUpperCase();
        const isCorrect = student === correct.toUpperCase();
        const rowClass = student ? (isCorrect ? 'correct' : 'wrong') : '';
        return (
          <div key={i} className={`omr-row animate-in ${rowClass}`} style={{ animationDelay: `${i * 0.01}s` }}>
            <span className="omr-qnum">Q{i + 1}</span>
            <div className="omr-bubbles">
              {OPTIONS.map((opt) => {
                let cls = 'bubble';
                if (opt === student && opt === correct.toUpperCase()) cls += ' correct-ans';
                else if (opt === student && opt !== correct.toUpperCase()) cls += ' wrong-ans';
                else if (opt === correct.toUpperCase() && student !== correct.toUpperCase()) cls += ' correct-hint';
                return (
                  <span key={opt} className={cls} title={
                    opt === correct.toUpperCase() ? '✅ Correct Answer' :
                    opt === student ? '❌ Student Answer' : ''
                  }>
                    {opt}
                  </span>
                );
              })}
            </div>
            <span style={{ fontSize: '0.9rem', marginLeft: 'auto' }}>
              {isCorrect ? '✅' : student ? '❌' : '—'}
            </span>
          </div>
        );
      })}
    </div>
  );
}
