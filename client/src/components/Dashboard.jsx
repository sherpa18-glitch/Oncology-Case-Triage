import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts'
import { useMetrics } from '../hooks/useMetrics'
import { Spinner } from './ui'
import { TrendingDown, TrendingUp, Minus } from 'lucide-react'

const TARGET_MTTCA = 45

function MetricCard({ title, value, sub, color, target, trend, children }) {
  const s = {
    card:  { background:'#fff', borderRadius:'var(--radius-lg)', border:'1px solid var(--gray-200)', padding:'14px 16px', boxShadow:'var(--shadow-sm)' },
    title: { fontSize:10, fontWeight:600, color:'var(--gray-500)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 },
    value: { fontSize:22, fontWeight:700, color: color || 'var(--gray-800)', lineHeight:1, marginBottom:3 },
    sub:   { fontSize:10, color:'var(--gray-400)' },
  }
  return (
    <div style={s.card}>
      <p style={s.title}>{title}</p>
      <div style={{ display:'flex', alignItems:'baseline', gap:6 }}>
        <span style={s.value}>{value}</span>
        {trend && <TrendIcon trend={trend}/>}
      </div>
      {sub && <p style={s.sub}>{sub}</p>}
      {children}
    </div>
  )
}

function TrendIcon({ trend }) {
  if (trend === 'improving') return <TrendingDown size={14} color="var(--success)"/>
  if (trend === 'degrading') return <TrendingUp   size={14} color="var(--danger)"/>
  return <Minus size={14} color="var(--gray-400)"/>
}

function GaugeBar({ value, target, color }) {
  const pct = Math.min(100, Math.round((value || 0) * 100))
  const targetPct = target ? Math.min(100, Math.round(target * 100)) : null
  return (
    <div style={{ marginTop:8 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
        <span style={{ fontSize:11, fontWeight:700, color }}>{pct}%</span>
        {targetPct && <span style={{ fontSize:10, color:'var(--gray-400)' }}>target: {targetPct}%</span>}
      </div>
      <div style={{ height:6, background:'var(--gray-100)', borderRadius:3, overflow:'hidden', position:'relative' }}>
        <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:3, transition:'width .5s ease' }}/>
        {targetPct && (
          <div style={{ position:'absolute', top:0, bottom:0, left:`${targetPct}%`, width:2, background:'var(--gray-400)', borderRadius:1 }}/>
        )}
      </div>
    </div>
  )
}

const CONF_COLORS = (bucket) => {
  const low = bucket.low
  if (low < 0.6)  return '#DC2626'
  if (low < 0.75) return '#D97706'
  if (low < 0.9)  return '#2563EB'
  return '#059669'
}

const STEP_SHORT = {
  classify_case:'Classify', retrieve_patient_context:'Retrieve',
  apply_routing_rules:'Rules', draft_response:'Draft', assign_to_queue:'Route'
}

const TYPE_COLORS = ['var(--gh-teal)','var(--gh-blue)','#7C3AED','var(--warning)','var(--danger)','var(--gray-400)']

export default function Dashboard({ abVariant }) {
  const { metrics, loading } = useMetrics('24h', abVariant)

  if (loading && !metrics) {
    return (
      <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:200 }}>
        <Spinner size={20}/>
      </div>
    )
  }

  if (!metrics || metrics.total_cases === 0) {
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:200, gap:6, color:'var(--gray-400)', textAlign:'center' }}>
        <span style={{ fontSize:24, opacity:.3 }}>📊</span>
        <p style={{ fontSize:12, fontWeight:600, color:'var(--gray-500)' }}>No data yet</p>
        <p style={{ fontSize:11, color:'var(--gray-400)' }}>Process a case to see live metrics</p>
      </div>
    )
  }

  const mttca = metrics.mttca
  const mttcaMin = mttca?.avg_minutes
  const mttcaColor = mttcaMin == null ? 'var(--gray-400)' : mttcaMin <= TARGET_MTTCA ? 'var(--success)' : 'var(--danger)'

  const latencyData = Object.entries(metrics.latency_by_step || {}).map(([k, v]) => ({
    name: STEP_SHORT[k] || k, avg_ms: v.avg_ms,
  }))

  const typeData = Object.entries(metrics.case_volume_by_type || {}).map(([k, v], i) => ({
    name: k.replace(/_/g,' '), value: v, color: TYPE_COLORS[i % TYPE_COLORS.length]
  }))

  const abA = metrics.ab_comparison?.strategy_a
  const abB = metrics.ab_comparison?.strategy_b

  const s = {
    grid2: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 },
    grid1: { marginBottom:8 },
    card:  { background:'#fff', borderRadius:'var(--radius-lg)', border:'1px solid var(--gray-200)', padding:'14px 16px', boxShadow:'var(--shadow-sm)' },
    ctitle:{ fontSize:10, fontWeight:600, color:'var(--gray-500)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 },
  }

  return (
    <div style={{ overflowY:'auto', paddingRight:2 }}>
      {/* MTTCA — Hero Metric */}
      <div style={{ ...s.card, marginBottom:8 }}>
        <p style={s.ctitle}>Mean Time to Clinical Action</p>
        <div style={{ display:'flex', alignItems:'baseline', gap:8, marginBottom:2 }}>
          <span style={{ fontSize:28, fontWeight:700, color:mttcaColor, lineHeight:1 }}>
            {mttcaMin != null ? `${mttcaMin}m` : '—'}
          </span>
          {mttca?.trend && <TrendIcon trend={mttca.trend}/>}
          <span style={{ fontSize:10, color:'var(--gray-400)', marginLeft:'auto' }}>target: {TARGET_MTTCA}m</span>
        </div>
        {mttca?.sparkline?.length > 0 && (
          <ResponsiveContainer width="100%" height={48}>
            <LineChart data={mttca.sparkline} margin={{ top:4, right:0, left:0, bottom:0 }}>
              <Line type="monotone" dataKey="mttca_minutes" stroke={mttcaColor} strokeWidth={1.5} dot={false}/>
              <YAxis hide domain={['auto','auto']}/>
              <Tooltip contentStyle={{ fontSize:11, padding:'4px 8px', border:'1px solid var(--gray-200)' }}
                formatter={(v) => [`${v}m`, 'MTTCA']}/>
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Row 1 */}
      <div style={s.grid2}>
        <MetricCard title="Auto-Resolution Rate" value={metrics.auto_resolution_rate != null ? `${Math.round(metrics.auto_resolution_rate*100)}%` : '—'}
          color={metrics.auto_resolution_rate >= 0.55 ? 'var(--success)' : 'var(--warning)'}
          sub={`${metrics.auto_resolution_count || 0} of ${metrics.total_cases} cases`}>
          <GaugeBar value={metrics.auto_resolution_rate} target={0.55} color={metrics.auto_resolution_rate >= 0.55 ? 'var(--success)' : 'var(--warning)'}/>
        </MetricCard>
        <MetricCard title="Triage Accuracy" value={metrics.triage_accuracy != null ? `${Math.round(metrics.triage_accuracy*100)}%` : '—'}
          color={metrics.triage_accuracy >= 0.92 ? 'var(--success)' : metrics.triage_accuracy != null ? 'var(--warning)' : 'var(--gray-400)'}
          sub={metrics.triage_accuracy == null ? 'Pending overrides' : 'vs human ground truth'}>
          {metrics.triage_accuracy != null && <GaugeBar value={metrics.triage_accuracy} target={0.92} color="var(--gh-teal)"/>}
        </MetricCard>
      </div>

      {/* Row 2 */}
      <div style={s.grid2}>
        <MetricCard title="SLA Breach Rate"
          value={`${Math.round((metrics.sla_breach_rate||0)*100)}%`}
          color={metrics.sla_breach_rate <= 0.05 ? 'var(--success)' : 'var(--danger)'}
          sub="P0/P1 cases exceeding SLA">
          <GaugeBar value={1 - (metrics.sla_breach_rate||0)} target={0.95} color={metrics.sla_breach_rate <= 0.05 ? 'var(--success)' : 'var(--danger)'}/>
        </MetricCard>
        <MetricCard title="Draft Acceptance Rate"
          value={metrics.draft_acceptance_rate != null ? `${Math.round(metrics.draft_acceptance_rate*100)}%` : '—'}
          color="var(--gh-blue)"
          sub={metrics.draft_acceptance_rate == null ? 'No accepted drafts yet' : 'AI drafts used as-is'}>
          {metrics.draft_acceptance_rate != null && <GaugeBar value={metrics.draft_acceptance_rate} target={0.70} color="var(--gh-blue)"/>}
        </MetricCard>
      </div>

      {/* Confidence Distribution */}
      {metrics.confidence_distribution?.some(b => b.count > 0) && (
        <div style={{ ...s.card, marginBottom:8 }}>
          <p style={s.ctitle}>Confidence Distribution</p>
          <ResponsiveContainer width="100%" height={80}>
            <BarChart data={metrics.confidence_distribution} margin={{ top:0, right:0, left:-20, bottom:0 }} barSize={14}>
              <XAxis dataKey="bucket" tick={{ fontSize:8, fill:'var(--gray-400)' }} tickLine={false} axisLine={false}/>
              <YAxis tick={{ fontSize:8 }} tickLine={false} axisLine={false}/>
              <Tooltip contentStyle={{ fontSize:11, padding:'4px 8px' }} formatter={(v) => [v, 'calls']}/>
              <Bar dataKey="count" radius={[2,2,0,0]}>
                {metrics.confidence_distribution.map((b, i) => (
                  <Cell key={i} fill={CONF_COLORS(b)}/>
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Latency by Step */}
      {latencyData.some(d => d.avg_ms > 0) && (
        <div style={{ ...s.card, marginBottom:8 }}>
          <p style={s.ctitle}>Avg Latency by Step (ms)</p>
          <ResponsiveContainer width="100%" height={80}>
            <BarChart data={latencyData} layout="vertical" margin={{ top:0, right:8, left:0, bottom:0 }} barSize={10}>
              <XAxis type="number" tick={{ fontSize:8, fill:'var(--gray-400)' }} tickLine={false} axisLine={false}/>
              <YAxis type="category" dataKey="name" tick={{ fontSize:9, fill:'var(--gray-500)' }} tickLine={false} axisLine={false} width={48}/>
              <Tooltip contentStyle={{ fontSize:11, padding:'4px 8px' }} formatter={(v) => [`${v}ms`, 'avg']}/>
              <Bar dataKey="avg_ms" fill="var(--gh-blue)" radius={[0,2,2,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Case Volume by Type */}
      {typeData.length > 0 && (
        <div style={{ ...s.card, marginBottom:8 }}>
          <p style={s.ctitle}>Case Volume by Type ({metrics.total_cases} total)</p>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <ResponsiveContainer width={80} height={80}>
              <PieChart>
                <Pie data={typeData} cx={35} cy={35} innerRadius={22} outerRadius={35} dataKey="value" strokeWidth={1} stroke="#fff">
                  {typeData.map((entry, i) => <Cell key={i} fill={entry.color}/>)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex:1, display:'flex', flexDirection:'column', gap:3 }}>
              {typeData.map((d, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:5 }}>
                  <div style={{ width:7, height:7, borderRadius:2, background:d.color, flexShrink:0 }}/>
                  <span style={{ fontSize:10, color:'var(--gray-600)', flex:1 }}>{d.name}</span>
                  <span style={{ fontSize:10, fontWeight:600, color:'var(--gray-700)', fontFamily:'var(--font-mono)' }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* A/B Comparison */}
      {(abA?.case_count > 0 || abB?.case_count > 0) && (
        <div style={s.card}>
          <p style={s.ctitle}>A/B Experiment</p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {[['strategy_a','A — Accuracy', abA],['strategy_b','B — Speed', abB]].map(([key, label, data]) => (
              <div key={key} style={{ padding:'8px 10px', borderRadius:'var(--radius-md)', border:'1px solid var(--gray-200)', background:'var(--gray-50)' }}>
                <p style={{ fontSize:11, fontWeight:700, color:'var(--gh-navy)', marginBottom:6 }}>{label}</p>
                {data?.case_count > 0 ? (
                  <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                    {[
                      ['Cases', data.case_count],
                      ['Avg Confidence', data.avg_confidence != null ? `${Math.round(data.avg_confidence*100)}%` : '—'],
                      ['Avg Latency', data.avg_latency_ms != null ? `${Math.round(data.avg_latency_ms/1000)}s` : '—'],
                      ['Draft Accept', data.draft_acceptance != null ? `${Math.round(data.draft_acceptance*100)}%` : '—'],
                    ].map(([k,v]) => (
                      <div key={k} style={{ display:'flex', justifyContent:'space-between' }}>
                        <span style={{ fontSize:10, color:'var(--gray-500)' }}>{k}</span>
                        <span style={{ fontSize:10, fontWeight:600, color:'var(--gray-800)', fontFamily:'var(--font-mono)' }}>{v}</span>
                      </div>
                    ))}
                  </div>
                ) : <p style={{ fontSize:10, color:'var(--gray-400)' }}>No cases yet</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
