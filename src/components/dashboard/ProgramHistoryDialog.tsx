import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { History, X } from "lucide-react"
import { StatusBadge } from "@/components/dashboard/StatusBadge"
import { collectProgramVersionChain } from "@/features/programs/version-chain"
import { useLocale } from "@/hooks/useLocale"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { NutritionProgram, WorkoutProgram } from "@/types/program"

type ProgramHistoryDialogProps = {
  open: boolean
  title: string
  subscriberName?: string
  programs: Array<WorkoutProgram | NutritionProgram>
  /** Prefer showing the clicked version first (and its lineage). */
  initialProgramId?: string
  type?: "workout" | "nutrition"
  onClose: () => void
}

export function ProgramHistoryDialog({
  open,
  title,
  subscriberName,
  programs,
  initialProgramId,
  onClose,
}: ProgramHistoryDialogProps) {
  const { locale } = useLocale()
  const isAr = locale === "ar"

  const sorted = useMemo(() => {
    const source =
      initialProgramId && programs.some((p) => p.id === initialProgramId)
        ? collectProgramVersionChain(initialProgramId, programs)
        : [...programs]
    return source.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
  }, [programs, initialProgramId])

  const [selectedId, setSelectedId] = useState("")

  useEffect(() => {
    if (!open) return
    const preferred =
      (initialProgramId && sorted.some((p) => p.id === initialProgramId)
        ? initialProgramId
        : sorted[0]?.id) || ""
    setSelectedId(preferred)
  }, [open, initialProgramId, sorted])

  const selected = sorted.find((p) => p.id === selectedId) || sorted[0]

  if (!open) return null

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5"
    >
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />

      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-[#F0F0F0] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-[var(--gym-ink,#111111)] text-white">
              <History className="size-5" />
            </div>
            <div>
              <h2 className="font-heading text-[18px] font-extrabold text-[var(--gym-ink,#111111)]">
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

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden sm:flex-row">
          <div className="w-full space-y-2 overflow-y-auto border-b border-[#ECECEC] p-3 sm:w-64 sm:border-b-0 sm:border-e">
            <p className="mb-2 px-2 text-[11px] font-bold uppercase tracking-wider text-[#8c8c8c]">
              {isAr ? "سجل الإصدارات" : "Version History"}
            </p>
            {sorted.length === 0 ? (
              <p className="px-2 text-[12px] text-[#8c8c8c]">
                {isAr ? "لا توجد إصدارات." : "No versions available."}
              </p>
            ) : (
              sorted.map((item) => {
                const active = item.id === selected?.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className={cn(
                      "w-full rounded-2xl p-3 text-start transition-all",
                      active
                        ? "bg-[var(--gym-ink,#111111)] text-white shadow-sm"
                        : "bg-[#F8F9FA] text-[var(--gym-ink,#111111)] hover:bg-[#EBEBEB]",
                    )}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="truncate font-heading text-[13px] font-extrabold">
                        {item.title[locale]}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-extrabold",
                          active
                            ? "bg-white/20 text-white"
                            : item.status === "active"
                              ? "bg-black/10 text-[var(--gym-ink,#111111)]"
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
              })
            )}
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {selected ? (
              <>
                <div className="flex items-center justify-between border-b border-[#F0F0F0] pb-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-heading text-[16px] font-extrabold text-[var(--gym-ink,#111111)]">
                        {selected.title[locale]}
                      </h3>
                      <StatusBadge
                        label={`v${selected.version}`}
                        tone={selected.status === "active" ? "success" : "muted"}
                      />
                      <StatusBadge
                        label={
                          selected.status === "active"
                            ? isAr
                              ? "نشط"
                              : "active"
                            : isAr
                              ? "مؤرشف"
                              : "archived"
                        }
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

                <div className="space-y-3">
                  <p className="text-[12px] font-bold text-[var(--gym-ink,#111111)]">
                    {isAr
                      ? "تفاصيل محتوى هذا الإصدار:"
                      : "Content breakdown for this version:"}
                  </p>
                  <div className="space-y-2">
                    {selected.days.map((day) => (
                      <div
                        key={day.id}
                        className="rounded-xl border border-[#ECECEC] bg-[#F9F9F9] p-3 text-[12px]"
                      >
                        <div className="flex items-center justify-between font-bold text-[var(--gym-ink,#111111)]">
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
                            <span>
                              {day.exercises.length}{" "}
                              {isAr ? "تمارين" : "exercises"}
                            </span>
                          ) : "meals" in day ? (
                            <span>
                              {day.meals.length} {isAr ? "وجبات" : "meals"}
                            </span>
                          ) : null}
                        </div>

                        {"exercises" in day && day.exercises.length > 0 ? (
                          <div className="mt-2.5 space-y-1.5 border-t border-black/5 pt-2">
                            {day.exercises.map((ex, exIdx) => {
                              const exName =
                                typeof ex.name === "object"
                                  ? ex.name[locale] || ex.name.en
                                  : ex.name
                              return (
                                <div
                                  key={ex.id || exIdx}
                                  className="flex items-center justify-between text-[11.5px] text-[#444]"
                                >
                                  <span className="truncate font-medium">
                                    {exIdx + 1}. {exName}
                                  </span>
                                  <span className="ms-2 shrink-0 font-semibold text-[#8c8c8c]">
                                    {ex.sets} × {ex.reps}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        ) : null}

                        {"meals" in day && day.meals.length > 0 ? (
                          <div className="mt-2.5 space-y-1.5 border-t border-black/5 pt-2">
                            {day.meals.map((meal, mIdx) => {
                              const mName = meal.label
                                ? typeof meal.label === "object"
                                  ? meal.label[locale] || meal.label.en
                                  : meal.label
                                : meal.slot
                              return (
                                <div
                                  key={meal.id || mIdx}
                                  className="flex items-center justify-between text-[11.5px] text-[#444]"
                                >
                                  <span className="truncate font-medium">
                                    {mIdx + 1}. {mName}
                                  </span>
                                  <span className="ms-2 shrink-0 font-semibold text-[#8c8c8c]">
                                    {meal.items?.length || 0}{" "}
                                    {isAr ? "أصناف" : "items"}
                                    {meal.calories
                                      ? ` · ${meal.calories} ${isAr ? "سعرة" : "kcal"}`
                                      : ""}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end border-t border-[#F0F0F0] bg-[#FBFBFB] px-6 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-[var(--gym-ink,#111111)] px-5 py-2 text-[12px] font-bold text-white hover:opacity-95"
          >
            {isAr ? "إغلاق" : "Close"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
