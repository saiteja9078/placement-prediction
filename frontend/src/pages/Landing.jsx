import { useNavigate } from 'react-router-dom';
import { ClipboardList, BrainCircuit, Code2, Mic } from 'lucide-react';

const phases = [
  { num: 1, title: 'Profile', desc: 'Academic & experience details', icon: <ClipboardList size={24} /> },
  { num: 2, title: 'Aptitude Test', desc: '20 MCQ questions · 30 minutes', icon: <BrainCircuit size={24} /> },
  { num: 3, title: 'Coding Exam', desc: '3 problems · Easy, Medium, Hard', icon: <Code2 size={24} /> },
  { num: 4, title: 'Communication', desc: 'AI-evaluated speech assessment', icon: <Mic size={24} /> },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="page-center hero-bg" style={{ alignItems: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'row', gap: '4.5rem', alignItems: 'center', maxWidth: '1080px', width: '100%', position: 'relative', zIndex: 1 }} className="landing-split">
        {/* Left Side: Copy */}
        <div style={{ flex: 1 }} className="anim-in">
          <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--accent)', marginBottom: '1rem' }}>
            AI-Powered Assessment
          </div>
          <h1 className="gradient-text" style={{ fontSize: '3.75rem', fontWeight: 800, marginBottom: '0.75rem', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
            PlaceMeter
          </h1>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.25rem', letterSpacing: '-0.01em' }}>
            Debug your career properly.
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.0625rem', lineHeight: 1.6, marginBottom: '2.5rem', maxWidth: '440px' }}>
            A complete evaluation suite designed to prepare you for tech interviews. Validate your coding skills, aptitude, and communication.
          </p>
          
          <button onClick={() => navigate('/register')} className="btn btn-primary btn-lg anim-glow" id="start-evaluation"
            style={{ padding: '1rem 2.5rem', fontSize: '1.125rem' }}>
            Get Started →
          </button>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
            Approximately 45–60 minutes to complete
          </div>
        </div>

        {/* Right Side: Features */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {phases.map((p, i) => (
            <div key={i} className="phase-card anim-in" style={{ animationDelay: `${i * 0.1}s`, background: 'var(--bg-elevated)', padding: '1.25rem 1.75rem', border: '1px solid var(--border)' }}>
              <div className="phase-icon" style={{ background: 'var(--accent-glow)', borderColor: 'var(--accent-border)' }}>{p.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.125rem' }}>
                  Phase {p.num}: {p.title}
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{p.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <style>{`
        @media (max-width: 860px) {
          .landing-split {
            flex-direction: column !important;
            gap: 3rem !important;
            text-align: center;
          }
          .landing-split > div {
            width: 100%;
          }
          .landing-split p {
            margin-left: auto;
            margin-right: auto;
          }
          .phase-card {
            text-align: left;
          }
        }
      `}</style>
    </div>
  );
}
