const express = require('express');
const router = express.Router();
const CodingQuestion = require('../models/CodingQuestion');
const CodingSubmission = require('../models/CodingSubmission');
const Student = require('../models/Student');
const { runAgainstTestCases } = require('../utils/judge0');

// In-memory cache for student's assigned 3 questions
const studentCodingCache = new Map();

// GET /api/coding/questions?studentId=xxx — pick 3 random (1 Easy, 1 Medium, 1 Hard)
router.get('/questions', async (req, res) => {
  try {
    const { studentId } = req.query;

    // If no studentId, return all (legacy support)
    if (!studentId) {
      const questions = await CodingQuestion.find()
        .select('-hiddenTestCases')
        .sort('orderIndex')
        .limit(3);
      return res.json({ questions });
    }

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    // If coding already completed, return completed status
    if (student.currentPhase > 3) {
      return res.json({
        alreadyCompleted: true,
        codingTotalScore: student.codingTotalScore,
        q1: student.codingQ1Score,
        q2: student.codingQ2Score,
        q3: student.codingQ3Score,
        questions: []
      });
    }

    // If student already has assigned questions in DB, return those
    if (student.codingQuestionIds && student.codingQuestionIds.length === 3) {
      const questions = await CodingQuestion.find({ _id: { $in: student.codingQuestionIds } })
        .select('-hiddenTestCases');

      // Assign local orderIndex 1,2,3 based on difficulty
      const sorted = sortByDifficulty(questions);
      return res.json({ questions: sorted });
    }

    // Check cache
    if (studentCodingCache.has(studentId)) {
      const cached = studentCodingCache.get(studentId);
      const questions = await CodingQuestion.find({ _id: { $in: cached } })
        .select('-hiddenTestCases');
      const sorted = sortByDifficulty(questions);
      return res.json({ questions: sorted });
    }

    // Pick 1 Easy, 1 Medium, 1 Hard randomly
    const [easy] = await CodingQuestion.aggregate([
      { $match: { difficulty: 'Easy' } },
      { $sample: { size: 1 } }
    ]);
    const [medium] = await CodingQuestion.aggregate([
      { $match: { difficulty: 'Medium' } },
      { $sample: { size: 1 } }
    ]);
    const [hard] = await CodingQuestion.aggregate([
      { $match: { difficulty: 'Hard' } },
      { $sample: { size: 1 } }
    ]);

    if (!easy || !medium || !hard) {
      return res.status(500).json({ error: 'Not enough coding questions in database. Run seed first.' });
    }

    const questionIds = [easy._id, medium._id, hard._id];

    // Save assignment to student record and cache
    await Student.findByIdAndUpdate(studentId, { codingQuestionIds: questionIds });
    studentCodingCache.set(studentId, questionIds);

    // Return without hidden test cases, with orderIndex assigned 1,2,3
    const questions = [easy, medium, hard].map((q, i) => ({
      _id: q._id,
      orderIndex: i + 1,
      title: q.title,
      difficulty: q.difficulty,
      description: q.description,
      examples: q.examples,
      constraints: q.constraints,
      starterCode: q.starterCode,
      publicTestCases: q.publicTestCases,
      timeLimit: q.timeLimit,
      memoryLimit: q.memoryLimit
    }));

    res.json({ questions });
  } catch (err) {
    console.error('Coding questions error:', err);
    res.status(500).json({ error: err.message });
  }
});

function sortByDifficulty(questions) {
  const order = { Easy: 1, Medium: 2, Hard: 3 };
  return questions
    .map((q, i) => {
      const obj = q.toObject ? q.toObject() : q;
      obj.orderIndex = order[obj.difficulty] || (i + 1);
      return obj;
    })
    .sort((a, b) => a.orderIndex - b.orderIndex);
}

// POST /api/coding/run — run against public test cases only
router.post('/run', async (req, res) => {
  try {
    const { studentId, questionId, questionNumber, code, language } = req.body;

    // Find question by ID or by orderIndex from assigned questions
    let question;
    if (questionId) {
      question = await CodingQuestion.findById(questionId);
    } else if (questionNumber) {
      // Legacy: find by position in student's assigned questions
      const student = await Student.findById(studentId);
      if (student && student.codingQuestionIds && student.codingQuestionIds.length >= questionNumber) {
        question = await CodingQuestion.findById(student.codingQuestionIds[questionNumber - 1]);
      }
      if (!question) {
        question = await CodingQuestion.findOne({ orderIndex: questionNumber });
      }
    }

    if (!question) return res.status(404).json({ error: 'Question not found' });

    const result = await runAgainstTestCases(code, language, question.publicTestCases);

    // Save as non-finalized submission
    await CodingSubmission.create({
      studentId,
      questionId: question._id,
      questionNumber: questionNumber || 1,
      questionTitle: question.title,
      language,
      code,
      testcasesPassed: result.passed,
      testcasesTotal: result.total,
      score: 0,
      isFinalized: false
    });

    res.json({
      passed: result.passed,
      total: result.total,
      results: result.results
    });
  } catch (err) {
    console.error('Code run error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/coding/submit — run against hidden test cases, score
router.post('/submit', async (req, res) => {
  try {
    const { studentId, questionId, questionNumber, code, language } = req.body;

    // Find question
    let question;
    if (questionId) {
      question = await CodingQuestion.findById(questionId);
    } else if (questionNumber) {
      const student = await Student.findById(studentId);
      if (student && student.codingQuestionIds && student.codingQuestionIds.length >= questionNumber) {
        question = await CodingQuestion.findById(student.codingQuestionIds[questionNumber - 1]);
      }
      if (!question) {
        question = await CodingQuestion.findOne({ orderIndex: questionNumber });
      }
    }

    if (!question) return res.status(404).json({ error: 'Question not found' });

    // Check if already submitted this question
    const qNum = questionNumber || 1;
    const existing = await CodingSubmission.findOne({
      studentId,
      $or: [
        { questionId: question._id, isFinalized: true },
        { questionNumber: qNum, isFinalized: true }
      ]
    });
    if (existing) {
      return res.status(400).json({
        error: 'Already submitted this question',
        alreadySubmitted: true,
        score: existing.score
      });
    }

    const result = await runAgainstTestCases(code, language, question.hiddenTestCases);
    const score = Math.round((result.passed / result.total) * 10);

    // Save finalized submission
    await CodingSubmission.create({
      studentId,
      questionId: question._id,
      questionNumber: qNum,
      questionTitle: question.title,
      language,
      code,
      testcasesPassed: result.passed,
      testcasesTotal: result.total,
      score,
      isFinalized: true
    });

    // Update student's score for this question (Q1=Easy, Q2=Medium, Q3=Hard)
    const scoreField = `codingQ${qNum}Score`;
    await Student.findByIdAndUpdate(studentId, { [scoreField]: score });
    console.log(`[Coding] Student ${studentId}: Q${qNum} (${question.title}) score=${score}/10 → saved to DB`);

    res.json({
      score,
      passed: result.passed,
      total: result.total,
      results: result.results
    });
  } catch (err) {
    console.error('Code submit error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/coding/finalize — sum all question scores
router.post('/finalize', async (req, res) => {
  try {
    const { studentId } = req.body;
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    // Block re-finalization
    if (student.currentPhase > 3) {
      return res.status(400).json({
        error: 'Coding exam already finalized',
        alreadyCompleted: true,
        codingTotalScore: student.codingTotalScore,
        q1: student.codingQ1Score,
        q2: student.codingQ2Score,
        q3: student.codingQ3Score
      });
    }

    const codingTotalScore = student.codingQ1Score + student.codingQ2Score + student.codingQ3Score;

    await Student.findByIdAndUpdate(studentId, {
      codingTotalScore,
      codingCompletedAt: new Date(),
      currentPhase: 4
    });
    console.log(`[Coding] Student ${studentId}: Total=${codingTotalScore}/30 (Q1:${student.codingQ1Score} Q2:${student.codingQ2Score} Q3:${student.codingQ3Score}) → saved to DB, phase→4`);

    res.json({
      codingTotalScore,
      q1: student.codingQ1Score,
      q2: student.codingQ2Score,
      q3: student.codingQ3Score
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
