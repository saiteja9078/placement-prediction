const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await res.json().catch(() => ({ error: res.statusText }));

  // If server says "already completed", return the data (don't throw)
  if (data.alreadyCompleted) {
    return data;
  }

  if (!res.ok) {
    throw new Error(data.error || 'API request failed');
  }
  return data;
}

export const api = {
  // Students
  register: (data) => apiFetch('/students/register', { method: 'POST', body: JSON.stringify(data) }),
  getStudent: (id) => apiFetch(`/students/${id}`),
  getPhase: (id) => apiFetch(`/students/${id}/phase`),

  // Aptitude
  getAptitudeQuestions: (studentId) => apiFetch(`/aptitude/questions?studentId=${studentId}`),
  submitAptitude: (data) => apiFetch('/aptitude/submit', { method: 'POST', body: JSON.stringify(data) }),
  getAptitudeResult: (studentId) => apiFetch(`/aptitude/result?studentId=${studentId}`),

  // Coding
  getCodingQuestions: (studentId) => apiFetch(`/coding/questions${studentId ? `?studentId=${studentId}` : ''}`),
  runCode: (data) => apiFetch('/coding/run', { method: 'POST', body: JSON.stringify(data) }),
  submitCode: (data) => apiFetch('/coding/submit', { method: 'POST', body: JSON.stringify(data) }),
  finalizeCoding: (studentId) => apiFetch('/coding/finalize', { method: 'POST', body: JSON.stringify({ studentId }) }),

  // Communication
  getCommunicationQuestions: (studentId) => apiFetch(`/communication/questions${studentId ? `?studentId=${studentId}` : ''}`),
  evaluateCommunication: (data) => apiFetch('/communication/evaluate', { method: 'POST', body: JSON.stringify(data) }),

  // Predict
  getResult: (studentId) => apiFetch(`/predict/${studentId}`),
  predict: (studentId) => apiFetch(`/predict/${studentId}`, { method: 'POST' }),
};
