const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  rollNumber: { type: String, required: true },

  // Phase 1 — Profile (fed to ML model)
  cgpa: { type: Number, min: 0, max: 10 },
  internships: { type: Number, min: 0, max: 10 },
  projects: { type: Number, min: 0, max: 20 },
  workshopsCertifications: { type: Number, min: 0, max: 10 },
  extracurricularActivities: { type: String, enum: ['Yes', 'No'] },
  placementTraining: { type: String, enum: ['Yes', 'No'] },
  sscMarks: { type: Number, min: 0, max: 100 },
  hscMarks: { type: Number, min: 0, max: 100 },

  // Phase 2 — Aptitude
  aptitudeRawScore: Number,
  aptitudeTestScore: Number,
  aptitudeCompletedAt: Date,
  aptitudeQuestionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AptitudeQuestion' }],
  aptitudeAnswers: [Number],  // Store submitted answer indices for review

  // Phase 3 — Coding
  codingQuestionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CodingQuestion' }],
  codingQ1Score: { type: Number, min: 0, max: 10, default: 0 },
  codingQ2Score: { type: Number, min: 0, max: 10, default: 0 },
  codingQ3Score: { type: Number, min: 0, max: 10, default: 0 },
  codingTotalScore: { type: Number, min: 0, max: 30, default: 0 },
  codingCompletedAt: Date,

  // Phase 4 — Communication
  communicationQuestionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CommunicationQuestion' }],
  communicationTranscripts: [String],
  communicationRawScores: [Number],
  softSkillsRating: { type: Number, min: 0, max: 5 },
  communicationCompletedAt: Date,

  // Phase 5 — Results
  mlProbability: Number,        // weighted: 0.80 × ML + 0.20 × CodingFactor
  mlPrediction: String,         // weighted verdict
  mlRawProbability: Number,     // raw ML model probability (before weighting)
  mlRawPrediction: String,      // raw ML model verdict (before weighting)
  geminiFeedbackRaw: String,
  geminiFeedbackParsed: Object,
  predictionCompletedAt: Date,

  // Flow control
  currentPhase: { type: Number, default: 1, min: 1, max: 5 }
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);
