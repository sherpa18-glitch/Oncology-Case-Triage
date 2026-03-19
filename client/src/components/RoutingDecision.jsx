import { ArrowRight, User, Clock, CheckCircle2, AlertTriangle } from 'lucide-react'
import { UrgencyBadge, QueueBadge, CaseTypeBadge, HumanReviewBanner } from './ui'

const REP_LABELS = {
  ops_specialist:     'Ops Specialist',
  clinical_specialist:'Clinical Specialist',
  pa_specialist:      'PA Specialist',
  senior_escalation:  'Senior Escalation',
}

export default function RoutingDecision({ decision }) {
  if (!decision) return null
  return (
    <div className="flex flex-col gap-3 animate-fade-in">

      {/* Human review warning */}
      {decision.human_review_required && (
        <HumanReviewBanner reason={decision.human_review_reason} />
      )}

      {/* Main routing card */}
      <div className="rounded-xl border border-guardant-border bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-guardant-border bg-guardant-stone/60 flex items-center justify-between">
          <span className="text-xs font-semibold text-guardant-navy tracking-widest uppercase">Routing Decision</span>
          {decision.auto_resolvable
            ? <span className="flex items-center gap-1 text-xs text-green-700 font-semibold"><CheckCircle2 size={12}/>Auto-Resolved</span>
            : <span className="flex items-center gap-1 text-xs text-amber-700 font-semibold"><User size={12}/>Human Review</span>}
        </div>

        <div className="p-4 grid grid-cols-2 gap-3">
          <div>
            <div className="text-[10px] font-semibold text-guardant-slate uppercase tracking-widest mb-1.5">Case Type</div>
            <CaseTypeBadge type={decision.case_type} />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-guardant-slate uppercase tracking-widest mb-1.5">Urgency</div>
            <UrgencyBadge tier={decision.urgency_tier} />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-guardant-slate uppercase tracking-widest mb-1.5">Queue</div>
            <QueueBadge queue={decision.routing_queue} />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-guardant-slate uppercase tracking-widest mb-1.5">Rep Type</div>
            <span className="text-xs text-guardant-navy font-medium">{REP_LABELS[decision.rep_type] || decision.rep_type}</span>
          </div>
        </div>

        {/* Rationale */}
        {decision.routing_rationale && (
          <div className="px-4 pb-4">
            <div className="text-[10px] font-semibold text-guardant-slate uppercase tracking-widest mb-1.5">Routing Rationale</div>
            <p className="text-sm text-guardant-slate leading-relaxed bg-guardant-stone/60 rounded-lg px-3 py-2.5 border border-guardant-border/50">
              {decision.routing_rationale}
            </p>
          </div>
        )}
      </div>

      {/* Context summary */}
      {decision.context_summary && decision.context_retrieved && (
        <div className="rounded-xl border border-guardant-border bg-white p-4">
          <div className="text-[10px] font-semibold text-guardant-slate uppercase tracking-widest mb-1.5">Context Retrieved</div>
          <p className="text-sm text-guardant-slate leading-relaxed">{decision.context_summary}</p>
          {decision.missing_fields?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              <span className="text-[11px] text-amber-700 font-medium mr-1">Missing fields:</span>
              {decision.missing_fields.map(f => (
                <span key={f} className="px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-[11px] text-amber-700 font-mono">{f}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Performance */}
      <div className="flex items-center gap-2 text-xs text-guardant-slate px-1">
        <Clock size={12} />
        <span>Total pipeline: <strong className="text-guardant-navy">{(decision.total_latency_ms/1000).toFixed(1)}s</strong></span>
        <span className="text-gray-300">·</span>
        <span>Min confidence: <strong className={decision.min_confidence < 0.75 ? 'text-amber-600' : 'text-green-600'}>
          {Math.round((decision.min_confidence||0)*100)}%
        </strong></span>
      </div>
    </div>
  )
}
