import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'

import DashboardStats from './DashboardStats.jsx'
import SmartFilters from './SmartFilters.jsx'
import TicketManagementTable from './TicketManagementTable.jsx'
// RecentActivities removed per UI cleanup request
import ExportSection from './ExportSection.jsx'
import AdminSectionBoundary from './AdminSectionBoundary.jsx'
import AdminAiAnalysisPanel from './AdminAiAnalysisPanel.jsx'

import DashboardLayout from '../layout/DashboardLayout.jsx'
import { analyzeIssue } from '../../api/aiApi.js'
import { getAllTickets, updateTicketStatus } from '../../api/ticketApi.js'
import { buildAdminAnalysisInput } from '../../utils/adminAiAnalysis.js'
import { getStoredUser } from '../../auth/authStorage.js'

// Lightweight chart mocks reused from backup to avoid heavy chart deps
const COLORS = {
  blue: '#007CC3',
  indigo: '#6D5DF6',
  green: '#22C55E',
  orange: '#F59E0B',
  red: '#EF4444',
  slate: '#64748B',
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}

function BarChartMock({ data }) {
  if (!data || data.length === 0) return <div className="p-6 text-sm text-slate-600">No data available</div>
  const max = Math.max(...data.map((d) => d.count || d.value), 1)
  return (
    <div className="h-full flex items-end gap-3 px-2">
      {data.map((d) => {
        const value = d.count ?? d.value ?? 0
        const h = (value / max) * 100
        return (
          <div key={d.name} className="flex-1 flex flex-col items-center gap-2">
            <div
              className="w-full rounded-3xl"
              style={{ height: `${clamp(h, 8, 100)}%`, background: `linear-gradient(180deg, ${d.color || COLORS.blue}33, ${d.color || COLORS.blue}cc)` }}
              title={`${d.name}: ${value}`}
            />
            <div className="text-[11px] font-extrabold text-slate-600 text-center truncate">{d.name}</div>
          </div>
        )
      })}
    </div>
  )
}

const PRIORITY_COLORS = {
  High: { base: '#EF4444', hover: '#DC2626' },
  Medium: { base: '#F59E0B', hover: '#D97706' },
  Low: { base: '#22C55E', hover: '#16A34A' },
}

const DEPARTMENT_COLORS = {
  IT: { from: '#0EA5E9', to: '#2563EB' },
  HR: { from: '#10B981', to: '#059669' },
  Finance: { from: '#F59E0B', to: '#D97706' },
  Admin: { from: '#8B5CF6', to: '#7C3AED' },
  Other: { from: '#64748B', to: '#475569' },
}

function PriorityDonutChart({ data }) {
  const [activeSlice, setActiveSlice] = useState(null)
  const total = data?.reduce((s, d) => s + (d.value ?? d.count ?? 0), 0) ?? 0

  if (!data || data.length === 0 || total === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm font-semibold text-slate-500">
        No ticket data available
      </div>
    )
  }

  const radius = 76
  const strokeWidth = 28
  const circumference = 2 * Math.PI * radius
  let offset = 0
  const segments = data.map((item) => {
    const value = item.value ?? item.count ?? 0
    const percentage = total > 0 ? (value / total) * 100 : 0
    const length = (percentage / 100) * circumference
    const segment = {
      ...item,
      value,
      percentage,
      dash: `${length} ${circumference - length}`,
      offset: -offset,
      color: item.color ?? PRIORITY_COLORS[item.name]?.base ?? COLORS.slate,
      hoverColor: PRIORITY_COLORS[item.name]?.hover ?? item.color ?? COLORS.slate,
    }
    offset += length
    return segment
  })

  return (
    <div className="relative flex h-full flex-col items-center justify-center gap-4 md:flex-row md:gap-6">
      <style>
        {`@keyframes donut-draw {
          from { opacity: 0; stroke-dashoffset: ${circumference}; }
          to { opacity: 1; }
        }`}
      </style>
      <div className="relative flex h-[210px] w-[210px] shrink-0 items-center justify-center">
        <svg className="h-full w-full overflow-visible" viewBox="0 0 200 200" role="img" aria-label="Priority distribution donut chart">
          <circle cx="100" cy="100" r={radius} fill="none" stroke="#F1F5F9" strokeWidth={strokeWidth} />
          <g transform="rotate(-90 100 100)">
            {segments.map((segment) => (
              <circle
                key={segment.name}
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke={activeSlice?.name === segment.name ? segment.hoverColor : segment.color}
                strokeDasharray={segment.dash}
                strokeDashoffset={segment.offset}
                strokeLinecap="round"
                strokeWidth={activeSlice?.name === segment.name ? strokeWidth + 2 : strokeWidth}
                className="cursor-pointer transition-all duration-300 ease-in-out [animation:donut-draw_1000ms_ease-out_both]"
                onMouseEnter={() => setActiveSlice(segment)}
                onMouseLeave={() => setActiveSlice(null)}
              />
            ))}
          </g>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-extrabold leading-none text-[#0F172A]">{total}</span>
          <span className="mt-1 text-sm font-semibold text-slate-500">Tickets</span>
        </div>
      </div>

      <div className="w-full min-w-0 space-y-2 md:max-w-[220px]">
        {segments.map((segment) => (
          <div
            key={segment.name}
            className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 rounded-xl px-3 py-2 transition-colors duration-300 hover:bg-slate-50"
            onMouseEnter={() => setActiveSlice(segment)}
            onMouseLeave={() => setActiveSlice(null)}
          >
            <div className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: segment.color }} />
              <span className="truncate text-sm font-bold text-[#0F172A]">{segment.name}</span>
            </div>
            <span className="text-sm font-semibold text-slate-600">{segment.value} Tickets</span>
            <span className="min-w-10 text-right text-sm font-extrabold text-slate-900">{Math.round(segment.percentage)}%</span>
          </div>
        ))}
      </div>

      {activeSlice && (
        <div className="pointer-events-none absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left shadow-[0_16px_36px_rgba(15,23,42,0.16)]">
          <p className="text-sm font-extrabold text-[#0F172A]">{activeSlice.name} Priority</p>
          <p className="mt-1 text-xs font-semibold text-slate-600">{activeSlice.value} Tickets</p>
          <p className="text-xs font-bold text-slate-500">{Math.round(activeSlice.percentage)}%</p>
        </div>
      )}
    </div>
  )
}

function DepartmentTicketBarChart({ data }) {
  const [activeBar, setActiveBar] = useState(null)

  if (!data || data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm font-semibold text-slate-500">
        No department data available.
      </div>
    )
  }

  const max = Math.max(...data.map((d) => d.count), 1)
  const chart = {
    width: 520,
    height: 260,
    left: 52,
    right: 20,
    top: 28,
    bottom: 44,
  }
  const plotWidth = chart.width - chart.left - chart.right
  const plotHeight = chart.height - chart.top - chart.bottom
  const barSlot = plotWidth / data.length
  const barWidth = Math.min(58, barSlot * 0.52)

  return (
    <div className="relative h-full">
      <svg className="h-full w-full overflow-visible" viewBox={`0 0 ${chart.width} ${chart.height}`} role="img" aria-label="Department ticket distribution bar chart">
        <defs>
          {data.map((item) => {
            const colors = item.colors ?? DEPARTMENT_COLORS.Other
            return (
              <linearGradient key={item.name} id={`departmentGradient-${item.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors.from} />
                <stop offset="100%" stopColor={colors.to} />
              </linearGradient>
            )
          })}
        </defs>

        {Array.from({ length: 5 }).map((_, i) => {
          const y = chart.top + (plotHeight / 4) * i
          const value = Math.round(max - (max / 4) * i)
          return (
            <g key={i}>
              <line x1={chart.left} y1={y} x2={chart.width - chart.right} y2={y} stroke="#E5E7EB" strokeDasharray="3 3" />
              <text x={chart.left - 12} y={y + 4} textAnchor="end" className="fill-slate-500 text-[11px] font-semibold">
                {value}
              </text>
            </g>
          )
        })}

        <text
          x="14"
          y={chart.top + plotHeight / 2}
          textAnchor="middle"
          className="fill-slate-500 text-[11px] font-bold"
          transform={`rotate(-90 14 ${chart.top + plotHeight / 2})`}
        >
          Total Tickets
        </text>

        {data.map((item, index) => {
          const barHeight = (item.count / max) * plotHeight
          const x = chart.left + index * barSlot + (barSlot - barWidth) / 2
          const y = chart.top + plotHeight - barHeight
          const r = Math.min(10, barWidth / 2, barHeight)
          const barPath = `
            M ${x} ${chart.top + plotHeight}
            L ${x} ${y + r}
            Q ${x} ${y} ${x + r} ${y}
            L ${x + barWidth - r} ${y}
            Q ${x + barWidth} ${y} ${x + barWidth} ${y + r}
            L ${x + barWidth} ${chart.top + plotHeight}
            Z
          `
          return (
            <g key={item.name} onMouseEnter={() => setActiveBar(item)} onMouseLeave={() => setActiveBar(null)}>
              <text x={x + barWidth / 2} y={y - 8} textAnchor="middle" className="fill-slate-900 text-[12px] font-extrabold">
                {item.count}
              </text>
              <path
                d={barPath}
                fill={`url(#departmentGradient-${item.key})`}
                className="cursor-pointer drop-shadow-sm transition-all duration-300 ease-in-out [animation:bar-rise_900ms_ease-out_both] hover:opacity-90"
                style={{ transformOrigin: `${x + barWidth / 2}px ${chart.top + plotHeight}px` }}
              />
              <text x={x + barWidth / 2} y={chart.height - 16} textAnchor="middle" className="fill-slate-700 text-[12px] font-bold">
                {item.name}
              </text>
            </g>
          )
        })}
      </svg>

      <style>
        {`@keyframes bar-rise {
          from { transform: scaleY(0); opacity: 0.45; }
          to { transform: scaleY(1); opacity: 1; }
        }`}
      </style>

      {activeBar && (
        <div className="pointer-events-none absolute right-5 top-4 z-10 rounded-xl bg-white px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
          <p className="text-sm font-extrabold text-[#0F172A]">Department: {activeBar.name}</p>
          <p className="mt-1 text-xs font-semibold text-slate-600">Tickets: {activeBar.count}</p>
        </div>
      )}
    </div>
  )
}

function LineChartMock({ data }) {
  if (!data || data.length === 0) return <div className="p-6 text-sm text-slate-600">No data available</div>
  const values = data.map((d) => d.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  const points = data
    .map((d, i) => {
      const denom = data.length > 1 ? data.length - 1 : 1
      const x = (i / denom) * 280
      const y = 90 - ((d.value - min) / range) * 70
      return { x, y }
    })
    .map((p) => `${p.x},${p.y}`)
    .join(' ')

  return (
    <div className="flex h-full flex-col">
      <svg className="min-h-0 flex-1" width="100%" height="100%" viewBox="0 0 300 160" preserveAspectRatio="none">
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={COLORS.blue} stopOpacity="0.85" />
            <stop offset="1" stopColor={COLORS.indigo} stopOpacity="0.85" />
          </linearGradient>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={COLORS.indigo} stopOpacity="0.25" />
            <stop offset="1" stopColor={COLORS.indigo} stopOpacity="0.05" />
          </linearGradient>
        </defs>

        <g opacity="0.9">
          {Array.from({ length: 4 }).map((_, i) => {
            const y = 20 + i * 30
            return <line key={i} x1="0" y1={y} x2="300" y2={y} stroke="#E5E7EB" strokeDasharray="3 3" />
          })}
        </g>

        <polyline points={points} fill="none" stroke="url(#lineGrad)" strokeWidth="3" />
        <path
          d={`M ${points.split(' ')[0]} L ${points} L 280,150 L 0,150 Z`}
          fill="url(#areaGrad)"
          opacity="1"
        />
      </svg>

      <div className="mt-2 flex justify-between px-2 text-[11px] font-extrabold text-slate-600">
        {data.map((d, i) => (i % Math.ceil(data.length / 6) === 0 || i === data.length - 1 ? <span key={d.label || d.date}>{d.label ?? d.date}</span> : null))}
      </div>
    </div>
  )
}

function AnalyticsOverview({ tickets }) {
  const issueMap = {}
  const deptMap = {} // kept for compatibility but not used below
  const priorityMap = {}
  const dateMap = {}

  try {
    console.log('AnalyticsOverview: tickets type:', typeof tickets, Array.isArray(tickets))
    console.log('AnalyticsOverview: tickets preview:', (tickets || []).slice(0, 5))

    ;(Array.isArray(tickets) ? tickets : []).forEach((t) => {
      if (!t || typeof t !== 'object') {
        console.warn('AnalyticsOverview: skipping non-object ticket:', t)
        return
      }

      const issue = t.issueType || t.issueCategory || 'Unknown'
      issueMap[issue] = (issueMap[issue] || 0) + 1

      const dept = t.department || 'Unknown'
      deptMap[dept] = (deptMap[dept] || 0) + 1

      const pr = t.priority || 'Medium'
      priorityMap[pr] = (priorityMap[pr] || 0) + 1

      const created = t.createdAt ? new Date(t.createdAt) : null
      if (created && !Number.isNaN(created.getTime())) {
        const d = created.toISOString().slice(0, 10)
        dateMap[d] = (dateMap[d] || 0) + 1
      }
    })
  } catch (err) {
    console.error('AnalyticsOverview data generation failed:', err)
  }

  const issueData = Object.keys(issueMap).map((k, i) => ({ name: k, count: issueMap[k], color: [COLORS.blue, COLORS.indigo, COLORS.green, COLORS.orange, COLORS.red, COLORS.slate][i % 6] }))
  const departmentData = useMemo(() => {
    const counts = {}
    const list = Array.isArray(tickets) ? tickets : []

    list.forEach((ticket) => {
      if (!ticket || typeof ticket !== 'object') return
      const department = ticket.department == null ? '' : String(ticket.department).trim()
      if (!department) return
      counts[department] = (counts[department] || 0) + 1
    })

    return Object.keys(counts)
      .map((department) => ({
        name: department,
        key: department.replace(/[^a-zA-Z0-9]/g, '') || department,
        count: counts[department],
        colors: DEPARTMENT_COLORS[department] ?? DEPARTMENT_COLORS.Other,
      }))
      .sort((a, b) => b.count - a.count)
  }, [tickets])

  const priorityOrder = ['High', 'Medium', 'Low']
  const orderedPriorities = [
    ...priorityOrder.filter((priority) => priorityMap[priority]),
    ...Object.keys(priorityMap).filter((priority) => !priorityOrder.includes(priority)),
  ]
  const priorityData = orderedPriorities.map((priority) => ({
    name: priority,
    value: priorityMap[priority],
    color: PRIORITY_COLORS[priority]?.base ?? COLORS.slate,
  }))

  const dates = Object.keys(dateMap).sort()
  const lineData = dates.map((d) => ({ date: d, label: d, value: dateMap[d] }))

  const chartCardClass =
    'rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.08)] transition duration-300 ease-in-out hover:-translate-y-0.5'
  const chartHeaderClass = 'border-b border-slate-200 pb-4 mb-5'

  return (
    <div className="rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.10)]">
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-base font-extrabold text-[#0B1F4D]">Analytics Overview</p>
            <p className="mt-1 text-sm text-slate-600">Enterprise view of ticket distribution and creation trends.</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className={`${chartCardClass} h-[400px]`}>
            <div className={chartHeaderClass}>
              <p className="text-[18px] font-bold text-[#0F172A]">Priority Distribution</p>
              <p className="mt-1 text-sm text-[#64748B]">Ticket breakdown by priority</p>
            </div>
            <div className="h-[300px]">
              <PriorityDonutChart data={priorityData} />
            </div>
          </div>

          <div className="h-[450px] rounded-[20px] border border-[#E2E8F0] bg-white p-6 shadow-[0_8px_25px_rgba(15,23,42,0.06)] transition-all duration-300 ease-in-out hover:-translate-y-[3px] hover:shadow-[0_15px_35px_rgba(15,23,42,0.10)]">
            <div className={`${chartHeaderClass} flex items-start justify-between gap-4`}>
              <div>
                <p className="text-[18px] font-bold text-[#0F172A]">Department Ticket Distribution</p>
                <p className="mt-1 text-sm text-[#64748B]">Number of tickets raised per department</p>
              </div>
              <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-extrabold text-slate-700">
                Departments: {departmentData.length}
              </span>
            </div>
            <div className="h-[325px]">
              <DepartmentTicketBarChart data={departmentData} />
            </div>
          </div>

          <div className={`${chartCardClass} h-[420px] lg:col-span-2`}>
            <div className={chartHeaderClass}>
              <p className="text-sm font-extrabold text-[#0B1F4D]">Ticket Trend Analysis</p>
              <p className="mt-1 text-xs font-medium text-slate-500">Daily ticket creation trend</p>
            </div>
            <div className="h-[330px]">
              <LineChartMock data={lineData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const emptyFilters = {
  searchTicket: '',
  searchEmployee: '',
  department: 'All',
  issueCategory: 'All',
  priority: 'All',
  status: 'All',
  assignedTeam: 'All',
  device: 'All',
  computerId: '',
  dateFrom: '',
  dateTo: '',
}

const systemStatuses = ['AI Online', 'Database Connected', 'Jira Connected', 'Gemini Connected']
const aiUnavailableMessage = 'Unable to generate an AI suggestion at this time. Please try again later.'

function buildAdminPanelAnalysis(input, response) {
  return {
    input,
    rootCause: response?.rootCause || aiUnavailableMessage,
    recommendedResolution: [response?.solution || aiUnavailableMessage],
    priorityRecommendation: input?.priority || 'Not specified',
    confidence: response?.humanSupportRequired ? 'Human support recommended' : 'AI suggestion generated',
  }
}

export default function AdminDashboard() {
  const [filters, setFilters] = useState(emptyFilters)
  const [tickets, setTickets] = useState([])
  const [error, setError] = useState('')
  const [analysis, setAnalysis] = useState(null)

  useEffect(() => {
    async function loadTickets() {
      try {
        setError('')
        setTickets(await getAllTickets())
      } catch (err) {
        setError(err?.response?.data?.message ?? 'Unable to load tickets')
      }
    }

    void loadTickets()
  }, [])

  const overviewRef = useRef(null)
  const location = useLocation()

  useEffect(() => {
    if (location.hash === '#overview' && overviewRef.current) {
      try {
        overviewRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      } catch (e) {
        overviewRef.current.scrollIntoView()
      }
    }
  }, [location.hash])

  useEffect(() => {
    console.log('AdminDashboard: tickets changed, count=', (tickets || []).length)
  }, [tickets])

  const filteredTickets = useMemo(() => {
    const qTicket = filters.searchTicket.trim().toLowerCase()
    const qEmp = filters.searchEmployee.trim().toLowerCase()
    const qComp = filters.computerId.trim().toLowerCase()

    const from = filters.dateFrom ? new Date(filters.dateFrom) : null
    const to = filters.dateTo ? new Date(filters.dateTo) : null

    return tickets.filter((t) => {
      if (qTicket && !String(t.ticketId).includes(qTicket)) return false
      if (qEmp && !t.userName.toLowerCase().includes(qEmp) && !(t.employeeName && t.employeeName.toLowerCase().includes(qEmp))) return false
      if (qComp) return false

      if (filters.department !== 'All' && t.department !== filters.department) return false

      if (filters.issueCategory !== 'All' && t.issueType !== filters.issueCategory) return false

      if (filters.priority !== 'All' && t.priority !== filters.priority) return false
      if (filters.status !== 'All' && t.status !== filters.status) return false

      // date range filter on created date
      if (from) {
        const created = new Date(t.createdAt)
        if (created < from) return false
      }
      if (to) {
        const created = new Date(t.created)
        if (created > to) return false
      }

      return true
    })
  }, [filters, tickets])

  const handleAnalyzeTicket = async (ticket) => {
    const input = buildAdminAnalysisInput(ticket)
    if (!input) {
      setAnalysis(null)
      return
    }

    try {
      const response = await analyzeIssue(input)
      setAnalysis(buildAdminPanelAnalysis(input, response))
    } catch (err) {
      setAnalysis(buildAdminPanelAnalysis(input, {
        rootCause: aiUnavailableMessage,
        solution: aiUnavailableMessage,
        humanSupportRequired: true,
      }))
    }
  }

  const handleUpdateStatus = async (ticketId, selectedStatus) => {
    try {
      const user = getStoredUser()
      const updatedTicket = await updateTicketStatus(ticketId, {
        status: selectedStatus,
        performedBy: user?.userId ?? 0,
        remarks: 'Status updated from admin dashboard',
      })

      setTickets((prev) =>
        prev.map((ticket) =>
          ticket.ticketId === updatedTicket.ticketId
            ? { ...ticket, status: selectedStatus }
            : ticket,
        ),
      )

      return { ok: true }
    } catch (err) {
      return { ok: false, message: err?.response?.data?.message ?? 'Unable to update ticket status' }
    }
  }

  return (
    <DashboardLayout variant="admin">
      <div className="relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="bg-enterprise-grid absolute inset-0 opacity-20" />
        </div>

        <div className="relative">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm font-extrabold text-[#0F766E]">Admin Dashboard</p>
              <h1 className="text-3xl md:text-4xl font-extrabold leading-tight text-[#0B1F4D]">
                Admin Control Center
              </h1>
              <p className="text-slate-600 max-w-2xl mt-2 text-base">
                Manage Tickets • Users • Reports • AI Insights
              </p>
            </div>

            <div className="min-w-[280px]">
              <AdminSectionBoundary title="Export tools">
                <ExportSection />
              </AdminSectionBoundary>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {systemStatuses.map((label) => (
              <div key={label} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
                </span>
                <span className="text-sm font-extrabold text-slate-800">{label}</span>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <AdminSectionBoundary title="Dashboard overview">
              <DashboardStats tickets={tickets} />
            </AdminSectionBoundary>
          </div>

          <div className="mt-6">
            <AdminSectionBoundary title="Ticket management">
              <TicketManagementTable tickets={filteredTickets} onAnalyze={handleAnalyzeTicket} onUpdateStatus={handleUpdateStatus} />
            </AdminSectionBoundary>
          </div>

          {error ? <p className="mt-4 text-sm font-semibold text-red-600">{error}</p> : null}

          <div className="mt-6">
            <AdminSectionBoundary title="AI analysis">
              <AdminAiAnalysisPanel analysis={analysis} />
            </AdminSectionBoundary>
          </div>

          <div className="mt-6">
            <AdminSectionBoundary title="Smart filters">
              <SmartFilters filters={filters} onChange={setFilters} onReset={() => setFilters(emptyFilters)} />
            </AdminSectionBoundary>
          </div>

          {/* Analytics Overview moved below Smart Filters as requested */}
          <div className="mt-6" id="overview" ref={overviewRef}>
            <AdminSectionBoundary title="Analytics Overview">
              <AnalyticsOverview tickets={tickets} />
            </AdminSectionBoundary>
          </div>

          {/* Recent Activities section removed */}
        </div>
      </div>
    </DashboardLayout>
  )
}
