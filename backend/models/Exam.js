const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  totalQuestions: { type: Number, required: true, min: 1, max: 200 },
  answerKey: { type: [String], required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Exam', examSchema);
