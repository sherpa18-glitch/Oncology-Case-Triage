import { Brain, Database, Scale, FileText, GitBranch, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { ConfidenceGauge, StatusIcon, formatMs } from './ui'

const STEP_META = [
  { key:'classify_case',            label:'Case Classifier',    icon:Brain,     desc:'Identifies case type and urgency tier' },
  { key:'retrieve_patient_context', label:'Context Retriever',  icon:Database,  desc:'Pulls patient history and order data' },
  { key:'apply_routing_rules',      label:'Rules Engine',       icon:Scale,     desc:'Evaluates 15 routing rules' },
  { key:'draft_response',           label:'Response Drafter',   icon:FileText,  desc:'Generates clinical response draft' },
  { key:'assign_to_queue',          label:'Case Router',        icon:GitBranch, desc:'Assigns queue, rep type, priority' },
]

function StepCard({ meta, stepData, isActive }) {
  const [open, setOpen] = useState(false)
  const status = stepData?.status || (isActive ? 'running' : 'pending')
  const Icon = meta.icon

  return (
    <div className={`rounded-xl border transition-all duration-200 ${
      status==='complete' ? 'border-green-200 bg-white' :
      status==='running'  ? 'border-guardant-blue/40 bg-blue-50/40 shadow-sm' :
      status==='failed'   ? 'border-red-200 bg-red-50/30' :
      'border-guardant-border bg-white opacity-50'}`}>

      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Step icon */}
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
          status==='complete' ? 'bg-green-50' :
          status==='running'  ? 'bg-blue-100' :
          status==='failed'   ? 'bg-red-50' : 'bg-gray-100'}`}>
          <Icon size={15} className={
            status==='complete' ? 'text-green-600' :
            status==='running'  ? 'text-guardant-blue' :
            status==='failed'   ? 'text-red-500' : 'text-gray-400'} />
        </div>

        {/* Label + summary */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-guardant-navy">{meta.label}</span>
            {status==='running' && <span className="text-[10px] text-guardant-blue font-medium animate-pulse">Running…</span>}
          </div>
          <div className="text-xs text-guardant-slate truncate mt-0.5">
            {stepData?.summary || meta.desc}
          </div>
        </div>

        {/* Right: confidence + latency + status */}
        <div className="flex items-center gap-3 shrink-0">
          {stepData?.confidence != null && <ConfidenceGauge score={stepData.confidence} size={40} />}
          {stepData?.latency_ms  != null && <span className="text-[11px] text-gray-400 font-mono">{formatMs(stepData.latency_ms)}</span>}
          <StatusIcon status={status} />
          {stepData?.summary && (
            <button onClick={() => setOpen(o=>!o)} className="text-gray-400 hover:text-guardant-blue transition-colors ml-1">
              {open ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
            </button>
          )}
        </div>
      </div>

      {/* Expanded detail */}
      {open && stepData?.result && (
        <div className="px-4 pb-3 border-t border-guardant-border/50 mt-1 pt-2">
          <pre className="text-[11px] text-gray-600 font-mono whitespace-pre-wrap bg-gray-50 rounded-lg p-3 max-h-48 overflow-y-auto">
            {JSON.stringify(stepData.result, null, 2)}
          </pre>
        </div>
      )}

      {/* Running shimmer connector */}
      {status === 'running' && (
        <div className="h-0.5 mx-4 mb-3 bg-gray-100 rounded overflow-hidden">
          <div className="h-full bg-gradient-to-r from-guardant-blue/0 via-guardant-blue to-guardant-blue/0 animate-pulse w-full" />
        </div>
      )}
    </div>
  )
}

export default function PipelineTrace({ steps, currentStep }) {
  return (
    <div className="flex flex-col gap-2">
      {STEP_META.map((meta, idx) => {
        const stepData = steps[meta.key]
        const isActive = currentStep === meta.key
        return (
          <div key={meta.key} className="relative">
            <StepCard meta={meta} stepData={stepData} isActive={isActive} />
            {/* Connector line between steps */}
            {idx < STEP_META.length - 1 && (
              <div className="flex justify-center py-0.5">
                <div className={`w-px h-3 transition-colors ${stepData?.status==='complete' ? 'bg-green-300' : 'bg-gray-200'}`} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
