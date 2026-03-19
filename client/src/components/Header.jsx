import { Activity } from 'lucide-react'

export default function Header({ activeTab, tabs, onTabChange }) {
  return (
    <header className="flex items-center gap-6 px-6 h-14 bg-guardant-navy border-b border-white/10 shrink-0 z-50">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-guardant-teal to-guardant-blue flex items-center justify-center shrink-0">
          <Activity size={15} color="white" strokeWidth={2.5} />
        </div>
        <div className="leading-none">
          <div className="text-white font-semibold text-[13px] tracking-tight">Guardant Health</div>
          <div className="text-white/40 text-[10px] tracking-widest uppercase mt-0.5">Oncology Triage Agent</div>
        </div>
      </div>
      <div className="w-px h-5 bg-white/10" />
      <nav className="flex gap-1">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => onTabChange(tab.id)}
            className={`px-3.5 py-1.5 rounded-md text-[13px] font-medium transition-all ${
              activeTab === tab.id ? 'bg-white/12 text-white' : 'text-white/50 hover:text-white/75'}`}>
            {tab.label}
          </button>
        ))}
      </nav>
      <div className="flex-1" />
      <div className="flex items-center gap-2 text-white/40 text-xs">
        <span className="w-1.5 h-1.5 rounded-full bg-guardant-teal animate-pulse" />
        Agent Online
      </div>
      <span className="text-white/20 text-[11px] ml-2">MVP v1.0</span>
    </header>
  )
}
