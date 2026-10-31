import { createPortal } from "react-dom"
import {
  CheckCircle2,
  Clock,
  Dumbbell,
  Flame,
  Utensils,
  X,
} from "lucide-react"
import { StatusBadge } from "@/components/dashboard/StatusBadge"
import { useLocale } from "@/hooks/useLocale"
import { formatDate } from "@/lib/format"
import type { NutritionAdherenceLog, WorkoutSessionLog } from "@/types/program"

type ProgramLogsDialogProps = {
  open: boolean
  title: string
  subscriberName?: string
  workoutLogs?: WorkoutSessionLog[]
  nutritionLogs?: NutritionAdherenceLog[]
  type: "workout" | "nutrition"
  onClose: () => void
}

export function ProgramLogsDialog({
  open,
  title,
  subscriberName,
  workoutLogs = [],
  nutritionLogs = [],
  type,
  onClose,
}: ProgramLogsDialogProps) {
  const { locale } = useLocale()
  const isAr = locale === "ar"

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

      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-[28px] bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[#F0F0F0] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-[var(--gym-ink,#063434)] text-white">
              {type === "workout" ? (
                <Dumbbell className="size-5" />
              ) : (
                <Utensils className="size-5" />
              )}
            </div>
            <div>
              <h2 className="font-heading text-[18px] font-extrabold text-[var(--gym-ink,#063434)]">
                {title}
              </h2>
              {subscriberName ? (
                <p className="text-[12px] font-medium text-[#8c8c8c]">
                  {isAr ? "سجل التزام وأداء المشترك:" : "Subscriber log & performance:"} {subscriberName}
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
                    ? "لا توجد جلسات تدريب مسجلة بعد لهذا المشترك."
                    : "No workout sessions logged yet for this subscriber."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {workoutLogs.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-2xl border border-[#ECECEC] bg-[#FBFBFB] p-4 transition hover:bg-white space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="size-4 text-emerald-600" />
                        <span className="font-heading text-[14px] font-bold text-[var(--gym-ink,#063434)]">
                          {formatDate(log.date, locale)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-bold">
                        {log.durationMinutes ? (
                          <span className="rounded-full bg-[#EAEAEA] px-2.5 py-0.5 text-[var(--gym-ink,#063434)]">
                            {log.durationMinutes} {isAr ? "دقيقة" : "min"}
                          </span>
                        ) : null}
                        {log.perceivedEffort ? (
                          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-amber-900">
                            RPE {log.perceivedEffort}/10
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {log.notes ? (
                      <p className="text-[12px] leading-relaxed text-[#6B7280]">
                        {log.notes}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            )
          ) : nutritionLogs.length === 0 ? (
            <div className="flex min-h-36 flex-col items-center justify-center rounded-2xl bg-[#F8F9FA] p-6 text-center text-[#8c8c8c]">
              <Flame className="size-8 mb-2 stroke-1 text-[#8c8c8c]" />
              <p className="text-[13px] font-medium">
                {isAr
                  ? "لا توجد سجلات التزام غذائي مسجلة بعد."
                  : "No nutrition adherence entries logged yet."}
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
                    className="rounded-2xl border border-[#ECECEC] bg-[#FBFBFB] p-4 transition hover:bg-white space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-heading text-[14px] font-bold text-[var(--gym-ink,#063434)]">
                        {formatDate(log.date, locale)}
                      </span>
                      <div className="flex items-center gap-2">
                        {log.caloriesActual ? (
                          <span className="rounded-full bg-[#EAEAEA] px-2 py-0.5 text-[11px] font-bold text-[var(--gym-ink,#063434)]">
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
                  </div>
                )
              })}
            </div>
          )}
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
