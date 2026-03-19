import { useState } from 'react'
import Header from './components/Header'
import TriageTab from './components/tabs/TriageTab'
import DataBrowserTab from './components/tabs/DataBrowserTab'
import './index.css'

const TABS = [
  { id: 'triage', label: 'Case Triage' },
  { id: 'data',   label: 'Data Browser' },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('triage')
  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden' }}>
      <Header activeTab={activeTab} tabs={TABS} onTabChange={setActiveTab} />
      <main style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column' }}>
        {activeTab === 'triage' && <TriageTab />}
        {activeTab === 'data'   && <DataBrowserTab />}
      </main>
    </div>
  )
}
