import { MessageSquare, Star, Activity } from 'lucide-react'

const quickPrompts = [
  { label: 'Reset password', value: 'Reset password for my account.' },
  { label: 'VPN issue', value: 'My VPN is not connecting. Help me troubleshoot.' },
  { label: 'SAP login', value: 'Unable to login to SAP after password reset.' },
  { label: 'Email sync', value: 'Email sync is failing for Outlook.' },
  { label: 'Network problem', value: 'Network connection drops frequently.' },
]

export function RightSidebar() {
  return (
    <div className="space-y-4">
      <div className="glass-card rounded-3xl p-5 bg-white/55 border border-white/50 backdrop-blur shadow-soft">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-extrabold text-[#0B1F4D]">AI Copilot</p>
            <p className="text-sm text-slate-600">Quick suggestions • guided next steps</p>
          </div>
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[#007CC3]/20 to-[#6D5DF6]/20 border border-white/50 flex items-center justify-center">
            <MessageSquare className="h-4 w-4 text-[#007CC3]" />
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {quickPrompts.slice(0, 4).map((p) => (
            <button
              key={p.label}
              className="w-full text-left rounded-2xl px-4 py-3 bg-white/70 hover:bg-white/90 transition border border-white/60"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-800">{p.label}</span>
                <Star className="h-4 w-4 text-[#6D5DF6]" />
              </div>
              <p className="text-xs text-slate-600 mt-1 line-clamp-2">{p.value}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-3xl p-5 bg-white/55 border border-white/50 backdrop-blur shadow-soft">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-extrabold text-[#0B1F4D]">Smart Insights</p>
            <p className="text-sm text-slate-600">Today’s AI-powered signals</p>
          </div>
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[#007CC3]/20 to-[#6D5DF6]/20 border border-white/50 flex items-center justify-center">
            <Activity className="h-4 w-4 text-[#007CC3]" />
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-white/70 border border-white/60 p-3">
            <p className="text-xs text-slate-600">Today's AI solved</p>
            <p className="text-2xl font-extrabold text-[#0B1F4D]">18</p>
          </div>
          <div className="rounded-2xl bg-white/70 border border-white/60 p-3">
            <p className="text-xs text-slate-600">Most reported issue</p>
            <p className="text-lg font-extrabold text-[#007CC3]">VPN</p>
          </div>
          <div className="rounded-2xl bg-white/70 border border-white/60 p-3">
            <p className="text-xs text-slate-600">Average AI confidence</p>
            <p className="text-2xl font-extrabold text-[#0B1F4D]">93%</p>
          </div>
          <div className="rounded-2xl bg-white/70 border border-white/60 p-3">
            <p className="text-xs text-slate-600">Expected resolution</p>
            <p className="text-lg font-extrabold text-[#6D5DF6]">15 min</p>
          </div>
        </div>
      </div>
    </div>
  )
}

