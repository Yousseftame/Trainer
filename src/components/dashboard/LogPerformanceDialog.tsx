import { useState } from "react"
import { createPortal } from "react-dom"
import { Calendar, Dumbbell, X } from "lucide-react"
import { useLocale } from "@/hooks/useLocale"
import { appToast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import type { SavePerformanceInput } from "@/features/progress/service"

type LogPerformanceDialogProps = {
  open: boolean
  subscriberId: string
  subscriberName?: string
  onClose: () => void
  onSave: (input: SavePerformanceInput) => Promise<unknown>
}

const COMMON_EXERCISES = [
  { en: "Back squat", ar: "سكوات خلفي" },
  { en: "Bench press", ar: "بنش بريس" },
  { en: "Deadlift", ar: "ديدليفت" },
  { en: "Overhead press", ar: "ضغط أكتاف علوي" },
  { en: "Romanian deadlift", ar: "ديدليفت روماني" },
  { en: "Barbell row", ar: "تجديف بار" },
  { en: "Pull-ups", ar: "عقلة" },
  { en: "Hip thrust", ar: "هيب ثرست" },
]

export function LogPerformanceDialog({
  open,
  subscriberId,
  subscriberName,
  onClose,
  onSave,
}: LogPerformanceDialogProps) {
  const { locale } = useLocale()
  const isAr = locale === "ar"

  const [recordedAt, setRecordedAt] = useState(() => new Date().toISOString().slice(0, 10))
  const [name, setName] = useState("")
  const [value, setValue] = useState("")
  const [unit, setUnit] = useState<"kg" | "reps">("kg")
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)

  if (!open) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      appToast.error(isAr ? "يرجى تحديد اسم التمرين" : "Please enter exercise name")
      return
    }
    if (!value || isNaN(parseFloat(value))) {
      appToast.error(isAr ? "يرجى إدخال الوزن أو التكرارات" : "Please enter valid value")
      return
    }

    try {
      setSaving(true)
      await onSave({
        subscriberId,
        recordedAt: `${recordedAt}T12:00:00.000Z`,
        name: name.trim(),
        value: parseFloat(value),
        unit,
        notes: notes.trim() || undefined,
      })
      appToast.success(isAr ? "تم تسجيل الأداء بنجاح" : "Performance record saved")
      onClose()
    } catch {
      appToast.error(isAr ? "حدث خطأ أثناء الحفظ" : "Failed to save performance record")
    } finally {
      setSaving(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-[28px] bg-white p-5 sm:p-7 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#F0F0F0] pb-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-[var(--gym-ink,#063434)] text-[var(--gym-lime,#b8fe22)]">
              <Dumbbell className="size-5" />
            </span>
            <div>
              <h2 className="font-heading text-[18px] font-extrabold text-[var(--gym-ink,#063434)] sm:text-[20px]">
                {isAr ? "تسجيل رقم أداء رياضي (PR)" : "Log Athletic Performance (PR)"}
              </h2>
              {subscriberName ? (
                <p className="text-[12px] font-bold text-[#8c8c8c]">
                  {isAr ? "المشترك: " : "Subscriber: "}
                  <span className="text-[var(--gym-ink,#063434)]">{subscriberName}</span>
                </p>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full bg-[#F4F4F4] text-[#8c8c8c] hover:bg-black/5"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Date Picker */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-[12px] font-bold text-[var(--gym-ink,#063434)]">
              <Calendar className="size-3.5 text-[#8c8c8c]" />
              {isAr ? "تاريخ التسجيل" : "Date Recorded"}
            </label>
            <input
              type="date"
              required
              value={recordedAt}
              onChange={(e) => setRecordedAt(e.target.value)}
              className="h-11 w-full rounded-2xl bg-[#F4F4F4] px-3.5 text-[14px] font-medium text-[var(--gym-ink,#063434)] outline-none"
            />
          </div>

          {/* Exercise Name Input & Quick Suggestions */}
          <div>
            <label className="mb-1.5 block text-[12px] font-bold text-[var(--gym-ink,#063434)]">
              {isAr ? "اسم التمرين" : "Exercise Name"} *
            </label>
            <input
              type="text"
              required
              placeholder={isAr ? "مثال: Back squat" : "e.g. Back squat"}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 w-full rounded-2xl bg-[#F4F4F4] px-3.5 text-[14px] font-bold text-[var(--gym-ink,#063434)] outline-none"
            />

            {/* Quick Chips */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {COMMON_EXERCISES.map((ex) => {
                const label = isAr ? ex.ar : ex.en
                return (
                  <button
                    key={ex.en}
                    type="button"
                    onClick={() => setName(isAr ? ex.ar : ex.en)}
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[11px] font-bold transition",
                      name === label
                        ? "bg-[var(--gym-ink,#063434)] text-white"
                        : "bg-[#F4F4F4] text-[#8c8c8c] hover:bg-[#ececec] hover:text-[var(--gym-ink,#063434)]",
                    )}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Value and Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[12px] font-bold text-[var(--gym-ink,#063434)]">
                {isAr ? "القيمة المحققة" : "Recorded Value"} *
              </label>
              <input
                type="number"
                step="0.5"
                required
                placeholder="e.g. 120"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="h-11 w-full rounded-2xl bg-[#F4F4F4] px-3.5 text-[15px] font-bold text-[var(--gym-ink,#063434)] outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[12px] font-bold text-[var(--gym-ink,#063434)]">
                {isAr ? "الوحدة" : "Unit"}
              </label>
              <div className="flex h-11 rounded-2xl bg-[#F4F4F4] p-1">
                <button
                  type="button"
                  onClick={() => setUnit("kg")}
                  className={cn(
                    "flex-1 rounded-xl text-[12px] font-bold transition",
                    unit === "kg"
                      ? "bg-[var(--gym-ink,#063434)] text-white shadow-xs"
                      : "text-[#8c8c8c] hover:text-[var(--gym-ink,#063434)]",
                  )}
                >
                  kg
                </button>
                <button
                  type="button"
                  onClick={() => setUnit("reps")}
                  className={cn(
                    "flex-1 rounded-xl text-[12px] font-bold transition",
                    unit === "reps"
                      ? "bg-[var(--gym-ink,#063434)] text-white shadow-xs"
                      : "text-[#8c8c8c] hover:text-[var(--gym-ink,#063434)]",
                  )}
                >
                  {isAr ? "تكرار" : "reps"}
                </button>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1 block text-[12px] font-bold text-[var(--gym-ink,#063434)]">
              {isAr ? "ملاحظات الأداء (RPE، الحزام، إلخ)" : "Performance Notes (RPE, belt, etc.)"}
            </label>
            <input
              type="text"
              placeholder={isAr ? "مثال: RPE 8.5، بدون مساعدة..." : "e.g. RPE 8.5, clean lockout..."}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-11 w-full rounded-2xl bg-[#F4F4F4] px-3.5 text-[13px] font-medium text-[var(--gym-ink,#063434)] outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="h-10 rounded-full px-5 text-[13px] font-bold text-[#8c8c8c] hover:bg-[#F4F4F4]"
            >
              {isAr ? "إلغاء" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--gym-ink,#063434)] px-6 text-[13px] font-bold text-white shadow-sm hover:opacity-90 disabled:opacity-50"
            >
              {saving ? (isAr ? "جاري الحفظ..." : "Saving...") : (isAr ? "حفظ الرقم" : "Save Record")}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}
