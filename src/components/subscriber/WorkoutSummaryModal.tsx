import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Dumbbell,
  Flame,
  X,
} from "lucide-react"
import { useLocale } from "@/hooks/useLocale"
import type { CompletedExerciseRecord } from "@/types/program"
import { APP_ROUTES } from "@/config/constants"

interface WorkoutSummaryModalProps {
  isOpen: boolean
  onClose: () => void
  workoutTitle?: string
  durationMinutes: number
  activeMinutes: number
  restMinutes: number
  totalVolumeKg: number
  exercisesCompleted: CompletedExerciseRecord[]
  perceivedEffort?: number
  energyLevel?: string
  notes?: string
}

export function WorkoutSummaryModal({
  isOpen,
  onClose,
  workoutTitle,
  durationMinutes,
  activeMinutes,
  restMinutes,
  totalVolumeKg,
  exercisesCompleted,
  perceivedEffort,
  energyLevel: _energyLevel,
  notes,
}: WorkoutSummaryModalProps) {
  const { t: _t } = useTranslation()
  const { locale, isRtl } = useLocale()
  const isAr = locale === "ar"
  const navigate = useNavigate()

  if (!isOpen) return null

  function formatSecsToMinSec(seconds?: number) {
    if (!seconds) return "00:00"
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] bg-white p-5 sm:p-7 shadow-2xl transition-transform animate-in slide-in-from-bottom duration-300 max-h-[92vh] overflow-y-auto text-[var(--gym-ink,#111111)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-full bg-black/5 text-gray-600 hover:bg-black/10 transition"
          >
            {isRtl ? <ArrowRight className="size-5" /> : <ArrowLeft className="size-5" />}
          </button>
          <h2 className="font-heading text-[18px] font-black text-[var(--gym-ink,#111111)]">
            {isAr ? "المجموع (ملخص التمرين)" : "Workout Summary"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-full bg-black/5 text-gray-600 hover:bg-black/10 transition"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Workout Title */}
        <div className="my-4 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-extrabold text-emerald-700">
            <CheckCircle2 className="size-3.5" />
            {isAr ? "تم إنجاز الحصة وحفظ السجل بنجاح" : "Session Completed & Saved"}
          </span>
          <h3 className="mt-2 font-heading text-[22px] font-extrabold text-[var(--gym-ink,#111111)]">
            {workoutTitle || (isAr ? "الجزء العلوي والأساسي" : "Workout Session")}
          </h3>
        </div>

        {/* 1. Dark Top KPI Card (Matching image 5) */}
        <div className="rounded-[24px] bg-[#141414] p-5 text-white shadow-xl">
          <div className="grid grid-cols-4 divide-x divide-white/10 rtl:divide-x-reverse text-center">
            {/* Exercises */}
            <div className="px-1">
              <span className="block text-[11px] font-medium text-white/60">
                {isAr ? "تمارين" : "Exercises"}
              </span>
              <span className="mt-1 block font-heading text-[22px] font-black text-[var(--gym-orange,#fb5001)]">
                {exercisesCompleted.length}
              </span>
              <span className="text-[10px] text-white/50">{isAr ? "تمرين" : "ex"}</span>
            </div>

            {/* Total Time */}
            <div className="px-1">
              <span className="block text-[11px] font-medium text-white/60">
                {isAr ? "الوقت الكلي" : "Total Time"}
              </span>
              <span className="mt-1 block font-heading text-[22px] font-black text-white">
                {durationMinutes}
              </span>
              <span className="text-[10px] text-white/50">{isAr ? "دقائق" : "min"}</span>
            </div>

            {/* Rest Time */}
            <div className="px-1">
              <span className="block text-[11px] font-medium text-white/60">
                {isAr ? "وقت الراحة" : "Rest Time"}
              </span>
              <span className="mt-1 block font-heading text-[22px] font-black text-white">
                {restMinutes}
              </span>
              <span className="text-[10px] text-white/50">{isAr ? "دقائق" : "min"}</span>
            </div>

            {/* Active Time */}
            <div className="px-1">
              <span className="block text-[11px] font-medium text-white/60">
                {isAr ? "وقت التمرين" : "Work Time"}
              </span>
              <span className="mt-1 block font-heading text-[22px] font-black text-[var(--gym-orange,#fb5001)]">
                {activeMinutes}
              </span>
              <span className="text-[10px] text-white/50">{isAr ? "دقائق" : "min"}</span>
            </div>
          </div>
        </div>

        {/* 2. Total Volume Badge (Matching image 5) */}
        <div className="mt-4 flex items-center justify-between rounded-2xl bg-[#F8F9FA] p-4 border border-black/[0.05]">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-xl bg-[var(--gym-orange,#fb5001)]/10 text-[var(--gym-orange,#fb5001)]">
              <Dumbbell className="size-4" />
            </div>
            <span className="text-[13px] font-extrabold text-[var(--gym-ink,#111111)]">
              {isAr ? "إجمالي الحجم التدريبي:" : "Total Volume Lifted:"}
            </span>
          </div>
          <span className="font-mono text-[17px] font-black text-[var(--gym-ink,#111111)]">
            {totalVolumeKg > 0 ? `${totalVolumeKg.toLocaleString()} ${isAr ? "كجم" : "kg"}` : `0 ${isAr ? "كجم (وزن الجسم)" : "kg (bodyweight)"}`}
          </span>
        </div>

        {/* 3. Exercise Timeline Details (Matching image 5) */}
        <div className="mt-5 space-y-3">
          <h4 className="font-heading text-[15px] font-extrabold text-[var(--gym-ink,#111111)]">
            {isAr ? "تفاصيل التمارين" : "Exercise Details"}
          </h4>

          <div className="space-y-2.5">
            {exercisesCompleted.map((ex, idx) => (
              <div
                key={ex.exerciseId || idx}
                className="flex items-center justify-between rounded-2xl border border-black/[0.06] bg-[#FAFAFA] p-3.5 transition hover:bg-white"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#111111] text-white text-[12px] font-black">
                    <Check className="size-4 stroke-[3] text-[var(--gym-orange,#fb5001)]" />
                  </div>
                  <div>
                    <h5 className="font-heading text-[14px] font-bold text-[var(--gym-ink,#111111)]">
                      {ex.name}
                    </h5>
                    <span className="text-[11px] font-medium text-[#8c8c8c]">
                      {ex.completedSets} {isAr ? "مجموعة" : "sets"}{" "}
                      {ex.weightKg ? `• ${ex.weightKg} ${isAr ? "كجم" : "kg"}` : ""}
                    </span>
                  </div>
                </div>

                <div className="text-end">
                  <span className="font-mono text-[13px] font-bold text-[var(--gym-ink,#111111)]">
                    {formatSecsToMinSec(ex.durationSeconds)}
                  </span>
                  <span className="block text-[10px] text-[#8c8c8c]">
                    {isAr ? "دقائق" : "duration"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notes / RPE (if logged) */}
        {perceivedEffort || notes ? (
          <div className="mt-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 p-3.5 text-[12px] text-amber-900 space-y-1">
            {perceivedEffort ? (
              <div className="flex items-center gap-1.5 font-bold">
                <Flame className="size-3.5 text-[var(--gym-orange,#fb5001)]" />
                <span>
                  {isAr ? `مستوى الجهد: ${perceivedEffort}/10` : `Effort: ${perceivedEffort}/10`}
                </span>
              </div>
            ) : null}
            {notes ? <p className="italic text-gray-700">"{notes}"</p> : null}
          </div>
        ) : null}

        {/* Bottom Actions */}
        <div className="mt-6 pt-4 border-t border-black/[0.06] flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:flex-1 inline-flex h-11 items-center justify-center rounded-full bg-[var(--gym-orange,#fb5001)] px-5 text-[14px] font-black text-white shadow-sm hover:opacity-95 active:scale-[0.98] transition"
          >
            {isAr ? "العودة للجدول التدريبي" : "Back to Workout Schedule"}
          </button>
          <button
            type="button"
            onClick={() => {
              onClose()
              navigate(APP_ROUTES.subscriber.workoutLog)
            }}
            className="w-full sm:w-auto inline-flex h-11 items-center justify-center rounded-full border border-black/10 px-5 text-[13px] font-bold text-[var(--gym-ink,#111111)] hover:bg-gray-50 transition"
          >
            {isAr ? "عرض سجل التمارين الكامل" : "View Workout History"}
          </button>
        </div>
      </div>
    </div>
  )
}
