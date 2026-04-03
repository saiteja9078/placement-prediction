const mongoose = require('mongoose');

const aptitudeQuestionSchema = new mongoose.Schema({
  category: { type: String, enum: ['quantitative', 'logical', 'verbal'], required: true },
  question: { type: String, required: true },
  options: { type: [String], validate: v => v.length === 4 },
  correctIndex: { type: Number, min: 0, max: 3, required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true }
});

module.exports = mongoose.model('AptitudeQuestion', aptitudeQuestionSchema);
