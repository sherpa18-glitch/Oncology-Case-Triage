const BASE = 'http://localhost:3001';

async function req(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...opts.headers },
    ...opts
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

export const api = {
  health:       ()         => req('/api/health'),
  submitCase:   (body)     => req('/api/cases', { method:'POST', body: JSON.stringify(body) }),
  getCase:      (id)       => req(`/api/cases/${id}`),
  getCases:     (limit=20) => req(`/api/cases?limit=${limit}`),
  getMetrics:   (range)    => req(`/api/metrics${range ? `?range=${range}` : ''}`),
  getPatients:  ()         => req('/api/patients'),
  getGoldenCases: ()       => req('/api/golden-cases'),
  getConfig:    ()         => req('/api/config'),
  draftAction:  (id, body) => req(`/api/cases/${id}/draft-action`, { method:'POST', body: JSON.stringify(body) }),
  override:     (id, body) => req(`/api/cases/${id}/override`,      { method:'POST', body: JSON.stringify(body) }),

  streamCase(caseId, onEvent) {
    const es = new EventSource(`${BASE}/api/stream/${caseId}`);
    es.onmessage = e => { try { onEvent(JSON.parse(e.data)); } catch(_){} };
    es.onerror   = () => es.close();
    return () => es.close();
  }
};
