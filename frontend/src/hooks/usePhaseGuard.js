import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const PHASE_ROUTES = {
  1: '/register',
  2: '/aptitude',
  3: '/coding',
  4: '/communication',
  5: '/result'
};

export function usePhaseGuard(studentId, requiredPhase) {
  const navigate = useNavigate();
  const [phaseInfo, setPhaseInfo] = useState({ currentPhase: null, loading: true, isCompleted: false });

  useEffect(() => {
    if (!studentId) { navigate('/'); return; }
    fetch(`/api/students/${studentId}/phase`)
      .then(r => r.json())
      .then(({ currentPhase }) => {
        setPhaseInfo({ currentPhase, loading: false, isCompleted: currentPhase > requiredPhase });

        // If student hasn't reached this phase yet, send back
        if (currentPhase < requiredPhase) {
          navigate(`${PHASE_ROUTES[currentPhase]}/${studentId}`);
        }
        // For aptitude (phase 2): if already completed, DON'T redirect — let the page show read-only results
        // For other phases: redirect forward
        else if (currentPhase > requiredPhase && requiredPhase !== 2) {
          navigate(`${PHASE_ROUTES[currentPhase]}/${studentId}`);
        }
      })
      .catch(() => navigate('/'));
  }, [studentId, requiredPhase, navigate]);

  return phaseInfo;
}
