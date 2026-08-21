import { memo, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ArrowUpRight, CheckCircle2, Clock3, Tickets } from 'lucide-react'

function formatNumber(n) {
  return new Intl.NumberFormat('en-US').format(n)
}

function useAnimatedNumber(target, durationMs = 900) {
  const [value, setValue] = useState(0)
  const numericTarget = Number.isFinite(target) ? target : 0

  useEffect(() => {
    let raf
    const start = performance.now()

    const tick = (t) => {
      const p = Math.min(1, (t - start) / durationMs)
      const eased = 1 - Math.pow(1 - p, 3)
      setValue(Math.round(numericTarget * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [numericTarget, durationMs])

  return value
}

/*
  {
    title: 'Total Tickets',
    value: 1240,
    suffix: undefined,
    subtext: 'â†‘ 8.2% compared to last month',
    trend: '+8.2%',
  },
  {
    title: 'Open Tickets',
    value: 186,
    suffix: undefined,
    subtext: '28 awaiting response',
    trend: '+2.1%',
  },
  {
    title: 'Resolved Tickets',
    value: 1018,
    suffix: undefined,
    subtext: '82% resolution rate',
    trend: '+5.6%',
  },
  {
    title: 'AI Solved Tickets',
    value: 742,
    suffix: undefined,
    subtext: '93% AI success rate',
    trend: '+12.4%',
  },
  {
    title: 'Average Resolution Time',
    value: 14,
    suffix: ' min',
    subtext: 'Target: <15 min',
    trend: '-6.7%',
  },
*/

export function KpiCards({ cards: cardsProp, variant = 'user' }) {
  const cards = useMemo(() => cardsProp ?? [], [cardsProp])

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {cards.map((c) => (
        <KpiCard key={c.title} {...c} variant={variant} />
      ))}
    </div>
  )
}

const adminAccent = {
  blue: {
    border: 'border-l-blue-500',
    marker: 'border-blue-100 bg-blue-50',
    text: 'text-blue-600',
    icon: Tickets,
  },
  orange: {
    border: 'border-l-orange-500',
    marker: 'border-orange-100 bg-orange-50',
    text: 'text-orange-600',
    icon: Clock3,
  },
  green: {
    border: 'border-l-emerald-500',
    marker: 'border-emerald-100 bg-emerald-50',
    text: 'text-emerald-600',
    icon: CheckCircle2,
  },
  red: {
    border: 'border-l-red-500',
    marker: 'border-red-100 bg-red-50',
    text: 'text-red-600',
    icon: AlertTriangle,
  },
}

const KpiCard = memo(function KpiCard({ title, value, suffix, subtext, trend, accent = 'blue', variant = 'user' }) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
    }
  }

  const animated = useAnimatedNumber(value)
  const safeTrend = typeof trend === 'string' ? trend : ''
  const trendIsUp = !safeTrend.trim().startsWith('-')
  const isAdmin = variant === 'admin'
  const accentClasses = adminAccent[accent] ?? adminAccent.blue
  const AdminIcon = accentClasses.icon

  if (isAdmin) {
    return (
      <div
        role="button"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className={`relative cursor-pointer rounded-2xl border border-l-4 border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.10)] ${accentClasses.border}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <p className="text-sm font-bold text-slate-600">{title}</p>
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-extrabold tracking-tight text-slate-950">
                {formatNumber(animated)}
              </div>
              {suffix ? <span className="text-sm font-bold text-slate-600">{suffix}</span> : null}
            </div>
          </div>
          <span className={`flex h-14 w-14 items-center justify-center rounded-2xl border ${accentClasses.marker}`}>
            <AdminIcon className={`h-7 w-7 ${accentClasses.text}`} />
          </span>
        </div>

        <div className="mt-4 flex items-start justify-between gap-3 border-t border-slate-100 pt-3">
          <p className="text-xs text-slate-600 leading-tight">{subtext}</p>

          <span className={`text-xs font-bold inline-flex items-center gap-1 ${accentClasses.text}`}>
            <ArrowUpRight className={trendIsUp ? 'h-3.5 w-3.5' : 'h-3.5 w-3.5 rotate-180'} />
            {safeTrend}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="relative group rounded-3xl bg-white/55 p-5 border border-[#DBEAFE]/60 shadow-soft transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-panel cursor-pointer"
    >
      {/* Premium border always visible (soft). Darken/brighen only on hover */}
      <div className="pointer-events-none absolute inset-0 rounded-3xl overflow-hidden">
        {/* subtle ambient glow (soft, always visible) */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.18),transparent_55%)] opacity-55 transition-opacity duration-300 group-hover:opacity-80" />

        {/* gradient border layer (always visible) */}
        <div className="absolute inset-0 p-[1.5px]">
          <div className="h-full w-full rounded-[1.05rem] bg-gradient-to-r from-[#2563EB]/80 via-[#3B82F6]/70 to-[#0B1F4D]/65 transition-opacity duration-300 group-hover:opacity-100" />
        </div>

        {/* inner surface to keep card clean while border remains visible */}
        <div className="absolute inset-[1.5px] rounded-3xl bg-white/55" />

        {/* hover overlay (brighten a bit, still elegant) */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-[#DBEAFE]/0 via-[#3B82F6]/10 to-[#60A5FA]/0 opacity-100 transition-opacity duration-300 group-hover:opacity-100" />

        {/* subtle darken on hover to feel premium */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-black/0 via-black/0 to-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="text-sm font-bold text-[#0B1F4D]">{title}</p>
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-extrabold tracking-tight text-[#0B1F4D]">
              {formatNumber(animated)}
            </div>
            {suffix ? <span className="text-sm font-bold text-slate-600">{suffix}</span> : null}
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-3 flex flex-col gap-2">
        {/* Thin horizontal gradient line */}
        <div className="w-[78%] h-[2px] rounded-full bg-gradient-to-r from-[#007CC3] via-[#2563EB] to-[#6D5DF6]/90 opacity-70 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
          <div
            className="h-full w-full bg-gradient-to-r from-transparent via-white/40 to-transparent"
            style={{ animation: 'kpiShimmer 4s ease-in-out infinite' }}
          />
        </div>

        {/* Supporting text + trend */}
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs text-slate-600 leading-tight">{subtext}</p>

          <span
            className={
              'text-xs font-bold inline-flex items-center gap-1 transition-colors ' +
              (trendIsUp ? 'text-emerald-600' : 'text-red-600')
            }
          >
            <ArrowUpRight className={trendIsUp ? 'h-3.5 w-3.5' : 'h-3.5 w-3.5 rotate-180'} />
            {safeTrend}
          </span>
        </div>
      </div>
    </div>
  )
})
