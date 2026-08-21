import { FileSpreadsheet, FileText, Printer } from 'lucide-react'
import Button from '../shared/Button.jsx'
import Panel from '../shared/Panel.jsx'

const exportActions = [
  { label: 'Export CSV', icon: FileSpreadsheet },
  { label: 'Export Excel', icon: FileSpreadsheet },
  { label: 'Export PDF', icon: FileText },
  { label: 'Print Report', icon: Printer },
]

export default function ExportSection() {
  function handleClick() {
    // No backend; export buttons are UI-only.
    // Could be wired later to generate CSV/PDF/Excel from filtered data.
    alert('Export is not available yet.')
  }

  const btnCls =
    'inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0F766E] px-4 py-3 font-extrabold text-white shadow-[0_12px_24px_rgba(15,118,110,0.20)] transition hover:bg-[#115E59]'

  return (
    <Panel className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
      <p className="text-sm font-extrabold text-slate-900">Export Reports</p>
      <p className="mt-1 text-xs font-semibold text-slate-500">Download operational views</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {exportActions.map(({ label, icon: Icon }) => (
          <Button key={label} className={btnCls} onClick={handleClick}>
            <Icon className="h-4 w-4" />
            {label}
          </Button>
        ))}
      </div>
    </Panel>
  )
}

