const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Exam = require('../models/Exam');

// GET students for an exam
router.get('/', async (req, res) => {
  try {
    const { examId } = req.query;
    if (!examId) return res.status(400).json({ error: 'examId query param required' });
    const students = await Student.find({ examId }).sort({ submittedAt: -1 });
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single student result
router.get('/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate('examId');
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST submit student answers → auto-grade
router.post('/', async (req, res) => {
  try {
    const { examId, rollNumber, answers } = req.body;
    if (!examId || !rollNumber || !answers) {
      return res.status(400).json({ error: 'examId, rollNumber, and answers are required' });
    }

    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ error: 'Exam not found' });

    if (answers.length !== exam.totalQuestions) {
      return res.status(400).json({ error: `Expected ${exam.totalQuestions} answers, got ${answers.length}` });
    }

    // Auto-grading logic
    let score = 0;
    for (let i = 0; i < exam.totalQuestions; i++) {
      const studentAnswer = (answers[i] || '').toUpperCase();
      const correctAnswer = exam.answerKey[i].toUpperCase();
      if (studentAnswer === correctAnswer) score++;
    }
    const percentage = parseFloat(((score / exam.totalQuestions) * 100).toFixed(2));

    const student = new Student({
      examId,
      rollNumber: rollNumber.trim(),
      answers: answers.map(a => (a || '').toUpperCase()),
      score,
      percentage
    });
    await student.save();

    res.status(201).json({ ...student.toObject(), answerKey: exam.answerKey, examName: exam.name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE student record
router.delete('/:id', async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json({ message: 'Student record deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
