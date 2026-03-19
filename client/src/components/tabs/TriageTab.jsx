import { useState } from 'react'
import { usePipeline } from '../../hooks/usePipeline'
import IntakeForm from '../IntakeForm'
import PipelineTrace from '../PipelineTrace'
import RoutingDecision from '../RoutingDecision'
import DraftEditor from '../DraftEditor'
import Dashboard from '../Dashboard'
import { Card, SectionHeader, EmptyState } from '../ui'
import { Code, ChevronDown, ChevronUp } from 'lucide-react'

export default function TriageTab() {
  const pipeline   = usePipeline()
  const [abVariant, setAbVariant] = useState('strategy_a')
  const [showJson,  setShowJson]  = useState(false)

  const { status, steps, decision, mttca, error, submitCase, submitAction } = pipeline

  const handleSubmit = (payload) => {
    submitCase({ ...payload, ab_variant: abVariant })
  }

  const panelStyle = (flex, overflowY = 'auto') => ({
    flex, overflowY, display:'flex', flexDirection:'column', minHeight:0,
    borderRight: '1px solid var(--gray-200)',
  })

  const inner = { padding: '16px', display:'flex', flexDirection:'column', gap:0, flex:1, minHeight:0 }

  return (
    <div style={{ display:'flex', flex:1, overflow:'hidden', height:'100%' }}>

      {/* ── LEFT: INTAKE ── */}
      <div style={panelStyle('0 0 280px')}>
        <div style={{ padding:'14px 16px 0', borderBottom:'1px solid var(--gray-100)', paddingBottom:12, flexShrink:0 }}>
          <SectionHeader title="Case Intake" subtitle="Submit or load a test case"/>
        </div>
        <div style={{ padding:'12px 16px', flex:1, display:'flex', flexDirection:'column', minHeight:0 }}>
          <IntakeForm
            onSubmit={handleSubmit}
            isProcessing={status === 'processing' || status === 'submitting'}
            abVariant={abVariant}
            onAbChange={setAbVariant}
          />
        </div>
      </div>

      {/* ── CENTER: TRACE + DECISION ── */}
      <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', minWidth:0, borderRight:'1px solid var(--gray-200)' }}>
        {/* Pipeline Trace */}
        <div style={{ padding:'14px 16px', borderBottom:'1px solid var(--gray-100)' }}>
          <SectionHeader title="Agent Pipeline" subtitle={
            status==='idle' ? 'Waiting for case...' :
            status==='processing'||status==='submitting' ? 'Processing...' :
            status==='complete' ? `Completed in ${mttca != null ? (mttca < 60 ? `${mttca}s` : `${Math.round(mttca/60)}m ${mttca%60}s`) : '—'}` :
            status==='failed' ? 'Pipeline failed' : ''
          }/>
          <PipelineTrace steps={steps} status={status}/>
          {error && (
            <div style={{ marginTop:10, padding:'8px 12px', borderRadius:'var(--radius-md)', background:'var(--danger-bg)', border:'1px solid var(--danger)30', fontSize:12, color:'var(--danger)' }}>
              ⚠ {error}
            </div>
          )}
        </div>

        {/* Routing Decision */}
        {decision && (
          <div style={{ padding:'14px 16px', borderBottom:'1px solid var(--gray-100)' }}>
            <SectionHeader title="Routing Decision"/>
            <RoutingDecision decision={decision}/>
          </div>
        )}

        {/* Draft Editor */}
        {decision?.draft_response && (
          <div style={{ padding:'14px 16px', borderBottom:'1px solid var(--gray-100)' }}>
            <DraftEditor decision={decision} caseId={pipeline.caseId} onAction={submitAction}/>
          </div>
        )}

        {/* Raw JSON */}
        {decision && (
          <div style={{ padding:'12px 16px' }}>
            <button
              onClick={() => setShowJson(v => !v)}
              style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'var(--gray-500)', background:'none', border:'none', cursor:'pointer', padding:0 }}>
              <Code size={12}/>
              {showJson ? 'Hide' : 'Show'} Raw JSON
              {showJson ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
            </button>
            {showJson && (
              <pre style={{ marginTop:8, padding:'10px 12px', background:'var(--gray-900)', color:'#94A3B8', borderRadius:'var(--radius-md)', fontSize:10, fontFamily:'var(--font-mono)', overflowX:'auto', lineHeight:1.6, maxHeight:300, overflowY:'auto' }}>
                {JSON.stringify(decision, null, 2)}
              </pre>
            )}
          </div>
        )}

        {/* Idle empty state */}
        {status === 'idle' && (
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <EmptyState icon="🧬" title="No case submitted" subtitle="Use the intake form to submit a case or load a golden test case"/>
          </div>
        )}
      </div>

      {/* ── RIGHT: DASHBOARD ── */}
      <div style={{ flex:'0 0 280px', overflowY:'auto', display:'flex', flexDirection:'column' }}>
        <div style={{ padding:'14px 16px 12px', borderBottom:'1px solid var(--gray-100)', flexShrink:0 }}>
          <SectionHeader title="Live Dashboard" subtitle="Last 24 hours"/>
        </div>
        <div style={{ padding:'12px 16px', flex:1, minHeight:0 }}>
          <Dashboard abVariant={abVariant}/>
        </div>
      </div>

    </div>
  )
}
