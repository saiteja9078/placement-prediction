const fetch = require('node-fetch');

/**
 * Judge0 Code Execution — tries multiple approaches:
 * 1. Free Judge0 public API (ce.judge0.com) — no key needed
 * 2. RapidAPI Judge0 (if key provided and subscribed)
 * 3. Local fallback using child_process
 */

const JUDGE0_PUBLIC_URL = 'https://ce.judge0.com';
const JUDGE0_RAPID_HOST = 'judge0-ce.p.rapidapi.com';
const JUDGE0_RAPID_URL = `https://${JUDGE0_RAPID_HOST}`;
const API_KEY = process.env.JUDGE0_API_KEY;

// Judge0 language IDs
const LANGUAGE_IDS = {
  python: 71,      // Python 3
  javascript: 63,  // Node.js
  java: 62,        // Java
  cpp: 54          // C++ (GCC)
};

function toBase64(str) {
  return Buffer.from(str || '').toString('base64');
}

function fromBase64(str) {
  if (!str) return '';
  return Buffer.from(str, 'base64').toString('utf-8');
}

/**
 * Try submitting to the free Judge0 public API first
 */
async function submitToJudge0Public(code, languageId, stdin) {
  const response = await fetch(`${JUDGE0_PUBLIC_URL}/submissions?base64_encoded=true&wait=true&fields=*`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source_code: toBase64(code),
      language_id: languageId,
      stdin: toBase64(stdin || ''),
      cpu_time_limit: 5,
      memory_limit: 131072
    }),
    timeout: 30000
  });
  return response;
}

/**
 * Try submitting to RapidAPI Judge0
 */
async function submitToJudge0Rapid(code, languageId, stdin) {
  const response = await fetch(`${JUDGE0_RAPID_URL}/submissions?base64_encoded=true&wait=true&fields=*`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-RapidAPI-Key': API_KEY,
      'X-RapidAPI-Host': JUDGE0_RAPID_HOST
    },
    body: JSON.stringify({
      source_code: toBase64(code),
      language_id: languageId,
      stdin: toBase64(stdin || ''),
      cpu_time_limit: 5,
      memory_limit: 131072
    }),
    timeout: 30000
  });
  return response;
}

/**
 * Parse Judge0 response into our standard format
 */
function parseJudge0Response(result, expectedOutput) {
  const stdout = fromBase64(result.stdout).trim();
  const stderr = fromBase64(result.stderr).trim();
  const compileOutput = fromBase64(result.compile_output).trim();
  const statusDesc = result.status?.description || 'Unknown';
  const time = result.time;

  // Status ID 3 = Accepted
  if (result.status?.id === 3) {
    const expected = (expectedOutput || '').trim();
    const passed = stdout === expected;
    return { passed, stdout, stderr, time, statusDescription: passed ? 'Accepted' : 'Wrong Answer' };
  }
  if (result.status?.id === 6) {
    return { passed: false, stdout: '', stderr: compileOutput || 'Compilation Error', time: null, statusDescription: 'Compilation Error' };
  }
  if (result.status?.id === 5) {
    return { passed: false, stdout, stderr: 'Time Limit Exceeded', time, statusDescription: 'Time Limit Exceeded' };
  }
  if (result.status?.id >= 7 && result.status?.id <= 12) {
    return { passed: false, stdout, stderr: stderr || statusDesc, time, statusDescription: 'Runtime Error' };
  }
  // Status 4 = Wrong Answer (when expected_output was set)
  if (result.status?.id === 4) {
    return { passed: false, stdout, stderr, time, statusDescription: 'Wrong Answer' };
  }
  return { passed: false, stdout, stderr: stderr || statusDesc, time, statusDescription: statusDesc };
}

/**
 * Submit code to Judge0 — tries public API, then RapidAPI, then local fallback
 */
async function executeOnJudge0(code, language, stdin, expectedOutput) {
  const languageId = LANGUAGE_IDS[language];
  if (!languageId) {
    return { passed: false, stdout: '', stderr: `Unsupported language: ${language}`, time: null, statusDescription: 'Error' };
  }

  // Try 1: Free public Judge0 API
  try {
    console.log(`[Judge0] Trying public API (ce.judge0.com)...`);
    const response = await submitToJudge0Public(code, languageId, stdin);
    if (response.ok) {
      const result = await response.json();
      if (result.status) {
        console.log(`[Judge0] Public API success — status: ${result.status.description}, time: ${result.time}s`);
        return parseJudge0Response(result, expectedOutput);
      }
    } else {
      const errText = await response.text();
      console.log(`[Judge0] Public API error (${response.status}): ${errText.substring(0, 100)}`);
    }
  } catch (err) {
    console.log(`[Judge0] Public API failed: ${err.message}`);
  }

  // Try 2: RapidAPI Judge0
  if (API_KEY && API_KEY !== 'your_rapidapi_key_here') {
    try {
      console.log(`[Judge0] Trying RapidAPI...`);
      const response = await submitToJudge0Rapid(code, languageId, stdin);
      if (response.ok) {
        const result = await response.json();
        if (result.status) {
          console.log(`[Judge0] RapidAPI success — status: ${result.status.description}, time: ${result.time}s`);
          return parseJudge0Response(result, expectedOutput);
        }
      } else {
        const errText = await response.text();
        console.log(`[Judge0] RapidAPI error (${response.status}): ${errText.substring(0, 100)}`);
      }
    } catch (err) {
      console.log(`[Judge0] RapidAPI failed: ${err.message}`);
    }
  }

  // Try 3: Local execution fallback
  console.log(`[Judge0] All APIs failed, using local execution`);
  return executeLocally(code, language, stdin, expectedOutput);
}

/**
 * Local fallback executor using child_process
 */
function executeLocally(code, language, stdin, expectedOutput) {
  const { spawnSync, execSync } = require('child_process');
  const fs = require('fs');
  const path = require('path');
  const os = require('os');

  const TIMEOUT_MS = 10000;
  const ext = { python: '.py', javascript: '.js', java: '.java', cpp: '.cpp' };
  const tmpDir = os.tmpdir();
  const filename = `placeprep_${Date.now()}_${Math.random().toString(36).slice(2)}${ext[language] || '.txt'}`;
  const filepath = path.join(tmpDir, filename);
  fs.writeFileSync(filepath, code, 'utf-8');

  const cleanup = (f) => { try { fs.unlinkSync(f); } catch (e) {} };

  // Try multiple Python commands (python3, python, py)
  let cmd;
  switch (language) {
    case 'python': {
      // On Windows, try 'python' first, then 'py', then 'python3'
      const pyCmd = os.platform() === 'win32' ? 'python' : 'python3';
      cmd = `${pyCmd} "${filepath}"`;
      break;
    }
    case 'javascript': cmd = `node "${filepath}"`; break;
    case 'java': {
      const classMatch = code.match(/public\s+class\s+(\w+)/);
      const className = classMatch ? classMatch[1] : 'Main';
      const javaDir = path.join(tmpDir, `java_${Date.now()}`);
      fs.mkdirSync(javaDir, { recursive: true });
      const javaFile = path.join(javaDir, `${className}.java`);
      fs.writeFileSync(javaFile, code, 'utf-8');
      cleanup(filepath);
      try {
        execSync(`javac "${javaFile}"`, { timeout: TIMEOUT_MS, cwd: javaDir });
        cmd = `java -cp "${javaDir}" ${className}`;
      } catch (e) {
        try { fs.rmSync(javaDir, { recursive: true }); } catch(err) {}
        return { passed: false, stdout: '', stderr: e.stderr ? e.stderr.toString() : 'Compilation error', time: null, statusDescription: 'Compilation Error' };
      }
      break;
    }
    case 'cpp': {
      const outFile = filepath.replace('.cpp', os.platform() === 'win32' ? '.exe' : '.out');
      try {
        execSync(`g++ -o "${outFile}" "${filepath}"`, { timeout: TIMEOUT_MS });
        cmd = `"${outFile}"`;
      } catch (e) {
        cleanup(filepath);
        return { passed: false, stdout: '', stderr: e.stderr ? e.stderr.toString() : 'Compilation error', time: null, statusDescription: 'Compilation Error' };
      }
      break;
    }
    default:
      cleanup(filepath);
      return { passed: false, stdout: '', stderr: `Unsupported language: ${language}`, time: null, statusDescription: 'Error' };
  }

  const startTime = Date.now();
  try {
    const result = spawnSync(cmd, { input: stdin || '', timeout: TIMEOUT_MS, shell: true, encoding: 'utf-8', maxBuffer: 1024 * 1024 });
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(3);
    const stdout = (result.stdout || '').trim();
    const stderr = (result.stderr || '').trim();

    if (result.signal === 'SIGTERM' || result.signal === 'SIGKILL') {
      cleanup(filepath); return { passed: false, stdout, stderr: 'Time Limit Exceeded', time: elapsed, statusDescription: 'Time Limit Exceeded' };
    }
    if (result.status !== 0) {
      cleanup(filepath); return { passed: false, stdout, stderr: stderr || 'Runtime Error', time: elapsed, statusDescription: 'Runtime Error' };
    }

    const expected = (expectedOutput || '').trim();
    const passed = stdout === expected;
    cleanup(filepath);
    console.log(`[Local] Executed in ${elapsed}s — ${passed ? 'PASS' : 'FAIL'} (got: "${stdout.substring(0,50)}", expected: "${expected.substring(0,50)}")`);
    return { passed, stdout, stderr, time: elapsed, statusDescription: passed ? 'Accepted' : 'Wrong Answer' };
  } catch (err) {
    cleanup(filepath);
    return { passed: false, stdout: '', stderr: err.message || 'Execution error', time: null, statusDescription: 'Runtime Error' };
  }
}

/**
 * Run code against multiple test cases
 */
async function runAgainstTestCases(code, language, testCases) {
  const results = [];
  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    try {
      const result = await executeOnJudge0(code, language, tc.input, tc.expectedOutput);
      results.push({
        testCase: i + 1, passed: result.passed, stdout: result.stdout,
        stderr: result.stderr, time: result.time,
        statusDescription: result.statusDescription, error: null
      });
    } catch (err) {
      results.push({
        testCase: i + 1, passed: false, stdout: null, stderr: null,
        time: null, statusDescription: 'Error', error: err.message
      });
    }
  }
  return { passed: results.filter(r => r.passed).length, total: testCases.length, results };
}

module.exports = { executeOnJudge0, executeLocally, runAgainstTestCases };
