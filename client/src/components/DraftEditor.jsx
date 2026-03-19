import { useState, useEffect } from 'react'
import { CheckCheck, RotateCcw, AlertCircle } from 'lucide-react'
import { ConfidenceGauge } from './ui'

const QUEUES = ['auto_resolved','order_management','clinical_support','pa_team','critical_value_escalation','unstructured_review']
const QUEUE_LABELS = {
  auto_resolved:'Auto Resolved', order_management:'Order Management',
  clinical_support:'Clinical Support', pa_team:'PA Team',
  critical_value_escalation:'Critical Escalation', unstructured_review:'Unstructured Review',
}

export default function DraftEditor({ decision, caseId, onAction }) {
  const [text, setText]       = useState('')
  const [accepted, setAccepted] = useState(false)
  const [showOverride, setShowOverride] = useState(false)
  const [overrideQ, setOverrideQ]       = useState('')
  const [originalText, setOriginalText] = useState('')

  useEffect(() => {
    if (decision?.draft_response) {
      setText(decision.draft_response)
      setOriginalText(decision.draft_response)
      setAccepted(false)
    }
  }, [decision?.draft_response])

  if (!decision?.draft_response) return null

  const editDistance = Math.abs(text.length - originalText.length) +
    [...text].filter((c, i) => c !== originalText[i]).length
  const accuracyScore = decision.clinical_accuracy_score
  const lowAccuracy   = accuracyScore != null && accuracyScore < 0.80

  const handleAccept = async () => {
    setAccepted(true)
    await onAction(caseId, 'accept_draft', { draft_accepted: true, edit_distance: editDistance })
  }

  const handleOverride = async () => {
    if (!overrideQ) return
    await onAction(caseId, 'override_routing', { override_queue: overrideQ })
    setShowOverride(false)
  }

  const s = {
    wrap:  { display:'flex', flexDirection:'column', gap:10 },
    header:{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 },
    meta:  { display:'flex', alignItems:'center', gap:8 },
    label: { fontSize:10, fontWeight:600, color:'var(--gray-500)', textTransform:'uppercase', letterSpacing:'0.06em' },
    warn:  { display:'flex', alignItems:'center', gap:6, padding:'7px 10px', borderRadius:'var(--radius-md)', background:'var(--warning-bg)', border:'1px solid var(--warning)30', marginBottom:4 },
    area:  { width:'100%', minHeight:140, padding:'10px 12px', borderRadius:'var(--radius-md)', border:'1px solid var(--gray-200)', fontSize:12.5, fontFamily:'var(--font-sans)', lineHeight:1.65, color:'var(--gray-800)', resize:'vertical', outline:'none', background: accepted ? 'var(--success-bg)' : '#fff', transition:'all .2s' },
    footer:{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 },
    chars: { fontSize:10, color:'var(--gray-400)', fontFamily:'var(--font-mono)' },
    actions:{ display:'flex', gap:6 },
    acceptBtn:{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:'var(--radius-md)', border:'none', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'var(--font-sans)', background: accepted?'var(--success)':'var(--gh-navy)', color:'#fff', transition:'all .15s' },
    overrideBtn:{ display:'flex', alignItems:'center', gap:6, padding:'7px 12px', borderRadius:'var(--radius-md)', border:'1px solid var(--gray-200)', fontSize:12, fontWeight:500, cursor:'pointer', fontFamily:'var(--font-sans)', background:'#fff', color:'var(--gray-600)', transition:'all .15s' },
    overridePanel:{ padding:'10px 12px', borderRadius:'var(--radius-md)', border:'1px solid var(--gray-200)', background:'var(--gray-50)', display:'flex', gap:8, alignItems:'center' },
    select:{ flex:1, padding:'6px 8px', borderRadius:'var(--radius-sm)', border:'1px solid var(--gray-200)', fontSize:12, fontFamily:'var(--font-sans)', outline:'none' },
    applyBtn:{ padding:'6px 12px', borderRadius:'var(--radius-sm)', border:'none', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'var(--font-sans)', background:'var(--gh-navy)', color:'#fff' },
  }

  return (
    <div style={s.wrap}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <span style={s.label}>AI Draft Response</span>
          {decision.draft_recipient_type && (
            <span style={{ fontSize:10, color:'var(--gray-400)', marginLeft:8 }}>
              for: {decision.draft_recipient_type}
            </span>
          )}
        </div>
        <div style={s.meta}>
          {accuracyScore != null && (
            <div style={{ display:'flex', alignItems:'center', gap:5 }}>
              <span style={{ fontSize:10, color:'var(--gray-400)' }}>Accuracy</span>
              <ConfidenceGauge value={accuracyScore} size={36}/>
            </div>
          )}
        </div>
      </div>

      {/* Low accuracy warning */}
      {lowAccuracy && (
        <div style={s.warn}>
          <AlertCircle size={13} color="var(--warning)"/>
          <span style={{ fontSize:11, color:'var(--warning)', fontWeight:500 }}>
            Review factual accuracy — clinical accuracy score is below 80%
          </span>
        </div>
      )}

      {/* Textarea */}
      <textarea style={s.area} value={text} onChange={e => setText(e.target.value)} disabled={accepted}
        onFocus={e => !accepted && (e.target.style.borderColor='var(--gh-blue)')}
        onBlur={e => e.target.style.borderColor='var(--gray-200)'}
      />

      {/* Footer */}
      <div style={s.footer}>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <span style={s.chars}>{text.length} chars</span>
          {editDistance > 0 && !accepted && (
            <span style={{ fontSize:10, color:'var(--info)', fontFamily:'var(--font-mono)' }}>
              Δ {editDistance} chars edited
            </span>
          )}
          {accepted && (
            <span style={{ fontSize:11, color:'var(--success)', fontWeight:600 }}>✓ Draft accepted</span>
          )}
        </div>
        <div style={s.actions}>
          {!accepted && (
            <button style={s.overrideBtn} onClick={() => setShowOverride(v => !v)}>
              <RotateCcw size={12}/> Override Queue
            </button>
          )}
          <button style={s.acceptBtn} onClick={handleAccept} disabled={accepted}>
            <CheckCheck size={13}/>{accepted ? 'Accepted' : 'Accept Draft'}
          </button>
        </div>
      </div>

      {/* Override panel */}
      {showOverride && !accepted && (
        <div style={s.overridePanel}>
          <span style={{ fontSize:11, color:'var(--gray-600)', whiteSpace:'nowrap' }}>Route to:</span>
          <select style={s.select} value={overrideQ} onChange={e => setOverrideQ(e.target.value)}>
            <option value="">Select queue...</option>
            {QUEUES.map(q => <option key={q} value={q}>{QUEUE_LABELS[q]}</option>)}
          </select>
          <button style={s.applyBtn} onClick={handleOverride} disabled={!overrideQ}>Apply</button>
        </div>
      )}
    </div>
  )
}
