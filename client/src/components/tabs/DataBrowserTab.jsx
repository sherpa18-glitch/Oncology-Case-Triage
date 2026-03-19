import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight, User, FlaskConical, FileText } from 'lucide-react'
import { UrgencyBadge } from '../ui'

const STATUS_COLOR = {
  resulted:'var(--success)', processing:'var(--info)', received:'var(--gray-400)',
  insufficient:'var(--warning)', pending_ack:'var(--danger)',
}
const PA_COLOR = {
  approved:'var(--success)', pending:'var(--warning)', denied:'var(--danger)',
  not_required:'var(--gray-400)',
}

export default function DataBrowserTab() {
  const [patients, setPatients]   = useState([])
  const [expanded, setExpanded]   = useState(null)
  const [loading,  setLoading]    = useState(true)

  useEffect(() => {
    fetch('/api/data/patients').then(r => r.json()).then(data => { setPatients(data); setLoading(false) }).catch(()=>setLoading(false))
  }, [])

  const s = {
    wrap:   { display:'flex', flex:1, overflow:'hidden' },
    main:   { flex:1, overflowY:'auto', padding:'16px' },
    title:  { fontSize:15, fontWeight:700, color:'var(--gray-800)', marginBottom:4 },
    sub:    { fontSize:12, color:'var(--gray-500)', marginBottom:16 },
    card:   { background:'#fff', borderRadius:'var(--radius-lg)', border:'1px solid var(--gray-200)', marginBottom:8, overflow:'hidden', boxShadow:'var(--shadow-sm)' },
    header: { display:'flex', alignItems:'center', gap:12, padding:'12px 14px', cursor:'pointer', transition:'background .15s' },
    avatar: (stage) => ({
      width:36, height:36, borderRadius:8, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center',
      background: stage?.includes('IV') ? 'var(--p0-bg)' : stage?.includes('III') ? 'var(--p1-bg)' : stage?.includes('II') ? 'var(--p2-bg)' : 'var(--p3-bg)',
    }),
    name:   { fontSize:13, fontWeight:600, color:'var(--gray-800)' },
    meta:   { fontSize:11, color:'var(--gray-500)', marginTop:1 },
    badge:  (color) => ({ display:'inline-block', padding:'2px 7px', borderRadius:999, fontSize:10, fontWeight:600, color, background:color+'15', border:`1px solid ${color}30`, marginRight:4 }),
    expand: { flex:1 },
    section:{ padding:'0 14px 14px' },
    stitle: { fontSize:10, fontWeight:600, color:'var(--gray-500)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8, display:'flex', alignItems:'center', gap:5 },
    table:  { width:'100%', borderCollapse:'collapse' },
    th:     { fontSize:10, fontWeight:600, color:'var(--gray-500)', padding:'4px 8px', textAlign:'left', borderBottom:'1px solid var(--gray-100)', textTransform:'uppercase', letterSpacing:'0.04em' },
    td:     { fontSize:11, color:'var(--gray-700)', padding:'6px 8px', borderBottom:'1px solid var(--gray-50)' },
    divider:{ height:1, background:'var(--gray-100)', margin:'0 14px' },
  }

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:200 }}><span style={{ color:'var(--gray-400)' }}>Loading patients...</span></div>

  return (
    <div style={s.wrap}>
      <div style={s.main}>
        <h2 style={s.title}>Patient Data Browser</h2>
        <p style={s.sub}>{patients.length} synthetic patients — mock data only, no real PHI</p>

        {patients.map(patient => {
          const isOpen = expanded === patient.patient_id
          const stageColor = patient.cancer_stage?.includes('IV') ? 'var(--p0-color)'
            : patient.cancer_stage?.includes('III') ? 'var(--p1-color)'
            : patient.cancer_stage?.includes('II')  ? 'var(--p2-color)' : 'var(--p3-color)'

          return (
            <div key={patient.patient_id} style={s.card}>
              <div style={s.header}
                onMouseEnter={e => e.currentTarget.style.background='var(--gray-50)'}
                onMouseLeave={e => e.currentTarget.style.background='#fff'}
                onClick={() => setExpanded(isOpen ? null : patient.patient_id)}>
                <div style={s.avatar(patient.cancer_stage)}>
                  <User size={16} color={stageColor}/>
                </div>
                <div style={s.expand}>
                  <p style={s.name}>{patient.name} <span style={{ fontSize:10, color:'var(--gray-400)', fontFamily:'var(--font-mono)', fontWeight:400 }}>({patient.patient_id})</span></p>
                  <p style={s.meta}>
                    <span style={s.badge(stageColor)}>{patient.cancer_stage}</span>
                    <span style={s.badge('var(--gh-blue)')}>{patient.cancer_type}</span>
                    {patient.physician_name && <span style={{ color:'var(--gray-400)' }}>{patient.physician_name}</span>}
                  </p>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                  <span style={{ fontSize:11, color:'var(--gray-400)' }}>{patient.orders?.length || 0} orders</span>
                  {isOpen ? <ChevronDown size={14} color="var(--gray-400)"/> : <ChevronRight size={14} color="var(--gray-400)"/>}
                </div>
              </div>

              {isOpen && (
                <div>
                  <div style={s.divider}/>
                  {/* Insurance */}
                  <div style={s.section}>
                    <p style={{ ...s.stitle, marginTop:12 }}>
                      <FileText size={11}/> Insurance
                    </p>
                    <div style={{ display:'flex', gap:24 }}>
                      {[['Payer', patient.payer_name],['Insurance ID', patient.insurance_id],['NPI', patient.physician_npi]].map(([k,v]) => (
                        <div key={k}>
                          <p style={{ fontSize:10, color:'var(--gray-400)', marginBottom:2 }}>{k}</p>
                          <p style={{ fontSize:12, color:'var(--gray-700)', fontFamily:k==='NPI'?'var(--font-mono)':'inherit' }}>{v||'—'}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Orders */}
                  {patient.orders?.length > 0 && (
                    <div style={s.section}>
                      <p style={s.stitle}><FlaskConical size={11}/> Test Orders ({patient.orders.length})</p>
                      <table style={s.table}>
                        <thead>
                          <tr>
                            {['Order ID','Test Type','Status','Submitted','PA Status','ICD-10'].map(h => (
                              <th key={h} style={s.th}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {patient.orders.map(order => (
                            <tr key={order.order_id}>
                              <td style={{ ...s.td, fontFamily:'var(--font-mono)', fontSize:10 }}>{order.order_id}</td>
                              <td style={s.td}>{order.test_type}</td>
                              <td style={s.td}>
                                <span style={{ color: STATUS_COLOR[order.status]||'var(--gray-500)', fontWeight:600, fontSize:10 }}>
                                  {order.status?.replace(/_/g,' ')}
                                </span>
                              </td>
                              <td style={{ ...s.td, fontFamily:'var(--font-mono)', fontSize:10 }}>{order.submitted_at || '—'}</td>
                              <td style={s.td}>
                                <span style={{ color: PA_COLOR[order.pa_status]||'var(--gray-400)', fontSize:10, fontWeight:500 }}>
                                  {order.pa_status?.replace(/_/g,' ')||'—'}
                                </span>
                              </td>
                              <td style={{ ...s.td, fontFamily:'var(--font-mono)', fontSize:10 }}>{order.icd10_code||<span style={{ color:'var(--danger)', fontWeight:600 }}>MISSING</span>}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Prior Cases */}
                  {patient.prior_cases?.length > 0 && (
                    <div style={s.section}>
                      <p style={s.stitle}>Prior Cases ({patient.prior_cases.length})</p>
                      {patient.prior_cases.map((pc, i) => (
                        <div key={i} style={{ padding:'7px 10px', background:'var(--gray-50)', borderRadius:'var(--radius-sm)', marginBottom:5, border:'1px solid var(--gray-100)' }}>
                          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
                            <span style={{ fontSize:11, fontWeight:600, color:'var(--gray-700)' }}>{pc.case_type?.replace(/_/g,' ')}</span>
                            <span style={{ fontSize:10, color:'var(--gray-400)' }}>{pc.created_at}</span>
                          </div>
                          <p style={{ fontSize:11, color:'var(--gray-600)' }}>{pc.summary}</p>
                          <p style={{ fontSize:10, color:'var(--success)', marginTop:2 }}>{pc.resolution}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
