import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { usePhaseGuard } from '../hooks/usePhaseGuard';
import { XCircle, CheckCircle, Mic, Check, SkipForward, AlertTriangle } from 'lucide-react';

export default function Communication() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  usePhaseGuard(studentId, 4);

  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [phase, setPhase] = useState('reading');
  const [transcript, setTranscript] = useState('');
  const [allTranscripts, setAllTranscripts] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [readingTime, setReadingTime] = useState(10);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [result, setResult] = useState(null);

  // ──── Refs for speech recognition (avoid stale closures) ────
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const finalTranscriptRef = useRef('');
  const isRecordingRef = useRef(false);        // ← Key fix: ref instead of state
  const allTranscriptsRef = useRef([]);        // ← Keep in sync with state
  const currentQRef = useRef(0);
  const questionsRef = useRef([]);

  // Keep refs in sync with state
  useEffect(() => { allTranscriptsRef.current = allTranscripts; }, [allTranscripts]);
  useEffect(() => { currentQRef.current = currentQ; }, [currentQ]);
  useEffect(() => { questionsRef.current = questions; }, [questions]);

  useEffect(() => {
    api.getCommunicationQuestions(studentId).then(data => {
      if (data.alreadyCompleted) {
        setResult({ rawScores: data.rawScores, softSkillsRating: data.softSkillsRating });
        setLoading(false);
        return;
      }
      setQuestions(data.questions);
      setLoading(false);
    });
  }, []);

  // Reading countdown
  useEffect(() => {
    if (phase !== 'reading' || questions.length === 0) return;
    setReadingTime(10);
    const t = setInterval(() => {
      setReadingTime(v => { if (v <= 1) { clearInterval(t); return 0; } return v - 1; });
    }, 1000);
    return () => clearInterval(t);
  }, [phase, currentQ, questions.length]);

  // ──── Cleanup: stop recognition on unmount ────
  useEffect(() => {
    return () => {
      isRecordingRef.current = false;
      try { recognitionRef.current?.abort(); } catch (e) { /* ignore */ }
      clearInterval(timerRef.current);
    };
  }, []);

  // ──── Core speech recognition ────
  const createRecognition = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert('Speech recognition not supported. Use Chrome or Edge.'); return null; }

    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';
    rec.maxAlternatives = 1;

    rec.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          finalTranscriptRef.current += t + ' ';
          console.log('[Speech] Final chunk:', t);
        } else {
          interim = t;
        }
      }
      setTranscript(finalTranscriptRef.current + interim);
    };

    rec.onerror = (e) => {
      console.warn('[Speech] Error:', e.error, e.message);
      // 'no-speech' and 'aborted' are non-fatal — don't stop recording
      if (e.error === 'no-speech' || e.error === 'aborted') return;
      // For network errors, try to restart
      if (e.error === 'network' && isRecordingRef.current) {
        console.log('[Speech] Network error — restarting...');
        setTimeout(() => {
          if (isRecordingRef.current) {
            try { rec.start(); } catch (ex) { console.warn('[Speech] Restart failed:', ex); }
          }
        }, 500);
      }
    };

    // AUTO-RESTART: Chrome stops recognition after ~60s of continuous mode
    // This is the KEY fix — uses ref (not stale state) to check if still recording
    rec.onend = () => {
      console.log('[Speech] Recognition ended, isRecording:', isRecordingRef.current);
      if (isRecordingRef.current) {
        console.log('[Speech] Auto-restarting recognition...');
        setTimeout(() => {
          if (isRecordingRef.current) {
            try {
              rec.start();
              console.log('[Speech] Restarted successfully');
            } catch (ex) {
              console.warn('[Speech] Restart failed:', ex);
            }
          }
        }, 200);
      }
    };

    return rec;
  }, []);

  const finishQuestion = useCallback(() => {
    // Stop recording
    isRecordingRef.current = false;
    clearInterval(timerRef.current);
    timerRef.current = null;
    try { recognitionRef.current?.stop(); } catch (e) { /* ignore */ }

    // Capture transcript BEFORE resetting
    const capturedText = finalTranscriptRef.current.trim() || '[No response recorded]';
    console.log(`[Communication] Q${currentQRef.current + 1} transcript captured: "${capturedText.substring(0, 100)}..." (${capturedText.split(/\s+/).length} words)`);

    const newTranscripts = [...allTranscriptsRef.current, capturedText];
    setAllTranscripts(newTranscripts);
    allTranscriptsRef.current = newTranscripts;

    if (currentQRef.current < questionsRef.current.length - 1) {
      // Move to next question
      setCurrentQ(q => q + 1);
      setPhase('reading');
      setTranscript('');
      finalTranscriptRef.current = '';
    } else {
      // All done — evaluate
      setEvaluating(true);
      console.log('[Communication] All transcripts:', newTranscripts.map((t, i) => `Q${i + 1}: "${t.substring(0, 60)}..."`));
      api.evaluateCommunication({
        studentId,
        transcripts: newTranscripts,
        questionIds: questionsRef.current.map(q => q._id)
      })
        .then(data => { setResult(data); setEvaluating(false); })
        .catch(err => { setResult({ error: err.message }); setEvaluating(false); });
    }
  }, [studentId]);

  const startSpeaking = useCallback(() => {
    const q = questionsRef.current[currentQRef.current];
    if (!q) return;

    // Reset transcript for this question
    finalTranscriptRef.current = '';
    setTranscript('');
    setTimeLeft(q.speakingTimeSeconds);
    setPhase('speaking');
    isRecordingRef.current = true;

    // Create and start recognition
    const rec = createRecognition();
    if (!rec) return;
    recognitionRef.current = rec;

    try {
      rec.start();
      console.log(`[Speech] Started for Q${currentQRef.current + 1} (${q.speakingTimeSeconds}s)`);
    } catch (e) {
      console.warn('[Speech] Start failed:', e);
    }

    // Speaking timer
    let remaining = q.speakingTimeSeconds;
    timerRef.current = setInterval(() => {
      remaining--;
      setTimeLeft(remaining);
      if (remaining <= 0) {
        finishQuestion();
      }
    }, 1000);
  }, [createRecognition, finishQuestion]);

  const stopEarly = useCallback(() => {
    finishQuestion();
  }, [finishQuestion]);

  if (loading) return <div className="page-center"><div className="spinner"></div></div>;

  if (evaluating) {
    return (
      <div className="page-center">
        <div style={{ textAlign: 'center' }} className="anim-in">
          <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Evaluating with AI</h2>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>Analyzing your communication skills via Ollama...</p>
          <p style={{ color: '#9ca3af', fontSize: '0.75rem', marginTop: '0.5rem' }}>This may take 30–90 seconds (local AI processing)</p>
        </div>
      </div>
    );
  }

  if (result) {
    const labels = ['Scenario', 'Comprehension', 'Personal'];
    return (
      <div className="page-center">
        <div style={{ width: '100%', maxWidth: '480px', textAlign: 'center' }} className="anim-in">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', color: result.error ? 'var(--danger)' : 'var(--success)' }}>
            {result.error ? <XCircle size={48} /> : <CheckCircle size={48} />}
          </div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, marginBottom: '0.25rem' }}>Communication Complete</h1>
          {result.error ? (
            <div className="card" style={{ margin: '1.5rem 0', color: '#dc2626', fontSize: '0.875rem' }}>{result.error}</div>
          ) : (
            <div className="card" style={{ margin: '1.5rem 0' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>{result.softSkillsRating}<span style={{ fontSize: '1.125rem', color: '#9ca3af', fontWeight: 400 }}> / 4.8</span></div>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0.5rem 0 0.25rem' }}>Soft Skills Rating</p>
              <p style={{ color: '#9ca3af', fontSize: '0.75rem', marginBottom: '1.25rem' }}>Average Score: {result.avgRaw}/100</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {result.rawScores?.map((score, i) => {
                  const ev = result.evaluations?.[i];
                  return (
                    <div key={i} style={{ background: 'var(--card)', borderRadius: '0.5rem', padding: '0.875rem', textAlign: 'left' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>Q{i + 1} — {labels[i] || `Question ${i + 1}`}</span>
                          {ev?.source && <span style={{ fontSize: '0.5625rem', padding: '0.125rem 0.375rem', borderRadius: '0.25rem', background: ev.source === 'ollama' ? 'rgba(34,197,94,0.15)' : ev.source === 'gemini' ? 'rgba(59,130,246,0.15)' : 'rgba(156,163,175,0.15)', color: ev.source === 'ollama' ? '#16a34a' : ev.source === 'gemini' ? '#3b82f6' : '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>{ev.source}</span>}
                        </div>
                        <span style={{ fontSize: '1.125rem', fontWeight: 700, color: score >= 60 ? '#16a34a' : score >= 30 ? '#d97706' : '#dc2626' }}>{score}<span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>/100</span></span>
                      </div>
                      {ev && ev.clarity !== undefined && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.375rem', marginBottom: '0.5rem' }}>
                          {[['Clarity', ev.clarity], ['Relevance', ev.relevance], ['Language', ev.language], ['Confidence', ev.confidence]].map(([label, val]) => (
                            <div key={label} style={{ fontSize: '0.6875rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9ca3af', marginBottom: '0.125rem' }}>
                                <span>{label}</span><span>{val || 0}/25</span>
                              </div>
                              <div className="progress-track" style={{ height: '3px' }}>
                                <div className="progress-fill" style={{ width: `${((val || 0) / 25) * 100}%`, background: (val || 0) >= 18 ? '#16a34a' : (val || 0) >= 10 ? '#d97706' : '#dc2626' }}></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {ev?.reason && (
                        <p style={{ fontSize: '0.6875rem', color: '#6b7280', fontStyle: 'italic', margin: 0 }}>{ev.reason}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <button onClick={() => navigate(`/result/${studentId}`)} className="btn btn-primary btn-lg btn-full">
            View Final Results →
          </button>
        </div>
      </div>
    );
  }

  const q = questions[currentQ];
  const typeMap = { scenario: 'Scenario', read_comprehension: 'Comprehension', personal: 'Personal' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Top bar */}
      <div style={{ borderBottom: '1px solid var(--border)', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10, background: 'var(--card)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#6b7280' }}>Communication Test</span>
          <div className="progress-track" style={{ width: '8rem' }}>
            <div className="progress-fill" style={{ width: `${((currentQ + (phase === 'speaking' ? 0.5 : 0)) / questions.length) * 100}%` }}></div>
          </div>
        </div>
        <span style={{ fontSize: '0.875rem', color: '#9ca3af', fontWeight: 500 }}>Question {currentQ + 1} of {questions.length}</span>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '2.5rem 2rem' }}>
        <div style={{ width: '100%', maxWidth: '680px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <span className="badge badge-info">{typeMap[q.type]}</span>
            <span style={{ fontSize: '0.8125rem', color: '#9ca3af' }}>Speaking time: {q.speakingTimeSeconds}s</span>
          </div>

          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.9375rem', color: 'var(--text-primary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{q.prompt}</div>
          </div>

          {phase === 'reading' && (
            <div style={{ textAlign: 'center' }}>
              {readingTime > 0 ? (
                <div>
                  <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Read the prompt carefully</p>
                  <div style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>{readingTime}s</div>
                  <p style={{ color: '#9ca3af', fontSize: '0.8125rem' }}>Speaking will be enabled shortly</p>
                </div>
              ) : (
                <button onClick={startSpeaking} className="btn btn-primary btn-lg"><Mic size={20} /> Start Speaking</button>
              )}
            </div>
          )}

          {phase === 'speaking' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div className="rec-dot"></div>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#dc2626' }}>Recording</span>
                </div>
                <span className={`timer ${timeLeft < 10 ? 'timer-danger' : timeLeft < 30 ? 'timer-warn' : ''}`} style={{ fontSize: '1.25rem' }}>
                  {timeLeft}s
                </span>
              </div>
              <div className="card" style={{ minHeight: '120px', marginBottom: '1rem' }}>
                {transcript
                  ? <p style={{ fontSize: '0.9375rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>{transcript}</p>
                  : <p style={{ color: '#d1d5db', fontStyle: 'italic', fontSize: '0.9375rem' }}>Listening... Start speaking.</p>
                }
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={stopEarly} className="btn btn-outline btn-full">
                  {transcript.trim().length > 0 ? <><Check size={18} /> Done Speaking</> : <><SkipForward size={18} /> Skip Question</>}
                </button>
              </div>
              {!transcript.trim() && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--warn)', marginTop: '0.5rem' }}>
                  <AlertTriangle size={14} /> No speech detected yet. Make sure your microphone is on and speak clearly.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
