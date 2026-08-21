import { useMemo } from 'react'
import { KpiCards } from '../dashboard/KpiCards.jsx'
import SectionHeader from '../shared/SectionHeader.jsx'

export default function DashboardStats({ tickets = [] }) {
  const cards = useMemo(() => {
    const open = tickets.filter((ticket) => ticket.status === 'Open' || ticket.status === 'In Progress').length
    const resolved = tickets.filter((ticket) => ticket.status === 'Resolved' || ticket.status === 'Closed').length
    const high = tickets.filter((ticket) => ticket.priority === 'High').length

    return [
      { title: 'Total Tickets', value: tickets.length, subtext: 'All recorded tickets', trend: `${tickets.length} total`, accent: 'blue' },
      { title: 'Open Tickets', value: open, subtext: 'Open or in progress', trend: `${open} active`, accent: 'orange' },
      { title: 'Resolved Tickets', value: resolved, subtext: 'Resolved or closed', trend: `${resolved} completed`, accent: 'green' },
      { title: 'High Priority', value: high, subtext: 'Urgent support work', trend: `${high} high`, accent: 'red' },
    ]
  }, [tickets])

  return (
    <div>
      <SectionHeader title="Dashboard Overview" subtitle="Ticket metrics from the support database." containerClassName="flex items-center justify-between gap-4 flex-wrap" />
      <div className="mt-4"><KpiCards cards={cards} variant="admin" /></div>
    </div>
  )
}
