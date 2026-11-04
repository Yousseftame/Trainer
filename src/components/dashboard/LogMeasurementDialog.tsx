import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { Calendar, Scale, X } from "lucide-react"
import { useLocale } from "@/hooks/useLocale"
import { appToast } from "@/lib/toast"
import type { BodyMeasurement } from "@/types/progress"
import type { SaveMeasurementInput } from "@/features/progress/service"

type LogMeasurementDialogProps = {
  open: boolean
  subscriberId: string
  subscriberName?: string
  initialData?: BodyMeasurement | null
  onClose: () => void
  onSave: (input: SaveMeasurementInput) => Promise<unknown>
}

export function LogMeasurementDialog({
  open,
  subscriberId,
  subscriberName,
  initialData,
  onClose,
  onSave,
}: LogMeasurementDialogProps) {
  const { locale } = useLocale()
  const isAr = locale === "ar"

  const [recordedAt, setRecordedAt] = useState(() => new Date().toISOString().slice(0, 10))
  const [weightKg, setWeightKg] = useState("")
  const [chestCm, setChestCm] = useState("")
  const [waistCm, setWaistCm] = useState("")
  const [hipsCm, setHipsCm] = useState("")
  const [armsCm, setArmsCm] = useState("")
  const [thighsCm, setThighsCm] = useState("")
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    if (initialData) {
      setRecordedAt(initialData.recordedAt ? initialData.recordedAt.slice(0, 10) : new Date().toISOString().slice(0, 10))
      setWeightKg(initialData.weightKg != null ? String(initialData.weightKg) : "")
      setChestCm(initialData.chestCm != null ? String(initialData.chestCm) : "")
      setWaistCm(initialData.waistCm != null ? String(initialData.waistCm) : "")
      setHipsCm(initialData.hipsCm != null ? String(initialData.hipsCm) : "")
      setArmsCm(initialData.armsCm != null ? String(initialData.armsCm) : "")
      setThighsCm(initialData.thighsCm != null ? String(initialData.thighsCm) : "")
      setNotes(initialData.notes || "")
    } else {
      setRecordedAt(new Date().toISOString().slice(0, 10))
      setWeightKg("")
      setChestCm("")
      setWaistCm("")
      setHipsCm("")
      setArmsCm("")
      setThighsCm("")
      setNotes("")
    }
  }, [open, initialData])

  if (!open) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!weightKg && !waistCm && !chestCm) {
      appToast.error(isAr ? "يرجى إدخال الوزن أو القياسات على الأقل" : "Please enter at least weight or a measurement")
      return
    }

    try {
      setSaving(true)
      await onSave({
        id: initialData?.id,
        subscriberId,
        recordedAt: `${recordedAt}T12:00:00.000Z`,
        weightKg: weightKg ? parseFloat(weightKg) : undefined,
        chestCm: chestCm ? parseFloat(chestCm) : undefined,
        waistCm: waistCm ? parseFloat(waistCm) : undefined,
        hipsCm: hipsCm ? parseFloat(hipsCm) : undefined,
        armsCm: armsCm ? parseFloat(armsCm) : undefined,
        thighsCm: thighsCm ? parseFloat(thighsCm) : undefined,
        notes: notes.trim() || undefined,
      })
      appToast.success(isAr ? "تم حفظ القياسات بنجاح" : "Measurements logged successfully")
      onClose()
    } catch {
      appToast.error(isAr ? "حدث خطأ أثناء الحفظ" : "Failed to log measurements")
    } finally {
      setSaving(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay Backdrop covering whole screen and sidebar */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden
      />

      {/* Modal Dialog Content */}
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-[28px] bg-white p-5 sm:p-7 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#F0F0F0] pb-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-[var(--gym-ink,#111111)] text-[var(--gym-lime,#fb5001)]">
              <Scale className="size-5" />
            </span>
            <div>
              <h2 className="font-heading text-[18px] font-extrabold text-[var(--gym-ink,#111111)] sm:text-[20px]">
                {initialData
                  ? (isAr ? "تعديل القياسات" : "Edit Measurements")
                  : (isAr ? "تسجيل وزن وقياسات جديدة" : "Log Weight & Measurements")}
              </h2>
              {subscriberName ? (
                <p className="text-[12px] font-bold text-[#8c8c8c]">
                  {isAr ? "المشترك: " : "Subscriber: "}
                  <span className="text-[var(--gym-ink,#111111)]">{subscriberName}</span>
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
            <label className="mb-1.5 flex items-center gap-1.5 text-[12px] font-bold text-[var(--gym-ink,#111111)]">
              <Calendar className="size-3.5 text-[#8c8c8c]" />
              {isAr ? "تاريخ التسجيل" : "Date recorded"}
            </label>
            <input
              type="date"
              required
              value={recordedAt}
              onChange={(e) => setRecordedAt(e.target.value)}
              className="h-11 w-full rounded-2xl bg-[#F4F4F4] px-3.5 text-[14px] font-medium text-[var(--gym-ink,#111111)] outline-none focus:ring-2 focus:ring-[var(--gym-ink,#111111)]"
            />
          </div>

          {/* Primary Metric: Body Weight */}
          <div className="rounded-2xl border border-[var(--gym-lime,#fb5001)]/20 bg-[var(--gym-lime,#fb5001)]/5 p-3.5">
            <label className="mb-1 block text-[12px] font-extrabold text-[var(--gym-ink,#111111)]">
              {isAr ? "وزن الجسم (كجم)" : "Body Weight (kg)"} *
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 82.5"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="h-11 w-full rounded-xl bg-white px-3.5 text-[15px] font-bold text-[var(--gym-ink,#111111)] shadow-2xs outline-none focus:ring-2 focus:ring-[var(--gym-lime,#fb5001)]/40"
              />
              <span className="pointer-events-none absolute end-3.5 top-1/2 -translate-y-1/2 text-[12px] font-extrabold text-[#8c8c8c]">
                kg
              </span>
            </div>
          </div>

          {/* Body Circumferences 2x2 or 3x2 Grid */}
          <div>
            <p className="mb-2 text-[12px] font-bold text-[var(--gym-ink,#111111)]">
              {isAr ? "محيط أجزاء الجسم (سم) - اختياري" : "Body Circumferences (cm) - Optional"}
            </p>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-[11px] font-bold text-[#8c8c8c]">
                  {isAr ? "الخصر" : "Waist"}
                </label>
                <input
                  type="number"
                  step="0.5"
                  placeholder="cm"
                  value={waistCm}
                  onChange={(e) => setWaistCm(e.target.value)}
                  className="h-10 w-full rounded-xl bg-[#F4F4F4] px-3 text-[13px] font-bold text-[var(--gym-ink,#111111)] outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-bold text-[#8c8c8c]">
                  {isAr ? "الصدر" : "Chest"}
                </label>
                <input
                  type="number"
                  step="0.5"
                  placeholder="cm"
                  value={chestCm}
                  onChange={(e) => setChestCm(e.target.value)}
                  className="h-10 w-full rounded-xl bg-[#F4F4F4] px-3 text-[13px] font-bold text-[var(--gym-ink,#111111)] outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-bold text-[#8c8c8c]">
                  {isAr ? "الوركين" : "Hips"}
                </label>
                <input
                  type="number"
                  step="0.5"
                  placeholder="cm"
                  value={hipsCm}
                  onChange={(e) => setHipsCm(e.target.value)}
                  className="h-10 w-full rounded-xl bg-[#F4F4F4] px-3 text-[13px] font-bold text-[var(--gym-ink,#111111)] outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-bold text-[#8c8c8c]">
                  {isAr ? "الذراع" : "Arms"}
                </label>
                <input
                  type="number"
                  step="0.5"
                  placeholder="cm"
                  value={armsCm}
                  onChange={(e) => setArmsCm(e.target.value)}
                  className="h-10 w-full rounded-xl bg-[#F4F4F4] px-3 text-[13px] font-bold text-[var(--gym-ink,#111111)] outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-bold text-[#8c8c8c]">
                  {isAr ? "الفخذ" : "Thighs"}
                </label>
                <input
                  type="number"
                  step="0.5"
                  placeholder="cm"
                  value={thighsCm}
                  onChange={(e) => setThighsCm(e.target.value)}
                  className="h-10 w-full rounded-xl bg-[#F4F4F4] px-3 text-[13px] font-bold text-[var(--gym-ink,#111111)] outline-none"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1 block text-[12px] font-bold text-[var(--gym-ink,#111111)]">
              {isAr ? "ملاحظات وتفاصيل الفحص" : "Notes & Check-in Details"}
            </label>
            <textarea
              rows={2}
              placeholder={isAr ? "ملاحظات حول النوم، الطاقة، أو الالتزام..." : "Notes on sleep, energy, diet compliance..."}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-2xl bg-[#F4F4F4] p-3 text-[13px] font-medium text-[var(--gym-ink,#111111)] outline-none"
            />
          </div>

          {/* Actions */}
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
              className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--gym-ink,#111111)] px-6 text-[13px] font-bold text-white shadow-sm hover:opacity-90 disabled:opacity-50"
            >
              {saving ? (isAr ? "جاري الحفظ..." : "Saving...") : (isAr ? "حفظ القياسات" : "Save Measurements")}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}
