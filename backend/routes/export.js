const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Exam = require('../models/Exam');
const { Parser } = require('json2csv');

// GET /api/export/:examId  → CSV download
router.get('/:examId', async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.examId);
    if (!exam) return res.status(404).json({ error: 'Exam not found' });

    const students = await Student.find({ examId: req.params.examId }).sort({ submittedAt: 1 });

    if (students.length === 0) {
      return res.status(400).json({ error: 'No student records to export' });
    }

    const fields = [
      { label: 'Roll Number', value: 'rollNumber' },
      { label: 'Score', value: 'score' },
      { label: 'Total', value: row => exam.totalQuestions },
      { label: 'Percentage', value: row => row.percentage + '%' },
      { label: 'Submitted At', value: row => new Date(row.submittedAt).toLocaleString() },
      // Add per-question columns
      ...Array.from({ length: exam.totalQuestions }, (_, i) => ({
        label: `Q${i + 1}`,
        value: row => row.answers[i] || '-'
      }))
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(students);

    res.header('Content-Type', 'text/csv');
    res.attachment(`${exam.name.replace(/\s+/g, '_')}_results.csv`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
