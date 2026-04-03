const express = require('express');
const router = express.Router();
const AptitudeQuestion = require('../models/AptitudeQuestion');
const Student = require('../models/Student');
const { mapAptitudeScore } = require('../utils/scoreMapper');

// In-memory store for student's assigned questions (session-based)
const studentQuestionCache = new Map();

// GET /api/aptitude/questions?studentId=xxx
router.get('/questions', async (req, res) => {
  try {
    const { studentId } = req.query;
    if (!studentId) return res.status(400).json({ error: 'studentId required' });

    // Block if already completed aptitude
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    if (student.currentPhase > 2) {
      return res.status(400).json({
        error: 'Aptitude test already completed',
        alreadyCompleted: true,
        result: {
          correct: student.aptitudeRawScore,
          mappedScore: student.aptitudeTestScore,
          total: 20
        }
      });
    }

    // Check if student already has cached questions
    if (studentQuestionCache.has(studentId)) {
      const cached = studentQuestionCache.get(studentId);
      return res.json({ questions: cached.questions, total: cached.questions.length });
    }

    // Randomly pick 20 questions from 100 in DB
    const allQuestions = await AptitudeQuestion.aggregate([{ $sample: { size: 20 } }]);

    // Cache the full questions (with correctIndex) on server
    studentQuestionCache.set(studentId, {
      questions: allQuestions.map(q => ({
        _id: q._id,
        category: q.category,
        question: q.question,
        options: q.options,
        difficulty: q.difficulty
      })),
      fullQuestions: allQuestions
    });

    // Strip correctIndex before sending to client
    const clientQuestions = allQuestions.map(({ _id, category, question, options, difficulty }) => ({
      _id, category, question, options, difficulty
    }));

    res.json({ questions: clientQuestions, total: clientQuestions.length });
  } catch (err) {
    console.error('Aptitude questions error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/aptitude/result?studentId=xxx — fetch completed scores only (for back-navigation)
router.get('/result', async (req, res) => {
  try {
    const { studentId } = req.query;
    if (!studentId) return res.status(400).json({ error: 'studentId required' });

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    if (student.currentPhase < 3) {
      return res.status(400).json({ error: 'Aptitude test not yet completed' });
    }

    res.json({
      completed: true,
      correct: student.aptitudeRawScore,
      mappedScore: student.aptitudeTestScore,
      total: 20,
      completedAt: student.aptitudeCompletedAt
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/aptitude/submit
router.post('/submit', async (req, res) => {
  try {
    const { studentId } = req.body;
    let { answers } = req.body;

    // Handle both array format [0,1,2,...] and object format {0: 1, 1: 3, ...}
    if (answers && !Array.isArray(answers)) {
      // Convert object { questionId: answerIndex } to array
      const keys = Object.keys(answers);
      if (keys.length > 0) {
        answers = Array.from({ length: 20 }, (_, i) => answers[i] ?? answers[keys[i]] ?? -1);
      }
    }

    if (!studentId || !answers || answers.length !== 20) {
      return res.status(400).json({ error: 'studentId and 20 answers required' });
    }

    // Block re-submission
    const student = await Student.findById(studentId);
    if (student && student.currentPhase > 2) {
      return res.status(400).json({
        error: 'Aptitude test already submitted',
        alreadyCompleted: true,
        result: {
          correct: student.aptitudeRawScore,
          mappedScore: student.aptitudeTestScore,
          total: 20
        }
      });
    }

    const cached = studentQuestionCache.get(studentId);
    if (!cached) {
      return res.status(400).json({ error: 'No questions found for this student. Please fetch questions first.' });
    }

    // Score the answers
    let correct = 0;
    const fullQuestions = cached.fullQuestions;
    for (let i = 0; i < 20; i++) {
      if (answers[i] === fullQuestions[i].correctIndex) {
        correct++;
      }
    }

    const mappedScore = mapAptitudeScore(correct);

    // Update student — store scores + answers in DB
    await Student.findByIdAndUpdate(studentId, {
      aptitudeRawScore: correct,
      aptitudeTestScore: mappedScore,
      aptitudeCompletedAt: new Date(),
      aptitudeQuestionIds: fullQuestions.map(q => q._id),
      aptitudeAnswers: answers,
      currentPhase: 3
    });

    console.log(`[Aptitude] Student ${studentId}: ${correct}/20 correct → mapped ${mappedScore}/90 → saved to DB`);

    // Clean up cache
    studentQuestionCache.delete(studentId);

    res.json({
      rawScore: correct,
      aptitudeTestScore: mappedScore,
      mappedScore,
      correct,
      total: 20
    });
  } catch (err) {
    console.error('Aptitude submit error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
