import { useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import DataTable from '../shared/DataTable.jsx'

const statusToCls = {
  Open: { cls: 'bg-orange-50 text-orange-700 border-orange-200', dot: 'bg-[#F59E0B]' },
  'In Progress': { cls: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-[#3B82F6]' },
  Resolved: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-[#22C55E]' },
  Closed: { cls: 'bg-slate-800 text-white border-slate-800', dot: 'bg-slate-700' },
  Waiting: { cls: 'bg-slate-50 text-slate-700 border-slate-200', dot: 'bg-slate-500' },
  Escalated: { cls: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-[#EF4444]' },
}

const statusOptions = ['Open', 'In Progress', 'Resolved', 'Closed']

const priorityToBadge = {
  High: { bg: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-[#EF4444]' },
  Medium: { bg: 'bg-orange-50 text-orange-700 border-orange-200', dot: 'bg-[#F59E0B]' },
  Low: { bg: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-[#22C55E]' },
}

const columnTemplate =
  'minmax(110px, 1fr) minmax(180px, 1.6fr) minmax(140px, 1.2fr) minmax(180px, 1.8fr) minmax(120px, 1fr) minmax(120px, 1fr) minmax(140px, 1.1fr) minmax(80px, auto)'

function formatDate(value) {
  return value ? new Intl.DateTimeFormat('en-CA').format(new Date(value)) : '—'
}

export default function TicketManagementTable({ tickets, onAnalyze, onUpdateStatus }) {
  const [selectedStatusByTicket, setSelectedStatusByTicket] = useState({})
  const [statusMessage, setStatusMessage] = useState('')
  const [updatingTicketId, setUpdatingTicketId] = useState(null)

  const rows = useMemo(
    () => [...(tickets ?? [])].sort((a, b) => Number(b.ticketId ?? 0) - Number(a.ticketId ?? 0)),
    [tickets],
  )

  const handleSetStatus = async (ticket) => {
    const selectedStatus = selectedStatusByTicket[ticket.ticketId] ?? ticket.status
    if (!selectedStatus || selectedStatus === ticket.status) return

    setUpdatingTicketId(ticket.ticketId)
    setStatusMessage('')
    const result = await onUpdateStatus?.(ticket.ticketId, selectedStatus)
    setUpdatingTicketId(null)
    if (result?.ok) {
      setStatusMessage('Ticket status updated successfully.')
    } else {
      setStatusMessage(result?.message ?? 'Unable to update ticket status')
    }
  }

  return (
    <DataTable
      title="Ticket Management"
      subtitle="All tickets from the support database."
      headerAction={<div className="text-xs font-extrabold text-slate-600">{rows.length} tickets</div>}
      tableWrapperClassName="mt-4 max-h-[560px] overflow-auto rounded-3xl border border-slate-200 bg-white"
      headerRowClassName="sticky top-0 z-10 hidden md:grid border-b border-slate-200 bg-slate-100 px-4 py-3 text-xs font-extrabold uppercase tracking-wide text-slate-600 shadow-[0_8px_16px_rgba(15,23,42,0.04)]"
      bodyClassName="divide-y divide-slate-100"
      rowContainerClassName={({ rowIndex, isOpen }) =>
        `${rowIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'} px-2 md:px-0 transition-colors hover:bg-teal-50/60 ${isOpen ? 'bg-teal-50/70' : ''}`
      }
      rowButtonClassName="w-full text-left py-4 md:py-5 grid gap-3 transition-colors"
      columnTemplate={columnTemplate}
      rows={rows}
      getRowKey={(row) => row.ticketId}
      renderHeaderCells={() => (
        <>
          <div>Ticket ID</div>
          <div>User Name</div>
          <div>Department</div>
          <div>Issue Type</div>
          <div>Priority</div>
          <div>Status</div>
          <div>Created Date</div>
          <div>Details</div>
        </>
      )}
      renderRowCells={({ row, isOpen }) => {
        const status = statusToCls[row.status] ?? statusToCls.Waiting
        const priority = priorityToBadge[row.priority] ?? priorityToBadge.Low

        return (
          <>
            <div className="px-2 md:px-4 font-extrabold text-[#2563EB]">ATK-{row.ticketId}</div>
            <div className="min-w-0 px-1 md:px-0 text-sm font-extrabold text-[#0B1F4D]">{row.employeeName ?? row.userName ?? '—'}</div>
            <div className="hidden md:block text-sm font-semibold text-slate-800">{row.department ?? 'Not Assigned'}</div>
            <div className="hidden md:block text-sm font-semibold text-slate-800">{row.issueType}</div>
            <div className="hidden md:block">
              <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-extrabold shadow-sm ${priority.bg}`}>
                <span className={`h-2 w-2 rounded-full ${priority.dot}`} />
                {row.priority ?? '—'}
              </span>
            </div>
            <div className="hidden md:block">
              <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-extrabold shadow-sm ${status.cls}`}>
                <span className={`h-2 w-2 rounded-full ${status.dot}`} />
                {row.status}
              </span>
            </div>
            <div className="hidden md:block text-sm font-semibold text-slate-800">{formatDate(row.createdAt)}</div>
            <div className="flex items-center justify-end md:justify-start">
              <ChevronDown className={isOpen ? 'h-4 w-4 transition rotate-180' : 'h-4 w-4 transition'} />
            </div>
          </>
        )
      }}
      renderExpandedRow={({ row }) => {
        const currentStatus = row.status
        const selectedStatus = selectedStatusByTicket[row.ticketId] ?? currentStatus
        const isUpdating = updatingTicketId === row.ticketId

        return (
          <div className="mt-0.5 rounded-3xl bg-white/60 border border-white/60 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-extrabold text-[#0B1F4D]">Ticket Description</p>
                <p className="mt-1 text-sm text-slate-600">{row.description}</p>
                <p className="mt-3 text-sm text-slate-600">
                  <span className="font-extrabold text-[#0B1F4D]">Department: </span>
                  <span className="font-semibold text-slate-800">{row.department ?? 'Not Assigned'}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => onAnalyze?.(row)}
                className="rounded-2xl bg-[#0F766E] px-4 py-2 text-sm font-extrabold text-white shadow-[0_10px_20px_rgba(15,118,110,0.18)] transition hover:bg-[#115E59]"
              >
                Analyze
              </button>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white/70 p-3">
              <label className="text-sm font-extrabold text-[#0B1F4D]">Update Status</label>
              <select
                value={selectedStatus}
                onChange={(e) =>
                  setSelectedStatusByTicket((prev) => ({ ...prev, [row.ticketId]: e.target.value }))
                }
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={isUpdating || selectedStatus === currentStatus}
                onClick={() => void handleSetStatus(row)}
                className="rounded-xl bg-[#0F766E] px-4 py-2 text-sm font-extrabold text-white transition hover:bg-[#115E59] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isUpdating ? 'Updating…' : 'Set Status'}
              </button>
              {statusMessage && row.ticketId === updatingTicketId ? (
                <span className={`text-sm font-semibold ${statusMessage.includes('successfully') ? 'text-emerald-700' : 'text-red-600'}`}>
                  {statusMessage}
                </span>
              ) : null}
            </div>
          </div>
        )
      }}
      emptyState={
        <div className="p-8 text-center text-sm font-semibold text-slate-600">
          No tickets match the current filters.
        </div>
      }
    />
  )
}
