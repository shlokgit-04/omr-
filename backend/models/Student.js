const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  rollNumber: { type: String, required: true, trim: true },
  answers: { type: [String], required: true },
  score: { type: Number, required: true },
  percentage: { type: Number, required: true },
  submittedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Student', studentSchema);
