import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Flame, MessageSquare, Sparkles, Trophy } from "lucide-react"
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

const ENERGY_OPTIONS = [
  { id: "great", icon: "🔥", ar: "ممتاز وطاقة عالية", en: "Felt Amazing" },
  { id: "good", icon: "💪", ar: "جيد ومنضبط", en: "Solid Workout" },
  { id: "tired", icon: "🥱", ar: "متعب نسبياً", en: "Felt Tired" },
  { id: "exhausted", icon: "💤", ar: "مرهق جداً", en: "Exhausted" },
] as const

export function WorkoutFeedbackModal({
  isOpen,
  onClose,
  workoutTitle,
  onSubmit,
}: WorkoutFeedbackModalProps) {
  const { t: _t } = useTranslation()
  const { locale } = useLocale()
  const isAr = locale === "ar"

  const [rpe, setRpe] = useState<number>(7)
  const [energy, setEnergy] = useState<"great" | "good" | "tired" | "exhausted">("great")
  const [notes, setNotes] = useState("")

  if (!isOpen) return null

  function getRpeDescription(value: number) {
    if (value <= 3) return isAr ? "خفيف جداً / إحماء مريح" : "Very light / warm up"
    if (value <= 5) return isAr ? "معتدل ومتوازن" : "Moderate & controlled"
    if (value <= 7) return isAr ? "قوي ومثالي للنمو العضلي" : "Strong & target stimulus"
    if (value <= 9) return isAr ? "شاق جداً وتحدٍ كبير" : "Very tough & near limit"
    return isAr ? "أقصى مجهود ممكن (10/10)" : "Absolute maximum effort"
  }

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-lg rounded-[28px] bg-white p-6 shadow-2xl text-[var(--gym-ink,#111111)] animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Celebration Header */}
        <div className="flex flex-col items-center text-center pb-4 border-b border-black/[0.06]">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 mb-2">
            <Trophy className="size-8" />
          </div>
          <h3 className="font-heading text-[20px] sm:text-[22px] font-black text-[var(--gym-ink,#111111)]">
            {isAr ? "رائع يا بطل! أنهيت تمرينك بنجاح 🎉" : "Great Job! Workout Completed 🎉"}
          </h3>
          <p className="mt-1 text-[13px] text-[#8c8c8c]">
            {workoutTitle || (isAr ? "جلسة تدريبية مكتملة" : "Completed Workout Session")}
          </p>
        </div>

        {/* 1. RPE Slider */}
        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-[14px] font-extrabold text-[var(--gym-ink,#111111)]">
              <Flame className="size-4 text-[var(--gym-orange,#fb5001)]" />
              <span>{isAr ? "مستوى شدة الجهد (RPE):" : "Perceived Exertion (RPE):"}</span>
            </label>
            <span className="font-mono text-[16px] font-black text-[var(--gym-orange,#fb5001)]">
              {rpe} / 10
            </span>
          </div>

          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={rpe}
            onChange={(e) => setRpe(parseInt(e.target.value, 10))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[var(--gym-orange,#fb5001)]"
          />

          <p className="text-[12px] font-bold text-gray-500 text-center pt-1">
            {getRpeDescription(rpe)}
          </p>
        </div>

        {/* 2. Energy / Feeling Selector */}
        <div className="mt-5 space-y-2">
          <label className="flex items-center gap-1.5 text-[14px] font-extrabold text-[var(--gym-ink,#111111)]">
            <Sparkles className="size-4 text-amber-500" />
            <span>{isAr ? "كيف كان شعورك ومستوى طاقتك؟" : "How was your energy level?"}</span>
          </label>

          <div className="grid grid-cols-2 gap-2">
            {ENERGY_OPTIONS.map((opt) => {
              const active = energy === opt.id
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setEnergy(opt.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-2xl p-3 text-start transition border",
                    active
                      ? "border-[var(--gym-orange,#fb5001)] bg-[var(--gym-orange,#fb5001)]/5 font-bold shadow-xs text-[var(--gym-orange,#fb5001)]"
                      : "border-black/[0.07] bg-[#FAFAFA] text-[#6B7280] hover:bg-white hover:border-black/15",
                  )}
                >
                  <span className="text-[20px]">{opt.icon}</span>
                  <span className="text-[12px] font-bold">{isAr ? opt.ar : opt.en}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* 3. Feedback Notes for Coach */}
        <div className="mt-5 space-y-2">
          <label className="flex items-center gap-1.5 text-[14px] font-extrabold text-[var(--gym-ink,#111111)]">
            <MessageSquare className="size-4 text-[var(--gym-ink,#111111)]" />
            <span>{isAr ? "ملاحظاتك للمدرب (اختياري):" : "Notes for your Coach (Optional):"}</span>
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={
              isAr
                ? "هل واجهت صعوبة في تمرين معين؟ أو شعرت بأي ألم أو احتكاك؟"
                : "Any difficulty or pain? Notes will be sent directly to your coach..."
            }
            className="w-full rounded-2xl border border-black/[0.08] bg-[#F9FAFB] p-3 text-[13px] placeholder:text-[#9CA3AF] focus:border-[var(--gym-orange,#fb5001)] focus:bg-white focus:outline-none transition resize-none"
          />
        </div>

        {/* Action Button */}
        <div className="mt-6 pt-4 border-t border-black/[0.06] flex items-center gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 inline-flex h-12 items-center justify-center rounded-full bg-[var(--gym-orange,#fb5001)] px-6 text-[15px] font-black text-white shadow-md hover:opacity-95 active:scale-[0.98] transition"
          >
            {isAr ? "حفظ وعرض تقرير الجلسة 🚀" : "Save & View Summary Report 🚀"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-12 items-center justify-center rounded-full border border-black/10 px-5 text-[13px] font-bold text-gray-500 hover:bg-gray-100 transition"
          >
            {isAr ? "تخطي" : "Skip"}
          </button>
        </div>
      </div>
    </div>
  )
}
