import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { api } from '../utils/api';
import { usePhaseGuard } from '../hooks/usePhaseGuard';
import { CheckCircle, Loader2, Play, Send, Check, X } from 'lucide-react';

const LANGS = {
  python: { label: 'Python', monaco: 'python' },
  javascript: { label: 'JavaScript', monaco: 'javascript' },
  java: { label: 'Java', monaco: 'java' },
  cpp: { label: 'C++', monaco: 'cpp' },
};

export default function Coding() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  usePhaseGuard(studentId, 3);

  const [questions, setQuestions] = useState([]);
  const [activeQ, setActiveQ] = useState(0);
  const [language, setLanguage] = useState('python');
  const [codes, setCodes] = useState({});
  const [output, setOutput] = useState(null);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [scores, setScores] = useState({});
  const [loading, setLoading] = useState(true);
  const [finalizing, setFinalizing] = useState(false);
  const [finalized, setFinalized] = useState(false);
  const [finalResult, setFinalResult] = useState(null);

  useEffect(() => {
    api.getCodingQuestions(studentId).then(data => {
      // If already completed coding
      if (data.alreadyCompleted) {
        setFinalResult({
          codingTotalScore: data.codingTotalScore,
          q1: data.q1, q2: data.q2, q3: data.q3
        });
        setFinalized(true);
        setLoading(false);
        return;
      }
      setQuestions(data.questions);
      const init = {};
      data.questions.forEach((q, i) => { init[i] = q.starterCode?.python || ''; });
      setCodes(init);
      setLoading(false);
    });
  }, [studentId]);

  const handleLang = (lang) => {
    setLanguage(lang);
    const key = `${activeQ}_${lang}`;
    if (!codes[key]) setCodes(c => ({ ...c, [key]: questions[activeQ]?.starterCode?.[lang] || '' }));
  };

  const getCode = () => codes[`${activeQ}_${language}`] || codes[activeQ] || '';
  const setCode = (v) => setCodes(c => ({ ...c, [`${activeQ}_${language}`]: v, [activeQ]: v }));

  const handleRun = async () => {
    setRunning(true); setOutput(null);
    try {
      const q = questions[activeQ];
      setOutput(await api.runCode({
        studentId,
        questionId: q._id,
        questionNumber: q.orderIndex || (activeQ + 1),
        code: getCode(),
        language
      }));
    } catch (err) { setOutput({ error: err.message }); }
    setRunning(false);
  };

  const handleSubmit = async () => {
    setSubmitting(true); setOutput(null);
    try {
      const q = questions[activeQ];
      const data = await api.submitCode({
        studentId,
        questionId: q._id,
        questionNumber: q.orderIndex || (activeQ + 1),
        code: getCode(),
        language
      });
      setScores(s => ({ ...s, [activeQ]: data.score }));
      setOutput({ ...data, submitted: true });
    } catch (err) { setOutput({ error: err.message }); }
    setSubmitting(false);
  };

  const handleFinalize = async () => {
    setFinalizing(true);
    try { const d = await api.finalizeCoding(studentId); setFinalResult(d); setFinalized(true); }
    catch (err) { console.error(err); }
    setFinalizing(false);
  };

  if (loading) return <div className="page-center"><div className="spinner"></div></div>;

  if (finalized && finalResult) {
    return (
      <div className="page-center">
        <div style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }} className="anim-in">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', color: 'var(--success)' }}>
            <CheckCircle size={48} />
          </div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, marginBottom: '0.25rem' }}>Coding Exam Complete</h1>
          <div className="card" style={{ margin: '1.5rem 0' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>{finalResult.codingTotalScore}<span style={{ fontSize: '1.125rem', color: '#9ca3af', fontWeight: 400 }}> / 30</span></div>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0.5rem 0 1rem' }}>Total Score</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              {[['Easy', finalResult.q1], ['Medium', finalResult.q2], ['Hard', finalResult.q3]].map(([d, s], i) => (
                <div key={i} style={{ background: 'var(--card)', borderRadius: '0.5rem', padding: '0.75rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{s}<span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>/10</span></div>
                  <div style={{ fontSize: '0.6875rem', color: '#9ca3af', marginTop: '0.125rem' }}>{d}</div>
                </div>
              ))}
            </div>
          </div>
          <button onClick={() => navigate(`/communication/${studentId}`)} className="btn btn-primary btn-lg btn-full">
            Continue to Communication →
          </button>
        </div>
      </div>
    );
  }

  const q = questions[activeQ];
  const diffBadge = { Easy: 'badge-easy', Medium: 'badge-medium', Hard: 'badge-hard' };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* Top bar */}
      <div style={{ borderBottom: '1px solid var(--border)', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--card)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#6b7280', marginRight: '0.5rem' }}>Coding Exam</span>
          {questions.map((qq, i) => (
            <button key={i} onClick={() => { setActiveQ(i); setOutput(null); }}
              style={{
                padding: '0.375rem 0.75rem', borderRadius: '0.375rem', fontSize: '0.8125rem', fontWeight: 600,
                border: '1.5px solid', cursor: 'pointer', transition: 'all 0.12s',
                borderColor: i === activeQ ? 'var(--accent)' : scores[i] !== undefined ? 'var(--success)' : 'var(--border)',
                background: i === activeQ ? 'rgba(255, 161, 22, 0.1)' : scores[i] !== undefined ? 'rgba(34, 197, 94, 0.1)' : 'var(--card)',
                color: i === activeQ ? 'var(--accent)' : scores[i] !== undefined ? 'var(--success)' : 'var(--text-muted)',
              }}>
              {i + 1}. {qq.title} {scores[i] !== undefined && <Check size={14} style={{ display: 'inline', marginLeft: '4px', verticalAlign: 'text-bottom' }} />}
            </button>
          ))}
        </div>
        {Object.keys(scores).length === 3 && (
          <button className="btn btn-success btn-sm" onClick={handleFinalize} disabled={finalizing}>
            {finalizing ? 'Finalizing...' : 'Finish Exam →'}
          </button>
        )}
      </div>

      {/* Split pane */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        {/* Left: Problem */}
        <div style={{ width: '42%', borderRight: '1px solid var(--border)', overflowY: 'auto', padding: '1.5rem', background: 'var(--bg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{q.title}</h2>
            <span className={`badge ${diffBadge[q.difficulty]}`}>{q.difficulty}</span>
          </div>
          <div style={{ fontSize: '0.9375rem', color: 'var(--text-primary)', lineHeight: 1.7, whiteSpace: 'pre-wrap', marginBottom: '1.5rem' }}>{q.description}</div>

          {q.examples?.map((ex, i) => (
            <div key={i} style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '0.375rem' }}>Example {i + 1}</div>
              <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '0.875rem', fontFamily: 'monospace', fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
                <div style={{ marginBottom: '0.25rem' }}><span style={{ color: 'var(--text-muted)' }}>Input:  </span>{ex.input}</div>
                <div style={{ marginBottom: '0.25rem' }}><span style={{ color: 'var(--text-muted)' }}>Output: </span>{ex.output}</div>
                {ex.explanation && <div style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontFamily: 'Outfit, sans-serif', fontSize: '0.8125rem', borderTop: '1px dashed var(--border)', paddingTop: '0.5rem' }}>{ex.explanation}</div>}
              </div>
            </div>
          ))}

          {q.constraints?.length > 0 && (
            <div style={{ marginTop: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '0.375rem' }}>Constraints</div>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {q.constraints.map((c, i) => <li key={i} style={{ fontSize: '0.8125rem', color: '#6b7280', fontFamily: 'monospace', marginBottom: '0.125rem' }}>• {c}</li>)}
              </ul>
            </div>
          )}
        </div>

        {/* Right: Editor */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
          {/* Lang tabs */}
          <div style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)', padding: '0.375rem 1rem', display: 'flex', gap: '0.25rem' }}>
            {Object.entries(LANGS).map(([key, val]) => (
              <button key={key} onClick={() => handleLang(key)}
                style={{
                  padding: '0.3125rem 0.75rem', borderRadius: '0.375rem', fontSize: '0.8125rem', fontWeight: 500,
                  border: language === key ? '1px solid var(--border)' : '1px solid transparent',
                  background: language === key ? 'var(--bg)' : 'transparent',
                  color: language === key ? 'var(--text-primary)' : 'var(--text-muted)',
                  cursor: 'pointer', boxShadow: language === key ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                }}>{val.label}</button>
            ))}
          </div>

          {/* Editor */}
          <div style={{ flex: 1, minHeight: 0 }}>
            <Editor
              height="100%"
              language={LANGS[language].monaco}
              value={getCode()}
              onChange={setCode}
              theme="vs-dark"
              options={{ fontSize: 14, minimap: { enabled: false }, scrollBeyondLastLine: false, padding: { top: 12 }, fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace", lineHeight: 22, renderLineHighlight: 'gutter' }}
            />
          </div>

          {/* Action buttons */}
          <div style={{ borderTop: '1px solid var(--border)', padding: '0.75rem 1rem', display: 'flex', gap: '0.5rem', background: 'var(--card)' }}>
            <button className="btn btn-outline btn-sm" onClick={handleRun} disabled={running || submitting}>
              {running ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Running...</> : <><Play size={16} /> Run Code</>}
            </button>
            <button className="btn btn-success btn-sm" onClick={handleSubmit}
              disabled={running || submitting || scores[activeQ] !== undefined}>
              {submitting ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Submitting...</> : scores[activeQ] !== undefined ? <><Check size={16} /> Scored {scores[activeQ]}/10</> : <><Send size={16} /> Submit</>}
            </button>
          </div>

          {/* Output panel */}
          {output && (
            <div style={{ borderTop: '1px solid var(--border)', maxHeight: '11rem', overflowY: 'auto', padding: '1rem', background: 'var(--bg)' }}>
              {output.error ? (
                <div style={{ color: '#dc2626', fontFamily: 'monospace', fontSize: '0.875rem' }}>{output.error}</div>
              ) : (
                <div>
                  {output.submitted && <div style={{ fontWeight: 600, color: '#16a34a', fontSize: '0.875rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '4px' }}><Check size={16} /> Submitted — Score: {output.score}/10</div>}
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '0.375rem' }}>Tests: {output.passed}/{output.total} passed</div>
                  {output.results?.map((r, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'monospace', fontSize: '0.8125rem', color: r.passed ? '#16a34a' : '#dc2626', marginBottom: '0.125rem' }}>
                      {r.passed ? <Check size={14} /> : <X size={14} />} Case {r.testCase}{r.time ? ` · ${r.time}s` : ''}{r.statusDescription && r.statusDescription !== 'Accepted' && !r.passed ? ` — ${r.statusDescription}` : ''}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
