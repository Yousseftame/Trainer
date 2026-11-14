import { useEffect, useState } from "react"
import { Check, RefreshCw, Send, Utensils, X } from "lucide-react"
import { resolveBilingualText } from "@/lib/program-text"
import { useLocale } from "@/hooks/useLocale"
import { appToast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import type { MealAlternative, MealItem } from "@/types/program"

interface MealChangeModalProps {
  isOpen: boolean
  onClose: () => void
  mealItem: MealItem | null
  mealSlotTitle?: string
  onSwapItem?: (substitute: MealAlternative, reason: string) => void
  onRequestCoachChange?: (reason: string, notes: string) => void | Promise<void>
}

const COMMON_REASONS = [
  { id: "unavailable", ar: "غير متوفر بالمنزل", en: "Not available at home" },
  { id: "allergy", ar: "حساسية أو مشكلة هضمية", en: "Allergy or digestion" },
  { id: "taste", ar: "تفضيل طعم ورغبة شخصية", en: "Taste preference" },
  { id: "variety", ar: "تغيير روتين وتجديد", en: "Variety & routine change" },
  { id: "other", ar: "سبب آخر", en: "Other reason" },
]

export function MealChangeModal({
  isOpen,
  onClose,
  mealItem,
  mealSlotTitle,
  onSwapItem,
  onRequestCoachChange,
}: MealChangeModalProps) {
  const { locale } = useLocale()
  const isAr = locale === "ar"

  const [selectedAlternativeId, setSelectedAlternativeId] = useState<
    string | null
  >(null)
  const [selectedReason, setSelectedReason] = useState<string>(
    COMMON_REASONS[0].id,
  )
  const [customNotes, setCustomNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setSelectedAlternativeId(null)
    setSelectedReason(COMMON_REASONS[0].id)
    setCustomNotes("")
    setIsSubmitting(false)
  }, [isOpen, mealItem?.id])

  if (!isOpen || !mealItem) return null

  const itemName = resolveBilingualText(mealItem.name, locale)
  const itemQty = resolveBilingualText(mealItem.quantity, locale)
  const alternatives = mealItem.alternatives ?? []

  const activeAlternativeId =
    selectedAlternativeId ?? alternatives[0]?.id ?? null
  const selectedAlt = alternatives.find((a) => a.id === activeAlternativeId)
  const requestingCoach = !selectedAlt || !onSwapItem

  async function handleConfirmSwap() {
    const reasonObj = COMMON_REASONS.find((r) => r.id === selectedReason)
    const reasonText = reasonObj
      ? isAr
        ? reasonObj.ar
        : reasonObj.en
      : selectedReason
    const fullReason = customNotes.trim()
      ? `${reasonText} (${customNotes.trim()})`
      : reasonText

    if (selectedAlt && onSwapItem) {
      onSwapItem(selectedAlt, fullReason)
      appToast.success(
        isAr
          ? `تم استبدال "${itemName}" بـ "${resolveBilingualText(selectedAlt.name, locale)}" بنجاح!`
          : `Swapped "${itemName}" with "${resolveBilingualText(selectedAlt.name, locale)}" successfully!`,
      )
      onClose()
      return
    }

    if (onRequestCoachChange) {
      setIsSubmitting(true)
      try {
        await onRequestCoachChange(reasonText, customNotes.trim())
        onClose()
      } catch {
        // Parent toasts error
      } finally {
        setIsSubmitting(false)
      }
      return
    }

    appToast.success(isAr ? "تم حفظ الملاحظات" : "Notes saved")
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-lg rounded-t-[28px] sm:rounded-[28px] bg-white p-5 sm:p-6 shadow-2xl transition-transform animate-in slide-in-from-bottom duration-300 max-h-[92vh] overflow-y-auto flex flex-col gap-4 border border-black/[0.06]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between pb-3 border-b border-black/[0.06]">
          <div>
            <h3 className="font-heading text-[18px] font-extrabold text-[#111111]">
              {requestingCoach
                ? isAr
                  ? "طلب تغيير من المدرب"
                  : "Request coach change"
                : isAr
                  ? "البدائل"
                  : "Substitutes"}
            </h3>
            <p className="mt-0.5 text-[13px] font-medium text-[#8c8c8c]">
              {mealSlotTitle ? `${mealSlotTitle} · ` : ""}
              {alternatives.length > 0
                ? isAr
                  ? `${alternatives.length} بدائل معتمدة`
                  : `${alternatives.length} approved alternatives`
                : isAr
                  ? "لا يوجد بديل معتمد — أرسل طلباً للمدرب"
                  : "No approved alt — send a coach request"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-full bg-black/5 text-[#666] hover:bg-black/10"
          >
            <X className="size-4" strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex items-center gap-3 rounded-2xl bg-neutral-50 p-3 border border-black/[0.05]">
          {mealItem.thumbnailUrl ? (
            <img
              src={mealItem.thumbnailUrl}
              alt={itemName}
              className="size-12 rounded-xl object-cover border border-black/10"
            />
          ) : (
            <div className="flex size-12 items-center justify-center rounded-xl bg-white border border-black/10 text-[var(--gym-orange,#fb5001)]">
              <Utensils className="size-5" />
            </div>
          )}
          <div className="min-w-0">
            <p className="font-heading text-[14px] font-extrabold truncate">
              {itemName}
            </p>
            {itemQty ? (
              <p className="text-[12px] font-medium text-[#8c8c8c]">{itemQty}</p>
            ) : null}
          </div>
        </div>

        {alternatives.length > 0 ? (
          <div className="space-y-2">
            <p className="text-[12px] font-extrabold text-[#111111]">
              {isAr ? "اختر بديلاً معتمداً" : "Pick an approved alternative"}
            </p>
            <div className="grid gap-2">
              {alternatives.map((alt) => {
                const active = activeAlternativeId === alt.id
                const name = resolveBilingualText(alt.name, locale)
                const qty = resolveBilingualText(alt.quantity, locale)
                return (
                  <button
                    key={alt.id}
                    type="button"
                    onClick={() => setSelectedAlternativeId(alt.id)}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-2xl border px-3.5 py-3 text-start transition",
                      active
                        ? "border-[var(--gym-orange,#fb5001)] bg-[var(--gym-orange,#fb5001)]/[0.06]"
                        : "border-black/[0.07] bg-white hover:border-black/15",
                    )}
                  >
                    <div className="min-w-0">
                      <p className="text-[13px] font-bold truncate">{name}</p>
                      {qty ? (
                        <p className="text-[11px] text-[#8c8c8c]">{qty}</p>
                      ) : null}
                    </div>
                    {active ? (
                      <Check className="size-4 shrink-0 text-[var(--gym-orange,#fb5001)]" />
                    ) : null}
                  </button>
                )
              })}
            </div>
          </div>
        ) : null}

        <div className="space-y-2">
          <p className="text-[12px] font-extrabold text-[#111111]">
            {isAr ? "ما السبب؟" : "What is the reason?"}
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
            isAr ? "أضف ملاحظاتك هنا…" : "Add your notes here…"
          }
          className="w-full resize-none rounded-2xl border border-black/[0.08] bg-[#F7F7F7] px-3.5 py-3 text-[13px] focus:border-[var(--gym-orange,#fb5001)] focus:bg-white focus:outline-none"
        />

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => void handleConfirmSwap()}
            className="flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[var(--gym-orange,#fb5001)] px-5 text-[14px] font-extrabold text-white disabled:opacity-60"
          >
            {isSubmitting ? (
              isAr ? (
                "جاري الإرسال…"
              ) : (
                "Sending…"
              )
            ) : selectedAlt && onSwapItem ? (
              <>
                <RefreshCw className="size-4" />
                {isAr ? "استبدال بهذا البديل" : "Substitute with this"}
              </>
            ) : (
              <>
                <Send className="size-4" />
                {isAr ? "حفظ وإرسال للمدرب" : "Save & request change"}
              </>
            )}
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
