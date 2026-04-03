const http = require('http');

function req(path, method, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : '';
    const r = http.request({
      hostname: 'localhost', port: 5000, path, method,
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => { try { resolve({ s: res.statusCode, d: JSON.parse(b) }); } catch(e) { resolve({ s: res.statusCode, d: b }); } });
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

async function main() {
  const ts = Date.now();

  // 1. Register
  console.log('1. REGISTER');
  const reg = await req('/api/students/register', 'POST', {
    name: 'Final Test', email: `ft${ts}@t.com`, rollNumber: `FT${ts}`, branch: 'CSE',
    cgpa: 8.5, sscMarks: 85, hscMarks: 85, internships: 1, projects: 2,
    workshopsCertifications: 1, softSkillsRating: 4.0,
    extracurricularActivities: 'Yes', placementTraining: 'Yes'
  });
  const sid = reg.d.student?._id || reg.d.studentId;
  console.log(`   Status: ${reg.s} | ID: ${sid}`);

  // 2. Skip aptitude (set phase to 2 via direct aptitude submit)
  console.log('\n2. APTITUDE (submitting with dummy answers)');
  const aptQ = await req(`/api/aptitude/questions?studentId=${sid}`, 'GET');
  console.log(`   Questions: ${aptQ.d.questions?.length}`);
  if (aptQ.d.questions?.length) {
    const answers = {};
    aptQ.d.questions.forEach(q => { answers[q._id] = q.options?.[0] || 'A'; });
    const aptSub = await req('/api/aptitude/submit', 'POST', { studentId: sid, answers });
    console.log(`   Aptitude Score: ${aptSub.d.aptitudeTestScore}/90 (raw: ${aptSub.d.rawCorrect}/20)`);
  }

  // 3. Coding - Run
  console.log('\n3. CODING RUN');
  const code = `import sys\ninput_data = sys.stdin.read().split()\nn = int(input_data[0])\nnums = list(map(int, input_data[1:n+1]))\ntarget = int(input_data[n+1])\nseen = {}\nfor i, num in enumerate(nums):\n    comp = target - num\n    if comp in seen:\n        print(seen[comp], i)\n        break\n    seen[num] = i`;
  const run = await req('/api/coding/run', 'POST', { studentId: sid, questionNumber: 1, code, language: 'python' });
  console.log(`   Run: ${run.d.passed}/${run.d.total} passed`);

  // 4. Coding - Submit all 3
  console.log('\n4. CODING SUBMIT (all 3 questions)');
  const sub1 = await req('/api/coding/submit', 'POST', { studentId: sid, questionNumber: 1, code, language: 'python' });
  console.log(`   Q1: Score ${sub1.d.score}/10 (${sub1.d.passed}/${sub1.d.total})`);

  const code2 = `import sys\ndef solve(s):\n    seen = {}\n    l = ans = 0\n    for r, c in enumerate(s):\n        if c in seen and seen[c] >= l:\n            l = seen[c] + 1\n        seen[c] = r\n        ans = max(ans, r - l + 1)\n    return ans\nprint(solve(sys.stdin.readline().strip()))`;
  const sub2 = await req('/api/coding/submit', 'POST', { studentId: sid, questionNumber: 2, code: code2, language: 'python' });
  console.log(`   Q2: Score ${sub2.d.score}/10 (${sub2.d.passed}/${sub2.d.total})`);

  const code3 = `import sys\ndef coinChange(coins, amount):\n    dp = [float('inf')] * (amount + 1)\n    dp[0] = 0\n    for i in range(1, amount + 1):\n        for c in coins:\n            if c <= i: dp[i] = min(dp[i], dp[i - c] + 1)\n    return dp[amount] if dp[amount] != float('inf') else -1\ninput_data = sys.stdin.read().split()\nn = int(input_data[0])\ncoins = list(map(int, input_data[1:n+1]))\namount = int(input_data[n+1])\nprint(coinChange(coins, amount))`;
  const sub3 = await req('/api/coding/submit', 'POST', { studentId: sid, questionNumber: 3, code: code3, language: 'python' });
  console.log(`   Q3: Score ${sub3.d.score}/10 (${sub3.d.passed}/${sub3.d.total})`);

  // 5. Coding Finalize
  console.log('\n5. CODING FINALIZE');
  const fin = await req('/api/coding/finalize', 'POST', { studentId: sid });
  console.log(`   Total: ${fin.d.codingTotalScore}/30 (Q1:${fin.d.q1} Q2:${fin.d.q2} Q3:${fin.d.q3})`);

  // 6. Communication
  console.log('\n6. COMMUNICATION');
  const comQ = await req('/api/communication/questions', 'GET');
  console.log(`   Questions: ${comQ.d.questions?.length} | Times: ${comQ.d.questions?.map(q => q.speakingTimeSeconds + 's').join(', ')}`);
  const comEval = await req('/api/communication/evaluate', 'POST', {
    studentId: sid,
    transcripts: [
      'I would approach the teammate privately and ask if everything is okay. I would express concern rather than blame, and then work together to find a solution while keeping the manager informed of progress.',
      'The main argument is that AI will create more jobs than it eliminates but workers need to reskill. I agree because technology always creates new industries. As a student, this motivates me to keep learning new skills.',
      'I failed my first semester exam in data structures. I learned that consistent practice is more important than last-minute cramming. Now I practice coding daily and review concepts regularly.'
    ],
    questionIds: comQ.d.questions?.map(q => q._id) || []
  });
  console.log(`   Scores: ${comEval.d.rawScores?.join(', ')} | Rating: ${comEval.d.softSkillsRating}/4.8`);

  // 7. ML Prediction + Gemini Feedback
  console.log('\n7. PREDICT (ML + Gemini)');
  const pred = await req(`/api/predict/${sid}`, 'POST');
  console.log(`   Status: ${pred.s}`);
  console.log(`   Probability: ${(pred.d.prediction?.probability * 100).toFixed(1)}%`);
  console.log(`   Verdict: ${pred.d.prediction?.prediction}`);
  console.log(`   Source: ${pred.d.prediction?.source || 'unknown'}`);
  console.log(`   Gemini feedback: ${pred.d.geminiFeedback ? 'YES' : 'NO'}`);
  if (pred.d.geminiFeedback?.overallSummary) {
    console.log(`   Summary: ${pred.d.geminiFeedback.overallSummary.substring(0, 100)}...`);
  }

  console.log('\n=== ALL TESTS COMPLETE ===');
}

main().catch(e => console.error('FATAL:', e));
