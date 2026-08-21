import { useMemo } from 'react'

const departments = [
  { name: 'IT', health: 92, resolved: 420, pending: 34, avg: '12m', score: 'Excellent' },
  { name: 'Finance', health: 61, resolved: 270, pending: 95, avg: '22m', score: 'Needs Attention' },
  { name: 'HR', health: 97, resolved: 210, pending: 8, avg: '9m', score: 'Outstanding' },
]

export default function DepartmentHealth() {
  const items = useMemo(() => departments, [])

  return (
    <div className="glass-card rounded-3xl p-6 bg-white/55 border border-white/50 backdrop-blur shadow-soft">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm font-extrabold text-[#0B1F4D]">Department Health</p>
          <p className="text-sm text-slate-600 mt-1">Health score, resolution pace, and pending volume.</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4">
        {items.map((d) => (
          <div key={d.name} className="rounded-3xl bg-white/60 border border-white/60 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-extrabold text-[#0B1F4D]">{d.name}</p>
                <p className="text-xs text-slate-600 mt-1">
                  Resolved: <span className="font-extrabold">{d.resolved}</span>
                  {'  '}• Pending: <span className="font-extrabold">{d.pending}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-extrabold text-slate-600">Health Score</p>
                <p className="text-2xl font-extrabold text-[#007CC3]">{d.health}%</p>
              </div>
            </div>

            <div className="mt-3 h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#007CC3] to-[#6D5DF6]"
                style={{ width: `${d.health}%` }}
              />
            </div>

            <div className="mt-4 flex items-center justify-between text-xs font-semibold text-slate-700">
              <span className="rounded-full bg-white/70 border border-white/60 px-3 py-1">Avg: {d.avg}</span>
              <span className="rounded-full bg-white/70 border border-white/60 px-3 py-1">{d.score}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

