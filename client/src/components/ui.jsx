import { CheckCircle2, Clock, AlertTriangle, XCircle, Loader2, Brain, Database, Scale, FileText, GitBranch } from 'lucide-react';

const URGENCY_CONFIG = {
  P0_critical: { label:'P0 Critical', bg:'bg-red-50',    text:'text-red-700',    border:'border-red-200',    dot:'bg-red-500'    },
  P1_urgent:   { label:'P1 Urgent',   bg:'bg-orange-50', text:'text-orange-700', border:'border-orange-200', dot:'bg-orange-500' },
  P2_standard: { label:'P2 Standard', bg:'bg-blue-50',   text:'text-blue-700',   border:'border-blue-200',   dot:'bg-blue-500'   },
  P3_routine:  { label:'P3 Routine',  bg:'bg-green-50',  text:'text-green-700',  border:'border-green-200',  dot:'bg-green-500'  },
};

export function UrgencyBadge({ tier, size='sm' }) {
  const cfg = URGENCY_CONFIG[tier] || URGENCY_CONFIG.P2_standard;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-semibold ${cfg.bg} ${cfg.text} ${cfg.border} ${size==='lg'?'text-sm':'text-xs'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

const CASE_TYPE_CONFIG = {
  result_inquiry:        { label:'Result Inquiry',   color:'bg-indigo-50 text-indigo-700 border-indigo-200' },
  incomplete_order:      { label:'Incomplete Order', color:'bg-amber-50 text-amber-700 border-amber-200'    },
  redraw_recommendation: { label:'Re-draw Rec.',     color:'bg-purple-50 text-purple-700 border-purple-200' },
  critical_value:        { label:'Critical Value',   color:'bg-red-50 text-red-700 border-red-200'          },
  pa_status_check:       { label:'PA Status',        color:'bg-teal-50 text-teal-700 border-teal-200'       },
  unstructured:          { label:'Unstructured',     color:'bg-gray-50 text-gray-600 border-gray-200'       },
};

export function CaseTypeBadge({ type }) {
  const cfg = CASE_TYPE_CONFIG[type] || CASE_TYPE_CONFIG.unstructured;
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.color}`}>{cfg.label}</span>;
}

const QUEUE_CONFIG = {
  auto_resolved:             { label:'Auto Resolved',       color:'bg-green-50 text-green-700 border-green-200' },
  order_management:          { label:'Order Management',    color:'bg-amber-50 text-amber-700 border-amber-200' },
  clinical_support:          { label:'Clinical Support',    color:'bg-blue-50 text-blue-700 border-blue-200'    },
  pa_team:                   { label:'PA Team',             color:'bg-teal-50 text-teal-700 border-teal-200'    },
  critical_value_escalation: { label:'Critical Escalation', color:'bg-red-50 text-red-700 border-red-200'       },
  unstructured_review:       { label:'Manual Review',       color:'bg-gray-50 text-gray-600 border-gray-200'    },
};

export function QueueBadge({ queue }) {
  const cfg = QUEUE_CONFIG[queue] || QUEUE_CONFIG.unstructured_review;
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.color}`}>{cfg.label}</span>;
}

export function ConfidenceGauge({ score, size=44 }) {
  if (score == null) return <span className="text-xs text-gray-400">—</span>;
  const pct  = Math.round(score * 100);
  const r    = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  let color;
  if (pct >= 90) color = '#15803D';
  else if (pct >= 75) color = '#C2410C';
  else if (pct >= 60) color = '#B91C1C';
  else color = '#7C3AED';
  return (
    <div className="relative inline-flex items-center justify-center" style={{width:size,height:size}}>
      <svg width={size} height={size} className="-rotate-90" style={{position:'absolute'}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#E5E7EB" strokeWidth="4"/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{transition:'stroke-dasharray 0.4s ease'}}/>
      </svg>
      <span className="text-xs font-bold" style={{color}}>{pct}%</span>
    </div>
  );
}

const STEP_ICONS = { classify_case:Brain, retrieve_patient_context:Database, apply_routing_rules:Scale, draft_response:FileText, assign_to_queue:GitBranch };
export function StepIcon({ step, className='' }) {
  const Icon = STEP_ICONS[step] || Brain;
  return <Icon className={className} />;
}

export function StatusIcon({ status }) {
  if (status==='complete') return <CheckCircle2 className="w-4 h-4 text-green-600"/>;
  if (status==='running')  return <Loader2 className="w-4 h-4 text-blue-600 animate-spin"/>;
  if (status==='failed')   return <XCircle className="w-4 h-4 text-red-600"/>;
  return <Clock className="w-4 h-4 text-gray-300"/>;
}

export function HumanReviewBanner({ reason }) {
  return (
    <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 border border-amber-200">
      <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0"/>
      <div>
        <p className="text-xs font-semibold text-amber-800">Human Review Recommended</p>
        <p className="text-xs text-amber-700 mt-0.5">{reason||'Confidence below 75% threshold.'}</p>
      </div>
    </div>
  );
}

export function Divider({className=''}) { return <div className={`border-t border-gray-100 ${className}`}/>; }

export function EmptyState({ icon:Icon, title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {Icon && <Icon className="w-10 h-10 text-gray-300 mb-3"/>}
      <p className="text-sm font-medium text-gray-500">{title}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1 max-w-xs">{subtitle}</p>}
    </div>
  );
}

export function Skeleton({ className='' }) { return <div className={`skeleton ${className}`}/>; }

export function formatMs(ms) {
  if (!ms && ms!==0) return '—';
  return ms>=1000 ? `${(ms/1000).toFixed(1)}s` : `${ms}ms`;
}
export function formatMin(secs) {
  if (!secs && secs!==0) return '—';
  if (secs < 60) return `${secs}s`;
  const m=Math.floor(secs/60), s=secs%60;
  return s>0 ? `${m}m ${s}s` : `${m}m`;
}
export function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso);
  const mins = Math.floor(diff/60000);
  if (mins<1) return 'just now';
  if (mins<60) return `${mins}m ago`;
  const hrs=Math.floor(mins/60);
  return hrs<24 ? `${hrs}h ago` : `${Math.floor(hrs/24)}d ago`;
}

export function Card({ children, className='' }) {
  return <div className={`rounded-xl border border-guardant-border bg-white shadow-card ${className}`}>{children}</div>;
}

export function SectionHeader({ children, className='' }) {
  return <h3 className={`text-[11px] font-semibold text-guardant-slate uppercase tracking-widest ${className}`}>{children}</h3>;
}

export function Spinner({ size=16, className='' }) {
  return <span className={`inline-block border-2 border-current border-t-transparent rounded-full animate-spin ${className}`} style={{width:size,height:size}} />;
}
