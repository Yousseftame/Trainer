import { useState } from "react"
import { Check, Flame, RefreshCw, Send, Sparkles, Utensils, X } from "lucide-react"
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
  onRequestCoachChange?: (reason: string, notes: string) => void
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

  const [selectedAlternativeId, setSelectedAlternativeId] = useState<string | null>(null)
  const [selectedReason, setSelectedReason] = useState<string>(COMMON_REASONS[0].id)
  const [customNotes, setCustomNotes] = useState("")

  if (!isOpen || !mealItem) return null

  const itemName = resolveBilingualText(mealItem.name, locale)
  const itemQty = resolveBilingualText(mealItem.quantity, locale)
  const alternatives = mealItem.alternatives ?? []

  // Default selection to first alternative if available
  const activeAlternativeId = selectedAlternativeId ?? alternatives[0]?.id ?? null
  const selectedAlt = alternatives.find((a) => a.id === activeAlternativeId)

  function handleConfirmSwap() {
    const reasonObj = COMMON_REASONS.find((r) => r.id === selectedReason)
    const reasonText = reasonObj ? (isAr ? reasonObj.ar : reasonObj.en) : selectedReason
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
      onRequestCoachChange(reasonText, customNotes.trim())
      appToast.success(
        isAr
          ? "تم إرسال طلب استبدال الوجبة للمدرب وسيتم مراجعته!"
          : "Meal change request sent to coach successfully!",
      )
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
        className="w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] bg-white p-5 sm:p-6 shadow-2xl transition-transform animate-in slide-in-from-bottom sm:slide-in-from-bottom-4 duration-300 max-h-[92vh] overflow-y-auto flex flex-col gap-4 border border-black/[0.06]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-3 border-b border-black/[0.06]">
          <div>
            <h3 className="font-heading text-[20px] font-black text-[#111111]">
              {isAr ? "البدائل" : "Substitutes"}
            </h3>
            <p className="mt-0.5 text-[13px] font-medium text-[#8c8c8c]">
              {alternatives.length > 0
                ? isAr
                  ? `${alternatives.length} عناصر بديلة معتمدة`
                  : `${alternatives.length} approved alternatives`
                : isAr
                  ? "طلب تغيير وجبة من المدرب"
                  : "Request meal change from coach"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-full bg-black/5 text-[#666] hover:bg-black/10 hover:text-black transition"
            aria-label="Close"
          >
            <X className="size-4" strokeWidth={2.5} />
          </button>
        </div>

        {/* Current Item Callout */}
        <div className="flex items-center gap-3 rounded-2xl bg-neutral-50 p-3 border border-black/[0.05]">
          {mealItem.thumbnailUrl ? (
            <img
              src={mealItem.thumbnailUrl}
              alt={itemName}
              className="size-14 rounded-xl object-cover shrink-0 border border-black/10"
            />
          ) : (
            <div className="flex size-14 items-center justify-center rounded-xl bg-white text-[#fb5001] shrink-0 border border-black/10">
              <Utensils className="size-6" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#fb5001]">
              {mealSlotTitle || (isAr ? "الوجبة الحالية" : "Current Food")}
            </span>
            <h4 className="font-heading text-[14px] font-extrabold text-[#111111] truncate">
              {itemName}
            </h4>
            <div className="mt-0.5 flex items-center gap-2 text-[11px] font-bold text-[#8c8c8c]">
              {itemQty ? <span>{itemQty}</span> : null}
              {mealItem.calories ? <span>• {mealItem.calories} kcal</span> : null}
            </div>
          </div>
        </div>

        {/* Approved Alternatives List */}
        {alternatives.length > 0 ? (
          <div className="space-y-2.5">
            <span className="block text-[12px] font-bold uppercase tracking-wider text-[#8c8c8c]">
              {isAr ? "اختر البديل المناسب لك:" : "Select your preferred substitute:"}
            </span>

            <div className="space-y-2">
              {alternatives.map((alt) => {
                const altName = resolveBilingualText(alt.name, locale)
                const altQty = resolveBilingualText(alt.quantity, locale)
                const altReason = resolveBilingualText(alt.reason, locale)
                const isSelected = activeAlternativeId === alt.id

                return (
                  <button
                    key={alt.id}
                    type="button"
                    onClick={() => setSelectedAlternativeId(alt.id)}
                    className={cn(
                      "w-full text-start rounded-2xl p-3 sm:p-3.5 transition flex items-center gap-3 border select-none",
                      isSelected
                        ? "border-[#fb5001] bg-orange-50/30 ring-2 ring-[#fb5001]/20 shadow-xs"
                        : "border-black/[0.08] bg-white hover:bg-neutral-50/80",
                    )}
                  >
                    {/* Thumbnail */}
                    {alt.thumbnailUrl ? (
                      <img
                        src={alt.thumbnailUrl}
                        alt={altName}
                        className="size-16 rounded-xl object-cover shrink-0 border border-black/10 shadow-2xs"
                      />
                    ) : (
                      <div className="flex size-16 items-center justify-center rounded-xl bg-neutral-100 text-[#fb5001] shrink-0">
                        <Utensils className="size-6" />
                      </div>
                    )}

                    {/* Details */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <h5 className="font-heading text-[14px] font-extrabold text-[#111111]">
                          {altName}
                        </h5>
                        {isSelected ? (
                          <div className="flex size-5 items-center justify-center rounded-full bg-[#fb5001] text-white shrink-0">
                            <Check className="size-3" strokeWidth={3} />
                          </div>
                        ) : (
                          <div className="size-5 rounded-full border-2 border-black/20 shrink-0" />
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
                        {altQty ? (
                          <span className="rounded-md bg-black/5 px-2 py-0.5 text-[#111111]">
                            {altQty}
                          </span>
                        ) : null}
                        {alt.calories ? (
                          <span className="text-[#8c8c8c] flex items-center gap-0.5">
                            <Flame className="size-3 text-[#fb5001]" />
                            {alt.calories} kcal
                          </span>
                        ) : null}
                        {alt.protein ? (
                          <span className="text-blue-700">P:{alt.protein}g</span>
                        ) : null}
                        {alt.carbs ? (
                          <span className="text-amber-700">C:{alt.carbs}g</span>
                        ) : null}
                        {alt.fats ? (
                          <span className="text-purple-700">F:{alt.fats}g</span>
                        ) : null}
                      </div>

                      {altReason ? (
                        <p className="text-[11px] text-[#666] leading-tight line-clamp-1">
                          💡 {altReason}
                        </p>
                      ) : null}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-black/15 bg-neutral-50 p-4 text-center">
            <Sparkles className="size-7 mx-auto mb-1.5 text-[#fb5001]" />
            <p className="text-[13px] font-bold text-[#111111]">
              {isAr ? "طلب بديل خاص من الكوتش" : "Custom Coach Substitute"}
            </p>
            <p className="mt-1 text-[11px] text-[#8c8c8c]">
              {isAr
                ? "اكتب سببك أو البديل الذي ترغب في استخدامه وسيقوم المدرب بمطابقته لسعراتك."
                : "Describe your preferred substitute or reason and your coach will adjust your macros."}
            </p>
          </div>
        )}

        {/* Reason Section */}
        <div className="space-y-2 pt-2 border-t border-black/[0.06]">
          <label className="block text-[13px] font-extrabold text-[#111111]">
            {isAr ? "ما سببك لتغيير هذه الوجبة ؟" : "What is your reason for changing this food?"}
          </label>

          {/* Quick preset chips */}
          <div className="flex flex-wrap gap-1.5">
            {COMMON_REASONS.map((reason) => {
              const active = selectedReason === reason.id
              const label = isAr ? reason.ar : reason.en
              return (
                <button
                  key={reason.id}
                  type="button"
                  onClick={() => setSelectedReason(reason.id)}
                  className={cn(
                    "rounded-full px-3 py-1 text-[11px] font-bold transition select-none",
                    active
                      ? "bg-[#111111] text-white shadow-2xs"
                      : "bg-neutral-100 text-[#555] hover:bg-neutral-200/70",
                  )}
                >
                  {label}
                </button>
              )
            })}
          </div>

          {/* Notes textarea */}
          <div className="mt-2">
            <span className="block text-[11px] font-bold text-[#8c8c8c] mb-1">
              {isAr ? "السبب / ملاحظات إضافية:" : "Reason / Additional Notes:"}
            </span>
            <textarea
              rows={2}
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder={isAr ? "أضف ملاحظاتك هنا..." : "Add your notes here..."}
              className="w-full rounded-xl border border-black/10 bg-neutral-50/60 p-3 text-[12px] font-medium text-[#111111] placeholder:text-[#999] focus:bg-white focus:border-[#fb5001] focus:outline-hidden transition"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-12 flex-1 items-center justify-center rounded-2xl bg-neutral-100 text-[13px] font-bold text-[#555] hover:bg-neutral-200 transition"
          >
            {isAr ? "إلغاء" : "Cancel"}
          </button>

          <button
            type="button"
            onClick={handleConfirmSwap}
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#fb5001] px-5 text-[13px] font-extrabold text-white shadow-md shadow-orange-500/20 hover:bg-[#e04800] transition active:scale-[0.98]"
          >
            {selectedAlt ? (
              <>
                <RefreshCw className="size-4" />
                <span>{isAr ? "تبديل العنصر الآن" : "Swap Item Now"}</span>
              </>
            ) : (
              <>
                <Send className="size-4" />
                <span>{isAr ? "إرسال طلب للمدرب" : "Send Coach Request"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

