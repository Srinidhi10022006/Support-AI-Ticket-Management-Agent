import { useMemo } from 'react'

const devices = [
  {
    kind: 'PC',
    name: 'PC-204',
    failures: 18,
    rec: 'Replace Recommended',
  },
  {
    kind: 'Printer',
    name: 'PR-104',
    failures: 12,
    rec: 'Replace Printer PR-104',
  },
  {
    kind: 'Router',
    name: 'RT-33',
    failures: 9,
    rec: 'Upgrade VPN gateway',
  },
  {
    kind: 'Application',
    name: 'SAP Client',
    failures: 14,
    rec: 'Update SAP client',
  },
]

export default function DeviceAnalytics() {
  const items = useMemo(() => devices, [])

  return (
    <div className="glass-card rounded-3xl p-6 bg-white/55 border border-white/50 backdrop-blur shadow-soft">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm font-extrabold text-[#0B1F4D]">Device Analytics</p>
          <p className="text-sm text-slate-600 mt-1">Identify faulty hardware and recurring failure signals.</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4">
        {items.map((d) => (
          <div key={d.name} className="rounded-3xl bg-white/60 border border-white/60 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-slate-600">Most problematic {d.kind}s</p>
                <p className="mt-1 text-sm font-extrabold text-[#0B1F4D]'">{d.name}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-extrabold text-slate-600">Failure Count</p>
                <p className="text-2xl font-extrabold text-[#EF4444]">{d.failures}</p>
              </div>
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-700">Recommendation</p>
            <p className="mt-1 text-sm font-extrabold text-[#007CC3]'">{d.rec}</p>
            <div className="mt-3 h-2 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full w-[60%] bg-gradient-to-r from-[#EF4444] to-[#F59E0B]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

