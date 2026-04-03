const mongoose = require('mongoose');

const codingSubmissionSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'CodingQuestion' },
  questionNumber: { type: Number, required: true },
  questionTitle: String,
  language: String,
  code: String,
  testcasesPassed: Number,
  testcasesTotal: Number,
  score: Number,
  isFinalized: { type: Boolean, default: false },
  submittedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CodingSubmission', codingSubmissionSchema);
