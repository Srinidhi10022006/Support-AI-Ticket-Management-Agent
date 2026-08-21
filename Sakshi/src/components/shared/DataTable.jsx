import { useState } from 'react'
import Panel from './Panel.jsx'
import SectionHeader from './SectionHeader.jsx'

export default function DataTable({
  title,
  subtitle,
  titleClassName = 'text-sm font-extrabold text-[#0B1F4D]',
  headerAction = null,
  headerContainerClassName = 'flex items-start justify-between gap-4 flex-wrap',
  panelClassName = 'glass-card rounded-3xl p-6 bg-white/55 border border-white/50 backdrop-blur shadow-soft',
  tableWrapperClassName = 'mt-4 rounded-3xl border border-white/50 bg-white/40',
  tableInnerClassName = '',
  headerRowClassName = 'hidden md:grid bg-white/70 border-b border-white/60 px-4 py-3 text-xs font-extrabold text-slate-600',
  headerGridClassName = 'grid w-full items-center gap-3',
  bodyClassName = 'divide-y divide-white/30',
  rowContainerClassName = 'px-2 md:px-0',
  rowButtonClassName = 'w-full text-left py-4 md:py-5 grid gap-3',
  expandedRowClassName = 'pb-5 md:pl-0 md:pr-2',
  columnTemplate,
  rows,
  getRowKey,
  renderHeaderCells,
  renderRowCells,
  renderExpandedRow,
  emptyState = null,
}) {
  const [openKey, setOpenKey] = useState(null)

  return (
    <Panel className={panelClassName}>
      <SectionHeader
        title={title}
        subtitle={subtitle}
        titleClassName={titleClassName}
        containerClassName={headerContainerClassName}
        action={headerAction}
      />

      <div className={tableWrapperClassName}>
        <div className={tableInnerClassName}>
          {renderHeaderCells ? (
            <div className={headerRowClassName}>
              <div className={headerGridClassName} style={{ gridTemplateColumns: columnTemplate }}>
                {renderHeaderCells()}
              </div>
            </div>
          ) : null}

          <div className={bodyClassName}>
            {rows.map((row, rowIndex) => {
              const key = getRowKey(row)
              const isOpen = openKey === key
              const toggle = () => setOpenKey((current) => (current === key ? null : key))
              const resolvedRowContainerClassName =
                typeof rowContainerClassName === 'function'
                  ? rowContainerClassName({ row, rowIndex, isOpen })
                  : rowContainerClassName

              return (
                <div key={key} className={resolvedRowContainerClassName}>
                  <button
                    type="button"
                    onClick={toggle}
                    className={rowButtonClassName}
                    style={{ gridTemplateColumns: columnTemplate }}
                  >
                    {renderRowCells({ row, isOpen, toggle })}
                  </button>

                  {isOpen && renderExpandedRow ? (
                    <div className={expandedRowClassName}>
                      {renderExpandedRow({ row, isOpen, toggle })}
                    </div>
                  ) : null}
                </div>
              )
            })}

            {!rows.length ? emptyState : null}
          </div>
        </div>
      </div>
    </Panel>
  )
}
