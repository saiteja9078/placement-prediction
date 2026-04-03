import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { usePhaseGuard } from '../hooks/usePhaseGuard';
import { Trophy, CheckCircle, BarChart, AlertTriangle } from 'lucide-react';

export default function Aptitude() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { isCompleted } = usePhaseGuard(studentId, 2);

  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    // If phase guard says already completed, fetch the result directly
    if (isCompleted) {
      api.getAptitudeResult(studentId)
        .then(data => {
          setResult({ correct: data.correct, mappedScore: data.mappedScore, total: data.total });
          setLoading(false);
        })
        .catch(() => {
          // Fallback: try getStudent
          api.getStudent(studentId).then(student => {
            if (student.aptitudeRawScore !== undefined) {
              setResult({ correct: student.aptitudeRawScore, mappedScore: student.aptitudeTestScore, total: 20 });
            }
            setLoading(false);
          }).catch(() => setLoading(false));
        });
      return;
    }

    api.getAptitudeQuestions(studentId)
      .then(data => {
        if (data.alreadyCompleted) {
          setResult(data.result);
          setLoading(false);
        } else {
          setQuestions(data.questions);
          setLoading(false);
        }
      })
      .catch(async (err) => {
        try {
          const resp = await fetch(`/api/students/${studentId}`);
          const student = await resp.json();
          if (student.currentPhase > 2) {
            setResult({ correct: student.aptitudeRawScore, mappedScore: student.aptitudeTestScore, total: 20 });
            setLoading(false);
            return;
          }
        } catch(e) { /* ignore */ }
        console.error(err);
      });
  }, [studentId, isCompleted]);

  useEffect(() => {
    if (questions.length === 0 || result) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); handleSubmit(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [questions, result]);

  const handleSubmit = useCallback(async () => {
    if (submitting || result) return;
    setSubmitting(true);
    clearInterval(timerRef.current);
    const answerArray = Array.from({ length: 20 }, (_, i) => answers[i] ?? -1);
    try {
      const data = await api.submitAptitude({ studentId, answers: answerArray });
      setResult(data);
    } catch (err) { console.error(err); }
    setSubmitting(false);
  }, [studentId, answers, submitting, result]);

  const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const answered = Object.keys(answers).length;

  if (loading) return <div className="page-center"><div className="spinner"></div></div>;

  // Result screen — shown when completed OR when user navigates back
  if (result) {
    return (
      <div className="page-center">
        <div style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }} className="anim-in">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', color: result.correct >= 14 ? 'var(--accent)' : result.correct >= 10 ? 'var(--success)' : 'var(--text-muted)' }}>
            {result.correct >= 14 ? <Trophy size={48} /> : result.correct >= 10 ? <CheckCircle size={48} /> : <BarChart size={48} />}
          </div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, marginBottom: '0.25rem' }}>Aptitude Test Complete</h1>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            {isCompleted ? 'You have already completed this test. Here are your scores:' : 'Your responses have been recorded'}
          </p>
          <div className="card" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>{result.correct}<span style={{ fontSize: '1.125rem', color: '#9ca3af', fontWeight: 400 }}> / {result.total}</span></div>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0.5rem 0 1rem' }}>Questions Correct</p>
            <div className="progress-track" style={{ marginBottom: '0.75rem' }}>
              <div className="progress-fill progress-fill-green" style={{ width: `${(result.correct / result.total) * 100}%` }}></div>
            </div>
            <p style={{ fontSize: '0.8125rem', color: '#9ca3af' }}>Mapped Score: <strong style={{ color: '#374151' }}>{result.mappedScore}/90</strong></p>
          </div>
          {isCompleted && (
            <div style={{ display: 'flex', alignItems: 'flex-start', textAlign: 'left', gap: '0.5rem', background: 'rgba(255, 192, 30, 0.1)', border: '1px solid var(--warn-border)', borderRadius: '0.5rem', padding: '0.75rem', marginBottom: '1rem', fontSize: '0.8125rem', color: 'var(--warn)' }}>
              <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} /> 
              <span>Retaking the aptitude test is not allowed. These are your final scores.</span>
            </div>
          )}
          <button onClick={() => navigate(`/coding/${studentId}`)} className="btn btn-primary btn-lg btn-full" id="continue-coding">
            Continue to Coding Exam →
          </button>
        </div>
      </div>
    );
  }

  const q = questions[currentQ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Top bar */}
      <div style={{ borderBottom: '1px solid var(--border)', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--card)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#6b7280' }}>Aptitude Test</span>
          <div className="progress-track" style={{ width: '8rem' }}>
            <div className="progress-fill" style={{ width: `${(answered / 20) * 100}%` }}></div>
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#9ca3af' }}>{answered}/20</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span className={`timer ${timeLeft < 300 ? 'timer-danger' : timeLeft < 600 ? 'timer-warn' : ''}`} style={{ fontSize: '0.9375rem' }}>
            {fmtTime(timeLeft)}
          </span>
          <button className="btn btn-primary btn-sm" onClick={() => setShowConfirm(true)}>Submit Test</button>
        </div>
      </div>

      {/* Question area — centered */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '2.5rem 2rem' }}>
        <div style={{ width: '100%', maxWidth: '680px' }}>
          {/* Question header */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#9ca3af' }}>Question {currentQ + 1} of 20</span>
              <span className={`badge badge-${q.difficulty?.toLowerCase()}`}>{q.difficulty}</span>
              <span className="badge badge-neutral">{q.category}</span>
            </div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.6 }}>{q.question}</h2>
          </div>

          {/* Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '2rem' }}>
            {q.options.map((opt, i) => (
              <button key={i} className={`mcq-option ${answers[currentQ] === i ? 'selected' : ''}`}
                onClick={() => setAnswers(a => ({ ...a, [currentQ]: i }))}>
                <span className="mcq-letter">{'ABCD'[i]}</span>
                <span>{opt}</span>
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
            <button className="btn btn-outline" onClick={() => setCurrentQ(q => Math.max(0, q - 1))}
              disabled={currentQ === 0} style={{ minWidth: '100px' }}>← Previous</button>

            <div className="q-nav" style={{ flex: 1, maxWidth: '500px' }}>
              {Array.from({ length: 20 }, (_, i) => (
                <button key={i} onClick={() => setCurrentQ(i)}
                  className={`q-dot ${i === currentQ ? 'active' : ''} ${answers[i] !== undefined && i !== currentQ ? 'answered' : ''}`}>
                  {i + 1}
                </button>
              ))}
            </div>

            <button className="btn btn-primary" onClick={() => setCurrentQ(q => Math.min(19, q + 1))}
              disabled={currentQ === 19} style={{ minWidth: '100px' }}>Next →</button>
          </div>
        </div>
      </div>

      {/* Confirm modal */}
      {showConfirm && (
        <div className="overlay anim-fade">
          <div className="card anim-in" style={{ maxWidth: '380px', width: '100%', margin: '1rem', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem' }}>Submit Test?</h3>
            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Answered: {answered} / 20</p>
            {answered < 20 && <p style={{ fontSize: '0.875rem', color: '#d97706', fontWeight: 600, marginTop: '0.25rem' }}>{20 - answered} unanswered</p>}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowConfirm(false)}>Go Back</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => { setShowConfirm(false); handleSubmit(); }}
                disabled={submitting} id="confirm-submit">
                {submitting ? 'Submitting...' : 'Confirm Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
