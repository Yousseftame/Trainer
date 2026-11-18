import { useMemo, useState } from "react"
import {
  Apple,
  CalendarDays,
  ChevronDown,
  Dumbbell,
  Sparkles,
} from "lucide-react"
import {
  adherenceWeekPercent,
  computeAdherenceWeeks,
  isSameUtcWeek,
  trimLeadingEmptyAdherenceWeeks,
  type AdherenceWeek,
} from "@/features/progress/adherence"
import { useLocale } from "@/hooks/useLocale"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import type {
  NutritionAdherenceLog,
  NutritionProgram,
  WorkoutProgram,
  WorkoutSessionLog,
} from "@/types/program"

type SubscriberWeeklyHistoryProps = {
  workoutLogs: WorkoutSessionLog[]
  nutritionLogs: NutritionAdherenceLog[]
  workoutPrograms: WorkoutProgram[]
  nutritionPrograms: NutritionProgram[]
  canWorkout?: boolean
  canNutrition?: boolean
}

function weekNumberLabel(week: AdherenceWeek, all: AdherenceWeek[], isAr: boolean) {
  const indexFromStart = all.findIndex((w) => w.weekStart === week.weekStart)
  const n = indexFromStart + 1
  return isAr ? `الأسبوع ${n}` : `Week ${n}`
}

function ProgressBar({
  done,
  total,
  tone,
}: {
  done: number
  total: number
  tone: "workout" | "nutrition"
}) {
  const pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/[0.06]">
      <div
        className={cn(
          "h-full rounded-full transition-all duration-500",
          tone === "workout" ? "bg-[var(--gym-ink,#111111)]" : "bg-[var(--gym-lime,#fb5001)]",
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export function SubscriberWeeklyHistory({
  workoutLogs,
  nutritionLogs,
  workoutPrograms,
  nutritionPrograms,
  canWorkout = true,
  canNutrition = true,
}: SubscriberWeeklyHistoryProps) {
  const { locale } = useLocale()
  const isAr = locale === "ar"
  const [expanded, setExpanded] = useState<string | null>(null)
  const [visibleCount, setVisibleCount] = useState(12)

  const weeks = useMemo(() => {
    const raw = computeAdherenceWeeks({
      workoutLogs,
      nutritionLogs,
      workoutPrograms,
      nutritionPrograms,
      weeks: 52,
    })
    const trimmed = trimLeadingEmptyAdherenceWeeks(raw)
    // Newest first for browsing
    return [...trimmed].reverse()
  }, [workoutLogs, nutritionLogs, workoutPrograms, nutritionPrograms])

  const chronological = useMemo(() => [...weeks].reverse(), [weeks])

  const visible = weeks.slice(0, visibleCount)
  const nowIso = new Date().toISOString()

  if (!canWorkout && !canNutrition) {
    return (
      <div className="rounded-[24px] border border-black/6 bg-white p-8 text-center">
        <p className="text-[13px] font-medium text-[#8c8c8c]">
          {isAr
            ? "باقتك الحالية لا تتضمن تتبع التمارين أو التغذية."
            : "Your package does not include workout or nutrition tracking."}
        </p>
      </div>
    )
  }

  if (!weeks.length) {
    return (
      <div className="rounded-[24px] border border-black/6 bg-white p-10 text-center">
        <CalendarDays className="mx-auto mb-3 size-10 stroke-1 text-[#c4c4c4]" />
        <p className="font-heading text-[16px] font-extrabold text-[var(--gym-ink,#111111)]">
          {isAr ? "لا يوجد سجل أسبوعي بعد" : "No weekly history yet"}
        </p>
        <p className="mt-1 text-[13px] font-medium text-[#8c8c8c]">
          {isAr
            ? "سجّل حصصك ووجباتك خلال الأسبوع، وستظهر ملخصات كل أسبوع هنا تلقائياً."
            : "Log workouts and meals through the week — each week’s summary will appear here automatically."}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[24px] border border-black/6 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[var(--gym-lime,#fb5001)]/10 px-2.5 py-1 text-[11px] font-bold text-[var(--gym-lime,#fb5001)]">
              <Sparkles className="size-3.5" />
              {isAr ? "أرشيف الأسابيع" : "Weekly archive"}
            </div>
            <h2
              className={cn(
                "mt-2 text-[18px] font-extrabold tracking-tight text-[var(--gym-ink,#111111)]",
                isAr ? "font-arabic" : "font-heading",
              )}
            >
              {isAr
                ? "ملخص كل أسبوع — من البداية حتى الآن"
                : "Every week summarized — from week one until now"}
            </h2>
            <p className="mt-1 max-w-xl text-[13px] font-medium text-[#8c8c8c]">
              {isAr
                ? "عند انتهاء الأسبوع يُحفظ ملخص التزامك بالتمارين والتغذية هنا. يمكنك الرجوع لأي أسبوع خلال السنة الماضية."
                : "When a week ends, your workout and nutrition adherence stays here. Browse any week from the past year."}
            </p>
          </div>
          <div className="rounded-2xl bg-[#F4F4F4] px-3.5 py-2 text-center">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#8c8c8c]">
              {isAr ? "أسابيع مسجّلة" : "Weeks tracked"}
            </p>
            <p className="font-heading text-[22px] font-black text-[var(--gym-ink,#111111)]">
              {weeks.length}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2.5">
        {visible.map((week) => {
          const isCurrent = isSameUtcWeek(week.weekStart, nowIso)
          const isOpen = expanded === week.weekStart
          const pct = adherenceWeekPercent(week)
          const label = weekNumberLabel(week, chronological, isAr)
          const range = `${formatDate(week.weekStart, locale)} – ${formatDate(week.weekEnd, locale)}`

          const weekWorkoutLogs = canWorkout
            ? workoutLogs.filter((l) =>
                isSameUtcWeek(l.date || l.completedAt, week.weekStart),
              )
            : []
          const weekNutritionLogs = canNutrition
            ? nutritionLogs.filter((l) =>
                isSameUtcWeek(l.date || l.loggedAt, week.weekStart),
              )
            : []

          return (
            <div
              key={week.weekStart}
              className={cn(
                "overflow-hidden rounded-[22px] border bg-white transition-shadow",
                isCurrent
                  ? "border-[var(--gym-lime,#fb5001)]/35 shadow-[0_8px_28px_rgba(251,80,1,0.08)]"
                  : "border-black/6 shadow-xs",
              )}
            >
              <button
                type="button"
                onClick={() =>
                  setExpanded((prev) =>
                    prev === week.weekStart ? null : week.weekStart,
                  )
                }
                className="flex w-full items-center gap-3 p-4 text-start sm:p-5"
              >
                <div
                  className={cn(
                    "flex size-11 shrink-0 flex-col items-center justify-center rounded-2xl",
                    isCurrent
                      ? "bg-[var(--gym-lime,#fb5001)] text-white"
                      : "bg-[#F4F4F4] text-[var(--gym-ink,#111111)]",
                  )}
                >
                  <CalendarDays className="size-4" strokeWidth={2} />
                </div>

                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p
                      className={cn(
                        "text-[14px] font-extrabold text-[var(--gym-ink,#111111)]",
                        isAr ? "font-arabic" : "font-heading",
                      )}
                    >
                      {label}
                    </p>
                    {isCurrent ? (
                      <span className="rounded-full bg-[var(--gym-lime,#fb5001)]/12 px-2 py-0.5 text-[10px] font-bold text-[var(--gym-lime,#fb5001)]">
                        {isAr ? "هذا الأسبوع" : "This week"}
                      </span>
                    ) : null}
                    <span className="text-[12px] font-medium text-[#8c8c8c]">
                      {range}
                    </span>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    {canWorkout ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2 text-[11px] font-bold">
                          <span className="inline-flex items-center gap-1 text-[#6B7280]">
                            <Dumbbell className="size-3" />
                            {isAr ? "تمارين" : "Workouts"}
                          </span>
                          <span className="text-[var(--gym-ink,#111111)]">
                            {week.workoutDone}/{week.workoutTotal || "—"}
                          </span>
                        </div>
                        <ProgressBar
                          done={week.workoutDone}
                          total={week.workoutTotal}
                          tone="workout"
                        />
                      </div>
                    ) : null}
                    {canNutrition ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2 text-[11px] font-bold">
                          <span className="inline-flex items-center gap-1 text-[#6B7280]">
                            <Apple className="size-3" />
                            {isAr ? "تغذية" : "Nutrition"}
                          </span>
                          <span className="text-[var(--gym-ink,#111111)]">
                            {week.nutritionDone}/{week.nutritionTotal || "—"}
                          </span>
                        </div>
                        <ProgressBar
                          done={week.nutritionDone}
                          total={week.nutritionTotal}
                          tone="nutrition"
                        />
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[12px] font-extrabold",
                      pct == null
                        ? "bg-[#F4F4F4] text-[#8c8c8c]"
                        : pct >= 80
                          ? "bg-emerald-50 text-emerald-700"
                          : pct >= 50
                            ? "bg-amber-50 text-amber-800"
                            : "bg-rose-50 text-rose-700",
                    )}
                  >
                    {pct == null ? "—" : `${pct}%`}
                  </span>
                  <ChevronDown
                    className={cn(
                      "size-4 text-[#8c8c8c] transition-transform duration-300",
                      isOpen && "rotate-180",
                    )}
                  />
                </div>
              </button>

              <div
                className={cn(
                  "grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                  isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                )}
              >
                <div className="overflow-hidden">
                  <div className="border-t border-black/6 bg-[#FAFAFA] px-4 py-4 sm:px-5">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {canWorkout ? (
                        <div className="rounded-2xl border border-black/5 bg-white p-3.5">
                          <p className="text-[11px] font-bold uppercase tracking-wide text-[#8c8c8c]">
                            {isAr ? "حصص التمرين هذا الأسبوع" : "Workout sessions"}
                          </p>
                          {weekWorkoutLogs.length === 0 ? (
                            <p className="mt-2 text-[12px] font-medium text-[#8c8c8c]">
                              {isAr ? "لا حصص مسجّلة" : "No sessions logged"}
                            </p>
                          ) : (
                            <ul className="mt-2 space-y-1.5">
                              {weekWorkoutLogs
                                .slice()
                                .sort((a, b) =>
                                  String(b.date).localeCompare(String(a.date)),
                                )
                                .map((log) => (
                                  <li
                                    key={log.id}
                                    className="flex items-center justify-between gap-2 text-[12px] font-medium text-[var(--gym-ink,#111111)]"
                                  >
                                    <span>{formatDate(log.date, locale)}</span>
                                    <span className="text-[#8c8c8c]">
                                      {typeof log.weekday === "number"
                                        ? isAr
                                          ? `يوم ${log.weekday + 1}`
                                          : `Day ${log.weekday + 1}`
                                        : "—"}
                                    </span>
                                  </li>
                                ))}
                            </ul>
                          )}
                        </div>
                      ) : null}

                      {canNutrition ? (
                        <div className="rounded-2xl border border-black/5 bg-white p-3.5">
                          <p className="text-[11px] font-bold uppercase tracking-wide text-[#8c8c8c]">
                            {isAr ? "أيام التغذية هذا الأسبوع" : "Nutrition check-ins"}
                          </p>
                          {weekNutritionLogs.length === 0 ? (
                            <p className="mt-2 text-[12px] font-medium text-[#8c8c8c]">
                              {isAr ? "لا تسجيلات" : "No check-ins logged"}
                            </p>
                          ) : (
                            <ul className="mt-2 space-y-1.5">
                              {weekNutritionLogs
                                .slice()
                                .sort((a, b) =>
                                  String(b.date).localeCompare(String(a.date)),
                                )
                                .map((log) => (
                                  <li
                                    key={log.id}
                                    className="flex items-center justify-between gap-2 text-[12px] font-medium text-[var(--gym-ink,#111111)]"
                                  >
                                    <span>{formatDate(log.date, locale)}</span>
                                    <span className="rounded-full bg-[#F4F4F4] px-2 py-0.5 text-[10px] font-bold text-[#6B7280]">
                                      {log.status === "adhered"
                                        ? isAr
                                          ? "ملتزم"
                                          : "Adhered"
                                        : log.status === "mostly"
                                          ? isAr
                                            ? "غالباً"
                                            : "Mostly"
                                          : log.status === "deviated"
                                            ? isAr
                                              ? "انحراف"
                                              : "Deviated"
                                            : isAr
                                              ? "تخطّي"
                                              : "Skipped"}
                                    </span>
                                  </li>
                                ))}
                            </ul>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {visibleCount < weeks.length ? (
        <div className="flex justify-center pt-1">
          <button
            type="button"
            onClick={() => setVisibleCount((n) => Math.min(weeks.length, n + 12))}
            className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--gym-ink,#111111)] px-5 text-[13px] font-bold text-white transition hover:opacity-95"
          >
            {isAr
              ? `عرض أسابيع أقدم (${weeks.length - visibleCount})`
              : `Show older weeks (${weeks.length - visibleCount})`}
          </button>
        </div>
      ) : null}
    </div>
  )
}
