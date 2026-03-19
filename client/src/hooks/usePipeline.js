import { useState, useCallback, useRef } from 'react'

const STEP_ORDER = [
  'classify_case',
  'retrieve_patient_context',
  'apply_routing_rules',
  'draft_response',
  'assign_to_queue'
]

const STEP_META = {
  classify_case:            { label: 'Case Classifier',    icon: 'tag' },
  retrieve_patient_context: { label: 'Context Retriever',  icon: 'database' },
  apply_routing_rules:      { label: 'Rules Engine',       icon: 'shield' },
  draft_response:           { label: 'Response Drafter',   icon: 'file-text' },
  assign_to_queue:          { label: 'Case Router',        icon: 'git-branch' },
}

export function usePipeline() {
  const [status, setStatus]     = useState('idle')   // idle | submitting | processing | complete | failed
  const [caseId, setCaseId]     = useState(null)
  const [steps, setSteps]       = useState(initSteps())
  const [decision, setDecision] = useState(null)
  const [mttca, setMttca]       = useState(null)
  const [error, setError]       = useState(null)
  const esRef = useRef(null)

  function initSteps() {
    return STEP_ORDER.map(key => ({
      key,
      ...STEP_META[key],
      status:     'pending',
      latency_ms: null,
      confidence: null,
      summary:    null,
      result:     null,
    }))
  }

  const reset = useCallback(() => {
    if (esRef.current) { esRef.current.close(); esRef.current = null }
    setStatus('idle')
    setCaseId(null)
    setSteps(initSteps())
    setDecision(null)
    setMttca(null)
    setError(null)
  }, [])

  const submitCase = useCallback(async (payload) => {
    reset()
    setStatus('submitting')

    try {
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Submission failed')

      setCaseId(data.case_id)
      setStatus('processing')

      // Connect SSE
      const es = new EventSource(`/api/stream/${data.case_id}`)
      esRef.current = es

      es.onmessage = (e) => {
        const evt = JSON.parse(e.data)
        handleEvent(evt)
      }
      es.onerror = () => {
        es.close()
        // Fallback: poll
        pollForResult(data.case_id)
      }

      return data.case_id
    } catch (err) {
      setStatus('failed')
      setError(err.message)
    }
  }, [reset])

  function handleEvent(evt) {
    switch (evt.type) {
      case 'step_running':
        setSteps(prev => prev.map(s =>
          s.key === evt.step ? { ...s, status: 'running' } : s
        ))
        break
      case 'step_complete':
        setSteps(prev => prev.map(s =>
          s.key === evt.step
            ? { ...s, status: 'complete', latency_ms: evt.latency_ms, confidence: evt.confidence, summary: evt.summary, result: evt.result }
            : s
        ))
        break
      case 'step_failed':
        setSteps(prev => prev.map(s =>
          s.key === evt.step ? { ...s, status: 'failed', summary: evt.error } : s
        ))
        break
      case 'pipeline_complete':
        setDecision(evt.decision)
        setMttca(evt.mttca_seconds)
        setStatus('complete')
        if (esRef.current) { esRef.current.close(); esRef.current = null }
        break
      case 'pipeline_failed':
        setError(evt.error)
        setStatus('failed')
        if (esRef.current) { esRef.current.close(); esRef.current = null }
        break
    }
  }

  async function pollForResult(caseId, attempts = 0) {
    if (attempts > 30) { setStatus('failed'); setError('Timeout waiting for result'); return }
    await new Promise(r => setTimeout(r, 2000))
    try {
      const res  = await fetch(`/api/cases/${caseId}`)
      const data = await res.json()
      if (data.status === 'complete' && data.decision) {
        setDecision(data.decision)
        setMttca(data.mttca_seconds)
        setStatus('complete')
        // Reconstruct steps from decision timings
        if (data.decision.step_timings) {
          setSteps(prev => prev.map(s => ({
            ...s,
            status: 'complete',
            latency_ms: data.decision.step_timings[s.key] || null,
            summary: data.decision.step_summaries?.[s.key] || null,
          })))
        }
      } else if (data.status === 'failed') {
        setStatus('failed'); setError('Pipeline failed')
      } else {
        pollForResult(caseId, attempts + 1)
      }
    } catch { pollForResult(caseId, attempts + 1) }
  }

  const submitAction = useCallback(async (caseId, action, payload = {}) => {
    await fetch(`/api/cases/${caseId}/action`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...payload })
    })
  }, [])

  return { status, caseId, steps, decision, mttca, error, submitCase, submitAction, reset }
}
