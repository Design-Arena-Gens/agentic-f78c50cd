import { useState } from 'react'
import { Activity, FileText, Video, Mic } from 'lucide-react'
import ResumeAudit from './components/ResumeAudit'
import VisionProctor from './components/VisionProctor'
import VoiceInterview from './components/VoiceInterview'

function App() {
  const [activeTab, setActiveTab] = useState('resume')

  return (
    <div className="min-h-screen bg-rich-black">
      {/* Header */}
      <header className="glass-card border-b border-white/10 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-electric-purple to-emerald-green rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold glow-text">MockMate</h1>
              <p className="text-xs text-gray-400">Physics Wallah RIFT Edition</p>
            </div>
          </div>
          <div className="pulse-glow px-4 py-2 rounded-full bg-emerald-green/10 border border-emerald-green/30 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-green animate-pulse"></div>
            <span className="text-sm font-semibold text-emerald-green">RIFT SYSTEM: ONLINE</span>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex gap-3 mb-8">
          <TabButton
            icon={<FileText className="w-5 h-5" />}
            label="Resume Audit"
            active={activeTab === 'resume'}
            onClick={() => setActiveTab('resume')}
          />
          <TabButton
            icon={<Video className="w-5 h-5" />}
            label="Vision Proctor"
            active={activeTab === 'vision'}
            onClick={() => setActiveTab('vision')}
          />
          <TabButton
            icon={<Mic className="w-5 h-5" />}
            label="Voice Interview"
            active={activeTab === 'voice'}
            onClick={() => setActiveTab('voice')}
          />
        </div>

        {/* Content */}
        <div className="space-y-6">
          {activeTab === 'resume' && <ResumeAudit />}
          {activeTab === 'vision' && <VisionProctor />}
          {activeTab === 'voice' && <VoiceInterview />}
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-8 text-gray-500 text-sm">
        <p>Built for Physics Wallah RIFT Hackathon 2026</p>
      </footer>
    </div>
  )
}

function TabButton({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${
        active
          ? 'glass-card border-electric-purple text-white'
          : 'bg-dark-surface/50 border border-white/5 text-gray-400 hover:text-white'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  )
}

export default App
