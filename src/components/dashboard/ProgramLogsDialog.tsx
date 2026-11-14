import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import {
  Camera,
  CheckCircle2,
  ChevronDown,
  Clock,
  Dumbbell,
  Flame,
  Utensils,
  X,
} from "lucide-react"
import { StatusBadge } from "@/components/dashboard/StatusBadge"
import { useLocale } from "@/hooks/useLocale"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { NutritionAdherenceLog, WorkoutSessionLog } from "@/types/program"

type ProgramLogsDialogProps = {
  open: boolean
  title: string
  subscriberName?: string
  workoutLogs?: WorkoutSessionLog[]
  nutritionLogs?: NutritionAdherenceLog[]
  type: "workout" | "nutrition"
  /** Auto-expand and highlight this session log (from Reports deep-link). */
  highlightLogId?: string
  onClose: () => void
}

export function ProgramLogsDialog({
  open,
  title,
  subscriberName,
  workoutLogs = [],
  nutritionLogs = [],
  type,
  highlightLogId,
  onClose,
}: ProgramLogsDialogProps) {
  const { locale } = useLocale()
  const isAr = locale === "ar"
  const [expandedLogId, setExpandedLogId] = useState<string | null>(
    highlightLogId ?? null,
  )

  useEffect(() => {
    if (open && highlightLogId) {
      setExpandedLogId(highlightLogId)
    }
  }, [open, highlightLogId])

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

      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-[28px] bg-white shadow-2xl overflow-hidden text-[var(--gym-ink,#111111)]">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[#F0F0F0] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-[var(--gym-ink,#111111)] text-white">
              {type === "workout" ? (
                <Dumbbell className="size-5 text-[var(--gym-orange,#fb5001)]" />
              ) : (
                <Utensils className="size-5 text-[var(--gym-orange,#fb5001)]" />
              )}
            </div>
            <div>
              <h2 className="font-heading text-[18px] font-extrabold text-[var(--gym-ink,#111111)]">
                {title}
              </h2>
              {subscriberName ? (
                <p className="text-[12px] font-medium text-[#8c8c8c]">
                  {isAr ? "سجل أداء وإنجاز المشترك:" : "Subscriber log & performance:"} {subscriberName}
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
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {type === "workout" ? (
            workoutLogs.length === 0 ? (
              <div className="flex min-h-36 flex-col items-center justify-center rounded-2xl bg-[#F8F9FA] p-6 text-center text-[#8c8c8c]">
                <Clock className="size-8 mb-2 stroke-1 text-[#8c8c8c]" />
                <p className="text-[13px] font-medium">
                  {isAr
                    ? "لا توجد جلسات مسجلة بعد لهذا البرنامج. الجلسات تُحفظ مع معرّف البرنامج وتبقى بعد إعادة التعيين."
                    : "No sessions logged for this program yet. Logs keep the program id and stay after reassignment."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {workoutLogs.map((log) => {
                  const isExpanded = expandedLogId === log.id
                  const exercises = log.exercisesCompleted ?? []

                  return (
                    <div
                      key={log.id}
                      id={`workout-log-${log.id}`}
                      className={cn(
                        "rounded-2xl border bg-[#FBFBFB] p-4 transition hover:bg-white space-y-2.5",
                        highlightLogId === log.id
                          ? "border-[var(--gym-orange,#fb5001)] ring-2 ring-[var(--gym-orange,#fb5001)]/25 shadow-md"
                          : "border-[#ECECEC]",
                      )}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="size-4 text-[var(--gym-orange,#fb5001)] shrink-0" />
                          <div>
                            <span className="font-heading text-[14px] font-bold text-[var(--gym-ink,#111111)]">
                              {log.workoutTitle || (isAr ? "جلسة تدريبية" : "Workout Session")}
                            </span>
                            <span className="text-[11px] text-[#8c8c8c] ms-2">
                              {formatDate(log.date, locale)}
                            </span>
                          </div>
                        </div>

                        {/* Metric Tags */}
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
                          {log.durationMinutes ? (
                            <span className="rounded-full bg-[#EAEAEA] px-2.5 py-0.5 text-[var(--gym-ink,#111111)]">
                              {log.durationMinutes} {isAr ? "دقيقة" : "min"}
                            </span>
                          ) : null}

                          {log.totalVolumeKg ? (
                            <span className="rounded-full bg-[var(--gym-orange,#fb5001)]/10 text-[var(--gym-orange,#fb5001)] px-2.5 py-0.5">
                              {log.totalVolumeKg.toLocaleString()} {isAr ? "كجم" : "kg"}
                            </span>
                          ) : null}

                          {log.perceivedEffort ? (
                            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-amber-900">
                              RPE {log.perceivedEffort}/10
                            </span>
                          ) : null}

                          {log.energyLevel ? (
                            <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-sky-900">
                              {log.energyLevel === "great"
                                ? isAr
                                  ? "طاقة عالية"
                                  : "Felt amazing"
                                : log.energyLevel === "good"
                                  ? isAr
                                    ? "جيد"
                                    : "Solid"
                                  : log.energyLevel === "tired"
                                    ? isAr
                                      ? "متعب"
                                      : "Tired"
                                    : isAr
                                      ? "مرهق"
                                      : "Exhausted"}
                            </span>
                          ) : null}

                          {exercises.some((ex) => ex.wasSubstituted) ? (
                            <span className="rounded-full bg-[var(--gym-orange,#fb5001)]/10 px-2.5 py-0.5 text-[var(--gym-orange,#fb5001)]">
                              {isAr ? "فيه استبدال" : "Had substitutes"}
                            </span>
                          ) : null}

                          {exercises.length > 0 ? (
                            <button
                              type="button"
                              onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                              className="inline-flex items-center gap-1 rounded-full bg-black/5 px-2.5 py-0.5 text-[#555] hover:bg-black/10 transition"
                            >
                              <span>{exercises.length} {isAr ? "تمارين" : "exercises"}</span>
                              <ChevronDown className={cn("size-3 transition-transform", isExpanded && "rotate-180")} />
                            </button>
                          ) : null}
                        </div>
                      </div>

                      {log.notes ? (
                        <p className="text-[12px] leading-relaxed text-[#6B7280] bg-white p-2.5 rounded-xl border border-black/[0.04]">
                          {log.notes}
                        </p>
                      ) : null}

                      {/* Detailed Exercises Performed */}
                      {isExpanded && exercises.length > 0 ? (
                        <div className="pt-2 border-t border-black/[0.06] space-y-1.5 animate-in fade-in">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-[#8c8c8c]">
                            {isAr ? "التمارين المنفذة والأوزان المسجلة:" : "Completed Exercises & Weights:"}
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {exercises.map((ex, i) => (
                              <div
                                key={ex.exerciseId || i}
                                className="flex flex-col gap-0.5 rounded-lg bg-white p-2 border border-black/[0.05] text-[11.5px]"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-bold text-[var(--gym-ink,#111111)] truncate">
                                    {ex.name}
                                  </span>
                                  <span className="font-mono font-bold text-[#6B7280] shrink-0">
                                    {ex.completedSets} {isAr ? "مج" : "sets"}{" "}
                                    {ex.weightKg ? `• ${ex.weightKg} كجم` : ""}
                                  </span>
                                </div>
                                {ex.wasSubstituted && ex.substituteName ? (
                                  <span className="text-[10px] font-semibold text-[var(--gym-orange,#fb5001)]">
                                    {isAr
                                      ? `بديل عن: ${ex.substituteName}`
                                      : `Sub for: ${ex.substituteName}`}
                                  </span>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            )
          ) : nutritionLogs.length === 0 ? (
            <div className="flex min-h-36 flex-col items-center justify-center rounded-2xl bg-[#F8F9FA] p-6 text-center text-[#8c8c8c]">
              <Flame className="size-8 mb-2 stroke-1 text-[#8c8c8c]" />
              <p className="text-[13px] font-medium">
                {isAr
                  ? "لا توجد سجلات التزام لهذه الخطة بعد. السجلات تُحفظ مع معرّف الخطة وتبقى بعد إعادة التعيين."
                  : "No adherence entries for this plan yet. Logs keep the plan id and stay after reassignment."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {nutritionLogs.map((log) => {
                const statusTone =
                  log.status === "adhered"
                    ? "success"
                    : log.status === "mostly"
                      ? "info"
                      : log.status === "deviated"
                        ? "warning"
                        : "danger"

                const statusLabel =
                  log.status === "adhered"
                    ? isAr
                      ? "التزام كامل"
                      : "Full adherence"
                    : log.status === "mostly"
                      ? isAr
                        ? "التزام جزئي"
                        : "Mostly followed"
                      : log.status === "deviated"
                        ? isAr
                          ? "تجاوز في الوجبات"
                          : "Deviated"
                        : isAr
                          ? "لم يلتزم"
                          : "Skipped"

                return (
                  <div
                    key={log.id}
                    id={`nutrition-log-${log.id}`}
                    className={cn(
                      "rounded-2xl border bg-[#FBFBFB] p-4 transition hover:bg-white space-y-2",
                      highlightLogId === log.id
                        ? "border-[var(--gym-orange,#fb5001)] ring-2 ring-[var(--gym-orange,#fb5001)]/25 shadow-md"
                        : "border-[#ECECEC]",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-heading text-[14px] font-bold text-[var(--gym-ink,#111111)]">
                        {formatDate(log.date, locale)}
                      </span>
                      <div className="flex items-center gap-2">
                        {log.caloriesActual ? (
                          <span className="rounded-full bg-[#EAEAEA] px-2 py-0.5 text-[11px] font-bold text-[var(--gym-ink,#111111)]">
                            {log.caloriesActual} kcal
                          </span>
                        ) : null}
                        {log.waterLitersActual ? (
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-900">
                            {log.waterLitersActual} L
                          </span>
                        ) : null}
                        <StatusBadge label={statusLabel} tone={statusTone} />
                      </div>
                    </div>

                    {log.notes ? (
                      <p className="text-[12px] leading-relaxed text-[#6B7280]">
                        {log.notes}
                      </p>
                    ) : null}

                    {log.mealChecks && log.mealChecks.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {log.mealChecks.map((check) => (
                          <span
                            key={check.slotId}
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold border",
                              check.completed
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : "bg-neutral-100 text-[#6B7280] border-black/10",
                            )}
                          >
                            {check.completed ? (
                              <CheckCircle2 className="size-3" />
                            ) : null}
                            {check.slotTitle}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    {log.mealPhotos && log.mealPhotos.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                        {log.mealPhotos.map((photo) => (
                          <a
                            key={`${photo.slotId}-${photo.uploadedAt}`}
                            href={photo.photoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group overflow-hidden rounded-xl border border-black/10 bg-white"
                          >
                            <div className="relative aspect-[4/3] bg-neutral-100">
                              <img
                                src={photo.photoUrl}
                                alt={photo.slotTitle}
                                className="size-full object-cover"
                              />
                              <span className="absolute start-1.5 bottom-1.5 inline-flex items-center gap-1 rounded-full bg-black/65 px-2 py-0.5 text-[10px] font-bold text-white">
                                <Camera className="size-3" />
                                {photo.slotTitle}
                              </span>
                            </div>
                            {photo.note ? (
                              <p className="px-2 py-1.5 text-[10px] text-[#6B7280] line-clamp-2">
                                {photo.note}
                              </p>
                            ) : null}
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
