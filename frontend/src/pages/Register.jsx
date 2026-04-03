import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', email: '', rollNumber: '',
    cgpa: '', internships: '0', projects: '0',
    workshopsCertifications: '0', extracurricularActivities: 'Yes',
    placementTraining: 'Yes', sscMarks: '', hscMarks: ''
  });

  const update = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        ...form,
        cgpa: parseFloat(form.cgpa),
        internships: parseInt(form.internships),
        projects: parseInt(form.projects),
        workshopsCertifications: parseInt(form.workshopsCertifications),
        sscMarks: parseInt(form.sscMarks),
        hscMarks: parseInt(form.hscMarks),
      };
      const { studentId } = await api.register(payload);
      navigate(`/aptitude/${studentId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <div className="page-container" style={{ maxWidth: '640px' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }} className="anim-in">
          <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>
            Phase 1 of 4 · Profile
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>Student Profile</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Enter your academic and experience details
          </p>
          <div className="progress-track" style={{ marginTop: '1rem', width: '200px' }}>
            <div className="progress-fill" style={{ width: '25%' }}></div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Personal Info */}
          <div className="card anim-in" style={{ marginBottom: '1.25rem' }}>
            <div className="section-label">Personal Information</div>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" required value={form.name}
                onChange={e => update('name', e.target.value)} placeholder="Enter your full name" />
            </div>
            <div className="form-row form-row-2">
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" required value={form.email}
                  onChange={e => update('email', e.target.value)} placeholder="you@email.com" />
              </div>
              <div className="form-group">
                <label className="form-label">Roll Number</label>
                <input className="form-input" required value={form.rollNumber}
                  onChange={e => update('rollNumber', e.target.value)} placeholder="21CS101" />
              </div>
            </div>
          </div>

          {/* Academic Record */}
          <div className="card anim-in" style={{ marginBottom: '1.25rem', animationDelay: '0.05s' }}>
            <div className="section-label">Academic Record</div>
            <div className="form-row form-row-3">
              <div className="form-group">
                <label className="form-label">CGPA <span className="hint">(0–10)</span></label>
                <input className="form-input" type="number" step="0.01" min="0" max="10" required
                  value={form.cgpa} onChange={e => update('cgpa', e.target.value)} placeholder="8.0" />
              </div>
              <div className="form-group">
                <label className="form-label">SSC % <span className="hint">(0–100)</span></label>
                <input className="form-input" type="number" min="0" max="100" required
                  value={form.sscMarks} onChange={e => update('sscMarks', e.target.value)} placeholder="79" />
              </div>
              <div className="form-group">
                <label className="form-label">HSC % <span className="hint">(0–100)</span></label>
                <input className="form-input" type="number" min="0" max="100" required
                  value={form.hscMarks} onChange={e => update('hscMarks', e.target.value)} placeholder="82" />
              </div>
            </div>
          </div>

          {/* Experience */}
          <div className="card anim-in" style={{ marginBottom: '1.5rem', animationDelay: '0.1s' }}>
            <div className="section-label">Experience & Activities</div>
            <div className="form-row form-row-3" style={{ marginBottom: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Internships</label>
                <select className="form-select" value={form.internships}
                  onChange={e => update('internships', e.target.value)}>
                  {[0,1,2,3,4,5].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Projects</label>
                <select className="form-select" value={form.projects}
                  onChange={e => update('projects', e.target.value)}>
                  {[0,1,2,3,4,5,6,7,8,9,10].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Workshops / Certs</label>
                <select className="form-select" value={form.workshopsCertifications}
                  onChange={e => update('workshopsCertifications', e.target.value)}>
                  {[0,1,2,3,4,5].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row form-row-2">
              <div className="form-group">
                <label className="form-label">Extracurricular Activities</label>
                <select className="form-select" value={form.extracurricularActivities}
                  onChange={e => update('extracurricularActivities', e.target.value)}>
                  <option value="Yes">Yes</option><option value="No">No</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Placement Training</label>
                <select className="form-select" value={form.placementTraining}
                  onChange={e => update('placementTraining', e.target.value)}>
                  <option value="Yes">Yes</option><option value="No">No</option>
                </select>
              </div>
            </div>
          </div>

          {error && (
            <div style={{ color: 'var(--danger)', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: '0.5rem', padding: '0.75rem 1rem', fontSize: '0.875rem', marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading} id="submit-profile">
            {loading ? 'Saving...' : 'Continue to Aptitude Test →'}
          </button>
        </form>
      </div>
    </div>
  );
}
