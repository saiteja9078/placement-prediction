const http = require('http');

// Quick test: register and predict with Flask ML
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

  // Register
  console.log('1. Register...');
  const reg = await req('/api/students/register', 'POST', {
    name: 'Flask Test', email: `flask${ts}@t.com`, rollNumber: `FL${ts}`,
    cgpa: 8.5, sscMarks: 85, hscMarks: 85, internships: 1, projects: 2,
    workshopsCertifications: 1, softSkillsRating: 4.0,
    extracurricularActivities: 'Yes', placementTraining: 'Yes'
  });
  const sid = reg.d.student?._id || reg.d.studentId;
  console.log('   Student ID:', sid);

  // Skip straight to predict (with default scores)
  console.log('\n2. Predict (Flask ML should be used)...');
  const pred = await req(`/api/predict/${sid}`, 'POST');
  console.log('   Status:', pred.s);
  if (pred.s === 200) {
    console.log('   Probability:', (pred.d.prediction?.probability * 100).toFixed(1) + '%');
    console.log('   Verdict:', pred.d.prediction?.prediction);
    console.log('   Source:', pred.d.prediction?.source);
    console.log('   Gemini feedback:', pred.d.geminiFeedback ? 'YES (Summary: ' + (pred.d.geminiFeedback.overallSummary || '').substring(0, 80) + '...)' : 'NO');
  } else {
    console.log('   Error:', JSON.stringify(pred.d));
  }

  console.log('\nDone!');
}

main().catch(e => console.error('FATAL:', e));
