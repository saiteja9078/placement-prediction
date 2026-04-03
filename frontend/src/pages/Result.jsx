import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../utils/api';
import { CheckCircle, AlertTriangle, Check, AlertOctagon, Target, Briefcase, BookOpen, TrendingUp, Shield } from 'lucide-react';

function ScoreRow({ label, score, max, avg, color }) {
  const pct = Math.min((score / max) * 100, 100);
  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
        <span style={{ color: '#6b7280', fontWeight: 500 }}>{label}</span>
        <span style={{ fontWeight: 600, color: '#111827' }}>{score} / {max}</span>
      </div>
      <div className="score-track">
        <div className="score-fill" style={{ width: `${pct}%`, background: color }}></div>
      </div>
      {avg != null && <div style={{ fontSize: '0.6875rem', color: '#9ca3af', marginTop: '0.125rem' }}>Placed avg: {avg}</div>}
    </div>
  );
}

function Gauge({ probability }) {
  const pct = Math.round(probability * 100);
  const r = 54, c = 2 * Math.PI * r, off = c - (pct / 100) * c;
  const col = pct >= 60 ? '#22c55e' : pct >= 40 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="70" cy="70" r={r} fill="none" stroke="#f3f4f6" strokeWidth="10" />
        <circle cx="70" cy="70" r={r} fill="none" stroke={col} strokeWidth="10"
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }} />
      </svg>
      <div style={{ marginTop: '-96px', textAlign: 'center', marginBottom: '36px' }}>
        <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{pct}%</div>
        <div style={{ fontSize: '0.625rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Probability</div>
      </div>
    </div>
  );
}

function PriorityBadge({ priority }) {
  const colors = {
    Critical: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
    High: { bg: '#fff7ed', color: '#ea580c', border: '#fed7aa' },
    Medium: { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
    Low: { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  };
  const c = colors[priority] || colors.Medium;
  return (
    <span style={{ fontSize: '0.6875rem', fontWeight: 600, padding: '0.125rem 0.5rem', borderRadius: '9999px', background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
      {priority}
    </span>
  );
}

function SectionCard({ icon: Icon, iconColor, title, children }) {
  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        {Icon && <Icon size={18} color={iconColor || '#6b7280'} />}
        <div className="section-label" style={{ margin: 0 }}>{title}</div>
      </div>
      {children}
    </div>
  );
}

export default function Result() {
  const { studentId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('overview');
  const [loadSource, setLoadSource] = useState('');

  useEffect(() => {
    // Try to load stored results first (GET), only POST if no stored result
    api.getResult(studentId)
      .then(d => {
        if (d && d.prediction && !d.needsPrediction) {
          setData(d);
          setLoadSource('stored');
          setLoading(false);
        } else {
          throw new Error('No stored result');
        }
      })
      .catch(() => {
        // No stored result — run prediction
        api.predict(studentId)
          .then(d => { setData(d); setLoadSource('fresh'); setLoading(false); })
          .catch(err => {
            // Last resort: try loading student data directly
            api.getStudent(studentId).then(s => {
              if (s.mlProbability != null) {
                setData({
                  student: s,
                  prediction: { probability: s.mlProbability, prediction: s.mlPrediction },
                  geminiFeedback: s.geminiFeedbackParsed,
                  scoreBreakdown: null
                });
                setLoadSource('student');
              } else setError(err.message);
              setLoading(false);
            }).catch(() => { setError(err.message); setLoading(false); });
          });
      });
  }, [studentId]);

  if (loading) return (
    <div className="page-center">
      <div style={{ textAlign: 'center' }} className="anim-in">
        <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
        <h2 style={{ fontWeight: 600 }}>Generating Results</h2>
        <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>AI is analyzing your performance...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="page-center">
      <div className="card" style={{ maxWidth: '400px', textAlign: 'center' }}>
        <h2 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Error</h2>
        <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>{error}</p>
      </div>
    </div>
  );

  const { student: s, prediction: pred, geminiFeedback: f, scoreBreakdown: sb } = data;
  const placed = pred?.prediction === 'Placed';
  const fb = f || {};

  const tabs = [
    ['overview', 'Overview'],
    ['skillgap', 'Skill Gap'],
    ['career', 'Career Guidance'],
    ['feedback', 'AI Feedback'],
    ['plan', '30-Day Plan']
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: '3rem' }}>
      {/* Header */}
      <div style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)', padding: '1.25rem 2rem' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{s.name}</h1>
            <p style={{ fontSize: '0.8125rem', color: '#9ca3af' }}>
              Evaluation completed · {data.predictionCompletedAt ? new Date(data.predictionCompletedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              {loadSource === 'stored' && <span style={{ marginLeft: '0.5rem', color: '#3b82f6', fontSize: '0.6875rem' }}>● Loaded from saved results</span>}
            </p>
          </div>
          <span className={`badge ${placed ? 'badge-placed' : 'badge-notplaced'}`} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', padding: '0.375rem 0.75rem' }}>
            {placed ? <><CheckCircle size={14} /> Likely Placed</> : <><AlertTriangle size={14} /> Needs Improvement</>}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', padding: '0 2rem' }}>
          <div className="tab-bar" style={{ borderBottom: 'none' }}>
            {tabs.map(([k, l]) => (
              <button key={k} onClick={() => setTab(k)} className={`tab-item ${tab === k ? 'active' : ''}`}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '1.5rem 2rem' }}>

        {/* ── OVERVIEW TAB ── */}
        {tab === 'overview' && (
          <div className="anim-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div className="card" style={{ textAlign: 'center' }}>
                <div className="section-label">Placement Probability</div>
                <Gauge probability={pred.probability} />
                {pred.rawProbability != null && (
                  <div style={{ fontSize: '0.6875rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                    Raw ML: {(pred.rawProbability * 100).toFixed(1)}% · Weighted (80% ML + 20% Coding): {(pred.probability * 100).toFixed(1)}%
                  </div>
                )}
              </div>
              <div className="card">
                <div className="section-label">Score Breakdown</div>
                <ScoreRow label="Aptitude" score={sb?.aptitude?.mapped || s.aptitudeTestScore || 0} max={90} avg={84.46} color="#3b82f6" />
                <ScoreRow label="Coding" score={sb?.coding?.total ?? s.codingTotalScore ?? 0} max={30} avg={21} color="#22c55e" />
                <ScoreRow label="Communication" score={sb?.communication?.mapped || s.softSkillsRating || 0} max={4.8} avg={4.53} color="#8b5cf6" />
                <ScoreRow label="CGPA" score={s.cgpa} max={9.1} avg={8.02} color="#f59e0b" />
              </div>
            </div>

            {/* Coding detail */}
            <div className="card">
              <div className="section-label">Coding Breakdown</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                {[['Q1 · Easy', s.codingQ1Score], ['Q2 · Medium', s.codingQ2Score], ['Q3 · Hard', s.codingQ3Score]].map(([l, v], i) => (
                  <div key={i} style={{ background: 'var(--card)', borderRadius: '0.5rem', padding: '1rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{v ?? 0}<span style={{ fontSize: '0.875rem', color: '#9ca3af', fontWeight: 400 }}>/10</span></div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.125rem' }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Profile */}
            <div className="card">
              <div className="section-label">Profile</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                {[`CGPA ${s.cgpa}`, `SSC ${s.sscMarks}%`, `HSC ${s.hscMarks}%`,
                  `${s.internships} internship${s.internships !== 1 ? 's' : ''}`,
                  `${s.projects} project${s.projects !== 1 ? 's' : ''}`,
                  `${s.workshopsCertifications} workshop${s.workshopsCertifications !== 1 ? 's' : ''}`,
                  `Extracurricular: ${s.extracurricularActivities}`, `Training: ${s.placementTraining}`
                ].map((item, i) => <span key={i} className="badge badge-neutral">{item}</span>)}
              </div>
            </div>

            {/* Summary */}
            {fb.overallSummary && (
              <div className="card" style={{ borderLeft: `3px solid ${placed ? '#22c55e' : '#f59e0b'}` }}>
                <p style={{ fontSize: '0.9375rem', color: '#374151', lineHeight: 1.7 }}>{fb.overallSummary}</p>
              </div>
            )}

            {/* Strengths */}
            {fb.strengths?.length > 0 && (
              <SectionCard icon={Check} iconColor="var(--success)" title="Strengths">
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {fb.strengths.map((str, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.9375rem', color: '#374151', marginBottom: '0.5rem' }}>
                      <Check size={18} color="var(--success)" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </SectionCard>
            )}

            {/* Competitive Advantage */}
            {fb.competitiveAdvantage && (
              <SectionCard icon={Shield} iconColor="#2563eb" title="Competitive Advantage">
                <p style={{ fontSize: '0.9375rem', color: '#374151', lineHeight: 1.7, marginBottom: '0.5rem' }}>{fb.competitiveAdvantage.uniqueStrengths}</p>
                {fb.competitiveAdvantage.differentiators?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                    {fb.competitiveAdvantage.differentiators.map((d, i) => (
                      <span key={i} className="badge" style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>{d}</span>
                    ))}
                  </div>
                )}
              </SectionCard>
            )}
          </div>
        )}

        {/* ── SKILL GAP TAB ── */}
        {tab === 'skillgap' && (
          <div className="anim-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Blind Spots */}
            {fb.blindSpots?.length > 0 && (
              <SectionCard icon={AlertOctagon} iconColor="#dc2626" title="Blind Spots — Hidden Weaknesses">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {fb.blindSpots.map((bs, i) => (
                    <div key={i} style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.5rem', padding: '0.875rem' }}>
                      <div style={{ fontWeight: 600, color: '#991b1b', marginBottom: '0.375rem' }}>{bs.area}</div>
                      <p style={{ fontSize: '0.875rem', color: '#374151', lineHeight: 1.6, marginBottom: '0.25rem' }}>{bs.details}</p>
                      <p style={{ fontSize: '0.8125rem', color: '#b91c1c', marginBottom: '0.25rem' }}>
                        <strong>Impact:</strong> {bs.impact}
                      </p>
                      <p style={{ fontSize: '0.8125rem', color: '#15803d' }}>
                        <strong>Fix:</strong> {bs.fix}
                      </p>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Skill Gap Analysis */}
            {fb.skillGapAnalysis?.length > 0 && (
              <SectionCard icon={Target} iconColor="#ea580c" title="Skill Gap Analysis">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {fb.skillGapAnalysis.map((gap, i) => (
                    <div key={i} style={{ background: 'var(--bg)', borderRadius: '0.5rem', padding: '0.875rem', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 600, color: '#111827' }}>{gap.skill}</span>
                        <PriorityBadge priority={gap.priority} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <div style={{ textAlign: 'center', padding: '0.375rem', background: 'rgba(220,38,38,0.06)', borderRadius: '0.375rem' }}>
                          <div style={{ fontSize: '0.625rem', color: '#9ca3af' }}>Current</div>
                          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#dc2626' }}>{gap.currentLevel}</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '0.375rem', background: 'rgba(217,119,6,0.06)', borderRadius: '0.375rem' }}>
                          <div style={{ fontSize: '0.625rem', color: '#9ca3af' }}>Gap</div>
                          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#d97706' }}>{gap.gapPercentage != null ? `${gap.gapPercentage}%` : '—'}</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '0.375rem', background: 'rgba(22,163,74,0.06)', borderRadius: '0.375rem' }}>
                          <div style={{ fontSize: '0.625rem', color: '#9ca3af' }}>Target</div>
                          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#16a34a' }}>{gap.requiredLevel}</div>
                        </div>
                      </div>
                      {gap.resources?.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                          {gap.resources.map((r, j) => (
                            <span key={j} style={{ fontSize: '0.6875rem', padding: '0.125rem 0.5rem', background: '#f0f9ff', color: '#0369a1', borderRadius: '0.25rem', border: '1px solid #bae6fd' }}>{r}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Risk Factors */}
            {fb.riskFactors?.length > 0 && (
              <SectionCard icon={AlertTriangle} iconColor="#d97706" title="Risk Factors">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {fb.riskFactors.map((risk, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.75rem', background: 'var(--bg)', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                      <PriorityBadge priority={risk.severity} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500, fontSize: '0.875rem', color: '#111827' }}>{risk.risk}</div>
                        <div style={{ fontSize: '0.8125rem', color: '#16a34a', marginTop: '0.25rem' }}><strong>Mitigation:</strong> {risk.mitigation}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Areas of Improvement */}
            {fb.areasOfImprovement?.length > 0 && (
              <SectionCard icon={TrendingUp} iconColor="#8b5cf6" title="Areas of Improvement">
                {fb.areasOfImprovement.map((area, i) => (
                  <div key={i} style={{ marginBottom: i < fb.areasOfImprovement.length - 1 ? '0.75rem' : 0 }}>
                    <h4 style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#111827' }}>{area.area}</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      {[['Current', area.currentStatus, 'rgba(220,38,38,0.1)', 'var(--danger)'], ['Gap', area.gap, 'rgba(217,119,6,0.1)', 'var(--warn)'], ['Target', area.target, 'rgba(22,163,74,0.1)', 'var(--success)']].map(([lbl, val, bg, col], j) => (
                        <div key={j} style={{ background: bg, borderRadius: '0.5rem', padding: '0.75rem', textAlign: 'center' }}>
                          <div style={{ fontSize: '0.6875rem', color: '#9ca3af' }}>{lbl}</div>
                          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: col }}>{val}</div>
                        </div>
                      ))}
                    </div>
                    <p style={{ fontSize: '0.875rem', color: '#374151', lineHeight: 1.6 }}>{area.actionPlan}</p>
                  </div>
                ))}
              </SectionCard>
            )}

            {!fb.blindSpots && !fb.skillGapAnalysis && !fb.riskFactors && !fb.areasOfImprovement && (
              <div className="card" style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>
                <p>Skill gap analysis not available. Run a new prediction to generate AI feedback.</p>
              </div>
            )}
          </div>
        )}

        {/* ── CAREER GUIDANCE TAB ── */}
        {tab === 'career' && (
          <div className="anim-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Career Paths */}
            {fb.careerGuidance && (
              <>
                <SectionCard icon={Briefcase} iconColor="#7c3aed" title="Career Path Recommendations">
                  {fb.careerGuidance.companyTier && (
                    <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '0.5rem', padding: '0.75rem', marginBottom: '0.75rem' }}>
                      <div style={{ fontSize: '0.75rem', color: '#7c3aed', fontWeight: 600, marginBottom: '0.25rem' }}>Company Tier Recommendation</div>
                      <p style={{ fontSize: '0.9375rem', color: '#374151', lineHeight: 1.6 }}>{fb.careerGuidance.companyTier}</p>
                    </div>
                  )}
                  {fb.careerGuidance.recommendedPaths?.length > 0 && (
                    <div style={{ marginBottom: '0.75rem' }}>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600, marginBottom: '0.375rem' }}>Recommended Career Paths</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                        {fb.careerGuidance.recommendedPaths.map((p, i) => (
                          <span key={i} className="badge" style={{ background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe' }}>{p}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {fb.careerGuidance.roleRecommendations?.length > 0 && (
                    <div style={{ marginBottom: '0.75rem' }}>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600, marginBottom: '0.375rem' }}>Suitable Roles</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                        {fb.careerGuidance.roleRecommendations.map((r, i) => (
                          <span key={i} className="badge" style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>{r}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {fb.careerGuidance.industryFit && (
                    <p style={{ fontSize: '0.875rem', color: '#374151', lineHeight: 1.6 }}><strong>Industry Fit:</strong> {fb.careerGuidance.industryFit}</p>
                  )}
                </SectionCard>
              </>
            )}

            {/* Interview Prep */}
            {fb.interviewPrep && (
              <SectionCard icon={BookOpen} iconColor="#2563eb" title="Interview Preparation">
                {fb.interviewPrep.readinessScore != null && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', padding: '0.75rem', background: '#f0f9ff', borderRadius: '0.5rem', border: '1px solid #bae6fd' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: fb.interviewPrep.readinessScore >= 7 ? '#16a34a' : fb.interviewPrep.readinessScore >= 4 ? '#d97706' : '#dc2626' }}>
                      {fb.interviewPrep.readinessScore}/10
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#374151' }}>Interview Readiness Score</div>
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  {fb.interviewPrep.technicalTips?.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', marginBottom: '0.375rem' }}>Technical Tips</div>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {fb.interviewPrep.technicalTips.map((t, i) => (
                          <li key={i} style={{ fontSize: '0.8125rem', color: '#374151', marginBottom: '0.375rem', paddingLeft: '1rem', position: 'relative' }}>
                            <span style={{ position: 'absolute', left: 0, color: '#3b82f6' }}>•</span>{t}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {fb.interviewPrep.hrTips?.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', marginBottom: '0.375rem' }}>HR Tips</div>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {fb.interviewPrep.hrTips.map((t, i) => (
                          <li key={i} style={{ fontSize: '0.8125rem', color: '#374151', marginBottom: '0.375rem', paddingLeft: '1rem', position: 'relative' }}>
                            <span style={{ position: 'absolute', left: 0, color: '#8b5cf6' }}>•</span>{t}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                {fb.interviewPrep.commonMistakesToAvoid?.length > 0 && (
                  <div style={{ marginTop: '0.75rem', background: '#fffbeb', borderRadius: '0.5rem', padding: '0.75rem', border: '1px solid #fde68a' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#92400e', marginBottom: '0.375rem' }}>Common Mistakes to Avoid</div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {fb.interviewPrep.commonMistakesToAvoid.map((m, i) => (
                        <li key={i} style={{ fontSize: '0.8125rem', color: '#374151', marginBottom: '0.25rem' }}>⚠ {m}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </SectionCard>
            )}

            {!fb.careerGuidance && !fb.interviewPrep && (
              <div className="card" style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>
                <p>Career guidance not available. Run a new prediction to generate AI feedback.</p>
              </div>
            )}
          </div>
        )}

        {/* ── AI FEEDBACK TAB ── */}
        {tab === 'feedback' && (
          <div className="anim-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Coding Feedback (detailed) */}
            {fb.codingFeedback && (
              <SectionCard icon={null} title="Coding Analysis">
                {typeof fb.codingFeedback === 'string' ? (
                  <p style={{ fontSize: '0.9375rem', color: '#374151', lineHeight: 1.7 }}>{fb.codingFeedback}</p>
                ) : (
                  <>
                    <p style={{ fontSize: '0.9375rem', color: '#374151', lineHeight: 1.7, marginBottom: '0.75rem' }}>{fb.codingFeedback.overall}</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      {[['Easy (Q1)', fb.codingFeedback.easyAnalysis, '#ecfdf5'], ['Medium (Q2)', fb.codingFeedback.mediumAnalysis, '#fffbeb'], ['Hard (Q3)', fb.codingFeedback.hardAnalysis, '#fef2f2']].map(([title, text, bg], i) => (
                        <div key={i} style={{ background: bg, borderRadius: '0.5rem', padding: '0.75rem' }}>
                          <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#6b7280', marginBottom: '0.25rem' }}>{title}</div>
                          <p style={{ fontSize: '0.8125rem', color: '#374151', lineHeight: 1.5 }}>{text}</p>
                        </div>
                      ))}
                    </div>
                    {fb.codingFeedback.pattern && <p style={{ fontSize: '0.875rem', color: '#374151', lineHeight: 1.6, marginBottom: '0.5rem' }}><strong>Pattern:</strong> {fb.codingFeedback.pattern}</p>}
                    {fb.codingFeedback.topicsToFocus?.length > 0 && (
                      <div style={{ marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280' }}>Topics to Focus: </span>
                        {fb.codingFeedback.topicsToFocus.map((t, i) => (
                          <span key={i} className="badge badge-neutral" style={{ marginLeft: '0.25rem' }}>{t}</span>
                        ))}
                      </div>
                    )}
                    {fb.codingFeedback.practiceRecommendation && <p style={{ fontSize: '0.875rem', color: '#374151', lineHeight: 1.6 }}>{fb.codingFeedback.practiceRecommendation}</p>}
                  </>
                )}
              </SectionCard>
            )}

            {/* Communication Feedback (detailed) */}
            {fb.communicationFeedback && (
              <SectionCard icon={null} title="Communication Analysis">
                {typeof fb.communicationFeedback === 'string' ? (
                  <p style={{ fontSize: '0.9375rem', color: '#374151', lineHeight: 1.7 }}>{fb.communicationFeedback}</p>
                ) : (
                  <>
                    <p style={{ fontSize: '0.9375rem', color: '#374151', lineHeight: 1.7, marginBottom: '0.5rem' }}>{fb.communicationFeedback.overall}</p>
                    {fb.communicationFeedback.interviewReadiness && <p style={{ fontSize: '0.875rem', color: '#374151', lineHeight: 1.6, marginBottom: '0.5rem' }}><strong>Interview Readiness:</strong> {fb.communicationFeedback.interviewReadiness}</p>}
                    {fb.communicationFeedback.improvementTips?.length > 0 && (
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {fb.communicationFeedback.improvementTips.map((t, i) => (
                          <li key={i} style={{ fontSize: '0.8125rem', color: '#374151', marginBottom: '0.375rem', paddingLeft: '1rem', position: 'relative' }}>
                            <span style={{ position: 'absolute', left: 0, color: '#8b5cf6' }}>→</span>{t}
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </SectionCard>
            )}

            {/* Aptitude Feedback (detailed) */}
            {fb.aptitudeFeedback && (
              <SectionCard icon={null} title="Aptitude Analysis">
                {typeof fb.aptitudeFeedback === 'string' ? (
                  <p style={{ fontSize: '0.9375rem', color: '#374151', lineHeight: 1.7 }}>{fb.aptitudeFeedback}</p>
                ) : (
                  <>
                    <p style={{ fontSize: '0.9375rem', color: '#374151', lineHeight: 1.7, marginBottom: '0.5rem' }}>{fb.aptitudeFeedback.overall}</p>
                    {fb.aptitudeFeedback.accuracy && <p style={{ fontSize: '0.875rem', color: '#374151', marginBottom: '0.5rem' }}><strong>Accuracy:</strong> {fb.aptitudeFeedback.accuracy}</p>}
                    {fb.aptitudeFeedback.weakAreas?.length > 0 && (
                      <div style={{ marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280' }}>Weak Areas: </span>
                        {fb.aptitudeFeedback.weakAreas.map((a, i) => (
                          <span key={i} className="badge" style={{ marginLeft: '0.25rem', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>{a}</span>
                        ))}
                      </div>
                    )}
                    {fb.aptitudeFeedback.resources?.length > 0 && (
                      <div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280' }}>Resources: </span>
                        {fb.aptitudeFeedback.resources.map((r, i) => (
                          <span key={i} className="badge" style={{ marginLeft: '0.25rem', background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd' }}>{r}</span>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </SectionCard>
            )}

            {/* Academic Feedback (detailed) */}
            {fb.academicFeedback && (
              <SectionCard icon={null} title="Academic Analysis">
                {typeof fb.academicFeedback === 'string' ? (
                  <p style={{ fontSize: '0.9375rem', color: '#374151', lineHeight: 1.7 }}>{fb.academicFeedback}</p>
                ) : (
                  <>
                    {fb.academicFeedback.cgpaAnalysis && <p style={{ fontSize: '0.9375rem', color: '#374151', lineHeight: 1.7, marginBottom: '0.5rem' }}>{fb.academicFeedback.cgpaAnalysis}</p>}
                    {fb.academicFeedback.trend && <p style={{ fontSize: '0.875rem', color: '#374151', marginBottom: '0.5rem' }}><strong>Academic Trend:</strong> {fb.academicFeedback.trend}</p>}
                    {fb.academicFeedback.impact && <p style={{ fontSize: '0.875rem', color: '#374151' }}><strong>Impact:</strong> {fb.academicFeedback.impact}</p>}
                  </>
                )}
              </SectionCard>
            )}

            {/* Prediction Explanation */}
            {fb.prediction?.verdictExplanation && (
              <div className="card" style={{ borderLeft: `3px solid ${placed ? '#22c55e' : '#f59e0b'}`, background: '#f8fafc' }}>
                <div className="section-label">Prediction Explanation</div>
                <p style={{ fontSize: '0.9375rem', color: '#374151', lineHeight: 1.7 }}>{fb.prediction.verdictExplanation}</p>
              </div>
            )}

            {/* Motivational Close */}
            {fb.motivationalClose && (
              <div className="card" style={{ borderLeft: '3px solid #3b82f6', background: '#f8fafc' }}>
                <p style={{ fontSize: '0.9375rem', color: '#374151', fontStyle: 'italic', lineHeight: 1.7 }}>{fb.motivationalClose}</p>
              </div>
            )}
          </div>
        )}

        {/* ── 30-DAY PLAN TAB ── */}
        {tab === 'plan' && (
          <div className="anim-fade">
            <div className="card">
              <div className="section-label">30-Day Improvement Plan</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {fb.thirtyDayPlan?.map((week, i) => {
                  // Support both string format and object format
                  const isObj = typeof week === 'object' && week !== null;
                  return (
                    <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                      <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#2563eb', flexShrink: 0 }}>
                        W{isObj ? (week.week || i + 1) : i + 1}
                      </div>
                      <div style={{ flex: 1, background: 'var(--bg)', borderRadius: '0.5rem', padding: '0.875rem 1rem', border: '1px solid var(--border)' }}>
                        {isObj ? (
                          <>
                            <div style={{ fontWeight: 600, color: '#111827', marginBottom: '0.375rem' }}>{week.focus}</div>
                            {week.dailyHours && <div style={{ fontSize: '0.6875rem', color: '#9ca3af', marginBottom: '0.375rem' }}>{week.dailyHours} hours/day</div>}
                            {week.tasks?.length > 0 && (
                              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                {week.tasks.map((t, j) => (
                                  <li key={j} style={{ fontSize: '0.875rem', color: '#374151', marginBottom: '0.25rem', paddingLeft: '1rem', position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: 0 }}>▸</span>{t}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </>
                        ) : (
                          <p style={{ fontSize: '0.9375rem', color: '#374151', lineHeight: 1.6 }}>{week}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {!fb.thirtyDayPlan && (
              <div className="card" style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>
                <p>30-day plan not available. Run a new prediction to generate AI feedback.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
