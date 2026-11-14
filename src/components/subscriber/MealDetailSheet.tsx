import {
  Camera,
  Check,
  ChevronRight,
  RefreshCw,
  Scale,
  Utensils,
  X,
} from "lucide-react"
import { useLocale } from "@/hooks/useLocale"
import { resolveBilingualText } from "@/lib/program-text"
import { cn } from "@/lib/utils"
import type { MealItem, MealSlot } from "@/types/program"

type MealDetailSheetProps = {
  isOpen: boolean
  slot: MealSlot | null
  slotTitle: string
  isCompleted: boolean
  photoUrl?: string
  photoNote?: string
  swappedItemIds?: Set<string>
  onClose: () => void
  onToggleCompleted: () => void
  onAddPhoto: () => void
  onSubstituteMeal?: () => void
  onSwapItem: (item: MealItem) => void
  onRevertItem?: (itemId: string) => void
}

export function MealDetailSheet({
  isOpen,
  slot,
  slotTitle,
  isCompleted,
  photoUrl,
  photoNote,
  swappedItemIds,
  onClose,
  onToggleCompleted,
  onAddPhoto,
  onSubstituteMeal,
  onSwapItem,
  onRevertItem,
}: MealDetailSheetProps) {
  const { locale } = useLocale()
  const isAr = locale === "ar"

  if (!isOpen || !slot) return null

  const slotCalories = slot.calories ?? 0
  const coachingNote =
    typeof slot.coachingNote === "object"
      ? resolveBilingualText(slot.coachingNote, locale)
      : slot.coachingNote

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="meal-detail-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className="flex w-full max-w-lg max-h-[92vh] flex-col rounded-t-[28px] sm:rounded-[28px] bg-white text-[var(--gym-ink,#111111)] shadow-2xl animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-black/[0.06] px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-3 sm:px-6 sm:pt-5">
          <div className="min-w-0">
            <p
              id="meal-detail-title"
              className="font-heading text-[18px] font-extrabold tracking-tight"
            >
              {slotTitle}
            </p>
            <p className="mt-0.5 text-[12px] font-medium text-[#8c8c8c]">
              {slot.items.length} {isAr ? "عناصر" : "items"}
              {slotCalories > 0
                ? ` · ${slotCalories} ${isAr ? "سعرة" : "kcal"}`
                : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-black/5 text-[#6B7280] hover:bg-black/10"
            aria-label={isAr ? "إغلاق" : "Close"}
          >
            <X className="size-4" strokeWidth={2.25} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6 space-y-4">
          {isCompleted ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-extrabold text-emerald-700">
              <Check className="size-3.5" strokeWidth={2.5} />
              {isAr ? "تم تسجيل هذه الوجبة" : "Marked as eaten"}
            </span>
          ) : null}

          {coachingNote ? (
            <div className="rounded-2xl border border-amber-200/80 bg-amber-50/80 p-3.5 text-[13px] leading-relaxed text-amber-950">
              <span className="mb-1 block text-[11px] font-extrabold uppercase tracking-wider text-amber-800/80">
                {isAr ? "ملاحظة المدرب" : "Coach note"}
              </span>
              {coachingNote}
            </div>
          ) : null}

          {photoUrl ? (
            <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-[#F7F7F7]">
              <img
                src={photoUrl}
                alt={slotTitle}
                className="max-h-48 w-full object-cover"
              />
              {photoNote ? (
                <p className="px-3 py-2 text-[12px] text-[#6B7280]">{photoNote}</p>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-2.5">
            <h4 className="font-heading text-[13px] font-extrabold text-[var(--gym-ink,#111111)]">
              {isAr ? "محتويات الوجبة" : "Meal contents"}
            </h4>
            {slot.items.map((item) => {
              const name = resolveBilingualText(item.name, locale)
              const qty = resolveBilingualText(item.quantity, locale)
              const notes = resolveBilingualText(item.notes, locale)
              const swapped = swappedItemIds?.has(item.id)
              const altCount = item.alternatives?.length ?? 0

              return (
                <div
                  key={item.id}
                  className={cn(
                    "rounded-2xl border p-3.5",
                    swapped
                      ? "border-[var(--gym-orange,#fb5001)]/30 bg-[var(--gym-orange,#fb5001)]/[0.04]"
                      : "border-black/[0.06] bg-[#FAFAFA]",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-xl border border-black/10 bg-white">
                      {item.thumbnailUrl ? (
                        <img
                          src={item.thumbnailUrl}
                          alt={name}
                          className="size-full object-cover"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center text-[var(--gym-orange,#fb5001)]">
                          <Utensils className="size-5" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="font-heading text-[14px] font-extrabold leading-tight">
                          {name}
                        </p>
                        {swapped ? (
                          <span className="rounded-full bg-[var(--gym-orange,#fb5001)]/10 px-2 py-0.5 text-[10px] font-bold text-[var(--gym-orange,#fb5001)]">
                            {isAr ? "بديل" : "Sub"}
                          </span>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-[#6B7280]">
                        {qty ? (
                          <span className="inline-flex items-center gap-1">
                            <Scale className="size-3" />
                            {qty}
                          </span>
                        ) : null}
                        {item.calories ? (
                          <span>{item.calories} kcal</span>
                        ) : null}
                        {altCount > 0 ? (
                          <span>
                            {isAr ? `${altCount} بدائل` : `${altCount} alts`}
                          </span>
                        ) : null}
                      </div>
                      {(item.protein || item.carbs || item.fats) && (
                        <p className="text-[10px] font-extrabold text-[#8c8c8c]">
                          {item.protein ? `P ${item.protein}g ` : ""}
                          {item.carbs ? `C ${item.carbs}g ` : ""}
                          {item.fats ? `F ${item.fats}g` : ""}
                        </p>
                      )}
                      {notes ? (
                        <p className="text-[11px] italic text-[#8c8c8c]">{notes}</p>
                      ) : null}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => onSwapItem(item)}
                          className="inline-flex h-8 items-center gap-1.5 rounded-full bg-black/5 px-3 text-[11px] font-bold text-[var(--gym-ink,#111111)] hover:bg-[var(--gym-orange,#fb5001)] hover:text-white transition"
                        >
                          <RefreshCw className="size-3.5" />
                          {altCount > 0
                            ? isAr
                              ? "استبدال"
                              : "Substitute"
                            : isAr
                              ? "طلب تغيير"
                              : "Request change"}
                        </button>
                        {swapped && onRevertItem ? (
                          <button
                            type="button"
                            onClick={() => onRevertItem(item.id)}
                            className="text-[11px] font-bold text-[#8c8c8c] underline"
                          >
                            {isAr ? "استعادة الأصلي" : "Restore original"}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="shrink-0 space-y-2 border-t border-black/[0.06] bg-white px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-5">
          {onSubstituteMeal ? (
            <button
              type="button"
              onClick={onSubstituteMeal}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-black/10 bg-neutral-50 text-[12px] font-extrabold text-[var(--gym-ink,#111111)] hover:border-[var(--gym-orange,#fb5001)] hover:text-[var(--gym-orange,#fb5001)] transition"
            >
              <RefreshCw className="size-4" />
              {isAr ? "استبدال هذه الوجبة" : "Substitute this meal"}
            </button>
          ) : null}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onAddPhoto}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border-2 border-dashed border-black/15 text-[12px] font-extrabold text-[var(--gym-ink,#111111)] hover:border-[var(--gym-orange,#fb5001)] hover:text-[var(--gym-orange,#fb5001)] transition"
            >
              <Camera className="size-4" />
              {photoUrl
                ? isAr
                  ? "تغيير الصورة"
                  : "Change photo"
                : isAr
                  ? "إضافة صورة"
                  : "Add photo"}
            </button>
            <button
              type="button"
              onClick={onToggleCompleted}
              className={cn(
                "inline-flex h-11 items-center justify-center gap-2 rounded-full text-[12px] font-extrabold transition",
                isCompleted
                  ? "bg-emerald-600 text-white"
                  : "bg-[var(--gym-orange,#fb5001)] text-white",
              )}
            >
              <Check className="size-4" strokeWidth={2.5} />
              {isCompleted
                ? isAr
                  ? "تم الأكل"
                  : "Eaten"
                : isAr
                  ? "تحديد كمنجزة"
                  : "Mark eaten"}
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-full items-center justify-center gap-1 text-[13px] font-bold text-[#8c8c8c] hover:text-[#525252]"
          >
            {isAr ? "إغلاق" : "Close"}
            <ChevronRight className="size-3.5 opacity-50 rtl:rotate-180" />
          </button>
        </div>
      </div>
    </div>
  )
}
