import { useEffect, useState } from "react"
import { RefreshCw, Send, Utensils, X } from "lucide-react"
import { useLocale } from "@/hooks/useLocale"
import { resolveBilingualText } from "@/lib/program-text"
import { cn } from "@/lib/utils"
import type { MealItem, MealSlot } from "@/types/program"

const COMMON_REASONS = [
  { id: "unavailable", ar: "مكونات غير متوفرة", en: "Ingredients unavailable" },
  { id: "allergy", ar: "حساسية أو مشكلة هضمية", en: "Allergy or digestion" },
  { id: "taste", ar: "تفضيل طعم ورغبة شخصية", en: "Taste preference" },
  { id: "portion", ar: "حجم الحصة غير مناسب", en: "Portion size not suitable" },
  { id: "variety", ar: "تغيير روتين وتجديد", en: "Variety & routine change" },
  { id: "other", ar: "سبب آخر", en: "Other reason" },
]

type MealSlotSubstituteModalProps = {
  isOpen: boolean
  onClose: () => void
  slot: MealSlot | null
  slotTitle: string
  onPickItem: (item: MealItem) => void
  onRequestCoachChange: (reason: string, notes: string) => void | Promise<void>
}

export function MealSlotSubstituteModal({
  isOpen,
  onClose,
  slot,
  slotTitle,
  onPickItem,
  onRequestCoachChange,
}: MealSlotSubstituteModalProps) {
  const { locale } = useLocale()
  const isAr = locale === "ar"

  const [selectedReason, setSelectedReason] = useState(COMMON_REASONS[0].id)
  const [customNotes, setCustomNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setSelectedReason(COMMON_REASONS[0].id)
    setCustomNotes("")
    setIsSubmitting(false)
  }, [isOpen, slot?.id])

  if (!isOpen || !slot) return null

  const items = slot.items ?? []

  async function handleSubmit() {
    const reasonObj = COMMON_REASONS.find((r) => r.id === selectedReason)
    const reasonText = reasonObj
      ? isAr
        ? reasonObj.ar
        : reasonObj.en
      : selectedReason

    setIsSubmitting(true)
    try {
      await onRequestCoachChange(reasonText, customNotes.trim())
      onClose()
    } catch {
      // Parent toasts error
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-lg rounded-t-[28px] sm:rounded-[28px] bg-white p-5 sm:p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[92vh] overflow-y-auto flex flex-col gap-4 border border-black/[0.06]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between pb-3 border-b border-black/[0.06]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--gym-ink,#111111)]/5 text-[var(--gym-orange,#fb5001)]">
              <RefreshCw className="size-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-heading text-[17px] font-extrabold text-[#111111]">
                {isAr ? "استبدال هذه الوجبة؟" : "Substitute this meal?"}
              </h3>
              <p className="mt-0.5 text-[12px] font-medium text-[#8c8c8c] truncate">
                {slotTitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-full bg-black/5 text-[#666] hover:bg-black/10"
          >
            <X className="size-4" strokeWidth={2.5} />
          </button>
        </div>

        {items.length > 0 ? (
          <div className="space-y-2">
            <p className="text-[12px] font-extrabold text-[#111111]">
              {isAr
                ? "استبدل صنفاً محدداً (بدائل معتمدة أو طلب للمدرب)"
                : "Swap a specific item (approved alts or coach request)"}
            </p>
            <div className="grid gap-2">
              {items.map((item) => {
                const name = resolveBilingualText(item.name, locale)
                const qty = resolveBilingualText(item.quantity, locale)
                const altCount = item.alternatives?.length ?? 0
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onPickItem(item)
                      onClose()
                    }}
                    className="flex items-center gap-3 rounded-2xl border border-black/[0.07] bg-[#FAFAFA] px-3.5 py-3 text-start hover:border-[var(--gym-orange,#fb5001)]/40 transition"
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-black/10 bg-white text-[var(--gym-orange,#fb5001)]">
                      {item.thumbnailUrl ? (
                        <img
                          src={item.thumbnailUrl}
                          alt=""
                          className="size-full object-cover"
                        />
                      ) : (
                        <Utensils className="size-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-bold truncate">{name}</p>
                      <p className="text-[11px] text-[#8c8c8c]">
                        {qty ? `${qty} · ` : ""}
                        {altCount > 0
                          ? isAr
                            ? `${altCount} بدائل`
                            : `${altCount} alts`
                          : isAr
                            ? "طلب للمدرب"
                            : "Coach request"}
                      </p>
                    </div>
                    <RefreshCw className="size-3.5 shrink-0 text-[var(--gym-orange,#fb5001)]" />
                  </button>
                )
              })}
            </div>
          </div>
        ) : null}

        <div className="space-y-2">
          <p className="text-[12px] font-extrabold text-[#111111]">
            {isAr
              ? "أو اطلب استبدال الوجبة كاملة من المدرب"
              : "Or request a full meal substitute from your coach"}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {COMMON_REASONS.map((reason) => {
              const active = selectedReason === reason.id
              return (
                <button
                  key={reason.id}
                  type="button"
                  onClick={() => setSelectedReason(reason.id)}
                  className={cn(
                    "rounded-2xl border px-3 py-2.5 text-start text-[12px] font-bold transition",
                    active
                      ? "border-[var(--gym-orange,#fb5001)] bg-[var(--gym-orange,#fb5001)]/[0.06] text-[var(--gym-orange,#fb5001)]"
                      : "border-black/[0.07] bg-[#FAFAFA] text-[#555]",
                  )}
                >
                  {isAr ? reason.ar : reason.en}
                </button>
              )
            })}
          </div>
        </div>

        <textarea
          rows={3}
          value={customNotes}
          onChange={(e) => setCustomNotes(e.target.value)}
          placeholder={
            isAr
              ? "صف البديل المطلوب أو أي تفاصيل للمدرب…"
              : "Describe the substitute you need or any notes for your coach…"
          }
          className="w-full resize-none rounded-2xl border border-black/[0.08] bg-[#F7F7F7] px-3.5 py-3 text-[13px] focus:border-[var(--gym-orange,#fb5001)] focus:bg-white focus:outline-none"
        />

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => void handleSubmit()}
            className="flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[var(--gym-orange,#fb5001)] px-5 text-[14px] font-extrabold text-white disabled:opacity-60"
          >
            <Send className="size-4" />
            {isSubmitting
              ? isAr
                ? "جاري الإرسال…"
                : "Sending…"
              : isAr
                ? "إرسال طلب الوجبة للمدرب"
                : "Send meal request to coach"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 items-center justify-center rounded-full border border-black/10 px-5 text-[13px] font-bold text-[#6B7280]"
          >
            {isAr ? "إلغاء" : "Cancel"}
          </button>
        </div>
      </div>
    </div>
  )
}
