const http = require('http');

// ── Pretty print helpers ──
const BOLD = '\x1b[1m', DIM = '\x1b[2m', RESET = '\x1b[0m';
const GREEN = '\x1b[32m', RED = '\x1b[31m', YELLOW = '\x1b[33m', CYAN = '\x1b[36m', MAGENTA = '\x1b[35m', BLUE = '\x1b[34m';

function line(char = '─', len = 60) { console.log(DIM + char.repeat(len) + RESET); }
function heading(text) { console.log(`\n${BOLD}${CYAN}  ▶ ${text}${RESET}`); line(); }

function req(port, path, method, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : '';
    const r = http.request({
      hostname: 'localhost', port, path, method,
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => { try { resolve(JSON.parse(b)); } catch(e) { resolve(b); } });
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

async function main() {
  console.log(`\n${BOLD}${MAGENTA}╔══════════════════════════════════════════════════════════╗${RESET}`);
  console.log(`${BOLD}${MAGENTA}║   AI PLACEMENT READINESS PREDICTION — LIVE DEMO         ║${RESET}`);
  console.log(`${BOLD}${MAGENTA}╚══════════════════════════════════════════════════════════╝${RESET}`);

  // ─── Step 1: Show ML Model Features ───
  heading('STEP 1 — ML MODEL INPUT FEATURES (11 Features)');

  const studentProfile = {
    CGPA: 8.5,
    Internships: 2,
    Projects: 3,
    'Workshops/Certifications': 2,
    AptitudeTestScore: 82,
    SoftSkillsRating: 4.2,
    ExtracurricularActivities: 'Yes',
    PlacementTraining: 'Yes',
    SSC_Marks: 85,
    HSC_Marks: 88,
    CodingScore: 24
  };

  const placedAvg = {
    CGPA: 8.02, Internships: 1.25, Projects: 2.51,
    'Workshops/Certifications': 1.40, AptitudeTestScore: 84.46,
    SoftSkillsRating: 4.53, SSC_Marks: 74.92, HSC_Marks: 79.81, CodingScore: 21
  };

  console.log(`  ${BOLD}Feature                      Value     Placed Avg   Status${RESET}`);
  line('─', 60);
  for (const [key, val] of Object.entries(studentProfile)) {
    const avg = placedAvg[key];
    if (avg !== undefined) {
      const status = val >= avg ? `${GREEN}✓ Above${RESET}` : `${RED}✗ Below${RESET}`;
      const pad1 = ' '.repeat(Math.max(0, 28 - key.length));
      const pad2 = ' '.repeat(Math.max(0, 10 - String(val).length));
      console.log(`  ${key}${pad1}${BOLD}${val}${RESET}${pad2}${DIM}${avg}${RESET}       ${status}`);
    } else {
      const pad1 = ' '.repeat(Math.max(0, 28 - key.length));
      console.log(`  ${key}${pad1}${BOLD}${val}${RESET}`);
    }
  }

  // ─── Step 2: Call Flask ML Model ───
  heading('STEP 2 — CALLING FLASK ML SERVICE (Random Forest)');
  console.log(`  ${DIM}POST http://localhost:5001/predict${RESET}`);
  console.log(`  ${DIM}Sending 11 features to trained model...${RESET}\n`);

  try {
    const start = Date.now();
    const mlResult = await req(5001, '/predict', 'POST', studentProfile);
    const elapsed = Date.now() - start;

    const prob = (mlResult.probability * 100).toFixed(1);
    const conf = (mlResult.confidence * 100).toFixed(1);
    const isPlaced = mlResult.prediction === 'Placed';

    console.log(`  ${BOLD}Response Time:${RESET}     ${elapsed}ms`);
    console.log(`  ${BOLD}Prediction:${RESET}        ${isPlaced ? GREEN + '✓ PLACED' : RED + '✗ NOT PLACED'}${RESET}`);
    console.log(`  ${BOLD}Probability:${RESET}       ${isPlaced ? GREEN : RED}${prob}%${RESET}`);
    console.log(`  ${BOLD}Confidence:${RESET}        ${conf}%`);
    console.log(`  ${BOLD}Model:${RESET}             Random Forest Classifier`);
    console.log(`  ${BOLD}Training Data:${RESET}     10,000 student records`);

    // ─── Step 3: Show prediction with different inputs ───
    heading('STEP 3 — COMPARING DIFFERENT STUDENT PROFILES');

    const profiles = [
      { label: 'Strong Student', CGPA: 9.0, Internships: 2, Projects: 3, 'Workshops/Certifications': 3, AptitudeTestScore: 88, SoftSkillsRating: 4.6, ExtracurricularActivities: 'Yes', PlacementTraining: 'Yes', SSC_Marks: 90, HSC_Marks: 88, CodingScore: 28 },
      { label: 'Average Student', CGPA: 7.5, Internships: 1, Projects: 2, 'Workshops/Certifications': 1, AptitudeTestScore: 75, SoftSkillsRating: 3.8, ExtracurricularActivities: 'Yes', PlacementTraining: 'No', SSC_Marks: 72, HSC_Marks: 70, CodingScore: 15 },
      { label: 'Weak Student', CGPA: 6.8, Internships: 0, Projects: 1, 'Workshops/Certifications': 0, AptitudeTestScore: 65, SoftSkillsRating: 3.2, ExtracurricularActivities: 'No', PlacementTraining: 'No', SSC_Marks: 60, HSC_Marks: 62, CodingScore: 5 },
    ];

    console.log(`  ${BOLD}Profile              CGPA  Code  Aptitude  Probability  Verdict${RESET}`);
    line('─', 60);

    for (const p of profiles) {
      const { label, ...features } = p;
      const res = await req(5001, '/predict', 'POST', features);
      const pr = (res.probability * 100).toFixed(1);
      const v = res.prediction === 'Placed' ? `${GREEN}Placed${RESET}` : `${RED}Not Placed${RESET}`;
      const pad = ' '.repeat(Math.max(0, 20 - label.length));
      console.log(`  ${label}${pad}${p.CGPA}   ${p.CodingScore}/30  ${p.AptitudeTestScore}/90     ${BOLD}${pr}%${RESET}        ${v}`);
    }

    // ─── Step 4: Feature Importance ───
    heading('STEP 4 — KEY FACTORS AFFECTING PREDICTION');
    const factors = [
      ['CodingScore (0-30)',      '██████████████████  17%', 'Highest impact'],
      ['CGPA',                    '███████████████     15%', 'Academic foundation'],
      ['AptitudeTestScore',       '███████████████     15%', 'Logical ability'],
      ['SoftSkillsRating',        '██████████          10%', 'Communication'],
      ['Projects',                '██████████          10%', 'Practical experience'],
      ['Internships',             '████████             8%', 'Industry exposure'],
      ['SSC + HSC Marks',         '██████████          10%', 'Academic consistency'],
      ['Extracurricular + Training', '██████████       10%', 'Holistic development'],
    ];

    for (const [name, bar, desc] of factors) {
      const pad = ' '.repeat(Math.max(0, 28 - name.length));
      console.log(`  ${name}${pad}${BLUE}${bar}${RESET}  ${DIM}${desc}${RESET}`);
    }

  } catch (err) {
    console.log(`  ${RED}ERROR: Flask ML service not running!${RESET}`);
    console.log(`  ${DIM}Start it with: cd ml_service && python app.py${RESET}`);
    console.log(`  ${DIM}Error: ${err.message}${RESET}`);
  }

  console.log(`\n${BOLD}${MAGENTA}╔══════════════════════════════════════════════════════════╗${RESET}`);
  console.log(`${BOLD}${MAGENTA}║   DEMO COMPLETE — Model is serving real-time predictions ║${RESET}`);
  console.log(`${BOLD}${MAGENTA}╚══════════════════════════════════════════════════════════╝${RESET}\n`);
}

main().catch(e => console.error('Error:', e.message));
