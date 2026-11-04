import { useRef, useState } from "react"
import { Camera, Check, Image as ImageIcon, Trash2, UploadCloud, X } from "lucide-react"
import { useLocale } from "@/hooks/useLocale"
import { appToast } from "@/lib/toast"

interface MealPhotoUploadDialogProps {
  isOpen: boolean
  onClose: () => void
  slotId: string
  slotTitle?: string
  existingPhotoUrl?: string
  onPhotoUploaded: (slotId: string, photoUrl: string, note?: string) => void
}

export function MealPhotoUploadDialog({
  isOpen,
  onClose,
  slotId,
  slotTitle,
  existingPhotoUrl,
  onPhotoUploaded,
}: MealPhotoUploadDialogProps) {
  const { locale } = useLocale()
  const isAr = locale === "ar"

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(existingPhotoUrl ?? null)
  const [note, setNote] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      appToast.error(isAr ? "يرجى اختيار ملف صورة صالح" : "Please select a valid image file")
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setPhotoPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  function handleRemovePhoto() {
    setPhotoPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  function handleSubmit() {
    if (!photoPreview) {
      appToast.error(isAr ? "يرجى التقاط أو اختيار صورة الوجبة أولاً" : "Please take or upload a meal photo first")
      return
    }

    setIsSubmitting(true)
    setTimeout(() => {
      onPhotoUploaded(slotId, photoPreview, note.trim())
      setIsSubmitting(false)
      appToast.success(
        isAr ? "تم إرفاق صورة الوجبة وإرسالها للمدرب بنجاح!" : "Meal verification photo uploaded successfully!",
      )
      onClose()
    }, 400)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-md rounded-t-[32px] sm:rounded-[32px] bg-white p-5 sm:p-6 shadow-2xl transition-transform animate-in slide-in-from-bottom sm:slide-in-from-bottom-4 duration-300 max-h-[90vh] overflow-y-auto flex flex-col gap-4 border border-black/[0.06]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#fb5001]/10 text-[#fb5001]">
              <Camera className="size-5" />
            </div>
            <div>
              <h3 className="font-heading text-[18px] font-black text-[#111111]">
                {isAr ? "إرفاق صورة الوجبة" : "Attach Meal Photo"}
              </h3>
              <p className="text-[12px] font-medium text-[#8c8c8c]">
                {slotTitle || (isAr ? "توثيق التزام الوجبة" : "Meal adherence verification")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full bg-black/5 text-gray-500 hover:bg-black/10 transition"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Photo Uploader / Preview Box */}
        {photoPreview ? (
          <div className="relative overflow-hidden rounded-2xl border border-black/10 bg-black/5">
            <img
              src={photoPreview}
              alt="Meal Preview"
              className="w-full h-56 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end justify-between p-3">
              <span className="rounded-full bg-black/60 backdrop-blur-xs px-2.5 py-1 text-[11px] font-bold text-white flex items-center gap-1.5">
                <Check className="size-3 text-[#fb5001]" />
                {isAr ? "تم التقاط الصورة" : "Photo Selected"}
              </span>
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="flex size-8 items-center justify-center rounded-full bg-white/90 text-red-600 hover:bg-white shadow-xs transition"
                title={isAr ? "حذف الصورة" : "Delete photo"}
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-black/15 bg-neutral-50 p-6 text-center cursor-pointer hover:border-[#fb5001] hover:bg-orange-50/20 transition group select-none"
          >
            <div className="flex size-12 items-center justify-center rounded-full bg-white shadow-xs group-hover:scale-105 transition text-[#fb5001]">
              <UploadCloud className="size-6" />
            </div>
            <div>
              <p className="font-heading text-[14px] font-extrabold text-[#111111]">
                {isAr ? "التقط صورة للوجبة أو اختر من جهازك" : "Take a meal photo or upload from device"}
              </p>
              <p className="mt-1 text-[11px] text-[#8c8c8c]">
                {isAr ? "يساعد المدرب على تقييم الكميات وجودة التحضير" : "Helps coach evaluate portion sizes and food quality"}
              </p>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[11px] font-bold text-[#111111] border border-black/10 shadow-2xs">
                <Camera className="size-3.5 text-[#fb5001]" />
                {isAr ? "فتح الكاميرا" : "Camera"}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[11px] font-bold text-[#111111] border border-black/10 shadow-2xs">
                <ImageIcon className="size-3.5 text-[#fb5001]" />
                {isAr ? "معرض الصور" : "Gallery"}
              </span>
            </div>
          </div>
        )}

        {/* Optional Notes */}
        <div className="space-y-1.5">
          <label className="block text-[12px] font-bold text-[#111111]">
            {isAr ? "ملاحظة للمدرب (اختياري):" : "Note for coach (optional):"}
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={
              isAr
                ? "مثال: تم تناول الوجبة كاملة بنفس المقادير المحددة"
                : "e.g., Finished full meal with exact portion weights"
            }
            className="w-full rounded-xl border border-black/10 bg-neutral-50/70 px-3.5 py-2.5 text-[12px] font-medium text-[#111111] placeholder:text-[#999] focus:bg-white focus:border-[#fb5001] focus:outline-hidden transition"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 flex-1 items-center justify-center rounded-2xl bg-neutral-100 text-[13px] font-bold text-[#555] hover:bg-neutral-200 transition"
          >
            {isAr ? "إلغاء" : "Cancel"}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !photoPreview}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#fb5001] px-4 text-[13px] font-extrabold text-white shadow-md shadow-orange-500/20 hover:bg-[#e04800] transition disabled:opacity-50"
          >
            <Check className="size-4" strokeWidth={2.5} />
            <span>
              {isSubmitting
                ? isAr
                  ? "جاري الحفظ..."
                  : "Saving..."
                : isAr
                  ? "تأكيد وتوثيق الوجبة"
                  : "Verify Meal"}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}

