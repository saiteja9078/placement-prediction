const mongoose = require('mongoose');

const codingQuestionSchema = new mongoose.Schema({
  orderIndex: { type: Number, required: true },
  title: { type: String, required: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
  description: { type: String, required: true },
  examples: [{
    input: String,
    output: String,
    explanation: String
  }],
  constraints: [String],
  starterCode: {
    python: String,
    javascript: String,
    java: String,
    cpp: String
  },
  hiddenTestCases: [{
    input: String,
    expectedOutput: String
  }],
  publicTestCases: [{
    input: String,
    expectedOutput: String
  }],
  timeLimit: { type: Number, default: 2000 },
  memoryLimit: { type: Number, default: 128 }
});

module.exports = mongoose.model('CodingQuestion', codingQuestionSchema);
