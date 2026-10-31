import { useState } from "react"
import { createPortal } from "react-dom"
import { History, X } from "lucide-react"
import { StatusBadge } from "@/components/dashboard/StatusBadge"
import { useLocale } from "@/hooks/useLocale"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { NutritionProgram, WorkoutProgram } from "@/types/program"

type ProgramHistoryDialogProps = {
  open: boolean
  title: string
  subscriberName?: string
  programs: Array<WorkoutProgram | NutritionProgram>
  type?: "workout" | "nutrition"
  onClose: () => void
}

export function ProgramHistoryDialog({
  open,
  title,
  subscriberName,
  programs,
  onClose,
}: ProgramHistoryDialogProps) {
  const { locale } = useLocale()
  const isAr = locale === "ar"

  const sorted = [...programs].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )

  const [selectedId, setSelectedId] = useState(sorted[0]?.id || "")
  const selected = sorted.find((p) => p.id === selectedId) || sorted[0]

  if (!open) return null

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5"
    >
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-[28px] bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[#F0F0F0] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-[var(--gym-ink,#063434)] text-white">
              <History className="size-5" />
            </div>
            <div>
              <h2 className="font-heading text-[18px] font-extrabold text-[var(--gym-ink,#063434)]">
                {title}
              </h2>
              {subscriberName ? (
                <p className="text-[12px] font-medium text-[#8c8c8c]">
                  {isAr ? "المشترك:" : "Subscriber:"} {subscriberName}
                </p>
              ) : null}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full bg-[#F4F4F4] text-[#8c8c8c] hover:bg-black/5 hover:text-black"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden sm:flex-row">
          {/* Version List Sidebar */}
          <div className="w-full border-b border-[#ECECEC] p-3 sm:w-64 sm:border-b-0 sm:border-e overflow-y-auto space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#8c8c8c] px-2 mb-2">
              {isAr ? "سجل الإصدارات" : "Version History"}
            </p>
            {sorted.map((item) => {
              const active = item.id === selected?.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={cn(
                    "w-full rounded-2xl p-3 text-start transition-all",
                    active
                      ? "bg-[var(--gym-ink,#063434)] text-white shadow-sm"
                      : "bg-[#F8F9FA] text-[var(--gym-ink,#063434)] hover:bg-[#EBEBEB]",
                  )}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-heading text-[13px] font-extrabold truncate">
                      {item.title[locale]}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-extrabold",
                        active
                          ? "bg-white/20 text-white"
                          : item.status === "active"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-gray-200 text-gray-700",
                      )}
                    >
                      v{item.version}
                    </span>
                  </div>
                  <p
                    className={cn(
                      "mt-1 text-[11px] font-medium",
                      active ? "text-white/70" : "text-[#8c8c8c]",
                    )}
                  >
                    {formatDate(item.updatedAt, locale)}
                  </p>
                </button>
              )
            })}
          </div>

          {/* Details Pane */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {selected ? (
              <>
                <div className="flex items-center justify-between border-b border-[#F0F0F0] pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-heading text-[16px] font-extrabold text-[var(--gym-ink,#063434)]">
                        {selected.title[locale]}
                      </h3>
                      <StatusBadge
                        label={`v${selected.version}`}
                        tone={selected.status === "active" ? "success" : "muted"}
                      />
                      <StatusBadge
                        label={selected.status}
                        tone={selected.status === "active" ? "success" : "muted"}
                      />
                    </div>
                    <p className="mt-1 text-[12px] text-[#8c8c8c]">
                      {isAr ? "آخر تحديث: " : "Last updated: "}
                      {formatDate(selected.updatedAt, locale)}
                      {selected.archivedAt
                        ? ` · ${isAr ? "تاريخ الأرشفة: " : "Archived: "}${formatDate(selected.archivedAt, locale)}`
                        : ""}
                    </p>
                  </div>
                </div>

                {/* Day breakdown */}
                <div className="space-y-3">
                  <p className="text-[12px] font-bold text-[var(--gym-ink,#063434)]">
                    {isAr ? "تفاصيل محتوى هذا الإصدار:" : "Content breakdown for this version:"}
                  </p>
                  <div className="space-y-2">
                    {selected.days.map((day) => (
                      <div
                        key={day.id}
                        className="rounded-xl border border-[#ECECEC] bg-[#F9F9F9] p-3 text-[12px]"
                      >
                        <div className="flex items-center justify-between font-bold text-[var(--gym-ink,#063434)]">
                          <span>
                            {isAr
                              ? `اليوم ${day.weekday + 1}`
                              : `Day ${day.weekday + 1}`}
                          </span>
                          {"isRest" in day && day.isRest ? (
                            <span className="text-amber-600">
                              {isAr ? "يوم استشفاء وراحة" : "Rest Day"}
                            </span>
                          ) : "exercises" in day ? (
                            <span>{day.exercises.length} {isAr ? "تمارين" : "exercises"}</span>
                          ) : "meals" in day ? (
                            <span>{day.meals.length} {isAr ? "فترات وجبات" : "meal slots"}</span>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-end border-t border-[#F0F0F0] px-6 py-3 bg-[#FBFBFB]">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-[var(--gym-ink,#063434)] px-5 py-2 text-[12px] font-bold text-white hover:opacity-95"
          >
            {isAr ? "إغلاق" : "Close"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
