export default function SectionHeader({
  title,
  subtitle,
  action = null,
  titleTag: TitleTag = 'p',
  titleClassName = 'text-sm font-extrabold text-[#0B1F4D]',
  subtitleClassName = 'text-sm text-slate-600 mt-1',
  containerClassName = 'flex items-start justify-between gap-4 flex-wrap',
}) {
  return (
    <div className={containerClassName}>
      <div>
        <TitleTag className={titleClassName}>{title}</TitleTag>
        {subtitle ? <p className={subtitleClassName}>{subtitle}</p> : null}
      </div>
      {action}
    </div>
  )
}
