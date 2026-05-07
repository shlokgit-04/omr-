import React from 'react';

const OPTIONS = ['A', 'B', 'C', 'D'];

/**
 * Interactive OMR bubble grid for answer input.
 * @param {string[]} answers - Current selected answers array
 * @param {number} total - Total number of questions
 * @param {function} onChange - Called with (index, value)
 * @param {boolean} readOnly - Disables interaction
 */
export default function AnswerGrid({ answers, total, onChange, readOnly = false }) {
  const handleSelect = (qIndex, option) => {
    if (readOnly) return;
    // Toggle off if same option clicked
    const newVal = answers[qIndex] === option ? '' : option;
    onChange(qIndex, newVal);
  };

  return (
    <div className="omr-grid">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="omr-row animate-in" style={{ animationDelay: `${i * 0.01}s` }}>
          <span className="omr-qnum">Q{i + 1}</span>
          <div className="omr-bubbles">
            {OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                className={`bubble ${answers[i] === opt ? 'selected' : ''}`}
                onClick={() => handleSelect(i, opt)}
                disabled={readOnly}
                title={`Question ${i + 1}: ${opt}`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
