import { useState, useRef } from "react"
import { createPortal } from "react-dom"
import { Calendar, Camera, Upload, X } from "lucide-react"
import { useLocale } from "@/hooks/useLocale"
import { appToast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import type { ProgressPhotoPose } from "@/types/progress"
import type { SavePhotoInput } from "@/features/progress/service"

type AddProgressPhotoDialogProps = {
  open: boolean
  subscriberId: string
  subscriberName?: string
  onClose: () => void
  onSave: (input: SavePhotoInput) => Promise<unknown>
}

const POSES: Array<{ id: ProgressPhotoPose; labelEn: string; labelAr: string }> = [
  { id: "front", labelEn: "Front Pose", labelAr: "وضعية أمامية" },
  { id: "side", labelEn: "Side Pose", labelAr: "وضعية جانبية" },
  { id: "back", labelEn: "Back Pose", labelAr: "وضعية خلفية" },
]

export function AddProgressPhotoDialog({
  open,
  subscriberId,
  subscriberName,
  onClose,
  onSave,
}: AddProgressPhotoDialogProps) {
  const { locale } = useLocale()
  const isAr = locale === "ar"

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pose, setPose] = useState<ProgressPhotoPose>("front")
  const [takenAt, setTakenAt] = useState(() => new Date().toISOString().slice(0, 10))
  const [caption, setCaption] = useState("")
  const [previewUrl, setPreviewUrl] = useState<string>("")
  const [saving, setSaving] = useState(false)

  if (!open) return null

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 8 * 1024 * 1024) {
      appToast.error(isAr ? "الحد الأقصى لحجم الصورة هو 8 ميجابايت" : "Max photo size is 8MB")
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      if (typeof event.target?.result === "string") {
        setPreviewUrl(event.target.result)
      }
    }
    reader.readAsDataURL(file)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!previewUrl) {
      appToast.error(isAr ? "يرجى تحديد أو رفع صورة التقدم" : "Please select or upload a progress photo")
      return
    }

    try {
      setSaving(true)
      await onSave({
        subscriberId,
        storagePath: previewUrl,
        takenAt: `${takenAt}T12:00:00.000Z`,
        pose,
        caption: caption.trim() || undefined,
      })
      appToast.success(isAr ? "تمت إضافة صورة التقدم بنجاح" : "Progress photo added successfully")
      onClose()
    } catch {
      appToast.error(isAr ? "حدث خطأ أثناء حفظ الصورة" : "Failed to add progress photo")
    } finally {
      setSaving(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay Backdrop */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-[28px] bg-white p-5 sm:p-7 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#F0F0F0] pb-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-[var(--gym-ink,#111111)] text-[var(--gym-lime,#fb5001)]">
              <Camera className="size-5" />
            </span>
            <div>
              <h2 className="font-heading text-[18px] font-extrabold text-[var(--gym-ink,#111111)] sm:text-[20px]">
                {isAr ? "إضافة صورة تقدم" : "Add Progress Photo"}
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
          {/* Pose Selector Tabs */}
          <div>
            <label className="mb-1.5 block text-[12px] font-bold text-[var(--gym-ink,#111111)]">
              {isAr ? "وضعية الصورة" : "Photo Pose"}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {POSES.map((item) => {
                const active = pose === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPose(item.id)}
                    className={cn(
                      "flex h-11 flex-col items-center justify-center rounded-2xl text-[12px] font-bold transition",
                      active
                        ? "bg-[var(--gym-ink,#111111)] text-white shadow-xs"
                        : "bg-[#F4F4F4] text-[var(--gym-ink,#111111)] hover:bg-[#ececec]",
                    )}
                  >
                    <span>{isAr ? item.labelAr : item.labelEn}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Date Picker */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-[12px] font-bold text-[var(--gym-ink,#111111)]">
              <Calendar className="size-3.5 text-[#8c8c8c]" />
              {isAr ? "تاريخ التقاط الصورة" : "Date Taken"}
            </label>
            <input
              type="date"
              required
              value={takenAt}
              onChange={(e) => setTakenAt(e.target.value)}
              className="h-11 w-full rounded-2xl bg-[#F4F4F4] px-3.5 text-[14px] font-medium text-[var(--gym-ink,#111111)] outline-none"
            />
          </div>

          {/* Photo Upload Area */}
          <div>
            <label className="mb-1.5 block text-[12px] font-bold text-[var(--gym-ink,#111111)]">
              {isAr ? "ملف الصورة" : "Photo File"}
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {previewUrl ? (
              <div className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-2xl border border-black/10 bg-[var(--gym-ink,#111111)]">
                <img
                  src={previewUrl}
                  alt="Progress preview"
                  className="h-full w-full object-contain"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-3 end-3 rounded-full bg-black/75 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur-xs hover:bg-black"
                >
                  {isAr ? "تغيير الصورة" : "Change photo"}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex aspect-[16/9] w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#D9D9D9] bg-[#F9F9F9] p-4 text-center transition hover:border-[var(--gym-ink,#111111)] hover:bg-[#F4F4F4]"
              >
                <Upload className="size-6 text-[#8c8c8c]" />
                <p className="mt-2 text-[13px] font-bold text-[var(--gym-ink,#111111)]">
                  {isAr ? "اضغط لاختيار صورة من جهازك" : "Click to select a photo"}
                </p>
                <p className="mt-0.5 text-[11px] text-[#8c8c8c]">
                  PNG, JPG, WEBP (Max 8MB)
                </p>
              </button>
            )}
          </div>

          {/* Caption / Notes */}
          <div>
            <label className="mb-1 block text-[12px] font-bold text-[var(--gym-ink,#111111)]">
              {isAr ? "ملاحظات أو تعليق" : "Caption or Notes (Optional)"}
            </label>
            <input
              type="text"
              placeholder={isAr ? "مثال: بعد انتهاء الأسبوع الرابع..." : "e.g. End of 4th week..."}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="h-11 w-full rounded-2xl bg-[#F4F4F4] px-3.5 text-[13px] font-medium text-[var(--gym-ink,#111111)] outline-none"
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
              disabled={saving || !previewUrl}
              className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--gym-ink,#111111)] px-6 text-[13px] font-bold text-white shadow-sm hover:opacity-90 disabled:opacity-50"
            >
              {saving ? (isAr ? "جاري الحفظ..." : "Saving...") : (isAr ? "حفظ الصورة" : "Save Photo")}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}
