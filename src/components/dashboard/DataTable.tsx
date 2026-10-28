import { useState, type ReactNode } from "react"
import { AnimatePresence, motion } from "motion/react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export type Column<T> = {
  id: string
  header: ReactNode
  cell: (row: T) => ReactNode
  className?: string
  headerClassName?: string
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  toolbar,
  empty,
  actions,
  actionsHeader,
  className,
  renderExpandedRow,
}: {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  toolbar?: ReactNode
  empty?: ReactNode
  actions?: (row: T) => ReactNode
  actionsHeader?: ReactNode
  className?: string
  renderExpandedRow?: (row: T) => ReactNode
}) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  function toggleRow(key: string) {
    setExpandedRows((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <section className={cn("rounded-[24px] bg-white p-4 sm:p-6 lg:p-7", className)}>
      {toolbar ? <div className="mb-5">{toolbar}</div> : null}

      {rows.length === 0 ? (
        <div className="flex min-h-40 items-center justify-center rounded-[20px] bg-[#F4F4F4] px-4 py-10 text-sm font-medium text-[#8c8c8c]">
          {empty}
        </div>
      ) : (
        <div className="overflow-x-auto overscroll-x-contain">
          <table className="w-full min-w-[760px] border-separate border-spacing-0">
            <thead>
              <tr>
                {renderExpandedRow ? (
                  <th className="w-10 border-b border-[var(--gym-ink,#063434)]/8 px-4 py-3" />
                ) : null}
                {columns.map((column) => (
                  <th
                    key={column.id}
                    className={cn(
                      "border-b border-[var(--gym-ink,#063434)]/8 px-4 py-3 text-start text-[13px] font-semibold whitespace-nowrap text-[#8c8c8c]",
                      column.headerClassName,
                    )}
                  >
                    {column.header}
                  </th>
                ))}
                {actions ? (
                  <th className="border-b border-[var(--gym-ink,#063434)]/8 px-4 py-3 text-end text-[13px] font-semibold whitespace-nowrap text-[#8c8c8c]">
                    {actionsHeader}
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const key = rowKey(row)
                const isExpanded = expandedRows.has(key)
                const isLast = index === rows.length - 1

                return (
                  <FragmentRow key={key}>
                    <tr
                      className={cn(
                        "group transition-colors",
                        renderExpandedRow && "cursor-pointer",
                      )}
                      onClick={() => renderExpandedRow && toggleRow(key)}
                    >
                      {renderExpandedRow ? (
                        <td
                          className={cn(
                            "border-b border-[var(--gym-ink,#063434)]/6 px-4 py-4 text-[#8c8c8c] group-hover:bg-[#F4F4F4]/80",
                            isLast && !isExpanded && "border-b-0",
                          )}
                        >
                          <ChevronDown
                            className={cn(
                              "size-5 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                              isExpanded && "rotate-180",
                            )}
                          />
                        </td>
                      ) : null}
                      {columns.map((column) => (
                        <td
                          key={column.id}
                          className={cn(
                            "border-b border-[var(--gym-ink,#063434)]/6 px-4 py-4 text-sm font-medium whitespace-nowrap text-[var(--gym-ink,#063434)] group-hover:bg-[#F4F4F4]/80",
                            isLast && !isExpanded && "border-b-0",
                            column.className,
                          )}
                        >
                          {column.cell(row)}
                        </td>
                      ))}
                      {actions ? (
                        <td
                          className={cn(
                            "border-b border-[var(--gym-ink,#063434)]/6 px-4 py-4 group-hover:bg-[#F4F4F4]/80",
                            isLast && !isExpanded && "border-b-0",
                          )}
                        >
                          <div className="flex items-center justify-end">
                            <div
                              className="inline-flex items-center rounded-full bg-[#F4F4F4] p-1"
                              onClick={(event) => event.stopPropagation()}
                            >
                              {actions(row)}
                            </div>
                          </div>
                        </td>
                      ) : null}
                    </tr>
                    {renderExpandedRow ? (
                      <tr>
                        <td
                          colSpan={columns.length + (actions ? 1 : 0) + 1}
                          className={cn(
                            "overflow-hidden p-0",
                            isExpanded && "border-b border-[var(--gym-ink,#063434)]/6",
                            isLast && !isExpanded && "border-b-0",
                          )}
                        >
                          <AnimatePresence initial={false}>
                            {isExpanded ? (
                              <motion.div
                                key={`${key}-expanded`}
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                                className="overflow-hidden bg-[#F8F9FA]"
                              >
                                <div className="mx-4 my-4 rounded-lg border-s-4 border-[var(--gym-ink,#063434)] bg-white p-5 shadow-sm">
                                  {renderExpandedRow(row)}
                                </div>
                              </motion.div>
                            ) : null}
                          </AnimatePresence>
                        </td>
                      </tr>
                    ) : null}
                  </FragmentRow>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function FragmentRow({ children }: { children: ReactNode }) {
  return <>{children}</>
}

export function TableAction({
  label,
  onClick,
  tone = "default",
}: {
  label: string
  onClick?: () => void
  tone?: "default" | "danger" | "primary"
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center whitespace-nowrap rounded-full px-3 text-xs font-bold transition-colors duration-200",
        tone === "danger"
          ? "text-[#FF6A55] hover:bg-[#FFE8E4]"
          : tone === "primary"
            ? "bg-[var(--gym-ink,#063434)] text-white hover:bg-[#0a4540]"
            : "text-[var(--gym-ink,#063434)] hover:bg-white",
      )}
    >
      {label}
    </button>
  )
}
