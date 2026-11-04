import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Check, Dumbbell, RefreshCw, X } from "lucide-react"
import { useLocale } from "@/hooks/useLocale"
import { appToast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import type { ExerciseAlternative, WorkoutExercise } from "@/types/program"
import { resolveBilingualText } from "@/features/workouts/demo"

interface ExerciseChangeModalProps {
  isOpen: boolean
  onClose: () => void
  exercise: WorkoutExercise | null
  onSwapExercise?: (substitute: ExerciseAlternative, reason: string) => void
  onRequestChange?: (reason: string, notes: string) => void
}

const COMMON_REASONS = [
  { id: "equipment", ar: "الجهاز غير متوفر أو مشغول", en: "Machine/Equipment busy or missing" },
  { id: "pain", ar: "أشعر بألم أو إجهاد بالمفصل", en: "Joint discomfort or injury" },
  { id: "difficulty", ar: "التمرين صعب جداً حالياً", en: "Exercise is too difficult" },
  { id: "other", ar: "تفضيل شخصي أو سبب آخر", en: "Personal preference / Other" },
]

export function ExerciseChangeModal({
  isOpen,
  onClose,
  exercise,
  onSwapExercise,
  onRequestChange,
}: ExerciseChangeModalProps) {
  const { t: _t } = useTranslation()
  const { locale } = useLocale()
  const isAr = locale === "ar"

  const [selectedReason, setSelectedReason] = useState<string>(COMMON_REASONS[0].id)
  const [customNotes, setCustomNotes] = useState("")
  const [selectedAlternativeId, setSelectedAlternativeId] = useState<string | null>(null)

  if (!isOpen || !exercise) return null

  const exerciseName = resolveBilingualText(exercise.name, locale)
  const alternatives = exercise.alternatives ?? []

  function handleSubmit() {
    const reasonObj = COMMON_REASONS.find((r) => r.id === selectedReason)
    const reasonText = reasonObj ? (isAr ? reasonObj.ar : reasonObj.en) : selectedReason

    if (selectedAlternativeId && onSwapExercise) {
      const alt = alternatives.find((a) => a.id === selectedAlternativeId)
      if (alt) {
        onSwapExercise(alt, `${reasonText}: ${customNotes}`.trim())
        appToast.success(
          isAr
            ? `تم استبدال التمرين بـ "${resolveBilingualText(alt.name, locale)}" بنجاح!`
            : `Exercise substituted successfully with "${resolveBilingualText(alt.name, locale)}"`,
        )
        onClose()
        return
      }
    }

    if (onRequestChange) {
      onRequestChange(reasonText, customNotes)
      appToast.success(
        isAr
          ? "تم إرسال طلب استبدال التمرين إلى المدرب وسيتم مراجعته فوراً!"
          : "Exercise change request submitted to coach successfully!",
      )
    } else {
      appToast.success(isAr ? "تم حفظ الملاحظات بنجاح" : "Notes saved successfully")
    }

    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-lg rounded-t-[28px] sm:rounded-[28px] bg-white p-6 shadow-2xl transition-transform animate-in slide-in-from-bottom sm:slide-in-from-bottom-4 duration-300 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[var(--gym-ink,#111111)]/5 text-[var(--gym-orange,#fb5001)]">
              <RefreshCw className="size-5" />
            </div>
            <div>
              <h3 className="font-heading text-[17px] font-extrabold text-[var(--gym-ink,#111111)]">
                {isAr ? "هل تريد تغيير هذا التمرين ؟" : "Want to substitute this exercise?"}
              </h3>
              <p className="text-[12px] font-medium text-[#8c8c8c]">
                {exerciseName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full bg-black/5 text-gray-500 hover:bg-black/10 transition"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Reason Question */}
        <div className="mt-4 space-y-3">
          <label className="block text-[14px] font-bold text-[var(--gym-ink,#111111)]">
            {isAr ? "ايه السبب؟" : "What is the reason?"}
          </label>

          {/* Quick Select Chips */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {COMMON_REASONS.map((reason) => {
              const active = selectedReason === reason.id
              return (
                <button
                  key={reason.id}
                  type="button"
                  onClick={() => setSelectedReason(reason.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl p-2.5 text-start text-[12px] font-semibold transition border",
                    active
                      ? "border-[var(--gym-orange,#fb5001)] bg-[var(--gym-orange,#fb5001)]/5 text-[var(--gym-orange,#fb5001)] font-bold shadow-2xs"
                      : "border-black/[0.07] bg-[#FAFAFA] text-[#555] hover:bg-[#F3F4F6]",
                  )}
                >
                  <span
                    className={cn(
                      "size-2 rounded-full shrink-0",
                      active ? "bg-[var(--gym-orange,#fb5001)]" : "bg-gray-300",
                    )}
                  />
                  <span className="truncate">{isAr ? reason.ar : reason.en}</span>
                </button>
              )
            })}
          </div>

          {/* Textarea */}
          <div className="mt-2">
            <textarea
              rows={3}
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder={isAr ? "أضف ملاحظاتك هنا..." : "Add your notes here..."}
              className="w-full rounded-2xl border border-black/[0.08] bg-[#F9FAFB] p-3.5 text-[13px] text-[var(--gym-ink,#111111)] placeholder:text-[#9CA3AF] focus:border-[var(--gym-orange,#fb5001)] focus:bg-white focus:outline-none transition resize-none"
            />
          </div>
        </div>

        {/* Coach Approved Substitutes (if available) */}
        {alternatives.length > 0 ? (
          <div className="mt-4 space-y-2.5 pt-3 border-t border-black/[0.06]">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-bold uppercase tracking-wider text-[var(--gym-orange,#fb5001)]">
                {isAr ? "بدائل معتمدة فورية من المدرب:" : "Coach-Approved Instant Substitutes:"}
              </span>
              <span className="text-[11px] font-bold text-[#8c8c8c]">
                {alternatives.length} {isAr ? "بدائل" : "options"}
              </span>
            </div>

            <div className="space-y-2">
              {alternatives.map((alt) => {
                const altName = resolveBilingualText(alt.name, locale)
                const altReason = resolveBilingualText(alt.reason, locale)
                const isSelected = selectedAlternativeId === alt.id

                return (
                  <div
                    key={alt.id}
                    onClick={() => setSelectedAlternativeId(isSelected ? null : alt.id)}
                    className={cn(
                      "cursor-pointer rounded-2xl p-3 border transition flex items-start justify-between gap-3",
                      isSelected
                        ? "border-[var(--gym-ink,#111111)] bg-[var(--gym-ink,#111111)]/5 shadow-xs"
                        : "border-black/[0.07] bg-[#FAFAFA] hover:bg-white hover:border-black/15",
                    )}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Dumbbell className="size-3.5 text-[var(--gym-ink,#111111)]" />
                        <span className="font-heading text-[13px] font-bold text-[var(--gym-ink,#111111)]">
                          {altName}
                        </span>
                        {alt.equipment ? (
                          <span className="rounded-md bg-black/5 px-2 py-0.5 text-[10px] font-bold text-gray-600">
                            {alt.equipment}
                          </span>
                        ) : null}
                      </div>
                      {altReason ? (
                        <p className="text-[11px] text-[#6B7280]">
                          💡 {altReason}
                        </p>
                      ) : null}
                    </div>

                    <div
                      className={cn(
                        "flex size-6 shrink-0 items-center justify-center rounded-full border transition",
                        isSelected
                          ? "border-[var(--gym-ink,#111111)] bg-[var(--gym-ink,#111111)] text-white"
                          : "border-gray-300 bg-white",
                      )}
                    >
                      {isSelected ? <Check className="size-3.5" /> : null}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : null}

        {/* Action Buttons */}
        <div className="mt-5 pt-3 border-t border-black/[0.06] flex items-center gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 inline-flex h-11 items-center justify-center rounded-full bg-[var(--gym-orange,#fb5001)] px-5 text-[14px] font-bold text-white shadow-sm transition hover:opacity-95 active:scale-[0.98]"
          >
            {selectedAlternativeId
              ? isAr
                ? "تبديل التمرين بهذا البديل"
                : "Substitute With This Option"
              : isAr
                ? "حفظ وإرسال الطلب للمدرب"
                : "Save & Request Change"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 items-center justify-center rounded-full border border-black/10 px-5 text-[13px] font-bold text-[#6B7280] hover:bg-gray-100 transition"
          >
            {isAr ? "إلغاء" : "Cancel"}
          </button>
        </div>
      </div>
    </div>
  )
}

