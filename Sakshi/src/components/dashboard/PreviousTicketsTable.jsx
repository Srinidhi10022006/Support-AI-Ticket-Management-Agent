import { useMemo } from 'react'
import { ChevronDown, Clock, FileText, ShieldCheck } from 'lucide-react'
import DataTable from '../shared/DataTable.jsx'

const statusConfig = {
  Open: { cls: 'bg-orange-50 text-orange-700 border-orange-200', dot: 'bg-[#F59E0B]' },
  Resolved: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-[#22C55E]' },
  Waiting: { cls: 'bg-slate-50 text-slate-700 border-slate-200', dot: 'bg-slate-500' },
  Escalated: { cls: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-[#EF4444]' },
}

const fallbackStatus = { cls: 'bg-slate-50 text-slate-700 border-slate-200', dot: 'bg-slate-500' }
const mojibakeApostrophe = '\u00C3\u00A2\u00E2\u201A\u00AC\u00E2\u201E\u00A2'
const mojibakeBullet = '\u00C3\u00A2\u00E2\u201A\u00AC\u00C2\u00A2'

const columnTemplate =
  'minmax(120px, 1fr) minmax(250px, 3fr) minmax(170px, 1.5fr) minmax(120px, 1fr) minmax(140px, 1fr) minmax(180px, 1.5fr) minmax(140px, 1fr) minmax(140px, 1fr) minmax(80px, auto)'

function formatDate(value) {
  if (!value) return '—'

  return new Intl.DateTimeFormat('en-CA').format(new Date(value))
}

export function PreviousTicketsTable({ tickets = [] }) {
  const rows = useMemo(
    () =>
      [...tickets].sort((a, b) => Number(b.ticketId ?? 0) - Number(a.ticketId ?? 0)).map((ticket) => ({
        id: `ATK-${ticket.ticketId}`,
        subject: ticket.subject,
        category: ticket.issueType,
        aiPriority: ticket.priority ?? 'Medium',
        status: ticket.status ?? 'Open',
        team: ticket.department ?? 'Not Assigned',
        created: formatDate(ticket.createdAt),
        updated: '—',
        summary: ticket.description,
        conversation: 'No conversation details are available for this ticket.',
        attachments: [],
        notes: 'No engineer notes yet.',
      })),
    [tickets],
  )

  return (
    <DataTable
      title="Previous Tickets"
      titleClassName="text-lg font-extrabold text-[#0B1F4D]"
      subtitle={`Hover animations ${mojibakeBullet} expandable timeline ${mojibakeBullet} AI summary`}
      headerContainerClassName="flex items-start justify-between gap-4"
      headerAction={
        <div className="hidden sm:flex h-11 w-11 rounded-2xl bg-gradient-to-br from-[#007CC3]/20 to-[#6D5DF6]/20 border border-white/50 items-center justify-center">
          <ShieldCheck className="h-5 w-5 text-[#007CC3]" />
        </div>
      }
      tableWrapperClassName="mt-4 max-h-[460px] overflow-y-auto overflow-x-hidden rounded-3xl border border-white/50 bg-white/40"
      tableInnerClassName="overflow-hidden md:overflow-x-visible"
      headerRowClassName="sticky top-0 z-10 hidden md:grid bg-white/90 border-b border-white/60 px-4 py-3 text-xs font-extrabold text-slate-600 backdrop-blur"
      columnTemplate={columnTemplate}
      rows={rows}
      getRowKey={(row) => row.id}
      renderHeaderCells={() => (
        <>
          <div>Ticket ID</div>
          <div>Subject</div>
          <div>Category</div>
          <div>AI Priority</div>
          <div>Status</div>
          <div>Department</div>
          <div>Created Date</div>
          <div>Last Updated</div>
          <div>Actions</div>
        </>
      )}
      renderRowCells={({ row, isOpen }) => {
        const statusStyles = statusConfig[row.status] ?? fallbackStatus

        return (
          <>
            <div className="px-2 md:px-4 font-extrabold text-[#2563EB]">{row.id}</div>

            <div className="min-w-0 px-1 md:px-0 font-semibold text-slate-800 flex items-start gap-3">
              <div className="mt-2 h-2.5 w-2.5 rounded-full bg-[#007CC3]" />
              <div className="min-w-0">
                <div className="text-sm font-extrabold text-[#0B1F4D] break-words whitespace-normal">
                  {row.subject}
                </div>
                <div className="text-xs text-slate-600 md:hidden mt-1">
                  {row.category} {mojibakeBullet} {row.aiPriority}
                </div>
              </div>
            </div>

            <div className="hidden md:block text-sm font-semibold text-slate-800 min-w-0">
              {row.category}
            </div>

            <div className="hidden md:block text-sm font-semibold text-slate-800 min-w-0">
              {row.aiPriority}
            </div>

            <div className="hidden md:block">
              <span
                className={`inline-flex items-center gap-2 border rounded-full px-3 py-1 text-xs font-extrabold ${statusStyles.cls}`}
              >
                <span className={`h-2 w-2 rounded-full ${statusStyles.dot}`} />
                {row.status}
              </span>
            </div>

            <div className="hidden md:block text-sm font-semibold text-slate-800 min-w-0">
              {row.team}
            </div>

            <div className="hidden md:block text-sm font-semibold text-slate-800 min-w-0">
              {row.created}
            </div>

            <div className="hidden md:block text-sm font-semibold text-slate-800 min-w-0">
              {row.updated}
            </div>

            <div className="flex items-center justify-between md:justify-start gap-3 px-1 md:px-4">
              <span className="md:hidden inline-flex items-center gap-2 border rounded-full px-3 py-1 text-xs font-extrabold border-slate-200 bg-white/70">
                <Clock className="h-3.5 w-3.5 text-slate-700" />
                {row.status}
              </span>

              <span className="inline-flex items-center gap-2 text-xs font-extrabold text-slate-600">
                <ChevronDown className={isOpen ? 'h-4 w-4 transition rotate-180' : 'h-4 w-4 transition'} />
                Details
              </span>
            </div>
          </>
        )
      }}
      renderExpandedRow={({ row }) => {
        const attachments = Array.isArray(row.attachments) ? row.attachments : []

        return (
          <div className="mt-0.5 rounded-3xl bg-white/60 border border-white/60 p-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-white/70 border border-white/60 p-4">
                <p className="text-sm font-extrabold text-[#0B1F4D]">Timeline</p>
                <div className="mt-3 space-y-2 text-sm font-semibold text-slate-700">
                  <div className="flex items-start gap-2">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#007CC3]" />
                    <span>
                      <span className="font-extrabold">AI Summary:</span> {row.summary}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#6D5DF6]" />
                    <span>
                      <span className="font-extrabold">Conversation:</span> {row.conversation}
                    </span>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl bg-white/70 border border-white/60 p-4">
                <p className="text-sm font-extrabold text-[#0B1F4D]">Attachments & Notes</p>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <FileText className="h-4 w-4 text-[#007CC3]" />
                    <div className="flex flex-wrap gap-2">
                      {attachments.map((attachment) => (
                        <span
                          key={attachment}
                          className="px-3 py-1 rounded-full bg-white/80 border border-white/60 text-xs font-bold"
                        >
                          {attachment}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-slate-600">
                    Engineer Notes:{' '}
                    <span className="font-extrabold text-slate-800">{row.notes}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )
      }}
      expandedRowClassName="pb-5 md:pl-[0px] md:pr-2"
      emptyState={
        <p className="px-4 py-8 text-center text-sm font-semibold text-slate-600">
          You have not raised any tickets yet.
        </p>
      }
    />
  )
}
