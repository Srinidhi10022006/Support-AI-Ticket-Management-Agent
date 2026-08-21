import Panel from '../shared/Panel.jsx'
import SectionHeader from '../shared/SectionHeader.jsx'

const inputLabels = [
  ['subject', 'Subject'],
  ['issueType', 'Issue Type'],
  ['description', 'Description'],
  ['priority', 'Priority'],
  ['employeeName', 'Employee Name'],
  ['department', 'Department'],
]

export default function AdminAiAnalysisPanel({ analysis }) {
  return (
    <Panel className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
      <SectionHeader
        title="AI Analysis"
        subtitle="AI analysis from the selected ticket details."
        containerClassName="flex items-start justify-between gap-4 flex-wrap"
      />

      {!analysis ? (
        <p className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-600">
          Select a ticket and click Analyze to generate support guidance.
        </p>
      ) : (
        <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_1.15fr]">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-extrabold text-[#0B1F4D]">Analysis Input</p>
            <div className="mt-3 grid gap-3">
              {inputLabels.map(([key, label]) => (
                <div key={key}>
                  <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">{label}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">{analysis.input[key] || '-'}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-teal-100 bg-teal-50/40 p-4">
            <div>
              <p className="text-sm font-extrabold text-[#0B1F4D]">Root Cause</p>
              <p className="mt-2 text-sm font-semibold text-slate-700">{analysis.rootCause}</p>
            </div>

            <div className="mt-5">
              <p className="text-sm font-extrabold text-[#0B1F4D]">Recommended Resolution</p>
              <ul className="mt-2 space-y-2">
                {analysis.recommendedResolution.map((item) => (
                  <li key={item} className="flex gap-2 text-sm font-semibold text-slate-700">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#0F766E]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white bg-white p-3">
                <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Priority Recommendation</p>
                <p className="mt-1 text-lg font-extrabold text-[#0F766E]">{analysis.priorityRecommendation}</p>
              </div>
              <div className="rounded-2xl border border-white bg-white p-3">
                <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Confidence</p>
                <p className="mt-1 text-lg font-extrabold text-[#0F766E]">{analysis.confidence}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </Panel>
  )
}
