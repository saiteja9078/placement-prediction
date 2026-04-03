const express = require('express');
const router = express.Router();
const CommunicationQuestion = require('../models/CommunicationQuestion');
const Student = require('../models/Student');
const { mapSoftSkillsRating } = require('../utils/scoreMapper');

// ──────────────── Configuration ────────────────
// Priority: Gemini 2.5 Flash → Smart Local
const GEMINI_MODEL = 'gemini-3-flash-preview';

function isEmptyOrInvalid(transcript) {
  if (!transcript) return true;
  const cleaned = transcript.replace(/\[.*?\]/g, '').replace(/[^a-zA-Z0-9\s]/g, ' ').trim();
  return cleaned.split(/\s+/).filter(w => w.length > 0).length < 8;
}

function buildEvalPrompt(transcript, questionPrompt, evaluationCriteria) {
  return `You are a strict communication skills evaluator for campus placement.

QUESTION: """${questionPrompt}"""
STUDENT'S RESPONSE (speech-to-text): """${transcript}"""
CRITERIA: ${evaluationCriteria}

Score 0-100: Clarity(0-25)+Relevance(0-25)+Language(0-25)+Confidence(0-25).
Rules: empty/filler→0-5, off-topic→0-15, partial→20-50, average→40-65, good→65-80, excellent→80-100. Be strict. Minor transcription errors should NOT penalize.

Respond with ONLY valid JSON, no other text:
{"score":<0-100>,"clarity":<0-25>,"relevance":<0-25>,"language":<0-25>,"confidence":<0-25>,"reason":"<one sentence>"}`;
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, rej) => setTimeout(() => rej(new Error('TIMEOUT')), ms))
  ]);
}

function parseEvalJSON(text) {
  const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
  // Try to find JSON object in the response
  const match = cleaned.match(/\{[\s\S]*?"score"[\s\S]*?\}/);
  if (!match) throw new Error('No JSON found in response');
  const parsed = JSON.parse(match[0]);

  let score = parseInt(parsed.score, 10);
  if (isNaN(score) || score < 0) score = 0;
  if (score > 100) score = 100;

  // Cross-validate sub-scores
  const clarity = Math.min(25, Math.max(0, parseInt(parsed.clarity) || 0));
  const relevance = Math.min(25, Math.max(0, parseInt(parsed.relevance) || 0));
  const language = Math.min(25, Math.max(0, parseInt(parsed.language) || 0));
  const confidence = Math.min(25, Math.max(0, parseInt(parsed.confidence) || 0));
  const subTotal = clarity + relevance + language + confidence;
  if (Math.abs(subTotal - score) > 10) score = Math.min(100, Math.max(0, subTotal));

  return { score, clarity, relevance, language, confidence, reason: parsed.reason || '' };
}

// ──── 1. Gemini 2.5 Flash (primary) ────

// ──── 2. Gemini API ────
async function callGemini(prompt) {
  if (!process.env.GEMINI_API_KEY) return null;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`;
    const res = await withTimeout(
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 300 }
        })
      }),
      15000
    );

    if (!res.ok) {
      console.log(`[Gemini] HTTP ${res.status} — ${res.status === 429 ? 'rate limited' : 'error'}`);
      return null;
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return parseEvalJSON(text);
  } catch (err) {
    console.log(`[Gemini] ${err.message === 'TIMEOUT' ? 'Timeout' : err.message?.substring(0, 80)}`);
    return null;
  }
}

// ──── 3. Smart local NLP evaluator (always works) ────
function smartLocalEvaluate(transcript, questionPrompt) {
  const words = transcript.trim().split(/\s+/);
  const wordCount = words.length;
  const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 5);
  const sentenceCount = Math.max(1, sentences.length);
  const avgWPS = wordCount / sentenceCount;
  const uniqueWords = new Set(words.map(w => w.toLowerCase()));
  const vocabRichness = uniqueWords.size / wordCount;

  const promptWords = new Set(questionPrompt.toLowerCase().split(/\s+/).filter(w => w.length > 4));
  let relevantCount = 0;
  words.forEach(w => { if (promptWords.has(w.toLowerCase())) relevantCount++; });
  const relevanceRatio = Math.min(1, relevantCount / Math.max(1, promptWords.size) * 3);

  const fillers = ['um', 'uh', 'like', 'basically', 'actually', 'so', 'well', 'okay', 'ok'];
  const fillerRatio = words.filter(w => fillers.includes(w.toLowerCase())).length / wordCount;

  let clarity = 0;
  if (wordCount >= 10) clarity += 5; if (wordCount >= 30) clarity += 3;
  if (sentenceCount >= 2) clarity += 4; if (sentenceCount >= 4) clarity += 3;
  if (avgWPS >= 5 && avgWPS <= 25) clarity += 5; if (fillerRatio < 0.1) clarity += 5;
  clarity = Math.min(25, clarity);

  let relevance = Math.round(relevanceRatio * 15);
  if (wordCount >= 20) relevance += 3; if (wordCount >= 50) relevance += 4;
  if (sentenceCount >= 3) relevance += 3;
  relevance = Math.min(25, relevance);

  let language = 0;
  if (vocabRichness > 0.3) language += 5; if (vocabRichness > 0.5) language += 5;
  if (vocabRichness > 0.65) language += 5; if (wordCount >= 30) language += 4;
  if (wordCount >= 60) language += 3; if (fillerRatio < 0.05) language += 3;
  language = Math.min(25, language);

  let confidence = 0;
  if (wordCount >= 15) confidence += 5; if (wordCount >= 30) confidence += 5;
  if (wordCount >= 60) confidence += 5; if (wordCount >= 100) confidence += 5;
  if (sentenceCount >= 3) confidence += 5;
  confidence = Math.min(25, confidence);

  const score = clarity + relevance + language + confidence;
  console.log(`[LocalEval] ${wordCount}w → C=${clarity} R=${relevance} L=${language} Co=${confidence} = ${score}`);
  return { score, clarity, relevance, language, confidence, reason: `Local NLP: ${wordCount} words, ${sentenceCount} sentences, ${Math.round(vocabRichness * 100)}% unique vocab`, source: 'local' };
}

// ──── Main evaluator: Gemini 2.5 Flash → Local ────
async function evaluateTranscript(transcript, questionPrompt, evaluationCriteria) {
  if (isEmptyOrInvalid(transcript)) {
    const reason = !transcript?.trim() ? 'No response provided.' : 'Response too short to evaluate.';
    return { score: 0, clarity: 0, relevance: 0, language: 0, confidence: 0, reason, source: 'skip' };
  }

  const prompt = buildEvalPrompt(transcript, questionPrompt, evaluationCriteria);

  // Try 1: Gemini 2.5 Flash
  console.log(`[Eval] Trying Gemini 2.5 Flash...`);
  const geminiResult = await callGemini(prompt);
  if (geminiResult) {
    console.log(`[Eval] ✓ Gemini score=${geminiResult.score}`);
    return { ...geminiResult, source: 'gemini' };
  }

  // Try 2: Smart local NLP evaluator (always works)
  console.log(`[Eval] Gemini unavailable, using local NLP evaluator`);
  return smartLocalEvaluate(transcript, questionPrompt);
}

// ──────────────── Routes ────────────────

router.get('/questions', async (req, res) => {
  try {
    const { studentId } = req.query;
    if (!studentId) return res.json({ questions: await CommunicationQuestion.find().sort('orderIndex') });

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    if (student.currentPhase > 4) {
      return res.json({ alreadyCompleted: true, softSkillsRating: student.softSkillsRating, rawScores: student.communicationRawScores, questions: [] });
    }

    if (student.communicationQuestionIds?.length === 3) {
      const questions = await CommunicationQuestion.find({ _id: { $in: student.communicationQuestionIds } });
      const order = { scenario: 1, read_comprehension: 2, personal: 3 };
      questions.sort((a, b) => (order[a.type] || 0) - (order[b.type] || 0));
      return res.json({ questions });
    }

    const [scenario] = await CommunicationQuestion.aggregate([{ $match: { type: 'scenario' } }, { $sample: { size: 1 } }]);
    const [comprehension] = await CommunicationQuestion.aggregate([{ $match: { type: 'read_comprehension' } }, { $sample: { size: 1 } }]);
    const [personal] = await CommunicationQuestion.aggregate([{ $match: { type: 'personal' } }, { $sample: { size: 1 } }]);
    if (!scenario || !comprehension || !personal) return res.status(500).json({ error: 'Not enough questions.' });

    const qIds = [scenario._id, comprehension._id, personal._id];
    await Student.findByIdAndUpdate(studentId, { communicationQuestionIds: qIds });
    res.json({ questions: [scenario, comprehension, personal] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/evaluate', async (req, res) => {
  try {
    const { studentId, transcripts } = req.body;
    if (!studentId || !transcripts || transcripts.length !== 3) return res.status(400).json({ error: 'Need studentId + 3 transcripts' });

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    if (student.currentPhase > 4) return res.json({ alreadyCompleted: true, rawScores: student.communicationRawScores, softSkillsRating: student.softSkillsRating });

    const qIds = student.communicationQuestionIds || [];
    let questions = qIds.length === 3
      ? await CommunicationQuestion.find({ _id: { $in: qIds } })
      : await CommunicationQuestion.find().sort('orderIndex').limit(3);
    const order = { scenario: 1, read_comprehension: 2, personal: 3 };
    questions.sort((a, b) => (order[a.type] || 0) - (order[b.type] || 0));

    const rawScores = [];
    const evaluations = [];

    for (let i = 0; i < 3; i++) {
      if (i > 0) await new Promise(r => setTimeout(r, 2000));
      console.log(`\n[Comm] ── Q${i + 1} (${questions[i]?.type}) ──`);
      console.log(`[Comm] Transcript (${(transcripts[i] || '').split(/\s+/).length} words): "${(transcripts[i] || '').substring(0, 150)}"`);

      const ev = await evaluateTranscript(transcripts[i], questions[i].prompt, questions[i].evaluationCriteria);
      rawScores.push(ev.score);
      evaluations.push(ev);
    }

    const avgRaw = Math.round(rawScores.reduce((a, b) => a + b, 0) / rawScores.length);
    const softSkillsRating = mapSoftSkillsRating(avgRaw);

    await Student.findByIdAndUpdate(studentId, {
      communicationTranscripts: transcripts,
      communicationRawScores: rawScores,
      softSkillsRating,
      communicationCompletedAt: new Date(),
      currentPhase: 5
    });

    const sources = evaluations.map(e => e.source).join(',');
    console.log(`[Comm] ✓ ${studentId}: [${rawScores}] avg=${avgRaw} → ${softSkillsRating}/4.8 (via: ${sources})`);
    res.json({ rawScores, evaluations, avgRaw, softSkillsRating });
  } catch (err) {
    console.error('Comm error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
