const express = require('express');
const router = express.Router();
const http = require('http');
const Student = require('../models/Student');
const { buildMLFeatureVector } = require('../utils/scoreMapper');
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function generateFeedback(student, mlProbability, mlPrediction, weightedProbability, codingFactor) {
  const prompt = `You are an expert placement counselor and career advisor at a top engineering college. A student completed a comprehensive placement readiness evaluation. Analyze ALL their data deeply and generate an extremely detailed, personalized career guidance report.

## COMPLETE STUDENT DATA (analyze every single field)

### Academic Performance
- CGPA: ${student.cgpa}/9.1 (placed students avg: 8.02, not-placed avg: 7.47)
- SSC (10th): ${student.sscMarks}% (placed avg: 74.92%, not-placed avg: 64.99%)
- HSC (12th): ${student.hscMarks}% (placed avg: 79.81%, not-placed avg: 70.67%)

### Experience & Activities
- Internships: ${student.internships} (placed avg: 1.25, not-placed avg: 0.90)
- Projects: ${student.projects} (placed avg: 2.51, not-placed avg: 2.13)
- Workshops/Certifications: ${student.workshopsCertifications} (placed avg: 1.40)
- Extracurricular Activities: ${student.extracurricularActivities} (86% of placed students say Yes)
- Placement Training: ${student.placementTraining} (90% of placed students say Yes)

### Aptitude Performance
- Raw Score: ${student.aptitudeRawScore}/20 correct answers
- Mapped Score: ${student.aptitudeTestScore}/90 (placed avg: 84.46, not-placed avg: 75.83)

### Coding Performance (3 questions: Easy, Medium, Hard)
- Q1 (Easy): ${student.codingQ1Score}/10
- Q2 (Medium): ${student.codingQ2Score}/10
- Q3 (Hard): ${student.codingQ3Score}/10
- Total Coding Score: ${student.codingTotalScore}/30 (placed avg: 21, not-placed avg: 11)
- Coding difficulty pattern: ${student.codingQ1Score >= 7 ? 'Good' : 'Weak'} on Easy, ${student.codingQ2Score >= 5 ? 'Good' : 'Weak'} on Medium, ${student.codingQ3Score >= 3 ? 'Good' : 'Weak'} on Hard

### Communication & Soft Skills
- AI-Evaluated Rating: ${student.softSkillsRating}/4.8 (placed avg: 4.53, not-placed avg: 4.17)
- Raw Communication Scores: ${JSON.stringify(student.communicationRawScores || [])}

### ML Prediction Results
- Raw ML Model Probability: ${(mlProbability * 100).toFixed(1)}%
- Weighted Probability (80% ML + 20% Coding): ${(weightedProbability * 100).toFixed(1)}%
- Coding Factor: ${(codingFactor * 100).toFixed(1)}%
- Final Verdict: ${mlPrediction}

## INSTRUCTIONS
Analyze EVERY data point above. Compare each metric against placed/not-placed averages. Identify patterns, blind spots, and hidden weaknesses. Be brutally honest but constructive.

CRITICAL: Return ONLY valid JSON. No text before or after. No markdown. No explanations. No trailing commas.
{
  "overallSummary": "<3-4 sentences with specific numbers comparing student to placed averages>",
  "prediction": {"probability": ${(weightedProbability * 100).toFixed(1)}, "verdict": "${mlPrediction}", "verdictExplanation": "<2-3 sentences explaining WHY this verdict, citing specific weak/strong areas>"},
  "strengths": ["<strength 1 with exact score and comparison>", "<strength 2>", "<strength 3>", "<strength 4>"],
  "blindSpots": [
    {"area": "<hidden weakness name>", "details": "<why this is a blind spot the student may not realize>", "impact": "<how this affects placement chances>", "fix": "<specific actionable fix>"},
    {"area": "<another blind spot>", "details": "<details>", "impact": "<impact>", "fix": "<fix>"}
  ],
  "skillGapAnalysis": [
    {"skill": "<skill name>", "currentLevel": "<score>", "requiredLevel": "<placed avg>", "gapPercentage": <number>, "priority": "<Critical/High/Medium/Low>", "resources": ["<specific course/platform>", "<another resource>"]},
    {"skill": "<skill 2>", "currentLevel": "<score>", "requiredLevel": "<target>", "gapPercentage": <number>, "priority": "<priority>", "resources": ["<resource>"]}
  ],
  "areasOfImprovement": [
    {"area": "<name>", "currentStatus": "<score>", "target": "<placed avg>", "gap": "<difference>", "actionPlan": "<detailed 3-step plan>"}
  ],
  "codingFeedback": {
    "overall": "<detailed analysis of ${student.codingTotalScore}/30 total score>",
    "easyAnalysis": "<Q1 ${student.codingQ1Score}/10 - what this reveals about fundamentals>",
    "mediumAnalysis": "<Q2 ${student.codingQ2Score}/10 - what this reveals about problem-solving>",
    "hardAnalysis": "<Q3 ${student.codingQ3Score}/10 - what this reveals about advanced skills>",
    "pattern": "<what the Easy→Medium→Hard score pattern reveals about the student>",
    "topicsToFocus": ["<specific DSA topic 1>", "<topic 2>", "<topic 3>"],
    "practiceRecommendation": "<specific daily practice plan with platforms>"
  },
  "communicationFeedback": {
    "overall": "<detailed analysis of ${student.softSkillsRating}/4.8>",
    "interviewReadiness": "<how ready for HR/technical interviews>",
    "improvementTips": ["<tip 1>", "<tip 2>", "<tip 3>"]
  },
  "aptitudeFeedback": {
    "overall": "<analysis of ${student.aptitudeTestScore}/90>",
    "accuracy": "<${student.aptitudeRawScore}/20 = ${((student.aptitudeRawScore/20)*100).toFixed(0)}% accuracy analysis>",
    "weakAreas": ["<likely weak aptitude area 1>", "<area 2>"],
    "resources": ["<aptitude prep resource 1>", "<resource 2>"]
  },
  "academicFeedback": {
    "cgpaAnalysis": "<CGPA ${student.cgpa} vs placed avg 8.02 analysis>",
    "trend": "<SSC ${student.sscMarks}% → HSC ${student.hscMarks}% → CGPA ${student.cgpa} trend analysis>",
    "impact": "<how academics affect placement chances>"
  },
  "careerGuidance": {
    "recommendedPaths": ["<career path 1 based on strengths>", "<path 2>", "<path 3>"],
    "companyTier": "<Tier 1 (FAANG)/Tier 2 (MNCs)/Tier 3 (startups) recommendation with reasoning>",
    "roleRecommendations": ["<suitable role 1>", "<role 2>"],
    "industryFit": "<which industry sectors suit this profile>"
  },
  "interviewPrep": {
    "readinessScore": <number 1-10>,
    "technicalTips": ["<tip 1>", "<tip 2>"],
    "hrTips": ["<tip 1>", "<tip 2>"],
    "commonMistakesToAvoid": ["<mistake 1>", "<mistake 2>"]
  },
  "riskFactors": [
    {"risk": "<risk description>", "severity": "<High/Medium/Low>", "mitigation": "<how to address>"}
  ],
  "competitiveAdvantage": {
    "uniqueStrengths": "<what makes this student stand out>",
    "differentiators": ["<differentiator 1>", "<differentiator 2>"]
  },
  "thirtyDayPlan": [
    {"week": 1, "focus": "<Week 1 focus area>", "tasks": ["<task 1>", "<task 2>", "<task 3>"], "dailyHours": <number>},
    {"week": 2, "focus": "<focus>", "tasks": ["<task>"], "dailyHours": <number>},
    {"week": 3, "focus": "<focus>", "tasks": ["<task>"], "dailyHours": <number>},
    {"week": 4, "focus": "<focus>", "tasks": ["<task>"], "dailyHours": <number>}
  ],
  "motivationalClose": "<3-4 personalized, encouraging sentences>"
}`;

  // ── JSON repair for llama3:8b (often produces trailing commas, truncated output) ──
  function repairJSON(text) {
    let s = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
    // Extract the outermost JSON object
    const start = s.indexOf('{');
    if (start === -1) return null;
    s = s.substring(start);

    // Fix trailing commas before } or ]
    s = s.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
    // Replace literal newlines that aren't part of JSON structure
    s = s.replace(/\r?\n/g, ' ');

    // Try parsing as-is first
    try { return JSON.parse(s); } catch(e) { /* continue repairing */ }

    // Close unclosed brackets/braces
    let braces = 0, brackets = 0, inStr = false, esc = false;
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (esc) { esc = false; continue; }
      if (c === '\\') { esc = true; continue; }
      if (c === '"') { inStr = !inStr; continue; }
      if (inStr) continue;
      if (c === '{') braces++;
      if (c === '}') braces--;
      if (c === '[') brackets++;
      if (c === ']') brackets--;
    }
    // If we're inside a string, close it
    if (inStr) s += '"';
    // Close any trailing commas again after string closure
    s = s.replace(/,\s*$/g, '');
    // Add missing closing brackets/braces
    while (brackets > 0) { s += ']'; brackets--; }
    while (braces > 0) { s += '}'; braces--; }
    // One more trailing comma fix
    s = s.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');

    try { return JSON.parse(s); } catch(e) {
      console.log(`[Feedback] JSON repair failed: ${e.message?.substring(0, 60)}`);
      return null;
    }
  }

  // Try: Gemini 2.5 Flash
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-04-17' });
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        if (attempt > 0) await new Promise(r => setTimeout(r, 4000 * attempt));
        const result = await model.generateContent(prompt);
        const text = result.response.text().trim().replace(/```json|```/g, '');
        console.log('[Feedback] ✓ Generated via Gemini 2.5 Flash');
        const parsed = repairJSON(text);
        if (parsed) return parsed;
        return JSON.parse(text);
      } catch (err) {
        if (attempt < 2 && (err.status === 429 || err.message?.includes('429'))) continue;
        throw err;
      }
    }
  } catch (e) {
    console.log(`[Feedback] Gemini unavailable: ${e.message?.substring(0, 60)}`);
  }

  // Fallback: return null — predict.js will handle
  console.log('[Feedback] Gemini 2.5 Flash unavailable');
  return null;
}

// ── Helper: build full response object from student data ──
function buildResponse(student, prediction, feedback, scoreBreakdown) {
  return {
    student: {
      name: student.name,
      email: student.email,
      cgpa: student.cgpa,
      internships: student.internships,
      projects: student.projects,
      workshopsCertifications: student.workshopsCertifications,
      extracurricularActivities: student.extracurricularActivities,
      placementTraining: student.placementTraining,
      sscMarks: student.sscMarks,
      hscMarks: student.hscMarks,
      aptitudeRawScore: student.aptitudeRawScore,
      aptitudeTestScore: student.aptitudeTestScore,
      codingQ1Score: student.codingQ1Score,
      codingQ2Score: student.codingQ2Score,
      codingQ3Score: student.codingQ3Score,
      codingTotalScore: student.codingTotalScore,
      softSkillsRating: student.softSkillsRating,
      communicationRawScores: student.communicationRawScores
    },
    prediction,
    geminiFeedback: feedback,
    scoreBreakdown: scoreBreakdown || {
      aptitude: {
        raw: student.aptitudeRawScore,
        mapped: student.aptitudeTestScore,
        outOf: 90,
        placedAvg: 84.46
      },
      coding: {
        q1: student.codingQ1Score,
        q2: student.codingQ2Score,
        q3: student.codingQ3Score,
        total: student.codingTotalScore,
        outOf: 30,
        placedAvg: 21
      },
      communication: {
        rawScores: student.communicationRawScores,
        avg: student.communicationRawScores ? Math.round(student.communicationRawScores.reduce((a, b) => a + b, 0) / student.communicationRawScores.length) : 0,
        mapped: student.softSkillsRating,
        outOf: 4.8,
        placedAvg: 4.53
      },
      academic: {
        cgpa: student.cgpa,
        ssc: student.sscMarks,
        hsc: student.hscMarks,
        cgpaPlacedAvg: 8.02
      }
    }
  };
}

// ── GET /api/predict/:studentId — Fetch stored results (for persistence across reloads) ──
router.get('/:studentId', async (req, res) => {
  try {
    const student = await Student.findById(req.params.studentId);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    // Check if prediction has been done
    if (student.mlProbability == null || student.predictionCompletedAt == null) {
      return res.status(404).json({ error: 'No prediction found for this student', needsPrediction: true });
    }

    const prediction = {
      probability: student.mlProbability,
      prediction: student.mlPrediction,
      rawProbability: student.mlRawProbability,
      rawPrediction: student.mlRawPrediction,
      confidence: parseFloat(Math.max(student.mlProbability, 1 - student.mlProbability).toFixed(4)),
      source: 'stored'
    };

    const response = buildResponse(student, prediction, student.geminiFeedbackParsed);
    response.predictionCompletedAt = student.predictionCompletedAt;
    response.fromCache = true;

    console.log(`[Predict] GET: Returning stored results for student ${req.params.studentId} (prob=${student.mlProbability})`);
    res.json(response);
  } catch (err) {
    console.error('Get prediction error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/predict/:studentId — Run prediction + generate feedback ──
router.post('/:studentId', async (req, res) => {
  try {
    const student = await Student.findById(req.params.studentId);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    // Build feature vector — 11 features including CodingScore
    const features = buildMLFeatureVector(student);
    console.log(`[Predict] Student ${req.params.studentId} DB scores: aptitude=${student.aptitudeTestScore}, coding=${student.codingTotalScore} (Q1:${student.codingQ1Score} Q2:${student.codingQ2Score} Q3:${student.codingQ3Score}), softSkills=${student.softSkillsRating}`);
    console.log(`[Predict] ML features:`, JSON.stringify(features));

    // ─── Fallback ML predictor (pure Node.js, no Flask needed) ───
    function fallbackMLPredict(f) {
      // Weighted scoring calibrated to the training dataset
      const weights = {
        CGPA:         { weight: 0.15, min: 6.5, max: 9.1 },
        Internships:  { weight: 0.08, min: 0,   max: 2   },
        Projects:     { weight: 0.10, min: 0,   max: 3   },
        'Workshops/Certifications': { weight: 0.05, min: 0, max: 3 },
        AptitudeTestScore: { weight: 0.15, min: 60, max: 90 },
        SoftSkillsRating:  { weight: 0.10, min: 3.0, max: 4.8 },
        SSC_Marks:    { weight: 0.05, min: 55,  max: 90  },
        HSC_Marks:    { weight: 0.05, min: 57,  max: 88  },
        CodingScore:  { weight: 0.17, min: 0,   max: 30  },
      };
      const binaryBonus = {
        ExtracurricularActivities: 0.05,
        PlacementTraining: 0.05,
      };

      let score = 0;
      for (const [key, cfg] of Object.entries(weights)) {
        const raw = Number(f[key]) || 0;
        const normalized = Math.min(1, Math.max(0, (raw - cfg.min) / (cfg.max - cfg.min)));
        score += normalized * cfg.weight;
      }
      for (const [key, w] of Object.entries(binaryBonus)) {
        if (f[key] === 'Yes' || f[key] === 1) score += w;
      }

      const probability = Math.min(0.98, Math.max(0.02, score));
      const prediction = probability >= 0.5 ? 'Placed' : 'NotPlaced';
      return {
        probability: parseFloat(probability.toFixed(4)),
        prediction,
        confidence: parseFloat(Math.max(probability, 1 - probability).toFixed(4)),
        source: 'fallback'
      };
    }

    // Call Flask ML service, fall back to local predictor
    let mlResult;
    try {
      mlResult = await new Promise(async (resolve, reject) => {
        try {
          const flaskUrl = process.env.FLASK_ML_URL || 'http://localhost:5001';
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 10000);
          const flaskRes = await fetch(`${flaskUrl}/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(features),
            signal: controller.signal
          });
          clearTimeout(timeout);
          if (!flaskRes.ok) throw new Error(`Flask HTTP ${flaskRes.status}`);
          const parsed = await flaskRes.json();
          parsed.source = 'flask';
          resolve(parsed);
        } catch(e) { reject(e); }
      });
    } catch (flaskErr) {
      console.error('Flask ML service unavailable, using fallback predictor:', flaskErr.message);
      mlResult = fallbackMLPredict(features);
    }

    // ─── 80/20 Weighted Prediction ───
    const codingFactor = (student.codingTotalScore || 0) / 30;
    const rawMlProbability = mlResult.probability;
    const weightedProbability = parseFloat((0.80 * rawMlProbability + 0.20 * codingFactor).toFixed(4));
    const weightedPrediction = weightedProbability >= 0.5 ? 'Placed' : 'NotPlaced';

    console.log(`[Predict] 80/20 Weighting: ML_prob=${rawMlProbability} × 0.80 = ${(0.80 * rawMlProbability).toFixed(4)}, CodingFactor=${codingFactor.toFixed(4)} × 0.20 = ${(0.20 * codingFactor).toFixed(4)} → weighted=${weightedProbability} → ${weightedPrediction}`);

    mlResult.rawProbability = rawMlProbability;
    mlResult.rawPrediction = mlResult.prediction;
    mlResult.probability = weightedProbability;
    mlResult.prediction = weightedPrediction;
    mlResult.confidence = parseFloat(Math.max(weightedProbability, 1 - weightedProbability).toFixed(4));
    mlResult.codingFactor = parseFloat(codingFactor.toFixed(4));
    mlResult.weightingFormula = '0.80 × ML + 0.20 × CodingScore';

    // Generate AI feedback (Gemini 2.5 Flash → null)
    let geminiFeedback = null;
    let geminiFeedbackRaw = null;
    try {
      geminiFeedback = await generateFeedback(student, rawMlProbability, mlResult.prediction, weightedProbability, codingFactor);
    } catch (geminiErr) {
      console.error('Feedback error:', geminiErr);
      geminiFeedbackRaw = geminiErr.message || 'Feedback generation failed';
    }

    // Save ALL results to DB for persistence
    await Student.findByIdAndUpdate(req.params.studentId, {
      mlProbability: mlResult.probability,
      mlPrediction: mlResult.prediction,
      mlRawProbability: mlResult.rawProbability,
      mlRawPrediction: mlResult.rawPrediction,
      geminiFeedbackRaw: geminiFeedbackRaw || JSON.stringify(geminiFeedback),
      geminiFeedbackParsed: geminiFeedback,
      predictionCompletedAt: new Date()
    });

    console.log(`[Predict] ✓ Saved all results to DB for student ${req.params.studentId}`);

    const response = buildResponse(student, mlResult, geminiFeedback);
    response.predictionCompletedAt = new Date();
    response.fromCache = false;

    res.json(response);
  } catch (err) {
    console.error('Predict error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
