const express = require('express');
const router = express.Router();
const Exam = require('../models/Exam');
const Student = require('../models/Student');

// GET all exams with student count
router.get('/', async (req, res) => {
  try {
    const exams = await Exam.find().sort({ createdAt: -1 });
    const examsWithCount = await Promise.all(
      exams.map(async (exam) => {
        const count = await Student.countDocuments({ examId: exam._id });
        return { ...exam.toObject(), studentsCount: count };
      })
    );
    res.json(examsWithCount);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single exam
router.get('/:id', async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ error: 'Exam not found' });
    const studentsCount = await Student.countDocuments({ examId: exam._id });
    res.json({ ...exam.toObject(), studentsCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create exam
router.post('/', async (req, res) => {
  try {
    const { name, totalQuestions, answerKey } = req.body;
    if (!name || !totalQuestions || !answerKey) {
      return res.status(400).json({ error: 'name, totalQuestions, and answerKey are required' });
    }
    if (answerKey.length !== parseInt(totalQuestions)) {
      return res.status(400).json({ error: 'answerKey length must match totalQuestions' });
    }
    const validOptions = ['A', 'B', 'C', 'D'];
    if (!answerKey.every(a => validOptions.includes(a.toUpperCase()))) {
      return res.status(400).json({ error: 'All answers must be A, B, C, or D' });
    }
    const exam = new Exam({ name, totalQuestions: parseInt(totalQuestions), answerKey: answerKey.map(a => a.toUpperCase()) });
    await exam.save();
    res.status(201).json(exam);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE exam and all its students
router.delete('/:id', async (req, res) => {
  try {
    const exam = await Exam.findByIdAndDelete(req.params.id);
    if (!exam) return res.status(404).json({ error: 'Exam not found' });
    await Student.deleteMany({ examId: req.params.id });
    res.json({ message: 'Exam and all student records deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
