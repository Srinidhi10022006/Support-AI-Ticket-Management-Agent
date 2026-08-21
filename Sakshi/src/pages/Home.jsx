import { useEffect, useMemo, useState } from 'react'
import DashboardLayout from '../components/layout/DashboardLayout.jsx'
import { KpiCards } from '../components/dashboard/KpiCards.jsx'
import { PreviousTicketsTable } from '../components/dashboard/PreviousTicketsTable.jsx'
import RaiseTicket from './RaiseTicket.jsx'
import { getStoredUser } from '../auth/authStorage.js'
import { getMyTickets } from '../api/ticketApi.js'

export default function Home() {
  const [showRaiseTicket, setShowRaiseTicket] = useState(false)
  const [tickets, setTickets] = useState([])
  const [error, setError] = useState('')
  const user = getStoredUser()

  useEffect(() => {
    async function loadTickets() {
      if (!user?.userId) return

      try {
        setError('')
        const data = await getMyTickets(user.userId)
        setTickets(data)
      } catch (err) {
        setError(err?.response?.data?.message ?? 'Unable to load your tickets')
      }
    }

    void loadTickets()
  }, [showRaiseTicket, user?.userId])

  const cards = useMemo(() => {
    const openCount = tickets.filter((ticket) => ticket.status === 'Open' || ticket.status === 'In Progress').length
    const resolvedCount = tickets.filter((ticket) => ticket.status === 'Resolved' || ticket.status === 'Closed').length
    const highPriorityCount = tickets.filter((ticket) => ticket.priority === 'High').length

    return [
      {
        title: 'Total Tickets',
        value: tickets.length,
        subtext: 'Tickets linked to your account',
        trend: `${tickets.length} total`,
      },
      {
        title: 'Open Tickets',
        value: openCount,
        subtext: 'Open or in progress',
        trend: `${openCount} active`,
      },
      {
        title: 'Resolved Tickets',
        value: resolvedCount,
        subtext: 'Resolved or closed requests',
        trend: `${resolvedCount} completed`,
      },
      {
        title: 'High Priority',
        value: highPriorityCount,
        subtext: 'Manually assigned urgent work',
        trend: `${highPriorityCount} high`,
      },
      {
        title: 'Average Resolution Time',
        value: 15,
        suffix: ' min',
        subtext: 'Static until SLA metrics are added',
        trend: 'manual',
      },
    ]
  }, [tickets])

  return (
    <DashboardLayout>
      {showRaiseTicket ? (
        <RaiseTicket onBackToDashboard={() => setShowRaiseTicket(false)} />
      ) : (
        <div className="relative px-6 pb-10 pt-6">
          <div className="absolute inset-0 pointer-events-none">
            <div className="bg-enterprise-grid absolute inset-0 opacity-20" />
          </div>

          <section className="relative">
            <div className="grid gap-6 items-center lg:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/60 px-4 py-2 text-sm shadow-soft backdrop-blur">
                  <span className="inline-flex h-2 w-2 rounded-full bg-[#6D5DF6] shadow-[0_0_0_6px_rgba(109,93,246,0.12)]" />
                  <span className="font-semibold text-[#0B1F4D]">Infosys Support AI Ticket Management Agent</span>
                </div>
                <h1 className="text-3xl font-extrabold leading-tight text-[#0B1F4D] md:text-4xl">
                  Welcome back, <span className="text-[#007CC3]">{user?.fullName?.split(' ')[0] ?? 'User'}</span>
                </h1>
                <p className="max-w-xl text-base text-slate-600">
                  Need help today? Raise a ticket and let AI assist.
                </p>
              </div>

              <div className="relative">
                <div className="glass-card rounded-3xl p-6 shadow-panel backdrop-blur">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-bold text-[#0B1F4D]">Quick Raise Ticket</p>
                      <p className="text-sm text-slate-600">
                        Need IT support? Describe your issue and let AI help before creating a support ticket.
                      </p>
                    </div>
                  </div>

                  <div className="relative mt-4 h-40 overflow-hidden rounded-2xl border border-white/40 bg-gradient-to-r from-[#007CC3]/10 via-transparent to-[#6D5DF6]/10">
                    <div className="absolute -left-10 top-10 h-28 w-28 rounded-full bg-[#007CC3]/20 blur-2xl animate-floaty" />
                    <div className="absolute -right-6 bottom-6 h-24 w-24 rounded-full bg-[#6D5DF6]/20 blur-2xl animate-drift" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="text-center">
                        <div className="text-6xl">*</div>
                        <div className="mt-1 text-sm font-semibold text-[#0B1F4D]">AI-assisted ticket creation</div>
                      </div>
                      <div className="mt-4">
                        <button
                          onClick={() => setShowRaiseTicket(true)}
                          className="rounded-3xl bg-gradient-to-r from-[#007CC3] to-[#6D5DF6] px-6 py-3 font-extrabold text-white transition hover:brightness-110 shadow-[0_18px_50px_rgba(0,124,195,0.25)]"
                        >
                          Raise New Support Ticket
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <KpiCards cards={cards} />
            </div>
          </section>

          {error ? <p className="mt-6 text-sm font-semibold text-red-600">{error}</p> : null}

          <section className="mt-8 grid gap-6 lg:grid-cols-1">
            <div className="space-y-6">
              <PreviousTicketsTable tickets={tickets} />
            </div>
          </section>
        </div>
      )}
    </DashboardLayout>
  )
}
