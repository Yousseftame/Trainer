import { useEffect, useState } from "react"
import {
  BatteryLow,
  CheckCircle2,
  Flame,
  MessageSquare,
  Moon,
  ThumbsUp,
  X,
  Zap,
} from "lucide-react"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"

interface WorkoutFeedbackModalProps {
  isOpen: boolean
  onClose: () => void
  workoutTitle?: string
  onSubmit: (feedback: {
    perceivedEffort: number
    energyLevel: "great" | "good" | "tired" | "exhausted"
    notes: string
  }) => void
}

type EnergyId = "great" | "good" | "tired" | "exhausted"

const ENERGY_OPTIONS: {
  id: EnergyId
  icon: typeof Zap
  ar: string
  en: string
}[] = [
  { id: "great", icon: Zap, ar: "طاقة عالية", en: "Felt amazing" },
  { id: "good", icon: ThumbsUp, ar: "منضبط وجيد", en: "Solid workout" },
  { id: "tired", icon: BatteryLow, ar: "متعب نسبياً", en: "Felt tired" },
  { id: "exhausted", icon: Moon, ar: "مرهق جداً", en: "Exhausted" },
]

function rpeLabel(value: number, isAr: boolean) {
  if (value <= 3) return isAr ? "خفيف / إحماء" : "Very light"
  if (value <= 5) return isAr ? "معتدل ومتوازن" : "Moderate"
  if (value <= 7) return isAr ? "قوي ومستهدف" : "Strong stimulus"
  if (value <= 9) return isAr ? "شاق وقريب من الحد" : "Near limit"
  return isAr ? "أقصى مجهود" : "Maximum effort"
}

export function WorkoutFeedbackModal({
  isOpen,
  onClose,
  workoutTitle,
  onSubmit,
}: WorkoutFeedbackModalProps) {
  const { locale } = useLocale()
  const isAr = locale === "ar"

  const [rpe, setRpe] = useState(7)
  const [energy, setEnergy] = useState<EnergyId>("good")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    if (!isOpen) return
    setRpe(7)
    setEnergy("good")
    setNotes("")
  }, [isOpen])

  if (!isOpen) return null

  function handleSubmit() {
    onSubmit({
      perceivedEffort: rpe,
      energyLevel: energy,
      notes: notes.trim(),
    })
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="workout-feedback-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className="flex w-full max-w-lg max-h-[92vh] flex-col rounded-t-[28px] sm:rounded-[28px] bg-white text-[var(--gym-ink,#111111)] shadow-2xl animate-in slide-in-from-bottom duration-300 sm:zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — matches WorkoutSummaryModal */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-black/[0.06] px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-3 sm:px-6 sm:pt-5">
          <div className="min-w-0 flex-1">
            <p
              id="workout-feedback-title"
              className="font-heading text-[17px] font-extrabold tracking-tight"
            >
              {isAr ? "تقييم الجلسة" : "Session check-in"}
            </p>
            <p className="mt-0.5 truncate text-[12px] font-medium text-[#8c8c8c]">
              {workoutTitle ||
                (isAr ? "جلسة تدريبية مكتملة" : "Completed workout")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-black/5 text-[#6B7280] transition hover:bg-black/10"
            aria-label={isAr ? "إغلاق" : "Close"}
          >
            <X className="size-4" strokeWidth={2.25} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6 sm:py-5 space-y-5">
          <div className="flex justify-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-extrabold text-emerald-700">
              <CheckCircle2 className="size-3.5" strokeWidth={2.5} />
              {isAr ? "تم إنجاز الحصة" : "Workout completed"}
            </span>
          </div>

          {/* RPE — dark panel card like summary KPIs */}
          <section className="rounded-[22px] bg-[#141414] p-4 sm:p-5 text-white">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="flex size-8 items-center justify-center rounded-xl bg-[var(--gym-orange,#fb5001)]/15 text-[var(--gym-orange,#fb5001)]">
                    <Flame className="size-4" strokeWidth={2.25} />
                  </span>
                  <div>
                    <h3 className="font-heading text-[14px] font-extrabold">
                      {isAr ? "مستوى الجهد (RPE)" : "Perceived effort (RPE)"}
                    </h3>
                    <p className="text-[11px] font-medium text-white/50">
                      {rpeLabel(rpe, isAr)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-end shrink-0">
                <span className="font-heading text-[28px] font-black leading-none text-[var(--gym-orange,#fb5001)] tabular-nums">
                  {rpe}
                </span>
                <span className="ms-0.5 text-[12px] font-bold text-white/40">
                  /10
                </span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-10 gap-1">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
                const active = rpe === n
                const filled = n <= rpe
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRpe(n)}
                    aria-label={`RPE ${n}`}
                    aria-pressed={active}
                    className={cn(
                      "flex h-9 items-center justify-center rounded-lg text-[11px] font-extrabold tabular-nums transition active:scale-95",
                      active
                        ? "bg-[var(--gym-orange,#fb5001)] text-white shadow-sm"
                        : filled
                          ? "bg-white/15 text-white"
                          : "bg-white/5 text-white/35 hover:bg-white/10 hover:text-white/70",
                    )}
                  >
                    {n}
                  </button>
                )
              })}
            </div>

            <div className="mt-2.5 flex justify-between text-[10px] font-bold uppercase tracking-wider text-white/35">
              <span>{isAr ? "خفيف" : "Easy"}</span>
              <span>{isAr ? "أقصى" : "Max"}</span>
            </div>
          </section>

          {/* Energy */}
          <section className="space-y-2.5">
            <h3 className="font-heading text-[13px] font-extrabold text-[var(--gym-ink,#111111)]">
              {isAr ? "كيف كان مستوى طاقتك؟" : "How was your energy?"}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {ENERGY_OPTIONS.map((opt) => {
                const active = energy === opt.id
                const Icon = opt.icon
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setEnergy(opt.id)}
                    aria-pressed={active}
                    className={cn(
                      "flex items-center gap-2.5 rounded-2xl border px-3 py-3 text-start transition active:scale-[0.98]",
                      active
                        ? "border-[var(--gym-orange,#fb5001)] bg-[var(--gym-orange,#fb5001)]/[0.06] shadow-sm"
                        : "border-black/[0.07] bg-[#FAFAFA] hover:border-black/15 hover:bg-white",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-xl",
                        active
                          ? "bg-[var(--gym-orange,#fb5001)] text-white"
                          : "bg-black/[0.04] text-[#6B7280]",
                      )}
                    >
                      <Icon className="size-4" strokeWidth={2.25} />
                    </span>
                    <span
                      className={cn(
                        "text-[12px] font-bold leading-snug",
                        active
                          ? "text-[var(--gym-orange,#fb5001)]"
                          : "text-[#4B5563]",
                      )}
                    >
                      {isAr ? opt.ar : opt.en}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>

          {/* Notes */}
          <section className="space-y-2.5">
            <label
              htmlFor="workout-feedback-notes"
              className="flex items-center gap-2 font-heading text-[13px] font-extrabold text-[var(--gym-ink,#111111)]"
            >
              <MessageSquare className="size-3.5 text-[#8c8c8c]" strokeWidth={2.25} />
              <span>
                {isAr ? "ملاحظات للمدرب" : "Notes for your coach"}
                <span className="ms-1 font-medium text-[#9CA3AF]">
                  ({isAr ? "اختياري" : "optional"})
                </span>
              </span>
            </label>
            <textarea
              id="workout-feedback-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                isAr
                  ? "صعوبة في تمرين، ألم، أو أي ملاحظة مهمة…"
                  : "Any difficulty, pain, or notes for your coach…"
              }
              className="w-full resize-none rounded-2xl border border-black/[0.08] bg-[#F7F7F7] px-3.5 py-3 text-[13px] leading-relaxed text-[var(--gym-ink,#111111)] placeholder:text-[#9CA3AF] transition focus:border-[var(--gym-orange,#fb5001)] focus:bg-white focus:outline-none"
            />
          </section>
        </div>

        {/* Sticky footer */}
        <div className="shrink-0 border-t border-black/[0.06] bg-white px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-5 space-y-2">
          <button
            type="button"
            onClick={handleSubmit}
            className="flex h-12 w-full items-center justify-center rounded-full bg-[var(--gym-orange,#fb5001)] px-6 text-[14px] font-extrabold text-white shadow-md transition hover:opacity-95 active:scale-[0.98]"
          >
            {isAr ? "حفظ وعرض الملخص" : "Save & view summary"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-full items-center justify-center rounded-full text-[13px] font-bold text-[#8c8c8c] transition hover:bg-black/[0.04] hover:text-[#525252]"
          >
            {isAr ? "تخطي التقييم" : "Skip for now"}
          </button>
        </div>
      </div>
    </div>
  )
}
