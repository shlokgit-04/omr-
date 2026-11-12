const express = require('express');
const router = express.Router();
const Exam = require('../models/Exam');
const Student = require('../models/Student');
const { requireAuth, requireExamOwner } = require('../middleware/auth');

// GET all exams for the signed-in user
router.get('/', requireAuth, async (req, res) => {
  try {
    const exams = await Exam.find({ userId: req.user._id }).sort({ createdAt: -1 });
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

// GET single exam — public WITHOUT the answer key so students can submit
// answers; the key is only returned to the signed-in exam owner.
router.get('/:id', async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ error: 'Exam not found' });
    const studentsCount = await Student.countDocuments({ examId: exam._id });
    const data = exam.toObject();
    const isOwner = req.user && String(exam.userId || '') === String(req.user._id);
    if (!isOwner) {
      delete data.answerKey;
      delete data.userId;
    }
    res.json({ ...data, studentsCount, isOwner });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create exam (owner = signed-in user)
router.post('/', requireAuth, async (req, res) => {
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
    const exam = new Exam({
      userId: req.user._id,
      name,
      totalQuestions: parseInt(totalQuestions),
      answerKey: answerKey.map(a => a.toUpperCase())
    });
    await exam.save();
    res.status(201).json(exam);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE exam and all its students (owner only)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const exam = await requireExamOwner(req.params.id, req, res);
    if (!exam) return;
    await Exam.findByIdAndDelete(req.params.id);
    await Student.deleteMany({ examId: req.params.id });
    res.json({ message: 'Exam and all student records deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
