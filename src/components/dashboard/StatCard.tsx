import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string
  value: string | number
  hint?: string
  icon?: ReactNode
}) {
  return (
    <div className="rounded-[20px] bg-white p-3.5 shadow-[0_8px_24px_rgba(6,52,52,0.04)] sm:rounded-[24px] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[12px] font-semibold text-[#8c8c8c] sm:text-[13px]">{label}</p>
        {icon ? (
          <span className="inline-flex size-8 items-center justify-center rounded-2xl bg-[#F4F4F4] text-[var(--gym-ink,#063434)] sm:size-9">
            {icon}
          </span>
        ) : null}
      </div>
      <p className="mt-2 font-heading text-[24px] font-extrabold leading-none tracking-tight text-[var(--gym-ink,#063434)] sm:mt-3 sm:text-[28px] lg:text-[32px]">
        {value}
      </p>
      {hint ? <p className="mt-2 text-[12px] font-medium text-[#8c8c8c]">{hint}</p> : null}
    </div>
  )
}

export function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center rounded-full px-3 text-[12px] font-bold whitespace-nowrap transition-colors sm:h-9 sm:px-3.5 sm:text-[13px]",
        active
          ? "bg-[var(--gym-ink,#063434)] text-white"
          : "bg-[#F4F4F4] text-[#6B7280] hover:text-[var(--gym-ink,#063434)]",
      )}
    >
      {children}
    </button>
  )
}
