import { useState } from 'react'
import { Send, FlaskConical, ChevronDown } from 'lucide-react'

const SOURCES = ['phone','portal','fax','email','batch_upload']

export default function IntakeForm({ onSubmit, isLoading, goldenCases = [] }) {
  const [form, setForm] = useState({ case_text:'', case_source:'phone', patient_id:'', order_id:'', ab_variant:'strategy_a' })
  const [showGolden, setShowGolden] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const loadGolden = (gc) => {
    setForm({ case_text:gc.case_text, case_source:gc.case_source, patient_id:gc.patient_id||'', order_id:gc.order_id||'', ab_variant:'strategy_a' })
    setShowGolden(false)
  }

  const submit = (e) => {
    e.preventDefault()
    if (form.case_text.trim().length < 10) return
    onSubmit({ ...form, patient_id: form.patient_id||undefined, order_id: form.order_id||undefined })
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 h-full">
      {/* Golden Case Selector */}
      <div className="relative">
        <button type="button" onClick={() => setShowGolden(s=>!s)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-guardant-border bg-white text-sm text-guardant-slate hover:bg-guardant-stone transition-colors">
          <div className="flex items-center gap-2"><FlaskConical size={13} className="text-guardant-teal" /><span>Load Golden Test Case</span></div>
          <ChevronDown size={13} className={`transition-transform ${showGolden?'rotate-180':''}`} />
        </button>
        {showGolden && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-guardant-border rounded-lg shadow-panel z-20 max-h-52 overflow-y-auto">
            {goldenCases.map(gc => (
              <button key={gc.id} type="button" onClick={() => loadGolden(gc)}
                className="w-full text-left px-3 py-2.5 hover:bg-guardant-stone border-b border-guardant-border last:border-0 transition-colors">
                <div className="text-xs font-semibold text-guardant-navy">{gc.id} — {gc.label}</div>
                <div className="text-[11px] text-guardant-slate mt-0.5 truncate">{gc.case_text.slice(0,90)}…</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Case Text */}
      <div className="flex flex-col gap-1 flex-1 min-h-0">
        <label className="text-[11px] font-semibold text-guardant-navy tracking-widest uppercase">Case Description <span className="text-red-500">*</span></label>
        <textarea value={form.case_text} onChange={e => set('case_text', e.target.value.slice(0,2000))}
          placeholder="Describe the case — physician inquiry, order issue, result question, PA follow-up…"
          className="flex-1 resize-none rounded-lg border border-guardant-border bg-white px-3 py-2.5 text-sm text-guardant-navy placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-guardant-blue/30 focus:border-guardant-blue transition-all"
          style={{minHeight:110}} required />
        <div className="text-right text-[10px] text-gray-400">{form.case_text.length}/2000</div>
      </div>

      {/* Source + Patient ID */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[11px] font-semibold text-guardant-navy mb-1 tracking-widest uppercase">Source</label>
          <select value={form.case_source} onChange={e => set('case_source', e.target.value)}
            className="w-full rounded-lg border border-guardant-border bg-white px-2.5 py-2 text-sm text-guardant-navy focus:outline-none focus:ring-2 focus:ring-guardant-blue/30">
            {SOURCES.map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-guardant-navy mb-1 tracking-widest uppercase">Patient ID</label>
          <input value={form.patient_id} onChange={e => set('patient_id', e.target.value)} placeholder="P-1001"
            className="w-full rounded-lg border border-guardant-border bg-white px-2.5 py-2 text-sm font-mono text-guardant-navy placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-guardant-blue/30" />
        </div>
      </div>

      <div>
        <label className="block text-[11px] font-semibold text-guardant-navy mb-1 tracking-widest uppercase">Order ID</label>
        <input value={form.order_id} onChange={e => set('order_id', e.target.value)} placeholder="ORD-100101"
          className="w-full rounded-lg border border-guardant-border bg-white px-2.5 py-2 text-sm font-mono text-guardant-navy placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-guardant-blue/30" />
      </div>

      {/* A/B Toggle */}
      <div>
        <label className="block text-[11px] font-semibold text-guardant-navy mb-1.5 tracking-widest uppercase">Prompt Strategy</label>
        <div className="grid grid-cols-2 gap-2">
          {[{id:'strategy_a',label:'Strategy A',sub:'Accuracy-first'},{id:'strategy_b',label:'Strategy B',sub:'Speed-first'}].map(v => (
            <button key={v.id} type="button" onClick={() => set('ab_variant', v.id)}
              className={`py-2 px-3 rounded-lg border text-left transition-all ${form.ab_variant===v.id ? 'bg-guardant-blue text-white border-guardant-blue' : 'bg-white text-guardant-slate border-guardant-border hover:border-guardant-blue/40'}`}>
              <div className="text-xs font-semibold">{v.label}</div>
              <div className={`text-[10px] mt-0.5 ${form.ab_variant===v.id ? 'text-blue-100':'text-gray-400'}`}>{v.sub}</div>
            </button>
          ))}
        </div>
      </div>

      <button type="submit" disabled={isLoading || form.case_text.trim().length < 10}
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-guardant-navy text-white text-sm font-semibold hover:bg-guardant-blue disabled:opacity-40 disabled:cursor-not-allowed transition-all">
        {isLoading
          ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Processing…</>
          : <><Send size={13}/>Triage This Case</>}
      </button>
    </form>
  )
}
