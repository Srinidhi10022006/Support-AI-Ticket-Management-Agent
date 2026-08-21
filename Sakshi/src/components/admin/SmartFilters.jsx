import { useMemo } from 'react'
import { FilterX, Download } from 'lucide-react'
import Button from '../shared/Button.jsx'
import Panel from '../shared/Panel.jsx'
import SectionHeader from '../shared/SectionHeader.jsx'
import FilterInput from '../shared/FilterInput.jsx'
import FilterSelect from '../shared/FilterSelect.jsx'
import FilterDate from '../shared/FilterDate.jsx'

const departments = ['All', 'IT Services', 'Finance', 'HR', 'Operations', 'Admin', 'Marketing', 'Sales', 'Customer Support']
const priorities = ['All', 'High', 'Medium', 'Low']
const statuses = ['All', 'Open', 'Resolved', 'Waiting', 'Escalated']

export default function SmartFilters({ filters, onChange, onReset }) {
  const set = (key, value) => {
    onChange?.({ ...filters, [key]: value })
  }

  const derivedCountLabel = useMemo(() => {
    const items = [
      filters.searchTicket && 'Ticket',
      filters.searchEmployee && 'Employee',
      filters.computerId && 'Computer',
    ].filter(Boolean)
    return items.length ? `${items.join(', ')} active` : 'No filters active'
  }, [filters])

  return (
    <Panel className="glass-card rounded-3xl p-6 bg-white/55 border border-white/50 backdrop-blur shadow-soft">
      <SectionHeader
        title="Smart Filters"
        subtitle="Professional filters to slice and export ticket data."
        action={
          <div className="text-xs font-extrabold text-slate-600 inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#007CC3]" />
            {derivedCountLabel}
          </div>
        }
      />

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <FilterInput label="Search Ticket" value={filters.searchTicket} onChange={(v) => set('searchTicket', v)} />
        <FilterInput label="Search Employee" value={filters.searchEmployee} onChange={(v) => set('searchEmployee', v)} />

        <FilterSelect label="Department" value={filters.department} options={departments} onChange={(v) => set('department', v)} />
        <FilterSelect label="Issue" value={filters.issueCategory} options={['All', 'SAP', 'VPN', 'Printer', 'Network', 'Email', 'Software Installation', 'Hardware', 'Windows', 'Database']} onChange={(v) => set('issueCategory', v)} />
        <FilterSelect label="Priority" value={filters.priority} options={priorities} onChange={(v) => set('priority', v)} />
        <FilterSelect label="Status" value={filters.status} options={statuses} onChange={(v) => set('status', v)} />

        <FilterSelect label="Assigned Team" value={filters.assignedTeam} options={['All', 'Finance Support', 'IT Services', 'Operations', 'HR Support', 'Device Team']} onChange={(v) => set('assignedTeam', v)} />
        <FilterSelect label="Device" value={filters.device} options={['All', 'PC', 'Printer', 'Router', 'Application']} onChange={(v) => set('device', v)} />

        <FilterInput label="Computer ID" value={filters.computerId} onChange={(v) => set('computerId', v)} />

        <div className="grid grid-cols-2 gap-4 md:col-span-2 xl:col-span-3">
          <FilterDate label="Date From" value={filters.dateFrom} onChange={(v) => set('dateFrom', v)} />
          <FilterDate label="Date To" value={filters.dateTo} onChange={(v) => set('dateTo', v)} />
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-4 flex-wrap">
        <Button
          onClick={() => onReset?.()}
          className="rounded-3xl px-6 py-3 font-extrabold text-white bg-[#0F766E] border border-[#0F766E] hover:bg-[#115E59] transition inline-flex items-center gap-2"
        >
          <FilterX className="h-4 w-4" />
          Reset Filters
        </Button>

        <div className="text-xs text-slate-500 inline-flex items-center gap-2">
          <Download className="h-4 w-4 text-[#007CC3]" />
          Table updates instantly
        </div>
      </div>
    </Panel>
  )
}

