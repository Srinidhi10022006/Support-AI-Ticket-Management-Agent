export default function DashboardPageHeader({
  eyebrow = null,
  title,
  description,
  action = null,
}) {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div>
        {eyebrow ? <p className="text-sm font-extrabold text-[#0B1F4D]">{eyebrow}</p> : null}
        <h1 className="text-3xl md:text-4xl font-extrabold leading-tight text-[#0B1F4D]">{title}</h1>
        {description ? <p className="text-slate-600 max-w-2xl mt-2 text-base">{description}</p> : null}
      </div>
      {action}
    </div>
  )
}
