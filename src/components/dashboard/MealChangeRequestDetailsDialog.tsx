import { useEffect, useId } from "react"
import { createPortal } from "react-dom"
import { Link } from "react-router-dom"
import {
  CalendarDays,
  Check,
  ClipboardList,
  Info,
  Utensils,
  X,
} from "lucide-react"
import { APP_ROUTES } from "@/config/constants"
import type { MealChangeRequest } from "@/features/nutrition/meal-change-requests"
import { useLocale } from "@/hooks/useLocale"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"

type MealChangeRequestDetailsDialogProps = {
  open: boolean
  request: MealChangeRequest | null
  busy?: boolean
  canManage?: boolean
  onClose: () => void
  onMarkReviewed?: () => void | Promise<void>
  onDismiss?: () => void | Promise<void>
  onOpenLogs?: () => void
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string
  value?: string | null
  mono?: boolean
}) {
  if (!value?.trim()) return null
  return (
    <div className="grid gap-0.5 sm:grid-cols-[140px_1fr] sm:gap-3">
      <dt className="text-[11px] font-bold uppercase tracking-wide text-[#8c8c8c]">
        {label}
      </dt>
      <dd
        className={cn(
          "text-[13px] font-semibold text-[var(--gym-ink,#111111)] break-words",
          mono && "font-mono text-[12px] font-medium text-[#525252]",
        )}
      >
        {value}
      </dd>
    </div>
  )
}

export function MealChangeRequestDetailsDialog({
  open,
  request,
  busy,
  canManage,
  onClose,
  onMarkReviewed,
  onDismiss,
  onOpenLogs,
}: MealChangeRequestDetailsDialogProps) {
  const { locale, isRtl } = useLocale()
  const isAr = locale === "ar"
  const titleId = useId()

  useEffect(() => {
    if (!open) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) onClose()
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open, busy, onClose])

  if (!open || !request || typeof document === "undefined") return null

  const isFullMeal = request.mealItemId.startsWith("meal:")
  const subscriberLabel =
    request.subscriberName ||
    request.subscriberEmail ||
    request.subscriberId

  return createPortal(
    <div
      className="fixed inset-0 z-[130] flex items-end justify-center bg-black/45 p-3 sm:items-center sm:p-6"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        dir={isRtl ? "rtl" : "ltr"}
        className="max-h-[min(92dvh,760px)] w-full max-w-[560px] overflow-y-auto rounded-[24px] bg-white p-5 shadow-xl sm:p-7"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-3 flex size-11 items-center justify-center rounded-2xl bg-[var(--gym-ink,#111111)] text-white">
              <ClipboardList className="size-5 text-[var(--gym-orange,#fb5001)]" />
            </div>
            <h2
              id={titleId}
              className="text-[18px] font-bold text-[var(--gym-ink,#111111)]"
            >
              {isAr ? "تفاصيل طلب التغيير" : "Change request details"}
            </h2>
            <p className="mt-1 text-[13px] font-medium leading-relaxed text-[#6B7280]">
              {isAr
                ? "كل ما أرسله المشترك عن الوجبة والسبب والملاحظات."
                : "Everything the subscriber sent about the meal, reason, and notes."}
            </p>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#F4F4F4] disabled:opacity-60"
            aria-label={isAr ? "إغلاق" : "Close"}
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-extrabold",
              isFullMeal
                ? "bg-orange-50 text-orange-800"
                : "bg-sky-50 text-sky-800",
            )}
          >
            <Utensils className="size-3.5" />
            {isFullMeal
              ? isAr
                ? "طلب استبدال وجبة كاملة"
                : "Full meal substitute request"
              : isAr
                ? "طلب تغيير صنف طعام"
                : "Food item change request"}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-900">
            <CalendarDays className="size-3.5" />
            {formatDate(request.createdAt, locale)}
          </span>
        </div>

        <div className="mt-5 space-y-4">
          <section className="rounded-2xl border border-black/[0.06] bg-[#FAFAFA] p-4">
            <h3 className="mb-3 flex items-center gap-1.5 text-[12px] font-extrabold uppercase tracking-wide text-[#8c8c8c]">
              <Info className="size-3.5" />
              {isAr ? "المشترك" : "Subscriber"}
            </h3>
            <dl className="space-y-2.5">
              <DetailRow
                label={isAr ? "الاسم" : "Name"}
                value={subscriberLabel}
              />
              <DetailRow
                label={isAr ? "البريد" : "Email"}
                value={request.subscriberEmail}
              />
              <DetailRow
                label={isAr ? "معرّف المشترك" : "Subscriber ID"}
                value={request.subscriberId}
                mono
              />
            </dl>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                to={APP_ROUTES.admin.subscriberDetail(request.subscriberId)}
                className="inline-flex h-9 items-center rounded-full border border-black/10 bg-white px-3.5 text-[12px] font-bold text-[#525252]"
              >
                {isAr ? "فتح الملف" : "Open profile"}
              </Link>
              {onOpenLogs ? (
                <button
                  type="button"
                  onClick={onOpenLogs}
                  className="inline-flex h-9 items-center rounded-full border border-black/10 bg-white px-3.5 text-[12px] font-bold text-[#525252]"
                >
                  {isAr ? "سجلات الالتزام" : "Adherence logs"}
                </button>
              ) : null}
            </div>
          </section>

          <section className="rounded-2xl border border-black/[0.06] bg-white p-4">
            <h3 className="mb-3 text-[12px] font-extrabold uppercase tracking-wide text-[#8c8c8c]">
              {isAr ? "الوجبة / الصنف" : "Meal / item"}
            </h3>
            <dl className="space-y-2.5">
              <DetailRow
                label={isAr ? "الوجبة" : "Meal slot"}
                value={request.mealSlotTitle}
              />
              <DetailRow
                label={
                  isFullMeal
                    ? isAr
                      ? "الوجبة المطلوبة"
                      : "Requested meal"
                    : isAr
                      ? "الصنف المطلوب تغييره"
                      : "Item to change"
                }
                value={request.mealItemName}
              />
              <DetailRow
                label={isAr ? "البديل المفضل" : "Preferred substitute"}
                value={request.substituteName}
              />
              <DetailRow
                label={isAr ? "اليوم في الخطة" : "Plan day"}
                value={request.dayLabel}
              />
              <DetailRow
                label={isAr ? "الخطة الغذائية" : "Nutrition plan"}
                value={request.programTitle}
              />
            </dl>
          </section>

          <section className="rounded-2xl border border-amber-200/80 bg-amber-50/60 p-4">
            <h3 className="mb-2 text-[12px] font-extrabold uppercase tracking-wide text-amber-900/70">
              {isAr ? "سبب الطلب" : "Reason"}
            </h3>
            <p className="text-[14px] font-bold text-amber-950">
              {request.reason}
            </p>
            {request.notes ? (
              <div className="mt-3 rounded-xl border border-amber-200/70 bg-white px-3 py-2.5">
                <p className="mb-1 text-[11px] font-extrabold uppercase tracking-wide text-[#8c8c8c]">
                  {isAr ? "ملاحظات المشترك" : "Subscriber notes"}
                </p>
                <p className="text-[13px] font-medium leading-relaxed text-[var(--gym-ink,#111111)] whitespace-pre-wrap">
                  {request.notes}
                </p>
              </div>
            ) : (
              <p className="mt-2 text-[12px] font-medium text-amber-900/60">
                {isAr ? "لا توجد ملاحظات إضافية." : "No extra notes provided."}
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-black/[0.06] bg-[#FAFAFA] p-4">
            <h3 className="mb-3 text-[12px] font-extrabold uppercase tracking-wide text-[#8c8c8c]">
              {isAr ? "مرجع تقني" : "Tracking refs"}
            </h3>
            <dl className="space-y-2.5">
              <DetailRow
                label={isAr ? "معرّف الطلب" : "Request ID"}
                value={request.id}
                mono
              />
              <DetailRow
                label={isAr ? "معرّف الخطة" : "Program ID"}
                value={request.programId}
                mono
              />
              <DetailRow
                label={isAr ? "معرّف اليوم" : "Day ID"}
                value={request.dayId}
                mono
              />
              <DetailRow
                label={isAr ? "معرّف الوجبة" : "Slot ID"}
                value={request.mealSlotId}
                mono
              />
              <DetailRow
                label={isAr ? "معرّف الصنف" : "Item ID"}
                value={request.mealItemId}
                mono
              />
            </dl>
          </section>
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {canManage && onMarkReviewed ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void onMarkReviewed()}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-[var(--gym-ink,#111111)] px-4 text-[13px] font-bold text-white disabled:opacity-55"
            >
              <Check className="size-4" />
              {isAr ? "تمت المراجعة" : "Mark reviewed"}
            </button>
          ) : null}
          {canManage && onDismiss ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void onDismiss()}
              className="inline-flex h-11 flex-1 items-center justify-center rounded-full border border-black/10 px-4 text-[13px] font-bold text-[#6B7280] disabled:opacity-55"
            >
              {isAr ? "تجاهل" : "Dismiss"}
            </button>
          ) : null}
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="inline-flex h-11 items-center justify-center rounded-full bg-[#F4F4F4] px-4 text-[13px] font-bold text-[var(--gym-ink,#111111)] disabled:opacity-55 sm:min-w-[110px]"
          >
            {isAr ? "إغلاق" : "Close"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
