const mongoose = require('mongoose');

const communicationQuestionSchema = new mongoose.Schema({
  orderIndex: { type: Number, required: true },
  type: { type: String, enum: ['scenario', 'read_comprehension', 'personal'], required: true },
  prompt: { type: String, required: true },
  evaluationCriteria: { type: String, required: true },
  speakingTimeSeconds: { type: Number, default: 30 }
});

module.exports = mongoose.model('CommunicationQuestion', communicationQuestionSchema);
